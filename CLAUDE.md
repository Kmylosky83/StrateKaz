# CLAUDE.md - StrateKaz SGI (Sistema de Gestion Integral)

## Descripcion del Proyecto

StrateKaz es un **Sistema de Gestion Integral (SGI)** multi-tenant tipo SaaS para empresas colombianas. Integra gestion estrategica, cumplimiento normativo (ISO 9001/14001/45001/27001), riesgos, HSEQ, cadena de valor, talento humano, finanzas y analitica en una sola plataforma.

**Dominio:** stratekaz.com | **App:** app.stratekaz.com
**Version actual:** 5.1.0 (frontend) | **Idioma del sistema:** Espanol (es-co)

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Backend | Django + DRF | 5.0.9 / 3.14.0 |
| Frontend | React + TypeScript | 18.2 / 5.3+ |
| Build Tool | Vite | 5.x |
| CSS | Tailwind CSS | 3.4 |
| State (server) | TanStack React Query | 5.x |
| State (client) | Zustand | 4.x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Charts | ECharts + Recharts | 6.x / 2.x |
| Icons | Lucide React | 0.468+ |
| Tables | TanStack React Table | 8.x |
| Rich Text | TipTap | 3.x |
| Animations | Framer Motion | 12.x |
| DB | MySQL (settings) / PostgreSQL (Docker) | 8.x / 15 |
| Cache/Broker | Redis | 7.x |
| Task Queue | Celery + Beat | 5.3.6 |
| Monitoring | Flower, Sentry | 2.x / 2.20 |
| API Docs | drf-spectacular (OpenAPI) | 0.27 |
| Testing Backend | pytest + pytest-django | 9.x |
| Testing Frontend | Vitest + Testing Library | 1.x |
| Linting Backend | Black + Ruff | 23.12 / 0.1.8 |
| Linting Frontend | ESLint + Prettier | 9.x / 3.x |
| Storybook | 8.5 | - |
| PDF Generation | WeasyPrint + jsPDF | 60.1 / 2.5 |
| Auth | JWT (SimpleJWT) | 5.3.0 |
| Multi-tenant | django-tenants | 3.10.0 |

---

## Estructura del Proyecto

```
StrateKaz/
├── backend/                  # Django REST API
│   ├── config/              # Settings, URLs, WSGI, Celery
│   │   ├── settings.py      # Configuracion principal (6 niveles de apps)
│   │   ├── urls.py          # URL routing condicional por modulos
│   │   ├── celery.py        # Celery app configuration
│   │   └── wsgi.py
│   ├── apps/                # 16 modulos Django (~92 apps)
│   │   ├── core/            # N0: Users, RBAC, Menu, Middleware
│   │   ├── tenant/          # N0: Multi-Tenant System
│   │   ├── gestion_estrategica/  # N1: Direccion Estrategica (10 apps)
│   │   ├── motor_cumplimiento/   # N2: Compliance Engine (5 apps)
│   │   ├── motor_riesgos/        # N2: Risk Engine (6 apps)
│   │   ├── workflow_engine/      # N2: BPMN Workflow + Firma Digital (4 apps)
│   │   ├── hseq_management/     # N3: HSEQ Torre de Control (9 apps)
│   │   ├── supply_chain/        # N4: Supply Chain (5 apps)
│   │   ├── production_ops/      # N4: Production Operations (4 apps)
│   │   ├── logistics_fleet/     # N4: Logistics & Fleet (4 apps)
│   │   ├── sales_crm/          # N4: Sales CRM (4 apps)
│   │   ├── talent_hub/         # N5: Talent Hub (11 apps)
│   │   ├── admin_finance/      # N5: Admin Finance (4 apps)
│   │   ├── accounting/         # N5: Accounting (4 apps)
│   │   ├── analytics/          # N6: Analytics & KPIs (7 apps)
│   │   └── audit_system/       # N6: Audit, Notifications, Alerts (4 apps)
│   ├── utils/               # Utilidades compartidas (logging, helpers)
│   ├── templates/           # Django templates
│   └── requirements.txt     # Python dependencies
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/             # API clients (axios-config, auth, tenant, users)
│   │   ├── components/      # Shared components
│   │   ├── constants/       # Constants
│   │   ├── contexts/        # React Contexts
│   │   ├── features/        # Feature-specific components
│   │   ├── hooks/           # Custom hooks
│   │   ├── layouts/         # Layout components
│   │   ├── lib/             # Utility libraries
│   │   ├── pages/           # Page-level modules (21 modules)
│   │   ├── routes/          # React Router config
│   │   ├── store/           # Zustand stores (authStore, themeStore)
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Frontend utilities
│   ├── package.json
│   └── vite.config.ts
├── marketing_site/          # Standalone React app (landing, pricing, etc.)
├── docker/                  # Docker configs (nginx, entrypoint)
├── docs/                    # Documentacion exhaustiva (40+ archivos)
├── scripts/                 # Maintenance & migration scripts
├── .github/                 # GitHub Actions workflows
│   ├── workflows/           # CI, PR Checks, CodeQL, Docker Build
│   └── scripts/             # Local CI test scripts
├── docker-compose.yml       # Dev environment
├── docker-compose.prod.yml  # Production environment
├── Makefile                 # Development commands
└── .husky/                  # Git hooks (pre-commit: lint-staged)
```

