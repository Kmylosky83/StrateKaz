"""
Configuración de la app Gestión Documental — Infraestructura Transversal (CT).

Reubicada desde apps.infraestructura.gestion_documental como parte de la
unificación de la capa CT (Infraestructura Transversal). El gestor documental
es transversal y todos los módulos C2 lo consumen.

NOTA Fase 2.1 (2026-04-28):
- Path Python: apps.infraestructura.gestion_documental
- app_label: infra_gestion_documental (NUEVO — antes era 'gestion_documental')
- db_table: NO cambia, los modelos preservan 'documental_*' explícito.
- Migración 0028_rename_app_label hace UPDATE en django_migrations + django_content_type.
"""
from django.apps import AppConfig


class GestionDocumentalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.infraestructura.gestion_documental'
    label = 'infra_gestion_documental'
    verbose_name = 'Gestión Documental'

    def ready(self):
        """Registrar signal handlers."""
        from .signal_handlers import _register_workflow_signal
        _register_workflow_signal()

        # Auto-distribución lectura obligatoria (se conecta via @receiver decorator)
        from . import signal_handlers  # noqa: F401
