# CLAUDE.md - StrateKaz SGI (Sistema de Gestion Integral)

## Descripcion del Proyecto

StrateKaz es un **Sistema de Gestion Integral (SGI)** multi-tenant tipo SaaS para empresas colombianas. Integra gestion estrategica, cumplimiento normativo (ISO 9001/14001/45001/27001), riesgos, HSEQ, cadena de valor, talento humano, finanzas y analitica en una sola plataforma.

**Dominio:** stratekaz.com | **App:** app.stratekaz.com
**Hosting:** VPS Hostinger (Nginx + Gunicorn + PostgreSQL + Redis + Celery)
**Versiones:** 5.1.0 (frontend) | 3.7.1 (root package) | API 4.0.0 (drf-spectacular)
**Idioma del sistema:** Espanol (es-co)

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Backend | Django + DRF | 5.0.9 / 3.14.0 |
| Frontend | React + TypeScript | 18.2 / 5.3 |
| Build Tool | Vite | 5.x |
| CSS | Tailwind CSS | 3.4 |
| State (server) | TanStack React Query | 5.14 |
| State (client) | Zustand | 4.4.7 |
| Forms | React Hook Form + Zod | 7.49 / 3.22 |
| Charts | ECharts + Recharts | 6.0 / 2.15 |
| Icons | Lucide React | 0.468+ |
| Tables | TanStack React Table | 8.21 |
| Rich Text | TipTap | 3.15 |
| Animations | Framer Motion | 12.23 |
| DB | PostgreSQL (django-tenants) | 15 |
| Cache/Broker | Redis | 7.x |
| Task Queue | Celery + Beat | 5.3.6 |
| Monitoring | Flower, Sentry | 2.0.1 / 2.20 |
| API Docs | drf-spectacular (OpenAPI) | 0.27 |
| Testing Backend | pytest + pytest-django | 9.x / 4.7 |
| Testing Frontend | Vitest + Testing Library | 1.x / 14.x |
| Linting Backend | Black + Ruff | 23.12 / 0.1.8 |
| Linting Frontend | ESLint + Prettier | 9.39 / 3.1 |
| Storybook | 8.5 | - |
| PDF Generation | WeasyPrint + jsPDF | 60.1 / 2.5 |
| Auth | JWT (SimpleJWT) | 5.3.0 |
| Multi-tenant | django-tenants | 3.10.0 |
| 3D Graphics | Three.js + React Three Fiber | 0.170 / 8.17 |
| Diagrams | @xyflow/react | 12.10 |
| PWA | vite-plugin-pwa | 1.2 |

---

## Estructura del Proyecto

