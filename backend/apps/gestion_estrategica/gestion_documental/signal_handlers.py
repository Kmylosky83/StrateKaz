"""
Signal handlers para Gestión Documental (Fase 4: BPM auto-generación).
Escucha la señal workflow_completado y genera documentos automáticamente
cuando un flujo BPM tiene config_auto_generacion habilitada.
"""

import logging

from django.dispatch import receiver

logger = logging.getLogger('gestion_documental')


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
