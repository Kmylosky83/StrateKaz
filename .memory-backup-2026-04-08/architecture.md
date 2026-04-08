# Architecture Reference

## Stack
- **Backend**: Django 5 + DRF 3.14 + Celery 5.3 + Redis 7
- **Frontend**: React 18 + TypeScript 5.3 + Vite 5 + TanStack Query v5 + Zustand 4.4
- **DB**: PostgreSQL 15 (django-tenants, multi-schema)
- **Auth**: JWT (SimpleJWT) + HybridJWTAuthentication (multi-tenant)
- **CSS**: Tailwind 3.4 | **Icons**: Lucide React | **Charts**: ECharts + Recharts
- **Game**: Phaser 3 (vendor-phaser chunk ~1.4MB) + nipplejs (mobile joystick)
- **Forms**: React Hook Form + Zod | **Tables**: TanStack React Table 8
- **Rich Text**: TipTap | **Animations**: Framer Motion | **3D**: Three.js + R3F
- **Diagrams**: @xyflow/react | **PWA**: vite-plugin-pwa (Workbox)

## Project Structure
```
StrateKaz/
  backend/
    config/settings/{base,development,production,testing}.py
    apps/ (16 modules, ~92 apps, ~219 models)
      core/           # N0: Users, RBAC, Menu, Middleware
      tenant/         # N0: Multi-Tenant (public schema)
      gestion_estrategica/  # N1: 10 apps
      motor_cumplimiento/   # N2: 5 apps
      motor_riesgos/        # N2: 6 apps
      workflow_engine/      # N2: 4 apps
      hseq_management/      # N3: 9 apps
      supply_chain/    # N4 | production_ops/ # N4
      logistics_fleet/ # N4 | sales_crm/      # N4
      talent_hub/      # N5: 11 apps
      admin_finance/   # N5 | accounting/ # N5
      analytics/       # N6: 7 apps
      audit_system/    # N6: 4 apps
  frontend/src/
    api/          # Axios clients
    components/   # 100+ shared (common/, forms/, layout/, mobile/)
    features/     # 23 modules (~680 files, includes sst-game)
    hooks/        # 19 custom hooks
    lib/          # api-factory, crud-hooks-factory, query-keys, animations
    layouts/      # DashboardLayout, Sidebar, Header
    pages/        # Login, Dashboard, Error, NotFound
    routes/       # index.tsx (NIVEL 0-7 ordering)
    store/        # authStore, themeStore (Zustand)
    types/        # 10 type files
    utils/        # formatters, dateUtils, cn
  marketing_site/ # Standalone landing page (Vite/React)
```

## 5 Capas Arquitectónicas + 6 Grupos Visuales

### Capas (backend, inmutables)
| Capa | Módulos | Apps aprox |
|------|---------|-----------|
| C0 | core, tenant, audit_system | ~12 |
| C1 | fundacion (config, organización, identidad) | 3 |
| C2 | 14 módulos independientes (PE, SGI, Cumplimiento, Riesgos, HSEQ, Supply, Production, Logistics, Sales, Workflows, Talent, Finance, Accounting, Auditoría Interna) | ~70 |
| C3 | analytics, revision_direccion | ~8 |
| Portales | Mi Portal, Mi Equipo, Proveedores, Clientes, Admin Global | UI only |

### Sidebar: 12 Capas V2.1 (ver [reorganizacion-c1-pe-sgi.md](reorganizacion-c1-pe-sgi.md))
Fuente de verdad: `SIDEBAR_LAYERS` en `viewsets_config.py`. `/tree/` incluye `layers`.
Apps registered conditionally in `config/urls.py`. Check `is_app_installed()` before cross-module refs.