```
StrateKaz/
├── backend/                  # Django REST API
│   ├── config/              # Configuracion Django
│   │   ├── settings/        # Settings modulares
│   │   │   ├── base.py      # Configuracion compartida (INSTALLED_APPS, middleware, etc.)
│   │   │   ├── development.py  # Overrides desarrollo (DEBUG=True, console email)
│   │   │   ├── production.py   # Overrides produccion (HSTS, Sentry, SMTP)
│   │   │   └── testing.py      # Overrides testing (SQLite in-memory, Celery eager)
│   │   ├── settings.py      # Legacy (deprecated - no usar)
│   │   ├── urls.py          # URL routing condicional por modulos
│   │   ├── celery.py        # Celery app configuration (17.9 KB)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/                # 16 modulos Django (~92 apps)
│   │   ├── core/            # N0: Users, RBAC, Menu, Middleware, Permissions
│   │   ├── tenant/          # N0: Multi-Tenant System (public schema)
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
│   ├── utils/               # Base models, logging, cache, validators, constants
│   ├── templates/           # Django templates
│   ├── tests/               # Integration tests
│   ├── requirements.txt     # Python dependencies (98 packages)
│   └── requirements/        # Requirements management
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/             # API clients (axios-config, auth, tenant, users, proveedores)
│   │   ├── components/      # Shared components (100+ components)
│   │   │   ├── common/      # UI fundamentals (64 files + FormBuilder)
│   │   │   ├── data-display/ # Data display components
│   │   │   ├── forms/       # Form components (DatePicker, RichText, SignaturePad)
│   │   │   ├── layout/      # Layout components (DataTableCard, FilterCard, etc.)
│   │   │   ├── mobile/      # Mobile-specific components
│   │   │   ├── modals/      # Modal components
│   │   │   ├── proveedores/ # Supplier components
│   │   │   └── users/       # User-related components
│   │   ├── constants/       # Constants (modules, permissions, brand, etc.)
│   │   ├── contexts/        # React Contexts (HeaderContext)
│   │   ├── features/        # Feature modules (22 modules, 642+ files)
│   │   ├── hooks/           # Custom hooks (19 hooks)
│   │   ├── layouts/         # Layout components (DashboardLayout, Sidebar, Header)
│   │   ├── lib/             # Utility libraries (API factory, CRUD hooks factory, animations)
│   │   ├── pages/           # Top-level pages (Login, Dashboard, Error, NotFound, etc.)
│   │   ├── routes/          # React Router config (8-level logical ordering)
│   │   ├── store/           # Zustand stores (authStore, themeStore)
│   │   ├── types/           # TypeScript types (10 type files)
│   │   ├── utils/           # Frontend utilities (formatters, dateUtils, cn)
│   │   └── __tests__/       # Test suites
│   ├── .storybook/          # Storybook 8.5 config
│   ├── package.json
│   └── vite.config.ts       # PWA, proxy, path aliases
├── marketing_site/          # Standalone React app (landing, pricing, etc.)
├── docker/                  # Docker configs (nginx, postgres init)
├── docs/                    # Documentacion exhaustiva (40+ archivos)
├── scripts/                 # Maintenance & migration scripts (12 scripts)
├── .github/                 # GitHub Actions workflows
│   └── workflows/           # CI, PR Checks, CodeQL
├── docker-compose.yml       # Dev environment (9 services)
├── docker-compose.prod.yml  # Production environment (6+ services)
├── Makefile                 # Development commands
├── .husky/                  # Git hooks (pre-commit: lint-staged)
├── CLAUDE.md                # AI assistant instructions (this file)
├── README.md                # Project overview
├── CONTRIBUTING.md          # Contribution guidelines
└── DEPLOY_CHECKLIST.md      # Deployment verification
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

Las apps se dividen en SHARED_APPS (schema public) y TENANT_APPS (schema por tenant) en `config/settings/base.py`. Las URLs se registran condicionalmente segun las apps instaladas (ver `config/urls.py`).

### Detalle de Apps por Nivel

**N1 - Gestion Estrategica (10 apps):**
configuracion, organizacion, identidad, planeacion, contexto, encuestas, gestion_proyectos, revision_direccion, gestion_documental, planificacion_sistema

**N2 - Motor Cumplimiento (5):** matriz_legal, requisitos_legales, partes_interesadas, reglamentos_internos, evidencias
**N2 - Motor Riesgos (6):** riesgos_procesos, ipevr, aspectos_ambientales, riesgos_viales, seguridad_informacion, sagrilaft_ptee
**N2 - Workflow Engine (4):** disenador_flujos, ejecucion, monitoreo, firma_digital

**N3 - HSEQ (9 apps):**
accidentalidad, seguridad_industrial, higiene_industrial, medicina_laboral, emergencias, gestion_ambiental, calidad, mejora_continua, gestion_comites

**N4 - Supply Chain (5):** catalogos, gestion_proveedores, compras, almacenamiento, programacion_abastecimiento
**N4 - Production Ops (4):** recepcion, procesamiento, producto_terminado, mantenimiento
**N4 - Logistics Fleet (4):** gestion_flota, gestion_transporte, despachos, pesv_operativo
**N4 - Sales CRM (4):** gestion_clientes, pipeline_ventas, pedidos_facturacion, servicio_cliente

**N5 - Talent Hub (11):** estructura_cargos, seleccion_contratacion, colaboradores, onboarding_induccion, formacion_reinduccion, desempeno, control_tiempo, novedades, proceso_disciplinario, nomina, off_boarding
**N5 - Admin Finance (4):** presupuesto, tesoreria, activos_fijos, servicios_generales
**N5 - Accounting (4):** config_contable, movimientos, informes_contables, integracion

**N6 - Analytics (7):** config_indicadores, indicadores_area, acciones_indicador, dashboard_gerencial, generador_informes, analisis_tendencias, exportacion_integracion
**N6 - Audit System (4):** logs_sistema, config_alertas, centro_notificaciones, tareas_recordatorios

---

## Comandos de Desarrollo

### Docker (recomendado)

```bash
make dev-setup       # Setup inicial: build + db + backend + migrate + frontend
make up              # Iniciar servicios
make down            # Detener servicios
make restart         # Reiniciar servicios
make logs            # Ver logs (tail -f)
make logs-backend    # Logs solo del backend
make logs-frontend   # Logs solo del frontend
make logs-db         # Logs solo de la base de datos
make migrate         # Ejecutar migraciones Django
make makemigrations  # Crear nuevas migraciones
make superuser       # Crear usuario admin
make collectstatic   # Recopilar archivos estaticos
make test            # Ejecutar pytest
make test-coverage   # Pytest con cobertura HTML
make shell-backend   # Shell interactivo en contenedor backend
make shell-frontend  # Shell en contenedor frontend
make shell-db        # Shell de base de datos
make db-backup       # Backup de base de datos
make db-restore      # Restaurar backup
make health          # Verificar salud de servicios
make clean           # Limpiar contenedores y volumenes
make clean-all       # Limpiar todo incluyendo imagenes
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
cd frontend && npm run build        # TypeScript check + Vite build
cd frontend && npm run preview      # Preview build de produccion
cd frontend && npm run lint         # ESLint (--max-warnings 0)
cd frontend && npm run format       # Prettier
cd frontend && npm run test         # Vitest
cd frontend && npm run test:watch   # Vitest watch mode
cd frontend && npm run test:coverage # Coverage report
cd frontend && npm run test:ui      # Vitest UI
cd frontend && npm run storybook    # Storybook en puerto 6006

