"""
Configuración de Celery para StrateKaz
Sistema de tareas asíncronas usando Redis como broker y backend
"""
import os
from celery import Celery
from celery.schedules import crontab
from decouple import config

# Establecer el módulo de configuración de Django para Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

# Crear la aplicación Celery
app = Celery('stratekaz')

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
    # TENANT - GESTIÓN DE SUSCRIPCIONES Y SCHEMAS
    # ═══════════════════════════════════════════════════

    # Desactivar tenants con trials o suscripciones vencidas - Diario a las 12:30 AM
    'tenant-check-expirations-daily': {
        'task': 'apps.tenant.tasks.check_tenant_expirations',
        'schedule': crontab(hour=0, minute=30),
        'options': {'queue': 'tenant_ops'},
    },

    # Limpiar tenants atascados en 'creating' - Cada 15 minutos
    'tenant-cleanup-stale-creating': {
        'task': 'apps.tenant.tasks.cleanup_stale_creating_tenants',
        'schedule': crontab(minute='*/15'),
        'options': {'queue': 'tenant_ops'},
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

    # ═══════════════════════════════════════════════════
    # TALENT HUB - GESTIÓN DE TALENTO HUMANO
    # ═══════════════════════════════════════════════════

    # Verificar contratos próximos a vencer - Diario a las 7:30 AM
    'th-check-contratos-por-vencer': {
        'task': 'apps.talent_hub.tasks.check_contratos_por_vencer',
        'schedule': crontab(hour=7, minute=30),
        'options': {'queue': 'notifications'},
    },

    # Verificar períodos de prueba por terminar - Diario a las 7:45 AM
    'th-check-periodos-prueba': {
        'task': 'apps.talent_hub.tasks.check_periodos_prueba',
        'schedule': crontab(hour=7, minute=45),
        'options': {'queue': 'notifications'},
    },

    # ═══════════════════════════════════════════════════
    # CONTROL DE TIEMPO - ASISTENCIA Y MARCAJES
    # TODO: Descomentar cuando apps.talent_hub.control_tiempo esté en INSTALLED_APPS
    # ═══════════════════════════════════════════════════

    # 'ct-detectar-ausencias-diarias': {
    #     'task': 'control_tiempo.detectar_ausencias_diarias',
    #     'schedule': crontab(hour=23, minute=0),
    #     'options': {'queue': 'notifications'},
    # },
    # 'ct-generar-consolidados-mensuales': {
    #     'task': 'control_tiempo.generar_consolidados_mensuales',
    #     'schedule': crontab(hour=2, minute=0, day_of_month=1),
    #     'options': {'queue': 'reports'},
    # },
    # 'ct-recordar-marcaje-pendiente': {
    #     'task': 'control_tiempo.recordar_marcaje_pendiente',
    #     'schedule': crontab(minute='*/30'),
    #     'options': {'queue': 'notifications'},
    # },

    # ═══════════════════════════════════════════════════
    # WORKFLOW ENGINE - EJECUCIÓN DE FLUJOS
    # ═══════════════════════════════════════════════════

    # Verificar tareas vencidas (SLA) cada 5 minutos
    'workflow-check-overdue-tasks': {
        'task': 'apps.workflow_engine.ejecucion.tasks.verificar_tareas_vencidas',
        'schedule': crontab(minute='*/5'),
        'options': {'queue': 'workflow'},
    },

    # Actualizar métricas de flujos diariamente a la 1 AM
    'workflow-update-metrics-daily': {
        'task': 'apps.workflow_engine.ejecucion.tasks.actualizar_metricas_flujo',
        'schedule': crontab(hour=1, minute=0),
        'options': {'queue': 'reports'},
    },

    # ═══════════════════════════════════════════════════
    # ANALYTICS - AUTO-KPI Y DASHBOARD CROSS-MODULE
    # ═══════════════════════════════════════════════════

    # Calculo automatico de KPIs desde modulos operativos (diario 2 AM)
    'analytics-auto-kpi-daily': {
        'task': 'apps.analytics.tasks.calcular_kpis_automaticos',
        'schedule': crontab(hour=2, minute=30),
        'options': {'queue': 'reports'},
    },

    # Snapshot del dashboard gerencial cross-module (cada hora)
    'analytics-dashboard-snapshot-hourly': {
        'task': 'apps.analytics.tasks.snapshot_dashboard_gerencial',
        'schedule': crontab(minute=5),  # 5 min past each hour
        'options': {'queue': 'reports'},
    },

    # ═══════════════════════════════════════════════════
    # PLANEACIÓN ESTRATÉGICA - OBJETIVOS, CAMBIOS Y KPIs
    # ═══════════════════════════════════════════════════

    # Verificar objetivos estratégicos vencidos o próximos a vencer - Diario 7:00 AM
    'planeacion-check-objectives-overdue': {
        'task': 'planeacion.check_objectives_overdue',
        'schedule': crontab(hour=7, minute=0),
        'options': {'queue': 'compliance'},
    },

    # Verificar cambios organizacionales vencidos - Diario 7:15 AM
    'planeacion-check-changes-overdue': {
        'task': 'planeacion.check_changes_overdue',
        'schedule': crontab(hour=7, minute=15),
        'options': {'queue': 'compliance'},
    },

    # Verificar KPIs pendientes de medición - Diario 8:00 AM
    'planeacion-check-kpi-measurements-due': {
        'task': 'planeacion.check_kpi_measurements_due',
        'schedule': crontab(hour=8, minute=0),
        'options': {'queue': 'compliance'},
    },

    # Verificar planes estratégicos próximos a vencer - Semanal lunes 8:00 AM
    'planeacion-check-plan-expiration': {
        'task': 'planeacion.check_plan_expiration',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),
        'options': {'queue': 'compliance'},
    },

    # ═══════════════════════════════════════════════════
    # GESTION DOCUMENTAL - REVISIONES PROGRAMADAS
    # ═══════════════════════════════════════════════════

    # Verificar documentos con revisión programada vencida - Diario a las 7:15 AM
    'documental-check-revision-programada': {
        'task': 'apps.gestion_estrategica.gestion_documental.tasks.verificar_documentos_revision_programada',
        'schedule': crontab(hour=7, minute=15),
        'options': {'queue': 'compliance'},
    },

    # Notificar documentos próximos a vencer revisión (15 días) - Diario a las 8:15 AM
    'documental-notify-revision-por-vencer': {
        'task': 'apps.gestion_estrategica.gestion_documental.tasks.notificar_documentos_por_vencer',
        'schedule': crontab(hour=8, minute=15),
        'options': {'queue': 'notifications'},
    },

    # Procesar OCR pendientes - Diario a las 6:30 AM
    'documental-procesar-ocr-pendientes': {
        'task': 'documental.procesar_ocr_pendientes',
        'schedule': crontab(hour=6, minute=30),
        'options': {'queue': 'files'},
    },

    # Calcular scores de cumplimiento documental - Diario a las 5:00 AM
    'documental-calcular-scores-batch': {
        'task': 'documental.calcular_scores_batch',
        'schedule': crontab(hour=5, minute=0),
        'options': {'queue': 'compliance'},
    },

    # ═══════════════════════════════════════════════════
    # REVISION POR LA DIRECCION (ISO 9.3)
    # ═══════════════════════════════════════════════════

    # ═══════════════════════════════════════════════════
    # EVIDENCIAS CENTRALIZADAS
    # ═══════════════════════════════════════════════════

    # Verificar evidencias vencidas (certificados, licencias) - Diario a las 6 AM
    'evidencias-check-expired': {
        'task': 'apps.motor_cumplimiento.evidencias.tasks.verificar_evidencias_vencidas',
        'schedule': crontab(hour=6, minute=0),
        'options': {'queue': 'compliance'},
    },

    # ═══════════════════════════════════════════════════
    # REVISION POR LA DIRECCION (ISO 9.3)
    # ═══════════════════════════════════════════════════

    # Verificar compromisos vencidos - Diario a las 7 AM
    'revision-check-overdue-compromisos': {
        'task': 'apps.gestion_estrategica.revision_direccion.tasks.verificar_compromisos_vencidos',
        'schedule': crontab(hour=7, minute=0),
        'options': {'queue': 'compliance'},
    },

    # Recordatorio de revisiones proximas - Diario a las 8 AM
    'revision-send-reminder': {
        'task': 'apps.gestion_estrategica.revision_direccion.tasks.enviar_recordatorio_revision',
        'schedule': crontab(hour=8, minute=0),
        'options': {'queue': 'notifications'},
    },

    # ═══════════════════════════════════════════════════
    # CORE - ONBOARDING — RECORDATORIOS AUTOMÁTICOS
    # ═══════════════════════════════════════════════════

    # Recordar activaciones pendientes — cada 12 horas
    'core-check-pending-activations': {
        'task': 'apps.core.tasks.check_pending_activations',
        'schedule': crontab(hour='*/12'),
        'options': {'queue': 'notifications'},
    },

    # Recordar perfiles incompletos — diario a las 10:00 AM (hora Bogotá)
    'core-check-incomplete-profiles': {
        'task': 'apps.core.tasks.check_incomplete_profiles',
        'schedule': crontab(hour=10, minute=0),
        'options': {'queue': 'notifications'},
    },

    # ═══════════════════════════════════════════════════
    # AUDIT SYSTEM - ALERTAS AUTOMATICAS
    # ═══════════════════════════════════════════════════

    # Verificación de alertas según ConfiguracionAlerta - Cada hora
    'audit-ejecutar-verificacion-alertas': {
        'task': 'apps.audit_system.config_alertas.tasks.ejecutar_verificacion_alertas',
        'schedule': crontab(minute=0),  # Cada hora en punto
        'options': {'queue': 'compliance'},
    },

    # Escalamiento de alertas no atendidas - Cada 2 horas
    'audit-escalar-alertas-no-atendidas': {
        'task': 'apps.audit_system.config_alertas.tasks.escalar_alertas_no_atendidas',
        'schedule': crontab(minute=30, hour='*/2'),
        'options': {'queue': 'compliance'},
    },

    # Limpieza de alertas antiguas atendidas - Domingos a las 3 AM
    'audit-limpiar-alertas-antiguas': {
        'task': 'apps.audit_system.config_alertas.tasks.limpiar_alertas_antiguas',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
        'options': {'queue': 'maintenance'},
    },

    # ═══════════════════════════════════════════════════
    # AUDIT SYSTEM - TAREAS Y RECORDATORIOS
    # ═══════════════════════════════════════════════════

    # Verificar tareas vencidas - Cada 30 minutos
    'audit-verificar-tareas-vencidas': {
        'task': 'apps.audit_system.tareas_recordatorios.tasks.verificar_tareas_vencidas',
        'schedule': crontab(minute='*/30'),
        'options': {'queue': 'compliance'},
    },

    # Ejecutar recordatorios programados - Cada 15 minutos
    'audit-ejecutar-recordatorios': {
        'task': 'apps.audit_system.tareas_recordatorios.tasks.ejecutar_recordatorios',
        'schedule': crontab(minute='*/15'),
        'options': {'queue': 'notifications'},
    },

    # Resumen diario de tareas pendientes - Diario a las 8:30 AM
    'audit-resumen-tareas-diario': {
        'task': 'apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario',
        'schedule': crontab(hour=8, minute=30),
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
    'apps.core.tasks.check_pending_activations': {'queue': 'notifications'},
    'apps.core.tasks.check_incomplete_profiles': {'queue': 'notifications'},

    # Tenant tasks (operaciones largas de schema + suscripciones)
    'apps.tenant.tasks.create_tenant_schema': {'queue': 'tenant_ops'},
    'apps.tenant.tasks.retry_tenant_schema': {'queue': 'tenant_ops'},
    'apps.tenant.tasks.cleanup_failed_tenant': {'queue': 'tenant_ops'},
    'apps.tenant.tasks.cleanup_stale_creating_tenants': {'queue': 'tenant_ops'},
    'apps.tenant.tasks.check_tenant_expirations': {'queue': 'tenant_ops'},

    # Motor de Cumplimiento tasks
    'apps.motor_cumplimiento.tasks.scrape_legal_updates': {'queue': 'scraping'},
    'apps.motor_cumplimiento.tasks.check_license_expirations': {'queue': 'compliance'},
    'apps.motor_cumplimiento.tasks.send_expiration_notifications': {'queue': 'notifications'},
    'apps.motor_cumplimiento.tasks.generate_compliance_report': {'queue': 'reports'},
    'apps.motor_cumplimiento.tasks.update_requisito_status': {'queue': 'compliance'},

    # Talent Hub tasks
    'apps.talent_hub.tasks.check_contratos_por_vencer': {'queue': 'notifications'},
    'apps.talent_hub.tasks.check_periodos_prueba': {'queue': 'notifications'},

    # Control de Tiempo tasks
    'control_tiempo.detectar_ausencias_diarias': {'queue': 'notifications'},
    'control_tiempo.generar_consolidados_mensuales': {'queue': 'reports'},
    'control_tiempo.recordar_marcaje_pendiente': {'queue': 'notifications'},

    # Workflow Engine tasks
    'apps.workflow_engine.ejecucion.tasks.verificar_tareas_vencidas': {'queue': 'workflow'},
    'apps.workflow_engine.ejecucion.tasks.enviar_notificacion_workflow': {'queue': 'emails'},
    'apps.workflow_engine.ejecucion.tasks.ejecutar_evento_temporizador': {'queue': 'workflow'},
    'apps.workflow_engine.ejecucion.tasks.actualizar_metricas_flujo': {'queue': 'reports'},

    # Analytics tasks
    'apps.analytics.tasks.calcular_kpis_automaticos': {'queue': 'reports'},
    'apps.analytics.tasks.snapshot_dashboard_gerencial': {'queue': 'reports'},

    # Planeación Estratégica tasks
    'planeacion.check_objectives_overdue': {'queue': 'compliance'},
    'planeacion.check_changes_overdue': {'queue': 'compliance'},
    'planeacion.check_kpi_measurements_due': {'queue': 'compliance'},
    'planeacion.check_plan_expiration': {'queue': 'compliance'},

    # Revision por la Direccion tasks
    'apps.gestion_estrategica.revision_direccion.tasks.verificar_compromisos_vencidos': {'queue': 'compliance'},
    'apps.gestion_estrategica.revision_direccion.tasks.enviar_recordatorio_revision': {'queue': 'notifications'},

    # Evidencias Centralizadas tasks
    'apps.motor_cumplimiento.evidencias.tasks.verificar_evidencias_vencidas': {'queue': 'compliance'},

    # Gestion Documental tasks
    'apps.gestion_estrategica.gestion_documental.tasks.verificar_documentos_revision_programada': {'queue': 'compliance'},
    'apps.gestion_estrategica.gestion_documental.tasks.notificar_documentos_por_vencer': {'queue': 'notifications'},
    'documental.procesar_ocr_documento': {'queue': 'files'},
    'documental.procesar_ocr_pendientes': {'queue': 'files'},
    'documental.calcular_scores_batch': {'queue': 'compliance'},
    'documental.generar_documento_desde_workflow': {'queue': 'files'},
    'documental.exportar_drive_lote': {'queue': 'files'},

    # Audit System - Config Alertas tasks
    'apps.audit_system.config_alertas.tasks.ejecutar_verificacion_alertas': {'queue': 'compliance'},
    'apps.audit_system.config_alertas.tasks.escalar_alertas_no_atendidas': {'queue': 'compliance'},
    'apps.audit_system.config_alertas.tasks.limpiar_alertas_antiguas': {'queue': 'maintenance'},

    # Audit System - Tareas Recordatorios tasks
    'apps.audit_system.tareas_recordatorios.tasks.verificar_tareas_vencidas': {'queue': 'compliance'},
    'apps.audit_system.tareas_recordatorios.tasks.ejecutar_recordatorios': {'queue': 'notifications'},
    'apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario': {'queue': 'notifications'},

    # EventBus async dispatch
    'utils.tasks.dispatch_event_async': {'queue': 'notifications'},
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