---

## Arquitectura de 6 Niveles

El sistema se organiza en 6 niveles de apps Django registradas condicionalmente:

| Nivel | Nombre | Descripcion | Apps |
|-------|--------|-------------|------|
| N0 | Core Base | Users, RBAC, Menu, Config, Multi-Tenant | 2 |
| N1 | Estrategico | Direccion Estrategica, Contexto, Planeacion, Docs | 10 |
| N2 | Cumplimiento | Compliance, Riesgos, Workflows, Firma Digital | 15 |
| N3 | Torre Control | HSEQ: Calidad, SST, Ambiental, Comites | 9 |
| N4 | Cadena Valor | Supply Chain, Production, Logistics, Sales | 17 |
| N5 | Habilitadores | Talent Hub, Finance, Accounting | 19 |
| N6 | Inteligencia | Analytics, KPIs, Audit System, Notifications | 11 |

Las URLs se registran condicionalmente segun las apps instaladas (ver `config/urls.py`).

---

## Comandos de Desarrollo

### Docker (recomendado)

```bash
make dev-setup       # Setup inicial: build + start + migrate
make up              # Iniciar servicios
make down            # Detener servicios
make logs            # Ver logs (tail -f)
make logs-backend    # Logs solo del backend
make migrate         # Ejecutar migraciones Django
make makemigrations  # Crear nuevas migraciones
make superuser       # Crear usuario admin
make test            # Ejecutar pytest
make test-coverage   # Pytest con cobertura HTML
make shell-backend   # Shell interactivo en contenedor backend
make db-backup       # Backup de base de datos
make health          # Verificar salud de servicios
make clean           # Limpiar contenedores y volumenes
```

### Sin Docker

```bash
# Backend
cd backend && python manage.py runserver 0.0.0.0:8000
cd backend && python manage.py migrate
cd backend && python manage.py makemigrations
cd backend && pytest

# Frontend
cd frontend && npm run dev          # Dev server en puerto 3010
cd frontend && npm run build        # Build produccion
cd frontend && npm run lint         # ESLint (--max-warnings 0)
cd frontend && npm run format       # Prettier
cd frontend && npm run test         # Vitest
cd frontend && npm run test:coverage
cd frontend && npm run storybook    # Storybook en puerto 6006

# Root shortcuts
npm run dev              # Frontend dev
npm run build            # Frontend build
npm run lint:frontend    # Frontend lint
npm run db:migrate       # Backend migrate
```

### Linting y Formatting

```bash
# Backend
black backend/ --check     # Check formatting
ruff check backend/        # Linting
pip-audit                  # Security audit

# Frontend
cd frontend && npx eslint src --max-warnings 0
cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"
cd frontend && npx tsc --noEmit    # Type check
npm audit                           # Security audit
```

