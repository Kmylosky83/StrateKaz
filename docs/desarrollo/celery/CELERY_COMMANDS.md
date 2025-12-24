# Celery - Comandos de Referencia Rápida

Comandos útiles para trabajar con Celery y Redis en el proyecto.

---

## Iniciar/Detener Servicios

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

---

## Ver Logs

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
```

---

## Inspección de Workers

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
```

---

## Control de Workers

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

---

## Gestión de Colas

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
```

---

## Redis CLI

```bash
# Acceder a Redis CLI
docker-compose exec redis redis-cli

# Dentro de Redis CLI:
# > PING
# > KEYS *
# > DBSIZE
# > INFO
# > FLUSHDB  # Limpiar DB actual
# > FLUSHALL # Limpiar todas las DBs
# > SELECT 0 # Cambiar a DB 0 (broker)
# > SELECT 1 # Cambiar a DB 1 (results)

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
```

---

## Django Management Commands

```bash
# Django shell para interactuar con Celery
docker-compose exec backend python manage.py shell

# Dentro del shell:
from apps.core.tasks import example_task
result = example_task.delay('test', param2=123)
result.id
result.state
result.get()

# Ejecutar migraciones de Celery
docker-compose exec backend python manage.py migrate django_celery_beat
docker-compose exec backend python manage.py migrate django_celery_results

# Crear superuser (para admin de Periodic Tasks)
docker-compose exec backend python manage.py createsuperuser
```

---

## Testing desde Python Shell

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

---

## Testing desde API (curl)

```bash
# 1. Obtener token de autenticación
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"tu_password"}' \
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

---

## Monitoreo de Rendimiento

```bash
# Ver uso de CPU y memoria de containers
docker stats grasas_huesos_celery_worker grasas_huesos_redis

# Ver procesos dentro del worker
docker-compose exec celery_worker ps aux

# Ver conexiones activas a Redis
docker-compose exec redis redis-cli CLIENT LIST

# Ver estadísticas de Redis
docker-compose exec redis redis-cli INFO

# Ver memoria usada por Redis
docker-compose exec redis redis-cli INFO memory

# Ver estadísticas de Celery
docker-compose exec celery_worker celery -A config inspect stats
```

---

## Backup y Restore de Redis

```bash
# Backup manual de Redis (RDB)
docker-compose exec redis redis-cli SAVE

# Backup en background (BGSAVE)
docker-compose exec redis redis-cli BGSAVE

# Copiar dump.rdb desde el container
docker cp grasas_huesos_redis:/data/dump.rdb ./backup/redis-backup-$(date +%Y%m%d).rdb

# Restore: copiar dump.rdb al container (con Redis detenido)
docker-compose stop redis
docker cp ./backup/redis-backup.rdb grasas_huesos_redis:/data/dump.rdb
docker-compose start redis
```

---

## Verificación de Salud

```bash
# Health check de Redis
docker-compose exec redis redis-cli ping
# Esperado: PONG

# Health check de Celery Worker
docker-compose exec celery_worker celery -A config inspect ping
# Esperado: {worker_name: {'ok': 'pong'}}

# Health check del backend (Docker healthcheck)
curl http://localhost:8000/api/health/

# Estado de todos los servicios
docker-compose ps
```

---

## Troubleshooting

```bash
# Ver variables de entorno del worker
docker-compose exec celery_worker env | grep CELERY

# Verificar conectividad a Redis desde backend
docker-compose exec backend python -c "
from django.core.cache import cache
cache.set('test', 'ok')
print(cache.get('test'))
"

# Ver errores en logs
docker-compose logs celery_worker | grep ERROR
docker-compose logs celery_worker | grep CRITICAL

# Reinicio completo de servicios Celery
docker-compose stop celery_worker celery_beat
docker-compose rm -f celery_worker celery_beat
docker-compose up -d celery_worker celery_beat

# Limpiar todo Redis
docker-compose exec redis redis-cli FLUSHALL
```

---

## Desarrollo y Testing

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

---

## Comandos Específicos del Proyecto

```bash
# Verificar tareas registradas del proyecto
docker-compose exec celery_worker celery -A config inspect registered | grep apps.core

# Ver schedule de tareas periódicas
docker-compose exec backend python manage.py shell -c "
from config.celery import app
for name, task in app.conf.beat_schedule.items():
    print(f'{name}: {task}')
"

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

---

## One-Liners Útiles

```bash
# Número de tareas en cola
docker-compose exec redis redis-cli -n 0 LLEN celery

# Limpiar resultados antiguos de tareas
docker-compose exec backend python manage.py shell -c "
from django_celery_results.models import TaskResult
from datetime import timedelta
from django.utils import timezone
TaskResult.objects.filter(
    date_done__lt=timezone.now() - timedelta(days=7)
).delete()
"

# Ver workers activos en formato JSON
docker-compose exec celery_worker celery -A config inspect active -j

# Contar tareas por estado
docker-compose exec backend python manage.py shell -c "
from django_celery_results.models import TaskResult
from django.db.models import Count
print(TaskResult.objects.values('status').annotate(count=Count('id')))
"
```

---

## Atajos (Aliases Recomendados)

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

## Referencias Rápidas

- **Documentación Completa**: `docs/REDIS-CELERY-GUIDE.md`
- **Quick Start**: `CELERY_QUICKSTART.md`
- **Resumen Completo**: `CELERY_SETUP_COMPLETE.md`
- **Celery Docs**: https://docs.celeryproject.org/
- **Redis Commands**: https://redis.io/commands

---

**Tip**: Guarda este archivo en tus favoritos para referencia rápida durante el desarrollo.
