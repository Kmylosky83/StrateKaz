# Deploy & Operations Reference

## Architecture Overview

```
DESARROLLO (Windows local)          PRODUCCION (VPS Hostinger)
┌─────────────────────────┐        ┌──────────────────────────────┐
│ Docker Compose           │        │ Ubuntu 24.04 LTS (sin Docker)│
│ ┌─────┐ ┌─────┐ ┌─────┐│        │                              │
│ │ DB  │ │Redis│ │Nginx││  git   │ Nginx (reverse proxy + SSL)  │
│ │PG15 │ │ 7   │ │(opt)││ push → │   ↓                          │
│ └──┬──┘ └──┬──┘ └─────┘│  main  │ Gunicorn (WSGI, 3 workers)   │
│    ↓       ↓            │        │   ↓                          │
│ ┌─────────────────┐     │        │ Django (config.settings.prod) │
│ │ Backend (Django) │     │        │   ↓                          │
│ │ :8000            │     │        │ PostgreSQL 15 (multi-schema) │
│ └─────────────────┘     │        │ Redis 7 (cache + broker)     │
│ ┌────────┐ ┌──────────┐ │        │ Celery Worker (11 queues)    │
│ │Celery  │ │CeleryBeat│ │        │ Celery Beat (24+ tasks)      │
│ │Worker  │ │Scheduler │ │        └──────────────────────────────┘
│ └────────┘ └──────────┘ │
│ ┌─────────────────┐     │        Frontend: Nginx sirve /dist
│ │ Frontend (Vite) │     │        directamente, NO hay server
│ │ :3010            │     │        Node en produccion
│ └─────────────────┘     │
└─────────────────────────┘
```

---

## 1. DESARROLLO LOCAL (Docker)

### Requisitos
- Docker Desktop + Docker Compose
- Node 20+ (para frontend sin Docker)
- Python 3.11+ (para backend sin Docker)

### Docker Compose Services

| Servicio | Puerto | Perfil | Descripcion |
|----------|--------|--------|-------------|
| `db` (PG 15) | 5432 | default | PostgreSQL con healthcheck |
| `redis` (7) | 6379 | default | Cache + Celery broker (256MB max) |
| `backend` | 8000 | default | Django runserver |
| `celery` | - | default | Worker (2 concurrency, 11 queues) |
| `celerybeat` | - | default | Scheduler (DatabaseScheduler) |
| `flower` | 5555 | monitoring | Monitor Celery |
| `frontend` | 3010 | frontend | Vite dev server |
| `pgadmin` | 5050 | tools | Admin PostgreSQL |
| `redis-commander` | 8081 | tools | Admin Redis |

### Makefile Commands

```bash
# === LIFECYCLE ===
make dev-setup          # Setup inicial: build + db + backend + migrate + frontend
make build              # Construir imagenes Docker
make up                 # Iniciar servicios (db, redis, backend, celery, beat)
make down               # Detener servicios
make restart            # Reiniciar servicios
make clean              # Detener + eliminar volumenes
make clean-all          # Eliminar TODO (imagenes incluidas)

# === LOGS ===
make logs               # Todos los servicios (tail -f)
make logs-backend       # Solo backend
make logs-frontend      # Solo frontend
make logs-db            # Solo base de datos

# === SHELL ACCESS ===
make shell-backend      # bash en contenedor backend
make shell-frontend     # sh en contenedor frontend
make shell-db           # Shell PostgreSQL (⚠️ Makefile dice MySQL pero es PG)

# === DJANGO ===
make migrate            # Ejecutar migraciones
make makemigrations     # Crear nuevas migraciones
make superuser          # Crear superusuario
make collectstatic      # Recopilar archivos estaticos

# === TESTING ===
make test               # pytest
make test-coverage      # pytest --cov + HTML report

# === DATABASE ===
make db-backup          # Backup SQL en backups/
make db-restore         # Restaurar backup (interactivo)
make health             # ⚠️ Health check tiene refs a MySQL (bug legacy)
```

### Docker Compose Commands (directos)

