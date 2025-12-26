# Sistema de Backups

El sistema incluye scripts de backup/restore para base de datos y archivos media.

## Backups de Base de Datos

### Backup Manual

```bash
# Usando Django dumpdata
docker-compose exec backend python manage.py dumpdata \
  --exclude auth.permission \
  --exclude contenttypes \
  --indent 2 \
  > backup_$(date +%Y%m%d_%H%M%S).json

# Usando mysqldump (más rápido para BD grandes)
docker-compose exec mysql mysqldump \
  -u root -p$MYSQL_ROOT_PASSWORD \
  grasas_huesos_db \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup Automático (Celery Beat)

Configurado para ejecutar cada 6 horas:

```python
# backend/config/celery.py
app.conf.beat_schedule = {
    'backup-database': {
        'task': 'apps.core.tasks.backup_database',
        'schedule': crontab(hour='*/6'),
    },
}
```

### Tarea de Backup

```python
# apps/core/tasks.py
from celery import shared_task
from django.core.management import call_command
from datetime import datetime
import os

@shared_task
def backup_database():
    """Genera backup de la base de datos."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'backup_{timestamp}.json'
    filepath = os.path.join('/app/backups', filename)

    with open(filepath, 'w') as f:
        call_command(
            'dumpdata',
            '--exclude', 'auth.permission',
            '--exclude', 'contenttypes',
            '--indent', '2',
            stdout=f
        )

    # Limpiar backups antiguos (mantener últimos 30)
    cleanup_old_backups('/app/backups', keep=30)

    return f'Backup created: {filename}'
```

---

## Restore de Base de Datos

### Desde JSON (dumpdata)

```bash
# Restore completo
docker-compose exec backend python manage.py loaddata backup.json

# Restore específico (solo una app)
docker-compose exec backend python manage.py loaddata backup.json --app core
```

### Desde SQL (mysqldump)

```bash
# Restore desde SQL
docker-compose exec -T mysql mysql \
  -u root -p$MYSQL_ROOT_PASSWORD \
  grasas_huesos_db \
  < backup.sql
```

### Precauciones

```bash
# SIEMPRE hacer backup antes de restore
docker-compose exec backend python manage.py dumpdata > pre_restore_backup.json

# Verificar integridad después de restore
docker-compose exec backend python manage.py check
docker-compose exec backend python manage.py migrate --check
```

---

## Backups de Media Files

Los archivos subidos (logos, documentos, imágenes) requieren backup separado.

### Desarrollo

```bash
# Backup de media
tar -czvf media_backup_$(date +%Y%m%d).tar.gz backend/media/

# Restore de media
tar -xzvf media_backup_20251224.tar.gz -C backend/
```

### Producción (AWS S3)

```python
# settings.py (producción)
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = 'grasas-huesos-media'
AWS_S3_REGION_NAME = 'us-east-1'
```

S3 tiene versionado y lifecycle policies automáticos.

---

## Política de Retención

| Tipo | Frecuencia | Retención |
|------|------------|-----------|
| Base de datos | Cada 6 horas | 30 días |
| Logs | Diario | 30 días |
| Media files | Semanal | 90 días |

### Script de Limpieza

```python
import os
from datetime import datetime, timedelta

def cleanup_old_backups(directory: str, keep: int = 30):
    """Elimina backups más antiguos que 'keep' días."""
    cutoff = datetime.now() - timedelta(days=keep)

    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
            if file_time < cutoff:
                os.remove(filepath)
                print(f'Deleted: {filename}')
```

---

## Verificación de Backups

### Test de Restore Periódico

```bash
# 1. Crear base de datos de prueba
docker-compose exec mysql mysql -u root -p$MYSQL_ROOT_PASSWORD \
  -e "CREATE DATABASE test_restore;"

# 2. Restore en BD de prueba
docker-compose exec -T mysql mysql \
  -u root -p$MYSQL_ROOT_PASSWORD \
  test_restore \
  < latest_backup.sql

# 3. Verificar integridad
docker-compose exec mysql mysql -u root -p$MYSQL_ROOT_PASSWORD \
  -e "SELECT COUNT(*) FROM test_restore.core_user;"

# 4. Limpiar
docker-compose exec mysql mysql -u root -p$MYSQL_ROOT_PASSWORD \
  -e "DROP DATABASE test_restore;"
```

---

## Alertas de Backup

```python
# apps/core/tasks.py
@shared_task
def backup_database():
    try:
        # ... hacer backup
        log_info("Backup completado", extra={"filename": filename})
    except Exception as e:
        log_error("Backup fallido", exc_info=e)
        # Enviar alerta
        send_alert_email(
            subject="ALERTA: Backup fallido",
            message=str(e)
        )
        raise
```

---

## Documentación Relacionada

- [CI-CD.md](CI-CD.md) - Pipelines automatizados
- [DESPLIEGUE.md](DESPLIEGUE.md) - Guía de deployment
