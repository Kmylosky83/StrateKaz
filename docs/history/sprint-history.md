# Sprint History — StrateKaz SGI

## MVP Roadmap
```
FASE 1 — MVP Consultor (Sprint 15-19) COMPLETE
FASE 2 — TH Completo + Integración (Sprint 20-21) COMPLETE
FASE 3 — Estabilización + MVP Empresa ISO (Sprint 22-35) COMPLETE
FASE 4 — Modularización (Sprint M0-M2) ✅ COMPLETE
FASE 5 — Sprints por módulo en paralelo → MVP Empresa Completo ✅ COMPLETE
FASE 6 — QA + Hardening + Features ✅ COMPLETE
FASE 7 — Revisión Dirección + Portal Público + Tests + Perf ✅ COMPLETE
FASE 8 — Portal Proveedores + Layout Aislado + Tenant Management ✅ COMPLETE
FASE 8.5 — Sprint POLISH-2 + Cleanup TODOs ✅ COMPLETE
FASE 9 P1 — Auditoría: BULK-ACCESS + PORTAL-UX + IMPERSONATION ya implementados ✅ COMPLETE
FASE 9 P2 — Sprint CLIENTE-PORTAL: Portal Clientes + crear acceso + fix redirect ✅ COMPLETE
FASE 9 P2.5 — Sprint BUGFIX: JWT race condition + config-stats + modal Sede ✅ COMPLETE
FASE 9 P2.6 — Auditoría Design System: Planeación Estratégica (43+ modales, 27 archivos) ✅ COMPLETE
FASE 9 P2.7 — Sprint AUDIT-SYNC: FE↔BE sync 14 módulos (~56 url_path + ~200 types + 3 módulos P2) ✅ COMPLETE
FASE 9 P2.8 — QA-PROYECTOS: Fix 500 detail + cache invalidation + IniciacionSubTab funcional ✅ COMPLETE
FASE 9 P2.9 — QA-PROYECTOS-S5: SelectListItem fix + avance de fase automático ✅ COMPLETE
FASE 9 P3 — SPRINT-PROYECTOS-PMI: Gantt PMI + Dashboard EVM + modales mejorados + Cierre completo ✅ COMPLETE
FASE 9 P3.1 — SIDEBAR-6-LAYERS: Sidebar 3→6 grupos + Dashboard agrupado + calidad→SGI ✅ COMPLETE
FASE 9 P3.2 — JUEGO-SST-S1: RPG 2D "Los Héroes de la Seguridad" POC con Phaser 3 ✅ COMPLETE
FASE 9 P3.3 — RBAC-BUTTONS: canDo() en 77+ archivos, 202 section codes ✅ COMPLETE
FASE 9 P3.4 — QA-RBAC-S2: Fix 401 loop, canEdit/canDelete granular, 403 notificaciones ✅ COMPLETE
FASE 9 P3.5 — REORG-A: Reorganizar C1+PE+SGI seeds/permisos/rutas + limpiar código muerto ✅ COMPLETE
FASE 9 P3.6 — REORG-B: django-fsm + EventBus + notificaciones mejora_continua ✅ COMPLETE
FASE 9 P3.7 — AUDITORIA-INTERNA: Frontend upgrade — ResponsiveTable + RBAC + FSM + useSelectUsers ✅ COMPLETE
FASE 9 P3.8 — REORG-C: Caracterizaciones SIPOC full-stack + Contexto simplificado 6→3 ✅ COMPLETE
FASE 9 P3.9 — QA-QUALITY: Auditoría integral QA + Quick Wins + exhaustive-deps + CSP ✅ COMPLETE
FASE 10 P0 — PORTAL-AUDIT: Auditoría portales + desactivación proveedor/cliente + limpieza usuario ✅ COMPLETE
FASE 9 P4.0 — QA-BACKLOG-S1: N+1 queries (5 ViewSets) + ESLint 804→422 warnings ✅ COMPLETE
FASE 9 P4.1 — MIGRATIONS-SYNC: 8 apps makemigrations + deploy VPS --fake masivo ✅ COMPLETE
FASE 9 P4.2 — QA-AUTH-AVATAR: Auth sessions + avatar upload + PWA SW fix (7 bugs) ✅ COMPLETE
FASE 9 P4.3 — CONSULTORES-EXTERNOS: Vista unificada Talent Hub + es_independiente + drf-spectacular fix ✅ COMPLETE
FASE 9 P4.4 — QA-FUNDACION: Portal + auth + 8 bugs Fundación + RBAC 'update'→'edit' ✅ COMPLETE
CASCADA-V2 S1 — Split admin_finance → administracion + tesoreria ✅ COMPLETE
CASCADA-V2 S2 — Fundación tab 4 + turnos cargo + cleanup ✅ COMPLETE
CASCADA-V2 S3 — Gestión Documental + Mi Equipo features independientes ✅ COMPLETE
CASCADA-V2 S4 — Planificación Operativa + Acciones de Mejora + Protección verificado ✅ COMPLETE
CASCADA-V2 S5 — Verificado: admin_finance split ya completado en S1 ✅ COMPLETE
CASCADA-V2 S6 — Cierre: Dashboard PHVA + Progreso Fundación ya operativos ✅ COMPLETE
═══ CASCADA-V2 MIGRACIÓN COMPLETA (6 sprints, 19 módulos) ═══
CASCADE-DEPLOY L10 — DB limpia + C0+C1 live en VPS (1 tenant) ✅ COMPLETE
QA-FUNDACION-L10 — Auditoría Config Admin v5.3.0 ✅ COMPLETE
CASCADE-DEPLOY L12 — Transversal (workflow+audit) deployed VPS ✅ COMPLETE
QA-INFRAESTRUCTURA — Fix React #31 + paginación + Badge + API routes ✅ COMPLETE
CASCADE-DEPLOY L15 — Gestión Documental activado (1 app, 6 modelos, 30+ endpoints) ✅ COMPLETE
DOCUMENTAL-FASES-4-8 — Cierre 4 fases: BPM auto-gen + Scoring + Drive + Biblioteca ✅ COMPLETE
SECURITY-2FA — 2FA por nivel de rol + reconfirmación TOTP al firmar (ISO 27001, 24 archivos) ✅ COMPLETE
CASCADE-DEPLOY L20 — Mi Equipo (4 sub-apps) + Onboarding SmartOnboarding ✅ COMPLETE
AUDIT-ONBOARDING — Auditoría identidad 8 preguntas + modelo B2B2B ✅ COMPLETE
AUDIT-E2E-SECURITY — B1 Seguridad + B3 RBAC v4.0 + B4 Infra + E2E validación 3 usuarios ✅ COMPLETE
MARKETING-RECURSOS — Biblioteca /recursos: 9 categorías, Drive redirect, newsletter, hero animado ✅ COMPLETE
AUDIT-MONOLITO-CAPACIDAD — Memory cleanup, Gestión Documental audit, sesiones forceLogout→setTimedOut, fechas UTC, capacity planning ✅ COMPLETE
E2E-GESTION-DOCUMENTAL — Ciclo BORRADOR→DISTRIBUIDO validado + 28 TS errors + aplica_a_todos fix ✅ COMPLETE
AUDIT-E2E-GD-BROWSER — Auditoría E2E browser: 6 dashboard fixes, TRD completa (seed+resolver+task), 5 hallazgos UX, pydyf fix, PDF tenant fallback, Design System colores ✅ COMPLETE
```

---

## CASCADE-DEPLOY Level 15 — Gestión Documental (2026-03-18) COMPLETADO
**Objetivo:** Activar gestión documental como infraestructura transversal (ISO 7.5).

**Completado:**
- 1 app activada: `gestion_documental` (6 modelos, 6 ViewSets, 30+ endpoints)
- base.py reestructurado: L15=documental, L20=planeación, L25=cumplimiento
- Guard condicional `apps.is_installed()` en gestion_estrategica/urls.py
- Integración BPM: validación firmas en aprobar/publicar, endpoint estado-firmas
- Marca de agua "COPIA CONTROLADA" en PDF export (WeasyPrint)
- Campos preparatorios: workflow_asociado_id, es_auto_generado
- Bugs corregidos: Badge default→gray, ConfirmDialog default→info, confirmLabel→confirmText
- Migración 0001_initial APLICADA (Docker local + VPS)
- Seed: is_enabled=True, 1 tab "Documentos" con 4 secciones
- Auditorías Internas removida de gestion_documental (ISO 9.2 ≠ ISO 7.5)

**Fases pendientes (spec):** 4(BPM auto-gen), 5(OCR), 6(IA), 7(Drive), 8(Biblioteca maestra)

---

## QA-INFRAESTRUCTURA — Pulido Infraestructura Base (2026-03-18) COMPLETADO
**Objetivo:** Resolver bugs de infraestructura antes de activar módulos C2.

**Completado:**
- React #31 fix: `icon: Plus` (forwardRef) → quitar/JSX en config-admin + audit-system EmptyState
- Paginación fix: 24 hooks audit-system con `asList()` helper
- Badge fix: variant `"default"`/`"neutral"` → `"gray"`
- API routes fix: 3 rutas audit-system corregidas (url_path ↔ frontend mismatch)
- Sidebar refactorizado: branding neutro, solo módulos enabled visibles
- Notificaciones polling fix: `refetchInterval` con error guard
- Query key collision `['modules', 'tree']` resuelto: hooks compartidos en `@/hooks/useModules`
- Config Admin (3 tabs: General/Catálogos/Conexiones) funcional
- Centro de Control (Logs/Alertas/Tareas/Notificaciones) funcional

---

## CASCADE-DEPLOY Level 12 — Transversal (2026-03-17) COMPLETADO
**Estrategia:** Descomentar workflow_engine (4 apps) + audit_system (4 apps) en TENANT_APPS.

**Backend:**
- 8 sub-apps activadas: disenador_flujos, ejecucion, monitoreo, firma_digital + logs_sistema, config_alertas, centro_notificaciones, tareas_recordatorios
- 9 migraciones generadas y aplicadas
- Guards condicionales `apps.is_installed()` en urls.py de ambos módulos
- analytics parcial: `config_indicadores` + `exportacion_integracion` activados

**Frontend:**
- workflows/: 4 pages, 40+ hooks, BPMN canvas (WorkflowDesignerCanvas)
- audit-system/: 5 pages (logs, alertas, notificaciones, tareas, dashboard)
- Sidebar: workflow_engine (orden 92) + audit_system (orden 91) visibles

**VPS Deploy:**
- Seeds: 20/26 OK (6 errores de apps L30/L35, esperado)
- BD: 4 módulos enabled, 21 total
- Build: 6791 modules, 56.5s

**Commits:** `07606f26` → `ec3f6f06` → `5ed89486`

---

## CASCADE-DEPLOY Level 10 — DB Reset + Progressive Rollout (2026-03-16) COMPLETADO
**Estrategia:** Borrar 212 migraciones legacy, comentar todos los módulos en TENANT_APPS excepto C0+C1, deploy desde cero.

**Backend:**
- 212 migration files eliminados → 9 migraciones limpias (core×2, tenant, ia, configuracion×2, organizacion, contexto, identidad)
- User.proveedor/cliente FK convertidos a `PositiveBigIntegerField` con `db_column` preservado
- Conditional imports: `django_apps.is_installed()` en vez de `try/except ImportError`
- Cross-module refs: `apps.get_model()` + `LookupError` handling (graceful cuando módulo no instalado)
- `gestion_estrategica/urls.py`: solo 4 sub-apps activas (org, config, identidad, contexto)
- `viewsets_strategic.py`: `HAS_PLANEACION` guard para StrategicPlan/Objective

**VPS Deploy:**
- Servicios parados → conexiones terminadas → DB dropeada + recreada
- `GRANT ALL ON SCHEMA public TO stratekaz` (PostgreSQL 15 requiere grant explícito)
- `migrate_schemas --shared` OK (15 apps)
- `bootstrap_production` OK (tenant_stratekaz + admin@stratekaz.com)
- Seeds 9/13 OK (4 errores = módulos C2 comentados, correcto)
- Frontend build OK (6779 modules, 57s)
- Dominio corregido: `stratekaz.com` → `app.stratekaz.com`

**Commit:** `084f0f6f` — `feat(cascada): reset migraciones + progressive module rollout Level 10`

**Cascade Levels definidos:**
- L10: C0+C1 (Core+Fundación) ✅
- L15: Planeación Estratégica
- L20: Cumplimiento+Riesgos
- L25: Workflows+HSEQ
- L30: Cadena de Valor
- L35: Talento Humano
- L40: Finanzas
- L45: Inteligencia

---

## CASCADA-V2 S5+S6 — Cierre de Migración (2026-03-15) COMPLETADO
**S5 — Soporte reorganizado + Cadena de Valor:**
- Todo ya completado en sprints anteriores (S1 split backend, S2-S4 frontend)
- Supply Chain redirect unidades-negocio → Fundación ✅
- Talent Hub reducido a 7 tabs gestión continua ✅
- Sin referencias legacy a admin_finance ✅

**S6 — Dashboard + Wizard + Plantillas:**
- Dashboard horizontal PHVA con 11 lanes, 3 fases, Framer Motion ✅ (ya implementado)
- Progreso Fundación con checklist en Dashboard ✅ (ya implementado)
- Items pendientes movidos a backlog P3:
  - Wizard Fundación 12 pasos (WizardModal genérico ya existe)
  - Plantillas por industria (feature nuevo, 0%)
  - Panel notificaciones/tareas transversal en sidebar
  - Módulo Configuración: consecutivos, integraciones, unidades

**Resultado final CASCADA-V2:** 19 módulos con features frontend independientes, zero circularidad, SIDEBAR_LAYERS con 11 niveles agrupados en 3 fases PHVA. Arquitectura lista para escalar.

---

## CASCADA-V2 S4 — Planificación Operativa + Acciones de Mejora (2026-03-15) COMPLETADO
**Alcance:** Extraer 2 módulos + verificar 1 ya independiente para Cascada V2.
- **Planificación Operativa**: 10 archivos (api, hooks, types, page, 5 components) de `gestion-estrategica/` → `features/planificacion-operativa/`
- **Acciones de Mejora**: 1 page de `gestion-estrategica/` → `features/acciones-mejora/` (cross-module read de hseq)
- **Protección y Cumplimiento**: verificado OK — `features/cumplimiento/` + `features/riesgos/` ya independientes, redirects legacy funcionan
- Limpieza barrels gestion-estrategica (api, hooks, types index.ts)
- 17 archivos, 18 insertions, 34 deletions. Commit `e399208`.
- Auditoría: `tsc --noEmit` ✅ | `vite build` ✅ | grep imports cruzados ✅

---

## CASCADA-V2 S3 — Gestión Documental + Mi Equipo (2026-03-15) COMPLETADO
**Alcance:** Extraer 2 módulos a features frontend independientes para Cascada V2.
- **Gestión Documental**: 16 archivos (api, hooks, types, pages, 10 components, utils) de `gestion-estrategica/` → `features/gestion-documental/`
- **Mi Equipo**: 44 componentes (perfiles-cargo, seleccion, colaboradores, onboarding) de `talent-hub/` → `features/mi-equipo/components/`
- Actualización de imports en ~60 archivos, limpieza de barrels, TalentHubPage limpiado
- 71 archivos, 162 insertions, 244 deletions. Commit `2ff0ea6`.
- Auditoría: `tsc --noEmit` ✅ | `vite build` ✅ | grep imports cruzados ✅

---

## CASCADA-V2 S2 — Fundación tab 4 + turnos cargo + cleanup (2026-03-15) COMPLETADO
**Alcance:** Completar Tab 4 Fundación (reglamento_interno + contratos_tipo), agregar turnos al Cargo, cleanup dead code.
- Cleanup: 4 archivos muertos eliminados, barrels limpiados
- Reglamento Interno: FE section completa (BE ya existía en motor_cumplimiento)
- Contratos Tipo: modelo + migración + serializer + viewset BE, types + api + hooks + section FE
- Turnos Cargo: 4 campos (turno_trabajo, horario_entrada/salida, dias_laborales) en modelo + serializer + form
- Commit `78b28c1`.

---

## CASCADA-V2 S1 — Split admin_finance → administracion + tesoreria (2026-03-15) COMPLETADO
**Alcance:** Reorganizar módulo V1 `admin_finance` (4 sub-apps) en 2 módulos V2 independientes.
- **administracion**: presupuesto, activos_fijos, servicios_generales → `/api/administracion/`
- **tesoreria**: tesoreria → `/api/tesoreria/`
- Backend: `git mv` sub-apps, AppConfig.name update, INSTALLED_APPS, urls.py, middleware
- Frontend: Split types/api/hooks/components/pages, nuevos barrels, rutas actualizadas
- DB sin cambios (`db_table='admin_finance_*'` preservado), app_labels sin cambios
- 86 archivos, 1046 insertions, 1479 deletions. Commit `65e319b`.
- Doble auditoría: `manage.py check` ✅ | `makemigrations --check` ✅ | `tsc --noEmit` ✅ | `vite build` ✅

---

## CONSULTORES-EXTERNOS + DRF-SPECTACULAR (2026-03-13) COMPLETADO
**Alcance:** Feature completa "Consultores Externos" en Talent Hub (8 fases) + auditoría drf-spectacular (14 archivos corregidos).

### Feature: Consultores Externos
- **Backend sub-app**: `talent_hub/consultores_externos/` — ViewSet, serializers, filters, URLs
- **Modelo**: `es_independiente` BooleanField en Proveedor (distingue persona natural vs firma)
- **Endpoint**: `GET /api/talent-hub/consultores-externos/` con filtros tipo/independiente/estado/cargo/firma
- **Acción**: `estadisticas/` — stats para StatsGrid
- **Frontend**: Page Tipo A (StatsGrid + SectionToolbar + Table) con RBAC
- **RBAC seeds**: Tab + Section `consultores_externos` con permisos view/edit
- **Formulario Proveedor**: Toggle `es_independiente` condicional (solo CONSULTOR/CONTRATISTA)

### Fix: drf-spectacular E001 (commit `90f9902`)
14 archivos con `filterset_fields`/`Meta.fields` que referenciaban campos inexistentes:
- Cross-module IntegerFields: `'proveedor'` → `'proveedor_id'` (tesoreria, servicios_generales, recepcion)
- `'colaborador'` → `'colaborador_id'` (medicina_laboral x3)
- `'responsable'` → `'responsable_id'` (analytics)
- Serializer fields: `'order'` → `'orden'` (core rbac), `module/action/scope` → `modulo/accion/alcance` (core permisos)
- Campos fantasma: `'created_at'/'updated_at'` en modelos sin TimeStamped (calidad x10, gestion_ambiental, gestion_transporte)
- `'flujo_firma_default'` comentado en modelo (identidad), `'is_active'` inexistente (requisitos_legales)

### Commits
- `697ec12` — feat(talent-hub): consultores externos complete (Phases 1-8)
- `90f9902` — fix(api): drf-spectacular 0 errors (14 files)

---

## QA-AUTH-AVATAR (2026-03-12) COMPLETADO
**Alcance:** Auditoría auth/session (logouts inesperados, SW auto-reload) + avatar/foto de perfil roto + página de perfil crasheando. 2 sesiones, 7 bugs, 4 commits.

### Sesión 1 — Auth/Session fixes (commit `f6b1774`)
- **PWA SW auto-reload**: `controllerchange` → `window.location.reload()` causaba logouts en cada deploy. Fix: reemplazar con toast notification "Actualización disponible" + botón "Recargar ahora"
- **SW config**: `skipWaiting:false` + `clientsClaim:false` (inicial, luego revertido)
- **Proactive token refresh**: Timer que renueva access token 5min antes de expiración (decodifica JWT exp claim)
- **401 interceptor guard**: `hasTokenInStorage` check antes de `forceLogout()` para evitar logout durante Zustand rehydration
- **Manifest cache**: `no-cache` headers en endpoint `/manifest.json` del tenant