```bash
# Profiles opcionales
docker-compose --profile frontend up -d    # Incluir frontend en Docker
docker-compose --profile monitoring up -d  # Incluir Flower
docker-compose --profile tools up -d       # Incluir pgAdmin + Redis Commander

# Ejecutar comandos en contenedor
docker-compose exec backend python manage.py migrate_schemas
docker-compose exec backend python manage.py shell_plus
docker-compose exec db psql -U stratekaz -d stratekaz
```

### Sin Docker (mas comun en la practica)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # o venv\Scripts\activate en Windows
pip install -r requirements.txt
python manage.py migrate_schemas
python manage.py runserver 0.0.0.0:8000

# Frontend
cd frontend
npm install
npm run dev              # Puerto 3010, proxy /api -> localhost:8000

# Celery (terminal separada)
cd backend && source venv/bin/activate
celery -A config worker -l info -Q celery,tenant_ops,emails,reports,files,maintenance,monitoring,scraping,compliance,notifications,workflow
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Frontend Commands

```bash
npm run dev              # Dev server (:3010, HMR, proxy API)
npm run build            # tsc + vite build (produccion)
npm run build:validate   # Build + validacion PowerShell
npm run preview          # Preview del build
npm run lint             # ESLint (--max-warnings 0)
npm run format           # Prettier
npm run test             # Vitest
npm run test:watch       # Vitest watch
npm run test:coverage    # Coverage (v8, thresholds 80%)
npm run test:ui          # Vitest UI
npm run storybook        # Storybook (:6006)
```

### Backend Commands (Django manage.py)

```bash
# === MIGRACIONES ===
python manage.py migrate_schemas                    # TODOS los schemas (public + tenants)
python manage.py migrate_schemas --shared           # Solo SHARED_APPS en public
python manage.py migrate_schemas --schema=tenant_x  # Un tenant especifico
python manage.py makemigrations                     # Crear nuevas migraciones
python manage.py showmigrations                     # Ver estado de migraciones

# === SEEDS & SETUP ===
python manage.py deploy_seeds_all_tenants           # Seeds criticos en TODOS los tenants
python manage.py sync_tenant_seeds --all            # Sincronizar seeds a todos
python manage.py init_rbac                          # Inicializar RBAC
python manage.py sync_permissions                   # Sincronizar permisos
python manage.py seed_permisos_rbac                 # Seed permisos RBAC
python manage.py seed_empresa                       # Seed empresa base
python manage.py seed_configuracion_sistema         # Seed configuracion
python manage.py seed_organizacion                  # Seed organizacion
python manage.py seed_identidad                     # Seed identidad
python manage.py setup_demo_data                    # Datos demo

# === TENANT ===
python manage.py bootstrap_production               # Bootstrap completo nuevo tenant prod
python manage.py create_initial_setup               # Setup inicial tenant
python manage.py cleanup_orphan_schemas             # Limpiar schemas huerfanos
python manage.py repair_tenant_status               # Reparar estado tenants

# === UTILIDADES ===
python manage.py collectstatic --noinput            # Static files
python manage.py createsuperuser                    # Superusuario
python manage.py wait_for_db                        # Esperar DB (Docker)
python manage.py shell_plus                         # Shell interactivo mejorado

# === LINTING ===
black backend/ --check                              # Check formatting
ruff check backend/                                 # Linting
```

---

## 2. GIT WORKFLOW

### Flujo
```
feature branch -> push -> PR -> merge to main -> deploy VPS
```

### Reglas
- **NUNCA push directo a `main`** — siempre PR
- Ramas: `feat/`, `fix/`, `docs/`, `refactor/`, `claude/`
- Conventional Commits: `type(scope): description`
- Tipos: feat, fix, docs, style, refactor, perf, test, chore, build, ci
- Pre-commit hook: lint-staged (Prettier + ESLint max-warnings 50)

---

## 3. PRODUCCION — VPS HOSTINGER

### Especificaciones
- **OS**: Ubuntu 24.04 LTS
- **CPU/RAM**: 2 CPU, 8 GB RAM
- **IP**: 76.13.97.153
- **Path**: `/opt/stratekaz/`
- **Acceso**: Terminal web de Hostinger (hPanel > VPS > Terminal) — NO SSH directo
- **User DB**: `stratekaz` / DB: `stratekaz_db` / Pass: ver `.env`

