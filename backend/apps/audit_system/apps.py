from django.apps import AppConfig


class AuditSystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.audit_system'
    verbose_name = 'Sistema de Auditoría y Notificaciones'