# Root shortcuts
npm run dev              # Frontend dev
npm run build            # Frontend build
npm run lint:frontend    # Frontend lint
npm run format:frontend  # Frontend format
npm run db:migrate       # Backend migrate
npm run db:make          # Backend makemigrations
```

### Linting y Formatting

```bash
# Backend
black backend/ --check     # Check formatting (line length 88)
ruff check backend/        # Linting
pip-audit                  # Security audit

# Frontend
cd frontend && npx eslint src --max-warnings 0
cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"
cd frontend && npx tsc --noEmit    # Type check (strict mode)
npm audit                           # Security audit
```

---

## Arquitectura Backend

### Settings Modulares

El backend usa un **paquete de settings modular** en `config/settings/`:

| Archivo | Proposito |
|---------|-----------|
| `base.py` | Configuracion compartida: INSTALLED_APPS, middleware, REST_FRAMEWORK, JWT, Celery, cache |
| `development.py` | DEBUG=True, console email, CORS localhost, SHOW_PUBLIC_IF_NO_TENANT_FOUND=True |
| `production.py` | HSTS, SSL redirect, Sentry, SMTP email, CORS *.stratekaz.com, strict CSP |
| `testing.py` | SQLite in-memory, MD5 hasher, Celery eager mode, disabled logging |

**DJANGO_SETTINGS_MODULE:** `config.settings.development` (default) | `config.settings.production` | `config.settings.testing`

**NOTA:** `config/settings.py` (archivo legacy) esta deprecated. No usar directamente.

### Multi-Tenant

- Basado en `django-tenants` con schemas PostgreSQL (django_tenants.postgresql_backend)
- Tenant detectado por subdominio via `TenantMainMiddleware` (primer middleware)
- Autenticacion alternativa via header `X-Tenant-ID` (`TenantAuthenticationMiddleware`)
- Schemas: `public` (SHARED_APPS: Tenant, Domain, Plan, TenantUser) + schema por tenant (TENANT_APPS)
- Database router: `django_tenants.routers.TenantSyncRouter`
- Desarrollo: `SHOW_PUBLIC_IF_NO_TENANT_FOUND = True`
- Produccion: `SHOW_PUBLIC_IF_NO_TENANT_FOUND = False`

### Autenticacion

- JWT via `djangorestframework-simplejwt` con `HybridJWTAuthentication` (multi-tenant)
- Access token: 60 min | Refresh token: 7 dias (10080 min)
- Rotate + blacklist refresh tokens
- UPDATE_LAST_LOGIN: False (TenantUser maneja su propio tracking)
- Algorithm: HS256 | Header: `Bearer`
- Rate limiting: 5/min login, 3/min password_reset
- Endpoints: `POST /api/auth/login/`, `/api/auth/refresh/`, `/api/auth/logout/`

### API Patterns

- Base URL: `/api/`
- REST Framework + DjangoFilterBackend + SearchFilter + OrderingFilter
- Paginacion: PageNumberPagination (20 items/page)
- Auth requerida por defecto: `IsAuthenticated`
- Throttle rates: 30/min (anon), 120/min (user), 5/min (login), 3/min (password_reset)
- API docs: `/api/docs/` (Swagger), `/api/redoc/` (ReDoc), `/api/schema/` (OpenAPI) - requieren login
- Health check: `GET /api/health/` y `GET /api/health/deep/`
- API Version: 4.0.0 (drf-spectacular)

### URL Pattern por Modulo

```
# Siempre activos
/api/core/                  # N0: Core (users, RBAC, menu)
/api/tenant/                # N0: Multi-tenant
/api/auth/                  # Autenticacion (login, refresh, logout)
/api/health/                # Health checks