### Dominios y SSL
- `stratekaz.com` -> Marketing site
- `app.stratekaz.com` -> ERP (frontend + API)
- `{tenant}.stratekaz.com` -> Tenant subdomains
- **SSL**: Wildcard `*.stratekaz.com`, expira **2026-05-14** (renovacion manual)

### SMTP
- Host: `smtp.hostinger.com:465` | Email: `notificaciones@stratekaz.com`

### Servicios systemd
| Servicio | Descripcion |
|----------|-------------|
| `stratekaz-gunicorn` | Gunicorn WSGI (3 workers) |
| `stratekaz-celery` | Celery worker (11 queues) |
| `stratekaz-celerybeat` | Celery Beat scheduler |
| `nginx` | Reverse proxy + static files |
| `postgresql` | PostgreSQL 15 |
| `redis-server` | Redis 7 |

### Estructura VPS
```
/opt/stratekaz/
├── backend/
│   ├── venv/              # Virtual environment Python
│   ├── config/settings/   # Settings (production.py activo)
│   ├── apps/              # Codigo Django
│   ├── staticfiles/       # collectstatic output
│   └── media/             # Archivos subidos
├── frontend/
│   ├── dist/              # Build prod (Nginx sirve esto directo)
│   ├── node_modules/
│   └── package.json
├── scripts/
│   ├── deploy.sh          # Script deploy automatizado
│   └── backup_tenants.sh  # Backups automaticos
└── .git/
```

---

## 4. DEPLOY A PRODUCCION

### Opcion A: Script automatizado (recomendado)
```bash
cd /opt/stratekaz
./scripts/deploy.sh              # Completo (backup + pull + migrate + build + restart)
./scripts/deploy.sh --no-backup  # Sin backup
./scripts/deploy.sh --backend    # Solo backend
./scripts/deploy.sh --frontend   # Solo frontend
./scripts/deploy.sh --dry-run    # Mostrar sin ejecutar
```

### Opcion B: Manual paso a paso
```bash
# 1. Descartar cambios locales + Pull
cd /opt/stratekaz && git checkout -- . && git pull origin main

# 2. Backend
source backend/venv/bin/activate
cd backend
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate_schemas
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py deploy_seeds_all_tenants
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py collectstatic --noinput

# 3. Frontend
cd /opt/stratekaz/frontend
npm install   # Solo si package.json cambio
npm run build  # env vars ya configuradas en .env del VPS

# 4. Restart
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat

# 5. Verificar
sudo systemctl status stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

**NOTA:** `git checkout -- .` es NECESARIO porque `npm install` modifica `package-lock.json` en el VPS, y sin esto `git pull` falla con "Your local changes would be overwritten".

### Opcion C: One-liner (COMPLETO — incluye seeds)
```bash
cd /opt/stratekaz && git checkout -- . && git pull origin main && source backend/venv/bin/activate && cd backend && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate_schemas && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py deploy_seeds_all_tenants && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py collectstatic --noinput && cd /opt/stratekaz/frontend && npm install && npm run build && sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

### Opcion D: One-liner FRONTEND-ONLY (sin migraciones ni seeds)
```bash
cd /opt/stratekaz && git checkout -- . && git pull origin main && cd frontend && npm install && npm run build && sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

### Opcion E: CASCADE DEPLOY — DB Reset + Progressive Rollout
**Usar cuando:** Se necesita recrear DB desde cero (ej: migraciones limpias, cambio de arquitectura)
```bash
# 1. Parar servicios + terminar conexiones
sudo systemctl stop stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='stratekaz_db' AND pid <> pg_backend_pid();"

# 2. Drop + Recreate DB
sudo -u postgres psql -c "DROP DATABASE stratekaz_db;"
sudo -u postgres psql -c "CREATE DATABASE stratekaz_db OWNER stratekaz;"
sudo -u postgres psql -d stratekaz_db -c "GRANT ALL ON SCHEMA public TO stratekaz;"

# 3. Pull + activate venv
cd /opt/stratekaz && git checkout -- . && git pull origin main
source backend/venv/bin/activate && cd backend

