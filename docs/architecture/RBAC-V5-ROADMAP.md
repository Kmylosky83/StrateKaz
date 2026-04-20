# RBAC v5 Roadmap — Hybrid + Permission Templates + Nav Separation

> **Estado:** 🔲 PLANIFICADO (no ejecutado). Deuda consciente registrada como
> `H-S7-rbac-v5-refactor` para desbloquear escalabilidad antes de activar
> Production Ops, HSEQ, Sales CRM.
>
> **Trigger:** antes del Sprint S8 (activación Production Ops) o cuando
> lleguen 10+ clientes reales con permisos custom.

---

## Por qué este refactor

### Diagnóstico del modelo actual (v4.1)

**Arquitectura vigente:**
```
User ─→ Cargo ─→ CargoSectionAccess ─→ TabSection
                                        │
                           TabSection es nodo de menú + unit de permiso
```

**3 problemas de fondo:**

1. **Permission unit = Menu node**
   Cambiar UX del sidebar (renombrar, reagrupar, fusionar tabs) afecta permisos.
   Ejemplo: si mañana fusionas "Proveedores" y "Partners" en un tab, todos los
   `CargoSectionAccess` existentes quedan huérfanos y hay que migrar data.

2. **Nivel jerárquico → permisos default**
   Hoy el signal `_create_default_accesses` asigna permisos por nivel
   (ESTRATEGICO → todo, TACTICO → view/edit, OPERATIVO → solo view). Acopla
   metadata organizacional con authorization. Un "Asistente Administrativo"
   (OPERATIVO) que necesita crear documentos no puede porque su nivel le
   niega `can_create`.

3. **Sin herencia explícita ni templates**
   Si 10 cargos tienen el mismo conjunto de permisos, se configura 10 veces.
   No hay `PermissionTemplate` reutilizable.

### Bug concreto que motivó este roadmap

Rutas FE (ej: `supply-chain.routes.tsx`) pasan **tab_code** como sectionCode:
```tsx
withFullGuard(SupplyChainPage, 'supply_chain', 'proveedores')
// 'proveedores' es TAB code, no section code
```

Pero `compute_user_rbac` solo generaba `permission_codes` a nivel de
section (ej: `supply_chain.registro_proveedores.view`). El guard pedía
`supply_chain.proveedores.view` → no existía → **Sin acceso**.

**Fix táctico aplicado en commit `7d81d63f`** (v4.2): enriquecer
`permission_codes` con tab-level codes (si hay al menos 1 sub-section con
`can_view=True`). Solución sin cambio arquitectónico.

**Deuda:** el fix sigue tratando tabs como permission units. El refactor
v5 separa los conceptos.

---

## Modelo propuesto (v5.0)

### Inspirado en mercado maduro

- **Salesforce Lightning:** Profile (templates) + Permission Sets (overrides) + Apps (navigation config)
- **Odoo:** Groups + Rules + Menu visibility independiente
- **Workday:** Domain Security Policies (capabilities) + Functional Areas (menu)

### Arquitectura v5

```
┌────────────────────────────────────────────────────────────┐
│ PERMISSIONS (capabilities flat, no UX-driven)              │
│   supply_chain.proveedor.view                               │
│   supply_chain.proveedor.create                             │
│   supply_chain.recepcion_mp.edit                            │
└────────────────────────────────────────────────────────────┘
              ▲
              │ (M2M agrupamiento)
              │
┌────────────────────────────────────────────────────────────┐
│ PERMISSION_TEMPLATE (role reutilizable, system o custom)   │
│   name: "Rol de Compras"                                    │
│   permissions: [supply_chain.proveedor.*,                   │
│                 supply_chain.recepcion_mp.view, ...]        │
└────────────────────────────────────────────────────────────┘
              ▲
              │ (FK opcional)
              │
┌────────────────────────────────────────────────────────────┐
│ CARGO (estructura organizacional)                           │
│   code: 'COORD_COMPRAS'                                     │
│   name: 'Coordinador de Compras'                            │
│   nivel_jerarquico: 'TACTICO'    ← metadata PURA            │
│   area: FK → Area                                           │
│   permission_template: FK → PermissionTemplate (opcional)   │
│   custom_permissions_granted: M2M → Permission (+overrides) │
│   custom_permissions_denied:  M2M → Permission (-overrides) │
└────────────────────────────────────────────────────────────┘
              ▲
              │
┌────────────────────────────────────────────────────────────┐
│ USER                                                        │
│   cargo: FK → Cargo (hereda template + overrides del cargo) │
│   custom_permissions_granted: M2M (overrides personales)    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ NAVIGATION LAYOUT (UX config, INDEPENDIENTE de permissions)│
│   SIDEBAR_LAYERS:                                           │
│     NIVEL_CADENA → [supply_chain, production_ops, ...]      │
│   MODULE_MENU:                                              │
│     supply_chain: {                                         │
│       tabs: [                                               │
│         proveedores: {                                      │
│           required_permissions: ['supply_chain.proveedor.*']│
│           sub_items: [registro, importacion]                │
│         }                                                   │
│       ]                                                     │
│     }                                                       │
└────────────────────────────────────────────────────────────┘
```