# N1: Gestion Estrategica (condicional)
/api/gestion-estrategica/   # Modulo principal
/api/configuracion/         # Acceso directo (compatibilidad)
/api/organizacion/          # Acceso directo (compatibilidad)
/api/identidad/             # Acceso directo (compatibilidad)
/api/planeacion/            # Acceso directo (compatibilidad)
/api/encuestas-dofa/        # Acceso directo (compatibilidad)
/api/proyectos/             # Acceso directo (compatibilidad)
/api/revision-direccion/    # Acceso directo (compatibilidad)

# N2: Cumplimiento & Riesgos (condicional)
/api/cumplimiento/          # Motor Cumplimiento
/api/riesgos/               # Motor Riesgos
/api/workflows/             # Workflow Engine

# N3: HSEQ (condicional)
/api/hseq/                  # HSEQ Management

# N4: Cadena de Valor (condicional)
/api/supply-chain/          # Supply Chain
/api/production-ops/        # Production Ops
/api/logistics-fleet/       # Logistics Fleet
/api/sales-crm/             # Sales CRM

# N5: Habilitadores (condicional)
/api/talent-hub/            # Talent Hub
/api/admin-finance/         # Admin Finance
/api/accounting/            # Accounting

# N6: Inteligencia (condicional)
/api/analytics/             # Analytics
/api/audit/                 # Audit System
```

### Modelo de Usuario

- Custom: `apps.core.User` (AUTH_USER_MODEL = 'core.User')
- Audit: `django-auditlog` (AUDITLOG_INCLUDE_ALL_MODELS = False, registro explicito requerido)
- Modulo de acceso validado via `ModuleAccessMiddleware`

### Middleware Stack (orden exacto - critico)

```
1.  django_tenants.middleware.main.TenantMainMiddleware  # DEBE ser primero
2.  apps.tenant.middleware.TenantAuthenticationMiddleware
3.  django.middleware.security.SecurityMiddleware
4.  whitenoise.middleware.WhiteNoiseMiddleware
5.  corsheaders.middleware.CorsMiddleware
6.  django.contrib.sessions.middleware.SessionMiddleware
7.  django.middleware.common.CommonMiddleware
8.  django.middleware.csrf.CsrfViewMiddleware
9.  django.contrib.auth.middleware.AuthenticationMiddleware
10. django.contrib.messages.middleware.MessageMiddleware
11. django.middleware.clickjacking.XFrameOptionsMiddleware
12. csp.middleware.CSPMiddleware
13. auditlog.middleware.AuditlogMiddleware
14. apps.core.middleware.ModuleAccessMiddleware
```

### Base Models (backend/utils/models.py)

Todos los modelos tenant deben heredar de estos base models:

| Clase | Campos | Uso |
|-------|--------|-----|
| `TimeStampedModel` | created_at, updated_at | Base temporal |
| `SoftDeleteModel` | is_deleted, deleted_at, deleted_by | Eliminacion logica (soft_delete/restore/hard_delete) |
| `AuditModel` | created_by, updated_by | Tracking de autor |
| `TenantModel` | Combina los 3 anteriores | **Usar para todos los modelos tenant** |
| `SharedModel` | Solo TimeStampedModel | Usar para modelos de schema public |
| `OrderedModel` | order | Mixin para ordenamiento manual |
| `SlugModel` | slug (unique, indexed) | Mixin para slugs |
| `ActivableModel` | is_active | Mixin para activar/desactivar |
| `CodeModel` | code (unique, indexed) | Mixin para codigos |
| `DescriptionModel` | name, description | Mixin para nombre + descripcion |

### Cache

- Backend: `django-redis` con aislamiento por tenant
- Key function: `utils.cache.make_tenant_cache_key` (prefija con schema_name del tenant)
- Location: `redis://localhost:6379/0` (configurable)
- Testing: `LocMemCache` (sin Redis)