# 4. Migrate + Bootstrap + Seeds + Build + Restart
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate_schemas --shared
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py bootstrap_production
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py deploy_seeds_all_tenants
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py collectstatic --noinput
cd /opt/stratekaz/frontend && npm install && npm run build
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat

# 5. Corregir dominio si bootstrap creó 'stratekaz.com' en vez de 'app.stratekaz.com'
cd /opt/stratekaz/backend
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell -c "
from apps.tenant.models import Domain
d = Domain.objects.first()
d.domain = 'app.stratekaz.com'
d.save()
print(f'Dominio: {d.domain}')
"
```

### Opcion F: One-liner MARKETING SITE ONLY (sin backend ni frontend app)
```bash
cd /opt/stratekaz && git checkout -- . && git pull origin main && cd marketing_site && npm install && npm run build
```
**Cuándo usar:** Cambios SOLO en `marketing_site/` (landing, pricing, contact).
**NO requiere restart de servicios** — Nginx sirve `dist/` como static files directamente.

### ⚠️ Convenciones VPS críticas
- **venv path**: `/opt/stratekaz/backend/venv/bin/activate` (NO `/opt/stratekaz/venv/`)
- **Servicios systemd**: `stratekaz-gunicorn`, `stratekaz-celery`, `stratekaz-celerybeat` (con prefijo `stratekaz-`)
- **npm run build**: Las env vars `VITE_API_URL` y `VITE_BASE_DOMAIN` ya están en `.env` del frontend en VPS, NO es necesario pasarlas inline
- **git checkout -- .**: SIEMPRE necesario antes de `git pull` (npm install modifica package-lock.json)

### ⚠️ REGLA CRÍTICA: Seeds Multi-Tenant

**SIEMPRE usar `deploy_seeds_all_tenants`** para ejecutar seeds en producción. NUNCA correr seeds individuales directamente:

```bash
# ❌ MAL — corre en schema PUBLIC, falla con "relation does not exist"
python manage.py seed_configuracion_sistema
python manage.py seed_estructura_final

