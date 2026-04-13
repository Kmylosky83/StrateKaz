# Celery y Redis - Tareas Asíncronas

**Última actualización**: 2026-02-08

Esta guía consolida toda la información necesaria para trabajar con Redis y Celery en StrateKaz, incluyendo configuración, comandos de referencia y mejores prácticas.

## Tabla de Contenidos

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Configuración](#configuración)
4. [Comandos de Referencia](#comandos-de-referencia)
5. [Uso de Celery](#uso-de-celery)
6. [Tareas Disponibles](#tareas-disponibles)
7. [Monitoreo](#monitoreo)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Propósito

Este proyecto utiliza **Redis** como broker de mensajes y backend de cache, junto con **Celery** para el procesamiento asíncrono de tareas. Esta arquitectura permite:

- Ejecutar tareas pesadas sin bloquear las peticiones HTTP
- Programar tareas periódicas (cron jobs)
- Mejorar el rendimiento con cache distribuido
- Escalar horizontalmente agregando más workers

### Arquitectura

```
┌─────────────┐
│   Django    │──────┐
│  Backend    │      │
└─────────────┘      │
                     ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Redis     │◄─┤   Celery    │◄─┤   Celery    │
│   Broker    │  │   Worker    │  │    Beat     │
└─────────────┘  └─────────────┘  └─────────────┘
      │
      ▼
┌─────────────┐
│   Redis     │
│   Backend   │
└─────────────┘
```

### Bases de Datos Redis

El proyecto utiliza diferentes bases de datos Redis para separar responsabilidades:

- **DB 0**: Broker de Celery (cola de mensajes)
- **DB 1**: Backend de resultados de Celery
- **DB 2**: Cache de Django (general)
- **DB 3**: Cache de sesiones de Django

### Servicios Docker

1. **redis**: Servicio Redis Alpine (imagen oficial)
2. **celery_worker**: Worker de Celery (procesa tareas)
3. **celery_beat**: Scheduler de Celery (tareas periódicas)
4. **backend**: Django API (puede enviar tareas)

---

## Quick Start

### 1. Iniciar los Servicios

```bash
# Detener servicios anteriores (si están corriendo)
docker-compose down

# Reconstruir imágenes con nuevas dependencias
docker-compose build backend celery_worker celery_beat

# Iniciar todos los servicios
docker-compose up -d

# Verificar que todos los servicios están corriendo
docker-compose ps
```

Deberias ver estos servicios activos:
- `stratekaz_db` (PostgreSQL)
- `stratekaz_backend` (Django)
- `stratekaz_frontend` (React)
- `stratekaz_redis` (Redis)
- `stratekaz_celery` (Celery Worker)
- `stratekaz_celerybeat` (Celery Beat)

### 2. Ejecutar Migraciones

```bash
# Migrar las tablas de django-celery-beat y django-celery-results
docker-compose exec backend python manage.py migrate
```

### 3. Verificación de Instalación

#### Opción A: Script de Prueba Automático

```bash
# Ejecutar script de pruebas
python test_celery.py
```

Este script verificará:
- Conexión a Redis
- Workers de Celery activos
- Ejecución de tareas
- Tareas periódicas configuradas

#### Opción B: Prueba Manual

```bash
# Verificar logs del worker
docker-compose logs -f celery_worker

# En otra terminal, ejecutar Django shell
docker-compose exec backend python manage.py shell
```

Dentro del shell:

```python
# Importar una tarea de ejemplo
from apps.core.tasks import example_task

# Ejecutar tarea de forma asíncrona
result = example_task.delay('Hello Celery', param2=123)

# Ver el ID de la tarea
print(result.id)

# Ver el estado
print(result.state)  # PENDING, STARTED, SUCCESS, FAILURE

# Esperar y obtener resultado
print(result.get())  # Esto bloqueará hasta que la tarea termine
```

### 4. Verificación de Salud

```bash
# Health check de Redis
docker-compose exec redis redis-cli ping
# Esperado: PONG

# Health check de Celery Worker
docker-compose exec celery_worker celery -A config inspect ping
# Esperado: {worker_name: {'ok': 'pong'}}

# Health check del backend
curl http://localhost:8000/api/health/

# Estado de todos los servicios
docker-compose ps
```

---

## Configuración

### Variables de Entorno

En tu archivo `.env`:

```bash
# Redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/2

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

### Configuración de Celery

La configuración principal se encuentra en `backend/config/celery.py` y `backend/config/settings.py`.

#### Configuración de Colas

Organiza tareas por prioridad usando colas:

```python
# En celery.py
app.conf.task_routes = {
    'apps.core.tasks.send_email_async': {'queue': 'emails'},
    'apps.core.tasks.generate_report_async': {'queue': 'reports'},
    'apps.core.tasks.cleanup_*': {'queue': 'maintenance'},
}
```

#### Configuración de Tareas Periódicas

```python
# En celery.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'mi-tarea-diaria': {
        'task': 'apps.mi_app.tasks.tarea_diaria',
        'schedule': crontab(hour=8, minute=0),  # Todos los días a las 8 AM
        'options': {'queue': 'maintenance'}
    },
}
```

---

## Comandos de Referencia

### Iniciar/Detener Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Iniciar solo servicios específicos
docker-compose up -d redis celery_worker celery_beat

# Detener todos los servicios
docker-compose down

# Detener sin eliminar volúmenes
docker-compose stop

# Reiniciar servicios específicos
docker-compose restart celery_worker
docker-compose restart celery_beat
docker-compose restart redis

# Reconstruir imágenes
docker-compose build backend celery_worker celery_beat
docker-compose up -d --build
```

### Ver Logs

```bash
# Logs en tiempo real de Celery Worker
docker-compose logs -f celery_worker

# Logs en tiempo real de Celery Beat
docker-compose logs -f celery_beat

# Logs de Redis
docker-compose logs -f redis

# Últimas 100 líneas de logs
docker-compose logs --tail=100 celery_worker

# Logs de todos los servicios relacionados
docker-compose logs -f backend celery_worker celery_beat redis

# Ver errores en logs
docker-compose logs celery_worker | grep ERROR
docker-compose logs celery_worker | grep CRITICAL
```

### Inspección de Workers

```bash
# Ver workers activos
docker-compose exec celery_worker celery -A config inspect active

# Ver tareas registradas
docker-compose exec celery_worker celery -A config inspect registered

# Ver tareas programadas (scheduled)
docker-compose exec celery_worker celery -A config inspect scheduled

# Ver tareas reservadas
docker-compose exec celery_worker celery -A config inspect reserved

# Estadísticas de workers
docker-compose exec celery_worker celery -A config inspect stats

# Ping a workers
docker-compose exec celery_worker celery -A config inspect ping

# Ver configuración completa
docker-compose exec celery_worker celery -A config inspect conf

# Ver workers activos en formato JSON
docker-compose exec celery_worker celery -A config inspect active -j
```

### Control de Workers

```bash
# Aumentar concurrency en caliente (agregar 2 procesos)
docker-compose exec celery_worker celery -A config control pool_grow 2

# Disminuir concurrency (remover 2 procesos)
docker-compose exec celery_worker celery -A config control pool_shrink 2

# Reiniciar worker pool
docker-compose exec celery_worker celery -A config control pool_restart

# Shutdown graceful de workers
docker-compose exec celery_worker celery -A config control shutdown

# Cancelar consumo de tareas
docker-compose exec celery_worker celery -A config control cancel_consumer

# Habilitar eventos
docker-compose exec celery_worker celery -A config control enable_events

# Deshabilitar eventos
docker-compose exec celery_worker celery -A config control disable_events
```

### Gestión de Colas

```bash
# Purgar todas las tareas pendientes
docker-compose exec celery_worker celery -A config purge

# Purgar cola específica
docker-compose exec celery_worker celery -A config purge -Q emails
docker-compose exec celery_worker celery -A config purge -Q reports

# Ver tareas en cola
docker-compose exec celery_worker celery -A config inspect reserved

# Ver tareas activas
docker-compose exec celery_worker celery -A config inspect active

# Número de tareas en cola
docker-compose exec redis redis-cli -n 0 LLEN celery
```

### Comandos de Redis CLI

```bash
# Acceder a Redis CLI
docker-compose exec redis redis-cli

# Verificar conexión desde el host
redis-cli -h localhost -p 6379 ping

# Ver todas las keys en DB 0 (broker)
docker-compose exec redis redis-cli -n 0 KEYS '*'

# Ver todas las keys en DB 1 (results)
docker-compose exec redis redis-cli -n 1 KEYS '*'

# Ver tamaño de cada DB
docker-compose exec redis redis-cli -n 0 DBSIZE
docker-compose exec redis redis-cli -n 1 DBSIZE

# Monitorear comandos en tiempo real
docker-compose exec redis redis-cli MONITOR

# Limpiar DB actual
docker-compose exec redis redis-cli FLUSHDB

# Limpiar todas las DBs
docker-compose exec redis redis-cli FLUSHALL

# Ver conexiones activas a Redis
docker-compose exec redis redis-cli CLIENT LIST

# Ver estadísticas de Redis
docker-compose exec redis redis-cli INFO

# Ver memoria usada por Redis
docker-compose exec redis redis-cli INFO memory
```

### Comandos de Management de Django

```bash
# Django shell para interactuar con Celery
docker-compose exec backend python manage.py shell

# Ejecutar migraciones de Celery
docker-compose exec backend python manage.py migrate django_celery_beat
docker-compose exec backend python manage.py migrate django_celery_results

# Crear superuser (para admin de Periodic Tasks)
docker-compose exec backend python manage.py createsuperuser

# Ver schedule de tareas periódicas
docker-compose exec backend python manage.py shell -c "
from config.celery import app
for name, task in app.conf.beat_schedule.items():
    print(f'{name}: {task}')
"

# Limpiar resultados antiguos de tareas
docker-compose exec backend python manage.py shell -c "
from django_celery_results.models import TaskResult
from datetime import timedelta
from django.utils import timezone
TaskResult.objects.filter(
    date_done__lt=timezone.now() - timedelta(days=7)
).delete()
"

# Contar tareas por estado
docker-compose exec backend python manage.py shell -c "
from django_celery_results.models import TaskResult
from django.db.models import Count
print(TaskResult.objects.values('status').annotate(count=Count('id')))
"
```

### Testing desde Python Shell

```bash
# Entrar al shell
docker-compose exec backend python manage.py shell
```

```python
# Importar tareas
from apps.core.tasks import example_task, send_email_async, generate_report_async
from celery.result import AsyncResult

# Ejecutar tarea simple
result = example_task.delay('Hello Celery', param2=42)
print(f"Task ID: {result.id}")
print(f"State: {result.state}")

# Esperar resultado (bloqueante)
result.get(timeout=10)

# Ejecutar tarea de email (mock)
email_task = send_email_async.delay(
    subject='Test',
    message='Test message',
    recipient_list=['test@example.com']
)

# Consultar estado de tarea existente
task = AsyncResult('task-id-here')
print(task.state)
print(task.result)

# Revocar tarea
from celery.task.control import revoke
revoke('task-id-here', terminate=True)
```

### Testing desde API (curl)

```bash
# 1. Obtener token de autenticación
TOKEN=$(curl -s -X POST http://localhost:8000/api/tenant/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"tu_password"}' \
  | jq -r '.access')

echo $TOKEN

# 2. Ejecutar tarea de ejemplo
curl -X POST http://localhost:8000/api/core/test-celery/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "example",
    "params": {
      "param1": "test_value",
      "param2": 42
    }
  }' | jq

# 3. Consultar estado de tarea (reemplazar TASK_ID)
curl -X GET http://localhost:8000/api/core/task-status/TASK_ID/ \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Revocar tarea
curl -X POST http://localhost:8000/api/core/revoke-task/TASK_ID/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terminate": true}' | jq

# 5. Ejecutar tarea de health check
curl -X POST http://localhost:8000/api/core/test-celery/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task_type": "health_check"}' | jq
```

### Backup y Restore de Redis

```bash
# Backup manual de Redis (RDB)
docker-compose exec redis redis-cli SAVE

# Backup en background (BGSAVE)
docker-compose exec redis redis-cli BGSAVE

# Copiar dump.rdb desde el container
docker cp stratekaz_redis:/data/dump.rdb ./backup/redis-backup-$(date +%Y%m%d).rdb

# Restore: copiar dump.rdb al container (con Redis detenido)
docker-compose stop redis
docker cp ./backup/redis-backup.rdb stratekaz_redis:/data/dump.rdb
docker-compose start redis
```

### Monitoreo de Rendimiento

```bash
# Ver uso de CPU y memoria de containers
docker stats stratekaz_celery_worker stratekaz_redis

# Ver procesos dentro del worker
docker-compose exec celery_worker ps aux

# Ver estadísticas de Celery
docker-compose exec celery_worker celery -A config inspect stats
```

### Desarrollo y Testing

```bash
# Ejecutar suite de tests de Celery
python test_celery.py

# Ejecutar worker en modo debug (solo 1 proceso)
docker-compose exec backend celery -A config worker -l debug --concurrency=1

# Ejecutar beat en modo debug
docker-compose exec backend celery -A config beat -l debug

# Ver eventos en tiempo real
docker-compose exec celery_worker celery -A config events

# Monitor de eventos con curses UI
docker-compose exec celery_worker celery -A config events --camera=celery.events.cursesmon.evtop
```

### Comandos Específicos del Proyecto

```bash
# Verificar tareas registradas del proyecto
docker-compose exec celery_worker celery -A config inspect registered | grep apps.core

# Ejecutar tarea de limpieza manualmente
docker-compose exec backend python manage.py shell -c "
from apps.core.tasks import cleanup_temp_files
result = cleanup_temp_files.delay()
print(result.get())
"

# Ver resultados de tareas en Django Admin
# http://localhost:8000/admin/django_celery_results/taskresult/

# Ver tareas periódicas en Django Admin
# http://localhost:8000/admin/django_celery_beat/periodictask/
```

### Atajos Recomendados (Aliases)

Agregar a tu `.bashrc` o `.zshrc`:

```bash
# Aliases para Celery
alias celery-logs='docker-compose logs -f celery_worker'
alias celery-stats='docker-compose exec celery_worker celery -A config inspect stats'
alias celery-active='docker-compose exec celery_worker celery -A config inspect active'
alias celery-ping='docker-compose exec celery_worker celery -A config inspect ping'
alias celery-purge='docker-compose exec celery_worker celery -A config purge'
alias celery-restart='docker-compose restart celery_worker celery_beat'

# Aliases para Redis
alias redis-cli='docker-compose exec redis redis-cli'
alias redis-ping='docker-compose exec redis redis-cli ping'
alias redis-info='docker-compose exec redis redis-cli INFO'
```

---

## Uso de Celery

### Crear una Tarea

En cualquier app, crea un archivo `tasks.py`:

```python
from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def mi_tarea_asincrona(self, param1, param2):
    """
    Descripción de tu tarea.
    """
    try:
        logger.info(f"Procesando: {param1}, {param2}")

        # Tu lógica aquí
        resultado = f"{param1} + {param2}"

        return {
            'status': 'success',
            'resultado': resultado,
            'task_id': self.request.id
        }

    except Exception as exc:
        logger.error(f"Error: {exc}")
        raise self.retry(exc=exc, countdown=60)
```

### Ejecutar una Tarea

#### Desde un View

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.core.tasks import send_email_async

@api_view(['POST'])
def send_notification(request):
    """Enviar notificación por email de forma asíncrona"""

    # Ejecutar tarea en background
    task = send_email_async.delay(
        subject="Notificación del Sistema",
        message="Este es un mensaje de prueba",
        recipient_list=["user@example.com"]
    )

    return Response({
        'status': 'success',
        'task_id': task.id,
        'message': 'Email encolado para envío'
    })
```

#### Ejecutar con Opciones Avanzadas

```python
# Ejecutar con tiempo de expiración
task = my_task.apply_async(
    args=[arg1, arg2],
    countdown=10,  # Ejecutar en 10 segundos
    expires=300,   # Expirar en 5 minutos
    retry=True,
    retry_policy={
        'max_retries': 3,
        'interval_start': 0,
        'interval_step': 0.2,
        'interval_max': 0.2,
    }
)
```

### Verificar Estado de una Tarea

```python
from celery.result import AsyncResult

def check_task_status(task_id):
    task = AsyncResult(task_id)

    if task.state == 'PENDING':
        return {'status': 'pending'}
    elif task.state == 'PROGRESS':
        return {
            'status': 'in_progress',
            'meta': task.info
        }
    elif task.state == 'SUCCESS':
        return {
            'status': 'completed',
            'result': task.result
        }
    elif task.state == 'FAILURE':
        return {
            'status': 'failed',
            'error': str(task.info)
        }
```

### API Endpoint para Estado de Tarea

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from celery.result import AsyncResult

@api_view(['GET'])
def task_status(request, task_id):
    task = AsyncResult(task_id)

    return Response({
        'task_id': task_id,
        'state': task.state,
        'result': task.result if task.state == 'SUCCESS' else None,
        'error': str(task.info) if task.state == 'FAILURE' else None
    })
```

### Revocar Tareas

```python
from celery.task.control import revoke

# Revocar tarea sin terminar ejecución
revoke(task_id)

# Revocar y terminar ejecución
revoke(task_id, terminate=True)
```

---

## Tareas Disponibles

El sistema viene con tareas preconstruidas en `backend/apps/core/tasks.py`:

### Tareas de Email

#### send_email_async

Enviar emails de forma asíncrona.

```python
from apps.core.tasks import send_email_async

send_email_async.delay(
    subject="Bienvenido",
    message="Texto del mensaje",
    recipient_list=["user@example.com"],
    html_message="<h1>HTML del mensaje</h1>"
)
```

#### send_notification_email

Enviar email usando template.

```python
from apps.core.tasks import send_notification_email

send_notification_email.delay(
    user_id=1,
    template='welcome',
    context={
        'subject': 'Bienvenido al Sistema',
        'user_name': 'Juan Pérez'
    }
)
```

### Tareas de Reportes

#### generate_report_async

Generar reportes pesados de forma asíncrona.

```python
from apps.core.tasks import generate_report_async

generate_report_async.delay(
    report_type='monthly_summary',
    params={
        'month': '2024-01',
        'format': 'pdf'
    },
    user_id=1
)
```

### Tareas de Archivos

#### process_file_upload

Procesar archivos subidos.

```python
from apps.core.tasks import process_file_upload

process_file_upload.delay(
    file_path='/media/uploads/data.xlsx',
    file_type='excel',
    metadata={'uploaded_by': 1}
)
```

### Tareas por Modulo

#### Tenant (`apps.tenant.tasks`)
- **create_tenant_schema**: Crea schema PostgreSQL para nuevo tenant
- **populate_initial_data**: Datos iniciales (roles, permisos, menus) para tenant nuevo

#### Talent Hub (`apps.talent_hub.tasks`)
- **check_contratos_por_vencer**: Alerta contratos proximos a vencer (queue: compliance)
- **check_periodos_prueba**: Alerta periodos de prueba por finalizar (queue: compliance)

#### Workflow Engine (`apps.workflow_engine.ejecucion.tasks`)
- **monitorear_sla_tareas**: Cada 5 minutos, detecta tareas vencidas y escala (queue: workflows)

#### Analytics (`apps.analytics.tasks`)
- **auto_calculate_kpis**: Calcula KPIs automaticos via DSL `auto:app.Model.operation:filters`
- **snapshot_dashboard_cross_module**: Snapshot horario de datos cross-module (queue: analytics)

#### Revision por Direccion (`apps.gestion_estrategica.revision_direccion.tasks`)
- **verificar_compromisos_vencidos**: Diario 7AM, marca compromisos vencidos (queue: compliance)
- **enviar_recordatorio_revision**: Diario 8AM, reminders 3 dias antes (queue: notifications)

### Tareas Periodicas (Beat Schedule)

Las siguientes tareas se ejecutan automaticamente segun el schedule configurado en `config/celery.py`:

| Nombre | Tarea | Schedule | Queue |
|--------|-------|----------|-------|
| workflow-monitor-sla | monitorear_sla_tareas | Cada 5 min | workflows |
| analytics-auto-kpi | auto_calculate_kpis | Cada hora | analytics |
| analytics-snapshot | snapshot_dashboard | Cada hora (min 30) | analytics |
| revision-check-overdue | verificar_compromisos_vencidos | Diario 7AM | compliance |
| revision-send-reminder | enviar_recordatorio_revision | Diario 8AM | notifications |
| check-contratos | check_contratos_por_vencer | Diario (configurable) | compliance |
| check-periodos-prueba | check_periodos_prueba | Diario (configurable) | compliance |

---

## Monitoreo

### Flower - Monitor de Celery

**Flower** es una interfaz web para monitorear Celery en tiempo real.

#### Agregar Flower al docker-compose.yml

Agrega este servicio:

```yaml
  # Flower - Monitoreo de Celery
  flower:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: stratekaz_flower
    restart: unless-stopped
    command: celery -A config flower --port=5555
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis
      - celery_worker
    networks:
      - grasas_network
```

#### Iniciar Flower

```bash
# Iniciar Flower
docker-compose up -d flower

# Acceder en el navegador
# http://localhost:5555
```

#### Características de Flower

- Ver tareas en ejecución, completadas y fallidas
- Estadísticas de workers
- Gráficos de rendimiento
- Reiniciar workers
- Revocar tareas
- Ver logs en tiempo real

### Verificación de Variables de Entorno

```bash
# Ver variables de entorno del worker
docker-compose exec celery_worker env | grep CELERY

# Verificar conectividad a Redis desde backend
docker-compose exec backend python -c "
from django.core.cache import cache
cache.set('test', 'ok')
print(cache.get('test'))
"
```

---

## Mejores Prácticas

### 1. Diseño de Tareas Robustas

```python
@shared_task(
    bind=True,
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def robust_task(self, data):
    """
    Tarea robusta con reintentos automáticos.
    """
    try:
        # Hacer idempotente: mismo input = mismo output
        # Evitar efectos secundarios duplicados

        result = process_data(data)
        return result

    except Exception as exc:
        logger.error(f"Error: {exc}")
        raise self.retry(exc=exc)
```

### 2. Configurar Timeouts

Siempre establecer timeouts para evitar tareas colgadas:

```python
@shared_task(
    time_limit=300,      # Hard limit: 5 minutos
    soft_time_limit=240  # Soft limit: 4 minutos
)
def timed_task():
    try:
        # Tu código
        pass
    except SoftTimeLimitExceeded:
        # Cleanup graceful
        logger.warning("Soft time limit exceeded")
```

### 3. Actualizar Progreso

Para tareas largas, actualiza el progreso:

```python
@shared_task(bind=True)
def long_task(self, items):
    total = len(items)

    for i, item in enumerate(items):
        process(item)

        # Actualizar progreso
        self.update_state(
            state='PROGRESS',
            meta={
                'current': i + 1,
                'total': total,
                'percent': int((i + 1) / total * 100)
            }
        )

    return {'status': 'completed', 'total': total}
```

### 4. Manejo de Errores

```python
@shared_task(bind=True, max_retries=3)
def task_with_error_handling(self, data):
    try:
        result = risky_operation(data)
        return {'status': 'success', 'result': result}

    except SpecificException as exc:
        # Reintentar automáticamente
        raise self.retry(exc=exc, countdown=60)

    except FatalException as exc:
        # No reintentar, notificar admin
        logger.critical(f"Fatal error: {exc}")
        send_admin_alert(exc)
        raise
```

### 5. Logging Apropiado

Siempre loggear información relevante:

```python
import logging
logger = logging.getLogger(__name__)

@shared_task(bind=True)
def logged_task(self):
    logger.info(f"[Task {self.request.id}] Started")

    try:
        result = do_work()
        logger.info(f"[Task {self.request.id}] Completed: {result}")
        return result

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Failed: {exc}", exc_info=True)
        raise
```

### 6. Usar Colas Separadas

Organiza tareas por prioridad usando colas:

```python
# En celery.py
app.conf.task_routes = {
    'apps.core.tasks.send_email_async': {'queue': 'emails'},
    'apps.core.tasks.generate_report_async': {'queue': 'reports'},
    'apps.core.tasks.cleanup_*': {'queue': 'maintenance'},
}

# Iniciar workers específicos
celery -A config worker -Q emails -l info
celery -A config worker -Q reports,maintenance -l info
```

### 7. Tareas Idempotentes

Diseña tareas que puedan ejecutarse múltiples veces con el mismo resultado:

```python
@shared_task
def idempotent_task(order_id):
    # Verificar si ya fue procesado
    order = Order.objects.get(id=order_id)
    if order.processed:
        logger.info(f"Order {order_id} already processed")
        return

    # Procesar
    order.process()
    order.processed = True
    order.save()
```

### 8. Usar task_id Único

Para evitar duplicados:

```python
from celery import uuid

task_id = uuid()
my_task.apply_async(args=[data], task_id=task_id)
```

### 9. Limitar max_tasks_per_child

Para prevenir memory leaks:

```yaml
# En docker-compose.yml
command: celery -A config worker -l info --concurrency=4 --max-tasks-per-child=1000
```

---

## Troubleshooting

### Reinicio Completo de Servicios

```bash
# Reinicio completo de servicios Celery
docker-compose stop celery_worker celery_beat
docker-compose rm -f celery_worker celery_beat
docker-compose up -d celery_worker celery_beat

# Limpiar todo Redis
docker-compose exec redis redis-cli FLUSHALL
```

### Problemas Comunes

#### 1. Tasks no se ejecutan (PENDING)

**Problema**: Las tareas quedan en PENDING indefinidamente

**Diagnóstico**:
```bash
# Verificar que Redis está corriendo
docker-compose ps redis

# Verificar que worker está corriendo
docker-compose ps celery_worker

# Ver logs del worker
docker-compose logs celery_worker
```

**Soluciones**:
- Verificar que el worker está activo
- Revisar logs del worker para errores
- Confirmar conexión a Redis

#### 2. Connection Refused a Redis

**Problema**: `[Errno 111] Connection refused`

**Diagnóstico**:
```bash
# Verificar URL de Redis en .env
docker-compose exec backend env | grep CELERY
docker-compose exec backend env | grep REDIS

# Verificar red Docker
docker network inspect grasas_network
```

**Soluciones**:
- Verificar variables de entorno: `CELERY_BROKER_URL=redis://redis:6379/0`
- Reiniciar servicios: `docker-compose restart redis celery_worker`

#### 3. Tareas se ejecutan múltiples veces

**Problema**: La misma tarea se ejecuta varias veces

**Solución**:
```python
# Usar task_id único
from celery import uuid

task_id = uuid()
my_task.apply_async(args=[data], task_id=task_id)

# Configurar en settings.py
CELERY_TASK_ACKS_LATE = True
```

#### 4. Memory Leaks en Workers

**Problema**: Worker consume cada vez más memoria

**Solución**:
```yaml
# En docker-compose.yml, configurar max_tasks_per_child
command: celery -A config worker -l info --concurrency=4 --max-tasks-per-child=1000
```

#### 5. Tareas Colgadas

**Problema**: Tareas que nunca terminan

**Diagnóstico**:
```bash
# Ver tareas activas
docker-compose exec celery_worker celery -A config inspect active

# Ver tareas reservadas
docker-compose exec celery_worker celery -A config inspect reserved
```

**Solución**:
```python
# Configurar timeouts en la tarea
@shared_task(
    time_limit=300,      # Hard limit
    soft_time_limit=240  # Soft limit
)
def timed_task():
    pass
```

#### 6. Redis sin espacio

**Problema**: Redis alcanza límite de memoria

**Diagnóstico**:
```bash
# Ver memoria usada
docker-compose exec redis redis-cli INFO memory
```

**Solución**:
```bash
# Limpiar resultados antiguos
docker-compose exec backend python manage.py shell -c "
from django_celery_results.models import TaskResult
from datetime import timedelta
from django.utils import timezone
TaskResult.objects.filter(
    date_done__lt=timezone.now() - timedelta(days=7)
).delete()
"

# Ajustar maxmemory en redis.conf si es necesario
```

---

## Referencias

- [Celery Documentation](https://docs.celeryproject.org/)
- [Django Celery Beat](https://django-celery-beat.readthedocs.io/)
- [Django Celery Results](https://django-celery-results.readthedocs.io/)
- [Flower Documentation](https://flower.readthedocs.io/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Setup](./DOCKER-SETUP.md) - Configuración de Docker para el proyecto

---

**Nota**: Redis y Celery se ejecutan como servicios Docker. Consulta `docker-compose.yml` para ver la configuración completa de los servicios.
