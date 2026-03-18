"""
Configuración de la app Gestión Documental - Gestión Estratégica (N1)

Migrado desde apps.hseq_management.sistema_documental
El gestor documental es transversal a toda la organización.
"""
from django.apps import AppConfig


class GestionDocumentalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.gestion_documental'
    verbose_name = 'Gestión Documental'

    def ready(self):
        """Registrar signal handlers (BPM auto-generación Fase 4)."""
        from .signal_handlers import _register_workflow_signal
        _register_workflow_signal()
