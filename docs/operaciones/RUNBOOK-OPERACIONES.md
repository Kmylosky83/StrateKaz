# Runbook de Operaciones - StrateKaz

## Resumen

Procedimientos operativos para gestionar StrateKaz en producción con cPanel.

---

## 1. Operaciones Diarias

### 1.1 Verificar Estado del Sistema

```bash
# Health check básico
curl https://grasas.stratekaz.com/api/health/

# Health check profundo
curl https://grasas.stratekaz.com/api/health/deep/
```

**Respuesta esperada (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "stratekaz-backend"
}
```

### 1.2 Revisar Logs

**Ubicación de logs en cPanel:**
```
~/grasas.stratekaz.com/backend/logs/
├── app.log       # Log general
├── error.log     # Solo errores
└── security.log  # Eventos de seguridad
```

**Comandos útiles (SSH):**
```bash
# Últimas 50 líneas de errores
tail -50 ~/grasas.stratekaz.com/backend/logs/error.log

# Buscar errores específicos
grep "ERROR" ~/grasas.stratekaz.com/backend/logs/app.log | tail -20

# Tamaño de logs
du -sh ~/grasas.stratekaz.com/backend/logs/
```

---

## 2. Reinicio de Servicios

### 2.1 Reiniciar Aplicación Python

**Método 1: cPanel UI**
1. Ir a cPanel → Setup Python App
2. Seleccionar la aplicación
3. Click "Restart"

**Método 2: SSH (Touch)**
```bash
touch ~/grasas.stratekaz.com/backend/tmp/restart.txt
```

**Método 3: SSH (Recrear passenger)**
```bash
cd ~/grasas.stratekaz.com/backend
rm -rf tmp/
mkdir tmp
touch tmp/restart.txt
```

### 2.2 Cuándo Reiniciar

- Después de cambiar variables de entorno
- Después de actualizar código
- Si la aplicación no responde
- Después de cambios en settings.py

---

## 3. Despliegue de Actualizaciones

### 3.1 Actualización de Código

```bash
# 1. Conectar por SSH
ssh usuario@servidor

# 2. Navegar al directorio
cd ~/grasas.stratekaz.com/backend

# 3. Activar virtualenv
source ~/virtualenv/grasas/3.11/bin/activate

# 4. Actualizar código (si usas git)
git pull origin main

# 5. Instalar dependencias nuevas
pip install -r requirements-cpanel.txt

# 6. Ejecutar migraciones
python manage.py migrate --noinput

# 7. Collectstatic
python manage.py collectstatic --noinput

# 8. Reiniciar
touch tmp/restart.txt
```

### 3.2 Actualización de Frontend

```bash
# 1. En local: construir
cd frontend
npm run build

# 2. Comprimir dist
zip -r frontend-dist.zip dist/

# 3. Subir a cPanel File Manager
# Ruta: ~/grasas.stratekaz.com/public_html/

# 4. Extraer y reemplazar
```

### 3.3 Rollback de Emergencia

```bash
# 1. Restaurar código anterior
cd ~/grasas.stratekaz.com/backend
git checkout HEAD~1

# 2. Reinstalar dependencias
pip install -r requirements-cpanel.txt

# 3. Reiniciar
touch tmp/restart.txt

# 4. Verificar
curl https://grasas.stratekaz.com/api/health/
```

---

## 4. Gestión de Base de Datos

### 4.1 Backup Manual

**Desde cPanel:**
1. cPanel → phpMyAdmin
2. Seleccionar base de datos
3. Exportar → SQL → Descargar

**Desde SSH:**
```bash
mysqldump -u strat_grasas_usr -p strat_grasas_sgi > backup_$(date +%Y%m%d).sql
```

### 4.2 Restaurar Backup

```bash
mysql -u strat_grasas_usr -p strat_grasas_sgi < backup_20260111.sql
```

### 4.3 Verificar Migraciones

```bash
cd ~/grasas.stratekaz.com/backend
source ~/virtualenv/grasas/3.11/bin/activate
python manage.py showmigrations
```

---

## 5. Troubleshooting

### 5.1 Error 500 - Internal Server Error

**Diagnóstico:**
```bash
# Revisar error_log de Apache/Passenger
tail -50 ~/logs/error.log

