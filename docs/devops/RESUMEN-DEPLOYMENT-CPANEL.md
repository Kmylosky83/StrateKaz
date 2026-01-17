# Resumen Ejecutivo - Deployment cPanel

**Sistema de Gestión Integral - StrateKaz**
**Versión:** 2.0
**Fecha:** 2026-01-07

---

## Contenido Creado

Se ha preparado una solución completa de despliegue en cPanel compartido sin acceso SSH, que incluye:

### Archivos Backend

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `passenger_wsgi.py` | `backend/` | Entry point para Passenger (cPanel) |
| `prepare_static.py` | `backend/` | Script para recolectar archivos estáticos |
| `run_migrations.py` | `backend/` | Script para ejecutar migraciones |
| `requirements-cpanel.txt` | `backend/` | Dependencias optimizadas para cPanel |
| `.env.cpanel.example` | `backend/` | Variables de entorno de producción |
| `config/__init__.py` | `backend/config/` | Configuración PyMySQL/Celery |

### Archivos Frontend

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `build-cpanel.ps1` | `frontend/` | Build script para Windows |
| `build-cpanel.sh` | `frontend/` | Build script para Linux/Mac |
| `.htaccess.example` | `frontend/` | Configuración Apache para React SPA |

### Documentación

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `GUIA-DESPLIEGUE-CPANEL.md` | `docs/` | Guía completa paso a paso (20 min lectura) |
| `DEPLOYMENT-CPANEL-CHECKLIST.md` | `/` | Checklist rápido (5 min) |
| `DEPLOYMENT-README.md` | `/` | Referencia rápida (2 min) |
| Este documento | `docs/` | Resumen ejecutivo |

---

## Características de la Solución

### Compatibilidad con cPanel

- Sin necesidad de acceso SSH
- Compatible con Setup Python App (Passenger)
- Usa Database Cache en lugar de Redis
- Celery en modo EAGER (síncrono)
- Instrucciones para interfaz web de cPanel

### Scripts Automatizados

- Build de frontend con validación
- Recolección de archivos estáticos
- Migraciones con logs y validación
- Generación automática de .htaccess

### Alternativas para Limitaciones

- PyMySQL como alternativa a mysqlclient (sin compilación)
- Database cache en lugar de Redis
- Tareas síncronas en lugar de Celery workers
- Configuración de cron jobs para mantenimiento

---

## Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                    cPanel Servidor                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dominio: grasas.stratekaz.com                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Apache + Passenger WSGI                                │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Frontend (public_html/)        Backend (/backend/)   │ │
│  │  ├── index.html                 ├── passenger_wsgi.py │ │
│  │  ├── assets/                    ├── apps/             │ │
│  │  │   ├── *.js (chunked)         ├── config/           │ │
│  │  │   └── *.css                  ├── manage.py         │ │
│  │  ├── .htaccess                  ├── staticfiles/      │ │
│  │  └── favicon.ico                └── media/            │ │
│  │                                                        │ │
│  │  React Router                   Django REST API       │ │
│  │  SPA                            JWT Auth              │ │
│  │                                                        │ │
│  └────────────┬────────────────────────┬─────────────────┘ │
│               │                        │                   │
│               │                        │                   │
│  ┌────────────▼────────────────────────▼─────────────────┐ │
│  │           MySQL/MariaDB Database                      │ │
│  │           - usuario_grasashuesos                      │ │
│  │           - Django tables + cache table               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  SSL: AutoSSL / Let's Encrypt                               │
│  Backups: JetBackup / cPanel Backup                         │
│  Monitoring: Error Logs + UptimeRobot                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Proceso de Despliegue

### Fase 1: Preparación Local (30 min)

1. Configurar `.env` con valores de producción
2. Generar `SECRET_KEY` segura
3. Build del frontend (`build-cpanel.ps1`)
4. Preparar archivos estáticos (`prepare_static.py`)
5. Comprimir archivos backend

### Fase 2: Base de Datos (10 min)

1. MySQL Databases > Create Database
2. MySQL Databases > Create User
3. Asignar privilegios ALL
4. Anotar credenciales

### Fase 3: Backend Django (45 min)

1. File Manager > Subir backend
2. Setup Python App > Configurar aplicación
3. Instalar dependencias (5-10 min)
4. Ejecutar migraciones
5. Crear superusuario
6. Configurar static files

### Fase 4: Frontend React (20 min)

1. File Manager > Subir dist/
2. Verificar .htaccess
3. Configurar dominio/subdominio

### Fase 5: SSL y Dominio (15 min)

1. Configurar subdominio
2. Activar AutoSSL
3. Verificar HTTPS

### Fase 6: Post-Despliegue (20 min)

1. Configurar backups
2. Configurar cron jobs
3. Configurar monitoreo
4. Testing funcional

**Tiempo Total Primera Vez:** 2.5 horas
**Tiempo Total Actualizaciones:** 30-45 min

---

## Configuraciones Clave

### Variables de Entorno Críticas

