# CLAUDE.md - StrateKaz | Consultoria 4.0

## Principio fundacional: LIVE es la verdad

El repo no es la verdad. Lo LIVE es la verdad.
Solo el codigo LIVE (niveles activos en CURRENT_DEPLOY_LEVEL) se considera
parte del proyecto y debe estar 100% solido. El codigo no-LIVE es borrador
descartable: no se mantiene, no se refactoriza, no genera deuda. Se valida
y se reescribe (o se elimina) el dia que se quiera promover a LIVE.

Hay dos capas dentro de LIVE:
1. **CIMIENTOS** — infra, testing, DB, migraciones, multi-tenant, auth/JWT,
   RBAC, audit_system, workflow_engine, gestion_documental, modulo IA, core.
   Tienen que estar solidos siempre. Son la losa.
2. **MODULOS DE NEGOCIO LIVE** — hoy unicamente mi_equipo (L20) con sus
   4 sub-apps: estructura_cargos, seleccion_contratacion, colaboradores,
   onboarding_induccion.

Todo lo que este en niveles L25 o superior es borrador y NO cuenta.

**Consecuencia practica:** cuando arreglar algo LIVE rompa algo no-LIVE,
no nos importa. Se anota como hallazgo y se sigue. El no-LIVE se arregla
el dia que se active, no antes.

---

## Descripcion del Proyecto

StrateKaz es una **Plataforma de Gestion Empresarial 360°** multi-tenant + Consultoria 4.0 para empresas colombianas. **NO es un ERP.** Integra gestion estrategica, cumplimiento normativo (ISO 9001/14001/45001/27001), riesgos, HSEQ, cadena de valor, talento humano, finanzas y analitica en una sola plataforma. Opera en 3 lineas de negocio: Consultoria pura | Consultoria + SaaS | SaaS puro.

**Dominio:** stratekaz.com | **App:** app.stratekaz.com
**Hosting:** VPS Hostinger (Nginx + Gunicorn + PostgreSQL + Redis + Celery)
**Versiones:** 5.1.0 (frontend) | 3.7.1 (root package) | API 4.0.0 (drf-spectacular)
**Idioma del sistema:** Espanol (es-co)

---

## Estrategia actual: Consolidacion L0-L20 (StrateKaz Core)

**Estado del proyecto:** Consolidando el nucleo L0-L20 como StrateKaz Core estable.

### Reglas operativas (vigentes hasta nuevo aviso)

1. **Solo se modifica codigo LIVE.** Los modulos en niveles L25-L90 estan
   DISABLED y NO se tocan, ni para arreglar TODOs ni para refactorizar, hasta
   que llegue su sprint de activacion.

2. **Toda modificacion debe ser browseable.** Cualquier cambio en codigo LIVE
   debe poder probarse manualmente en el tenant demo de local antes del commit.
   Si no se puede browsear, no se hace ahora.

3. **Las factories son obligatorias para codigo nuevo.** Cualquier serializer,
   FormModal, hook CRUD o api client nuevo debe usar la factory correspondiente.
   Codigo viejo se migra gradualmente.

4. **Ningun modulo nuevo se activa** hasta que L0-L20 este consolidado y
   declarado "StrateKaz Core 1.0".

5. **Los smoke tests en browser son parte del workflow:**
   Code escribe -> tests pasan -> usuario browsea en local -> aprueba -> push

### Criterio de aceptacion por sub-app ("Basico bien hecho")

Una sub-app L0-L20 se declara consolidada cuando cumple 6 criterios:
1. Funcional (3-5 funciones esenciales sin errores ni features fantasma)
2. Browseable end-to-end en tenant demo local
3. Sin code smells criticos (cero TODOs, cero except Exception, cero
   god-classes >1500 LOC, cero raw SQL)
4. Usa factories obligatorias (serializer, FormModal, crud-hooks, api-client)
5. Tests minimos: 40% coverage en happy paths criticos
6. README breve por sub-app (que hace, que consume, que expone, modelos clave)

Regla maestra: ninguna sub-app se declara consolidada sin browseo manual
y aprobacion explicita del usuario en el tenant demo local.