---

## Arquitectura Backend

### Multi-Tenant

- Basado en `django-tenants` con schemas PostgreSQL
- Tenant detectado por subdominio via `TenantMiddleware`
- Header `x-tenant-id` para CORS
- Schemas: `public` (master) + schema por tenant

### Autenticacion

- JWT via `djangorestframework-simplejwt`
- Access token: 60 min | Refresh token: 7 dias
- Rotate + blacklist refresh tokens
- Rate limiting en login/refresh (`django-ratelimit`)
- Endpoints: `POST /api/auth/login/`, `/api/auth/refresh/`, `/api/auth/logout/`

### API Patterns

- Base URL: `/api/`
- REST Framework + DjangoFilterBackend + SearchFilter + OrderingFilter
- Paginacion: PageNumberPagination (20 items/page)
- Auth requerida por defecto: `IsAuthenticated`
- API docs: `/api/docs/` (Swagger) y `/api/redoc/` (ReDoc) - requieren login
- Health check: `GET /api/health/` y `GET /api/health/deep/`

### URL Pattern por Modulo

```
/api/core/                  # N0: Core
/api/tenant/                # N0: Multi-tenant
/api/gestion-estrategica/   # N1: Direccion Estrategica
/api/configuracion/         # N1: Configuracion
/api/organizacion/          # N1: Organizacion
/api/identidad/             # N1: Identidad
/api/planeacion/            # N1: Planeacion
/api/cumplimiento/          # N2: Motor Cumplimiento
/api/riesgos/               # N2: Motor Riesgos
/api/workflows/             # N2: Workflow Engine
/api/hseq/                  # N3: HSEQ Management
/api/supply-chain/          # N4: Supply Chain
/api/production-ops/        # N4: Production Ops
/api/logistics-fleet/       # N4: Logistics Fleet
/api/sales-crm/             # N4: Sales CRM
/api/talent-hub/            # N5: Talent Hub
/api/admin-finance/         # N5: Admin Finance
/api/accounting/            # N5: Accounting
/api/analytics/             # N6: Analytics
/api/audit/                 # N6: Audit System
```

### Modelo de Usuario

- Custom: `apps.core.User` (AUTH_USER_MODEL)
- Audit: `django-auditlog` (AUDITLOG_INCLUDE_ALL_MODELS = True)
- Modulo de acceso validado via `ModuleAccessMiddleware`

### Middleware Stack (orden)

1. CorsMiddleware
2. SecurityMiddleware (Django)
3. WhiteNoiseMiddleware (static files)
4. SessionMiddleware
5. CommonMiddleware
6. CSPMiddleware (Content Security Policy)
7. CsrfViewMiddleware
8. AuthenticationMiddleware
9. MessageMiddleware
10. XFrameOptionsMiddleware
11. AuditlogMiddleware
12. TenantMiddleware (custom)
13. IPBlockMiddleware (custom)
14. SecurityMiddleware (custom)
15. ModuleAccessMiddleware (custom)

### Celery

