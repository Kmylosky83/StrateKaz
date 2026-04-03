"""
Signal handlers para FirmaDigital - Notificaciones automaticas

Cuando cambia el estado de una FirmaDigital, se crean Notificaciones
automaticas usando el NotificationService existente.

Eventos:
- created + PENDIENTE: Notificar al firmante que tiene una firma pendiente
- FIRMADO: Notificar al creador que alguien firmo + siguiente firmante
- RECHAZADO: Notificar al creador que fue rechazada
- DELEGADO: Notificar via la nueva firma PENDIENTE creada
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='firma_digital.FirmaDigital')
def firma_post_save(sender, instance, created, **kwargs):
    """
    Signal handler para FirmaDigital post_save.

    Usa sender como string lazy para evitar import circular.
    """
    try:
        if created and instance.estado == 'PENDIENTE':
            _notificar_firma_pendiente(instance)

        elif not created:
            # update_fields puede venir en kwargs
            update_fields = kwargs.get('update_fields')

            if instance.estado == 'FIRMADO':
                _notificar_firma_completada(instance)
                _verificar_todas_completas(instance)

            elif instance.estado == 'RECHAZADO':
                _notificar_firma_rechazada(instance)

            elif instance.estado == 'DELEGADO':
                _notificar_firma_delegada(instance)

    except Exception as e:
        # Nunca bloquear la operacion principal por fallo en notificacion
        logger.error(f"Error en firma_post_save signal: {e}", exc_info=True)


def _get_notification_service():
    """Import lazy del NotificationService para evitar circular imports."""
    from apps.audit_system.centro_notificaciones.services import NotificationService
    return NotificationService


def _get_documento_titulo(firma):
    """Obtiene el titulo del documento firmado via GenericFK."""
    try:
        documento = firma.content_type.get_object_for_this_type(pk=firma.object_id)
        return (
            getattr(documento, 'titulo', None)
            or getattr(documento, 'title', None)
            or getattr(documento, 'nombre', None)
            or getattr(documento, 'name', None)
            or str(documento)
        )
    except Exception:
        return f"Documento #{firma.object_id}"


def _get_documento_creador(firma):
    """Obtiene el usuario creador del documento via GenericFK."""
    try:
        documento = firma.content_type.get_object_for_this_type(pk=firma.object_id)
        return (
            getattr(documento, 'created_by', None)
            or getattr(documento, 'creado_por', None)
            or getattr(documento, 'usuario', None)
        )
    except Exception:
        return None


def _notificar_firma_pendiente(firma):
    """Notifica al firmante que tiene una firma pendiente."""
    service = _get_notification_service()
    doc_titulo = _get_documento_titulo(firma)
    rol_display = firma.get_rol_firma_display()

    service.send_notification(
        tipo_codigo='FIRMA_PENDIENTE',
        usuario=firma.usuario,
        titulo=f'Firma pendiente: {doc_titulo}',
        mensaje=f'Tienes una firma ({rol_display}) pendiente para el documento "{doc_titulo}".',
        url='/gestion-documental/documentos?section=en_proceso',
        prioridad='alta',
        datos_extra={
            'documento_titulo': doc_titulo,
            'rol_firma': rol_display,
            'firma_id': firma.id,
            'content_type_id': firma.content_type_id,
            'object_id': str(firma.object_id),
        },
    )
    logger.info(f"Notificacion FIRMA_PENDIENTE enviada a {firma.usuario} para '{doc_titulo}'")


def _notificar_firma_completada(firma):
    """Notifica al creador del documento que alguien firmo."""
    creador = _get_documento_creador(firma)
    if not creador or creador == firma.usuario:
        return

    service = _get_notification_service()
    doc_titulo = _get_documento_titulo(firma)
    firmante_nombre = firma.usuario.get_full_name() or firma.usuario.email
    rol_display = firma.get_rol_firma_display()

    service.send_notification(
        tipo_codigo='FIRMA_COMPLETADA',
        usuario=creador,
        titulo=f'Firma completada: {doc_titulo}',
        mensaje=f'{firmante_nombre} ha firmado ({rol_display}) el documento "{doc_titulo}".',
        url='/gestion-documental/documentos?section=en_proceso',
        prioridad='normal',
        datos_extra={
            'documento_titulo': doc_titulo,
            'firmante_nombre': firmante_nombre,
            'rol_firma': rol_display,
            'firma_id': firma.id,
        },
    )
    logger.info(f"Notificacion FIRMA_COMPLETADA enviada a {creador} por firma de {firmante_nombre}")


def _verificar_todas_completas(firma):
    """
    Si todas las firmas del documento estan completadas,
    notifica al creador que el documento fue aprobado.
    """
    from apps.workflow_engine.firma_digital.models import FirmaDigital

    pendientes = FirmaDigital.objects.filter(
        content_type=firma.content_type,
        object_id=firma.object_id,
        estado='PENDIENTE',
    ).count()

    if pendientes > 0:
        return

    # Todas completas — verificar que haya al menos 1 firmada
    firmadas = FirmaDigital.objects.filter(
        content_type=firma.content_type,
        object_id=firma.object_id,
        estado='FIRMADO',
    ).count()

    if firmadas == 0:
        return

    creador = _get_documento_creador(firma)
    if not creador:
        return

    service = _get_notification_service()
    doc_titulo = _get_documento_titulo(firma)

    service.send_notification(
        tipo_codigo='DOCUMENTO_TODAS_FIRMAS',
        usuario=creador,
        titulo=f'Documento aprobado: {doc_titulo}',
        mensaje=f'El documento "{doc_titulo}" ha sido aprobado con todas las firmas completadas.',
        url='/gestion-documental/documentos?section=en_proceso',
        prioridad='alta',
        datos_extra={
            'documento_titulo': doc_titulo,
            'total_firmas': firmadas,
        },
    )
    logger.info(f"Notificacion DOCUMENTO_TODAS_FIRMAS enviada a {creador} para '{doc_titulo}'")


def _notificar_firma_rechazada(firma):
    """Notifica al creador del documento que una firma fue rechazada."""
    creador = _get_documento_creador(firma)
    if not creador:
        return

    service = _get_notification_service()
    doc_titulo = _get_documento_titulo(firma)
    firmante_nombre = firma.usuario.get_full_name() or firma.usuario.email
    motivo = firma.comentarios or 'Sin motivo especificado'

    service.send_notification(
        tipo_codigo='FIRMA_RECHAZADA',
        usuario=creador,
        titulo=f'Firma rechazada: {doc_titulo}',
        mensaje=f'{firmante_nombre} ha rechazado la firma del documento "{doc_titulo}". Motivo: {motivo}',
        url='/gestion-documental/documentos?section=en_proceso',
        prioridad='urgente',
        datos_extra={
            'documento_titulo': doc_titulo,
            'firmante_nombre': firmante_nombre,
            'motivo': motivo,
            'firma_id': firma.id,
        },
    )
    logger.info(f"Notificacion FIRMA_RECHAZADA enviada a {creador} por rechazo de {firmante_nombre}")


def _notificar_firma_delegada(firma):
    """
    Notifica al delegante (confirmacion) sobre la delegacion.
    La nueva firma PENDIENTE del delegado dispara _notificar_firma_pendiente via created=True.
    """
    # No se necesita notificacion extra: el delegado ya recibe FIRMA_PENDIENTE
    # cuando se crea la nueva FirmaDigital con estado=PENDIENTE.
    # Solo logueamos para trazabilidad.
    logger.info(
        f"Firma #{firma.id} delegada por {firma.usuario}. "
        f"La nueva firma PENDIENTE disparara notificacion automaticamente."
    )
