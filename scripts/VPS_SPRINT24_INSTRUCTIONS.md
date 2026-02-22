# Sprint 24 — Instrucciones VPS (Ejecutar en Terminal hPanel)

## Pre-requisito
```bash
cd /opt/stratekaz
```

---

## A3: Redis Password

### 1. Generar password seguro
```bash
openssl rand -base64 32
# Copiar el resultado, ej: xK9mN2pQ7rS4tU6vW8yA1bC3dE5fG7h
```

### 2. Configurar Redis
```bash
sudo nano /etc/redis/redis.conf
```
Buscar `# requirepass foobared` y cambiar por:
```
requirepass TU_PASSWORD_GENERADO
```
Guardar y salir (Ctrl+X, Y, Enter).

### 3. Reiniciar Redis
```bash
sudo systemctl restart redis-server
redis-cli -a TU_PASSWORD_GENERADO ping
# Debe responder: PONG
```

### 4. Actualizar .env del backend
```bash
nano /opt/stratekaz/backend/.env
```
Agregar/actualizar:
```
REDIS_URL=redis://:TU_PASSWORD_GENERADO@localhost:6379/0
CELERY_BROKER_URL=redis://:TU_PASSWORD_GENERADO@localhost:6379/0
CELERY_RESULT_BACKEND=redis://:TU_PASSWORD_GENERADO@localhost:6379/1
```

### 5. Reiniciar servicios
```bash
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

### 6. Verificar
```bash
sudo systemctl status stratekaz-celery | head -15
# Debe estar active (running)
```

---

## M3: Log Rotation

### 1. Crear directorio de logs si no existe
```bash
sudo mkdir -p /var/log/stratekaz/celery
sudo chown -R www-data:www-data /var/log/stratekaz
```

### 2. Instalar config logrotate
```bash
sudo cp /opt/stratekaz/scripts/logrotate-stratekaz.conf /etc/logrotate.d/stratekaz
```

### 3. Verificar config
```bash
sudo logrotate -d /etc/logrotate.d/stratekaz
# Debe mostrar "rotating pattern: /var/log/stratekaz/*.log" sin errores
```

### 4. Test manual (forzar rotacion)
```bash
sudo logrotate -f /etc/logrotate.d/stratekaz
ls -la /var/log/stratekaz/
```

---

## M4: Sentry DSN (Backend + Frontend)

### 1. Crear proyecto en Sentry
- Ir a https://sentry.io
- Crear organizacion "StrateKaz" si no existe
- Crear proyecto "stratekaz-backend" (Django)
- Crear proyecto "stratekaz-frontend" (React)
- Copiar los DSN de cada uno

### 2. Configurar backend
```bash
nano /opt/stratekaz/backend/.env
```
Agregar:
```
SENTRY_DSN=https://xxxxx@oNNNN.ingest.sentry.io/NNNNN
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

### 3. Configurar frontend (en el build)
El frontend lee `VITE_SENTRY_DSN` durante el build:
```bash
cd /opt/stratekaz/frontend
VITE_API_URL=https://app.stratekaz.com/api \
VITE_BASE_DOMAIN=stratekaz.com \
VITE_SENTRY_DSN=https://yyyyy@oNNNN.ingest.sentry.io/NNNNN \
VITE_SENTRY_ENVIRONMENT=production \
npm run build
```

### 4. Reiniciar backend
```bash
sudo systemctl restart stratekaz-gunicorn
```

### 5. Verificar
- Backend: Hacer una request que genere error 500, verificar en Sentry dashboard
- Frontend: Abrir DevTools > Console, verificar que no hay errores de Sentry init

---

## M5: Backup Cron

### 1. Verificar que el script existe y es ejecutable
```bash
chmod +x /opt/stratekaz/scripts/backup_tenants.sh
```

### 2. Crear directorio de backups
```bash
sudo mkdir -p /var/backups/stratekaz/{full,schemas}
sudo chown -R postgres:postgres /var/backups/stratekaz
```

### 3. Configurar crontab
```bash
sudo crontab -e
```
Agregar al final:
```
# StrateKaz DB Backup - Diario a las 2AM
0 2 * * * /opt/stratekaz/scripts/backup_tenants.sh >> /var/log/stratekaz/backup.log 2>&1
```

### 4. Verificar cron
```bash
sudo crontab -l | grep stratekaz
# Debe mostrar la linea del backup
```

### 5. Test manual
```bash
sudo /opt/stratekaz/scripts/backup_tenants.sh
ls -la /var/backups/stratekaz/full/
ls -la /var/backups/stratekaz/schemas/
```

---

## Orden de ejecucion recomendado

1. **A3** (Redis password) — Mas critico para seguridad
2. **M3** (Log rotation) — Evitar logs gigantes
3. **M5** (Backup cron) — Proteger datos
4. **M4** (Sentry) — Observabilidad (menos urgente)

---

## Post-deploy: Verificar todo
```bash
# Servicios activos
sudo systemctl status stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat redis-server nginx

# Redis con password
redis-cli -a TU_PASSWORD ping

# Logs rotando
ls -la /var/log/stratekaz/

# Backup existe
ls -la /var/backups/stratekaz/full/

# Health check
curl -s https://app.stratekaz.com/api/health/ | python3 -m json.tool
```
