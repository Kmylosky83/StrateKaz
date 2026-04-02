"""
Signal handlers para Gestión Documental.

1. BPM auto-generación (Fase 4): workflow_completado → genera documentos.
2. Auto-distribución lectura obligatoria: nuevo User con cargo → asigna
   lectura de documentos PUBLICADOS que tengan lectura_obligatoria=True.
"""

import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger('gestion_documental')


# ─── Auto-distribución lectura obligatoria ────────────────────────

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_asignar_lecturas_obligatorias(sender, instance, created, **kwargs):
    """
    Cuando se crea un User nuevo con cargo, asigna automáticamente la lectura
    de todos los documentos PUBLICADOS que tengan lectura_obligatoria=True.

    Esto garantiza que la Política de Habeas Data (y cualquier otra política
    de lectura obligatoria) se distribuya a cada nuevo usuario sin intervención
    manual.

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

        if not django_apps.is_installed('apps.gestion_estrategica.gestion_documental'):
            return

        Documento = django_apps.get_model('gestion_documental', 'Documento')
        AceptacionDocumental = django_apps.get_model('gestion_documental', 'AceptacionDocumental')

        # Documentos publicados con lectura obligatoria
        documentos_obligatorios = Documento.objects.filter(
            estado='PUBLICADO',
            lectura_obligatoria=True,
        )

        if not documentos_obligatorios.exists():
            return

        creados = 0
        for doc in documentos_obligatorios:
            _, was_created = AceptacionDocumental.objects.get_or_create(
                documento=doc,
                version_documento=doc.version_actual,
                usuario=user,
                empresa_id=doc.empresa_id,
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