### Sesión 2 — Avatar + Perfil + SW transition (commits `9cda571`, `3c2e741`, `4b9cafd`)
- **AvatarUploadModal**: `const _error` vs `if (error)` — variable mal nombrada causaba ReferenceError al seleccionar foto por click (drag-and-drop sí funcionaba)
- **UserViewSet serializer context**: `me()`, `update_profile()`, `restore()` no pasaban `context={'request': request}` → `photo_url` retornaba URL relativa en vez de absoluta
- **Vite proxy /media**: Solo `/api` estaba proxy a backend; `/media/` iba a Vite → 404 en desarrollo
- **ChangePasswordModal forwarder**: `export default ChangePasswordModal` después de `export { ChangePasswordModal } from ...` — re-export NO crea variable local → ReferenceError al cargar `/perfil`
- **PWA SW transition**: Revertido `skipWaiting:true` + `clientsClaim:true` — el toast en main.tsx es la protección correcta (patrón Gmail/Slack). `skipWaiting:false` impedía que el código nuevo llegara al usuario

### Archivos modificados (6 únicos)
| Archivo | Cambio |
|---------|--------|
| `frontend/src/main.tsx` | Toast notification en `controllerchange` |
| `frontend/vite.config.ts` | SW config + proxy `/media` |
| `frontend/src/api/axios-config.ts` | Proactive refresh + 401 guard |
| `backend/apps/core/viewsets.py` | `context={'request': request}` en 3 acciones |
| `frontend/src/components/common/AvatarUploadModal.tsx` | `_error` → `error` |
| `frontend/src/features/perfil/components/ChangePasswordModal.tsx` | Eliminar `export default` roto |
| `backend/apps/tenant/views.py` | `no-cache` headers en manifest |

---

## MIGRATIONS-SYNC (2026-03-12) COMPLETADO
**Alcance:** 8 apps con migraciones pendientes creadas localmente. Deploy VPS con `--fake` masivo en 5 tenant schemas.

### Problema
Migraciones creadas localmente (`deb099b`, `d552d6d`) aplicaban correctamente en `public` schema pero fallaban en tenant schemas (creados via `--run-syncdb`). Los objetos DB ya existían pero con nombres de índices/constraints diferentes, causando errores de `RenameIndex` en organizacion.0004.

### Solución
`migrate_schemas <app> <migration> --fake` para las 7 migraciones pendientes (mejora_continua.0004 ya estaba faked de sesión anterior). Esto registra las migraciones en `django_migrations` sin ejecutar SQL, ya que la estructura DB ya era correcta via syncdb.

### Resultado
- ✅ 8/8 migraciones marcadas `[X]` en public + 5 tenant schemas
- ✅ Frontend build OK (6767 modules)
- ✅ 3 servicios reiniciados y running (gunicorn, celery, celerybeat)

### Migraciones faked

| App | Migración | Tenants faked |
|-----|-----------|---------------|
| mejora_continua | 0004 | 5/5 (sesión anterior) |
| monitoreo | 0003 | 3/5 (grasas+público ya aplicados) |
| formacion_reinduccion | 0004 | 3/5 (grasas+público ya aplicados) |
| organizacion | 0004 | 5/5 |
| recepcion | 0004 | 5/5 |
| almacenamiento | 0005 | 0/5 (ya aplicados todos) |
| ipevr | 0002 | 0/5 (ya aplicados todos) |
| seguridad_industrial | 0002 | 0/5 (ya aplicados todos) |

### 5 Tenant schemas (actualizado)
1. `tenant_grasas_y_huesos_del_` — Cliente real (Grasas y Huesos)
2. `tenant_grupo_empresarial_ol` — Cliente (Grupo Empresarial)
3. `tenant_radio_taxi_cone_ltda` — Cliente (Radio Taxi)
4. `tenant_stratekaz` — Demo
5. `tenant_vidales_food_s_a_s` — Cliente (Vidales Food)

---

## QA-QUALITY (2026-03-11) COMPLETADO
**Commits:** `6078e64`, `a9f56ad`, `eb03289`
**Alcance:** Auditoría QA integral (93 findings: 4 P0, 42 P1, 27 P2, 20 P3) + fixes P0-P2.

### Sesión 1 — P0/P1 (commit `6078e64`)
- **RBAC canDo guards** en 17 componentes (XSS prevention con DOMPurify)
- **Migración** CaracterizacionProceso
- 22 archivos modificados

### Sesión 2 — Quick Wins (commit `a9f56ad`)
- **ErrorBoundary** wired up en App.tsx (existía pero nunca se usaba)
- **CI gates**: ESLint threshold 1500→850, removed `continue-on-error` de pytest/Black/Ruff
- **Docker security**: Redis `--requirepass`, PG+Redis bind `127.0.0.1`
- **Accessibility**: aria-label en 8 icon-only buttons (6 archivos)
- **CSRF**: `CSRF_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_HTTPONLY = True`
- **Removed** mysqlclient de requirements.txt (proyecto usa PostgreSQL)
- **verbose_name** en 5 modelos workflow_engine/monitoreo

### Sesión 3 — Sprint Medio (commit `eb03289`)
- **CSP hardening**: Removido `unsafe-eval` de `CSP_SCRIPT_SRC`, agregado `CSP_CONNECT_SRC` para Sentry
- **33 exhaustive-deps warnings → 0** en 22 archivos:
  - `useMemo` wrap para logical expressions inestables (`data?.results || []`)
  - `useCallback` para funciones en deps (Tooltip, SignaturePad)
  - `useRef` para callbacks estables (NormaFilters debounce, ConsecutivoFormModal preview)
  - Functional setState para eliminar stale closures (useConfirm)
  - Constante movida fuera del componente (ConfiguracionPage)
- **CI ESLint threshold**: 850→810 (real: 804 warnings, -33)

### P2/P3 Backlog (NO abordado — para futuras sesiones)
- N+1 queries (~25-30 ViewSets sin select_related)
- @action url_path (476 endpoints sin kebab-case explícito)
- Django 5.0→5.1 upgrade
- ResponsiveTable adoption (6.8%)
- Test coverage

**Archivos totales:** 58 modificados across 3 commits

## REORG-B (2026-03-11) COMPLETADO
**Commit:** `72a7c98` — `feat(mejora-continua): django-fsm + EventBus + notificaciones`
**Cambios:**
- django-fsm 3.0.0: FSMField + @transition en ProgramaAuditoria, Auditoria, Hallazgo
- EventBus pub/sub singleton (utils/event_bus.py) con dispatch async via Celery
- post_transition signals → EventBus → NotificationService (8 tipos)
- Modelos migrados a TenantModel (elimina empresa_id, is_active manual)
- FKs cross-module → IntegerField + CharField cache
- Serializers con transiciones_disponibles + estado read_only
- ViewSets con try/except TransitionNotAllowed
- Frontend types sincronizados
**Archivos:** 12 changed (+1069/-270), 4 nuevos

## REORG-A (2026-03-11) COMPLETADO
**Commit:** `391a780` — `refactor(reorg): reorganizar C1+PE+SGI — eliminar redundancias y código muerto`
**Cambios:** Reorganización seeds/permisos/rutas C1+PE+SGI. Eliminó 9 archivos muertos (3 pages, 5 modals, 1 test). -5063 líneas.

## QA-RBAC-S2 (2026-03-10) COMPLETADO
**Objetivo:** Fix 401 loop, canEdit/canDelete granular en tablas, 403 notificaciones.

**Problemas resueltos:**
1. **401 loop fatal** — Script cleanup previo eliminó imports de `usePermissions`/`Modules`/`Sections` de `UsersPage.tsx` dejando referencia huérfana a `canDo()` → build falla → bundle viejo se sirve → 401 infinito.
2. **ComprasTab sub-components** — 4 sub-componentes (`RequisicionesSection`, `CotizacionesSection`, `OrdenesCompraSection`, `ContratosSection`) referenciaban `canCreate` del padre pero son funciones a nivel de módulo → cada uno necesita su propio `usePermissions()`.
3. **canEdit/canDelete granular** — 8 archivos con tablas faltaban guardas en botones Edit/Delete:
   - `UnidadesNegocioTab.tsx`, `ComprasTab.tsx` (4 sub), `GestionFlotaTab.tsx`, `DespachosTab.tsx`
   - `ClientesPage.tsx`, `ProcesamientoTab.tsx`, `ActivosFijosPage.tsx`
4. **403 en notificaciones** — `NotificacionViewSet` requería `GranularActionPermission(centro_notificaciones)` para `no_leidas`. Fix: override `get_permissions()` con `PERSONAL_ACTIONS` → solo `IsAuthenticated`.

**Commits:** `122468b` (restore+syntax), `556a2ea` (RBAC granular 8 files), `8e7b7a5` (403 notificaciones)

---

## RBAC-BUTTONS (2026-03-10) COMPLETADO
**Objetivo:** Auditoría completa RBAC frontend — ocultar botones de acción según permisos del cargo.

**Backend (5 commits):**
- `get_effective_user()` en tree/sidebar para impersonación
- `compute_user_rbac()` como fuente única de permission_codes desde CargoSectionAccess
- Toast sonner en TabAccesoSecciones + cache invalidation al impersonar
- Filtro `can_view=True` en tree/sidebar

**Frontend (85 archivos, 2096+/1026-):**
- `permissions.ts`: 202 section codes completos (antes solo 31)
- canCreate en primaryAction/Button: ~60 archivos (HSEQ 8, Supply Chain 7, Production Ops 4, Logistics Fleet 4, Sales CRM 4, Admin Finance 4, Accounting 1, Talent Hub ~25, GE ~10)
- canDelete en botones eliminar: GestionAmbientalPage (5 sub-secciones)
- canEdit+canDelete granular: RecursosSection, IniciacionSubTab
- Cleanup: removed unused canEdit/canDelete declarations (61 archivos)

---

## JUEGO-SST-S1 P3.2 (2026-03-09) COMPLETADO
**Objetivo:** Proof of concept de juego RPG 2D para gamificación SST en Talent Hub, accesible desde todos los portales.

**Stack del juego:**
- Phaser 3 (~1.4MB, lazy-loaded via vendor-phaser chunk)
- nipplejs (joystick virtual mobile)
- Event Bridge pattern (EventEmitter singleton Phaser↔React)
- Texturas procedurales (sin assets externos para POC)

**Backend (4 modelos + 6 endpoints + seed):**
- `GameLevel`: Niveles jugables con zona, puntuación, tiempo límite, config JSON
- `GameQuizQuestion`: Preguntas SST por nivel (normativa colombiana: Decreto 1072, ISO 45001, Res. 0312)
- `GameProgress`: Progreso persistente por colaborador (XP, niveles, EPPs, estadísticas)
- `GameSession`: Log de cada partida individual
- `GameViewSet` (ViewSet, no ModelViewSet): mi-progreso, niveles, preguntas, completar-nivel, leaderboard-juego, historial
- `_sync_gamificacion()`: Sincroniza XP del juego con GamificacionColaborador existente
- Seed: Nivel 1 "Planta Industrial RISKORP" + 10 preguntas quiz SST

**Frontend (12 componentes nuevos en features/sst-game/):**
- `engine/`: BootScene, GameScene, EventBridge, GameCanvas
- `components/`: GameHUD, QuizModal, MobileControls, GamePauseMenu, GameLoadingScreen, SSTGamePage, LevelCompleteModal, GameEntryCard
- `api/sstGameApi.ts` + `hooks/useGameSST.ts` + `types/game.types.ts`
- PWA caching (CacheFirst, 30 días) para assets del juego

**Integración portales (3 portales):**
- MiPortalPage: Tab "Héroes SST" con lazy-loaded GameEntryCard
- ProveedorPortalPage: Tab "Héroes SST" con lazy-loaded GameEntryCard
- ClientePortalPage: Tab "Héroes SST" con lazy-loaded GameEntryCard
- Ruta: `/mi-portal/juego-sst` → SSTGamePage (full-screen)

**Bugs resueltos en deploy:**
1. `GameLevel.codigo max_length=20` → 50 (seed value 25 chars excedía)
2. Doble `/api/api/` prefix en sstGameApi.ts (apiClient ya agrega /api/)
3. Migración faltante (nunca se corrió makemigrations localmente) → creada manualmente
4. Migraciones huérfanas en VPS (corrieron makemigrations directo) → limpieza django_migrations + fake

**Archivos:** ~37 nuevos/modificados, ~4000 líneas

---

## SIDEBAR-6-LAYERS P3.1 (2026-03-08) COMPLETADO
**Objetivo:** Reorganizar sidebar de 3 a 6 grupos visuales + agrupar Dashboard por layers + migrar tab calidad de HSEQ a SGI

**Cambios backend (viewsets_config.py + seed):**
- SIDEBAR_LAYERS 3→6: Fundación, PE, SGI (3 módulos), Operaciones (6), Organización (3), Inteligencia (3)
- `/tree/` endpoint incluye `layers` para Dashboard
- Tab calidad migrado hseq→sistema_gestion (FK update, RBAC intacto)
- HSEQ renombrado "Gestión Integral"→"Gestión HSEQ"
- SGI tabs reordenados: Planificación(1)→Documentos(2)→Auditorías(3)→Acciones(4)→Calidad(5)

**Cambios frontend:**
- DashboardPage: módulos agrupados por layer con iconos + headers + dividers
- ModuleLayer type + layers en ModulesTree
- Redirect /hseq/calidad→/sistema-gestion/calidad
- HSEQPage: link calidad actualizado a /sistema-gestion/calidad

**Auditoría post-implementación:**
- Fix `.order`→`.orden` (campo correcto del modelo)
- Eliminado partes_interesadas stale de TAB_ROUTES
- Verificado: calidadApi.ts BASE_URL `/hseq/calidad` es API backend (correcto, no se mueve)

---

## SPRINT-PROYECTOS-PMI P3 (2026-03-08) COMPLETADO
**Objetivo:** Hacer funcional el ciclo completo PMI — Gantt real, Dashboard EVM, modales completos, Cierre formal

**B1 — Gantt PMI (commit 477dec3):**
- GanttView: agrupación por fases (collapsibles), flechas SVG de dependencias (bezier), tooltip enriquecido
- views.py: acción `gantt` incluye fase_id, fase_nombre, fase_orden; ordering por fase__orden, codigo_wbs
- GanttItem type extendido con fase_id, fase_nombre, fase_orden

**B2 — Dashboard Monitoreo + Curva S (commit 78ade5f):**
- DashboardTab: segundo StatsGrid con SPI/CPI/Salud/Último Reporte desde último seguimiento
- CurvaSChart integrado en DashboardTab (ya existía, solo se conectó)
- Helpers: fmtMoney, indexColor (semáforo EVM), saludColor/saludLabel

**B3 — Modales mejorados (commit 082ac76):**
- FaseFormModal: slider + barra visual de porcentaje_avance + fecha_inicio_real + fecha_fin_real
- RecursoFormModal: preview en vivo Costo Total = costo_unitario × cantidad (formato K/M)
- SeguimientoFormModal: panel SPI/CPI en vivo con semáforo de color (verde/amarillo/rojo)
- CreateFaseDTO extendido con fecha_inicio_real, fecha_fin_real, porcentaje_avance

**B4 — Checklist Cierre + Acta (commit b156cf0):**
- CierreSubTab: botón "Marcar como Completado" aparece sólo con 6/6 checklist + ConfirmDialog
- ActaCierreFormModal: preview variación presupuestal en vivo con semáforo rojo/verde

---

## Sprint QA-PROYECTOS-S5 P2.9 (2026-03-07) COMPLETADO
**Objetivo:** QA manual Iniciación → fix bugs críticos de guardado + flujo de avance de fase

**Sesión 5 — Fix SelectListItem u.value→u.id (bug sistémico):**
- [x] ROOT CAUSE: `SelectListItem` tiene `id` (no `value`), pero 8 componentes mapeaban `u.value` → `undefined` → PATCH siempre enviaba `null`
- [x] Fix 8 archivos FE: IniciacionSubTab, PortafolioSubTab, ActividadFormModal, RecursoFormModal, RiesgoFormModal, AreaFormModal, EntregaEppFormModal, ProcesoFormModal
- [x] Fix 1 archivo FE: `t.value→t.id` para tiposEpp en EntregaEppFormModal
- [x] Fix BE: `select_users` ya no excluye `is_superuser=True` → admin seleccionable como Sponsor/Gerente

**Sesión 5 — Aprobación Charter verificada:**
- [x] Flujo completo funcional: Crear Charter → Aprobar (ConfirmDialog) → fecha_aprobacion + aprobado_por registrados
- [x] Checklist se actualiza correctamente (5/5 items)

**Sesión 5 — Botón automático "Avanzar a Planificación":**
- [x] Cuando checklist Iniciación = 5/5, aparece botón verde "Avanzar a Planificación" en barra de progreso
- [x] Click → ConfirmDialog → POST cambiar-estado → proyecto pasa a `planificacion`
- [x] Proyecto desaparece de Iniciación y aparece en Planificación

**Commits:** eaec498, 86bf9ce

---

## Sprint QA-PROYECTOS P2.8 (2026-03-07) COMPLETADO
**Objetivo:** QA del módulo Gestión de Proyectos PMI — bugs críticos + funcionalidad Iniciación

**Sesión 1 — Eliminación emojis UI:**
- [x] 7 archivos: GamificacionTab (🥇🥈🥉→Award), ExportActaButton (📄→removed), GanttTimeline (📅→CalendarDays), CargoNode (📍→MapPin), DashboardTiempo (✓→Check), NotificacionesPage (✓✗→texto), IPEVRTab (✕→X icon)

**Sesión 2 — Fix 500 error detalle proyecto:**
- [x] ROOT CAUSE: `Decimal * float` TypeError en properties `variacion_costo` e `indice_desempeno_costo`
- [x] Fix: `Decimal(self.porcentaje_avance) / Decimal(100)` en ambas properties
- [x] Agregar `select_related` faltantes: `origen_cambio`, `origen_objetivo`, `origen_estrategia_tows`, `charter`

**Sesión 3 — Cache invalidation Kanban→otras vistas:**
- [x] ROOT CAUSE: `proyectosKeys.proyectos()` retornaba `['proyectos', undefined]` que NO matcheaba queries filtradas como `['proyectos', {estado:'iniciacion'}]`
- [x] Fix: Reestructurar query keys con `all: ['proyectos']` base + segments `'list'`/`'detail'`
- [x] Todas las mutations (12) ahora invalidan `proyectosKeys.all` (prefix matching)

**Sesión 4 — IniciacionSubTab funcional:**
- [x] Quitar botón "Nuevo Proyecto" redundante (crear solo desde Portafolio)
- [x] SectionHeader + StatsGrid del Design System (antes header hardcodeado)
- [x] Modal de edición: Sponsor, Gerente (useSelectUsers), Fechas, Justificación, Beneficios, Descripción
- [x] Checklist dinámico por proyecto (4 items PMI): verde=completado, gris=pendiente + progress bar
- [x] Backend: ProyectoListSerializer extendido con sponsor_nombre, descripcion, justificacion, beneficios_esperados

**Hallazgo importante:** 8 modelos backend sin UI (ProjectCharter, InteresadoProyecto, FaseProyecto, RecursoProyecto, RiesgoProyecto, SeguimientoProyecto, LeccionAprendida, ActaCierre). Requiere sprint dedicado SPRINT-PROYECTOS-PMI.

**Commits:** 72a78a3, c0656ce, e76374d, a92dcdb

---

## Sprint AUDIT-SYNC P2.7 — FE↔BE Sync (2026-03-05) COMPLETADO
**Objetivo:** Auditoría exhaustiva de sincronización frontend↔backend en 14 módulos

### Sesión 1 — AUDIT-SYNC principal (11 módulos)
- [x] ~56 `@action` url_path fixes en backend (snake_case→kebab-case)
- [x] ~200 tipos TS sincronizados con serializers reales
- [x] Supply Chain: 13 archivos, 3 componentes reescritos (UnidadesNegocioTab, EvaluacionesTab, EvaluacionProveedorForm)

