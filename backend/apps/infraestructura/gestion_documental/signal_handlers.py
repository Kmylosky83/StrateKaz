"""
Signal handlers para Gestión Documental.

1. BPM auto-generación (Fase 4): workflow_completado → genera documentos.
2. Auto-distribución lectura obligatoria: nuevo User con cargo → asigna
   lectura de documentos PUBLICADOS que tengan lectura_obligatoria=True.
3. Cierre de FORMULARIO con FIRMA_WORKFLOW (H-GD-A4): cuando todas las
   FirmaDigital de un Documento.tipo_documento.categoria='FORMULARIO'
   están en estado FIRMADO, se genera el PDF con firmas embebidas y
   el documento avanza a APROBADO/PUBLICADO según `requiere_aprobacion`.
4. Sincronización contadores Documento.numero_descargas/numero_impresiones
   desde EventoDocumental (compatibilidad con UI existente).
"""

import logging

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.files.base import ContentFile
from django.db.models import F, Q
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

logger = logging.getLogger('gestion_documental')


# ─── Sincronización contadores de Documento desde EventoDocumental ────────

@receiver(post_save, sender='gestion_documental.EventoDocumental')
def sync_contadores_documento(sender, instance, created, **kwargs):
    """
    Mantiene `Documento.numero_descargas` y `Documento.numero_impresiones`
    sincronizados con el log granular de eventos. Se ejecuta solo en la
    creación inicial del evento (no en updates).

    Mapeo:
        DESCARGA_PDF, DESCARGA_DOCX, EXPORT_DRIVE → numero_descargas++
        IMPRESION                                  → numero_impresiones++

    El resto de tipos (VISTA, ACCESO_DENEGADO) no incrementa contadores.
    """
    if not created:
        return

    from .models import Documento

    tipo = instance.tipo_evento
    if tipo in ('DESCARGA_PDF', 'DESCARGA_DOCX', 'EXPORT_DRIVE'):
        Documento.objects.filter(pk=instance.documento_id).update(
            numero_descargas=F('numero_descargas') + 1,
        )
    elif tipo == 'IMPRESION':
        Documento.objects.filter(pk=instance.documento_id).update(
            numero_impresiones=F('numero_impresiones') + 1,
        )


# ─── Auto-distribución lectura obligatoria ────────────────────────

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_asignar_lecturas_obligatorias(sender, instance, created, **kwargs):
    """
    Cuando se crea un User nuevo con cargo, asigna automáticamente la lectura
    de los documentos PUBLICADOS que aplican al usuario según su cargo.

    Reglas de audiencia (alineadas con `_distribuir_lectura_obligatoria`):
      A. aplica_a_todos=True
         → asigna sin importar el cargo del usuario.
      B. cargos_distribucion contiene el cargo del usuario
         → asigna solo si el documento explicita el cargo del usuario.
      C. lectura_obligatoria=True SIN aplica_a_todos NI cargos_distribucion
         → política universal (p. ej. Habeas Data): asigna a cualquier usuario
           con cargo.

    Un documento con lectura_obligatoria=True que ADEMÁS define
    cargos_distribucion solo se asigna a usuarios cuyo cargo esté en esa
    lista — no a todos. Esto cierra H-GD-M4: nuevos usuarios solo reciben
    lecturas dirigidas a su cargo, respetando el filtro de audiencia.

    Evidencia legal: crea AceptacionDocumental con estado PENDIENTE,
    registrando fecha de asignación y documento versionado.
    """
    if not created:
        return

    user = instance

    # Solo usuarios con cargo (empleados, no admin puro sin cargo)
    if not user.cargo:
        return

    try:
        from django.apps import apps as django_apps

        if not django_apps.is_installed('apps.infraestructura.gestion_documental'):
            return

        Documento = django_apps.get_model('infra_gestion_documental', 'Documento')
        AceptacionDocumental = django_apps.get_model('infra_gestion_documental', 'AceptacionDocumental')

        # Documentos publicados que aplican al nuevo usuario:
        #   A. aplica_a_todos=True               → cualquier usuario.
        #   B. cargos_distribucion incluye su cargo → asignación dirigida.
        #   C. lectura_obligatoria=True SIN A ni cargos_distribucion definidos
        #      → política universal heredada (Habeas Data, etc.).
        # OJO: lectura_obligatoria=True + cargos_distribucion poblado NO
        # entra al usuario salvo que su cargo esté en la lista (B). Antes
        # caía en la condición Q(lectura_obligatoria=True) y se asignaba
        # incorrectamente a TODOS los usuarios nuevos.
        documentos_obligatorios = Documento.objects.filter(
            estado='PUBLICADO',
        ).filter(
            Q(aplica_a_todos=True)
            | Q(cargos_distribucion=user.cargo)
            | Q(
                lectura_obligatoria=True,
                aplica_a_todos=False,
                cargos_distribucion__isnull=True,
            )
        ).distinct()

        if not documentos_obligatorios.exists():
            return

        creados = 0
        for doc in documentos_obligatorios:
            _, was_created = AceptacionDocumental.objects.get_or_create(
                documento=doc,
                version_documento=doc.version_actual,
                usuario=user,
                defaults={
                    'estado': 'PENDIENTE',
                    'asignado_por': None,  # Sistema automático
                },
            )
            if was_created:
                creados += 1

        if creados > 0:
            logger.info(
                'Auto-distribución: %d lectura(s) obligatoria(s) asignadas a User %s (%s)',
                creados, user.id, user.email,
            )

            # Notificar al usuario
            try:
                _send_notification = django_apps.get_model(
                    'centro_notificaciones', 'Notificacion'
                )
                # Usar helper si existe, sino skip silenciosamente
            except LookupError:
                pass

    except Exception as e:
        logger.error(
            'Error en auto-distribución lecturas para User %s: %s',
            instance.id, e, exc_info=True,
        )


