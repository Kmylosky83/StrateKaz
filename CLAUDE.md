# CLAUDE.md - StrateKaz SGI (Sistema de Gestion Integral)

## Descripcion del Proyecto

StrateKaz es un **Sistema de Gestion Integral (SGI)** multi-tenant tipo SaaS para empresas colombianas. Integra gestion estrategica, cumplimiento normativo (ISO 9001/14001/45001/27001), riesgos, HSEQ, cadena de valor, talento humano, finanzas y analitica en una sola plataforma.

**Dominio:** stratekaz.com | **App:** app.stratekaz.com
**Hosting:** VPS Hostinger (Nginx + Gunicorn + PostgreSQL + Redis + Celery)
**Versiones:** 5.1.0 (frontend) | 3.7.1 (root package) | API 4.0.0 (drf-spectacular)
**Idioma del sistema:** Espanol (es-co)

---

## Modelos IA — Estrategia de Sesiones

| Modelo | Cuándo usarlo | Comando |
|--------|--------------|---------|
| **Sonnet** (default) | Desarrollo diario: Django, React, APIs, lógica SST/ISO, debugging | sesión normal |
| **Opus** | Auditorías de arquitectura, decisiones multi-tenant críticas, análisis cross-módulo, pre-deploy review | `/model opus` |
| **Haiku** | Boilerplate mecánico: CRUD, admin.py, migraciones repetitivas, seeds | `/model haiku` |

> Sonnet arranca automáticamente. Escalar a Opus o bajar a Haiku con `/model` cuando aplique.

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
| Testing | pytest + Vitest | 9.x / 1.x |
| Linting | Black + Ruff / ESLint + Prettier | - |
| Auth | JWT (SimpleJWT) | 5.3.0 |
| Multi-tenant | django-tenants | 3.10.0 |
| PDF | WeasyPrint + jsPDF | 60.1 / 2.5 |
| 3D | Three.js + React Three Fiber | 0.170 / 8.17 |
| Diagrams | @xyflow/react | 12.10 |
| PWA | vite-plugin-pwa | 1.2 |

---

## Estructura del Proyecto

```
StrateKaz/
├── backend/                  # Django REST API
│   ├── config/              # Settings modulares (base/development/production/testing)
│   ├── apps/                # 16 modulos Django (~84 apps) — ver Arquitectura abajo
│   ├── utils/               # Base models, logging, cache, validators
│   └── requirements.txt     # Python dependencies
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/             # API clients (axios-config, auth, tenant, users)
│   │   ├── components/      # Shared components (100+ en common/forms/layout/modals)
│   │   ├── constants/       # modules, permissions, brand, ui-labels
│   │   ├── features/        # 22 feature modules (642+ files)
│   │   ├── hooks/           # 19 custom hooks
│   │   ├── layouts/         # DashboardLayout, Sidebar, Header
│   │   ├── lib/             # API factory, CRUD hooks factory, query-keys, animations
│   │   ├── pages/           # Login, Dashboard, Error, NotFound
│   │   ├── routes/          # React Router config
│   │   ├── store/           # Zustand (authStore, themeStore)
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # formatters, dateUtils, cn
│   └── vite.config.ts       # PWA, proxy, path aliases
├── marketing_site/          # Landing page (standalone React app)
├── docs/                    # Documentacion exhaustiva (47 archivos)
├── scripts/                 # Deploy, backup, verification scripts
├── docker-compose.yml       # Dev environment
└── Makefile                 # Development commands
```

---

## Arquitectura: 5 Capas + Portales

El sistema se organiza en capas con independencia estricta entre modulos:

```
C0 — PLATAFORMA (infraestructura, nunca se toca en sprints de modulo)
  ├── Core (users, RBAC, permisos, menu)           → apps/core/
  ├── Tenant (multi-tenant, schemas, domains)       → apps/tenant/
  └── Centro de Control (logs, alertas, tareas)     → apps/audit_system/

C1 — FUNDACION (se configura 1 vez, afecta a todos)
  ├── Configuracion Organizacional (empresa, parametros)  → gestion_estrategica/configuracion
  ├── Estructura Organizacional (areas, procesos)         → gestion_estrategica/organizacion
  └── Identidad Corporativa (mision, vision, valores)     → gestion_estrategica/identidad

C2 — MODULOS DE NEGOCIO (14 independientes)
  Planeacion Estrategica  │ Gestion Documental    │ Cumplimiento Legal
  Gestion de Riesgos      │ Workflows             │ HSEQ
  Auditoria Interna       │ Talent Hub (11 sub)   │ Supply Chain
  Production Ops          │ Logistics & Fleet     │ Sales CRM
  Admin Finance           │ Accounting

C3 — INTELIGENCIA (lee de C2, NO modifica)
  ├── Analytics (KPIs, dashboards, informes, tendencias)
  └── Revision por la Direccion

PORTALES (solo UI, sin logica propia)
  Mi Portal │ Mi Equipo │ Portal Proveedores │ Portal Clientes │ Admin Global
```