### Sesión 2 — P2 módulos con incompatibilidad total
- [x] **Off-Boarding** (97+ mismatches): Types (642 líneas), hooks (634 líneas), API completamente reescritos. 8 entidades + CertificadoTrabajo nuevo. PazSalvo area-based, LiquidacionFinal sin estado
- [x] **Riesgos Viales** (44 mismatches): Types (1000 líneas) con 12 enums + 32 booleans InspeccionVehiculo, API (330 líneas) 5 sub-APIs, hooks (433 líneas) con query keys factory
- [x] **Aspectos Ambientales** (80+ mismatches): Types (782 líneas) con 17 enums + helper functions, API (351 líneas) 5 sub-APIs, hooks (474 líneas) con 40+ hooks
- [x] Barrel exports `index.ts` sincronizados
- [x] TS compilation clean

### Sesión 3 — HOTFIX build errors (6 phantom imports)
- [x] `metodoPagoOptions` → `metodoPagoLiquidacionOptions` (conflicto `export *` con nomina.types)
- [x] `MetodoPago` → `MetodoPagoLiquidacion` (mismo conflicto)
- [x] `PazSalvoFormModal.tsx` reescrito (areaPazSalvoOptions, campos reales del backend)
- [x] `ExamenFormModal.tsx` reescrito (sin tipo_examen fantasma, campos reales del serializer)
- [x] `ExamenesTab.tsx` corregido (tipoExamenEgresoOptions eliminado, useUpdateExamenEgreso)
- [x] `LiquidacionesTab.tsx` corregido (useRegistrarPagoLiquidacion reemplaza usePagarLiquidacionFinal)
- [x] Tipos faltantes agregados: `SatisfaccionGeneral`, `EstadoLiquidacionFinal` + options arrays
- [x] Build verificado local: ✅ 50.08s sin errores

### Reglas documentadas
- TS types 3-tier pattern (List/Detail/Create/Update)
- BE choices → TS enums con _LABELS/_COLORS Records
- DecimalField = string en TS
- Barrel exports sync obligatorio
- `export *` conflicts: Rollup omite silenciosamente, `tsc` NO detecta, solo `vite build`
- Phantom imports: verificar TODOS los componentes al reescribir types/hooks

---

## Auditoría Design System — Planeación Estratégica (2026-03-04) COMPLETADO
**Objetivo:** Contra-auditoría completa del módulo Planeación Estratégica (144 archivos, 43+ modales)

### Sesión 1 — Primera auditoría (commit `4b330bd`)
- [x] **16 modales migrados Modal→BaseModal** con footer prop
- [x] **TOWS overlap fix**: EstrategiaTowsFormModal — estrategia buttons overflow corregido
- [x] **4 planificacion-sistema modales**: ActividadPlanFormModal, ObjetivoSistemaFormModal, PlanTrabajoFormModal, ProgramaGestionFormModal

### Sesión 2 — Contra-auditoría (commit `f1a2a98`)
- [x] **5 gestion-documental modales**: DocumentoFormModal, PlantillaFormModal, TipoDocumentoFormModal (Modal→BaseModal + footer), DocumentoDetailModal, AsignarFirmantesModal
- [x] **4 revision-direccion modales**: CompromisoDetailModal (footer extraído), ProgramacionFormModal (footer + 5 Switch), FirmaActaModal, GeneradorActaModal
- [x] **2 proyectos modales**: PortafolioSubTab inline modals (ProyectoDetailModal + ProyectoCreateModal)
- [x] **Checkboxes→Switch**: TipoDocumentoFormModal (2), ProgramacionFormModal (5)
- [x] **Grids responsive**: 15+ archivos — `grid-cols-N` → `grid-cols-1 sm:grid-cols-N`
- [x] **Tildes**: 10 archivos corregidos (Configuración, Gestión Documental, distribución, Título, Descripción, Acción, etc.)
- [x] **HTML entities**: ParteInteresadaFormModal `&oacute;`→`ó`, `&aacute;`→`á`
- [x] **Hook consistencia**: AreaFormModal `usersAPI.getUsers()` → `useSelectUsers()`
- [x] **Sizes corregidos**: `5xl`/`6xl` → `full` (no existen en BaseModal)

### Auditorías sin hallazgos:
- **Hooks** (23 archivos): 2/23 usan factory, 7 `any` solo en error handlers, zero dead code
- **Pages** (13 archivos): 95.4% compliant, solo tildes menores
- **Data flows**: Dropdowns cross-module correctos, endpoints kebab-case, paginación DRF consistente
- **Gestión de Proyectos** (19 archivos): 100% compliant

**Resultado final:** Zero legacy Modal imports, zero non-responsive grids en modales, TypeScript + ESLint clean
**Archivos:** 27 modificados | **Commits:** `4b330bd` + `f1a2a98`

---

## Sprint BUGFIX (2026-03-04) COMPLETADO
**Objetivo:** Corregir bugs encontrados durante QA manual del usuario
- [x] **P0 JWT refresh race condition**: Reescritura `axios-config.ts` — `isRefreshing` flag + `refreshPromise` compartida. Múltiples 401 esperan primer refresh en vez de disparar N requests. Solo `forceLogout()` en 401/400 refresh (no 5xx/network)
- [x] **P1 config-stats normas_iso**: Agregado `normas_iso` a `VALID_SECTIONS` + `calculate_normas_iso_stats()` en `stats_views.py`
- [x] **P2 Modal Sede dark mode**: Icon badges coloreados por sección (Building2 azul, Navigation emerald, UserCog purple, Settings2 amber) + switch containers `dark:bg-gray-700/50` + border
- [x] **P3 ESLint cleanup**: SedeFormModal 5 warnings→0 (any→typed, exhaustive-deps), LoginPage any→unknown

**Archivos:** 3 modificados (axios-config.ts, stats_views.py, SedeFormModal.tsx)
**Commit:** `983122b` fix(core): Sprint BUGFIX — JWT race condition + config-stats + modal Sede

---

## Sprint CLIENTE-PORTAL (2026-03-04) COMPLETADO
**Objetivo:** Completar frontend del Portal de Clientes (backend ya existía)
- [x] Frontend: `crearAcceso` API method en `clientesApi`
- [x] Frontend: `useCrearAccesoCliente` mutation hook con toast + invalidación
- [x] Frontend: `CrearAccesoClienteModal` (email + username, auto-suggest)
- [x] Frontend: Botón `KeyRound` en ClientesPage tabla de acciones
- [x] Fix: LoginPage redirect — `isClientePortalUser` → `/cliente-portal` (ambos flujos: single-tenant + multi-tenant)
- [x] Fix: ESLint `any` → `unknown` en LoginPage catch blocks + removed unused `tenantUser`

**Archivos:** 5 modificados + 1 creado
**Commit:** `a77a7a8` feat(sales-crm): Sprint CLIENTE-PORTAL

---

## Sprint 22 — Barrido GE + Blockers (2026-02-21) COMPLETADO
- [x] Barrido funcional GE (secciones 1-8)
- [x] 5 GE audit blockers (consecutivos, comunicaciones, DOFA, PESTEL, TOWS)
- [x] app_label fix: contexto -> gestion_estrategica_contexto
- [x] White screen blocker (manualChunks — see pitfalls.md)
- [x] Deploy to VPS production

## Sprint 23 — Seguridad + Hardening (2026-02-21) COMPLETADO
- [x] C1: SECRET_KEY sin default en base.py (fuerza .env)
- [x] C2: Eliminado config/settings.py legacy (MySQL, sin multi-tenant)
- [x] C3: Limpiado .env raiz (MySQL/Grasas -> PostgreSQL correcto)
- [x] C4: Eliminado backend/.env.local (MySQL password hardcodeado)
- [x] A4: Makefile MySQL -> PostgreSQL (shell-db, health, up, dev-setup)
- [x] M2: vite.config esbuild.drop condicional (solo produccion)

## Sprint 24 — Infra & Observabilidad (2026-02-21/22) COMPLETADO

**Codigo:**
- [x] CI/CD: Fix actions versions @v6->@v4, branch naming feat/ convention, migrate_schemas
- [x] testing.py: DB config env-var-aware (PostgreSQL en CI, SQLite local)
- [x] production.py: RotatingFileHandler (10MB, 5 backups) + error_file handler
- [x] logrotate config: `scripts/logrotate-stratekaz.conf`
- [x] revision-direccion.types.ts: Alineado con backend (periodo/lugar/incluye_*)
- [x] ProgramacionFormModal: Eliminados 3 `as any`
- [x] CompromisosDashboard: Eliminados 2 `as any`
- [x] @sentry/react: Instalado + init en main.tsx + ErrorBoundary.captureException

**VPS (ejecutado en terminal hPanel 2026-02-22):**
- [x] A3: Redis password configurado (`requirepass` + .env)
- [x] M3: Logrotate instalado en `/etc/logrotate.d/stratekaz`
- [x] M5: Backup cron configurado (diario 2AM)
- [x] M4: Sentry DSN configurado (backend + frontend)
- [x] CI/CD: Workflows activos + relajados para FASE 3
- [x] CI relaxed: backend `continue-on-error`, ESLint `--max-warnings 1500`, npm audit `critical` only

## Sprint 25 — Barrido Funcional N2-N6 (2026-02-21/22) COMPLETADO

### Fase A-C: Multi-tenant security fixes (17 archivos)
- [x] Fix `request.user.empresa` / `getattr(user, 'empresa_id')` en 9 archivos
- [x] Fix `X-Empresa-ID` header bypass en 6 archivos (workflow_engine, motor_riesgos)
- [x] Fix `empresa=1` hardcoded en 5 archivos (cumplimiento, ipevr, gestion_proyectos)
- [x] Todos reemplazados con `get_tenant_empresa(auto_create=False)`

### Fase D: Migrar motor_riesgos a base models (22 modelos, 14 archivos)
- [x] aspectos_ambientales: 5 modelos (CategoriaAspecto, AspectoAmbiental, ImpactoAmbiental, ProgramaAmbiental, MonitoreoAmbiental)
- [x] riesgos_viales: 5 modelos (TipoRiesgoVial, RiesgoVial, ControlVial, IncidenteVial, InspeccionVehiculo)
- [x] seguridad_informacion: 6 modelos (ActivoInformacion, Amenaza, Vulnerabilidad, RiesgoSeguridad, ControlSeguridad, IncidenteSeguridad)
- [x] sagrilaft_ptee: 6 modelos + rename SeñalAlerta -> SenalAlerta (encoding fix)
- [x] Patron: Catalogos=TimestampedModel+SoftDeleteModel | Negocio=AuditModel+SoftDeleteModel
- [x] Migraciones regeneradas limpias + fake-applied en dev y VPS

### Fase E: Connect Admin Finance + Accounting (16 archivos)
- [x] Admin Finance: types (30+ interfaces), api (16 clients), hooks (60+ hooks)
- [x] 5 pages: AdminFinancePage, TesoreriaPage, PresupuestoPage, ActivosFijosPage, ServiciosGeneralesPage
- [x] Accounting: types (30+ interfaces), api (18 clients), hooks (70+ hooks)
- [x] 5 pages: AccountingPage, ConfigContablePage, MovimientosContablesPage, InformesContablesPage, IntegracionContablePage
- [x] Deployed to VPS production (2026-02-22)

### Fixes Contexto Organizacional
- [x] Fix: MatrizComunicacion ViewSet filterset_fields -> replaced removed booleans with `es_obligatoria`
- [x] Fix: Stakeholders estadisticas `por_grupo` -> handle None key as 'Sin grupo'

### Fase F: Connect Riesgos skeleton pages (14 archivos)
- [x] RiesgosProcesosPage: connected to RiesgosOportunidadesTab + useRiesgos/useOportunidades
- [x] IPEVRPage: connected to IPEVRTab (hooks handled internally)
- [x] ContextoOrganizacionalPage: connected to ContextoOrganizacionalTab
- [x] AspectosAmbientalesPage: 3 tabs (aspectos/programas/monitoreos) with StatsGrid
- [x] RiesgosVialesPage: 3 tabs (riesgos/incidentes/inspecciones) with PESV stats
- [x] SeguridadInformacionPage: 4 tabs + NEW types+api+hooks for seguridad_informacion
- [x] SagrilaftPteePage: 4 tabs + NEW types+api+hooks for sagrilaft_ptee
- [x] All 14 files pass TypeScript strict + ESLint + Prettier + Vite build
- [x] Deployed to VPS production (2026-02-22)

## Sprint 25-hotfix — Sentry Bugs + Production Fixes (2026-02-22) COMPLETADO

Bugs reportados por Sentry en produccion tras deploy de Sprint 25F.

### Fixes de sesion anterior (contexto recuperado)
- [x] Riesgos API double `/api/api/` prefix: 7 API files corregidos (strip `/api` prefix)
- [x] CambioFormModal `.map()` crash: optional chaining en array nullable
- [x] Sentry: Tablas faltantes `alertas_alerta_generada` y `workflow_exec_tarea_activa` (investigadas, tablas existentes en schemas)

### Fixes de esta sesion
- [x] **Plan creation not refreshing**: `useCreatePlan` (factory) solo invalidaba `planKeys.lists()`, no `strategicKeys.activePlan`. Override custom con invalidacion de ambas query keys.
  - Root cause: Factory hooks no invalidan query keys custom
  - Archivo: `frontend/src/features/gestion-estrategica/hooks/useStrategic.ts`
- [x] **KPIs blank screen**: MISMO root cause que plan — PlaneacionTab L630 `if (!plan)` → empty state impide renderizar KPIsTab
  - Fix: Resuelto por el fix de cache invalidation de plan
- [x] **Stakeholders Excel export crash** (2 bugs):
  - Bug 1: `area_responsable.nombre` → debe ser `.name` (Area model usa `name`)
  - Bug 2: `responsable_empresa.usuario.get_full_name()` crashea cuando `usuario` es None (nullable)
  - Fix: `.nombre` → `.name`, null guard completo, `select_related('responsable_empresa__usuario')`
  - Archivo: `backend/apps/gestion_estrategica/contexto/views.py`
- [x] Commit `5f9952e` pushed + deployed to VPS production
- [x] Deploy verified: git pull OK, migrate_schemas OK, tsc+vite build OK, services restarted

## Sprint 26-TH — Unified Colaborador+User Creation + Sentry Fixes (2026-02-22) COMPLETADO

### Flujo Unificado Colaborador + User (6 fases)

**Backend (3 fases):**
- [x] Fase 1: `crear_acceso_sistema` action en ColaboradorViewSet
  - Crea TenantUser (public) + User (tenant) + TenantUserAccess atomicamente
  - Token de setup de password (72h expiracion) via UUID
  - Email automatico con link de configuracion de password
  - Archivo: `backend/apps/talent_hub/colaboradores/views.py`
- [x] Fase 2: `setup-password` endpoint en core
  - Vista publica (AllowAny) para que empleados configuren su password
  - Valida token, establece password en TenantUser
  - Archivo: `backend/apps/core/views.py`
- [x] Fase 3: Signal `auto_create_colaborador` actualizado
  - Guard flag `_from_contratacion` evita crear colaborador duplicado
  - Solo auto-crea cuando User se crea SIN flujo de contratacion
  - Archivo: `backend/apps/talent_hub/colaboradores/signals.py`

**Frontend (3 fases):**
- [x] Fase 4: ColaboradorFormModal Step 4 "Acceso al Sistema"
  - Dynamic STEPS: 4 pasos (create) / 3 pasos (edit)
  - Auto-suggest email/username a partir de nombre del colaborador
  - Toggle switch para crear acceso opcionalmente
  - Resumen completo antes de enviar
  - Archivo: `frontend/src/features/talent-hub/components/colaboradores/ColaboradorFormModal.tsx`
- [x] Fase 5: SetupPasswordPage
  - Pagina publica glassmorphism + NetworkBackground
  - Validacion Zod (8+ chars, upper, lower, number)
  - 3 estados: formulario, exito (auto-redirect), link invalido
  - Archivos: `frontend/src/pages/SetupPasswordPage.tsx`, `frontend/src/api/auth.api.ts`, `frontend/src/routes/index.tsx`
- [x] Fase 6: MisDocumentos conectado a HojaVida API
  - Documentos tab visible para TODOS los usuarios (no solo externos)
  - Hook `useMisDocumentos` conectado a API real
  - Muestra: nivel estudio, certificaciones, experiencia, idiomas
  - Archivo: `frontend/src/features/mi-portal/components/MisDocumentos.tsx`

### Crear Acceso para Colaboradores Existentes
- [x] `useCrearAccesoColaborador` hook: POST `/talent-hub/empleados/colaboradores/${id}/crear-acceso/`
- [x] `CrearAccesoModal`: email + username inputs, auto-suggest, info 72h
- [x] Shield button en ColaboradoresSection para empleados sin `usuario`
- [x] Archivos: `useColaboradores.ts`, `CrearAccesoModal.tsx`, `ColaboradoresSection.tsx`

### Sentry Bug Fixes
- [x] **TemaEncuesta NOT NULL encuesta_id**: Misma causa que ParticipanteEncuesta.
  - `TemaEncuestaCreateSerializer` no incluia `encuesta` en fields
  - Fix: Agregado `encuesta` con `required=False` + `perform_create` validation
  - Archivo: `backend/apps/gestion_estrategica/encuestas/serializers.py` + `views.py`
- [x] **EmailService crash: `settings.FRONTEND_URL` AttributeError**
  - `email_service.py:124` usaba `settings.FRONTEND_URL` directo (NO getattr)
  - Causaba que TODOS los emails via EmailService fallaran en produccion
  - Fix: `getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')`
- [x] **EmailService crash: `tipo_servicio_legacy` campo eliminado**
  - `email_service.py:57-59` buscaba IntegracionExterna por campo legacy ya migrado
  - Fix: Eliminada query fallback al campo inexistente
- [x] **utils.py crash: `settings.FRONTEND_URL` directo**
  - `utils.py:237` mismo problema que email_service
  - Fix: `getattr()` con fallback
- [x] **FRONTEND_URL no existia en settings**
  - Agregado a `base.py`: `FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3010')`
  - Agregado a `production.py`: `FRONTEND_URL = config('FRONTEND_URL', default='https://app.stratekaz.com')`
- [x] **Email from_email double-wrapping**
  - `DEFAULT_FROM_EMAIL` en .env ya tenia formato `"StrateKaz <email>"`
  - EmailService lo envolvia de nuevo: `"StrateKaz <StrateKaz <email>>"`
  - SMTP rechazaba: "Invalid address"
  - Fix: Check `if '<' in from_email_addr` antes de envolver
- [x] Hardcoded year '2024' → dynamic `datetime.date.today().year`

### Commits
- `5abec91` — feat(talent-hub): unified Colaborador + User creation flow
- `46bc9d4` — fix(sentry+th): fix TemaEncuesta NOT NULL + add Crear Acceso button
- `a018b5c` — fix(sentry): fix email service crashes — FRONTEND_URL + tipo_servicio_legacy
- `c561f02` — fix(email): prevent double-wrapping of from_email address

## Sprint 27-RBAC — Sidebar RBAC + F5 Logout + Route Guards + Cargo UX (2026-02-22) COMPLETADO

### Root Cause Analysis
- **Auto-created users get cargo ADMIN**: `authentication.py:227` assigns `cargo=ADMIN` to ALL auto-created users.
  ADMIN cargo has CargoSectionAccess for ALL sections (from `seed_admin_cargo.py`).
  When admin changes user's cargo to restricted permissions, sidebar doesn't update because:
  1. `useUpdateUser` didn't invalidate `['modules', 'sidebar']` queries
  2. User's profile (permission_codes, section_ids) wasn't refreshed
- **F5 logout**: Axios interceptor on refresh failure did `window.location.href = '/login'` + manual localStorage cleanup without cleaning Zustand state. Race condition during rehydration.
- **No RBAC route guards**: `ProtectedRoute` only checked isAuthenticated, `ModuleGuard` only checked is_enabled.
- **Cargo creation forced 2-step**: CargoFormModal showed "Guarda primero" on Tab 5, requiring close + reopen.

### Fix 1: F5 Logout (race condition)
- [x] `authStore.ts`: Added `forceLogout()` — cleans localStorage + Zustand + RQ cache WITHOUT API call
- [x] `authStore.ts`: `logout()` delegates to `forceLogout()` after blacklisting refresh token
- [x] `axios-config.ts`: Refresh catch uses `useAuthStore.getState().forceLogout()`
- [x] `ProtectedRoute.tsx`: Loading spinner when `isLoadingUser && !user` (prevents flash redirect)
- [x] `auth.types.ts`: Added `forceLogout` + `refreshUserProfile` to AuthState