def _register_workflow_signal():
    """
    Registra el handler de workflow_completado de forma segura.
    Solo se conecta si workflow_engine está instalado.
    """
    from django.apps import apps as django_apps

    if not django_apps.is_installed('apps.workflow_engine.ejecucion'):
        return

    from apps.workflow_engine.ejecucion.signals import workflow_completado

    @receiver(workflow_completado)
    def handle_workflow_completado_autogen(sender, instancia, usuario, **kwargs):
        """
        Cuando un workflow se completa (llega a nodo FIN),
        verifica si tiene config_auto_generacion y genera documento.
        """
        try:
            PlantillaFlujo = django_apps.get_model(
                'disenador_flujos', 'PlantillaFlujo'
            )
            plantilla_flujo = PlantillaFlujo.objects.filter(
                id=instancia.plantilla_id
            ).first()

            if not plantilla_flujo:
                return

            config = getattr(plantilla_flujo, 'config_auto_generacion', None) or {}
            if not config.get('habilitado'):
                return

            from django.db import connection
            from .tasks import generar_documento_desde_workflow

            generar_documento_desde_workflow.delay(
                instancia_id=instancia.id,
                config=config,
                usuario_id=usuario.id if usuario else None,
                tenant_schema=connection.schema_name,
            )

            logger.info(
                f'[BPM→Doc] Workflow {instancia.id} completado, '
                f'auto-generación despachada para plantilla '
                f'{config.get("plantilla_documento_id", "N/A")}'
            )

        except Exception as e:
            logger.error(f'[BPM→Doc] Error en signal handler: {e}')


# ─── H-GD-A4: cierre de FORMULARIO con FIRMA_WORKFLOW ──────────────────────

