---
name: config-admin-module
description: Módulo Configuración de Plataforma + decisión arquitectónica Cascada V2.1 (NIVEL_WORKFLOWS + indicadores activos)
type: project
---

## Módulo Configuración de Plataforma (`configuracion_plataforma`)

**Estado: v5.3.0 DEPLOYED** — 3 tabs (general, catalogos, conexiones) — BUG ACTIVO en general tab

### Arquitectura V2.1 (confirmada 2026-03-17)

```
TRANSVERSAL (sidebar, últimos dos items)
├── NIVEL_WORKFLOWS  → workflow_engine (orden 92) — NUEVO nivel propio
└── NIVEL_CONFIG     → configuracion_plataforma (orden 97)
```

**Decisión clave:** Workflows NO es configuración ni infraestructura.
Es un motor de ejecución diario que alimenta todos los C2 (HSEQ→investigaciones, Cumplimiento→actualizaciones, Documental→aprobaciones, Talent→contratación, Compras→OC).
RBAC independiente: diseñador ≠ ejecutor ≠ monitor.

### Config Indicadores + Exportación — ACTIVAR YA

**Why:** Los indicadores se configuran en Fundación (cada proceso necesita KPIs). Esperar Level 45 no tiene sentido empresarial.

**How:** Opción B — Descomentar solo `apps.analytics.config_indicadores` y `apps.analytics.exportacion_integracion` en base.py. Modelos solo dependen de `core.Cargo`. Frontend ya tiene código 95% listo en `features/analytics/`. Reemplazar EmptyStates en config-admin.

**NO mover modelos** — riesgo de migraciones multi-tenant alto vs beneficio bajo.

### Secciones actuales (BD verificada 2026-03-18)

| Tab | Sección | Estado | Consume |
|-----|---------|--------|---------|
| General | modulos | 🔴 Crash React #31 | `/core/system-modules/tree/` |
| General | consecutivos | 🔴 Crash (mismo tab) | `/gestion-estrategica/organizacion/consecutivos/` |
| Catálogos | catalogos | ⚠️ Muestra ModulosSection | 11 endpoints (6 apps) |
| Conexiones | integraciones | ⚠️ Muestra ModulosSection | `/gestion-estrategica/configuracion/integraciones-externas/` |

**Bug principal:** `DynamicSections` o `ConfigAdminTab` no rutea correctamente las secciones por tab.
Los tabs `catalogos` y `conexiones` renderizan `ModulosSection` (del tab `general`) en vez de sus propias secciones.
El tab `general` crashea con React error #31 (object as React child) — viene de `vendor-dnd` chunk.
**Backend 100% OK** — tree API, BD, seeds todos verificados y correctos.

### Secciones futuras (cuando se active)
| Tab | Sección | Estado |
|-----|---------|--------|
| Conexiones | automatizaciones | ⬜ Dashboard resumen + link a /workflows |
| Conexiones | importacion_exportacion | ⬜ Activar (analytics/exportacion_integracion) |
| Avanzado | config_indicadores | ⬜ Activar (analytics/config_indicadores) |
| Avanzado | plantillas_notificacion | ⬜ Pendiente |
| Avanzado | auditoria_configuracion | ⬜ Pendiente |

### Contexto técnico
- **Ruta:** `/configuracion-admin` → `/configuracion-admin/general`
- **Sidebar:** `NIVEL_CONFIG` (último, color `#64748B`, icono `Settings`)
- **Backend:** NO nuevo backend — reutiliza ViewSets existentes
- **Frontend:** Hooks propios via `createApiClient` (no cross-feature import)
- **Seed category BUG:** usa `INFRASTRUCTURE` pero `CATEGORY_CHOICES` no lo incluye
- **Tab codes en BD:** `general`, `catalogos`, `conexiones` (seed actualizado 2026-03-18, antes era `catalogos_tab`)
- **Shared hooks:** `useModulesTree`, `useToggleModule/Tab/Section` → `@/hooks/useModules` (re-export desde gestion-estrategica)
- **Duplicate hooks eliminados:** `useModuleTree` removido de `useConfigAdmin.ts` — usar shared hooks
- **Type source of truth:** `modules.types.ts` en gestion-estrategica (NO duplicar en config-admin)