## Key Patterns
- **BaseCompanyModel**: All tenant models inherit (auto `empresa` FK, null=True)
- **TenantModel**: TimeStamped + SoftDelete + Audit + BaseCompany (use for all tenant models)
- **Route Guards 3 layers**: `ProtectedRoute` (auth) → `ModuleGuard` (is_enabled) → `SectionGuard` (RBAC canDo)
- **ProtectedRoute**: Uses synchronous `localStorage.getItem('access_token')` check — NEVER Zustand persist state. See pitfalls.md for 3-iteration history.
- **SectionGuard**: Checks `canDo(moduleCode, sectionCode, 'view')` via `usePermissions`. Also supports `requireSuperadmin`.
- **ModuleAccessMiddleware**: Backend API protection by module code
- **RBAC Unificado v4.0**: SystemModule → ModuleTab → TabSection → CargoSectionAccess (CRUD flags)
- **Dynamic Navigation**: Sidebar from API (`/api/core/system-modules/sidebar/`), filtered by CargoSectionAccess
- **DynamicIcon**: Lucide icons by string name from DB
- **Code Splitting**: React.lazy() on ALL route-level components
- **Factories**: api-factory + crud-hooks-factory eliminate ~50 lines per entity
- **Module-specific hooks**: Complex modules have custom hooks/api/types aligned 1:1 with backend serializers.
  Pattern: `features/{module}/types/`, `api/`, `hooks/`
  Modules with custom layers: gestion-estrategica (10 sub-modules), admin-finance, accounting, riesgos (7 sub-modules)
- **Riesgos sub-module pattern**: Each risk domain (seguridad_informacion, sagrilaft_ptee, riesgos_viales, etc.)
  has its own types file with label/color maps for Badge rendering, API client with custom endpoints,
  and React Query hooks. Pages use inline StatsGrid + Tabs pattern.
- **Game Engine pattern (sst-game)**: Phaser 3 scenes communicate with React via EventBridge singleton (EventEmitter).
  React → Phaser: `eventBridge.emit('game:start', levelData)`. Phaser → React: `eventBridge.emit('quiz:trigger', question)`.
  Canvas wrapped in GameCanvas component with `useEffect` lifecycle. All textures procedural (no external assets for POC).
  ViewSet (not ModelViewSet) with only @action endpoints (no list/retrieve).
- **Label/color maps**: Enums rendered via `ENUM_LABELS: Record<string, string>` + `ENUM_COLORS: Record<string, string>`
  imported from types files, used with `<Badge label={LABELS[value]} color={COLORS[value]} />`
- **Query keys**: `['module', 'resource', params]` (e.g., `['accounting', 'comprobantes', {estado}]`)
- **Response unwrap**: All API methods use `.then((r) => r.data)` — never return raw AxiosResponse

## 3-Layer Automation Architecture (Phase B)
```
Layer 1: django-fsm       — Entity state machines (FSMField + @transition)
Layer 2: EventBus         — Cross-module event router (utils/event_bus.py)
Layer 3: Workflow Engine   — BPMN 2.0 (existing, workflow_engine app)
```
- **FSM signal flow**: `@transition` method → `post_transition` signal → `EventBus.publish(async_mode=True)` → Celery task → `NotificationService.send_notification()`
- **EventBus**: Singleton with `subscribe()`, `publish()`, `_dispatch()`. Each handler in try/except. Convention: `{entity}.{action}` events.
- **Files**: `utils/event_bus.py`, `utils/tasks.py`, `{app}/signals.py`, `{app}/event_handlers.py`, register in `apps.py ready()`
- **Active modules**: mejora_continua (ProgramaAuditoria, Auditoria, Hallazgo)

## Scalability Path
```
AHORA:    Modular Monolith + EventBus (django-fsm + Celery async dispatch)
DESPUÉS:  WebSockets (Django Channels) — tiempo real
SI CRECE: CQRS (read replicas) — analytics separado de escritura
FUTURO:   Microservicios — extraer módulo pesado si necesita escalar solo
```

## Component Library Highlights
Core: Button, Badge, Card, Modal, Spinner, Alert
Data: ResponsiveTable, DataGrid, Pagination, KpiCard
Navigation: DynamicSections (tabs), Breadcrumbs
Feedback: Toast (Sonner), EmptyState, ConfirmDialog
Forms: FormBuilder (dnd-kit), DynamicFormRenderer (16 field types), SignaturePad
Display: Avatar, SelectionCard, StatusBadge, MetricCard
RBAC: ProtectedAction, ActionButtons, SectionGuard
Export: ExportButton (CSV/Excel), PDF/DOCX generation
Evidence: EvidenceUploader, EvidenceGallery, EvidenceTimeline
ESS Portal: MiPortalPage (hero+stats+tabs), MiPerfilCard (branding subsections), MiHSEQ (preview cards)
Game: GameCanvas (Phaser wrapper), GameHUD, QuizModal, GameEntryCard, MobileControls (nipplejs), SSTGamePage