@receiver(post_save, sender='firma_digital.FirmaDigital')
def cerrar_formulario_con_pdf_al_firmar_ultimo(sender, instance, created, **kwargs):
    """Genera PDF del FORMULARIO y avanza el estado al firmar la última firma.

    Trigger:
      - FirmaDigital se actualiza a estado=FIRMADO.
      - El objeto firmado es un Documento del módulo gestion_documental.
      - El TipoDocumento tiene categoria='FORMULARIO'.
      - Todas las FirmaDigital del documento están en FIRMADO (sin pendientes).

    Acciones:
      - Renderizar PDF con WeasyPrint vía DocumentoPDFGenerator (las firmas
        manuscritas se incrustan desde FirmaDigital.firma_imagen).
      - Guardar el PDF en `documento.archivo_pdf`.
      - Pasar el documento a APROBADO o PUBLICADO según
        `tipo_documento.requiere_aprobacion`.
      - Idempotente: si `archivo_pdf` ya está poblado, no regenera.
    """
    if created or instance.estado != 'FIRMADO':
        return

    try:
        from django.apps import apps as django_apps

        if not django_apps.is_installed('apps.infraestructura.gestion_documental'):
            return

        Documento = django_apps.get_model('infra_gestion_documental', 'Documento')
        documento_ct = ContentType.objects.get_for_model(Documento)

        # Filtrado por content_type evita procesar firmas de otros modelos
        # que también usen FirmaDigital (Acta, Procedimiento, etc.).
        if instance.content_type_id != documento_ct.id:
            return

        try:
            documento = Documento.objects.get(pk=int(instance.object_id))
        except (Documento.DoesNotExist, ValueError, TypeError):
            return

        # Solo aplica a FORMULARIOs
        tipo_doc = documento.tipo_documento
        if not tipo_doc or tipo_doc.categoria != 'FORMULARIO':
            return

        # Idempotencia: si ya se generó el PDF, no rehacer.
        if documento.archivo_pdf and documento.archivo_pdf.name:
            return

        FirmaDigital = django_apps.get_model('firma_digital', 'FirmaDigital')
        firmas_qs = FirmaDigital.objects.filter(
            content_type=documento_ct,
            object_id=str(documento.pk),
        )

        if not firmas_qs.exists():
            return

        # Si queda alguna firma sin estado FIRMADO, no cerrar todavía.
        if firmas_qs.exclude(estado='FIRMADO').exists():
            return

        _generar_pdf_y_avanzar_estado(documento)

    except Exception as exc:  # noqa: BLE001 — el signal nunca debe romper la firma
        logger.error(
            'Error al cerrar FORMULARIO con FIRMA_WORKFLOW (firma=%s): %s',
            instance.pk, exc, exc_info=True,
        )


def _generar_pdf_y_avanzar_estado(documento):
    """Renderiza el PDF del FORMULARIO con firmas embebidas y avanza el estado.

    Invocado desde el signal `cerrar_formulario_con_pdf_al_firmar_ultimo`.
    Idempotente: si `archivo_pdf` ya está poblado, no hace nada.
    """
    if documento.archivo_pdf and documento.archivo_pdf.name:
        return

    from .exporters.pdf_generator import DocumentoPDFGenerator

    empresa = None
    try:
        from apps.core.base_models.mixins import get_tenant_empresa
        empresa = get_tenant_empresa()
    except Exception:  # noqa: BLE001
        empresa = None

    generator = DocumentoPDFGenerator(empresa=empresa)
    pdf_buffer = generator.generate_documento_pdf(documento, usuario=None)

    nombre_archivo = f'{documento.codigo or "FORMULARIO"}_v{documento.version_actual or "1.0"}.pdf'
    documento.archivo_pdf.save(
        nombre_archivo,
        ContentFile(pdf_buffer.getvalue()),
        save=False,
    )

    tipo_doc = documento.tipo_documento
    requiere_aprobacion = bool(getattr(tipo_doc, 'requiere_aprobacion', True))
    update_fields = ['archivo_pdf']

    if requiere_aprobacion:
        documento.estado = 'APROBADO'
        documento.fecha_aprobacion = timezone.localdate()
        update_fields.extend(['estado', 'fecha_aprobacion'])
    else:
        documento.estado = 'PUBLICADO'
        documento.fecha_publicacion = timezone.localdate()
        update_fields.extend(['estado', 'fecha_publicacion'])

    documento.save(update_fields=update_fields)

    logger.info(
        'FORMULARIO %s cerrado con PDF generado tras última firma (estado=%s)',
        documento.codigo, documento.estado,
    )