# Revisar logs de Django
tail -50 ~/grasas.stratekaz.com/backend/logs/error.log
```

**Causas comunes:**
- Variable de entorno faltante → Verificar .env
- Error de sintaxis en código → Revisar último commit
- Base de datos no conecta → Verificar credenciales DB
- Permisos de archivos → Correr chmod 755

### 5.2 Error 502/503 - Bad Gateway / Service Unavailable

**Diagnóstico:**
```bash
# Verificar que Python App está corriendo
ls -la ~/virtualenv/grasas/3.11/bin/

# Verificar passenger_wsgi.py
cat ~/grasas.stratekaz.com/backend/passenger_wsgi.py
```

**Solución:**
1. Reiniciar Python App en cPanel
2. Si persiste, recrear el virtualenv

### 5.3 Base de Datos No Conecta

**Diagnóstico:**
```bash
# Verificar credenciales en .env
grep DB_ ~/grasas.stratekaz.com/backend/.env

# Probar conexión manual
mysql -u strat_grasas_usr -p strat_grasas_sgi -e "SELECT 1;"
```

**Solución:**
1. Verificar que el usuario tiene permisos en cPanel → MySQL Databases
2. Verificar que el password es correcto
3. Verificar que el nombre de BD incluye prefijo del usuario cPanel

### 5.4 Static Files No Cargan (404)

**Diagnóstico:**
```bash
ls -la ~/grasas.stratekaz.com/backend/staticfiles/
```

**Solución:**
```bash
cd ~/grasas.stratekaz.com/backend
source ~/virtualenv/grasas/3.11/bin/activate
python manage.py collectstatic --noinput
```

### 5.5 Errores de CORS

**Síntoma:** Frontend no puede conectar al API

**Diagnóstico:**
```bash
grep CORS ~/grasas.stratekaz.com/backend/.env
```

**Solución:**
Verificar que `CORS_ALLOWED_ORIGINS` incluye la URL del frontend:
```
CORS_ALLOWED_ORIGINS=https://grasas.stratekaz.com
```

---

## 6. Monitoreo

### 6.1 Sentry (Error Tracking)

**Dashboard:** https://sentry.io

**Verificar configuración:**
```bash
grep SENTRY ~/grasas.stratekaz.com/backend/.env
```

**Variables requeridas:**
```
SENTRY_DSN=https://xxx@o123456.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=production
```

### 6.2 UptimeRobot

**Dashboard:** https://uptimerobot.com

**Monitores configurados:**
- `https://grasas.stratekaz.com/api/health/` (cada 5 min)
- `https://grasas.stratekaz.com/api/health/deep/` (cada 15 min)

### 6.3 Espacio en Disco

```bash
# Uso general
df -h ~/

# Tamaño de logs
du -sh ~/grasas.stratekaz.com/backend/logs/

# Tamaño de media
du -sh ~/grasas.stratekaz.com/backend/media/
```

---

## 7. Mantenimiento Programado

### 7.1 Limpieza Semanal

**Cron job recomendado (domingos 3 AM):**
```bash
# Limpiar logs antiguos
find ~/grasas.stratekaz.com/backend/logs/ -name "*.log.*" -mtime +30 -delete

# Limpiar archivos temporales
find ~/grasas.stratekaz.com/backend/tmp/ -type f -mtime +7 -delete
```

### 7.2 Backup Semanal

**Automático:** JetBackups en cPanel (verificar configuración)

**Manual:** Ver sección 4.1

### 7.3 Actualización de Dependencias (Mensual)

```bash
# Verificar vulnerabilidades
pip-audit

# Actualizar si es seguro
pip install --upgrade -r requirements-cpanel.txt
```

---

## 8. Contactos de Emergencia

| Rol | Contacto |
|-----|----------|
| DevOps | devops@stratekaz.com |
| Soporte Hosting | Soporte cPanel |
| Desarrollo | dev@stratekaz.com |

---

## 9. Checklist de Verificación Post-Incidente

- [ ] Sistema respondiendo (health check OK)
- [ ] Usuarios pueden hacer login
- [ ] Operaciones CRUD funcionando
- [ ] Logs sin errores nuevos
- [ ] Sentry sin nuevos issues
- [ ] UptimeRobot en verde
- [ ] Documentar incidente en el log

---

**Documento creado:** 2026-01-11
**Última actualización:** 2026-01-11
