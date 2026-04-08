---
name: Mi Equipo is 100% independent from Talent Hub
description: Mi Equipo (L20) has its own backend sub-apps, models, tables (31), URLs — zero dependency on talent_hub. Verified 2026-03-19.
type: feedback
---

Mi Equipo (L20) es **100% independiente** de Talent Hub (L60). Tiene sus propias sub-apps, modelos, tablas y migraciones.

**Why:** Mi Equipo se despliega en L20. Talent Hub es L60. El acoplamiento impedía que Mi Equipo funcionara y generaba errores de Sentry cuando talent_hub no estaba instalado.

**How to apply:**
- **Backend**: 4 sub-apps viven en `apps/mi_equipo/` (NO en talent_hub):
  - `apps.mi_equipo.estructura_cargos`
  - `apps.mi_equipo.seleccion_contratacion`
  - `apps.mi_equipo.colaboradores`
  - `apps.mi_equipo.onboarding_induccion`
- **Tablas**: prefijo `mi_equipo_` (31 tablas verificadas), NO `talent_hub_`
- **Migraciones**: propias en cada sub-app (0001_initial, etc.), aplicadas en Docker + VPS (3 schemas)
- **URLs backend**: `/api/mi-equipo/estructura-cargos/`, `/api/mi-equipo/seleccion/`, `/api/mi-equipo/empleados/`, `/api/mi-equipo/onboarding/`
- **URLs frontend API**: todas apuntan a `/mi-equipo/`, NO a `/talent-hub/`
- **RBAC**: mi_equipo es SystemModule propio, NO tab de talent_hub
- **Frontend**: barrels en `mi-equipo/hooks/`, `mi-equipo/types/` re-exportan desde `talent-hub/hooks/`
- **Novedades**: queda en `talent_hub` (L60, comentada en INSTALLED_APPS)
- **Services**: `talent_hub.services.ContratacionService` y `NotificadorTH` siguen en talent_hub (compartidos, acceden via `apps.get_model()`)
- **ESS (Mi Portal)**: `employee_self_service.py` importa de `apps.mi_equipo.colaboradores`, apps L60 con try/except
- **people_analytics.py**: importa de `apps.mi_equipo.colaboradores`
- **talent_hub/tasks.py**: importa HistorialContrato y Colaborador de `apps.mi_equipo.*`
- **core/signals**: VacanteActiva importa de `apps.mi_equipo.seleccion_contratacion`
- NUNCA crear imports directos desde `apps.talent_hub.*` para modelos de las 4 sub-apps
- **Commit**: `b166fc63` — refactor(mi-equipo): desacoplar backend 100% de talent-hub — modelos propios
