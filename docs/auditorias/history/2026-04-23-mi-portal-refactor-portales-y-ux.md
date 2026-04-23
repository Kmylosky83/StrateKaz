# Sesión 2026-04-23 — Mi Portal: paraguas Portales + rediseño UX + fixes bypass RBAC

## Contexto
Sesión de consolidación de la capa Portales (cerrando H1) + rediseño UX
completo del Portal del Empleado (Mi Portal). Arrancó como análisis de
hallazgos pendientes, se transformó en refactor arquitectónico + UX + fixes
de seguridad (bypass self-service).

## Resultados

### Bloque 1 — Capa Portales (cierra H1 Capa A)

**Movimiento arquitectónico:**
- `apps/mi_portal/` → `apps/portales/mi_portal/` (paraguas creado)
- Agregada a `INSTALLED_APPS` en `base.py` (antes montaba URL sin registrar — anomalía latente corregida)
- `config/urls.py` actualizado
- `apps.py` con `name='apps.portales.mi_portal'`, `label='mi_portal'`
- URL estable `/api/mi-portal/` preservada (frontend no se entera)

**Dead code eliminado (~1500 LOC):**
- Backend: `apps/talent_hub/api/{ess_urls.py, ess_serializers.py, employee_self_service.py}` (MisVacacionesView, SolicitarPermisoView — importaban modelos OFF)
- Frontend features huérfanas (nunca se renderizaron, import comentado hace meses):
  - `features/proveedor-portal/` — `ProveedorPortalPage.tsx` 553 LOC + api + hooks + 2 tabs + types
  - `features/cliente-portal/` — `ClientePortalPage.tsx` 559 LOC + api + hook + types
- Layout: `layouts/PortalLayout.tsx` (solo servía a portales externos)
- Utilities: `utils/portalUtils.ts` (isPortalOnlyUser, CARGO_PORTAL_CODE, CARGO_CLIENTE_PORTAL_CODE)
- Hooks huérfanos: `hooks/useHasProveedor.ts`, `hooks/useHasCliente.ts`
- Frontend components dead: `mi-portal/components/{PortalProveedorView, PortalClienteView}.tsx` + branches en MiPortalPage
- Referencias limpiadas en: LoginPage, UserImpersonationModal, UsersPage, AdaptiveLayout, use2FA, ui-labels, test mocks

**Docs actualizadas:**
- `docs/01-arquitectura/portales.md` — nuevo, patrón elegido + cómo agregar portal
- H1 cerrado (Capa A) en `hallazgos-pendientes.md`
- H-PORTAL-02 abierto — patrón de acceso externo pendiente (magic link / subdomain / login)

### Bloque 2 — Rediseño UX Mi Portal

**Design System (nuevos componentes reutilizables):**

1. **`ActionCard`** — `components/common/ActionCard.tsx`
   - 5 tonos (default/attention/danger/success/info)
   - Props: icon, count, label, sublabel, tone, onClick, emptyState, loading
   - Hover scale + chevron slide + focus ring, dark mode coherente
   - Exportado desde barrel `@/components/common`

2. **`Tabs` extendido** — `components/common/Tabs.tsx`
   - Nueva prop `count?: number` + `countTone?: 'default' | 'attention' | 'danger'`
   - Badge pill numérico inline, 99+, responsive al estado activo
   - Helper interno `TabCountBadge` (privado al módulo)

**Mi Portal (rediseño):**

- **Hero grandioso** — nombre completo (h1 font-heading), email con @, saludo contextual (sol/ocaso/luna), cargo · área, badges "Colaborador Externo" + "Jefe / Líder", fecha con `first-letter:uppercase` (no `capitalize`)
- **ActionBar** — 3 cards de pendientes (Firmar, Lecturas, Encuestas) con conteos en vivo vía `useMiPortalResumen()`. Empty state único "Estás al día" cuando total=0.
- **Tabs con badges numéricos** — "Lecturas [1]" en ámbar cuando hay pendientes
- **MiPerfilCard rediseñado** — sin duplicación del hero, edit inline por sección, contacto emergencia con card neutra (no bg-red-50 pleno), empty state dashed para contacto emergencia inexistente, valores muted italic cuando campo vacío

