# Guía de Redis y Celery - Grasas y Huesos del Norte

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Configuración](#configuración)
4. [Uso de Celery](#uso-de-celery)
5. [Tareas Disponibles](#tareas-disponibles)
6. [Monitoreo con Flower](#monitoreo-con-flower)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Troubleshooting](#troubleshooting)

---

## Introducción

Este proyecto utiliza **Redis** como broker de mensajes y backend de cache, junto con **Celery** para el procesamiento asíncrono de tareas. Esta arquitectura permite:

- Ejecutar tareas pesadas sin bloquear las peticiones HTTP
- Programar tareas periódicas (cron jobs)
- Mejorar el rendimiento con cache distribuido
- Escalar horizontalmente agregando más workers

---

## Arquitectura

### Componentes

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

### Bases de datos Redis

El proyecto utiliza diferentes bases de datos Redis para separar responsabilidades:

- **DB 0**: Broker de Celery (cola de mensajes)
- **DB 1**: Backend de resultados de Celery
- **DB 2**: Cache de Django (general)
- **DB 3**: Cache de sesiones de Django

### Servicios Docker

1. **redis**: Servicio Redis Alpine
2. **celery_worker**: Worker de Celery (procesa tareas)
3. **celery_beat**: Scheduler de Celery (tareas periódicas)
4. **backend**: Django API (puede enviar tareas)

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

### Iniciar los Servicios

```bash
# Iniciar todos los servicios (incluye Redis, Celery Worker y Beat)
docker-compose up -d

# Ver logs de Celery Worker
docker-compose logs -f celery_worker

# Ver logs de Celery Beat
docker-compose logs -f celery_beat

# Ver logs de Redis
docker-compose logs -f redis
```

### Ejecutar Migraciones

Las apps de Celery requieren migraciones:

```bash
# Dentro del contenedor backend
docker-compose exec backend python manage.py migrate django_celery_beat
docker-compose exec backend python manage.py migrate django_celery_results
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
def my_async_task(self, param1, param2):
    """
    Tarea asíncrona de ejemplo.
    """
    try:
        logger.info(f"Ejecutando tarea con {param1}, {param2}")

        # Tu lógica aquí
        result = f"Procesado: {param1} + {param2}"

        return {
            'status': 'success',
            'result': result,
            'task_id': self.request.id
        }

    except Exception as exc:
        logger.error(f"Error en tarea: {exc}")
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
    # Ejecutar tarea de forma asíncrona
    task = send_email_async.delay(
        subject="Notificación",
        message="Contenido del mensaje",
        recipient_list=["user@example.com"]
    )

    return Response({
        'task_id': task.id,
        'status': 'Task queued successfully'
    })
```

#### Desde el Shell de Django

```python
python manage.py shell

>>> from apps.core.tasks import send_email_async
>>> result = send_email_async.delay("Test", "Mensaje", ["test@example.com"])
>>> result.id  # ID de la tarea
>>> result.status  # Estado: PENDING, STARTED, SUCCESS, FAILURE
>>> result.get()  # Espera y obtiene el resultado
```

#### Con Callback

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

### Crear API Endpoint para Estado de Tarea

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

---

## Tareas Disponibles

El sistema viene con tareas preconstruidas en `backend/apps/core/tasks.py`:

### Tareas de Email

#### `send_email_async`
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

#### `send_notification_email`
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

#### `generate_report_async`
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

#### `process_file_upload`
Procesar archivos subidos.

```python
from apps.core.tasks import process_file_upload

process_file_upload.delay(
    file_path='/media/uploads/data.xlsx',
    file_type='excel',
    metadata={'uploaded_by': 1}
)
```

### Tareas Periódicas

Las siguientes tareas se ejecutan automáticamente según el schedule configurado:

- **cleanup_temp_files**: Limpia archivos temporales diariamente a las 2 AM
- **send_weekly_reports**: Envía reportes semanales cada lunes a las 8 AM
- **backup_database**: Realiza backup cada 6 horas
- **system_health_check**: Verifica salud del sistema cada 15 minutos

---

## Monitoreo con Flower

**Flower** es una interfaz web para monitorear Celery en tiempo real.

### Agregar Flower al docker-compose.yml

Agrega este servicio:

```yaml
  # Flower - Monitoreo de Celery
  flower:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: grasas_huesos_flower
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

### Acceder a Flower

```bash
# Iniciar Flower
docker-compose up -d flower

# Acceder en el navegador
http://localhost:5555
```

### Características de Flower

- Ver tareas en ejecución, completadas y fallidas
- Estadísticas de workers
- Gráficos de rendimiento
- Reiniciar workers
- Revocar tareas
- Ver logs en tiempo real

---

## Mejores Prácticas

### 1. Diseño de Tareas

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

### 2. Timeouts

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

### 5. Logging

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

### 6. Colas Separadas

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

---

## Troubleshooting

### Ver Estado de Celery

```bash
# Desde el host
docker-compose exec celery_worker celery -A config inspect active
docker-compose exec celery_worker celery -A config inspect registered
docker-compose exec celery_worker celery -A config inspect stats

# Estado de workers
docker-compose exec celery_worker celery -A config inspect ping
```

### Limpiar Cola de Mensajes

```bash
# Purge all tasks
docker-compose exec celery_worker celery -A config purge

# Purge specific queue
docker-compose exec celery_worker celery -A config purge -Q queue_name
```

### Revocar Tarea

```python
from celery.task.control import revoke

# Revocar tarea
revoke(task_id, terminate=True)
```

### Reiniciar Workers

```bash
# Reiniciar worker gracefully
docker-compose restart celery_worker

# Reiniciar worker inmediatamente
docker-compose exec celery_worker celery -A config control shutdown
docker-compose up -d celery_worker
```

### Problemas Comunes

#### 1. Tasks no se ejecutan

**Problema**: Las tareas quedan en PENDING

**Solución**:
```bash
# Verificar que Redis está corriendo
docker-compose ps redis

# Verificar que worker está corriendo
docker-compose ps celery_worker

# Ver logs del worker
docker-compose logs celery_worker
```

#### 2. Connection Refused

**Problema**: `[Errno 111] Connection refused`

**Solución**:
```bash
# Verificar URL de Redis en .env
CELERY_BROKER_URL=redis://redis:6379/0

# Verificar red Docker
docker network inspect grasas_network
```

#### 3. Tareas duplicadas

**Problema**: La misma tarea se ejecuta múltiples veces

**Solución**:
```python
# Usar task_id único
from celery import uuid

task_id = uuid()
my_task.apply_async(args=[data], task_id=task_id)
```

#### 4. Memory Leaks

**Problema**: Worker consume cada vez más memoria

**Solución**:
```yaml
# En docker-compose.yml, configurar max_tasks_per_child
command: celery -A config worker -l info --concurrency=4 --max-tasks-per-child=1000
```

---

## Comandos Útiles

```bash
# Ver tareas registradas
docker-compose exec celery_worker celery -A config inspect registered

# Ver tareas activas
docker-compose exec celery_worker celery -A config inspect active

# Ver tareas programadas
docker-compose exec celery_worker celery -A config inspect scheduled

# Ver estadísticas
docker-compose exec celery_worker celery -A config inspect stats

# Ver reserved tasks
docker-compose exec celery_worker celery -A config inspect reserved

# Aumentar concurrency en caliente
docker-compose exec celery_worker celery -A config control pool_grow 2

# Disminuir concurrency
docker-compose exec celery_worker celery -A config control pool_shrink 2

# Ver configuración
docker-compose exec celery_worker celery -A config inspect conf
```

---

## Referencias

- [Celery Documentation](https://docs.celeryproject.org/)
- [Django Celery Beat](https://django-celery-beat.readthedocs.io/)
- [Django Celery Results](https://django-celery-results.readthedocs.io/)
- [Flower Documentation](https://flower.readthedocs.io/)
- [Redis Documentation](https://redis.io/documentation)

---

**Actualizado**: 2024-12-23
**Versión**: 1.0.0