La definicion completa de "Basico bien hecho" esta arriba en esta misma seccion.

### Modulos LIVE actuales (los unicos que se tocan ahora)

| Nivel | Modulos |
|-------|---------|
| L0 | core (auth, RBAC, IA) |
| L10 | configuracion, organizacion, identidad, contexto, encuestas |
| L12 | workflow_engine (4 sub), audit_system (4 sub) |
| L15 | gestion_documental (8 modelos, 8 fases) |
| L20 | mi_equipo (estructura_cargos, seleccion, colaboradores, onboarding) |
| LIVE | mi_portal |

### Proximo paso

Inventario detallado de cada sub-app de L0-L20 para identificar:
- Funcion real vs funcion declarada
- Lo que sobra (eliminar)
- Lo que falta (agregar para "basico bien hecho")
- Code smells especificos de cada sub-app LIVE

Contexto completo del cambio de estrategia esta en la seccion "Estrategia actual" de este mismo archivo.

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

## Arquitectura: 6 Capas + Portales

El sistema se organiza en capas con independencia estricta entre modulos:

```
C0 — PLATAFORMA (infraestructura, nunca se toca en sprints de modulo)
  ├── Core (users, RBAC, permisos, menu)           → apps/core/
  ├── Tenant (multi-tenant, schemas, domains)       → apps/tenant/
  └── Centro de Control (logs, alertas, tareas)     → apps/audit_system/

C1 — FUNDACION (se configura 1 vez, afecta a todos)
  ├── Configuracion Organizacional (empresa, parametros)  → gestion_estrategica/configuracion
  ├── Estructura Organizacional (areas, procesos)         → gestion_estrategica/organizacion
  ├── Identidad Corporativa (mision, vision, valores)     → gestion_estrategica/identidad
  └── Contexto Organizacional (partes interesadas, DOFA)  → gestion_estrategica/contexto

CT — INFRAESTRUCTURA TRANSVERSAL (todos los C2 consumen, nunca importan entre si)
  ├── Gestion Documental (8 fases, 7 modelos)      → gestion_estrategica/gestion_documental
  └── Workflow Engine (flujos, ejecucion, firmas)   → workflow_engine/*

C2 — MODULOS DE NEGOCIO (12 independientes, consumen CT)
  Planeacion Estrategica  │ Cumplimiento Legal     │ Gestion de Riesgos
  Gestion HSEQ            │ Auditoria Interna      │ Supply Chain
  Production Ops          │ Logistics & Fleet      │ Sales CRM
  Talent Hub (12 sub)     │ Admin Finance          │ Accounting

C3 — INTELIGENCIA (lee de C2 y CT, NO modifica)
  ├── Analytics (KPIs, dashboards, informes, tendencias)
  └── Revision por la Direccion

PORTALES (solo UI, sin logica propia)
  Mi Portal │ Mi Equipo │ Portal Proveedores │ Portal Clientes │ Admin Global
```

### Reglas de independencia
- **CT sirve a C2** — cualquier C2 puede consumir endpoints de CT (documentos, firmas, workflows).
- **CT NUNCA importa de C2** — gestion_documental y workflow_engine no importan de talent_hub, supply_chain, etc.
- **C2 NUNCA importa de otro C2** — Backend: `apps.get_model()` + IntegerField. Frontend: `useSelect*` hooks.
- **C3 lee de C2 y CT** — via API endpoints, nunca escribe en tablas de C2 ni CT.
- **audit_system ≠ Auditoria Interna** — audit_system (C0) = logs/alertas. Auditoria Interna (C2) = auditorias ISO.

### 7 Grupos Visuales — Sidebar LIVE (L0-L20 + supply_chain)

Post-cleanup 2026-04-20: `SIDEBAR_LAYERS` solo contiene capas con módulos
LIVE (principio "LIVE es la verdad"). Cada activación de módulo C2 re-agrega
su capa. Roadmap: migrar `SIDEBAR_LAYERS` a DB (hallazgo `H-S8-sidebar-db-driven`).