- Broker: Redis (redis://redis:6379/0)
- Result Backend: Redis (redis://redis:6379/1)
- Beat Scheduler: DatabaseScheduler (django_celery_beat)
- Colas: default, tenant_ops, emails, reports, files, maintenance, monitoring, scraping, compliance, notifications, workflow
- Task time limit: 30 min | Soft limit: 25 min
- Monitoring: Flower en puerto 5555

---

## Arquitectura Frontend

### Routing

- React Router v6 con paginas lazy-loaded
- 21 modulos de paginas: accounting, admin-finance, admin-global, analytics, audit-system, configuracion, cumplimiento, gestion-estrategica, hseq, logistics-fleet, mi-equipo, mi-portal, perfil, production-ops, riesgos, sales-crm, sistema-gestion, supply-chain, talent-hub, users, workflows

### State Management

- **Server state:** TanStack React Query v5 (cache, refetch, mutations)
- **Client state:** Zustand stores (`authStore`, `themeStore`)
- **Form state:** React Hook Form + Zod validation

### API Layer

- Axios con configuracion centralizada (`api/axios-config.ts`)
- API clients por dominio: `auth.api.ts`, `tenant.api.ts`, `users.api.ts`, `proveedores.api.ts`
- JWT interceptors para auth automatica

### UI Framework

- Tailwind CSS con theme customizado
- Lucide React para iconos
- Headless UI para componentes accesibles
- Framer Motion para animaciones
- Sonner para toast notifications
- Design System documentado en `docs/02-desarrollo/frontend/DESIGN-SYSTEM.md`

### Componentes Clave

- FormBuilder (drag & drop con @dnd-kit)
- TanStack React Table para data tables
- TipTap para rich text editing
- React Signature Canvas para firma digital
- ECharts + Recharts para visualizaciones
- React Three Fiber / Three.js para 3D
- React Flow (@xyflow/react) para diagramas de flujo

---

## CI/CD

### GitHub Actions Workflows

1. **CI (`ci.yml`)** - Push/PR a main/develop
   - Backend: Django checks, migrations, tests (pytest), Black, Ruff, pip-audit
   - Frontend: TypeScript check, ESLint, npm audit, Vite build, bundle size check
   - Ambos en paralelo

2. **PR Checks (`pr-checks.yml`)** - Pull Requests
   - Validacion titulo: Conventional Commits (`type(scope): description`)
   - Tipos: feat, fix, docs, style, refactor, perf, test, chore, build, ci
   - Deteccion conflictos, estadisticas de cambios, dependency check

3. **CodeQL (`codeql.yml`)** - Security analysis
   - JavaScript + Python
   - Push, PRs, y schedule (lunes 6 AM UTC)

### Git Hooks (Husky)

- Pre-commit: `lint-staged` en frontend
  - `*.ts, *.tsx` -> Prettier + ESLint
  - `*.css, *.json` -> Prettier

### Conventional Commits

Formato requerido para PR titles y recomendado para commits:
```
type(scope): description

feat(riesgos): add risk matrix visualization
fix(auth): resolve JWT refresh token rotation
docs(api): update endpoint documentation
refactor(core): simplify middleware chain
```

---

## Docker

### Servicios de Desarrollo (`docker-compose.yml`)

| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| db (PostgreSQL 15) | 5432 | Base de datos principal |
| redis (Redis 7) | 6379 | Cache + Celery broker |
| backend | 8000 | Django API |
| celery | - | Worker asíncrono |
| celerybeat | - | Scheduler tareas periodicas |
| flower* | 5555 | Monitor Celery (profile: monitoring) |
| frontend* | 3010 | React dev server (profile: frontend) |
| pgadmin* | 5050 | Admin PostgreSQL (profile: tools) |
| redis-commander* | 8081 | Admin Redis (profile: tools) |

*Servicios opcionales activados por profiles

### Produccion (`docker-compose.prod.yml`)

- Nginx reverse proxy (80/443)
- Gunicorn workers
- Health checks con curl
- Resource limits
- Redis con password + AOF persistence
- Logs centralizados

---

## Variables de Entorno

### Archivos de configuracion

- `/.env.example` - Root config (Docker compose)
- `/backend/.env.example` - Backend config
- `/.env.production.example` - Production config
- `/frontend/.env.example` - Frontend dev
- `/frontend/.env.production` - Frontend prod

### Variables criticas

```bash
# Django
SECRET_KEY=           # Requerido, sin default
DEBUG=False           # False en produccion
ALLOWED_HOSTS=

# Database
DB_NAME=stratekaz_master
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60     # minutos
JWT_REFRESH_TOKEN_LIFETIME=10080 # 7 dias

# Frontend
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=StrateKaz

# Multi-tenant
TENANT_BASE_DOMAIN=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Sentry
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

---

## Testing

### Backend

```bash
cd backend && pytest                        # Run all tests
cd backend && pytest --keepdb               # Reuse test DB
cd backend && pytest -x                     # Stop on first failure
cd backend && pytest apps/core/             # Test specific app
cd backend && pytest --cov=apps --cov-report=html  # Coverage
```

### Frontend

```bash
cd frontend && npm run test                 # Vitest
cd frontend && npm run test:watch           # Watch mode
cd frontend && npm run test:coverage        # Coverage report
cd frontend && npm run test:ui              # Vitest UI
```

---

## Documentacion

Toda la documentacion detallada esta en `/docs/`:

- `docs/01-arquitectura/` - Arquitectura, DB, ER diagrams, RBAC, Multi-tenant
- `docs/02-desarrollo/` - API endpoints, autenticacion, convenciones, testing
- `docs/02-desarrollo/backend/` - Workflows, firmas, integraciones
- `docs/02-desarrollo/frontend/` - Design system, hooks, patrones, iconos
- `docs/03-modulos/` - Guias por modulo (planeacion, riesgos, talent hub)
- `docs/04-devops/` - Docker, GitHub Actions, Celery/Redis
- `docs/05-refactoring/` - Auditorias, planes de mejora, estado actual

---

## Convenciones de Codigo

### Backend (Python/Django)

- **Formatter:** Black (line length 88)
- **Linter:** Ruff
- **Locale:** es-co (LANGUAGE_CODE), America/Bogota (TIME_ZONE)
- **Auto field:** BigAutoField
- **Apps:** Prefijo `apps.` + modulo + submodulo (ej: `apps.motor_riesgos.ipevr`)
- **URLs:** kebab-case para rutas API (ej: `/api/gestion-estrategica/`)
- **Serializers:** DRF ModelSerializer con drf-spectacular para docs
- **Filters:** django-filter para filtrado de querysets

### Frontend (TypeScript/React)

- **Strict TypeScript** (noEmit check en CI)
- **Functional components** con hooks
- **ESLint** max-warnings=0 en CI (50 en lint-staged)
- **Prettier** para formatting
- **Tailwind CSS** para estilos (no CSS modules)
- **Pages:** kebab-case directories en `src/pages/`
- **Components:** PascalCase para archivos y componentes
- **Hooks:** camelCase prefijo `use` en `src/hooks/`
- **Types:** centralizados en `src/types/`
- **API calls:** a traves de api clients en `src/api/`

### General

- **Commits:** Conventional Commits (feat/fix/docs/refactor/etc.)
- **Branches:** `type/description` (ej: `feat/risk-matrix`)
- **Idioma codigo:** Ingles para codigo, espanol para UI/labels/docs
- **No secrets en codigo:** usar .env para configuracion sensible

---

## Seguridad

- JWT authentication con blacklist
- CSRF protection (cookie HTTPOnly)
- CSP headers (restrictivos en produccion)
- HSTS con preload (1 ano)
- Rate limiting en endpoints de auth
- IP blocking middleware
- Module access middleware
- CORS restrictivo en produccion
- XSS/CSRF/Clickjacking protections
- Security scanning: CodeQL + pip-audit + npm audit
- Audit log en todos los modelos (django-auditlog)
- Sentry para error tracking (solo produccion)

---

## Notas Importantes

1. **Multi-tenant:** Siempre considerar el contexto de tenant al hacer queries. El middleware detecta el tenant por subdominio.
2. **Modular:** Las apps se registran condicionalmente. Verificar con `is_app_installed()` antes de referenciar modelos cross-module.
3. **Migrations:** Ejecutar en todos los schemas: `python manage.py migrate_schemas`
4. **Seeds:** Algunos modulos requieren seeds iniciales (sidebar structure, notification types, icon registry).
5. **Dual DB:** Settings usa MySQL engine pero Docker compose usa PostgreSQL. El entorno Docker es el standard.
6. **cPanel mode:** `USE_CPANEL=True` activa modo sincrono de Celery y cache en DB.
7. **Frontend SPA:** En produccion, Django sirve el build del frontend via `serve_frontend` catch-all.