### Fix 2: Sidebar RBAC (invalidation on cargo change)
- [x] `authStore.ts`: Added `refreshUserProfile()` — forces reload ignoring user guard
- [x] `useUsers.ts`: `useUpdateUser` invalidates `['modules', 'sidebar']` + `['modules', 'tree']` on cargo change
- [x] `useUsers.ts`: Calls `refreshUserProfile()` if edited user is logged-in user
- [x] `useCargos.ts`: `useSaveCargoSectionAccess` calls `refreshUserProfile()` if modified cargo matches logged-in user

### Fix 3: Route Guards (SectionGuard)
- [x] **NEW** `SectionGuard.tsx`: Uses `canDo()` from `usePermissions`. Props: `requireSuperadmin`, `moduleCode`+`sectionCode`
- [x] `/admin-global` → `<SectionGuard requireSuperadmin>`
- [x] `/usuarios` → `<SectionGuard moduleCode="core" sectionCode="users_management">`
- [x] AccessDeniedPage (Lock icon + "Volver al Dashboard")

### Fix 4: Cargo Creation UX (create→edit transition)
- [x] `CargoFormModal.tsx`: After create, sets `createdCargo` state → auto-navigates to "Acceso y Permisos" tab
- [x] `isEditing` derived from `cargo || createdCargo` — Tab 5 shows RBAC UI immediately
- [x] `handleSubmit` handles both `cargo.id` and `createdCargo.id` for update path

### Commits
- `cb6b96c` — fix(rbac): fix sidebar permissions + F5 logout + route guards + cargo creation UX

## Sprint 28 — Mi Portal Redesign + Production Auth Stability (2026-02-23) COMPLETADO

### Production Auth Crisis — ProtectedRoute Rewrite (3 iterations)

After deploying Sprint 27, production showed infinite spinner on page load / F5.

**Iteration 1** (`70a6bb3`): Removed `isLoadingUser` spinner from ProtectedRoute
- Root cause: `isLoadingUser` check caused render oscillation — unmounted DashboardLayout (which triggers `loadUserProfile()`), creating infinite loop
- Fix: Removed the loading gate, kept `_hasHydrated` from Zustand persist
- Result: Still broken — `onRehydrateStorage` callback not firing reliably

**Iteration 2** (`6397c62`): Replaced `_hasHydrated` with official Zustand persist API
- Used `persist.hasHydrated()` + `persist.onFinishHydration()` + 1500ms timeout failsafe
- Removed `_hasHydrated` from AuthState interface and store
- Result: Superadmin worked, but **tenant users still kicked to login on F5**