**Archivos extraídos** (MiPortalPage 700 → 340 LOC):
- `components/AdminPortalView.tsx` (150 LOC) — superadmin sin colaborador
- `components/UserPortalView.tsx` (110 LOC) — user sin colaborador + CTA contactar RH

**Hook agregador:**
- `useMiPortalResumen()` en `miPortalApi.ts` — agrega lecturas + firmas + encuestas
- Endpoints: `/gestion-estrategica/gestion-documental/documentos/mis-lecturas-count/`, `/workflows/firma-digital/firmas/mis-firmas-pendientes/?es_mi_turno=true`, `/encuestas-dofa/encuestas/mis-encuestas/`

### Bloque 3 — Fixes críticos descubiertos en E2E browsing

Browsing E2E en localhost con Ana García López (cargo Gerente General, sin acceso RBAC a módulo "repositorio") reveló 3 hallazgos:

#### 🔴 Fix H-ACEPT-BYPASS (crítico) — 403 en registrar-progreso / aceptar

**Root cause:** `AceptacionDocumentalViewSet.get_permissions()` solo exceptuaba `mis_pendientes` del `GranularActionPermission`. Las otras 2 acciones self-service (`registrar_progreso`, `aceptar`) caían en RBAC y daban 403 al empleado.

**Fix** — [views.py:1702](backend/apps/gestion_estrategica/gestion_documental/views.py:1702):
```python
SELF_SERVICE_ACTIONS = frozenset({
    'mis_pendientes',
    'registrar_progreso',
    'aceptar',
})

def get_permissions(self):
    if self.action in self.SELF_SERVICE_ACTIONS:
        return [IsAuthenticated()]
    return super().get_permissions()
```

**Patrón coherente** con el canónico ya establecido en `core/viewsets.py` (`UserViewSet.SELF_SERVICE_ACTIONS`).

**Validación E2E:** `POST /aceptaciones/12/registrar-progreso/` pasó de 403 → 200 OK con Ana.

#### 🟡 Fix `loading` vs `isLoading` en Button DS

**Root cause:** `MiFirmaDigital.tsx` usa `loading={...}` en 3 lugares. Button DS espera `isLoading`. React warning "non-boolean attribute".

**Fix:** 3 occurrences renamed en 1 archivo.

#### 🟢 Bug capitalización fecha (detectado en browsing)

"Jueves, 23 **De Abril De** 2026" → "Jueves, 23 **de abril de** 2026".
Reemplazado Tailwind `capitalize` (capitaliza cada palabra) por `first-letter:uppercase` en MiPortalPage, UserPortalView, AdminPortalView.

#### 🟢 Bug endpoint `count` vs `lecturas_pendientes` (detectado en browsing)

Backend devuelve `{ count: 1 }` pero hook `useMiPortalResumen` esperaba `{ lecturas_pendientes: 1 }`. El ActionCard mostraba "Estás al día" (tone success) aunque había 1 lectura pendiente. Corregido en `miPortalApi.ts`.

### Bloque 4 — Hallazgos nuevos registrados (oportunidades)

Todos en `docs/01-arquitectura/hallazgos-pendientes.md`:

| ID | Severidad | Descripción |
|---|---|---|
| **H-PORTAL-02** | MEDIA | Patrón de acceso externo (magic link / subdomain / login) para portales proveedores/clientes/vacantes |
| **H-PORTAL-03** | BAJA | Modal `LecturasObligatoriasGuard` redundante con ActionBar — evaluar eliminar/convertir a banner |
| **H-BE-01** | BAJA | Unificar naming de bypass self-service en ViewSets (SELF_SERVICE_ACTIONS vs PERSONAL_ACTIONS vs inline ifs) |
| **H-FE-01** | BAJA | Prevenir errores `loading` vs `isLoading` en Button DS — ESLint rule o hacer Button defensivo |

