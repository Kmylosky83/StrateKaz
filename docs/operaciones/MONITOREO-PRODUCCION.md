# Guía de Monitoreo en Producción - StrateKaz

## Resumen

Esta guía documenta cómo configurar el monitoreo para StrateKaz en producción con cPanel.

---

## 1. Sentry - Error Tracking

### 1.1 Crear cuenta en Sentry

1. Ve a [sentry.io](https://sentry.io) y crea una cuenta gratuita
2. Crea un nuevo proyecto:
   - Platform: **Django**
   - Project name: `stratekaz-production`

### 1.2 Obtener el DSN

Después de crear el proyecto, Sentry te mostrará un DSN con este formato:
```
https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
```

### 1.3 Configurar en cPanel

1. Ve a **cPanel** → **Setup Python App**
2. Selecciona tu aplicación (ej: `grasas.stratekaz.com`)
3. En la sección **Environment variables**, agrega:

| Variable | Valor |
|----------|-------|
| `SENTRY_DSN` | `https://xxx@o123456.ingest.sentry.io/1234567` |
| `SENTRY_ENVIRONMENT` | `production` |
| `DEBUG` | `False` |

4. Haz clic en **Save** y luego **Restart**

### 1.4 Verificar que funciona

1. Accede a tu aplicación y genera un error (ej: visitar una URL que no existe)
2. Ve al dashboard de Sentry y verifica que el error aparece

### 1.5 Configurar alertas

En Sentry:
1. Ve a **Settings** → **Alerts**
2. Crea una regla:
   - **When**: An event is seen
   - **Filter**: `level:error`
   - **Then**: Send an email to `tu@email.com`

---

## 2. UptimeRobot - Monitoreo de Uptime

### 2.1 Crear cuenta

1. Ve a [uptimerobot.com](https://uptimerobot.com) y crea una cuenta gratuita
2. El plan gratuito permite hasta 50 monitores

### 2.2 Configurar monitores

#### Monitor Principal (Producción)
- **Monitor Type**: HTTP(s)
- **Friendly Name**: `StrateKaz - Producción`
- **URL**: `https://grasas.stratekaz.com/api/health/`
- **Monitoring Interval**: 5 minutes
- **Alert Contacts**: Tu email/SMS

#### Monitor de Health Check Profundo
- **Monitor Type**: HTTP(s)
- **Friendly Name**: `StrateKaz - Health Deep`
- **URL**: `https://grasas.stratekaz.com/api/health/deep/`
- **Monitoring Interval**: 15 minutes
- **Alert Contacts**: Tu email

#### Monitor de Staging (opcional)
- **Monitor Type**: HTTP(s)
- **Friendly Name**: `StrateKaz - Staging`
- **URL**: `https://staging.stratekaz.com/api/health/`
- **Monitoring Interval**: 5 minutes

### 2.3 Configurar alertas

1. Ve a **My Settings** → **Alert Contacts**
2. Agrega:
   - Email principal
   - Email de backup
   - SMS (si disponible en tu plan)

---

## 3. Health Check Endpoints

### 3.1 Endpoint Básico
```
GET /api/health/
```

**Respuesta exitosa (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "stratekaz-backend",
  "version": "1.0.0"
}
```

**Respuesta de error (503):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "service": "stratekaz-backend",
  "error": "Connection refused"
}
```

**Usar para:** UptimeRobot, monitoreo básico

### 3.2 Endpoint Profundo
```
GET /api/health/deep/
```

**Respuesta exitosa (200):**
```json
{
  "timestamp": "2026-01-11T10:30:00.123456",
  "service": "stratekaz-backend",
  "version": "1.0.0",
  "environment": "production",
  "overall_status": "healthy",
  "database": {
    "status": "connected",
    "migrations_count": 150
  },
  "disk": {
    "status": "ok",
    "free_gb": 45,
    "free_percent": 78.5,
    "path": "/home/strat/grasas.stratekaz.com/backend"
  },
  "cache": {
    "status": "connected",
    "backend": "DatabaseCache"
  },
  "logs": {
    "status": "ok",
    "total_size_mb": 12.5,
    "file_count": 3
  }
}
```

**Usar para:** Diagnóstico, verificación manual, alertas avanzadas

---

## 4. Rotación de Logs

### 4.1 Configuración actual

Los logs están configurados en `backend/config/settings.py`:
- **Tamaño máximo por archivo**: 15 MB
- **Archivos de backup**: 10
- **Total máximo**: ~150 MB

### 4.2 Ubicación de logs

```
~/grasas.stratekaz.com/backend/logs/
├── app.log          # Log general de aplicación
├── error.log        # Solo errores
└── security.log     # Eventos de seguridad
```

### 4.3 Script de limpieza manual (si es necesario)

Crear en `~/shared/scripts/cleanup_logs.sh`:
```bash
#!/bin/bash
# Limpieza de logs antiguos

LOG_DIR="$HOME/grasas.stratekaz.com/backend/logs"
DAYS_TO_KEEP=30

# Eliminar logs mayores a 30 días
find "$LOG_DIR" -name "*.log.*" -mtime +$DAYS_TO_KEEP -delete

echo "Limpieza completada: $(date)"
```

### 4.4 Configurar cron job (opcional)

En cPanel → Cron Jobs:
```
0 3 * * 0 /bin/bash ~/shared/scripts/cleanup_logs.sh >> ~/logs/cleanup.log 2>&1
```
(Ejecuta cada domingo a las 3 AM)

---

## 5. Dashboard de Monitoreo Recomendado

### Herramientas gratuitas recomendadas:

| Herramienta | Propósito | Costo |
|-------------|-----------|-------|
| **Sentry** | Error tracking | Gratis (5K eventos/mes) |
| **UptimeRobot** | Uptime monitoring | Gratis (50 monitores) |
| **Papertrail** | Log management (opcional) | Gratis (100 MB/mes) |

### Métricas a monitorear:

1. **Uptime**: >99.9%
2. **Tiempo de respuesta**: <500ms
3. **Errores por hora**: <5
4. **Espacio en disco**: >10% libre
5. **Tamaño de logs**: <100 MB

---

## 6. Checklist de Configuración

### Antes de ir a producción:

- [ ] Sentry DSN configurado en cPanel
- [ ] SENTRY_ENVIRONMENT=production
- [ ] DEBUG=False
- [ ] UptimeRobot monitor configurado para /api/health/
- [ ] Alertas de email configuradas
- [ ] Health check respondiendo correctamente
- [ ] Logs rotando correctamente

### Verificación post-deploy:

```bash
# Verificar health check básico
curl https://grasas.stratekaz.com/api/health/

# Verificar health check profundo
curl https://grasas.stratekaz.com/api/health/deep/
```

---

## 7. Troubleshooting

### Sentry no recibe eventos

1. Verificar que `DEBUG=False` en producción
2. Verificar que `SENTRY_DSN` está configurado correctamente
3. Reiniciar la aplicación en cPanel después de cambiar variables

### Health check falla

1. Verificar conexión a base de datos
2. Revisar logs en `backend/logs/error.log`
3. Verificar espacio en disco con `/api/health/deep/`

### UptimeRobot reporta caídas falsas

1. Aumentar el timeout a 30 segundos
2. Verificar que el servidor no está bloqueando IPs de UptimeRobot
3. Usar el endpoint básico `/api/health/` en lugar del profundo

---

**Documento creado:** 2026-01-11
**Última actualización:** 2026-01-11