**Iteration 3 — DEFINITIVE** (`e7be82d`): Direct localStorage token check
- Root cause: ALL Zustand persist hydration approaches (custom callback, official API, timeout) are inherently async and race with ProtectedRoute render
- Superadmin survived because `isSuperadmin=true` bypassed tenant check, not because hydration was faster
- **Solution**: Synchronous `hasTokensInStorage()` function checks `access_token` + `refresh_token` directly in localStorage
- Also checks `current_tenant_id` in localStorage for tenant users (fallback when Zustand hasn't hydrated yet)
- Zero dependency on Zustand persist timing — completely synchronous
- Files: `ProtectedRoute.tsx`, `authStore.ts` (cleanup), `auth.types.ts` (cleanup)

### Mi Portal Professional Redesign (3 archivos)

- [x] **MiPortalPage.tsx** — Complete rewrite:
  - Welcome Hero Card: time-based greeting, avatar (xl), cargo/area, formatted date, edit button
  - StatsGrid: employee KPIs (vacaciones, capacitaciones, evaluación, documentos) via `useMemo`
  - Tab variant changed from `pills` to `underline`
  - Tab content wrapped in `motion.div` with Framer Motion key-based transitions
  - `isExterno` flag filters different stat items for external users
  - All hooks called at page level (React Query deduplication)
- [x] **MiPerfilCard.tsx** — Enhanced with branding:
  - `useBrandingConfig()` for dynamic tenant colors (edit button, accents)
  - Reorganized into 3 subsections: laboral, contacto, emergencia
  - New `InfoItem` helper component for consistent info display
  - Emergency contact in styled mini-card (red-50 bg)
  - Avatar upgraded to `size="xl"`
- [x] **MiHSEQ.tsx** — Cleanup from fake data to professional preview:
  - Removed ALL hardcoded fake data (Pendiente, No registrado, 0)
  - 4 feature preview cards (Inducción SST, Exámenes médicos, EPPs, Reportes)
  - Tenant branding colors for icon backgrounds (`${primaryColor}15`)
  - "Próximamente" labels with `opacity-70` for coming-soon state

### Celery Bug Fix

- [x] **send_weekly_reports task**: `Q(role__code='ADMIN')` → `Q(cargo__rol_sistema__code='ADMIN')` + `.distinct()`
  - User model has `cargo` FK, not `role`. Access roles via `cargo__rol_sistema__code`
  - Sentry error: `Cannot resolve keyword 'role' into field`
  - File: `backend/apps/core/tasks.py` line 339

### Commits
- `70a6bb3` — fix(auth): remove isLoadingUser spinner from ProtectedRoute
- `75500d4` — feat(mi-portal): redesign Mi Portal as professional ESS page
- `6397c62` — fix(auth): replace _hasHydrated with official Zustand persist API
- `e7be82d` — fix(auth,celery): fix F5 logout for tenant users + weekly reports role field

## Sprint 29 — Avatar Centralizado + Email Branding + Fix Ctrl+Shift+R + Cleanup Command (2026-02-23) COMPLETADO

### Issue 1 — Management Command: Limpiar usuarios demo
- [x] **NEW** `backend/apps/tenant/management/commands/clear_tenant_users.py`
  - Borra Users del schema tenant (excluye superusers)
  - Borra TenantUserAccess del public schema
  - Borra TenantUsers huérfanos (sin ningún otro acceso a tenants)
  - Flags: `--tenant <schema_name>` (default: 'stratekaz'), `--dry-run`
  - Requiere confirmación explícita `yes` antes de ejecutar
  - Uso: `python manage.py clear_tenant_users --tenant stratekaz [--dry-run]`

### Issue 2 — Email setup_password con colores de marca
- [x] `backend/apps/core/tasks.py`: `send_setup_password_email_task` acepta `primary_color` + `secondary_color` (default: '#3b82f6' / '#1e40af')
- [x] `backend/apps/talent_hub/colaboradores/views.py`: extrae `connection.tenant.primary_color` y lo pasa al task en `_create_user_for_colaborador` y `crear_acceso_sistema`
- [x] `backend/templates/emails/setup_password.html`: Rediseñado con branding dinámico del tenant:
  - Header con gradiente usando colores del tenant
  - Tarjeta de bienvenida con border-left en color primario + badge de cargo
  - Botón CTA con color primario del tenant
  - Tarjeta de advertencia (amber) para expiración del link
  - Footer con nombre del tenant + StrateKaz
  - Inline styles en todo (email clients no soportan clases CSS)

### Issue 3 — Avatar centralizado en Mi Portal
**Un solo modal para todo** — clic en avatar (hero o tab perfil) abre `MiPerfilEditForm` que incluye:
- [x] `frontend/src/features/mi-portal/api/miPortalApi.ts`: `useUploadMiPhoto` hook
  - `authAPI.uploadPhoto(file)` → invalida `miPortalKeys.perfil()` + llama `refreshUserProfile()`
  - `toast.success('Foto actualizada')` on success
  - Backend signal `sync_user_photo_to_colaborador` sincroniza User.photo → Colaborador.foto
- [x] `frontend/src/features/mi-portal/components/MiPerfilEditForm.tsx`: Reescrito completamente
  - Sección de avatar al inicio: avatar xl + Camera overlay en hover + hidden file input
  - Spinner durante upload (`uploadPhotoMutation.isPending`)
  - Link "Cambiar foto" bajo el avatar
  - Formulario de datos personales existente debajo (sin cambios)
  - Título cambiado a "Editar perfil"
- [x] `frontend/src/features/mi-portal/pages/MiPortalPage.tsx`:
  - Hero avatar envuelto en `<button>` con Camera overlay en hover → `setShowEditPerfil(true)`
  - Un solo `showEditPerfil` state controla todo
- [x] `frontend/src/features/mi-portal/components/MiPerfilCard.tsx`:
  - Avatar en tab Perfil también envuelto en `<button>` con Camera overlay → llama `onEdit()`
  - Import `Camera` de lucide-react

### Issue 4 — Fix Ctrl+Shift+R / Hard Reload logout
- [x] `frontend/src/api/axios-config.ts`: Eliminado `window.location.href = '/login'` del catch block del refresh interceptor
  - Root cause: hard redirect bypasseaba React Router, borraba estado y causaba loop
  - Fix: solo `forceLogout()` — limpia localStorage + Zustand + RQ cache
  - ProtectedRoute detecta ausencia de tokens y redirige via React Router (sin page reload)

### Commits
- `08ed83c` — feat(mi-portal,auth,email): centralizar avatar, fix hard-reload logout, email con branding

## Sprint 30-bugfix — RBAC Race Conditions (2026-02-23) COMPLETADO + DEPLOYED

### Bug 3a: TabAccesoSecciones race condition
**Root cause**: `setInitialized(false)` en `handleSave` causaba que el `useEffect` de init se disparara con `cargoAccessData` stale (cache React Query de 30s) ANTES de que el refetch completara → sobreescribía `localAccesses` con datos vacíos → usuario guardaba de nuevo con `replace=true` → backend BORRABA todos los accesos.

**Fix** (`TabAccesoSecciones.tsx`):
- Reemplazado `setInitialized(false)` con `refetchAccess()` explícito
- Sync manual de `localAccesses` con los datos frescos del refetch
- `initialized` permanece `true` → el `useEffect` de init NO se dispara
- Agregado `refetch: refetchAccess` al destructuring de `useCargoSectionAccess`

### Bug 3b: CargoFormModal stale createdCargo entre sesiones
**Root cause**: `CargoFormModal` permanece montado entre aperturas (BaseModal usa `AnimatePresence`, solo desmonta children). Con `[cargo]` como única dep del reset-effect: si `cargo` siempre es `null` entre dos creaciones consecutivas, `createdCargo` conserva el ID anterior → `isEditing=true` → `handleSubmit` hace UPDATE en vez de CREATE.

**Fix** (`CargoFormModal.tsx`):
- Dep `[isOpen, cargo]` en lugar de solo `[cargo]`
- Condición `!cargo && isOpen` para el reset (no solo `!cargo`)

### Commits
- `a9227a0` — fix(rbac): fix TabAccesoSecciones race condition + CargoFormModal stale state

### Deploy VPS
- ✅ `git pull` + frontend rebuild + `systemctl restart` exitoso
- Sprints 29 + 30-bugfix incluidos en mismo deploy

---

## Sprint 31-db-repair — Reparación Masiva DB Producción (2026-02-23) COMPLETADO

### Diagnóstico
`clear_tenant_users` fallaba con múltiples errores en cascada. Causa raíz: `0001_initial.py` fue modificado DESPUÉS de aplicarse en producción para agregar campos a `SoftDeleteModel` y `AuditModel`. Django veía el migration record como "applied" y no re-corría nada. Las columnas nunca se crearon en los schemas existentes.

### Problema 1: Columnas SoftDeleteModel/AuditModel faltantes (117 → 459 tablas)
Campos faltantes en todas las tablas que heredan de `TenantModel`:
- `is_active`, `is_deleted`, `deleted_at`, `deleted_by_id` (de `SoftDeleteModel`)
- `created_by_id`, `updated_by_id` (de `AuditModel`)

**Fix**: `ALTER TABLE schema.tabla ADD COLUMN IF NOT EXISTS ...` en ambos schemas (`tenant_stratekaz`, `tenant_grasasyhuesos`) para las 459 tablas con `updated_at`.

### Problema 2: Columnas con tildes — rename incorrecto
**Error conceptual inicial**: se asumió que TODOS los nombres con tildes debían renombrarse a ASCII. Incorrecto — algunos modelos Django SÍ usan tildes en field names.

**Columnas renombradas correctamente** (Django usa ASCII):
- `riesgos_viales_incidente`: `daños_vehiculo_propio` → `danos_vehiculo_propio`, `costo_estimado_daños` → `costo_estimado_danos`, `daños_terceros` → `danos_terceros`
- `sagrilaft_reporte_operacion_sospechosa_senales_alerta`: `señalalerta_id` → `senalalerta_id`

**Columnas revertidas** (Django SÍ usa tildes — error de rename inicial):
- `hseq_programa_auditoria.año` (fue renombrado a `ano`, luego revertido)
- `analytics_informe_dinamico.tamaño_archivo`
- `analytics_log_exportacion.tamaño_archivo_bytes`
- `documental_tipo_documento.tiempo_retencion_años`
- `emergencias_inspecciones_recursos.señalizacion_adecuada`, `.señalizacion_observaciones`
- `emergencias_recursos.tiene_señalizacion`

### Problema 3: Tablas con tildes en nombre
- `sagrilaft_señal_alerta` → `sagrilaft_senal_alerta`
- `sagrilaft_reporte_operacion_sospechosa_señales_alerta` → `sagrilaft_reporte_operacion_sospechosa_senales_alerta`

### Diagnóstico autoritativo (lección clave)
```python
# Django dice exactamente qué columnas espera — usar ESTO antes de cualquier rename
from django.apps import apps
from django.db import connection
schema = 'tenant_stratekaz'
with connection.cursor() as c:
    c.execute('SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=%s', [schema])
    existing = set((r[0], r[1]) for r in c.fetchall())
    c.execute("SELECT table_name FROM information_schema.tables WHERE table_schema=%s AND table_type='BASE TABLE'", [schema])
    existing_tables = set(r[0] for r in c.fetchall())
for model in apps.get_models():
    table = model._meta.db_table
    if table not in existing_tables: continue
    for field in model._meta.local_fields:
        if hasattr(field, 'column') and field.column and (table, field.column) not in existing:
            print(f'MISSING: {table}.{field.column}')
```

### Resultado final
- ✅ Cero columnas faltantes en ambos schemas
- ✅ `clear_tenant_users --tenant tenant_stratekaz` ejecutado exitosamente
- ✅ 1 User + 1 TenantUserAccess + 1 TenantUser huérfano eliminados del demo

### Schema names (recordatorio — actualizado 2026-03-12)
1. `tenant_grasas_y_huesos_del_` — Cliente real (Grasas y Huesos)
2. `tenant_grupo_empresarial_ol` — Cliente (Grupo Empresarial)
3. `tenant_radio_taxi_cone_ltda` — Cliente (Radio Taxi)
4. `tenant_stratekaz` — Demo
5. `tenant_vidales_food_s_a_s` — Cliente (Vidales Food)
- Ver con: `python manage.py shell -c "from apps.tenant.models import Tenant; [print(t.schema_name, t.name) for t in Tenant.objects.all()]"`

---

## Sprint 32 — Cross-Tenant Security + Email Branding + Portal Proveedor (2026-02-24) COMPLETADO

### Bugs corregidos
- [x] **Bug 1 (CRÍTICO)**: Cross-tenant security bypass en `HybridJWTAuthentication`
  - `_assert_tenant_access()` solo se llamaba al crear User nuevo, NO al encontrar User existente
  - Fix: se llama en AMBAS ramas (User existe Y User no existe) → cierra bypass multi-tenant
  - Archivo: `backend/apps/tenant/authentication.py`
- [x] **Bug 2**: Nombre "Usuario" — User con first/last_name vacíos no sincronizaba desde TenantUser
  - Fix: nuevo método `_sync_name_if_empty()` — sincroniza en CADA login si User tiene nombres vacíos
  - Archivo: `backend/apps/tenant/authentication.py`
- [x] **Bug 3 (Deploy)**: Conflicto migration leaf nodes en core
  - Causa: producción tenía `0010_user_password_setup_expires_and_more` (password fields); local creó `0010_add_proveedor_fk_to_user` con password fields + proveedor → dos leaf nodes
  - Fix: crear `0010_user_password_setup_expires_and_more.py` local (= producción, solo password fields) + nuevo `0011_add_proveedor_fk_to_user.py` (solo proveedor FK). En VPS: `rm 0010_user_password_setup_expires_and_more.py` (untracked) antes de `git pull`
- [x] **Bug 4 (Build)**: `"api" is not exported by "src/api/axios-config.ts"` en Vite/Rollup
  - Causa: `import { api }` no existe — axios-config solo tiene `export default axiosInstance`
  - Fix: `import apiClient from '@/api/axios-config'`
  - Archivo: `frontend/src/features/proveedor-portal/api/miEmpresa.api.ts`

### Email branding (Bloque 2)
- [x] `backend/templates/emails/welcome_user.html`: header gradient con `primary_color`/`secondary_color` del tenant (inline styles para email clients)
- [x] `backend/templates/emails/base_email.html`: año 2024 → 2026
- [x] `backend/apps/core/tasks.py` + `user_lifecycle_signals.py`: pasar `primary_color`, `secondary_color`, `current_year` como params a la task Celery

### Portal Proveedor (Bloque 4)
- [x] `User.proveedor` FK → `gestion_proveedores.Proveedor` (null/blank, SET_NULL) — migration `0011_add_proveedor_fk_to_user`
- [x] `UserDetailSerializer`: campos `proveedor` (id) + `proveedor_nombre` (read-only via SerializerMethodField)
- [x] `UserUpdateSerializer`: `proveedor_id` editable (superadmin puede asignarlo desde Users del tenant)
- [x] `ProveedorViewSet`: 3 nuevos `@action` (detail=False, IsAuthenticated):
  - `GET .../mi-empresa/` → datos del Proveedor vinculado
  - `GET .../mi-empresa/contratos/` → `CondicionComercialProveedor` list
  - `GET .../mi-empresa/evaluaciones/` → `EvaluacionProveedor` list
- [x] Frontend módulo `features/proveedor-portal/`: `types.ts` + `api/miEmpresa.api.ts` + `hooks/useMiEmpresa.ts` + `pages/ProveedorPortalPage.tsx` + `index.ts`
- [x] `UserMenu.tsx`: ítem "Mi Empresa" (Building2) visible solo si `user?.proveedor` truthy → navega a `/proveedor-portal`
- [x] `MiPortalPage.tsx`: redirect a `/proveedor-portal` si user tiene proveedor sin Colaborador
- [x] Ruta `/proveedor-portal` lazy-loaded + guard (`!user.proveedor` → `/dashboard`)
- [x] `auth.types.ts`: `proveedor?: number | null`, `proveedor_nombre?: string | null`

### Flujo del consultor externo (implementado)
```
Admin Global crea TenantUser → primer login auto-crea User (nombre sincronizado)
→ Superadmin del tenant edita User → asigna campo "Proveedor vinculado"  (PASO MANUAL)
→ Consultor ve UserMenu "Mi Empresa" → /proveedor-portal (tabs Empresa/Contratos/Evaluaciones)
```

### Pendiente (Bloque 3 — aplazado)
- [ ] Admin Global UI: selección de cargo externo + proveedor al crear TenantUser
- [ ] `TenantUserAccess.cargo_code` + `proveedor_documento` para auto-asignar en primer login

---

## Sprint 33 — Portal Proveedor Bloque 3 (2026-02-24) COMPLETADO ✅ DEPLOYED

### Bloque A: Crear Acceso desde Proveedores
Patrón "Entity-First, Access-Second" (idéntico a Colaboradores en Talent Hub) aplicado a Proveedores.
Admin del tenant puede crear usuario del sistema directamente desde Supply Chain > Proveedores.

**Backend:**
- [x] `ProveedorViewSet._create_user_for_proveedor()`: helper que crea User con `proveedor` FK, `_from_contratacion=True`, setup token 72h, y dispara `send_setup_password_email_task`
- [x] `ProveedorViewSet.crear_acceso`: `@action(detail=True, POST)` en `/api/supply-chain/proveedores/{id}/crear-acceso/` — valida que no tenga usuario activo, email/username no duplicados
- [x] `CrearAccesoProveedorSerializer`: email + username + cargo_id (IntegerField + validate_cargo_id manual para evitar circular imports)
- [x] `ProveedorListSerializer`: campos `usuarios_vinculados_count` (annotated Count) + `tiene_acceso` (SerializerMethodField)
- [x] `get_queryset()` con `prefetch_related('usuarios_vinculados')` + `.annotate(usuarios_vinculados_count=Count(...))`

**Frontend:**
- [x] `proveedoresApi.proveedor.crearAcceso()` — API method
- [x] `useCrearAccesoProveedor` hook — mutation con invalidación de queries
- [x] `CrearAccesoProveedorModal.tsx` — modal con email (pre-filled), username (auto-suggest), cargo dropdown (useCargos)
- [x] `ProveedoresTable.tsx` — Shield button (proveedor activo sin acceso), UserCheck indicator (ya tiene acceso)
- [x] `proveedor.types.ts` — campos `usuarios_vinculados_count`, `tiene_acceso`

### Bloque B: Portal Mejorado — Tab Mi Cuenta
- [x] `ProveedorPortalPage.tsx`: 4ta pestaña "Mi Cuenta" (Settings icon) con:
  - Info usuario (username, email, cargo)
  - Cambio de contraseña (reusa `ChangePasswordModal` de /perfil)
  - 2FA (reusa `TwoFactorModal` + `Disable2FAModal` + `use2FA` de /perfil)

### Hotfix durante deploy
- [x] `CrearAccesoProveedorSerializer`: DRF `PrimaryKeyRelatedField(queryset=None)` falla con `AssertionError` en producción. Fix: reemplazar con `IntegerField` + `validate_cargo_id()` manual con `apps.get_model('core', 'Cargo')`
- [x] `ProveedorViewSet.crear_acceso`: fetch Cargo object explícitamente con `Cargo.objects.get(id=cargo_id)` ya que el serializer ahora devuelve int (no objeto)

### Archivos modificados
- `backend/apps/supply_chain/gestion_proveedores/viewsets.py` (+135 líneas)
- `backend/apps/supply_chain/gestion_proveedores/serializers.py` (+45 líneas)
- `frontend/src/features/supply-chain/components/CrearAccesoProveedorModal.tsx` (NEW, 179 líneas)
- `frontend/src/features/supply-chain/components/ProveedoresTable.tsx` (+20 líneas)
- `frontend/src/features/supply-chain/hooks/useProveedores.ts` (+25 líneas)
- `frontend/src/features/supply-chain/api/proveedores.api.ts` (+7 líneas)
- `frontend/src/features/supply-chain/types/proveedor.types.ts` (+2 líneas)
- `frontend/src/features/proveedor-portal/pages/ProveedorPortalPage.tsx` (+100 líneas)

---

## Sprint 34 — Supply Chain Barrido Funcional (2026-02-24)

**Problema:** El usuario reporta 404 en `app.stratekaz.com/supply-chain/materia-prima`. Supply Chain era no-funcional excepto por el CRUD de proveedores.

**Causa raíz — 5 problemas interconectados:**
1. Sidebar seeds con rutas incorrectas (`/proveedores` en vez de `/supply-chain`, tabs `materia-prima`/`productos-servicios` en vez de `proveedores`/`catalogos`)
2. 3 sub-apps backend (almacenamiento, compras, programacion_abastecimiento) tenían viewsets+URLs completos pero NO estaban registradas en `config/urls.py`
3. 3 archivos API frontend usaban `import axios from 'axios'` (sin auth JWT) y prefijo `/api/v1/` inexistente
4. GestionProveedoresPage era 100% placeholder aunque ProveedoresTable ya existía como componente funcional
5. SupplyChainPage no era route-aware (siempre mostraba tab 'proveedores' sin importar la URL)

**Cambios:**
- `seed_estructura_final.py`: Fix module route `/proveedores` → `/supply-chain`, tab routes `materia-prima` → `proveedores`, `productos-servicios` → `catalogos`
- `backend/apps/supply_chain/urls.py` (NUEVO): Router modular que agrega gestion_proveedores + almacenamiento + compras + programacion_abastecimiento
- `config/urls.py`: Cambió include de `gestion_proveedores.urls` a `supply_chain.urls`
- `almacenamientoApi.ts`, `comprasApi.ts`, `programacionApi.ts`: Fix `axios` → `apiClient`, `/api/v1/` → `/api/`
- `GestionProveedoresPage.tsx`: Reemplazó ProveedoresTab placeholder con ProveedoresTable real
- `SupplyChainPage.tsx`: Ahora route-aware con useLocation/useNavigate, eliminó tabs redundantes

**Archivos modificados:** 8 (1 nuevo)
**Migraciones:** Ninguna (solo viewsets/URLs/seeds/frontend)
**Post-deploy:** Ejecutar `python manage.py seed_estructura_final` en tenant para actualizar sidebar

---

## Sprint 34-hotfix — Wire ProveedorForm + Fake Migrations (2026-02-24) PUSHED
- [x] Wire ProveedorForm modal into GestionProveedoresPage (create/edit buttons)
- [x] Fake migrations dev Docker for core 0010→0011 (sync with production state)

---

## Sprint 35 — Double /api/ Fix + Impersonación Real (2026-02-24) DEPLOYED
- [x] Fix doble `/api/` en 32 archivos frontend BASE_URL
- [x] Impersonación real de usuarios (backend `impersonate-profile` endpoint + frontend profile override + dual banner + selección modal)
- [x] F5 survival: `impersonated_user_id` persisted, `loadUserProfile()` detects and reloads
- Sprint 35-hotfix: Fix Zustand persist migration v5 → spinner infinito (no forzar re-login, solo agregar defaults)

---

## Sprint M0 — Infraestructura de Modularización (2026-02-25) DEPLOYED
**Objetivo:** Crear infraestructura para trabajo paralelo en múltiples módulos.

### Routes split
- [x] `frontend/src/routes/modules/*.routes.tsx` — 15 archivos nuevos (1 por módulo)
- [x] `frontend/src/routes/index.tsx` — Reducido de 847 líneas a ~50 (solo importa sub-routers)

### Legacy cleanup
- [x] Eliminado `backend/config/settings.py` (legacy deprecated MySQL)
- [x] Eliminado `backend/apps/logistics_fleet/despachos/` (app vacía)
- [x] Eliminado `backend/apps/logistics_fleet/pesv_operativo/` (app vacía)
- [x] Removidos de INSTALLED_APPS y TENANT_APPS en `settings/base.py`

### Module services templates
- [x] Creados `services.py` vacíos en 13 módulos top-level (contrato público futuro)

### Absorber sistema-gestion
- [x] `frontend/src/features/sistema-gestion/` absorbido en gestion-estrategica
- [x] Rutas de sistema-gestion redirigen a gestion-estrategica

### Validación
- ✅ `npm run build` exitoso
- ✅ `python manage.py check` — 0 issues

---

## Sprint M1 — Desacoplar ForeignKeys Cruzados C2 (2026-02-25) PUSHED
**Objetivo:** Eliminar 16 ForeignKeys cruzados entre módulos de Capa 2 para independencia total.

### Patrón aplicado
```python
# ANTES (acoplado):
class AccidenteTrabajo(TenantModel):
    trabajador = ForeignKey('colaboradores.Colaborador')

# DESPUÉS (desacoplado):
class AccidenteTrabajo(TenantModel):
    trabajador_id = PositiveBigIntegerField(null=True, db_index=True)
    trabajador_nombre = CharField(max_length=200, blank=True)  # Cache
```

### FKs desacoplados (16 total)
| Source Module | Target Module | Models Affected | FKs |
|---------------|---------------|-----------------|-----|
| HSEQ (medicina_laboral) | Talent Hub (colaboradores) | ExamenMedico, RestriccionMedica, CasoVigilancia | 3 |
| Admin Finance (tesoreria) | Supply Chain + Sales CRM + TH | CuentaPorPagar, CuentaPorCobrar | 5 |
| Admin Finance (servicios_generales) | Supply Chain | ContratoServicio, MantenimientoLocativo | 2 |
| Analytics (indicadores_area) | Talent Hub | AccionPorKPI | 1 |
| Production Ops (recepcion) | Supply Chain | Recepcion, DetalleRecepcion | 3 |
| Talent Hub (colaboradores) | Supply Chain | Colaborador.proveedor_origen | 1 |
| Gestión Estratégica (contexto) | Talent Hub | ParteInteresada | 1 |

### Técnica: SeparateDatabaseAndState
Migraciones usan `SeparateDatabaseAndState` para preservar datos en producción:
- **State operations**: RemoveField(FK) + AddField(IntegerField) — Django cree que se reemplazó
- **Database operations**: Solo DROP FK CONSTRAINT — la columna y datos permanecen intactos
- PL/pgSQL dinámico busca constraint name via `pg_constraint` + `current_schema()` (multi-tenant safe)

### Archivos modificados (24)
- 7 models.py (reemplazar FK → PBIF + CharField cache)
- 6 serializers.py (actualizar fields, source, SerializerMethodField con apps.get_model)
- 4 admin.py (actualizar list_display, search_fields, fieldsets, remove raw_id_fields/select_related)
- 7 migrations (SeparateDatabaseAndState data-safe)

### Validación
- ✅ `python manage.py check` — 0 issues
- ✅ `makemigrations --check` — No changes detected
- ✅ `npm run build` — exitoso

---

## Sprint M2 — Eliminar Imports Cruzados C2 en Frontend (2026-02-25) PUSHED
**Objetivo:** Eliminar TODOS los imports cruzados entre features de Capa 2 en el frontend para independencia total de módulos.

### Backend: endpoints select-lists nuevos
- [x] `select_cargos`: GET `/api/core/select-lists/cargos/` — `{id, label, extra: {code, rol, rol_code}}`
- [x] `select_roles`: GET `/api/core/select-lists/roles/` — `{id, label, extra: {code}}`
- Ahora hay 7 select-list endpoints totales (areas, cargos, colaboradores, users, proveedores, clientes, roles)

### Frontend: infraestructura compartida
- [x] `src/api/select-lists.api.ts` — API client con 7 métodos
- [x] `src/hooks/useSelectLists.ts` — 7 hooks (useSelectAreas, useSelectCargos, useSelectColaboradores, useSelectUsers, useSelectProveedores, useSelectClientes, useSelectRoles)
- [x] `src/hooks/useChangePassword.ts` — extraído de features/users
- [x] `src/hooks/useUploadPhoto.ts` — extraído de features/perfil
- [x] `src/hooks/use2FA.ts` — extraído de features/perfil
- [x] `src/api/twoFactor.api.ts` — extraído de features/perfil
- [x] `src/types/twoFactor.types.ts` — extraído de features/perfil
- [x] `src/components/common/auth/` — ChangePasswordModal, Disable2FAModal, TwoFactorModal
- [x] `src/components/common/AvatarUploadModal.tsx`
- [x] Archivos originales en perfil convertidos a re-exports `@deprecated`

### Imports cruzados eliminados (~45 → 0)
| Feature | Archivos modificados | Hooks reemplazados |
|---------|---------------------|--------------------|
| gestion-estrategica | 8 modals + 1 section | useCargos→useSelectCargos, useColaboradores→useSelectColaboradores, useUsers→useSelectUsers |
| talent-hub | 5 components | useCargos→useSelectCargos, useAreas→useSelectAreas, useUsers→useSelectUsers |
| audit-system | NotificacionesPage | useCargos+useUsers+useAreas→useSelect* |
| supply-chain | CrearAccesoProveedorModal | useCargos→useSelectCargos |
| users | UsersPage | useRoles→useSelectRoles |
| proveedor-portal | ProveedorPortalPage | imports perfil→common/auth |
| mi-portal | MiPortalPage | AvatarUploadModal→common/ |

### Data access migration
- Respuesta paginada `data?.results?.map(...)` → array plano `data?.map(...)`
- Propiedades modelo `.name` → `.label`, `.first_name`/`.last_name` → `.label`
- Query keys centralizados: `['select-lists', 'entity']` (antes: `['cargos']`, `['cargos-rbac']`, etc.)

### Dependencias C1 documentadas (aceptables)
1. configuracion → gestion-estrategica (useModulesTree, types)
2. talent-hub → gestion-estrategica (OrganigramaView, useTabSections)
3. talent-hub → configuracion (CargosTab, CargoFormModal)
4. KPIGaugeAdvanced: analytics → gestion-estrategica (C3→C2, componente de visualización)

### Resultado
- **0 imports C2↔C2** (antes: 45 imports en 22 archivos)
- ✅ `npm run build` exitoso
- ✅ lint-staged (Prettier + ESLint) — 0 warnings
- 41 files changed, 1593 insertions, 1355 deletions

### Commits
- `2b8bfdf` — refactor: Sprint M1 — desacoplar 16 ForeignKeys cruzados entre módulos C2

---

## Sprint P0 \u2014 Separar gestion_estrategica en 3 m\u00f3dulos + Sidebar por capas (2026-02-25) COMPLETADO

### Objetivo
Separar el mega-m\u00f3dulo `gestion_estrategica` (8 tabs mezclando C1+C2+C3) en 3 m\u00f3dulos independientes alineados con la arquitectura de 5 capas. Implementar sidebar visual agrupado por capas.

### Backend: Seed + Migraci\u00f3n
- [x] `seed_estructura_final.py`: M\u00e9todo `_migrate_gestion_estrategica()` que UPDATE `ModuleTab.module` FK (preserva IDs \u2192 CargoSectionAccess intacto)
- [x] 3 nuevos SystemModule: `fundacion` (C1, blue, orden=10), `planeacion_estrategica` (C2, blue, orden=11), `revision_direccion` (C3, purple, orden=62)
- [x] `audit_system` renombrado a "Centro de Control" (orden=63)
- [x] `gestion_estrategica` eliminado autom\u00e1ticamente tras migrar todos sus tabs

### Backend: Sidebar por capas
- [x] `viewsets_config.py`: Constante `SIDEBAR_LAYERS` con 3 capas (C1 Fundaci\u00f3n, C2 M\u00f3dulos de Negocio, C3 Inteligencia)
- [x] `_build_sidebar_response()` refactorizado: agrupa m\u00f3dulos en capas con `is_category: True` + colores hex por capa
- [x] M\u00f3dulos hu\u00e9rfanos (sin capa) van al final como fallback

### Backend: Middleware + RBAC
- [x] `module_access.py`: `URL_TO_MODULE_CODE` actualizado (fundacion, planeacion_estrategica, revision_direccion)
- [x] `seed_permisos_rbac.py`: Permisos separados en 3 bloques (fundacion=13 secciones, planeacion_estrategica=6, revision_direccion=3)

### Frontend: Rutas separadas
- [x] `fundacion.routes.tsx` (3 rutas con ModuleGuard 'fundacion')
- [x] `planeacion-estrategica.routes.tsx` (4 rutas con ModuleGuard 'planeacion_estrategica')
- [x] `revision-direccion.routes.tsx` (1 ruta con ModuleGuard 'revision_direccion')
- [x] `gestion-estrategica.routes.tsx` convertido a SOLO redirects (8 rutas antiguas \u2192 nuevas)

### Frontend: Barrel re-export useModules
- [x] `@/hooks/useModules.ts` creado como barrel file (re-exporta 11 hooks + 8 tipos)
- [x] 15 archivos actualizados para importar desde `@/hooks/useModules` en vez de `@/features/gestion-estrategica/`
- [x] 0 cross-imports directos de hooks/tipos de gestion-estrategica desde shared/core

### Auditor\u00eda de modularizaci\u00f3n
- \u2705 0 imports C2\u2194C2 en frontend features
- \u2705 0 FK cruzados C2\u2194C2 en backend models
- \u2705 Todos los dropdowns cross-module usan `useSelect*`
- \u2705 API clients usan `apiClient` (no axios directo)
- \u2705 `npm run build` exitoso (2 verificaciones)

### Archivos modificados: 25 (5 nuevos)
| Tipo | Archivos |
|------|----------|
| Backend seed/config | seed_estructura_final.py, viewsets_config.py, module_access.py, seed_permisos_rbac.py |
| Frontend rutas | fundacion.routes.tsx (NEW), planeacion-estrategica.routes.tsx (NEW), revision-direccion.routes.tsx (NEW), gestion-estrategica.routes.tsx, routes/index.tsx |
| Frontend barrel | hooks/useModules.ts (NEW) |
| Frontend imports fix | 15 archivos (Sidebar, ModuleGuard, Dashboard, PageHeader, PageTabs, etc.) |

### Commits
- `6d70b13` \u2014 refactor: Sprint P0 \u2014 separar gestion_estrategica en 3 m\u00f3dulos + sidebar por capas

### Post-deploy requerido
```bash
python manage.py seed_estructura_final   # Migra tabs + crea 3 m\u00f3dulos
python manage.py seed_permisos_rbac      # Actualiza permisos separados
```

---

## Auditoría Talent Hub — Aislamiento Modular (2026-02-26) COMPLETADO

### Objetivo
Auditoría completa del módulo Talent Hub (11 sub-módulos, 152 archivos FE, ~50 modelos BE). Verificar conexión con motor de notificaciones, corregir violaciones de aislamiento modular C2↔C2, y limpiar dead code.

### Hallazgos principales
- NotificadorTH ya existía completo (18 métodos, 19 tipos TH_*)
- 8 signals.py conectados y registrados en apps.py ready()
- 2 Celery tasks operativas (contratos 7:30 AM, períodos prueba 7:45 AM)

### Fixes aplicados
- [x] `notificador_th.py`: Eliminar `empresa=colaborador.empresa` de 5 User queries (viola tenant isolation)
- [x] `notificador_th.py`: Extraer helper `_get_jefe_usuario()` (DRY, 1 query centralizada sin empresa)
- [x] `notificador_th.py`: Fix `getattr(colaborador, 'user')` → `'usuario'` (campo correcto)
- [x] `notificador_th.py`: Fix `notificar_contrato_por_vencer()` — ahora notifica jefe también
- [x] `contrato_documento_service.py`: Eliminar import C2→C2 de `gestion_documental.services.DocumentoService`
- [x] `contrato_documento_service.py`: Crear `_generar_codigo_documento()` local con `apps.get_model()`
- [x] `colaboradores/signals.py`: `EmpresaConfig.objects.first()` → `get_tenant_empresa()` (C0 helper)
- [x] `colaboradores/views.py`: `from apps.gestion_estrategica.organizacion.models import Area` → `apps.get_model('organizacion', 'Area')`
- [x] `colaboradores/import_serializer.py`: Mismo fix para Area
- [x] `seed_th_enhancements.py`: EmpresaConfig → `apps.get_model('configuracion', 'EmpresaConfig')`
- [x] `seed_plantillas_psicometricas.py`: Mismo fix EmpresaConfig
- [x] `off_boarding/apps.py`: Eliminar import de signals.py inexistente (dead code)
- [x] `nomina/apps.py`: Eliminar ready() con signals comentado (dead code)

### Resultado
- 0 imports `from apps.gestion_estrategica` en talent_hub ✅
- 0 filtrado por empresa en User queries ✅
- 0 dead code en apps.py ✅

### Commit
- `507be06` — fix(talent-hub): corregir aislamiento modular y conexión con motor de notificaciones

---

## Sprint fundacion-1 — Integraciones + Políticas Enriquecidas (2026-02-27) COMPLETADO

### Objetivo
Completar la sección de Integraciones (proveedores con tipo_servicio FK) y enriquecer Políticas con badges, firmas y alertas.

### Cambios
- [x] Integraciones: 59 providers con tipo_servicio FK, modules.ts actualizado
- [x] Políticas: badges, firmas digitales, alertas de vencimiento

### Commit
- Desplegado en producción

---

## Sprint Consecutivos Transversal (2026-02-27) COMPLETADO

### Objetivo
Implementar auto-generación global de códigos (`codigo`) en todos los modelos que lo requieren, eliminando la entrada manual obligatoria en modales.

### Infraestructura
- [x] `backend/utils/consecutivos.py` (NUEVO): Helper `auto_generate_codigo(instance, consecutivo_codigo)` — busca ConsecutivoConfig, genera siguiente consecutivo thread-safe, fallback a PREFIX-TIMESTAMP
- [x] `seed_consecutivos_sistema.py`: 20 nuevos CONSECUTIVOS_ADICIONALES (42 total)

### Backend Models (12 archivos, ~20 modelos)
Patrón aplicado: `save()` override con `auto_generate_codigo(self, 'CODE')` + `blank=True` en campo codigo

| Módulo | Modelos |
|--------|---------|
| Talent Hub | CicloEvaluacion, PlanMejora, Capacitacion, PlanFormacion, Turno, ConceptoNomina, ModuloInduccion |
| HSEQ | ProgramaAuditoria, Auditoria, Hallazgo, EvaluacionCumplimiento, ControlExposicion, TipoAgente |
| Analytics | CatalogoKPI, VistaDashboard, PlantillaInforme |
| Admin Finance | CentroCosto |
| Audit System | TipoAlerta (code: TIPO_NOTIFICACION) |
| Gest. Documental | TipoDocumento, PlantillaDocumento |

### Backend Serializers (12 archivos, ~28 serializers)
- `extra_kwargs = {'codigo': {'required': False, 'allow_blank': True}}`
- HSEQ mejora_continua SKIPPED (ya tenía codigo en read_only_fields)

### Frontend Modals (18 archivos)
- Removed `required` validation from codigo input
- Added `placeholder="Se genera automáticamente"`

### Fix unique constraints multi-tenant (7 modelos)
- `unique=True` global → `unique_together = [['empresa_id', 'codigo']]`
- Modelos: Auditoria, ProgramaAuditoria, Hallazgo, EvaluacionCumplimiento, VistaDashboard, PlantillaInforme, CentroCosto (+ Rubro, PresupuestoPorArea, Ejecucion)

### Migraciones
- 13 archivos de migración creados y aplicados (public + 2 tenant schemas)

### Commit
- `55c37f0` — feat(consecutivos): auto-generación global de códigos en 20 modelos + 18 modales

---

## Fix Cargar Sistema — Centralizar Consecutivos (2026-02-27) COMPLETADO

### Objetivo
Centralizar CONSECUTIVOS_ADICIONALES y actualizar el botón "Cargar Sistema" para cargar los 42 consecutivos completos.

### Cambios
- [x] Movido `CONSECUTIVOS_ADICIONALES` del seed command a `models_consecutivos.py`
- [x] Creado `TODOS_CONSECUTIVOS_SISTEMA` = `CONSECUTIVOS_SISTEMA` + `CONSECUTIVOS_ADICIONALES` (42 entries)
- [x] `viewsets_consecutivos.py`: `cargar_sistema` ahora usa `TODOS_CONSECUTIVOS_SISTEMA` (antes solo 11 base)
- [x] `seed_consecutivos_sistema.py`: importa desde `models_consecutivos.py` (single source of truth)
- [x] `models.py`: re-export actualizado con `TODOS_CONSECUTIVOS_SISTEMA`

### Commit
- `5a89b6b` — fix(consecutivos): centralizar datos y cargar todos los consecutivos desde UI

---

## Sprint talent-hub-1 — Portal Público Vacantes + Branding + Fixes API (2026-02-27) COMPLETADO

### Objetivo
Completar el portal público de vacantes con branding dinámico por tenant, botón publicar/despublicar en tabla interna, y corregir errores de API en Talent Hub.

### Branding dinámico páginas públicas (3 páginas)
- [x] VacantesPublicasPage: logo + nombre empresa + eslogan + primaryColor en botones/filtros/badges
- [x] PostulacionPage: misma estructura + VacanteInfoCard con primaryColor prop
- [x] FirmarContratoPage: accent bar + nombre siempre visible + primaryColor en submit/links
- [x] `hexToRgba()` utility para transparencias dinámicas
- [x] `useBrandingPublicoHelpers()` hook centralizado (empresaNombre, empresaSlogan, logoUrl, primaryColor, secondaryColor)

### Publicar vacantes desde tabla interna
- [x] Botón Globe toggle en renderActions (publicar/despublicar portal público)
- [x] Hook `usePublicarVacanteActiva()` ya existía — solo faltaba UI
- [x] Link "Portal público" en SectionHeader (abre /vacantes en nueva pestaña)

### Fix 4 errores API
- [x] **404 /estadisticas/resumen/**: FE llamaba `/resumen/` pero BE solo registra `/estadisticas/` (list). Corregido en 5 archivos (selección, onboarding, formación, desempeño)
- [x] **404 /historial-contratos/por-vencer/**: DRF genera `por_vencer/` (underscore). Fix: `url_path='por-vencer'`
- [x] **500 /core/select-lists/areas/**: Query filtraba `is_active=True` pero Area no tiene ese campo (SoftDeleteModel). Fix: remover filtro
- [x] **400 /vacantes-activas/12/**: FK `responsable_proceso: 0` enviado al backend. Fix: limpiar FKs con valor 0 antes de PATCH

### Commits
- `f4acd99` — feat(talent-hub): add publish toggle button and public portal link in VacantesTab
- `8455bd0` — fix(talent-hub): pass primaryColor prop to VacanteInfoCard in PostulacionPage
- `42b3604` — fix(talent-hub): fix 404/500 API errors in selección and select-lists
- `74ffa16` — fix(talent-hub): clean FK fields with value 0 before PATCH in VacanteFormModal

---

## Sprint hseq-2 — Accidentalidad + Seguridad Industrial (2026-02-28) COMPLETADO
- [x] 8 modales CRUD nuevos: AccidenteTrabajo, EnfermedadLaboral, IncidenteTrabajo, InvestigacionATEL, Inspección, PermisoTrabajo, EntregaEPP, ProgramaSeguridad
- [x] AccidentalidadPage reescrita con KPIs + tabla + create/edit/delete (4 tabs)
- [x] SeguridadIndustrialPage reescrita con KPIs + tabla + create/edit/delete (4 tabs)
- [x] Hooks: useAccidentalidad (mutations), useSeguridadIndustrial (mutations)

## Sprint hseq-3 — Comités + Ambiental + Planificación (2026-02-28) COMPLETADO
- [x] 10 modales CRUD: TipoComite, Comite, MiembroComite, ActaReunion, Votacion, RegistroResiduo, Vertimiento, Emision, ConsumoRecurso, CertificadoAmbiental
- [x] 2 modales Planificación: ObjetivoSistemaFormModal, ActividadPlanFormModal
- [x] GestionComitesPage reescrita con CRUD completo (5 tabs)
- [x] GestionAmbientalPage reescrita con create + delete (6 tabs)
- [x] PlanificacionSistemaPage con modales reales
- [x] Hooks: useComites, useGestionAmbiental (15 mutations), usePlanificacion
- [x] 60 ESLint warnings corregidos a 0 (no-explicit-any, unused vars)
- Commit: `74c3690`

## Sprint sistema-gestion-hseq-1 — Consolidación (2026-02-28) COMPLETADO
- [x] AccionesMejoraPage conectada a modales CRUD reales (NoConformidadFormModal + AccionCorrectivaFormModal)
- [x] Eliminado código muerto (4 hook refs, toast placeholders, import `toast`)
- [x] Plan 7 pasos: 6 ya implementados previamente, 1 completado en este sprint
- Commit: `0534217`

---

## Sprint multi-4-paralelos — Supply Chain + Production Ops + Workflows + Sales CRM (2026-02-28) COMPLETADO

### Supply Chain (supply-chain-1)
- [x] ProveedorForm reescrito 100% design system (0 HTML crudo, 465→735 líneas)
- [x] ImportProveedoresModal: importación masiva Excel 3 pasos (upload→proceso→resultados)
- [x] RequisicionFormModal, MovimientoInventarioFormModal, ProgramacionFormModal
- [x] ComprasTab reescrita con KpiCardGrid (4 KPIs) + SectionToolbar + CRUD
- [x] AlmacenamientoTab reescrita con inventarios + movimientos + alertas
- [x] ProgramacionTab reescrita con CRUD completo
- [x] GestionProveedoresPage: botón Importar + KPIs en tab proveedores
- [x] Backend: import_proveedores_utils.py + import_proveedores_serializer.py
- [x] Backend: viewset actions plantilla-importacion + importar en ProveedorViewSet

### Production Ops (production-ops-1)
- [x] 5 modales CRUD: RecepcionFormModal, OrdenProduccionFormModal, OrdenTrabajoFormModal, LiberacionFormModal, ActivoFormModal
- [x] RecepcionTab reescrita con KPIs (4) + tabla profesional + temperatura
- [x] ProcesamientoTab reescrita con KPIs + Progress bar + badges prioridad
- [x] MantenimientoTab reescrita con sub-tabs (Activos + Órdenes Trabajo)
- [x] ProductoTerminadoTab reescrita con sub-tabs (Stock + Liberaciones)
- [x] 6 delete mutations agregadas a useProductionOps.ts
- [x] index.ts barrel exports para componentes

### Workflows (workflows-1)
- [x] 4 modales CRUD: PlantillaFormModal, IniciarFlujoModal, TareaFormModal, CategoriaFormModal
- [x] DisenadorFlujosPage con KPIs + create/edit plantillas + categorías
- [x] EjecucionPage: Bandeja de Trabajo + Instancias con tablas profesionales
- [x] MonitoreoPage: Métricas por plantilla + Alertas SLA con tablas de datos

### Sales CRM (sales-crm-1)
- [x] 5 modales CRUD: ClienteFormModal, OportunidadFormModal, PQRSFormModal, CotizacionFormModal, ImportClientesModal
- [x] ClientesPage reescrita con KPIs + import masivo + CRUD
- [x] PipelinePage reescrita con KPIs + badges etapa + tabla profesional
- [x] PQRSPage reescrita con KPIs + tabla con prioridad/estado
- [x] CotizacionesPage reescrita con KPIs + tabla + montos formateados
- [x] Backend: import_clientes_utils.py + import_clientes_serializer.py
- [x] Backend: viewset actions plantilla-importacion + importar en ClienteViewSet
- [x] 3 delete mutations agregadas (useOportunidades, useCotizaciones, usePQRS)

### Totales del sprint
- 48 archivos modificados/creados
- +12,175 líneas nuevas, -3,651 eliminadas (net +8,524)
- 19 modales CRUD nuevos
- 15 pages/tabs reescritas con KPIs + design system
- 4 archivos backend (import utils + serializers)
- 2 viewsets extendidos con import masivo
- 0 errores TypeScript, 0 warnings ESLint (126 corregidos)
- Commit: `1e3fb68`

---

## Sprint logistics-fleet-1 + admin-finance-1 + accounting-1 (2026-03-01) COMPLETADO
**3 módulos C2 en paralelo** — Frontend CRUD completo para los últimos 3 módulos pendientes.

### Logistics & Fleet (logistics-fleet-1)
- [x] 7 modales CRUD: FlotaFormModal, VehiculoFormModal, ConductorFormModal, TransporteFormModal, RutaFormModal, DespachoFormModal, IncidenteVialFormModal
- [x] FlotaPage reescrita con KPIs + tabs (Vehículos, Conductores) + design system
- [x] TransportePage reescrita con KPIs + Rutas tab + CRUD
- [x] DespachosPage reescrita con KPIs + tabla profesional
- [x] PESVOperativoPage reescrita con KPIs + IncidentesViales tab

### Admin Finance (admin-finance-1)
- [x] 7 modales CRUD: PartidaPresupuestalFormModal, TransaccionTesoreriaFormModal, ConciliacionFormModal, ActivoFijoFormModal, DepreciacionFormModal, SolicitudServicioFormModal, ContratoServicioFormModal
- [x] PresupuestoPage reescrita con KPIs + CRUD completo
- [x] TesoreriaPage reescrita con KPIs + Conciliaciones tab
- [x] ActivosFijosPage reescrita con KPIs + Depreciaciones tab
- [x] ServiciosGeneralesPage reescrita con KPIs + Contratos tab

### Accounting (accounting-1)
- [x] 7 modales CRUD: CuentaContableFormModal, AsientoContableFormModal, LineaAsientoFormModal, GeneracionInformeFormModal, ParametroIntegracionFormModal, ConfigContableFormModal, PeriodoContableFormModal
- [x] ConfigContablePage reescrita con KPIs + CRUD cuentas/periodos
- [x] MovimientosContablesPage reescrita con KPIs + líneas inline
- [x] InformesContablesPage reescrita con KPIs + generación informes
- [x] IntegracionContablePage reescrita con KPIs + parámetros CRUD
- [x] AccountingPage corregida con tildes
- [x] Fix 4 hook signatures (useMovimientos, useInformesContables, useIntegracion, useConfigContable)

### Totales del sprint
- 13 archivos modificados, +2,563 insertions, -1,342 deletions
- 21 modales CRUD nuevos
- 13 pages/tabs reescritas con design system 100%
- 0 errores TypeScript, 0 warnings ESLint
- Commit: `e849363`

---

## Sprint IA-fixes (2026-03-01) COMPLETADO
**Integración IA completa: bugs, UX y multi-proveedor.**

### Bugs corregidos
- [x] Fix `is_deleted` field error en GeminiService._get_integration() — IntegracionExterna no tiene `is_deleted`, solo `deleted_at`. Commit `f0bd126`
- [x] TextareaWithAI como export default de Textarea — 97+ modales obtienen IA automáticamente sin cambiar código. Commit `e396365`

### UX improvements
- [x] AIHelpModal: reemplazar Modal (Headless UI roto) por BaseModal (Framer Motion) — fix overflow, portal, scroll indicators. Commit `354ea70`
- [x] detectModuleFromPath: actualizar mapa de rutas a URLs reales (/fundacion, /talento, /revision-direccion, etc.)
- [x] AIAssistantButton: estilos consistentes con header (gray hover, no purple-50), sin Tooltip duplicado. Commits `354ea70`+`409bbd0`
- [x] Mensajes de error amigables para Gemini API (429→cuota, 401→key inválida, 403→permisos). Commit `e43b49f`

### Multi-proveedor con fallback
- [x] _get_integrations() retorna TODAS las integraciones IA activas
- [x] generate() intenta cada proveedor en orden; si falla (429, 5xx, timeout), salta al siguiente
- [x] _detect_provider: soporte Gemini + DeepSeek + OpenAI + Claude
- [x] _call_openai_compatible: método unificado para APIs OpenAI-compatible (DeepSeek, OpenAI, etc.)
- [x] DEFAULT_MODELS por proveedor: gemini-2.0-flash, deepseek-chat, gpt-4o-mini, claude-sonnet-4
- [x] _friendly_error: mensajes centralizados por código HTTP
- [x] Commit: `cbd6944`

---

---

## FASE 6 — QA + Hardening + Features (2026-03-01) COMPLETADO
**Auditoría integral score: 7.2/10 → 7 sprints de hardening.**

### Sprint QA-1 (Frontend) — 2026-03-01
- [x] 80+ archivos: 862 HTML crudos → componentes Design System
- [x] chart-colors.ts: colores centralizados para ECharts/Recharts
- [x] 461 colores hardcoded → CSS variables/palette
- [x] Commits: `f244e57`, `0240fd7`

### Sprint QA-2 (Backend) — 2026-03-01
- [x] 28 modelos migrados a TenantModel (de 54 pendientes)
- [x] TenantModelViewSetMixin creado en core/mixins/viewset_mixins.py
- [x] Stubs para tests pendientes
- [x] Commit: `cd228d4`

### Sprint IA-2 (Backend+FE) — 2026-03-01
- [x] AICallLog model: registro de todas las llamadas IA
- [x] AIQuotaConfig model: límites de uso por tenant
- [x] usage-stats endpoint + quota check middleware
- [x] Frontend: quota UI en configuración
- [x] Commit: `3e3ad64`

### Sprint PLANNER-1 (Full-stack) — 2026-03-01
- [x] Kanban board con drag & drop (@dnd-kit)
- [x] Backend: reorder API para proyectos/actividades
- [x] ViewToggle integrado (tabla/kanban/calendario)
- [x] Commit: `2fcc72e`

### Sprint DEPTH-1 (Frontend) — 2026-03-01
- [x] Accounting KPIs enriquecidos (4/5 módulos ya ricos)
- [x] Commit: `8281810`

### Sprint POLISH-1 (Frontend) — 2026-03-01
- [x] Tooltips HSEQ/Riesgos mejorados
- [x] Welcome banner + quick access dashboard
- [x] Commit: `ed3c447`

### Sprint TEST-1 (Full-stack) — 2026-03-01
- [x] 10 test suites: 7 FE (components+utils) + 3 BE (health+auth+IA)
- [x] Commit: `122a360`

---

## FASE 7 — Revisión Dirección + Portal + Tests + Perf (2026-03-02) COMPLETADO
**7 sprints en paralelo. 108 archivos, +12,727 líneas. Deploy: `da7b891`.**

### Sprint RESUMEN-1 (Backend) — 2026-03-02
**Infraestructura para Revisión por la Dirección ISO 9001/14001/45001 §9.3**
- [x] `RevisionDireccionAggregator`: consolida datos de 14 módulos C2 vía `apps.get_model()`
- [x] `ResumenRevisionMixin`: mixin DRF reutilizable — agrega `GET /resumen-revision/` a cualquier ViewSet
- [x] 14 ViewSets extendidos con ResumenRevisionMixin (cumplimiento, riesgos, accidentalidad, etc.)
- [x] `informe_consolidado` action en RevisionDireccionViewSet
- [x] Métodos: _resumen_cumplimiento, _resumen_riesgos, _resumen_accidentalidad, _resumen_ambiental, etc.
- [x] 16 archivos modificados, 3 creados

### Sprint PORTAL-1 (Full-stack) — 2026-03-02
**Portal público de empleo mejorado**
- [x] Email confirmación postulación (HTML branded template)
- [x] PostulacionThrottle (5/hora) + duplicate check (409)
- [x] PostulacionPage: success state con Framer Motion + "Revisa tu correo" card
- [x] 409 duplicate handling con toast informativo

### Sprint CALENDAR-1 (Frontend) — 2026-03-02
**Vista calendario para Planner (zero external deps)**
- [x] CalendarView: grilla mensual con dots/bars de actividades
- [x] CalendarHeader: navegación de meses con Framer Motion transitions
- [x] CalendarDayCell: indicadores de actividad por día
- [x] CalendarActivityPopover: panel lateral con detalles del día
- [x] calendarUtils.ts: helpers de fecha, colores, nombres en español
- [x] Integrado en MonitoreoSubTab + PlanificacionSubTab via ViewToggle

### Sprint REVISION-1 (Frontend) — 2026-03-02
**Dashboard Informe Gerencial ISO — 15 secciones**
- [x] InformeGerencialTab: dashboard principal con DateRangePicker + 15 secciones ISO
- [x] ResumenEjecutivoCard: score global SIG (0-100) ECharts gauge + radar + 4 KPIs
- [x] SeccionISOCard: wrapper reutilizable con referencia ISO en header
- [x] 15 secciones: AccionesPrevias, Contexto, Cumplimiento, Satisfaccion, Objetivos, NoConformidades, Auditorias, Proveedores, RecursosHumanos, Presupuesto, Riesgos, Accidentalidad, Ambiental, Formacion, Participacion
- [x] chart-helpers.ts: utilidades ECharts compartidas
- [x] ~250 líneas de tipos TypeScript para informe consolidado
- [x] 21 archivos nuevos, 4 modificados

### Sprint REVISION-2 (Full-stack) — 2026-03-02
**Firma digital + PDF export para Actas de Revisión**
- [x] ActaFirmaService: iniciar_proceso_firma(), firmar_acta(), get_estado_firmas()
- [x] informe_gerencial_pdf.py: WeasyPrint PDF generator completo
- [x] Migration 0003: firma_documento_id en ActaRevision
- [x] FirmaActaModal: 3 slots de firma con SignaturePad
- [x] EnviarInformeModal: envío por email del informe

### Sprint TEST-2 (Full-stack) — 2026-03-02
**~170 tests nuevos**
- [x] 11 FE tests: Card, EmptyState, Alert, Tabs, Pagination, ViewToggle, usePermissions (24 tests), useResponsive, useDynamicTheme, queryClient, AuthFlow
- [x] 4 BE tests: test_informe_consolidado, test_resumen_mixin, test_portal_publico, test_ia_edge_cases
- [x] 15 archivos de test nuevos

### Sprint PERF-1 (Frontend) — 2026-03-02
**Optimización de bundle y rendimiento**
- [x] vite.config.ts: 12 manual chunks (de 3), ES2020 target, 5MB PWA cache limit
- [x] Sentry lazy-loaded via dynamic import (main.tsx + ErrorBoundary)
- [x] React Query: gcTime, refetchOnReconnect, mutation retry:0
- [x] npm script "analyze" para bundle analysis
- [x] -31% reducción en chunk más grande, -99.98% carga inicial Sentry

### Deploy VPS (2026-03-02)
- [x] 108 archivos, +12,727 insertions
- [x] ~16 migraciones faked (pre-aplicadas manualmente en VPS)
- [x] Frontend build: 57.50s, 215 precache entries
- [x] Services: stratekaz-gunicorn, stratekaz-celery, stratekaz-celerybeat restarted
- [x] Commit: `da7b891`

---

## FASE 8 — Portal Proveedores Rico + Soft-Delete + Setup-Password (2026-03-03) COMPLETE

### Pre-sprints Fixes (2026-03-03)
- [x] Fix error 400 crear proveedor (serializer allow_blank 9 campos)
- [x] Fix setup-password "Enlace inválido" (sessionStorage backup + public page exclusion 401)
- [x] Fix forgot-password email (`EMAIL_SUBJECT_PREFIX=''`, template con branding tenant)
- [x] Fix race condition Mi Portal / Portal Proveedor (esperar `isLoadingUser` antes de redirect)
- [x] ProveedorForm migrado a FormModal + React Hook Form + Zod

### Sprint PP-1 (Full-stack) — 2026-03-03
**Portal Proveedor Rico por tipo (MP, Productos, Transportista, UN)**
- [x] Tabs diferenciados por `tipo_proveedor` (Mi Empresa, Contratos, Evaluaciones, Precios MP, Mi Cuenta)
- [x] Cargo auto PROVEEDOR_PORTAL para tipos portal-only
- [x] TipoProveedor seed dinámico via `deploy_seeds_all_tenants`

### Sprint PP-2 (Full-stack) — 2026-03-03
**Portal Rico Consultor + "Mis Profesionales"**
- [x] Gestión equipo consultora desde Portal Proveedor
- [x] Cargo opcional para consultores (`crear-acceso` requiere `cargo_id`)
- [x] Sub-escenarios: empresa consultoría (N profesionales) vs asesor independiente (1 usuario)

### Soft-Delete & User Cascade Fixes — 2026-03-03
- [x] **Commit `98b6f9d`**: Conditional UniqueConstraint en Proveedor (numero_documento, codigo_interno)
  - Removed `unique=True` from fields, added `UniqueConstraint(condition=Q(deleted_at__isnull=True))`
  - `soft_delete()` mangles fields with `DEL-{id}-` prefix, `restore()` unmanges
  - Migration `0004_soft_delete_unique_constraints` with data fix for existing records
  - `generar_codigo_interno()` excludes soft-deleted in fallback query
- [x] **Commit `1347469`**: Cascade soft-delete to linked users
  - `soft_delete()` deactivates `usuarios_vinculados.filter(is_active=True)`
  - `crear_acceso` reasigns user if old proveedor was deleted (email reuse)
  - Username conflict resolution for deleted proveedores

### Setup-Password Tenant Fix — 2026-03-03
- [x] **Commit `0e59651`**: 500 error on `/api/core/setup-password/` without tenant context
  - Root cause: new users have no JWT and no X-Tenant-ID in localStorage
  - Added `/api/core/setup-password/` to `public_tenant_paths` in middleware (resolves tenant without JWT)
  - Backend includes `tenant_id` query param in setup URL (both proveedores + talent_hub)
  - Frontend `SetupPasswordPage.tsx` reads `tenant_id` from URL, stores in localStorage
  - localStorage `current_tenant_id` → axios interceptor sends `X-Tenant-ID` header

### Portal Aislado + Layout Adaptativo — 2026-03-03
- [x] **PortalLayout.tsx** (NEW): Layout minimalista sin sidebar para portal-only users
- [x] **AdaptiveLayout.tsx** (NEW): Wrapper que decide PortalLayout vs DashboardLayout
- [x] `isPortalOnlyUser()` utility en `utils/portalUtils.ts`
- [x] LoginPage post-login redirect: portal-only → `/proveedor-portal`
- [x] Sidebar: eliminado bloque "Portal Proveedor" (portal-only ya no ve sidebar)
- [x] UserMenu: eliminado "Mi Empresa" link (portal-only tiene su propio header)

### Portal Detection & Routing Fixes — 2026-03-03
- [x] **Commit `076b4d1`**: Fix detección portal-only con `cargo.code` + serializer explícito
  - `isPortalOnlyUser()` ahora usa `cargo.code === 'PROVEEDOR_PORTAL'` como check primario
  - Backend: `UserDetailSerializer.proveedor` = `IntegerField(source='proveedor_id')` explícito
  - Evita cross-module `PrimaryKeyRelatedField` que fallaba silenciosamente
- [x] **Commit `94189dd`**: Fix redirect loop dashboard↔proveedor-portal
  - `ProveedorPortalPage` guard cambiado de `!user.proveedor` a `!user.proveedor && !isPortalOnlyUser(user)`
- [x] **Commit `df67bf9`**: Habilitar queries mi-empresa con cargo.code como fallback
  - `useHasProveedor()` hook: `Boolean(user.proveedor) || isPortalOnlyUser(user)`
  - Todas las queries portal (useMiEmpresa, useMisContratos, etc.) usan este hook
- [x] **Commit `1846eeb`**: Fix document_number único por usuario + mejor error handling
  - `_create_user_for_proveedor`: UUID suffix si base_doc ya existe (múltiples users/proveedor)
  - `useCrearAccesoProveedor.onError`: parsea errores field-level DRF, no solo `detail`

### Tenant Management Commands — 2026-03-03
- [x] **Commit `0aaa099`**: `clean_tenant_modules` — limpia C2-C6 preservando C0+C1
- [x] **Commit `0aaa099`**: `delete_tenant` — elimina tenant completo (schema + registros public)
- [x] **Commit `f951983`**: `reset_tenant` — reset completo (C2-C6 + usuarios no-admin + public schema)

### Files Modified (FASE 8 — session 2 — 2026-03-03)
- `frontend/src/utils/portalUtils.ts` (isPortalOnlyUser cargo.code detection)
- `frontend/src/layouts/AdaptiveLayout.tsx` (removed debug alert)
- `frontend/src/features/proveedor-portal/pages/ProveedorPortalPage.tsx` (guard fix)
- `frontend/src/features/proveedor-portal/hooks/useMiEmpresa.ts` (useHasProveedor)
- `frontend/src/features/supply-chain/hooks/useProveedores.ts` (error handling)
- `backend/apps/core/serializers.py` (explicit proveedor IntegerField)
- `backend/apps/supply_chain/gestion_proveedores/viewsets.py` (document_number UUID)
- `backend/apps/tenant/management/commands/reset_tenant.py` (NEW)
- `backend/apps/tenant/management/commands/clean_tenant_modules.py` (NEW)
- `backend/apps/tenant/management/commands/delete_tenant.py` (NEW)

### Files Modified (FASE 8 — session 1 — 2026-03-03)
- `backend/apps/supply_chain/gestion_proveedores/models.py` (3 commits)
- `backend/apps/supply_chain/gestion_proveedores/viewsets.py` (3 commits)
- `backend/apps/supply_chain/gestion_proveedores/migrations/0004_soft_delete_unique_constraints.py` (NEW)
- `backend/apps/tenant/middleware.py`
- `backend/apps/talent_hub/colaboradores/views.py`
- `frontend/src/pages/SetupPasswordPage.tsx`

### Auditoría de Infraestructura — Session 3 (2026-03-03)

**Objetivo:** Validar salud del monolito, multi-tenant y preparar para onboarding de tenants.

#### Monolito Modular — PASS
- [x] 84 TENANT_APPS correctamente categorizadas (doc decía 92, corregido)
- [x] 14 middleware en orden correcto (TenantMain primero)
- [x] REST Framework: HybridJWT, throttling, paginación correctos
- [x] Settings dev/prod/test: escalación progresiva de seguridad
- [x] URLs condicionales: 21 checks sin referencias rotas
- [x] CORS/CSRF correctos por entorno

#### Multi-Tenant — PASS (97.8%)
- [x] Schema isolation completa (django-tenants + TenantSyncRouter)
- [x] HybridJWTAuthentication: doble validación cross-tenant
- [x] PublicSchemaWriteMixin en todos los ViewSets tenant
- [x] Async schema creation (Celery 45min timeout, progress Redis)
- [x] Orphan cleanup command funcional

#### Management Commands — PASS (14 comandos auditados)
- [x] Todos manejan `schema_context()` correctamente
- [x] Dry-run por defecto en operaciones destructivas
- [x] Doble confirmación en delete/reset

#### Fixes aplicados
- [x] `repair_tenant_status.py`: EXPECTED_TABLE_COUNT hardcoded → auto-detección dinámica desde tenant 'ready'
- [x] CLAUDE.md: conteo apps corregido (92→84, N2 15→14, N4 17→15, logistics_fleet 4→2)

#### Hallazgos documentados (ver MEMORY.md → Roadmap FASE 8.5+)
- BUG: Setup-password envía 2 emails (welcome + setup), enlace 72h no funciona confiablemente
- BUG: Impersonation modal sin toast de error
- GAP: Proveedores bulk import no tiene crear-acceso masivo
- GAP: Colaboradores no tienen crear-acceso equivalente a proveedores
- GAP: PortalLayout header/footer minimalista (mejorable)
- GAP: Notificaciones no expuestas en PortalLayout
- GAP: Cliente sin portal
- INFO: 5 plantillas Excel funcionando (cargos, colaboradores, proveedores, clientes, partes interesadas)
- INFO: Animaciones completas (30+ variantes Framer Motion en lib/animations.ts)
- INFO: Emails 14 templates con branding dinámico por tenant

---

## Sprint POLISH-2 — Cleanup TODOs y Placeholders (2026-03-04) COMPLETADO
**Objetivo:** Limpiar los últimos TODOs/placeholders que quedaron en módulos C2 durante los sprints rápidos de FASE 5-8. Llevar todos los módulos al 100% producción.

### Auditoría de módulos (pre-sprint)
| Módulo | Estado Pre | Estado Post | Notas |
|--------|-----------|-------------|-------|
| HSEQ (11 pages) | 100% | 100% | — |
| Riesgos (7 pages) | 100% | 100% | — |
| Sales CRM (5 pages) | 100% | 100% | — |
| Talent Hub (11 pages) | 100% | 100% | — |
| Workflows (3 pages) | 100% | 100% | — |
| Production Ops (5 tabs) | 100% | 100% | — |
| Logistics & Fleet (4 tabs) | 100% | 100% | — |
| Accounting (4 pages) | 100% | 100% | — |
| Cumplimiento | 80% | 100% | + delete mutations + export CSV |
| Supply Chain | 60% | 100% | CatalogosTab deshadowed + PruebasAcidez redirect |
| Analytics | 70% | 100% | DashboardBuilder WidgetRenderer real |
| Admin Finance | 90% | 100% | CuentaPorCobrar create wired |
| Audit System | 95% | 100% | Notificación detail modals |

### Cambios realizados

**1. Cumplimiento Legal — Delete + Export**
- [x] `useDeleteEmpresaRequisito` mutation hook agregado
- [x] Botón eliminar conectado en RequisitosLegalesTab
- [x] Export CSV con BOM (`\uFEFF`) para compatibilidad Excel

**2. Supply Chain — CatalogosTab**
- [x] Descubierto que CatalogosTab real (499 líneas) ya existía pero estaba shadowed por placeholder inline
- [x] Eliminado placeholder inline, importado componente real de `../components`
- [x] PruebasAcidezTab: redirect a Production Ops → Recepción (12 archivos ya existían en production_ops)

**3. Analytics — DashboardBuilder WidgetRenderer**
- [x] Reemplazado stub con renderer type-aware (kpi_card, gauge, tabla, chart)
- [x] `WIDGET_TYPE_CONFIG`: mapping 7 TipoWidget → label/icon/color
- [x] Renderers especializados: KPI card con semáforo/tendencia, gauge half-circle, tabla con headers, chart con icono tipo

**4. Admin Finance — CuentaPorCobrar**
- [x] `useCreateCuentaPorCobrar` hook agregado en hooks/index.ts
- [x] Mutation wired en CuentaPorCobrarFormModal con toast + loading state

**5. Audit System — Notificaciones**
- [x] `NotificacionDetailModal`: modal detalle con título, mensaje, categoría, prioridad, fechas, URL
- [x] Bandeja: rows clickables con auto-mark-as-read (`marcarLeida.mutate()`)
- [x] TipoNotificación: modal detalle reemplazando `alert()` (código, nombre, categoría, plantilla, canales)

### Archivos modificados (7)
| Archivo | Cambio |
|---------|--------|
| `features/cumplimiento/hooks/useRequisitos.ts` | + useDeleteEmpresaRequisito |
| `features/cumplimiento/components/requisitos-legales/RequisitosLegalesTab.tsx` | + delete + export CSV |
| `features/supply-chain/pages/SupplyChainPage.tsx` | Deshadow CatalogosTab + PruebasAcidez redirect |
| `features/analytics/pages/DashboardBuilderPage.tsx` | WidgetRenderer type-aware |
| `features/admin-finance/hooks/index.ts` | + useCreateCuentaPorCobrar |
| `features/admin-finance/components/CuentaPorCobrarFormModal.tsx` | Wire create mutation |
| `features/audit-system/pages/NotificacionesPage.tsx` | + NotificacionDetailModal + TipoNotificacion modal |

### Verificación
- ✅ `npx tsc --noEmit` — 0 errores
- ✅ ESLint — 0 errores, 3 warnings pre-existentes (any casts)
- ✅ Todos los 14 módulos C2 al 100% producción

### Commit
- `f30b50c` — feat(polish): Sprint POLISH-2 — cleanup TODOs y placeholders en 6 módulos

---

## Auditoría FASE 9 P1 (2026-03-04) — Items ya implementados

### Objetivo
Revisión sistemática de todos los items P1 del roadmap FASE 9 para determinar estado real.

### Resultado
| Item | Estado | Evidencia |
|------|--------|-----------|
| **BULK-ACCESS** | ✅ YA HECHO | Excel template tiene columnas `Crear Acceso Portal` + `Email Portal` + `Username`. Serializer valida. Import loop crea usuarios. Frontend muestra `con_acceso`. |
| **PORTAL-UX** | ✅ YA HECHO | PortalLayout: header (logo+slogan+branding), bell icon con badge + refetch 60s, user menu dropdown, footer (copyright+soporte+powered-by), dark/light theme. |
| **IMPERSONATION-FIX** | ✅ YA HECHO | Commit `3380f2f`: toast.error() (no console.error), self-filter `u.id !== superadminId`, auto-open modal "Cambiar usuario", backend 400 self-impersonation. |

### Conclusión
Todos los items P1 de FASE 9 ya estaban implementados en sprints anteriores (FASE 8 + fixes).
Roadmap actualizado: P1 → COMPLETADO. Siguiente: P2 (CLIENTE-PORTAL / AUDITORIA-INTERNA).

---

## Sprint AUDIT-SYNC (2026-03-05) — Auditoría Sistemática FE↔BE

**Scope:** Auditoría exhaustiva de 11 módulos (excl. supply-chain). Fix sistémico de sincronización frontend↔backend.

**P0 — url_path kebab-case (317 @actions, 57 archivos BE + 72 URLs FE):**
- Agregado `url_path='kebab-case'` a 317 `@action` decorators en 57 views.py
- Actualizado 72 URLs en 20+ archivos frontend de snake_case a kebab-case
- Módulos: accounting, admin-finance, analytics, audit-system, cumplimiento, gestion-estrategica, hseq, logistics-fleet, motor-riesgos, production-ops, sales-crm, talent-hub, tenant, workflow-engine

**P1 — Tipos TS que rompían escritura (create/update):**
- Cumplimiento: `CreateEmpresaNormaDTO.empresa` → `empresa_id`, router slugs `tipos/` → `tipos-requisito/` y `tipos-reglamento/`, `vencimientos/` → `por-vencer/`, legacy types → barrel types
- Riesgos: `CreateControlRiesgoDTO.tipo` → `tipo_control`, `EstadoTratamiento.en_proceso` → `en_curso`
- Riesgos Viales: `/tipos-riesgo/` → `/factores/`, `tipo_riesgo_id` → `tipo_riesgo`, `ControlVialCreate.riesgo_id` → `riesgo_vial`, eliminados 20+ endpoints fantasma
- Talent Hub: `fecha_hechos` → `fecha_falta`, `exonerado` → `absuelto`, `descargo_relacionado` → `descargo`, `fecha_efectiva_retiro` → `fecha_ultimo_dia_trabajo`, `genera_indemnizacion` → `requiere_indemnizacion`, `fecha_programada` → `fecha_examen`, `entidad_salud` → `entidad_prestadora`, `cargo_data {codigo,nombre}` → `{code,name}`

**P2/P3 — Pendientes (requieren decisión de producto):**
- Off-boarding: PazSalvo, LiquidacionFinal, EntrevistaRetiro, ChecklistRetiro tienen estructura completamente diferente FE↔BE
- Riesgos Viales: IncidenteVial, InspeccionVehiculo tienen todos los campos con nombres distintos
- Aspectos Ambientales: ImpactoAmbiental, MonitoreoAmbiental con campos renombrados
- @actions fantasma FE sin implementar en BE: ~20 en cumplimiento, HSEQ, analytics, GE-planeación
- Decisión pendiente: ¿implementar en BE o eliminar del FE?

**Documentación creada:**
- `naming-conventions.md` — Guía completa snake_case vs kebab-case vs camelCase
- `audit-api-sync.md` — Hallazgos detallados, checklist pre-deploy, patrones sistémicos

---

## Sprint EPP-UNIFICATION (2026-03-06) COMPLETADO

**Scope:** Unificar flujo EPP entre Onboarding (TH), HSEQ y Almacén (Supply Chain).
- Flujo unificado: Onboarding entrega EPP → HSEQ registra → Almacén descuenta inventario.

---

## Sprint SUPPLY-CHAIN-UI (2026-03-06) COMPLETADO

**Scope:** Reorganización + estandarización UI del módulo Supply Chain.

**Fase 1 — Reorganización:**
- Unificación de 2 páginas (GestionProveedoresPage + SupplyChainPage) en 1 sola SupplyChainPage
- SECTION_MAP pattern (como TalentHub): sidebar controla navegación, NO page-level tabs
- 8 secciones en flujo de negocio: Proveedores → Precios → Compras → Almacenamiento → Programación → Evaluaciones → Unidades de Negocio → Catálogos
- Actualización seed_estructura_final.py con 8 tabs
- Eliminación GestionProveedoresPage.tsx

**Fase 2 — Estandarización UI (8 secciones):**
- ProveedoresTab: KpiCardGrid → StatsGrid + SectionToolbar con moduleColor
- PreciosTab: header manual → SectionToolbar, Modal → BaseModal con footer
- ComprasTab: Tabs pills → PageTabs underline + moduleColor
- AlmacenamientoTab: Tabs pills → PageTabs underline + moduleColor
- ProgramacionTab: Tabs pills → PageTabs underline + moduleColor
- EvaluacionesTab: window.confirm/prompt → ConfirmDialog/BaseModal, Modal → BaseModal
- UnidadesNegocioTab: header manual → SectionToolbar, Modal → BaseModal + ConfirmDialog
- CatalogosTab: header manual → SectionToolbar, Modal → BaseModal + ConfirmDialog, fix `any` types

**Fase 3 — Documentación:**
- Creado `memory/ui-standards.md` con 3 tipos de vista (CRUD, tabla simple, especial)
- Reglas DS obligatorias documentadas en MEMORY.md

**Hotfix:** `useModuleColor()` retorna objeto, no string → destructurar `{ color: moduleColor }`.

**Commits:** 807f8ca, 1959789, e89ab48, 492a902

---

## Sprint QA-IMPERSONATION (2026-03-06) COMPLETADO

**Scope:** QA y bugfixes de impersonación + portal + identidad corporativa.

**Sesión 1 — Impersonación desde tabla de usuarios:**
- [x] Agregar acción impersonación (Eye icon) a UsersTable.tsx
- [x] Mejorar headers de tabla: reorden columnas, sort indicators (ChevronUp/Down)
- [x] handleImpersonate en UsersPage con isPortalOnlyUser detection

**Sesión 2 — Backend impersonación:**
- [x] Crear `get_effective_user(request)` en `apps/core/utils/impersonation.py`
- [x] Agregar `X-Impersonated-User-ID` header a axios interceptor
- [x] Actualizar 6 endpoints Supply Chain portal (mi-empresa/*)
- [x] Actualizar 6 endpoints Talent Hub ESS (mi-perfil, mis-vacaciones, etc.)
- [x] CORS headers actualizados (dev + prod)

**Sesión 3 — Fix pantalla negra impersonación:**
- [x] Reemplazar `<Navigate>` con `PortalRedirect` (navigate imperativo + spinner)
- [x] AdaptiveLayout: retry limit (MAX_PROFILE_RETRIES=3) + forceLogout

**Sesión 4 — Fix spinner infinito Admin Global:**
- [x] ROOT CAUSE: `UserImpersonationModal` usaba `user.proveedor != null` para detectar portal, pero `UserListSerializer` NO incluye `proveedor` → SIEMPRE navegaba a `/dashboard`
- [x] Fix: usar `isPortalOnlyUser(user)` + `isClientePortalUser(user)` de `portalUtils.ts`
- [x] `impersonate_profile` endpoint: agregar campos faltantes (cliente, cliente_nombre, cargo_name)
- [x] Fix identidad corporativa: `useCreateIdentity` factory → hook custom con `refetchQueries(activeIdentity)`

**Commits:** 187531b, 7376a73, b352ac3, 85c835b, 545d96c, ea0435a

---

## Sprint QA-FUNDACION (2026-03-13) COMPLETADO

**Scope:** Mi Portal para consultores colocados + sesiones estables + 8 bugs Fundación + RBAC fix.

**Sesión 1 — Portal + Auth + JWT:**
- [x] MiPortalPage: `UserPortalView` para usuarios sin Colaborador (consultores colocados)
- [x] AdaptiveLayout: 3→5 retries con exponential backoff (0, 2s, 4s, 8s, 16s)
- [x] JWT access token: 60→480min (jornada laboral)
- [x] IntegracionesSection: missing usePermissions/canDo imports

**Sesión 2 — Bugs Fundación:**
- [x] CaracterizacionFormModal: Badge `label/color` → `children/variant` (DS compliance)
- [x] OrganigramaView: missing usePermissions/Modules/Sections imports
- [x] IdentidadTab: `_identity` → `identity` parameter destructuring (11+ ReferenceError)
- [x] PWA toast: colores branding via CSS var `--color-primary-600`

**Sesión 3 — Props inválidos + RBAC 'update'→'edit':**
- [x] CaracterizacionFormModal: Modal `size="large"` → `"4xl"`, Spinner `size="small"` → `"sm"`
- [x] CaracterizacionesSection: canDo `'update'` → `'edit'` (matchea backend RBAC codes)
- [x] ConsecutivosSection: canDo `'update'` → `'edit'` (matchea backend RBAC codes)
- [x] Documentado: ~30 archivos fuera de fundación con mismo `size="large"/"small"` pattern (QA-BACKLOG-S2)

**Commits:** 4365e1e, 269a1cf, 727bb3b, bbe6962

---

### CASCADE P0.5 — MI EQUIPO BACKEND DECOUPLING (2026-03-19) ✅ COMPLETE

**Objetivo:** Desacoplar 100% backend de Mi Equipo (L20) de Talent Hub (L60) — modelos, tablas, migraciones y URLs propias.

**Sesión 1 — Desacoplamiento completo backend:**
- [x] 4 sub-apps movidas de `apps.talent_hub.*` a `apps.mi_equipo.*` (estructura_cargos, seleccion_contratacion, colaboradores, onboarding_induccion)
- [x] 31 tablas renombradas: prefijo `talent_hub_` → `mi_equipo_` + 2 tablas `seleccion_` → `mi_equipo_`
- [x] AppConfig.name actualizado en las 4 sub-apps
- [x] INSTALLED_APPS: 4 apps bajo sección "CASCADA LEVEL 20: MI EQUIPO"
- [x] mi_equipo/urls.py: incluye 4 sub-apps + Portal Jefe (MSS)
- [x] talent_hub/urls.py: limpio, solo L60 (novedades, formación, desempeño, etc.) + ESS + people-analytics
- [x] config/urls.py: talent-hub mount condicional (mi_equipo OR novedades)
- [x] module_access.py: `api/mi-equipo/` → mi_equipo (separado de talent_hub)
- [x] employee_self_service.py: imports de `apps.mi_equipo.colaboradores` + try/except para apps L60
- [x] people_analytics.py + tasks.py + signals: imports actualizados a `apps.mi_equipo.*`
- [x] Frontend: ~15 archivos API URLs cambiados de `/talent-hub/` a `/mi-equipo/`
- [x] Migraciones generadas (5 archivos) y aplicadas en Docker (3 schemas)
- [x] Limpieza django_migrations stale records (3 schemas: public + 2 tenants)
- [x] Fix DuplicateTable: 2 tablas con prefijo `seleccion_` renombradas a `mi_equipo_`
- [x] Deploy VPS exitoso: git pull + build + migraciones (3 schemas) + restart servicios
- [x] Verificación final: 31 tablas `mi_equipo_*`, 0 migraciones pendientes, `makemigrations --check` limpio

**Commits:** b166fc63

---

### CASCADE P1.1 — CONTEXT-ANALYSIS: PESTEL/Porter Vista Híbrida + Import/Export + Seeds (2026-03-19)

**Objetivo:** Convertir PESTEL y Porter de visores read-only a Vista Híbrida con tabla CRUD + import/export Excel, siguiendo el patrón de Partes Interesadas.

**Alcance:**
- Backend: 6 nuevos `@action` endpoints (export_excel, plantilla_importacion, import_excel) en FactorPESTELViewSet y FuerzaPorterViewSet
- Frontend: PESTEL reescrito de 157→600 líneas (tabla + matriz + stats), Porter de 284→500 líneas (tabla + radar + diagrama)
- Seeds: 3 nuevos seeds agregados a `deploy_seeds_all_tenants` (tipos_dofa, tipos_pestel, preguntas_pci_poam)
- Auditoría: Estructura de encuesta pública verificada completa y funcional

**Decisiones de diseño:**
- PESTEL/Porter = C1 (Fundación) → tabla CRUD + import/export Excel
- DOFA/TOWS = C2 (Planeación) → solo visualización, se alimentan desde Encuestas PCI-POAM
- Import PESTEL requiere `analisis_id` (factores bajo análisis específico)
- Import Porter usa `update_or_create` por UNIQUE constraint (empresa+tipo+periodo)

**Archivos modificados:**
- [x] `backend/apps/core/management/commands/deploy_seeds_all_tenants.py` — 3 seeds nuevos
- [x] `backend/apps/gestion_estrategica/contexto/views.py` — +474 líneas, 6 @action endpoints
- [x] `frontend/src/features/gestion-estrategica/api/contextoApi.ts` — +78 líneas, exportExcel/downloadTemplate/importExcel
- [x] `frontend/src/features/gestion-estrategica/components/contexto/AnalisisPestelSection.tsx` — reescritura completa Vista Híbrida
- [x] `frontend/src/features/gestion-estrategica/components/contexto/FuerzasPorterSection.tsx` — reescritura completa Vista Híbrida 3 vistas

**Commits:** 0e04178c

---

## FASE 10 P0 — PORTAL-AUDIT: Auditoría portales + limpieza usuario huérfano (2026-03-20)

**Alcance:**
- Auditoría completa de los 4 portales (Mi Portal, Mi Equipo, Proveedores, Clientes)
- Desactivación de portales Proveedor y Cliente (apps no desplegadas aún)
- Limpieza de usuario huérfano `camilorubianobustos@gmail.com` en StrateKaz Demo (3 capas: Colaborador FK → User → TenantUserAccess → TenantUser)
- Backend ESS: try/except defensivo en MisVacacionesView y SolicitarPermisoView (novedades L60)
- Mi Portal: ocultar tabs dependientes de apps L60 (vacaciones, permisos, recibos, capacitaciones, evaluación)
- AdaptiveLayout: portal-only users usan DashboardLayout temporalmente

**Decisiones de diseño:**
- Portales proveedor/cliente → redirect a /mi-portal (no 404) hasta que se desplieguen L50/L53
- Mi Portal tabs controlados por flags booleanos — se activan progresivamente al desplegar niveles
- Mi Equipo (líder) ya estaba 100% defensivo — validado sin cambios necesarios
- StatsGrid removido de Mi Portal (dependía de datos L60)

**Archivos modificados:**
- [x] `backend/apps/talent_hub/api/employee_self_service.py` — try/except en vistas L60
- [x] `frontend/src/features/mi-portal/pages/MiPortalPage.tsx` — tabs L60 ocultos, StatsGrid removido
- [x] `frontend/src/layouts/AdaptiveLayout.tsx` — portal-only → DashboardLayout
- [x] `frontend/src/routes/modules/portals.routes.tsx` — proveedor/cliente desactivados con redirect

**Commits:** 7735e69e

---

## FASE 9 P3 — Sprint MEGA: CI Verde + Firma Guardada + Onboarding Profesional (2026-03-22) ✅ COMPLETE

**Scope:** 7 commits, ~200 archivos, 5 agentes paralelos + 7 auditorías profundas

**Logros:**
1. **fix(auth)**: LoginPage redirect si sesión activa + interceptor refresh en páginas públicas
2. **feat(encuestas)**: Preview "X usuarios serán invitados" al seleccionar cargo
3. **feat(plantillas)**: FirmantesEditor con select rol/cargo, reordenar, preview resolución
4. **feat(firma-digital)**: 8 modelos migrados a TenantModel + firma guardada en perfil (Adobe Sign-style)
5. **fix(audit)**: 12 issues de auditoría (max-height, duplicados, validación, Base64, ConfirmDialog)
6. **fix(lint)**: 464 ESLint warnings → 0 (142 archivos, `any`→tipos específicos)
7. **feat(onboarding)**: Token SHA-256 + constant_time_compare + UserSetupFactory + show/hide password + OnboardingChecklist + email personalizado

**Commits:** `8ff358f9`, `5527b438`, `4d8de929`, `6815b5a6`, `3e059f1f`, `4dfebe85`, `ade51697`

---

## E2E Gestión Documental + TypeScript Cleanup (2026-04-03) COMPLETADO

**Objetivo:** Validar ciclo completo BORRADOR→EN_REVISION→APROBADO→PUBLICADO→DISTRIBUIDO y corregir errores TS en el módulo.

### Sesión 1 — Bugs E2E (commit `29f814f3`)
- **Fechas vacías DateField 400**: `fecha_vigencia: ""` → `data.fecha_vigencia || undefined` en DocumentoFormModal
- **`aplica_a_todos` no enviado al publicar**: Backend `_auto_distribuir_documento()` requiere `aplica_a_todos=True` para crear `AceptacionDocumental`. Fix en `gestionDocumentalApi.ts` + `useGestionDocumental.ts` + `DocumentoDetailModal.tsx`
- **`elaborado_por_nombre` inexistente**: Cambiado a `elaborado_por_detail?.full_name`
- **TiposPlantillasSection button-in-button**: Lucide icons `title` prop → TS2322. Removido prop `title` de CheckCircle, PenTool, Tag

### Sesión 2 — Lucide title prop fix (commit `d6466da7`)
- Removido prop `title` de todos los íconos Lucide en TiposPlantillasSection (no es prop válido)

### Sesión 3 — 28 TS errors gestion-documental (commit `96681f91`)
- `ModalSize` `'5xl'` → `'4xl'` en DocumentoReaderModal
- `tipo_documento_detail?.id ?? tipo_documento` en DocumentoFormModal + PlantillaFormModal
- `distribución` field agregado a `EstadisticasDocumentales` type
- `moduleName` → `parentName` en GestionDocumentalTab (prop correcto de GenericSectionFallback)
- Unused `Badge` import removido de IngestarLoteModal
- `tiempo_retencion_años` → `tiempo_retencion_anos` (typo ñ→n) en TipoDocumentoFormModal
- `AuditoriasInternasPage`: `useMemo<ProgramaAuditoriaList[]>`, cast mutations
- `AsignarFirmantesModal`: `String(colab.extra?.cargo_id ?? '')` (string|number→string)
- `PlantillaFormModal`: `CreateCampoFormularioDTO` / `UpdateCampoFormularioDTO` imports + casts

### Descubrimientos clave
- **Docker local schema**: `tenant_demo` (NO `tenant_stratekaz`)
- **localStorage auth key**: `access_token` directamente, NO en `auth-storage.state`
- **`_auto_distribuir_documento()`**: requiere `aplica_a_todos=True` OR `cargos_distribucion.exists()` para distribuir
- **DocumentoReaderModal**: volatile-refs pattern funciona sin Maximum update depth

### Verificación E2E completa
- ✅ BORRADOR → EN_REVISION → APROBADO: firma nivel 1 (sin 2FA)
- ✅ PUBLICADO: `aplica_a_todos=True` → AceptacionDocumental creadas en `tenant_demo`
- ✅ DISTRIBUIDO: LecturasPendientesTab muestra docs, ReaderModal abre sin errores, timer activo
- ⚠️ Deploy VPS pendiente: commits 29f814f3, d6466da7, 96681f91

**Commits:** `29f814f3`, `d6466da7`, `96681f91`

---

## 2026-04-08 (parte 2) — Resolución H2: Sistema de Memoria del Proyecto

### Objetivo
Resolver H2 — auto-memory de Claude Code vivía fuera del repo (45 archivos, ~475 KB sin versionar).

### Resultado
RESUELTO. 3 commits en main pusheados (72125fea, 614cae45, b4aab5b2).

### Decisión arquitectónica tomada
Opción D — Híbrido. Conocimiento durable vive en docs/ del repo (versionado). Auto-memory de Claude Code queda como scratch pad efímero solo para MEMORY.md (índice), feedback_*.md (reglas de Claude), y reglas operacionales pequeñas. Criterio de corte: "si importaría dentro de 3 meses, va a docs/".

### Cambios ejecutados
- 28 archivos del snapshot promovidos a docs/ en 6 grupos temáticos
- 2 directorios nuevos: docs/business/ y docs/history/
- 9 archivos del snapshot descartados por redundancia con docs/ existente
- 2 merges: ui-standards → DESIGN-SYSTEM.md, naming-conventions → CONVENCIONES-NOMENCLATURA.md
- coding-standards.md reemplaza POLITICAS-DESARROLLO.md (era 2x más completo)
- 4 referencias rotas en CLAUDE.md corregidas (líneas 52, 73, 361, 499)
- Nueva sección en CLAUDE.md: "Sistema de Memoria — Regla de Persistencia"
- MEMORY.md en auto-memory reescrito como índice de punteros (de 28 KB a ~5 KB)
- Snapshot .memory-backup-2026-04-08/ eliminado del repo (renames preservados en historia git)
- Auto-memory queda con 10 archivos: MEMORY.md + 6 feedback + 3 reglas operacionales

### Hallazgos nuevos generados
- H3 — Los 28 archivos promovidos no fueron validados contra el código actual. Pueden contener decisiones obsoletas. Sesión dedicada futura.
- Pitfall metodológico registrado en docs/history/pitfalls.md: Code se saltó la conversación filosófica preliminar y arrancó a ejecutar después de 3 multi-select. Regla escrita para que no vuelva a pasar.

### Deuda colateral nueva detectada
- frontend/coverage/ debería estar en .gitignore (output de tests, no se versiona)

### Estado de hallazgos al cierre
- ✅ H2 — RESUELTO
- 🔲 H1 — Capa Portales no definida (próxima sesión arquitectónica grande)
- 🔲 H3 — Validación de frescura de los 28 archivos promovidos

### Próxima sesión sugerida
Opciones en orden de prioridad:
1. Sub-bloque 1 (Auth/JWT/Session) — victoria rápida pendiente, 1,137 LOC, ya inventariado
2. H1 — Portales — sesión arquitectónica grande
3. H3 — Validación de los 28 archivos

---

## Accumulated Stats (Sprints 22-P0 + FASE 5-9 P3)
- **Backend**: 18 security fixes, 50+ models migrated to TenantModel, 18 bug fixes, unified user creation flow, Celery tasks branding, email branding, clear_tenant_users command, DB repair masiva, cross-tenant security bypass fix, User.proveedor FK, portal proveedor endpoints, crear-acceso proveedor, supply chain URL registration, 16 FK decoupled, sidebar layers (SIDEBAR_LAYERS), module migration (gestion_estrategica → 3 módulos), RBAC permisos separados, auto_generate_codigo() transversal (20 modelos), 42 ConsecutivoConfig seeds, 7 unique constraints multi-tenant fixed, DRF action url_path fixes, select_lists query fixes, import masivo proveedores + clientes, TenantModelViewSetMixin, AICallLog + AIQuotaConfig, **RevisionDireccionAggregator (14 módulos)**, **ResumenRevisionMixin (14 ViewSets)**, **ActaFirmaService**, **informe_gerencial_pdf.py (WeasyPrint)**, **PostulacionThrottle + email confirmación**, **conditional UniqueConstraint soft-delete pattern**, **soft-delete user cascade**, **public_tenant_paths for setup-password**, **AdaptiveLayout + PortalLayout**, **isPortalOnlyUser(cargo.code)**, **cross-module serializer IntegerField pattern**, **3 tenant management commands (reset, clean, delete)**, **PESTEL/Porter import/export Excel (6 @action endpoints)**, **3 context seeds en deploy_seeds_all_tenants**
- **Frontend**: ~80+ pages/components, ~220+ hooks, ~70+ API clients, ~120+ type interfaces, SectionGuard, forceLogout, refreshUserProfile, Mi Portal redesign + avatar, ProtectedRoute definitive auth, axios interceptor fix, RBAC race condition fixes, portal proveedor + Mi Cuenta, supply chain wired, routes split 18 modules, useModules barrel, 0 cross-imports C2↔C2, 18 modales con codigo auto-gen, portal público vacantes (3 páginas), +20 HSEQ modales, +19 modales (SC+PO+WF+CRM), +2 import masivo, **Kanban board + drag&drop**, **CalendarView (zero deps)**, **InformeGerencialTab (15 secciones ISO)**, **FirmaActaModal + EnviarInformeModal**, **12 manual chunks Vite**, **Sentry lazy-loaded**, **chart-colors.ts**, **862 HTML→DS**, **SetupPasswordPage tenant_id from URL**, **Portal Proveedor Rico (6 tipos)**, **AdaptiveLayout + PortalLayout**, **useHasProveedor hook**, **portalUtils.ts**, **POLISH-2: WidgetRenderer type-aware, NotificacionDetailModal, CatalogosTab deshadowed, delete/export cumplimiento, CuentaPorCobrar create wired**, **PESTEL Vista Híbrida (tabla+matriz+stats+import/export)**, **Porter Vista Híbrida (tabla+radar+diagrama+import/export)**
- **Testing**: ~180+ tests (FE: components, hooks, utils, integration | BE: health, auth, IA, informe consolidado, resumen mixin, portal público)
- **Infrastructure**: Redis secured, Sentry, Logrotate, Backups, CI/CD, FRONTEND_URL, email hardened, DB schema repair (459 tablas × 6 columnas × 2 schemas), modularization complete (5-layer architecture), utils/consecutivos.py helper, **bundle optimization (-31% largest chunk)**, **React Query tuning (gcTime, retry)**, **3 tenant management commands**
- **Deploys to VPS**: 28 successful production deploys
