# Quick Start: Redis & Celery

Guía rápida para empezar a usar Redis y Celery en el proyecto.

## 1. Iniciar los Servicios

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

Deberías ver estos servicios activos:
- grasas_huesos_db (MySQL)
- grasas_huesos_backend (Django)
- grasas_huesos_frontend (React)
- grasas_huesos_redis (Redis)
- grasas_huesos_celery_worker (Celery Worker)
- grasas_huesos_celery_beat (Celery Beat)

## 2. Ejecutar Migraciones

```bash
# Migrar las tablas de django-celery-beat y django-celery-results
docker-compose exec backend python manage.py migrate
```

## 3. Verificar la Instalación

### Opción A: Script de Prueba Automático

```bash
# Ejecutar script de pruebas
python test_celery.py
```

Este script verificará:
- Conexión a Redis
- Workers de Celery activos
- Ejecución de tareas
- Tareas periódicas configuradas

### Opción B: Prueba Manual

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

## 4. Ver Logs

```bash
# Logs de Celery Worker
docker-compose logs -f celery_worker

# Logs de Celery Beat (tareas periódicas)
docker-compose logs -f celery_beat

# Logs de Redis
docker-compose logs -f redis

# Logs del Backend
docker-compose logs -f backend
```

## 5. Monitorear con Flower (Opcional)

### Agregar Flower al docker-compose.yml

Agrega este servicio después del servicio `celery_beat`:

```yaml
  # Flower - Monitor de Celery
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

Luego:

```bash
# Iniciar Flower
docker-compose up -d flower

# Acceder a la interfaz web
# Abre en tu navegador: http://localhost:5555
```

## 6. Ejemplo Práctico: Enviar Email Asíncrono

Crea un view en tu app:

```python
# backend/apps/core/views.py
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

Agregar ruta:

```python
# backend/apps/core/urls.py
from django.urls import path
from .views import send_notification

urlpatterns = [
    # ... otras rutas
    path('send-notification/', send_notification, name='send-notification'),
]
```

Probar con curl:

```bash
curl -X POST http://localhost:8000/api/core/send-notification/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 7. Comandos Útiles

### Verificar Estado de Workers

```bash
# Ver workers activos
docker-compose exec celery_worker celery -A config inspect active

# Ver tareas registradas
docker-compose exec celery_worker celery -A config inspect registered

# Ver estadísticas
docker-compose exec celery_worker celery -A config inspect stats
```

### Limpiar Cola de Tareas

```bash
# Eliminar todas las tareas pendientes
docker-compose exec celery_worker celery -A config purge
```

### Reiniciar Workers

```bash
# Reinicio graceful
docker-compose restart celery_worker

# Reinicio forzado
docker-compose stop celery_worker
docker-compose up -d celery_worker
```

## 8. Crear Tus Propias Tareas

1. Crea un archivo `tasks.py` en tu app:

```python
# backend/apps/mi_app/tasks.py
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

2. Usa la tarea en tus views:

```python
from apps.mi_app.tasks import mi_tarea_asincrona

# Ejecutar de forma asíncrona
task = mi_tarea_asincrona.delay('valor1', 'valor2')

# O con delay
task = mi_tarea_asincrona.apply_async(
    args=['valor1', 'valor2'],
    countdown=10  # Ejecutar en 10 segundos
)
```

## 9. Tareas Periódicas

Para programar tareas que se ejecuten automáticamente:

### Opción A: Configurar en celery.py

```python
# backend/config/celery.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'mi-tarea-diaria': {
        'task': 'apps.mi_app.tasks.tarea_diaria',
        'schedule': crontab(hour=8, minute=0),  # Todos los días a las 8 AM
        'options': {'queue': 'maintenance'}
    },
}
```

### Opción B: Configurar desde el Admin de Django

1. Ir a http://localhost:8000/admin
2. Login con superuser
3. Ir a "Periodic Tasks"
4. Crear nueva tarea periódica
5. Seleccionar tarea y schedule

## 10. Troubleshooting

### Problema: Tasks quedan en PENDING

**Solución**: Verificar que el worker está corriendo

```bash
docker-compose ps celery_worker
docker-compose logs celery_worker
```

### Problema: Connection Refused a Redis

**Solución**: Verificar variables de entorno

```bash
# Verificar que las URLs están correctas
docker-compose exec backend env | grep CELERY
docker-compose exec backend env | grep REDIS
```

### Problema: Tasks se ejecutan múltiples veces

**Solución**: Revisar configuración de CELERY_TASK_ACKS_LATE

```python
# En settings.py debe estar:
CELERY_TASK_ACKS_LATE = True
```

## 11. Recursos Adicionales

- **Documentación Completa**: Ver `docs/REDIS-CELERY-GUIDE.md`
- **Celery Docs**: https://docs.celeryproject.org/
- **Django Celery Beat**: https://django-celery-beat.readthedocs.io/

---

**¿Listo?** ¡Ahora puedes procesar tareas asíncronas en tu aplicación!

Para más detalles, consulta la guía completa en `docs/REDIS-CELERY-GUIDE.md`.