### Reglas de independencia
- **C2 NUNCA importa de otro C2** — Backend: `apps.get_model()` + IntegerField. Frontend: `useSelect*` hooks.
- **C3 SOLO LEE de C2** — via API endpoints, nunca escribe en tablas de C2.
- **audit_system ≠ Auditoria Interna** — audit_system (C0) = logs/alertas. Auditoria Interna (C2) = auditorias ISO.

### Apps Django por modulo backend

| Capa | Modulo Django | Sub-apps |
|------|--------------|----------|
| C0 | core | users, rbac, menu, middleware, permissions |
| C0 | tenant | schemas, domains, plans |
| C0 | audit_system | logs_sistema, config_alertas, centro_notificaciones, tareas_recordatorios |
| C1 | gestion_estrategica | configuracion, organizacion, identidad |
| C2 | gestion_estrategica | planeacion, contexto, encuestas, gestion_proyectos, gestion_documental, planificacion_sistema |
| C2 | gestion_estrategica | revision_direccion (UI en C3) |
| C2 | motor_cumplimiento | matriz_legal, requisitos_legales, reglamentos_internos, evidencias |
| C2 | motor_riesgos | riesgos_procesos, ipevr, aspectos_ambientales, riesgos_viales, seguridad_informacion, sagrilaft_ptee |
| C2 | workflow_engine | disenador_flujos, ejecucion, monitoreo, firma_digital |
| C2 | hseq_management | accidentalidad, seguridad_industrial, higiene_industrial, medicina_laboral, emergencias, gestion_ambiental, calidad, mejora_continua, gestion_comites |
| C2 | supply_chain | catalogos, gestion_proveedores, compras, almacenamiento, programacion_abastecimiento |
| C2 | production_ops | recepcion, procesamiento, producto_terminado, mantenimiento |
| C2 | logistics_fleet | gestion_flota, gestion_transporte |
| C2 | sales_crm | gestion_clientes, pipeline_ventas, pedidos_facturacion, servicio_cliente |
| C2 | talent_hub | estructura_cargos, seleccion_contratacion, colaboradores, onboarding_induccion, formacion_reinduccion, desempeno, control_tiempo, novedades, proceso_disciplinario, nomina, off_boarding |
| C2 | admin_finance | presupuesto, tesoreria, activos_fijos, servicios_generales |
| C2 | accounting | config_contable, movimientos, informes_contables, integracion |
| C3 | analytics | config_indicadores, indicadores_area, acciones_indicador, dashboard_gerencial, generador_informes, analisis_tendencias, exportacion_integracion |

---

## Arquitectura Backend

### Settings Modulares

`config/settings/`: `base.py` (compartido) | `development.py` (DEBUG, console email) | `production.py` (HSTS, Sentry, SMTP) | `testing.py` (SQLite, Celery eager)

**DJANGO_SETTINGS_MODULE:** `config.settings.development` (default). **NOTA:** `config/settings.py` (legacy) esta deprecated.

### Multi-Tenant

- `django-tenants` con schemas PostgreSQL | Tenant por subdominio via `TenantMainMiddleware`
- Header alternativo: `X-Tenant-ID` (`TenantAuthenticationMiddleware`)
- SHARED_APPS (public: Tenant, Domain, Plan, TenantUser) + TENANT_APPS (schema por tenant)

### Autenticacion

- JWT via `djangorestframework-simplejwt` con `HybridJWTAuthentication`
- Access: 60 min | Refresh: 7 dias | HS256 | Rotate + blacklist
- Endpoints: `POST /api/auth/login/`, `/api/auth/refresh/`, `/api/auth/logout/`

### API Patterns

- Base URL: `/api/` | Paginacion: 20 items/page | Auth: `IsAuthenticated`
- Throttle: 30/min (anon), 120/min (user), 5/min (login)
- Docs: `/api/docs/` (Swagger), `/api/redoc/` (ReDoc)

### Middleware Stack (orden critico)

```
1.  TenantMainMiddleware          # DEBE ser primero
2.  TenantAuthenticationMiddleware
3.  SecurityMiddleware
4.  WhiteNoiseMiddleware
5.  CorsMiddleware
6.  SessionMiddleware
7.  CommonMiddleware
8.  CsrfViewMiddleware
9.  AuthenticationMiddleware
10. MessageMiddleware
11. XFrameOptionsMiddleware
12. CSPMiddleware
13. AuditlogMiddleware
14. ModuleAccessMiddleware
```

### Base Models (backend/utils/models.py)

| Clase | Campos | Uso |
|-------|--------|-----|
| `TenantModel` | TimeStamped + SoftDelete + Audit | **Usar para todos los modelos tenant** |
| `SharedModel` | Solo TimeStamped | Modelos schema public |
| `OrderedModel` | order | Mixin ordenamiento |
| `ActivableModel` | is_active | Mixin activar/desactivar |
| `CodeModel` | code (unique) | Mixin codigos |
| `DescriptionModel` | name, description | Mixin nombre + descripcion |

### Celery