### Resolución de permisos efectivos

```python
def compute_user_effective_permissions(user) -> set[str]:
    permissions = set()

    # 1. Template del cargo
    if user.cargo and user.cargo.permission_template:
        permissions |= set(user.cargo.permission_template.permissions.all())

    # 2. Overrides granted del cargo
    permissions |= set(user.cargo.custom_permissions_granted.all())

    # 3. Overrides denied del cargo (restar)
    permissions -= set(user.cargo.custom_permissions_denied.all())

    # 4. Overrides granted del user
    permissions |= set(user.custom_permissions_granted.all())

    return permissions
```

### Construcción del sidebar (derivada)

```python
def build_sidebar(user):
    user_perms = compute_user_effective_permissions(user)
    sidebar = []

    for layer in SIDEBAR_LAYERS:
        layer_modules = []
        for module_code in layer.module_codes:
            if not module_is_accessible(module_code, user_perms):
                continue

            tabs = []
            for tab_def in MODULE_MENU[module_code].tabs:
                if any(p in user_perms for p in tab_def.required_permissions):
                    tabs.append(render_tab(tab_def, user_perms))

            if tabs:
                layer_modules.append({'code': module_code, 'tabs': tabs})

        if layer_modules:
            sidebar.append({'layer': layer.code, 'modules': layer_modules})

    return sidebar
```

---

## Cambios concretos por archivo

### Backend

| Archivo | Cambio |
|---|---|
| `apps/core/models/models_rbac_v5.py` | **NUEVO**: `Permission`, `PermissionTemplate` |
| `apps/core/models/models_user.py` | `Cargo.permission_template` FK, `Cargo.custom_permissions_*` M2M |
| `apps/core/models/models_user.py` | Deprecar progresivamente `CargoSectionAccess` (mantener backfill) |
| `apps/core/utils/rbac.py` | Nueva fn `compute_user_effective_permissions` |
| `apps/core/utils/navigation.py` | **NUEVO**: construye sidebar desde permissions + layout config |
| `apps/core/signals/rbac_signals.py` | Eliminar lógica por `nivel_jerarquico`. Signal crea `CargoSectionAccess` con permisos vacíos o según template explícito. |
| `apps/core/viewsets_config.py` | `_sidebar_inner` refactor para usar navigation layout config |
| `apps/core/management/commands/migrate_rbac_v4_to_v5.py` | **NUEVO**: migración one-shot de data existente |
| `apps/core/management/commands/seed_permission_templates.py` | **NUEVO**: templates por industria |

### Frontend

| Archivo | Cambio |
|---|---|
| `hooks/usePermissions.ts` | `canDo(module, capability, action)` — capability es flat |
| `routes/SectionGuard.tsx` | Pide capability, no tab/section node |
| `routes/modules/*.routes.tsx` | Reemplazar tab_code por capability code en guards |
| `constants/permissions.ts` | Enumerar capabilities (generado desde backend) |
| `components/Sidebar.tsx` | Consume navigation tree ya filtrado (backend resuelve) |

### Migraciones

1. **Migración 1 — Crear modelos nuevos**: `Permission`, `PermissionTemplate`
2. **Migración 2 — Backfill**: generar `Permission` rows a partir de combinaciones `(module, section, action)` existentes
3. **Migración 3 — Crear templates seed**: 5-6 templates por industria (Gerente, Coordinador, Analista, Operativo, etc.)
4. **Migración 4 — Asignar templates a cargos existentes**: mapping heurístico basado en `nivel_jerarquico` + `code`
5. **Migración 5 — Deprecar nivel_jerarquico como auto-permiso**: signal ya no lo usa

---

## Plan de ejecución (Sprint dedicado)

### Fase A — Modelos + migración shadow (2 días)
- Crear `Permission`, `PermissionTemplate` en paralelo a `CargoSectionAccess`
- Migración backfill que llena v5 desde v4 (sin romper)
- Tests: v5 devuelve los mismos permisos efectivos que v4

### Fase B — Navigation layout config (1 día)
- Extraer sidebar structure a YAML/JSON estático por módulo
- Implementar `build_sidebar()` que consume layout + permissions
- Feature flag: `RBAC_V5_SIDEBAR=False` por default

### Fase C — FE migración guards (1 día)
- Generar `constants/capabilities.ts` desde backend
- Reemplazar `withFullGuard(m, t)` → `withCapabilityGuard(cap)`
- Feature flag FE: `rbacV5Enabled` (toggle per-tenant para rollout gradual)