| Grupo | Code | Módulos | Color | Capa |
|-------|------|---------|-------|------|
| Fundación | NIVEL_FUNDACION | fundacion | `#3B82F6` | C1 |
| Infraestructura | NIVEL_INFRAESTRUCTURA | gestion_documental, catalogo_productos | `#6366F1` | CT |
| Gestión de Personas | NIVEL_EQUIPO | mi_equipo | `#0EA5E9` | C2 |
| Cadena de Valor | NIVEL_CADENA | supply_chain | `#10B981` | C2 |
| Inteligencia | NIVEL_INTELIGENCIA | audit_system | `#8B5CF6` | C0 |
| Flujos de Trabajo | NIVEL_WORKFLOWS | workflow_engine | `#0891B2` | CT |
| Configuración | NIVEL_CONFIG | configuracion_plataforma | `#64748B` | C0 |

- Sidebar: 1-módulo layers → render directo (sin wrapper). 2+ módulos → `is_category: True`.
- Dashboard: `/tree/` endpoint incluye `layers` → DashboardPage agrupa con headers.
- Config: `SIDEBAR_LAYERS` en `viewsets_config.py`.

### Apps Django por modulo backend

| Capa | Modulo Django | Sub-apps |
|------|--------------|----------|
| C0 | core | users, rbac, menu, middleware, permissions |
| C0 | tenant | schemas, domains, plans |
| C0 | audit_system | logs_sistema, config_alertas, centro_notificaciones, tareas_recordatorios |
| C1 | gestion_estrategica | configuracion, organizacion, identidad, contexto |
| CT | gestion_estrategica | gestion_documental (7 modelos, 8 fases) |
| CT | workflow_engine | disenador_flujos, ejecucion, monitoreo, firma_digital |
| C2 | gestion_estrategica | planeacion, encuestas, gestion_proyectos, planificacion_sistema |
| C2 | gestion_estrategica | revision_direccion (UI en C3) |
| C2 | motor_cumplimiento | matriz_legal, requisitos_legales, reglamentos_internos, evidencias |
| C2 | motor_riesgos | riesgos_procesos, ipevr, aspectos_ambientales, riesgos_viales, seguridad_informacion, sagrilaft_ptee |
| C2 | hseq_management | accidentalidad, seguridad_industrial, higiene_industrial, medicina_laboral, emergencias, gestion_ambiental, gestion_comites |
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

`config/settings/`: `base.py` (compartido) | `development.py` (DEBUG, console email) | `production.py` (HSTS, Sentry, SMTP) | `testing.py` (PostgreSQL obligatorio, Celery eager)

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

Documentacion detallada en `docs/` (versionada en el repo):
- `docs/02-desarrollo/coding-standards.md` — TypeScript types, React patterns, DRF patterns, performance
- `docs/02-desarrollo/CONVENCIONES-NOMENCLATURA.md` — snake_case vs kebab-case vs camelCase por contexto
- `docs/02-desarrollo/frontend/DESIGN-SYSTEM.md` — 3 tipos de vista, Design System obligatorio
- `docs/02-desarrollo/audit-api-sync.md` — @action url_path, tipos TS exactos

### Source of Truth — Modelos de Identidad

- **Colaborador** es master de datos de empleado (nombre, cargo, salario, estado, documento, telefono)
- **User** solo contiene identidad digital (email, password, firma, photo, nivel_firma)
- **InfoPersonal** contiene datos sensibles (bancarios, salud, emergencia, direccion)
- **HojaVida** contiene educacion, certificaciones, experiencia previa
- **NUNCA escribir datos de empleado directamente en User** — escribir en Colaborador y dejar que el signal sincronice
- **Creacion de User NO crea Colaborador** — `/api/core/users/` crea SOLO User + TenantUser. Colaboradores se crean exclusivamente desde Mi Equipo > Colaboradores
- **proveedor_id_ext / cliente_id_ext son IntegerField** (NO FK) — almacenan IDs de referencia sin relacion directa
- Ver `docs/01-arquitectura/source-of-truth.md` para detalle completo