- Broker/Result: Redis | Beat: DatabaseScheduler (django_celery_beat)
- 11 colas: default, tenant_ops, emails, reports, files, maintenance, monitoring, scraping, compliance, notifications, workflow
- 24+ tareas programadas | Task limit: 30 min | Flower: puerto 5555

### Management Commands clave

```bash
python manage.py deploy_seeds_all_tenants   # Seeds a todos los tenants
python manage.py migrate_schemas            # Migraciones multi-tenant
python manage.py init_rbac                  # Inicializar RBAC
python manage.py bootstrap_production       # Bootstrap produccion
```

---

## Arquitectura Frontend

### Routing y State

- React Router v6 con lazy-loading | Route guards: `ProtectedRoute` → `ModuleGuard` → `SectionGuard`
- Server state: TanStack React Query v5 | Client state: Zustand | Forms: RHF + Zod

### API Layer

- Axios centralizado (`api/axios-config.ts`) con JWT interceptors
- **API Factory** (`lib/api-factory.ts`) + **CRUD Hooks Factory** (`lib/crud-hooks-factory.ts`) + **Query Keys** (`lib/query-keys.ts`)

### Componentes Clave

FormBuilder (drag & drop) | DynamicFormRenderer | TanStack React Table | TipTap (rich text) | SignatureCanvas | ECharts + Recharts | React Three Fiber | React Flow | PageTabs | DatePicker/DateRangePicker

### UI Framework

- Tailwind CSS (colores dinamicos via CSS vars por tenant) | Lucide React (iconos)
- Fonts: Inter (body) + Montserrat (heading) | Dark mode: class-based
- Design System: `docs/02-desarrollo/frontend/DESIGN-SYSTEM.md`

---

## CI/CD

- **CI** (`ci.yml`): Backend (Django checks, pytest, Black, Ruff) + Frontend (tsc, ESLint, Vite build) en paralelo
- **PR Checks** (`pr-checks.yml`): Conventional Commits (`type(scope): description`)
- **CodeQL** (`codeql.yml`): Security analysis JS + Python
- **Husky**: Pre-commit lint-staged (Prettier + ESLint)

---

## Seguridad

- JWT con blacklist + rotacion | RBAC via ModuleAccessMiddleware
- CSRF HTTPOnly | CSP | HSTS 1 ano | X-Frame-Options: DENY | SSL redirect (prod)
- CORS: localhost:3010 (dev) | *.stratekaz.com (prod) | Credentials: True
- CodeQL + pip-audit + npm audit | Sentry (prod) | Health checks cada 15 min

---

## Convenciones de Codigo

Documentacion detallada en auto-memory (se carga automaticamente):
- `coding-standards.md` — TypeScript types, React patterns, DRF patterns, performance
- `naming-conventions.md` — snake_case vs kebab-case vs camelCase por contexto
- `ui-standards.md` — 3 tipos de vista, Design System obligatorio
- `audit-api-sync.md` — @action url_path, tipos TS exactos

### Quick Reference

**Backend:** Black (88 chars) | Ruff | Locale es-co | Models heredan `TenantModel`/`SharedModel` | Apps: `apps.modulo.submodulo`
**Frontend:** Strict TypeScript | ESLint (max-warnings=0 CI) | Tailwind + Lucide (NO emojis) | Path alias `@` = `./src`
**General:** Conventional Commits | Ingles para codigo, espanol para UI/labels | No secrets en codigo

---

## Documentacion

```
docs/
├── 01-arquitectura/       # ADMIN-GLOBAL, ARQUITECTURA-DINAMICA, DATABASE, MULTI-TENANT, RBAC
├── 02-desarrollo/         # API endpoints, auth, convenciones, testing, logging, snippets
│   ├── backend/           # Branding dinamico, integraciones, workflows/firmas
│   └── frontend/          # Design system, hooks, layout, iconos, React Query, navegacion
├── 03-modulos/            # Guias por modulo (planeacion, riesgos, talent-hub)
└── 04-devops/             # Docker, GitHub Actions, Celery/Redis, deploy checklist
```

---

## Entorno

### Docker Dev

| Servicio | Puerto |
|----------|--------|
| PostgreSQL 15 | 5432 |
| Redis 7 | 6379 |
| Backend (Django) | 8000 |
| Frontend (Vite) | 3010 |
| Celery + Beat | - |
| Flower* | 5555 |

### Produccion (VPS Hostinger)

Nginx + Gunicorn + PostgreSQL + Redis + Celery. Path: `/opt/stratekaz`. NO Docker en produccion.
Detalle completo en auto-memory `deploy.md`.

### Variables de Entorno

Archivos: `.env.example` (root) | `.env.production.example` | `backend/.env.example` | `frontend/.env.example`

Variables criticas: `SECRET_KEY`, `DJANGO_SETTINGS_MODULE`, `DB_*` (PostgreSQL django-tenants), `REDIS_URL`, `CELERY_BROKER_URL`, `VITE_API_URL`, `JWT_*_LIFETIME`, `SENTRY_DSN` (prod).