```bash
# Seguridad
SECRET_KEY=<50+ caracteres aleatorios>
DEBUG=False
ALLOWED_HOSTS=tudominio.com,www.tudominio.com

# Base de Datos
DB_NAME=usuario_grasashuesos
DB_USER=usuario_dbuser
DB_PASSWORD=<password seguro>
DB_HOST=localhost

# Modo cPanel
USE_CPANEL=True

# CORS/CSRF
CSRF_TRUSTED_ORIGINS=https://tudominio.com
CORS_ALLOWED_ORIGINS=https://tudominio.com
```

### .htaccess para React Router

```apache
RewriteEngine On
RewriteBase /

# HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Passenger WSGI Entry Point

```python
# passenger_wsgi.py
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ.setdefault('USE_CPANEL', 'True')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

---

## Comandos Esenciales

### Activar Virtualenv

```bash
source /home/usuario/virtualenv/backend/3.9/bin/activate
```

### Migraciones

```bash
# Ver pendientes
python run_migrations.py --check

# Ejecutar
python run_migrations.py

# Plan detallado
python run_migrations.py --showplan
```

### Archivos Estáticos

```bash
python prepare_static.py
```

### Superusuario

```bash
python manage.py createsuperuser
```

### Logs

```bash
tail -f ~/backend/logs/app.log
tail -f ~/backend/logs/error.log
tail -f ~/backend/logs/passenger.log
```

---

## Seguridad Implementada

### Backend Django

- DEBUG=False en producción
- SECRET_KEY única y segura
- HTTPS forzado
- CORS configurado (solo dominios específicos)
- CSRF protection activo
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting
- Audit logging
- Password validators

### Frontend React

- HTTPS redirect en .htaccess
- Security headers (X-Frame-Options, X-XSS-Protection)
- MIME types correctos
- Archivos sensibles protegidos
- Cache headers optimizados
- GZIP compression

### Base de Datos

- Usuario con permisos mínimos necesarios
- Password complejo
- Backups automáticos
- Conexión solo desde localhost

---

## Mantenimiento

### Cron Jobs Configurados

```bash
# Limpiar sesiones expiradas (diario 2 AM)
0 2 * * * source /home/usuario/virtualenv/backend/3.9/bin/activate && cd ~/backend && python manage.py clearsessions

# Backup de BD (diario 1 AM)
0 1 * * * mysqldump -u usuario_dbuser -p'password' usuario_grasashuesos > ~/backups/db_$(date +\%Y\%m\%d).sql
```

### Monitoreo

- UptimeRobot para disponibilidad
- Error logs de cPanel
- Sentry para error tracking (opcional)
- Health check endpoint: `/api/health/`

### Backups

- Base de datos: Diario
- Archivos: Semanal
- Completo: Mensual
- Retención: 30 días
- Storage: cPanel Backup + offsite

---

## Troubleshooting Rápido

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| Backend 500 | Error de configuración | Revisar `logs/passenger.log` |
| Frontend blank | Rutas incorrectas | Verificar `.htaccess` |
| API no conecta | CORS mal configurado | Verificar `CORS_ALLOWED_ORIGINS` |
| Static files 404 | collectstatic no ejecutado | Ejecutar `prepare_static.py` |
| SSL error | Certificado no generado | AutoSSL > Run AutoSSL |
| Migraciones fallan | Permisos de BD | Verificar privilegios ALL |

---

## Diferencias vs Docker/VPS

| Aspecto | cPanel | Docker/VPS |
|---------|--------|------------|
| Deployment | Web interface | SSH/CI/CD |
| WSGI Server | Passenger | Gunicorn |
| Cache | Database | Redis |
| Celery | EAGER mode | Workers |
| Static Files | Apache directo | Nginx/CDN |
| Escalabilidad | Limitada (hosting) | Alta (recursos) |
| Costo | Bajo ($90/año) | Medio-Alto ($20-100/mes) |
| Mantenimiento | Bajo | Medio-Alto |

---

## Próximos Pasos

### Inmediato (Hoy)

1. Revisar documentación completa
2. Preparar credenciales y accesos
3. Backup de base de datos actual (si aplica)

### Corto Plazo (Esta Semana)

1. Ejecutar despliegue siguiendo checklist
2. Testing exhaustivo
3. Configurar monitoreo
4. Entrenar al equipo

### Mediano Plazo (Este Mes)

1. Optimización de performance
2. Configuración de analytics
3. Documentación de usuarios
4. Plan de disaster recovery

---

## Recursos

### Documentación

- **Guía Completa:** `docs/GUIA-DESPLIEGUE-CPANEL.md`
- **Checklist:** `DEPLOYMENT-CPANEL-CHECKLIST.md`
- **Referencia Rápida:** `DEPLOYMENT-README.md`

### Scripts

- `backend/passenger_wsgi.py`
- `backend/prepare_static.py`
- `backend/run_migrations.py`
- `frontend/build-cpanel.ps1` / `.sh`

### Configuración

- `backend/.env.cpanel.example`
- `backend/requirements-cpanel.txt`
- `frontend/.htaccess.example`

---

## Contacto

- **Email:** soporte@stratekaz.com
- **Documentación:** https://docs.stratekaz.com
- **GitHub:** https://github.com/tu-usuario/grasas-huesos-sgi

---

**Preparado por:** Equipo DevOps - StrateKaz
**Versión:** 2.0
**Última actualización:** 2026-01-07