### Superadmin — Reglas de Identidad

- **Superadmin** (`is_superuser=True`, `cargo=None`): identidad de plataforma, NO empleado
- **Label UI:** siempre "Administrador del Sistema" (UserMenu, PerfilPage, AdminPortalView)
- **Firma digital:** NO requerida para superadmin (no participa en workflows documentales)
- **Profile completion:** solo foto (25%), nombre (25%), documento (25%), emergencia no aplica
- **Colaborador:** NUNCA se crea para superadmin puro (sin cargo)
- **Impersonacion:** requiere 2FA via `ImpersonateVerifyModal` + audit log completo
- **Mi Portal:** muestra `AdminPortalView` con stats + acciones rapidas (no tabs de empleado)
- **get_effective_user():** NO usa `select_related('proveedor', 'cliente')` (son IntegerField)

### Quick Reference

**Backend:** Black (88 chars) | Ruff | Locale es-co | Models heredan `TenantModel`/`SharedModel` | Apps: `apps.modulo.submodulo`
**Frontend:** Strict TypeScript | ESLint (max-warnings=0 CI) | Tailwind + Lucide (NO emojis) | Path alias `@` = `./src`
**General:** Conventional Commits | Ingles para codigo, espanol para UI/labels | No secrets en codigo

---

## Testing — Lectura obligatoria

### Alcance: solo apps LIVE

Los tests se corren, miden y arreglan **exclusivamente** para las apps
activas (descomentadas) en `base.py` TENANT_APPS. Las 61 apps extra que
`testing.py` agrega son borrador: sus tests pueden estar rotos y eso es
esperado. `testing.py` las habilita solo para que pytest no crashee al
importar modelos referenciados por código LIVE — NO para que sus tests pasen.

Cuando un módulo L25+ se vaya a activar, sus tests se revisan ese día:
si sirven se usan, si no se eliminan y se reescriben desde cero.

### Patron para tests de backend (a partir de 2026-04-07)

Todos los tests de backend que tocan modelos de TENANT_APPS deben heredar
de `BaseTenantTestCase` (`apps.core.tests.base`), que provee:
- Schema de tenant real via `FastTenantTestCase` de `django-tenants`
- `TenantClient` que apunta al dominio del tenant (evita caer a schema public)
- Helpers: `create_user()`, `create_cargo()`, `create_system_module()`,
  `create_module_with_section()`, `grant_section_access()`, `authenticate_as()`

**Ejemplo minimo:**

```python
from apps.core.tests.base import BaseTenantTestCase

class TestMiFeature(BaseTenantTestCase):
    def test_algo(self):
        user = self.create_user()
        headers = self.authenticate_as(user)
        response = self.client.get('/api/core/algo/', **headers)
        self.assertEqual(response.status_code, 200)
```

**NO usar:**
- `pytest.mark.django_db` con fixtures `db` para modelos de TENANT_APPS (cae a schema public)
- Mocks de querysets o MockUser — datos reales en schema real
- SQLite — `testing.py` exige PostgreSQL con `django_tenants.postgresql_backend`

### Comportamiento de dominio critico

Al crear una `TabSection`, el signal `rbac_signals` auto-propaga un
`CargoSectionAccess` a los cargos existentes. Por esto:
- `grant_section_access()` en BaseTenantTestCase usa `get_or_create` (no `create`)
- Tests que crean Cargo antes que Section deben esperar que el
  CargoSectionAccess ya exista cuando intenten crearlo manualmente

### Estructura de archivos de test

```
backend/apps/core/tests/
  base.py           # BaseTenantTestCase — heredar de aqui
  test_base.py      # Smoke test de la infra
  test_sidebar.py   # 5 tests del Sub-bloque 3 (referencia)
  test_*.py         # Tests legacy (skipped, migrar cuando se toque el sub-bloque)
```

### Como correr tests

```bash
# Tests migrados (bloqueantes en CI):
docker compose exec backend python manage.py test apps.core.tests.test_sidebar apps.core.tests.test_base --settings=config.settings.testing -v 2

# Tests legacy (informativos):
docker compose exec backend pytest apps/core/tests/ --ignore=apps/core/tests/test_sidebar.py --ignore=apps/core/tests/test_base.py --no-cov --tb=no -q
```