### Celery

- Broker: Redis (redis://redis:6379/0)
- Result Backend: Redis (redis://redis:6379/1)
- Beat Scheduler: DatabaseScheduler (django_celery_beat)
- Colas: default, tenant_ops, emails, reports, files, maintenance, monitoring, scraping, compliance, notifications, workflow
- Task time limit: 30 min | Soft limit: 25 min
- Worker: prefetch_multiplier=4, max_tasks_per_child=1000
- Serializer: JSON
- Monitoring: Flower en puerto 5555

### Celery Beat - Tareas Programadas

| Tarea | Frecuencia | Cola |
|-------|------------|------|
| cleanup-temp-files-daily | 2 AM diario | maintenance |
| send-weekly-reports | Lunes 8 AM | reports |
| database-backup | Cada 6 horas | maintenance |
| system-health-check | Cada 15 min | monitoring |
| tenant-check-expirations-daily | 12:30 AM | tenant_ops |
| tenant-cleanup-stale-creating | Cada 15 min | tenant_ops |
| scrape-legal-updates-biweekly | 1 y 15 del mes, 3 AM | scraping |
| check-license-expirations-daily | 6 AM | compliance |
| send-expiration-notifications-daily | 7 AM | notifications |
| evidencias-check-expired | 6 AM | compliance |
| revision-check-overdue-compromisos | 7 AM | compliance |
| documental-check-revision-programada | 7:15 AM | compliance |
| th-check-contratos-por-vencer | 7:30 AM | notifications |
| th-check-periodos-prueba | 7:45 AM | notifications |
| workflow-check-overdue-tasks | Cada 5 min | workflow |
| workflow-update-metrics-daily | 1 AM | workflow |
| analytics-auto-kpi-daily | 2:30 AM | reports |
| analytics-dashboard-snapshot-hourly | Cada hora | reports |
| audit-ejecutar-verificacion-alertas | Cada hora | notifications |
| audit-escalar-alertas-no-atendidas | Cada 2 horas | notifications |
| audit-limpiar-alertas-antiguas | Domingo 3 AM | maintenance |
| audit-verificar-tareas-vencidas | Cada 30 min | notifications |
| audit-ejecutar-recordatorios | Cada 15 min | notifications |
| audit-resumen-tareas-diario | 8:30 AM | notifications |

### Management Commands (52+)

Comandos importantes para seeding y mantenimiento:

```bash
# Core - Seeding RBAC y permisos
python manage.py init_rbac
python manage.py sync_permissions
python manage.py seed_permisos_rbac
python manage.py deploy_seeds_all_tenants

# Core - Setup
python manage.py wait_for_db               # Esperar conexion DB (Docker)
python manage.py setup_demo_data           # Datos de demostracion

# Gestion Estrategica - Seeds
python manage.py seed_empresa              # Empresa base
python manage.py seed_configuracion_sistema
python manage.py seed_organizacion
python manage.py seed_identidad

# Tenant - Operaciones
python manage.py create_initial_setup      # Setup inicial tenant
python manage.py bootstrap_production      # Bootstrap produccion
python manage.py sync_tenant_seeds         # Sincronizar seeds a todos los tenants
python manage.py cleanup_orphan_schemas    # Limpiar schemas huerfanos
python manage.py repair_tenant_status      # Reparar estado de tenants
```

### Logging

| Handler | Destino | Uso |
|---------|---------|-----|
| console | stdout | Desarrollo |
| file | logs/app.log | Produccion (RotatingFileHandler) |
| error_file | logs/error.log | Errores WARNING+ |
| security_file | logs/security.log | Eventos de seguridad |

Formatters: verbose, simple, json (JSONFormatter para logging estructurado)

---

## Arquitectura Frontend

### Routing

- React Router v6 con paginas lazy-loaded (React.lazy + Suspense)
- 22 feature modules en `src/features/`
- 8 niveles de ordenamiento logico alineados con la arquitectura backend
- Route guards: `ProtectedRoute` (autenticacion), `ModuleGuard` (acceso a modulos)

**Modulos:** accounting, admin-finance, admin-global, analytics, audit-system, configuracion, cumplimiento, gestion-estrategica, hseq, logistics-fleet, mi-equipo, mi-portal, perfil, production-ops, riesgos, sales-crm, sistema-gestion, supply-chain, talent-hub, users, workflows

**Modulos mas grandes:** gestion-estrategica (182 files), talent-hub (150 files), hseq (55 files), cumplimiento (47 files), analytics (44 files), riesgos (43 files)

### State Management

- **Server state:** TanStack React Query v5 (cache, refetch, mutations)
- **Client state:** Zustand stores (`authStore`, `themeStore`)
- **Form state:** React Hook Form + Zod validation

### API Layer

- Axios con configuracion centralizada (`api/axios-config.ts`)
- API clients por dominio: `auth.api.ts`, `tenant.api.ts`, `users.api.ts`, `proveedores.api.ts`
- JWT interceptors para auth automatica
- **API Factory** (`lib/api-factory.ts`) para generacion automatica de clients
- **CRUD Hooks Factory** (`lib/crud-hooks-factory.ts`) para hooks React Query genericos
- **Query Keys Factory** (`lib/query-keys.ts`) para claves de cache consistentes
- **React Query Client** (`lib/queryClient.ts`) configuracion centralizada

### UI Framework

- Tailwind CSS con theme customizado (colores dinamicos via CSS variables por tenant)
- Lucide React para iconos (sistema de iconos dinamicos)
- Headless UI para componentes accesibles
- Framer Motion para animaciones (`lib/animations.ts`)
- Sonner para toast notifications
- Fonts: Inter (body/sans) + Montserrat (heading)
- Dark mode: class-based toggle
- Design System documentado en `docs/02-desarrollo/frontend/DESIGN-SYSTEM.md`

### Componentes Clave

- FormBuilder (drag & drop con @dnd-kit) - 6 archivos
- DynamicFormRenderer (28 KB - renderizado avanzado de formularios)
- TanStack React Table para data tables
- TipTap para rich text editing (13 KB)
- React Signature Canvas para firma digital (13 KB)
- ECharts + Recharts para visualizaciones
- React Three Fiber / Three.js para 3D
- React Flow (@xyflow/react) para diagramas de flujo
- DatePicker / DateRangePicker
- PageTabs (18.5 KB - sistema de tabs por pagina)
- SelectionCard (15 KB - tarjetas de seleccion)

### Custom Hooks (19)

| Hook | Proposito |
|------|-----------|
| `useAuth` | Estado y metodos de autenticacion |
| `usePermissions` | Verificacion RBAC de permisos |
| `useGenericCRUD` | Operaciones CRUD genericas |
| `useDynamicTheme` | Colores de tema dinamicos por tenant |
| `useBrandingConfig` | Configuracion de branding |
| `useIcons` | Registro de iconos dinamicos |
| `useFormModal` | Estado de formularios modales |
| `useTenants` | Operaciones multi-tenant |
| `useSignature` | Manejo de firma digital |
| `usePageHeader` | Estado del header de pagina |
| `usePageSections` | Secciones de pagina |
| `useModuleColor` | Color por modulo |
| `useResponsive` | Helpers de layout responsive |
| `useResponsiveView` | Tipo de vista (mobile/tablet/desktop) |
| `useMediaQuery` | Media queries |
| `useTimeElapsed` | Calculos de tiempo transcurrido |
| `useLastRoute` | Tracking de ultima ruta visitada |
| `useIsExterno` | Deteccion de usuario externo |

### PWA (Progressive Web App)

- Configurado via `vite-plugin-pwa` en `vite.config.ts`
- Auto-update habilitado
- Manifest dinamico desde API
- Estrategias de cache: API (NetworkFirst 24h), Imagenes (CacheFirst 30d), Fonts (CacheFirst 1y)
- Max cache file size: 15 MB

### Frontend Constants

| Archivo | Contenido |
|---------|-----------|
| `modules.ts` | Definiciones y metadata de modulos |
| `permissions.ts` | Definiciones de permisos RBAC (9.6 KB) |
| `brand.ts` | Colores y estilos de marca |
| `performance.ts` | Configuracion de rendimiento |
| `ui-labels.ts` | Labels de interfaz (espanol) |
| `timezones.ts` | Definiciones de zonas horarias |
| `tenant-options.ts` | Opciones de configuracion de tenant |

---

## CI/CD

### GitHub Actions Workflows

1. **CI (`ci.yml`)** - Push/PR a main/develop
   - Backend (Python 3.11 + PostgreSQL 15): Django checks, migrations, collectstatic, tests (pytest), Black check, Ruff lint, pip-audit
   - Frontend (Node 20): TypeScript check, ESLint (max-warnings 0), npm audit, Vite build, bundle size check
   - Ambos en paralelo, cancel-in-progress en nuevo push

2. **PR Checks (`pr-checks.yml`)** - Pull Requests
   - Validacion titulo: Conventional Commits (`type(scope): description`)
   - Tipos: feat, fix, docs, style, refactor, perf, test, chore, build, ci
   - Deteccion conflictos, estadisticas de cambios, dependency check

3. **CodeQL (`codeql.yml`)** - Security analysis
   - JavaScript + Python
   - Push, PRs, y schedule (lunes 6 AM UTC)

### Git Hooks (Husky)

- Pre-commit: `lint-staged` en frontend
  - `*.ts, *.tsx` -> Prettier + ESLint (max-warnings 50)
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
| celery | - | Worker asincrono |
| celerybeat | - | Scheduler tareas periodicas |
| flower* | 5555 | Monitor Celery (profile: monitoring) |
| frontend* | 3010 | React dev server (profile: frontend) |
| pgadmin* | 5050 | Admin PostgreSQL (profile: tools) |
| redis-commander* | 8081 | Admin Redis (profile: tools) |

*Servicios opcionales activados por profiles

**Volumes:** postgres_data, redis_data, static_volume, media_volume, pgadmin_data
**Network:** stratekaz_network (bridge)

### Produccion - VPS Hostinger (sin Docker actualmente)

El entorno de produccion corre directamente en **VPS Hostinger** sin Docker:

| Componente | Descripcion |
|------------|-------------|
| Nginx | Reverse proxy + SSL/TLS + static files |
| Gunicorn | WSGI server para Django |
| PostgreSQL 15 | Base de datos con schemas por tenant |
| Redis 7 | Cache + Celery broker |
| Celery Worker | Procesamiento asincrono |
| Celery Beat | Tareas programadas |

**Nota:** Existe `docker-compose.prod.yml` listo para migrar a Docker si se decide en el futuro.

**Features:** Health checks, centralized logging (/var/log/stratekaz)

---

## Variables de Entorno

### Archivos de configuracion

- `/.env.example` - Root config (Docker compose)
- `/.env.production.example` - Production config (7.1 KB)
- `/backend/.env.example` - Backend config
- `/backend/.env.security.example` - Security-specific vars
- `/frontend/.env.example` - Frontend dev
- `/frontend/.env.production` - Frontend prod

### Variables criticas

```bash
# Django
SECRET_KEY=           # Requerido, sin default
DEBUG=False           # False en produccion
ALLOWED_HOSTS=
DJANGO_SETTINGS_MODULE=config.settings.development  # o production/testing

# Database (PostgreSQL - django-tenants)
DB_ENGINE=django_tenants.postgresql_backend
DB_NAME=stratekaz
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
CONN_MAX_AGE=60       # Connection pooling

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60     # minutos
JWT_REFRESH_TOKEN_LIFETIME=10080 # 7 dias

# Frontend
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=StrateKaz
VITE_BASE_DOMAIN=stratekaz.com   # produccion

# Multi-tenant
TENANT_BASE_DOMAIN=

# Email (dev: console, prod: SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Sentry (solo produccion)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# AWS S3 (produccion)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=
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

# Testing environment: SQLite in-memory, MD5 hasher, Celery eager, logging disabled
```

### Frontend

```bash
cd frontend && npm run test                 # Vitest
cd frontend && npm run test:watch           # Watch mode
cd frontend && npm run test:coverage        # Coverage report (v8 provider)
cd frontend && npm run test:ui              # Vitest UI

# Coverage thresholds: 80% (lines, functions, branches, statements)
# Environment: jsdom, globals enabled
# Test structure: src/__tests__/ (components, features, hooks, integration, utils)
```

---

## Documentacion

Toda la documentacion detallada esta en `/docs/`:

- `docs/00-INDICE.md` - Indice maestro con tabla de contenidos
- `docs/01-arquitectura/` - Arquitectura, DB, ER diagrams, RBAC, Multi-tenant, Admin Global
- `docs/02-desarrollo/` - API endpoints, autenticacion, convenciones, testing, snippets
- `docs/02-desarrollo/backend/` - Workflows, firmas, integraciones, branding dinamico
- `docs/02-desarrollo/frontend/` - Design system, hooks, patrones, iconos, navegacion, React Query
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
- **Models:** Heredar de `TenantModel` (tenant) o `SharedModel` (public)
- **Auditlog:** Registrar modelos explicitamente con `auditlog.registry.register(Model)`
- **Settings:** Usar `config.settings.base` como base, overrides por entorno

### Frontend (TypeScript/React)

- **Strict TypeScript** (noEmit check en CI, target ES2020)
- **Functional components** con hooks
- **ESLint** flat config, max-warnings=0 en CI (50 en lint-staged)
- **Prettier** (printWidth 100, singleQuote, trailingComma es5)
- **Tailwind CSS** para estilos (no CSS modules, dynamic branding via CSS vars)
- **Features:** kebab-case directories en `src/features/` (modulos de negocio)
- **Pages:** Top-level pages en `src/pages/` (Login, Dashboard, Error)
- **Components:** PascalCase para archivos y componentes
- **Hooks:** camelCase prefijo `use` en `src/hooks/`
- **Types:** centralizados en `src/types/`
- **API calls:** a traves de api clients en `src/api/` o via `lib/api-factory.ts`
- **Path alias:** `@` = `./src` (ej: `import { Button } from '@/components/common/Button'`)

### General

- **Commits:** Conventional Commits (feat/fix/docs/refactor/etc.)
- **Branches:** `type/description` (ej: `feat/risk-matrix`)
- **Idioma codigo:** Ingles para codigo, espanol para UI/labels/docs
- **No secrets en codigo:** usar .env para configuracion sensible

---

## Seguridad

### Autenticacion & Autorizacion
- JWT authentication con blacklist y rotacion automatica
- HybridJWTAuthentication (soporte multi-tenant)
- Rate limiting: 5/min login, 3/min password_reset, 30/min anon, 120/min user
- RBAC via ModuleAccessMiddleware

### Headers & Proteccion
- CSRF protection (cookie HTTPOnly, SameSite=Lax)
- CSP headers (restrictivos en produccion, permisivos en desarrollo)
- HSTS con preload (1 ano, incluye subdominios)
- X-Frame-Options: DENY
- Content-Type-Nosniff: True
- Referrer-Policy: strict-origin-when-cross-origin
- SSL redirect enforced en produccion

### CORS
- Desarrollo: localhost:3010, 5173, regex *.localhost
- Produccion: regex *.stratekaz.com
- Credentials: True | Allow-Headers incluye `x-tenant-id`

### Monitoreo & Scanning
- Security scanning: CodeQL + pip-audit + npm audit
- Audit log selectivo (django-auditlog, registro explicito por modelo)
- Sentry para error tracking (solo produccion)
- System health checks cada 15 min

---

## Notas Importantes

1. **Multi-tenant:** Siempre considerar el contexto de tenant al hacer queries. El middleware detecta el tenant por subdominio. Usar `TenantModel` como base para modelos en TENANT_APPS.
2. **Modular:** Las apps se registran condicionalmente en `config/urls.py`. Verificar con `is_app_installed()` antes de referenciar modelos cross-module.
3. **Migrations:** Ejecutar en todos los schemas: `python manage.py migrate_schemas`
4. **Seeds:** Muchos modulos requieren seeds iniciales. Usar `deploy_seeds_all_tenants` para aplicar a todos los tenants, o ejecutar seeds individuales.
5. **Settings:** Usar el paquete modular `config/settings/` (base + development/production/testing). El archivo `config/settings.py` esta deprecated.
6. **Database:** PostgreSQL con `django_tenants.postgresql_backend`. No usar MySQL directamente.
7. **Cache:** Redis con aislamiento por tenant via `make_tenant_cache_key`.
8. **Frontend SPA:** En produccion (VPS Hostinger), Nginx sirve el frontend directamente. Django solo maneja `/api/`.
9. **PWA:** El frontend soporta Progressive Web App con service worker y cache strategies.
10. **Celery:** 11 colas especializadas + 24 tareas programadas. En testing se ejecuta en modo sincrono (eager).
11. **Hosting:** El proyecto corre en **VPS Hostinger** con Nginx + Gunicorn + PostgreSQL + Redis + Celery. NO se usa cPanel ni Docker en produccion. El archivo `config/settings.py` (legacy MySQL) esta deprecated.
