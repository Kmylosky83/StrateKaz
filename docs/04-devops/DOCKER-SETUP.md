# Docker - Configuración y Desarrollo

**Última actualización:** 2026-02-06
**Versión:** 2.1.0 (PostgreSQL 15 + Redis 7 + Multi-tenant)

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Servicios](#servicios)
- [Requisitos Previos](#requisitos-previos)
- [Quick Start](#quick-start)
- [Configuración de Desarrollo](#configuración-de-desarrollo)
- [Comandos Útiles](#comandos-útiles)
- [Variables de Entorno](#variables-de-entorno)
- [Multi-Tenant](#multi-tenant)
- [Troubleshooting](#troubleshooting)
- [Mejores Prácticas](#mejores-prácticas)

---

## Descripción General

StrateKaz utiliza Docker y Docker Compose para proporcionar un entorno de desarrollo consistente y reproducible. La arquitectura está diseñada para soportar:

- Arquitectura multi-tenant con schemas de PostgreSQL
- Procesamiento asíncrono con Celery
- Cache distribuido con Redis
- Frontend React con hot-reload
- Herramientas de administración opcionales

### Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │    Redis    │  │   Backend   │             │
│  │     15      │  │      7      │  │   Django    │             │
│  │  :5432      │  │   :6379     │  │   :8000     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                          │                │                     │
│                          ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Celery    │  │ Celery Beat │  │   Flower    │             │
│  │  Worker     │  │ Scheduler   │  │  Monitor    │             │
│  └─────────────┘  └─────────────┘  │   :5555     │             │
│                                     └─────────────┘             │
│                                                                  │
│  ── Servicios Opcionales (profiles) ────────────────────────    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Frontend   │  │  pgAdmin    │  │Redis Cmdr   │             │
│  │   React     │  │             │  │             │             │
│  │   :3010     │  │   :5050     │  │   :8081     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Servicios

### PostgreSQL 15 (db)
- **Imagen:** `postgres:15-alpine`
- **Puerto:** 5432
- **Propósito:** Base de datos principal con soporte multi-tenant mediante schemas
- **Features:**
  - Encoding UTF8
  - Script de inicialización automático
  - Health checks configurados
  - Volumen persistente

### Redis 7 (redis)
- **Imagen:** `redis:7-alpine`
- **Puerto:** 6379
- **Propósito:** Cache y broker para Celery
- **Configuración:**
  - Persistencia AOF habilitada
  - MaxMemory: 256MB
  - Política: allkeys-lru

### Backend Django (backend)
- **Puerto:** 8000
- **Propósito:** API REST con Django REST Framework
- **Endpoints principales:**
  - API: `http://localhost:8000/api/`
  - Admin: `http://localhost:8000/admin/`
  - Swagger: `http://localhost:8000/api/docs/`
  - ReDoc: `http://localhost:8000/api/redoc/`

### Celery Worker (celery)
- **Propósito:** Procesamiento asíncrono de tareas
- **Colas:** `celery`, `tenant_ops`
- **Concurrencia:** 2 workers

### Celery Beat (celerybeat)
- **Propósito:** Scheduler para tareas programadas
- **Scheduler:** Django Celery Beat (DatabaseScheduler)

### Flower (flower) - Opcional
- **Profile:** `monitoring`
- **Puerto:** 5555
- **Propósito:** Monitoreo de tareas Celery en tiempo real

### Frontend React (frontend) - Opcional
- **Profile:** `frontend`
- **Puerto:** 3010
- **Propósito:** Aplicación web con Vite y hot-reload
- **URL:** `http://localhost:3010`

### pgAdmin (pgadmin) - Opcional
- **Profile:** `tools`
- **Puerto:** 5050
- **Propósito:** Administración de PostgreSQL
- **Credenciales default:**
  - Email: `admin@stratekaz.com`
  - Password: `admin123` (configurable via `PGADMIN_PASSWORD`)

### Redis Commander (redis-commander) - Opcional
- **Profile:** `tools`
- **Puerto:** 8081
- **Propósito:** Administración de Redis

---

## Requisitos Previos

### Software Requerido

- **Docker Engine:** 20.10+ o Docker Desktop 4.0+
- **Docker Compose:** 2.0+
- **Git:** Para clonar el repositorio
- **Recursos mínimos:**
  - 4GB RAM (recomendado 8GB)
  - 10GB espacio en disco libre
  - CPU: 2 cores mínimo

### Instalación de Docker

#### Windows/Mac

```bash
# Descargar Docker Desktop desde:
https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu/Debian)

```bash
# Instalar Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### Verificar Instalación

```bash
# Verificar que Docker está corriendo
docker ps

# Verificar Docker Compose
docker-compose version
```

---

## Quick Start

### 1. Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/stratekaz.git
cd stratekaz

# Crear archivo de configuración
cp .env.example .env
```

### 2. Iniciar Servicios Básicos

```bash
# Iniciar PostgreSQL + Redis + Backend + Celery + Celery Beat
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

### 3. Inicializar Base de Datos

```bash
# Ejecutar migraciones (primera vez)
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser
```

### 4. Acceder a la Aplicación

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Backend API | http://localhost:8000/api/ | - |
| Django Admin | http://localhost:8000/admin/ | superuser |
| API Docs (Swagger) | http://localhost:8000/api/docs/ | - |
| API Docs (ReDoc) | http://localhost:8000/api/redoc/ | - |

---

## Configuración de Desarrollo

### Perfiles Opcionales

Docker Compose utiliza profiles para servicios opcionales:

#### Iniciar con Frontend

```bash
# Frontend React en puerto 3010
docker-compose --profile frontend up -d

# Acceder a: http://localhost:3010
```

#### Iniciar con Herramientas de Administración

```bash
# pgAdmin + Redis Commander
docker-compose --profile tools up -d

# pgAdmin: http://localhost:5050
# Redis Commander: http://localhost:8081
```

#### Iniciar con Monitoreo

```bash
# Flower (monitor de Celery)
docker-compose --profile monitoring up -d

# Flower: http://localhost:5555
```

#### Todo Junto

```bash
# Iniciar todos los servicios
docker-compose --profile frontend --profile tools --profile monitoring up -d
```

### Hot Reload en Desarrollo

Los siguientes servicios tienen hot-reload habilitado:

- **Backend:** Django runserver con auto-reload
- **Frontend:** Vite con HMR (Hot Module Replacement)
- **Celery:** Auto-reload al detectar cambios en el código

### Estructura de Volúmenes

| Volumen | Propósito | Ubicación | Persistente |
|---------|-----------|-----------|-------------|
| `stratekaz_postgres_data` | Datos PostgreSQL | `/var/lib/postgresql/data` | ✅ |
| `stratekaz_redis_data` | Datos Redis | `/data` | ✅ |
| `stratekaz_static` | Archivos estáticos Django | `/app/staticfiles` | ✅ |
| `stratekaz_media` | Archivos subidos | `/app/media` | ✅ |
| `stratekaz_pgadmin` | Configuración pgAdmin | `/var/lib/pgadmin` | ✅ |

---

## Comandos Útiles

### Gestión de Contenedores

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: Borra datos)
docker-compose down -v

# Reiniciar servicio específico
docker-compose restart backend

# Ver estado de servicios
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Ver estadísticas de recursos
docker stats
```

### Entrar a Contenedores

```bash
# Backend (bash shell)
docker-compose exec backend bash

# Backend (Django shell)
docker-compose exec backend python manage.py shell

# PostgreSQL
docker-compose exec db psql -U stratekaz -d stratekaz

# Redis CLI
docker-compose exec redis redis-cli
```

### Base de Datos

```bash
# Crear migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Ver migraciones pendientes
docker-compose exec backend python manage.py showmigrations

# Backup de base de datos
docker-compose exec db pg_dump -U stratekaz stratekaz > backup.sql

# Backup comprimido con timestamp
docker-compose exec db pg_dump -U stratekaz stratekaz | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restaurar backup
cat backup.sql | docker-compose exec -T db psql -U stratekaz stratekaz

# Restaurar backup comprimido
gunzip -c backup.sql.gz | docker-compose exec -T db psql -U stratekaz stratekaz
```

### Gestión de Datos de Prueba

```bash
# Cargar datos de demostración
docker-compose exec backend python manage.py setup_demo_data

# Eliminar datos y reiniciar
docker-compose exec backend python manage.py flush
```

### Tests

```bash
# Ejecutar todos los tests
docker-compose exec backend pytest

# Tests con coverage
docker-compose exec backend pytest --cov=apps --cov-report=html

# Tests de un módulo específico
docker-compose exec backend pytest apps/core/tests/

# Tests con verbose
docker-compose exec backend pytest -vv

# Tests en modo watch
docker-compose exec backend pytest-watch
```

### Reconstruir Imágenes

```bash
# Reconstruir todas las imágenes
docker-compose build

# Reconstruir sin cache
docker-compose build --no-cache

# Reconstruir e iniciar
docker-compose up -d --build

# Reconstruir un servicio específico
docker-compose build backend
```

### Limpieza

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados (CUIDADO)
docker volume prune

# Limpieza completa del sistema
docker system prune -a --volumes

# Ver espacio usado por Docker
docker system df
```

### Health Checks

```bash
# Verificar PostgreSQL
docker-compose exec db pg_isready -U stratekaz -d stratekaz

# Verificar Redis
docker-compose exec redis redis-cli ping

# Verificar Backend (si existe endpoint de health)
curl http://localhost:8000/api/health/
```

---

## Variables de Entorno

### Archivo .env

El archivo `.env` en la raíz del proyecto contiene las variables de entorno para Docker Compose.

#### Variables de Base de Datos

```bash
# PostgreSQL
DB_NAME=stratekaz
DB_USER=stratekaz
DB_PASSWORD=stratekaz_dev_2024    # Cambiar en producción
DB_HOST=db                         # Nombre del servicio en Docker
DB_PORT=5432
```

#### Variables de Django

```bash
# Django
DEBUG=True                         # False en producción
SECRET_KEY=dev-secret-key-change-in-production
DJANGO_SETTINGS_MODULE=config.settings.development
ALLOWED_HOSTS=localhost,127.0.0.1,backend,demo.localhost,.localhost
```

#### Variables de Redis y Celery

```bash
# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

#### Variables de CORS

```bash
# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3010,http://127.0.0.1:3010,http://demo.localhost:8000
```

#### Variables de JWT

```bash
# JWT (en minutos)
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

#### Variables de Servicios Opcionales

```bash
# pgAdmin
PGADMIN_PASSWORD=admin123

# Flower
CELERY_FLOWER_USER=admin
CELERY_FLOWER_PASSWORD=admin123
```

### Variables Específicas de Docker

Cuando se ejecuta dentro de Docker, estas variables deben apuntar a los nombres de los servicios:

```bash
# IMPORTANTE: Usar nombres de servicios de Docker, no localhost
DB_HOST=db              # NO usar localhost
REDIS_URL=redis://redis:6379/0  # NO usar redis://localhost:6379/0
```

### Generar Secrets Seguros

```bash
# Método 1: Python
python -c "import secrets; print(secrets.token_urlsafe(50))"

# Método 2: OpenSSL
openssl rand -base64 32

# Método 3: Django
docker-compose exec backend python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Multi-Tenant

### Crear un Tenant

#### Desde Django Shell

```bash
docker-compose exec backend python manage.py shell
```

```python
from apps.tenant.models import Tenant, Plan

# Obtener o crear un plan
plan = Plan.objects.get(code='basic')

# Crear tenant
tenant = Tenant.objects.create(
    code='empresa-abc',
    name='Empresa ABC S.A.S.',
    subdomain='empresa-abc',
    plan=plan
)
```

### Crear Schema de Tenant en PostgreSQL

```bash
# Conectar a PostgreSQL
docker-compose exec db psql -U stratekaz -d stratekaz

# Crear schema para el tenant
SELECT create_tenant_schema('empresa-abc');

# Crear usuario específico para el tenant (opcional)
SELECT create_tenant_user('empresa-abc', 'password123', false);

# Ver estadísticas de tenants
SELECT * FROM tenant_stats;

# Salir de psql
\q
```

### Ejecutar Migraciones para Tenant

```bash
# Si se usa django-tenants o similar
docker-compose exec backend python manage.py migrate_schemas

# Migrar un tenant específico
docker-compose exec backend python manage.py migrate_schemas --schema=empresa-abc
```

### Acceder a un Tenant

Según la configuración de subdominio:

- `http://empresa-abc.localhost:8000/api/`
- `http://localhost:8000/api/` (con header `X-Tenant: empresa-abc`)

---

## Troubleshooting

### Problema: Puerto en Uso

**Síntomas:**
```
Error: port 5432 already in use
```

**Soluciones:**

```bash
# Opción 1: Detener servicio local de PostgreSQL
# Linux
sudo systemctl stop postgresql

# Mac
brew services stop postgresql

# Windows
# Usar Services.msc para detener PostgreSQL

# Opción 2: Cambiar puerto en docker-compose.yml
# Editar:
ports:
  - "5433:5432"  # Usar puerto 5433 en host
```

### Problema: Permisos de Volúmenes

**Síntomas:**
```
Error: permission denied
```

**Soluciones:**

```bash
# Linux/Mac: Ajustar permisos
sudo chown -R $USER:$USER ./backend/media ./backend/staticfiles

# Verificar permisos
ls -la ./backend/
```

### Problema: Contenedor no Inicia

**Soluciones:**

```bash
# 1. Ver logs del contenedor
docker-compose logs backend

# 2. Ver los últimos eventos de Docker
docker events --since 1h

# 3. Verificar estado de servicios
docker-compose ps

# 4. Inspeccionar contenedor
docker inspect stratekaz_backend
```

### Problema: Error de Conexión a Base de Datos

**Síntomas:**
```
django.db.utils.OperationalError: could not connect to server
```

**Soluciones:**

```bash
# 1. Verificar que PostgreSQL está healthy
docker-compose ps

# 2. Esperar a que PostgreSQL termine de iniciar
docker-compose logs db | grep "ready to accept connections"

# 3. Verificar variables de entorno
docker-compose exec backend env | grep DB_

# 4. Probar conexión manual
docker-compose exec db psql -U stratekaz -d stratekaz -c "SELECT 1;"

# 5. Reiniciar servicio de base de datos
docker-compose restart db
docker-compose restart backend
```

### Problema: Migraciones no Aplican

**Soluciones:**

```bash
# 1. Verificar migraciones pendientes
docker-compose exec backend python manage.py showmigrations

# 2. Crear migraciones si faltan
docker-compose exec backend python manage.py makemigrations

# 3. Aplicar migraciones
docker-compose exec backend python manage.py migrate

# 4. Si hay conflictos, verificar
docker-compose exec backend python manage.py migrate --plan
```

### Problema: Redis no Conecta

**Soluciones:**

```bash
# 1. Verificar que Redis está corriendo
docker-compose ps redis

# 2. Probar conexión
docker-compose exec redis redis-cli ping

# 3. Verificar variable de entorno
docker-compose exec backend env | grep REDIS_URL

# 4. Reiniciar Redis
docker-compose restart redis
```

### Problema: Celery no Procesa Tareas

**Soluciones:**

```bash
# 1. Ver logs de Celery
docker-compose logs -f celery

# 2. Verificar que está conectado a Redis
docker-compose logs celery | grep "Connected to"

# 3. Listar tareas activas
docker-compose exec celery celery -A config inspect active

# 4. Reiniciar worker
docker-compose restart celery
```

### Limpiar Todo y Reiniciar

```bash
# CUIDADO: Esto eliminará todos los datos

# 1. Detener y eliminar todo
docker-compose down -v --remove-orphans

# 2. Eliminar imágenes
docker-compose down --rmi all

# 3. Limpiar sistema Docker
docker system prune -a --volumes

# 4. Reiniciar desde cero
docker-compose up -d --build
```

### Ver Uso de Recursos

```bash
# Estadísticas en tiempo real
docker stats

# Espacio usado por Docker
docker system df

# Información detallada de un contenedor
docker inspect stratekaz_backend | grep -i memory
```

---

## Mejores Prácticas

### Desarrollo

#### 1. Gestión de Variables de Entorno

- **No commitear archivos sensibles:** Agregar `.env` a `.gitignore`
- **Usar templates:** Mantener `.env.example` actualizado
- **Documentar variables:** Comentar variables complejas en `.env.example`

```bash
# .gitignore
.env
.env.local
.env.production
```

#### 2. Mantener Imágenes Ligeras

```dockerfile
# Usar imágenes base alpine cuando sea posible
FROM python:3.11-alpine

# Usar .dockerignore apropiadamente
# .dockerignore
__pycache__
*.pyc
.git
.env
node_modules
```

#### 3. Hot Reload Habilitado

- Montar código como volumen en desarrollo
- Usar watch mode (Vite, Django runserver)
- No reconstruir imágenes en cada cambio

#### 4. Logs y Debug

```bash
# Ver logs con timestamps
docker-compose logs -f --timestamps backend

# Filtrar logs
docker-compose logs backend | grep ERROR

# Guardar logs a archivo
docker-compose logs backend > backend.log
```

### Producción

#### 1. Seguridad First

- Cambiar TODAS las credenciales default
- Usar secretos fuertes y aleatorios (50+ caracteres)
- Habilitar SSL/TLS
- Deshabilitar DEBUG
- Configurar firewalls apropiadamente

```bash
# Generar secretos seguros
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

#### 2. Backups Regulares

```bash
# Script de backup automático (ejemplo)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec db pg_dump -U stratekaz stratekaz | gzip > /backups/stratekaz_$DATE.sql.gz

# Retener últimos 30 días
find /backups -name "stratekaz_*.sql.gz" -mtime +30 -delete
```

#### 3. Monitoreo Continuo

- Configurar health checks en todos los servicios
- Monitorear recursos (CPU, RAM, disco)
- Configurar alertas (Prometheus, Grafana)
- Logs centralizados (ELK Stack, Loki)

#### 4. Resource Limits

```yaml
# Ejemplo en docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

#### 5. Actualizaciones y Mantenimiento

```bash
# Actualizar imágenes base
docker-compose pull

# Reconstruir con nuevas versiones
docker-compose build --no-cache

# Ventana de mantenimiento
docker-compose down
docker-compose up -d --build
```

---

## Recursos Adicionales

### Documentación Oficial

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)
- [Django Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)

### Herramientas Útiles

- [Dive](https://github.com/wagoodman/dive) - Analizar capas de imágenes Docker
- [lazydocker](https://github.com/jesseduffield/lazydocker) - UI terminal para Docker
- [Portainer](https://www.portainer.io/) - UI web para gestión de Docker
- [ctop](https://github.com/bcicen/ctop) - Monitoreo de contenedores tipo htop

### Comandos de Referencia Rápida

```bash
# Ver versiones
docker --version
docker-compose version

# Estado general
docker-compose ps
docker stats

# Logs
docker-compose logs -f [service]

# Ejecutar comandos
docker-compose exec [service] [command]

# Cleanup
docker system prune -a
```

---

## Contacto y Soporte

Para problemas o preguntas relacionadas con Docker:

1. Revisar esta documentación
2. Verificar logs: `docker-compose logs -f`
3. Consultar [issues en GitHub](https://github.com/tu-usuario/stratekaz/issues)
4. Contactar al equipo de DevOps

---

**Documentación mantenida por:** Equipo DevOps - StrateKaz
**Última revisión:** 2026-02-06