# ✅ BIEN — itera TODOS los tenants con schema_context()
python manage.py deploy_seeds_all_tenants                    # Todos los 8 seeds en todos los tenants
python manage.py deploy_seeds_all_tenants --only unidades    # Solo seed_configuracion_sistema
python manage.py deploy_seeds_all_tenants --only estructura  # Solo seed_estructura_final
python manage.py deploy_seeds_all_tenants --tenant demo      # Solo tenant "demo"
python manage.py deploy_seeds_all_tenants --dry-run          # Preview sin ejecutar
```

**¿Por qué?** Los seeds individuales NO tienen `schema_context()` en su `handle()`. Están diseñados para ser llamados DENTRO de `deploy_seeds_all_tenants`, que envuelve cada llamada en `with schema_context(tenant.schema_name)`.

**8 seeds incluidos (en orden):**
1. `roles` → `init_roles_sugeridos --reset`
2. `permisos` → `seed_permisos_rbac`
3. `estructura` → `seed_estructura_final`
4. `unidades` → `seed_configuracion_sistema`
5. `notificaciones` → `seed_notification_types`
6. `documentos_th` → `seed_tipos_documento_th`
7. `consecutivos` → `seed_consecutivos_sistema`
8. `supply_chain` → `seed_supply_chain_catalogs`

---

## 5. OPERACIONES VPS

### systemd
```bash
# Status
sudo systemctl status stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
# Restart
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
# Logs
sudo journalctl -u stratekaz-gunicorn -f --no-pager
sudo journalctl -u stratekaz-celery -f --no-pager
sudo journalctl -u stratekaz-celerybeat -f --no-pager
```

### Nginx
```bash
sudo nginx -t                     # Validar config
sudo systemctl reload nginx       # Recargar sin downtime
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
# Config: /etc/nginx/sites-enabled/stratekaz (NO la del repo Docker)
```

### PostgreSQL
```bash
sudo -u postgres psql stratekaz_db
sudo -u postgres psql stratekaz_db -c "SELECT schema_name FROM tenant_tenant;"
sudo -u postgres pg_dump stratekaz_db > /var/backups/stratekaz/backup_$(date +%Y%m%d).sql
```

### Redis
```bash
redis-cli ping
redis-cli info memory
redis-cli dbsize
```

### Django Shell (prod)
```bash
cd /opt/stratekaz/backend && source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell_plus
```

---

## 6. BACKUPS

### Script automatico
```bash
./scripts/backup_tenants.sh
# Cron: 0 2 * * * /opt/stratekaz/scripts/backup_tenants.sh >> /var/log/stratekaz_backup.log 2>&1
```
Estructura: `/var/backups/stratekaz/{full,schemas}/` | Retencion: 30 dias

---

## 7. TROUBLESHOOTING

- **Health check 404**: Normal en prod — `SHOW_PUBLIC_IF_NO_TENANT_FOUND=False`
- **Git pull falla**: `rm` archivo untracked conflictivo y reintentar
- **Schema changes**: Reiniciar gunicorn + limpiar localStorage del browser
- **Celery Beat crash**: Tablas `django_celery_beat_*` deben existir en `public`
- **Frontend CORS errors**: `VITE_API_URL` DEBE ser env var inline al build
- **PWA no actualiza**: `skipWaiting:true` + `clientsClaim:true` + toast en `controllerchange`. El nuevo SW activa inmediatamente, el toast pide al usuario recargar. Si persiste: DevTools → Application → Storage → Clear site data
- **Phantom Migrations**: DELETE records de `django_migrations` si tablas no existen

---

## 8. KNOWN BUGS (Makefile)
- `shell-db`: Dice "MySQL" pero deberia ser PostgreSQL
- `health`: Usa `mysqladmin ping` en vez de `pg_isready`
- **Docker-compose.prod.yml**: Existe pero NO se usa en produccion (VPS corre nativo)

## 9. VPS INFRASTRUCTURE (configurado 2026-02-22)

### Redis (con password)
- Config: `/etc/redis/redis.conf` (`requirepass`)
- Backend .env: `REDIS_URL=redis://:PASSWORD@127.0.0.1:6379/0`
- Verificar: `redis-cli -a 'PASSWORD' ping` -> PONG

### Logrotate
- Config: `/etc/logrotate.d/stratekaz`
- Logs: `/var/log/stratekaz/` (app, celery, gunicorn)
- Test: `sudo logrotate -d /etc/logrotate.d/stratekaz`

### Backups Automaticos
- Cron: `0 2 * * *` (diario 2AM)
- Script: `/opt/stratekaz/scripts/backup_tenants.sh`
- Destino: `/var/backups/stratekaz/{full,schemas}/`
- Log: `/var/log/stratekaz/backup.log`
- Verificar: `sudo crontab -l | grep stratekaz`

### Sentry
- Backend DSN: en `/opt/stratekaz/backend/.env` (SENTRY_DSN)
- Frontend DSN: baked en build via `VITE_SENTRY_DSN` env var
- Dashboard: https://sentry.io (org: StrateKaz)
- **IMPORTANTE**: Frontend DSN se pierde si se hace rebuild sin la env var

### Frontend Rebuild con Sentry
```bash
cd /opt/stratekaz/frontend
VITE_API_URL=https://app.stratekaz.com/api \
VITE_BASE_DOMAIN=stratekaz.com \
VITE_SENTRY_DSN=https://44b5a6594d27f6ffb6c90382efda7c49@o4510460014231552.ingest.us.sentry.io/4510930761220096 \
VITE_SENTRY_ENVIRONMENT=production \
npm run build
```

---

## 10. TENANT MANAGEMENT COMMANDS

### reset_tenant — Reset completo (C2-C6 + users no-admin)
```bash
# Dry-run (ver qué se eliminaría):
python manage.py reset_tenant --tenant tenant_stratekaz --dry-run --settings=config.settings.production

# Ejecutar (pide confirmación "RESETEAR TENANT_STRATEKAZ"):
python manage.py reset_tenant --tenant tenant_stratekaz --confirm --settings=config.settings.production
```
**Qué hace:** TRUNCATE C2-C6 → DELETE Users no-superuser → DELETE TenantUserAccess → DELETE TenantUsers huérfanos.
**Preserva:** Superadmin(s) + C0 (RBAC, menú) + C1 (empresa, estructura, identidad) + schema PostgreSQL.
**Post-reset:** `python manage.py deploy_seeds_all_tenants --tenant tenant_stratekaz`