## Verificaciones

| Check | Resultado |
|---|---|
| Django `manage.py check` | ✅ No issues |
| TypeScript `tsc --noEmit` | ✅ Exit 0 |
| ESLint `max-warnings=0` en archivos tocados | ✅ Exit 0 |
| Tests `MiPortalPage.test.tsx` | ✅ 19/19 pasan |
| E2E browsing con Ana | ✅ ActionCard → Tab sync + endpoints 200 |

## Balance LOC

| | +Líneas | -Líneas |
|---|---|---|
| Dead code eliminado | — | ~1500 |
| ActionCard + ActionBar + HeroRedesign + hook + Tabs extension | ~350 | — |
| MiPortalPage refactor (extraídos AdminPortalView/UserPortalView) | 260 | 360 |
| **Neto** | | **~-1150 LOC** con UX drásticamente mejor |

## Archivos tocados (alto nivel)

**Backend:**
- `apps/portales/__init__.py`, `apps/portales/mi_portal/{__init__, apps, urls, views, serializers}.py` — nuevo paraguas
- `config/urls.py` — reubicación include
- `config/settings/base.py` — INSTALLED_APPS
- `apps/talent_hub/urls.py` — limpieza comentarios obsoletos
- `apps/gestion_estrategica/gestion_documental/views.py` — fix bypass self-service
- Eliminados: `apps/mi_portal/*`, `apps/talent_hub/api/{ess_urls, ess_serializers, employee_self_service}.py`

**Frontend:**
- `components/common/{ActionCard.tsx (nuevo), Tabs.tsx (extended), index.ts}`
- `features/mi-portal/api/miPortalApi.ts` — hook useMiPortalResumen
- `features/mi-portal/components/{ActionBar.tsx (nuevo), AdminPortalView.tsx (extraído), UserPortalView.tsx (extraído), MiPerfilCard.tsx (rediseñado), MiFirmaDigital.tsx (loading→isLoading), index.ts}`
- `features/mi-portal/pages/MiPortalPage.tsx` — refactor mayor
- `pages/LoginPage.tsx`, `layouts/AdaptiveLayout.tsx`, `features/admin-global/components/UserImpersonationModal.tsx`, `features/users/pages/UsersPage.tsx`, `hooks/use2FA.ts`, `constants/ui-labels.ts`, `layouts/Sidebar.tsx`, `components/common/UserMenu.tsx`, `components/common/auth/index.ts`, `routes/modules/portals.routes.tsx` — limpieza refs
- Eliminados: `features/proveedor-portal/*`, `features/cliente-portal/*`, `layouts/PortalLayout.tsx`, `utils/portalUtils.ts`, `hooks/useHasProveedor.ts`, `hooks/useHasCliente.ts`, `mi-portal/components/{PortalProveedorView, PortalClienteView}.tsx`
- Tests: `__tests__/features/mi-portal/MiPortalPage.test.tsx` + mock de `portalUtils` eliminado en UsersPage.test.tsx

**Docs:**
- `docs/01-arquitectura/portales.md` — nuevo
- `docs/01-arquitectura/hallazgos-pendientes.md` — H1 cerrado Capa A + 4 nuevos abiertos

## Próximo paso

Ninguno inmediato. Sesión cerrada con:
- Mi Portal en producción-local con UX grandioso
- Bypass RBAC explícito y coherente
- Hallazgos menores registrados para atender cuando toque

**Sugerencia para próxima sesión** (si se retoma este frente): atacar
H-PORTAL-03 (deprecar LecturasObligatoriasGuard) + H-FE-01 (Button
defensivo con `loading` deprecated).