### Fase D — Rollout per-tenant (1 día)
- Activar `RBAC_V5_SIDEBAR=True` en tenant_demo
- Smoke tests + validación con admin del tenant
- Monitoreo 48h

### Fase E — Deprecación v4 (cuando todos los tenants estén en v5)
- Eliminar signal auto-permisos por nivel
- Eliminar `CargoSectionAccess` (queda como read-only tabla histórica)
- Eliminar `compute_user_rbac` v4.1

**Duración total:** 4-5 días de un dev enfocado.

---

## Desacoples críticos del refactor

### 1. `nivel_jerarquico` queda como metadata pura

**Antes (v4.1):**
```python
# Signal asignaba permisos según nivel:
ESTRATEGICO → can_view/create/edit/delete = True
TACTICO     → can_view/edit = True
OPERATIVO   → can_view = True
```

**Después (v5.0):**
```python
# Cargo asigna PermissionTemplate explícito (opcional).
# Nivel jerárquico se usa SOLO para:
#   - Organigrama visual
#   - Reporting (n cargos por nivel)
#   - Bandas salariales (nómina)
#   - Orden en selectores jerárquicos
```

### 2. Tabs/Sections no son permission units

**Antes:** `TabSection` tiene `CargoSectionAccess` rows. Cambiar el menu = migrar permisos.

**Después:** `Permission` es flat (`supply_chain.proveedor.create`). El menu es config UX que referencia capabilities. Renombrar un tab no toca permisos.

### 3. `Rol` (legacy) se deprecia en favor de `PermissionTemplate`

**Antes:** `Rol` y `Cargo` conviven con responsabilidades superpuestas.

**Después:** `PermissionTemplate` es el único "role template". `Cargo` es estructura organizacional. Relación N:1 clara.

---

## Impacto en módulos LIVE actuales

| Módulo | Estado tras v5 |
|---|---|
| `fundacion` | Sin cambio funcional; permisos migrados a v5 automáticamente |
| `gestion_documental` | Sin cambio funcional |
| `catalogo_productos` | Sin cambio funcional |
| `mi_equipo` | Sin cambio funcional |
| `supply_chain` | Sin cambio funcional; config de menu queda en layout.yaml |
| `audit_system` | Sin cambio funcional |
| `workflow_engine` | Sin cambio funcional |
| `configuracion_plataforma` | Gana pestaña "Roles y Permisos" con UI de templates |

**Módulos futuros (Production Ops, HSEQ, Sales CRM, Talent Hub, etc.):**
- Nacen directo en v5
- Definen sus capabilities en el seed
- Declaran su layout de menu independiente
- Cero deuda arquitectónica

---

## Métricas de éxito del refactor

- **100% de cargos** tienen un `PermissionTemplate` asignado (o explícitamente "sin template")
- **0 uso** de `nivel_jerarquico` para decisiones de authorization
- **0 duplicación** cuando 10 cargos comparten permisos (1 template, 10 cargos)
- **Cambios de UX del sidebar** no requieren migración de permisos
- **Tests cubriendo >80%** del módulo `apps.core.utils.rbac`
- **Documentación** para desarrolladores externos (permite que contribuyan sin tocar arquitectura)

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Migración pierde permisos | Media | Shadow mode + comparación automática v4 vs v5 por user |
| Tenants en producción se rompen | Alta si no hay feature flag | Feature flag per-tenant + rollout gradual |
| Developer experience empeora | Baja | UI de admin para templates + docs buenos |
| Rendimiento degrada | Media | Cache de `compute_user_effective_permissions` |
| Admin no entiende templates | Alta si no se educa | Wizard guiado + seed con 5 templates pre-configurados |

---

## Decisión diferida

- **ABAC conditions** (ej: "Manager ve salario solo de su equipo"): posponer a v5.1 o library CASL/OSO cuando haya necesidad real.
- **Permisos de row-level** (ej: "solo su propio registro"): manejar con `get_queryset()` override por viewset hoy; formalizar con OPA/Cedar cuando haya 10+ clientes.
- **UI drag-and-drop para templates**: nice-to-have post-v5.0.

---

## Referencias de mercado

- [Salesforce Permission Sets architecture](https://trailhead.salesforce.com/content/learn/modules/data_security/data_security_profile_permset)
- [Odoo Groups and Access Rights](https://www.odoo.com/documentation/18.0/developer/tutorials/access_rights.html)
- [Auth0 Fine-Grained Authorization (FGA)](https://auth0.com/fine-grained-authorization)
- [Google Zanzibar paper](https://research.google/pubs/pub48190/)
- [CASL (JS/TS library)](https://casl.js.org/)

---

## Registro en sistema de hallazgos

Ver `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md` → `H-S7-rbac-v5-refactor`.