Recordatorio: Docker es SOLO local. El VPS de produccion corre Python
directo sin Docker, y CI imita VPS. Por eso ci.yml NO usa `docker compose
exec` — usa Python directo contra los servicios de PostgreSQL y Redis
configurados como GitHub Actions services.

### Tests legacy y migracion progresiva

Hay 143 tests legacy skipped en `apps/core/tests/`. Cada uno tiene una
entrada en `docs/testing-debt.md` con categoria y plan de migracion. La
politica es: cuando se inventaria un sub-bloque y se tocan tests legacy
asociados, se migran al patron nuevo en esa misma sesion. NO migracion
en bloque.

---

## Documentacion

```
docs/
├── 01-arquitectura/       # INDEX, estructura, capas, stack, multi-tenant, rbac-sistema, base-de-datos, source-of-truth, perimetro-live, hallazgos-pendientes y más. Ver INDEX.md.
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
Detalle completo en `docs/04-devops/deploy.md`.

### Variables de Entorno

Archivos: `.env.example` (root) | `.env.production.example` | `backend/.env.example` | `frontend/.env.example`

Variables criticas: `SECRET_KEY`, `DJANGO_SETTINGS_MODULE`, `DB_*` (PostgreSQL django-tenants), `REDIS_URL`, `CELERY_BROKER_URL`, `VITE_API_URL`, `JWT_*_LIFETIME`, `SENTRY_DSN` (prod).

---

## Gestion de Usuarios — Arquitectura Centralizada

### Quien crea cada tipo de usuario

| Tipo | Creado desde | Endpoint/UI | Crea User? | Crea Colaborador? |
|------|-------------|-------------|------------|-------------------|
| Colaborador (empleado) | Mi Equipo > Colaboradores | `/api/talent-hub/colaboradores/` | Si (signal) | Si |
| Contratista externo | Mi Equipo > Colaboradores | Mismo, con `is_externo=True` en Cargo | Si (signal) | Si |
| Proveedor portal | Supply Chain > Proveedores | Futuro | Si | No |
| Cliente portal | Sales CRM > Clientes | Futuro | Si | No |
| Admin tenant | Admin Global (DB por ahora) | No hay UI | Manual DB | No |
| Superadmin | Admin Global (DB) | No hay UI | Manual DB | No |

### Gestion de Usuarios (`/usuarios`) — Solo lectura + control

La pagina de Gestion de Usuarios **NO tiene boton de crear**. Es un centro de control:
- Lista todos los usuarios del tenant (cualquier origen)
- Filtros por origen: colaborador, proveedor, cliente, manual
- Impersonacion (con 2FA via TOTP)
- Ver detalle, estado, nivel de firma
- Activar / Desactivar usuarios
- **NO crear, NO editar cargo** (eso se hace en el modulo origen)

### Regla: NUNCA crear usuarios desde el tenant

El modal "Nuevo Usuario" fue eliminado (2026-03-24). La creacion de usuarios
se hace exclusivamente desde el modulo que los necesita (Colaboradores, Proveedores, etc).

---

## Estrategia de Apps y Cascada de Desarrollo

### INSTALLED_APPS: 3 entornos, 3 estrategias

| Entorno | Settings | Apps habilitadas | Proposito |
|---------|----------|-----------------|-----------|
| **Produccion** | `base.py` | Solo apps estabilizadas | Estabilidad del VPS |
| **Desarrollo** | `development.py` | base + django_extensions | Desarrollo local |
| **Testing/CI** | `testing.py` | TODAS las apps | pytest puede importar cualquier modelo |

### Como habilitar una app nueva en produccion

1. Verificar que la app tenga migraciones y seeds listos
2. Descomentar la app en `base.py` (TENANT_APPS)
3. Correr `migrate_schemas` en el VPS
4. Si tiene tareas Celery, descomentar en `config/celery.py` beat_schedule
5. Deploy con `bash scripts/deploy.sh`

### Como proteger codigo que referencia apps no instaladas

```python
# En views/urls que dependen de apps opcionales:
from django.apps import apps

