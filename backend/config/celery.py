"""
Configuración de Celery para Grasas y Huesos del Norte S.A.S
Sistema de tareas asíncronas usando Redis como broker y backend
"""
import os
from celery import Celery
from celery.schedules import crontab
from decouple import config

# Establecer el módulo de configuración de Django para Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Crear la aplicación Celery
app = Celery('grasas_huesos')

# Configuración de Celery usando settings de Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodescubrir tareas en todas las apps instaladas
# Busca archivos tasks.py en cada app de INSTALLED_APPS
app.autodiscover_tasks()

# Configuración adicional de Celery
app.conf.update(
    # Broker y Backend
    broker_url=config('CELERY_BROKER_URL', default='redis://localhost:6379/0'),
    result_backend=config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1'),

    # Serialización
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Bogota',
    enable_utc=True,

    # Configuración de resultados
    result_expires=3600,  # Los resultados expiran en 1 hora
    result_extended=True,
    result_backend_transport_options={
        'master_name': 'mymaster',
        'visibility_timeout': 3600,
    },

    # Configuración de tareas
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutos límite hard
    task_soft_time_limit=25 * 60,  # 25 minutos límite soft
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Configuración de worker
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,  # Reinicia worker después de 1000 tareas
    worker_disable_rate_limits=False,

    # Broker configuración
    broker_connection_retry_on_startup=True,
    broker_pool_limit=10,

    # Configuración de beat (tareas periódicas)
    beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler',
)

# Configuración de tareas periódicas (Celery Beat)
app.conf.beat_schedule = {
    # ═══════════════════════════════════════════════════
    # CORE - MANTENIMIENTO Y MONITOREO
    # ═══════════════════════════════════════════════════

    # Limpieza de archivos temporales cada día a las 2 AM
    'cleanup-temp-files-daily': {
        'task': 'apps.core.tasks.cleanup_temp_files',
        'schedule': crontab(hour=2, minute=0),
        'options': {'queue': 'maintenance'}
    },

    # Envío de reportes semanales cada lunes a las 8 AM
    'send-weekly-reports': {
        'task': 'apps.core.tasks.send_weekly_reports',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),
        'options': {'queue': 'reports'}
    },

    # Backup de base de datos cada 6 horas
    'database-backup': {
        'task': 'apps.core.tasks.backup_database',
        'schedule': crontab(minute=0, hour='*/6'),
        'options': {'queue': 'maintenance'}
    },

    # Verificación de estado del sistema cada 15 minutos
    'system-health-check': {
        'task': 'apps.core.tasks.system_health_check',
        'schedule': crontab(minute='*/15'),
        'options': {'queue': 'monitoring'}
    },

    # ═══════════════════════════════════════════════════
    # MOTOR DE CUMPLIMIENTO - NORMAS Y REQUISITOS LEGALES
    # ═══════════════════════════════════════════════════

    # Web scraping de normas legales colombianas cada 15 días
    # Ejecutar el día 1 y 15 de cada mes a las 3 AM
    'scrape-legal-updates-biweekly': {
        'task': 'apps.motor_cumplimiento.tasks.scrape_legal_updates',
        'schedule': crontab(hour=3, minute=0, day_of_month='1,15'),
        'options': {'queue': 'scraping'},
    },

    # Verificación de vencimientos de requisitos legales - Diario a las 6 AM
    'check-license-expirations-daily': {
        'task': 'apps.motor_cumplimiento.tasks.check_license_expirations',
        'schedule': crontab(hour=6, minute=0),
        'options': {'queue': 'compliance'},
    },

    # Envío de notificaciones de vencimientos - Diario a las 7 AM
    'send-expiration-notifications-daily': {
        'task': 'apps.motor_cumplimiento.tasks.send_expiration_notifications',
        'schedule': crontab(hour=7, minute=0),
        'options': {'queue': 'notifications'},
    },
}

# Configuración de colas (routing)
app.conf.task_routes = {
    # Core tasks
    'apps.core.tasks.send_email_async': {'queue': 'emails'},
    'apps.core.tasks.generate_report_async': {'queue': 'reports'},
    'apps.core.tasks.process_file_upload': {'queue': 'files'},
    'apps.core.tasks.cleanup_*': {'queue': 'maintenance'},
    'apps.core.tasks.backup_*': {'queue': 'maintenance'},
    'apps.core.tasks.*_health_check': {'queue': 'monitoring'},

    # Motor de Cumplimiento tasks
    'apps.motor_cumplimiento.tasks.scrape_legal_updates': {'queue': 'scraping'},
    'apps.motor_cumplimiento.tasks.check_license_expirations': {'queue': 'compliance'},
    'apps.motor_cumplimiento.tasks.send_expiration_notifications': {'queue': 'notifications'},
    'apps.motor_cumplimiento.tasks.generate_compliance_report': {'queue': 'reports'},
    'apps.motor_cumplimiento.tasks.update_requisito_status': {'queue': 'compliance'},
}

# Configuración de prioridades de cola
app.conf.task_default_priority = 5
app.conf.task_queue_max_priority = 10

# Configuración de logging
app.conf.worker_hijack_root_logger = False
app.conf.worker_log_format = '[%(asctime)s: %(levelname)s/%(processName)s] %(message)s'
app.conf.worker_task_log_format = '[%(asctime)s: %(levelname)s/%(processName)s] [%(task_name)s(%(task_id)s)] %(message)s'


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Tarea de debug para verificar que Celery está funcionando"""
    print(f'Request: {self.request!r}')
