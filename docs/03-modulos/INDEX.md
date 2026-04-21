# Índice — Módulos
**Última actualización:** 2026-04-20

Documentación de módulos de negocio. **Solo se mantienen activamente los módulos LIVE.**
Los módulos DORMIDOS tienen docs en `dormidos/` — se actualizan el día que se activen.

---

## Módulos LIVE (activos en base.py TENANT_APPS)
| Módulo | Directorio | Capa | Docs |
|--------|-----------|------|------|
| Gestión Documental | `gestion-documental/` | CT | arquitectura, reglas TRD, plantillas |
| Workflow Engine | `workflow-engine/` | CT | descripción, auditoría E2E firma |
| Audit System | `audit-system/` | C0 | descripción general |
| Supply Chain | `supply-chain/` | C2 | descripción, roadmap |
| Mi Equipo (Talent Hub) | `talent-hub/` | C2 | completo, firma digital, onboarding, gamificación |
| Admin Global | `admin-global/` | Portal | panel superusuarios |

> Para inventario técnico exhaustivo (apps Django, modelos, migraciones): ver `docs/01-arquitectura/apps-django.md`
> Para estado LIVE vs DORMIDO: ver `docs/01-arquitectura/perimetro-live.md`

---

## Módulos DORMIDOS (diseño preservado, sin mantenimiento activo)
Ubicados en `dormidos/` — no se tocan hasta su sprint de activación.
| Módulo | Directorio |
|--------|-----------|
| Planeación Estratégica | `dormidos/planeacion-estrategica/` |
| Gestión de Riesgos | `dormidos/riesgos/` |

---

## Regla de mantenimiento
- Módulo LIVE → su carpeta se mantiene actualizada con cada sprint
- Módulo nuevo activado → mover de `dormidos/` a raíz, revisar y actualizar docs
- Módulo dormido nuevo → crear carpeta en `dormidos/` con doc de diseño inicial
Última actualización: 2026-04-20
