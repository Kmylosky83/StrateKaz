# Guía de Despliegue en cPanel Corporativo
## SGI - Sistema de Gestión Integral

**Versión:** 2.0
**Última Actualización:** 2025-12-30
**Modelo:** Unitenant - Múltiples Empresas con DBs Separadas

---

## Tabla de Contenidos

1. [Resumen de Infraestructura](#1-resumen-de-infraestructura)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Despliegue de Nueva Empresa](#3-despliegue-de-nueva-empresa)
4. [Configuración Detallada](#4-configuración-detallada)
5. [Alternativas a Redis/Celery](#5-alternativas-a-rediscelery)
6. [Actualizaciones y Mantenimiento](#6-actualizaciones-y-mantenimiento)
7. [Troubleshooting](#7-troubleshooting)
8. [Scripts de Automatización](#8-scripts-de-automatización)
9. [Rollback y Recuperación](#9-rollback-y-recuperación)
10. [Checklist de Verificación](#10-checklist-de-verificación)

---

## 1. Resumen de Infraestructura

### 1.1 Servidor cPanel Corporativo

| Recurso | Especificación | Capacidad |
|---------|----------------|-----------|
| **Plan** | cPanel Multi Estilo | Corporativo |
| **RAM** | 6 GB | ~600 MB por empresa |
| **CPU** | 2 Cores | Compartido |
| **Disco SSD** | Ilimitado | ~1 GB por empresa |
| **MySQL** | v8.0 - Ilimitadas | 1 DB por empresa |
| **Python** | 3.9+ | Via Python Selector |
| **SSL** | Let's Encrypt Gratis | 1 por subdominio |
| **Costo** | USD $90/año | ~$9/empresa/año |

### 1.2 Modelo de Despliegue: Unitenant

```
┌─────────────────────────────────────────────────────────────┐
│              CPANEL CORPORATIVO stratekaz.com               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Empresa 1  │ │  Empresa 2  │ │  Empresa N  │  (max 10) │
│  │             │ │             │ │             │           │
│  │ subdominio1 │ │ subdominio2 │ │ subdominioN │           │
│  │ .stratekaz  │ │ .stratekaz  │ │ .stratekaz  │           │
│  │    .com     │ │    .com     │ │    .com     │           │
│  │             │ │             │ │             │           │
│  │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │           │
│  │  │Django │  │ │  │Django │  │ │  │Django │  │           │
│  │  └───────┘  │ │  └───────┘  │ │  └───────┘  │           │
│  │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │           │
│  │  │ MySQL │  │ │  │ MySQL │  │ │  │ MySQL │  │           │
│  │  │  DB1  │  │ │  │  DB2  │  │ │  │  DBN  │  │           │
│  │  └───────┘  │ │  └───────┘  │ │  └───────┘  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RECURSOS COMPARTIDOS                    │   │
│  │  • SSL AutoSSL  • Jetbackups  • Cron Jobs           │   │
│  │  • Email Server • LiteSpeed   • SSH Access          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Empresas Configuradas

| # | Empresa | Subdominio | Base de Datos | Estado |
|---|---------|------------|---------------|--------|
| 1 | StrateKaz | grasas.stratekaz.com | strat_grasas_sgi | **Producción** |
| 2 | Demo Comercial | demo.stratekaz.com | strat_demo_sgi | Activo |
| 3 | Staging/QA | staging.stratekaz.com | strat_staging_sgi | Activo |
| 4-10 | (Reservados) | clienteN.stratekaz.com | strat_clienteN_sgi | Disponible |

---

## 2. Requisitos Previos

### 2.1 Accesos Necesarios

- [ ] Usuario y contraseña de cPanel
- [ ] Acceso SSH habilitado
- [ ] Acceso al repositorio GitHub

### 2.2 Información de la Empresa a Desplegar

Antes de comenzar, recopilar:

```
Nombre de empresa:     ____________________
Identificador corto:   ____________________ (ej: "grasas", max 8 chars)
NIT:                   ____________________
Email admin:           ____________________
Logo (PNG/SVG):        ____________________
Módulos a activar:     ____________________
```

### 2.3 Convención de Nombres

```
Subdominio:     {identificador}.stratekaz.com
Base de datos:  strat_{identificador}_sgi
Usuario DB:     strat_{identificador}_usr
Email:          noreply@{identificador}.stratekaz.com
Directorio:     ~/{identificador}.stratekaz.com/
```

> **Importante:** Los nombres de DB y usuario están limitados a **16 caracteres** en cPanel.
> El prefijo `strat_` (6 chars) deja 10 chars para el identificador.

---

## 3. Despliegue de Nueva Empresa

### Paso 1: Crear Subdominio

**cPanel > Domains > Subdomains**

1. Subdomain: `{identificador}` (ej: `grasas`)
2. Domain: `stratekaz.com`
3. Document Root: `/home/strat/{identificador}.stratekaz.com/public_html`
4. Click **Create**

### Paso 2: Crear Base de Datos MySQL

**cPanel > MySQL Databases**

1. **Crear base de datos:**
   - Nombre: `{identificador}_sgi`
   - Resultado: `strat_{identificador}_sgi`

2. **Crear usuario:**
   - Usuario: `{identificador}_usr`
   - Password: Generar uno seguro (guardar en lugar seguro)
   - Resultado: `strat_{identificador}_usr`

3. **Asignar usuario a base de datos:**
   - Seleccionar **ALL PRIVILEGES**
   - Click **Make Changes**

4. **Configurar charset UTF8MB4:**

```sql
-- En phpMyAdmin o vía SSH
ALTER DATABASE strat_{identificador}_sgi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Paso 3: Configurar Python App

**cPanel > Setup Python App**

1. Click **CREATE APPLICATION**
2. Configurar:
   - Python version: `3.9`
   - Application root: `{identificador}.stratekaz.com`
   - Application URL: `{identificador}.stratekaz.com`
   - Application startup file: `passenger_wsgi.py`
   - Application Entry point: `application`
3. Click **CREATE**
4. **Anotar la ruta del virtualenv:**
   ```
   /home/strat/virtualenv/{identificador}.stratekaz.com/3.9/bin/python
   ```

### Paso 4: Subir Código

**Vía SSH (Recomendado):**

```bash
# Conectar
ssh strat@stratekaz.com

# Ir al directorio
cd ~/{identificador}.stratekaz.com

# Clonar repositorio
git clone https://github.com/Kmylosky83/Grasas-Huesos-SGI.git .

# Crear directorios necesarios
mkdir -p tmp logs backend/logs backend/media
```

### Paso 5: Configurar Variables de Entorno

```bash
# Copiar template
cp deploy/cpanel/.env.staging backend/.env

# Editar con los valores de la empresa
nano backend/.env
```

**Contenido del `.env`:**

```env
# ============================================
# EMPRESA: {NOMBRE_EMPRESA}
# Identificador: {identificador}
# Fecha Creación: YYYY-MM-DD
# ============================================

# === IDENTIFICACIÓN ===
EMPRESA_ID={identificador}
EMPRESA_NOMBRE="{Nombre Completo de la Empresa}"
ENVIRONMENT=production

# === DJANGO ===
SECRET_KEY={generar-clave-única-64-chars}
DEBUG=False
ALLOWED_HOSTS={identificador}.stratekaz.com
DJANGO_LOG_LEVEL=WARNING

# === BASE DE DATOS ===
DB_NAME=strat_{identificador}_sgi
DB_USER=strat_{identificador}_usr
DB_PASSWORD={password-generado-paso-2}
DB_HOST=localhost
DB_PORT=3306

# === CORS/CSRF ===
CORS_ALLOWED_ORIGINS=https://{identificador}.stratekaz.com
CSRF_TRUSTED_ORIGINS=https://{identificador}.stratekaz.com

# === JWT ===
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# === EMAIL ===
EMAIL_HOST=mail.stratekaz.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@{identificador}.stratekaz.com
EMAIL_HOST_PASSWORD={password-email}
DEFAULT_FROM_EMAIL=SGI <noreply@{identificador}.stratekaz.com>

# === CACHE (Alternativa a Redis) ===
CACHE_BACKEND=django.core.cache.backends.db.DatabaseCache
CACHE_LOCATION=cache_table

# === TAREAS (Alternativa a Celery) ===
CELERY_TASK_ALWAYS_EAGER=True
USE_CRON_JOBS=True

# === NEGOCIO (ajustar según empresa) ===
# PRECIO_COMPRA_ECONORTE=3500
# PRECIO_REFERENCIA_COMISION=3000
# COMISION_FIJA_POR_KILO=100
```

**Generar SECRET_KEY:**

```bash
# Opción 1: Con Python
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Opción 2: Con OpenSSL
openssl rand -base64 64 | tr -d '\n'
```

### Paso 6: Instalar Dependencias

```bash
# Activar virtualenv
source ~/virtualenv/{identificador}.stratekaz.com/3.9/bin/activate

# Ir al backend
cd ~/{identificador}.stratekaz.com/backend

# Actualizar pip
pip install --upgrade pip setuptools wheel

# Instalar dependencias
pip install -r requirements.txt

# Instalar PyMySQL (alternativa a mysqlclient que no requiere compilación)
pip install PyMySQL
```

**Configurar PyMySQL en passenger_wsgi.py:**

```python
# Al inicio del archivo passenger_wsgi.py, agregar:
import pymysql
pymysql.install_as_MySQLdb()
```

### Paso 7: Ejecutar Migraciones

```bash
# Con virtualenv activado
cd ~/{identificador}.stratekaz.com/backend

# Verificar conexión a DB
python manage.py check

# Ejecutar migraciones
python manage.py migrate

# Crear tabla de cache
python manage.py createcachetable

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

# Crear superusuario
python manage.py createsuperuser
```

### Paso 8: Configurar Frontend

**Opción A: Build local y subir**

```bash
# En tu máquina local
cd frontend

# Crear .env.production
echo "VITE_API_URL=https://{identificador}.stratekaz.com/api" > .env.production

# Build
npm run build

# Subir dist/ al servidor
rsync -avz dist/ strat@stratekaz.com:~/{identificador}.stratekaz.com/public_html/
```

**Opción B: Usar build pre-compilado**

```bash
# En el servidor
cd ~/{identificador}.stratekaz.com

# Copiar frontend pre-compilado
cp -r deploy/cpanel/frontend-dist/* public_html/
```

**Crear `.htaccess` en public_html:**

```apache
# ~/{identificador}.stratekaz.com/public_html/.htaccess

# Forzar HTTPS
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Redirect HTTP to HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # SPA Routing - Redirigir a index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>

# Seguridad
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Cache de assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>
```

### Paso 9: Configurar SSL

**cPanel > SSL/TLS Status**

1. Buscar: `{identificador}.stratekaz.com`
2. Click **Run AutoSSL**
3. Esperar instalación (2-5 minutos)
4. Verificar candado verde en navegador

### Paso 10: Reiniciar y Verificar

**Reiniciar aplicación:**

```bash
# Método 1: Touch restart.txt
touch ~/{identificador}.stratekaz.com/tmp/restart.txt

# Método 2: Via cPanel > Setup Python App > RESTART
```

**Verificar despliegue:**

```bash
# Test API
curl -I https://{identificador}.stratekaz.com/api/health/
# Esperado: HTTP/2 200

# Test Frontend
curl -I https://{identificador}.stratekaz.com/
# Esperado: HTTP/2 200
```

---

## 4. Configuración Detallada

### 4.1 Estructura de Directorios

```
~/{identificador}.stratekaz.com/
├── passenger_wsgi.py           # Entry point WSGI
├── tmp/
│   └── restart.txt             # Touch para reiniciar
├── logs/
│   └── django.log              # Logs de la aplicación
├── backend/
│   ├── .env                    # Variables de entorno (ÚNICO por empresa)
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/                   # Todos los módulos Django
│   ├── staticfiles/            # Archivos estáticos (collectstatic)
│   ├── media/                  # Archivos subidos por usuarios
│   ├── requirements.txt
│   └── manage.py
└── public_html/                # Frontend React
    ├── index.html
    ├── .htaccess
    └── assets/
        ├── index-[hash].js
        └── index-[hash].css
```

### 4.2 Archivo passenger_wsgi.py

```python
"""
Passenger WSGI Configuration for cPanel
SGI - Sistema de Gestión Integral
"""
import os
import sys

# Configurar PyMySQL antes de importar Django
import pymysql
pymysql.install_as_MySQLdb()

# Rutas del proyecto
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, 'backend')

# Agregar backend al path
sys.path.insert(0, BACKEND_DIR)

# Cargar variables de entorno
from dotenv import load_dotenv
env_path = os.path.join(BACKEND_DIR, '.env')
load_dotenv(env_path)

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Crear aplicación WSGI
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 4.3 Configuración de Email por Empresa

**cPanel > Email Accounts**

1. Crear cuenta: `noreply@{identificador}.stratekaz.com`
2. Password: Generar y guardar
3. Actualizar `.env` con el password

**Configurar SPF (opcional pero recomendado):**

```
cPanel > Zone Editor > {identificador}.stratekaz.com > Add Record

Type: TXT
Name: {identificador}.stratekaz.com
Value: v=spf1 a mx ~all
```

---

## 5. Alternativas a Redis/Celery

### 5.1 Cache con Base de Datos

En cPanel no hay Redis disponible. Usar Django Database Cache:

```python
# settings.py (ya configurado)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}
```

Crear tabla:
```bash
python manage.py createcachetable
```

### 5.2 Tareas Programadas con Cron Jobs

En lugar de Celery workers, usar Cron Jobs de cPanel:

**cPanel > Cron Jobs**

| Tarea | Comando | Frecuencia |
|-------|---------|------------|
| Limpiar sesiones | `cd ~/grasas.stratekaz.com/backend && /home/strat/virtualenv/grasas.stratekaz.com/3.9/bin/python manage.py clearsessions` | Diario 2am |
| Procesar tareas | `cd ~/grasas.stratekaz.com/backend && /home/strat/virtualenv/grasas.stratekaz.com/3.9/bin/python manage.py process_pending_tasks` | Cada hora |
| Generar reportes | `cd ~/grasas.stratekaz.com/backend && /home/strat/virtualenv/grasas.stratekaz.com/3.9/bin/python manage.py generate_reports` | Diario 6am |
| Backup DB | `~/shared/scripts/backup_single_db.sh grasas` | Diario 3am |

### 5.3 Tareas Síncronas (CELERY_TASK_ALWAYS_EAGER)

Con `CELERY_TASK_ALWAYS_EAGER=True`, las tareas Celery se ejecutan inmediatamente en el mismo proceso:

```python
# Esto funciona sin cambios
from apps.core.tasks import send_notification_email

# Se ejecuta sincrónicamente (no en background)
send_notification_email.delay(user_id=1, message="Hola")
```

> **Nota:** Operaciones muy largas (> 30 segundos) pueden causar timeout.
> Dividir en operaciones más pequeñas si es necesario.

---

## 6. Actualizaciones y Mantenimiento

### 6.1 Actualizar Código de Una Empresa

```bash
# Conectar al servidor
ssh strat@stratekaz.com

# Ir al directorio de la empresa
cd ~/grasas.stratekaz.com

# Backup del .env
cp backend/.env backend/.env.backup

# Pull del código
git fetch origin main
git reset --hard origin/main

# Restaurar .env
mv backend/.env.backup backend/.env

# Activar virtualenv
source ~/virtualenv/grasas.stratekaz.com/3.9/bin/activate

# Actualizar dependencias
cd backend
pip install -r requirements.txt

# Migraciones
python manage.py migrate

# Static files
python manage.py collectstatic --noinput

# Reiniciar
touch ../tmp/restart.txt
```

### 6.2 Actualizar Todas las Empresas

```bash
# Usar script de sincronización
~/shared/scripts/sync_all_empresas.sh
```

Ver sección [8. Scripts de Automatización](#8-scripts-de-automatización).

### 6.3 Actualizar Solo Frontend

```bash
# En máquina local
cd frontend
npm run build

# Subir a empresa específica
rsync -avz --delete dist/ strat@stratekaz.com:~/grasas.stratekaz.com/public_html/
```

---

## 7. Troubleshooting

### 7.1 Tabla de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| **500 Internal Server Error** | Error en código o config | Ver logs: `tail -100 ~/logs/{empresa}-error.log` |
| **502 Bad Gateway** | Passenger no inició | Verificar `passenger_wsgi.py`, reiniciar app |
| **403 Forbidden** | Permisos incorrectos | `chmod -R 755 ~/empresa.stratekaz.com` |
| **Database connection refused** | Credenciales incorrectas | Verificar `.env`: DB_NAME, DB_USER, DB_PASSWORD |
| **ModuleNotFoundError** | Dependencia faltante | `pip install -r requirements.txt` |
| **Static files 404** | collectstatic no ejecutado | `python manage.py collectstatic --noinput` |
| **CORS error** | Origen no permitido | Verificar `CORS_ALLOWED_ORIGINS` en `.env` |
| **CSRF error** | Token inválido | Verificar `CSRF_TRUSTED_ORIGINS` en `.env` |

### 7.2 Verificar Logs

```bash
# Logs del servidor web (Apache/LiteSpeed)
tail -100 ~/logs/{empresa}.stratekaz.com-error.log

# Logs de Django (si están configurados)
tail -100 ~/{empresa}.stratekaz.com/backend/logs/django.log

# Ver logs en tiempo real
tail -f ~/logs/{empresa}.stratekaz.com-error.log
```

### 7.3 Verificar Conexión a Base de Datos

```bash
# Activar virtualenv
source ~/virtualenv/{empresa}.stratekaz.com/3.9/bin/activate

# Test con Django
cd ~/{empresa}.stratekaz.com/backend
python manage.py shell

>>> from django.db import connection
>>> cursor = connection.cursor()
>>> cursor.execute("SELECT 1")
>>> print(cursor.fetchone())
(1,)  # ← Conexión exitosa
```

### 7.4 Reiniciar Aplicación

```bash
# Método 1: Touch restart.txt (más rápido)
touch ~/{empresa}.stratekaz.com/tmp/restart.txt

# Método 2: Via cPanel UI
# cPanel > Setup Python App > RESTART

# Método 3: Matar proceso (último recurso)
pkill -f "Passenger.*{empresa}.stratekaz.com"
```

### 7.5 Verificar Permisos

```bash
# Permisos recomendados
chmod 755 ~/{empresa}.stratekaz.com
chmod 755 ~/{empresa}.stratekaz.com/public_html
chmod 644 ~/{empresa}.stratekaz.com/public_html/*
chmod 600 ~/{empresa}.stratekaz.com/backend/.env
chmod 755 ~/{empresa}.stratekaz.com/backend/staticfiles
chmod 755 ~/{empresa}.stratekaz.com/backend/media
```

---

## 8. Scripts de Automatización

### 8.1 Script: Sincronizar Todas las Empresas

Ubicación: `~/shared/scripts/sync_all_empresas.sh`

```bash
#!/bin/bash
# Sincroniza código base a todas las empresas activas

EMPRESAS=("grasas" "demo" "staging")
BASE_DIR="/home/strat"

echo "=== Sincronización de Código Base ==="
echo "Fecha: $(date)"

for EMPRESA in "${EMPRESAS[@]}"; do
    EMPRESA_DIR="$BASE_DIR/$EMPRESA.stratekaz.com"

    echo ""
    echo "--- $EMPRESA ---"

    if [ ! -d "$EMPRESA_DIR" ]; then
        echo "✗ Directorio no existe"
        continue
    fi

    cd "$EMPRESA_DIR"

    # Backup .env
    cp backend/.env backend/.env.backup

    # Pull código
    git fetch origin main
    git reset --hard origin/main

    # Restaurar .env
    mv backend/.env.backup backend/.env

    # Actualizar dependencias
    source "$BASE_DIR/virtualenv/$EMPRESA.stratekaz.com/3.9/bin/activate"
    pip install -r backend/requirements.txt -q

    # Migraciones
    cd backend
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput

    # Reiniciar
    touch ../tmp/restart.txt

    echo "✓ $EMPRESA sincronizado"
done

echo ""
echo "=== Sincronización Completa ==="
```

### 8.2 Script: Backup de Base de Datos

Ubicación: `~/shared/scripts/backup_single_db.sh`

```bash
#!/bin/bash
# Uso: ./backup_single_db.sh {identificador}

EMPRESA=$1
BACKUP_DIR="/home/strat/shared/backups"
DATE=$(date +%Y%m%d_%H%M%S)

if [ -z "$EMPRESA" ]; then
    echo "Uso: $0 {identificador}"
    exit 1
fi

DB_NAME="strat_${EMPRESA}_sgi"
BACKUP_FILE="$BACKUP_DIR/$DATE/${DB_NAME}.sql.gz"

mkdir -p "$BACKUP_DIR/$DATE"

echo "Respaldando: $DB_NAME"
mysqldump "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup completado: $BACKUP_FILE ($SIZE)"
else
    echo "✗ Error en backup"
    exit 1
fi
```

### 8.3 Script: Health Check

Ubicación: `~/shared/scripts/health_check.sh`

```bash
#!/bin/bash
# Verifica estado de todas las empresas

EMPRESAS=("grasas" "demo" "staging")

echo "=== Health Check SGI ==="
echo "Fecha: $(date)"
echo ""

for EMPRESA in "${EMPRESAS[@]}"; do
    URL="https://$EMPRESA.stratekaz.com/api/health/"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10)

    if [ "$STATUS" == "200" ]; then
        echo "✓ $EMPRESA: OK"
    else
        echo "✗ $EMPRESA: ERROR (HTTP $STATUS)"
    fi
done
```

---

## 9. Rollback y Recuperación

### 9.1 Rollback de Código

```bash
# Ver commits recientes
cd ~/{empresa}.stratekaz.com
git log --oneline -10

# Volver a un commit específico
git checkout {commit-hash}

# Reinstalar dependencias de esa versión
source ~/virtualenv/{empresa}.stratekaz.com/3.9/bin/activate
pip install -r backend/requirements.txt

# Reiniciar
touch tmp/restart.txt
```

### 9.2 Rollback de Base de Datos

```bash
# Listar backups disponibles
ls -la ~/shared/backups/

# Restaurar desde backup
gunzip -c ~/shared/backups/{fecha}/strat_{empresa}_sgi.sql.gz | mysql strat_{empresa}_sgi

# Verificar
cd ~/{empresa}.stratekaz.com/backend
python manage.py shell
>>> from apps.core.models import Usuario
>>> Usuario.objects.count()
```

### 9.3 Restaurar desde Jetbackups

**cPanel > Jetbackups**

1. Seleccionar fecha de backup
2. Elegir qué restaurar:
   - Full Backup (todo)
   - Files Only (solo archivos)
   - Database Only (solo DB)
3. Seleccionar la empresa/DB específica
4. Click **Restore**

---

## 10. Checklist de Verificación

### 10.1 Pre-Despliegue

```markdown
## Checklist Pre-Despliegue

### Información Recopilada
- [ ] Nombre de empresa
- [ ] Identificador (max 8 chars)
- [ ] NIT
- [ ] Email administrador
- [ ] Logo
- [ ] Módulos a activar

### Generado
- [ ] SECRET_KEY única
- [ ] Password de base de datos
- [ ] Password de email
```

### 10.2 Durante Despliegue

```markdown
## Checklist Durante Despliegue

### cPanel
- [ ] Subdominio creado
- [ ] Base de datos MySQL creada
- [ ] Usuario MySQL creado y asignado
- [ ] Charset UTF8MB4 configurado
- [ ] Python App creada
- [ ] Cuenta de email creada

### Servidor
- [ ] Código clonado
- [ ] .env configurado
- [ ] Dependencias instaladas (pip)
- [ ] Migraciones ejecutadas
- [ ] Cache table creada
- [ ] Superusuario creado
- [ ] collectstatic ejecutado
- [ ] Frontend desplegado
- [ ] .htaccess configurado
- [ ] SSL activado
```

### 10.3 Post-Despliegue

```markdown
## Checklist Post-Despliegue

### Verificación Funcional
- [ ] Frontend carga (HTTPS)
- [ ] API /health/ responde 200
- [ ] Login funciona
- [ ] CRUD básico funciona
- [ ] Email funciona

### Verificación Técnica
- [ ] Sin errores en logs
- [ ] Proceso Passenger corriendo
- [ ] DB conexión estable
- [ ] Static files cargando
- [ ] SSL válido (candado verde)

### Configuración Final
- [ ] Cron jobs configurados
- [ ] Backup verificado
- [ ] Documentación actualizada
- [ ] Cliente notificado
```

---

## Referencias

- [ESTRATEGIA-CPANEL-CORPORATIVO.md](../../docs/infraestructura/ESTRATEGIA-CPANEL-CORPORATIVO.md)
- [ARQUITECTURA-UNITENANT.md](../../docs/infraestructura/ARQUITECTURA-UNITENANT.md)
- [Django Documentation](https://docs.djangoproject.com/en/5.0/)
- [cPanel Documentation](https://docs.cpanel.net/)

---

## Soporte

**Issues y Problemas:**
- GitHub: https://github.com/Kmylosky83/Grasas-Huesos-SGI/issues

**Contacto DevOps:**
- Email: devops@stratekaz.com

---

*Última actualización: 2025-12-30*
*Versión del documento: 2.0*