if apps.is_installed('apps.talent_hub.nomina'):
    from .views import MisRecibosView
    urlpatterns.append(path('mis-recibos/', MisRecibosView.as_view()))

# En querysets:
try:
    Colaborador = apps.get_model('colaboradores', 'Colaborador')
except LookupError:
    pass  # App no instalada, skip silenciosamente
```

### Regla: NUNCA habilitar apps en base.py solo para que el CI pase

Si el CI falla por apps no instaladas, la solucion es:
1. Agregar guards defensivos (`is_installed`, `try/except LookupError`)
2. Habilitar en `testing.py` (no afecta produccion)
3. Marcar el step como `continue-on-error` en ci.yml

---

## CI/CD — Estado Actual (2026-04-07)

### Pasos bloqueantes (deben pasar para CI verde)

- Django checks + migraciones + collectstatic
- Tests backend migrados (6 migrados bloqueantes via `manage.py test`)
- TypeScript type checking + ESLint (max-warnings=0)
- Vite production build

Los tests backend bloqueantes en CI corren con `manage.py test` sobre los
archivos migrados a `BaseTenantTestCase`. Los tests legacy en pytest corren
como informativos hasta completar la migracion progresiva.

### Pasos informativos (reportan pero no bloquean)

- pytest legacy (143 legacy informativos, migracion progresiva)
- vitest (frontend tests en desarrollo)
- Black, Ruff (formateo en refactorizacion)
- pip-audit, npm audit (vulns en dependencias)

### Dependabot

- Solo Alerts + Security Updates habilitados (NO version updates)
- PRs agrupados por ecosistema (pip/npm)
- **NUNCA mergear sin verificar compatibilidad cruzada**
- Major versions requieren actualizacion manual y testing

### Deploy

```bash
cd /opt/stratekaz && bash scripts/deploy.sh --no-backup
```

---

## Sistema de Memoria — Regla de Persistencia

El directorio auto-memory de Claude Code (`~/.claude/projects/.../memory/`)
es un **SCRATCH PAD efimero**. Nada que importaria dentro de 3 meses debe
vivir solo ahi.

### Donde vive cada tipo de conocimiento

| Tipo | Destino | Ejemplo |
|------|---------|---------|
| Arquitectura, decisiones, patrones | `docs/01-arquitectura/` | seguridad.md |
| Convenciones de desarrollo | `docs/02-desarrollo/` | coding-standards.md |
| Conocimiento por modulo | `docs/03-modulos/<modulo>/` | plantillas-sgi.md |
| Deploy, operaciones, capacidad | `docs/04-devops/` | deploy.md, capacity-planning.md |
| Auditorias historicas | `docs/auditorias/` | audit-lifecycle-2026-03-26.md |
| Conocimiento de negocio | `docs/business/` | brand-identity.md, pricing-plans.md |
| Historial de sprints, pitfalls | `docs/history/` | sprint-history.md, pitfalls.md |
| Hallazgos arquitectonicos | `docs/01-arquitectura/` | hallazgos-pendientes.md |
| Inventario L0-L20 | `docs/inventory/` | L0-INDEX.md |

### Que se queda en auto-memory (scratch pad)

- `MEMORY.md` — indice de punteros a `docs/` + instrucciones permanentes
- `feedback_*.md` — reglas de comportamiento especificas de Claude
- Reglas operacionales pequenas (self-service-rbac, middleware, etc.)
- Estado de sesion actual

### Regla al cierre de sesion

Si durante una sesion se creo conocimiento nuevo:
1. Decisiones/arquitectura → crear directamente en `docs/`
2. Leccion aprendida → agregar a `docs/history/pitfalls.md`
3. Sprint cerrado → agregar a `docs/history/sprint-history.md`
4. Instruccion para Claude → se queda en auto-memory

**NUNCA crear archivos de conocimiento durable en auto-memory.**
Crearlos directamente en `docs/` desde el inicio.