### clean_tenant_modules — Solo limpiar C2-C6 (preserva users)
```bash
python manage.py clean_tenant_modules --tenant tenant_stratekaz --dry-run --settings=config.settings.production
python manage.py clean_tenant_modules --tenant tenant_stratekaz --confirm --settings=config.settings.production
# Opcional: --include-c1 (también limpia planeación, contexto, proyectos, etc.)
```
**Confirmación:** Escribir `LIMPIAR TENANT_STRATEKAZ`

### delete_tenant — Eliminación total (schema + registros)
```bash
python manage.py delete_tenant --schema grasas --dry-run --settings=config.settings.production
python manage.py delete_tenant --schema grasas --confirm --settings=config.settings.production
```
**Qué hace:** DELETE TenantUserAccess → DELETE TenantUsers huérfanos → DELETE Domains → DELETE Tenant → DROP SCHEMA CASCADE.
**Confirmación:** Escribir `ELIMINAR GRASAS`
**⚠️ IRREVERSIBLE** — Usar Admin Global para recrear el tenant después.

---

## Last Successful Deploy
- **Date**: 2026-03-20 (MARKETING-SITE) | **Commit**: `216a331c`. Reescritura comunicación marketing (Consultoría 4.0 + Plataforma 360°), 12 fixes coherencia cross-page, SEO meta tags, deps cleanup. Deploy: Opción F (marketing-only).
- **Previous**: 2026-03-13 (QA-FUNDACION) | **Commits**: `4365e1e`, `269a1cf`, `727bb3b`, `bbe6962`. Mi Portal consultores colocados + AdaptiveLayout backoff 5 retries + JWT 480min + 8 bugs Fundación (imports, Badge, IdentidadTab, OrganigramaView, RBAC 'update'→'edit') + PWA toast branding.
- **Previous**: 2026-03-12 (QA-AUTH-AVATAR) | **Commits**: `f6b1774`, `9cda571`, `3c2e741`, `4b9cafd`. Auth session fixes (proactive refresh, SW toast, 401 guard) + avatar upload (3 bugs) + perfil crash (ChangePasswordModal forwarder) + SW transition (skipWaiting:true restored).
- **Previous**: 2026-03-12 (QA-BACKLOG-S1) | **Commit**: `01d03eb`. N+1 queries (5 ViewSets) + ESLint 804→422 warnings (0 unused-vars, 0 react-refresh). lint-staged: Prettier only. CI threshold 442.
- **Previous**: 2026-03-11 (QA-QUALITY sprint) | **Commits**: `6078e64`, `a9f56ad`, `eb03289`. QA integral: RBAC canDo 17 comp + ErrorBoundary + CI gates + Docker security + CSP hardening + 33 exhaustive-deps → 0. Build 52.87s OK.
- Previous: 2026-03-10 (QA Security + Admin Global) | Commits: 57f0f80, 0e45be6, 0c78a0d, 5b469ef.
- Previous: 2026-03-01 (FASE 6) | f244e57→122a360 (8 commits, 237 files).
- Previous: 2026-02-28 | 0534217 (feat(sistema-gestion): connect CRUD modals in AccionesMejoraPage)

## VPS Fixes Applied (2026-02-20/21/22)
- Celery Beat crash: Tablas `django_celery_beat_*` creadas en schema `public`
- seed_consecutivos: `empresa=empresa` -> `empresa_id=empresa.id`
- Migration gestion_transporte: `0002_alter_conductor_usuario.py`
- PWA skipWaiting + clientsClaim + cleanupOutdatedCaches
- Git sync: 30 commits sincronizados
- Redis password configurado (2026-02-22)
- Logrotate instalado (2026-02-22)
- Backup cron configurado (2026-02-22)
- Sentry DSN configurado backend + frontend (2026-02-22)
