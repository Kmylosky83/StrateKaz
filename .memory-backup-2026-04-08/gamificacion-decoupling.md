---
name: gamificacion-decoupling
description: Juego SST desacoplado de talent_hub — DESACTIVADO en INSTALLED_APPS, URLs, seeds y frontend. Pendiente refactor completo.
type: project
---

## Juego SST: Desacoplamiento y Desactivación

### Estado actual (2026-03-22)
- **DESACTIVADO** en `INSTALLED_APPS` (comentado como otros módulos futuros)
- **DESACTIVADO** en `config/urls.py`
- **DESACTIVADO** en `deploy_seeds_all_tenants.py`
- **DESACTIVADO** en frontend: tab "Héroes SST" en MiPortal + ruta `/mi-portal/juego-sst`
- **Migraciones NUNCA generadas** — el módulo necesita refactor completo antes de activar

**Why:** El juego fue extraído de `talent_hub/formacion_reinduccion` a `apps.gamificacion.juego_sst` como módulo independiente, pero necesita un refactor inmenso antes de ser funcional. No debe estar activo.

**How to apply:** Tratar como cualquier otro módulo futuro (L25+). No activar hasta completar el refactor.

### Ubicación del código
```
backend/apps/gamificacion/juego_sst/   # 5 modelos, 6 actions, 7 serializers
frontend/src/features/sst-game/        # Componentes React + Phaser 3
```

### Nota
`GamificacionColaborador` y `BadgeColaborador` de formación (capacitaciones, no juego) siguen en `formacion_reinduccion/models.py` — son modelos de gamificación de FORMACIÓN (L60), no del juego.
