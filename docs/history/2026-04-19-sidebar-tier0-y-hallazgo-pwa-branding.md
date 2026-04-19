# Sesión 2026-04-19 (vespertina) — Sidebar TIER 0 polish + Hallazgo PWA branding

> Segunda sesión del día. La matutina cerró con `4db45d11` (Catálogo Productos
> S5 completo). Esta sesión cubre validación visual post-deploy + un fix de
> consistencia en el sidebar + registro de deuda arquitectónica del branding PWA.

## Commits del día (sólo esta sesión)

| Commit | Descripción | CI |
|--------|-------------|----|
| `f908e678` | style(sidebar): TIER 0 labels estructurales para layers multi-módulo | ⏳ CI cancelled (superseded) / ✅ CodeQL verde |
| `fa03a318` | docs(hallazgos): registrar H-S5-pwa-branding-unificado (multi-tenant) | ⏳ CI + CodeQL in_progress al cierre |

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** 20 (sin cambio).
- **Versión frontend:** 5.7.1 (bump por polish UI del sidebar).
- **Frontend build:** ✅ `npm run build` OK en 9m 58s (validado local).
- **TypeScript:** ✅ `tsc --noEmit` sin errores.
- **Tests backend:** sin cambios en cobertura (esta sesión no tocó backend Python).
- **Deploy a VPS:** ❌ **NO aplicado** — esperando CI verde de `fa03a318` al cierre.
- **Branding PWA productivo:** sigue mostrando "StrateKaz App" genérico en desktop
  app para todos los tenants afectados. Política: no workaround, fix de fondo post-S6.

## Decisiones tomadas (no reabrir)

### 1. Sidebar — TIER 0 siguiendo patrón industria (Material/Atlassian/Fluent)

Los encabezados de layers multi-módulo (`is_category: True`) pasan de
"botón-secundario" a **label estructural**. Tres tiers claros:

| Tier | Quién | Estilo |
|------|-------|--------|
| TIER 0 | Layers con 2+ módulos (hoy: Infraestructura) | `text-[10.5px] uppercase tracking-[0.08em] font-semibold`, gray-400, sin fondo hover, sin separador |
| TIER 1 | Páginas (Dashboard, Mi Portal) + layers absorbidos 1-módulo (Fundación, Gestión de Personas, etc.) + módulos expandibles | `text-sm font-medium`, Title Case, icono h-5 w-5 |
| TIER 2 | Tabs anidados dentro de módulos | `text-sm font-normal`, indentado con `border-l-2` |

Razón: con L25+ activándose pronto, ~42% de layers serán multi-módulo. El
patrón "label estructural" escala como norma, no como excepción. Alineado
con Material Design, Atlassian, Fluent, Shadcn, Linear, Notion, GitHub.

Opción Híbrida (Opción 3) aplicada inicialmente fue descartada tras
análisis contra patrones de industria: mantener `font-semibold` + Title Case
+ separador en el label competiría visualmente con los items TIER 1. La
industria separa claramente label (structural) vs item (actionable).

### 2. PWA branding — política: NO workaround en producción

El modelo `Tenant` duplica branding: 5 campos PWA (`pwa_name`, `pwa_short_name`,
`pwa_description`, `pwa_theme_color`, `pwa_background_color`) viven en paralelo
al branding core (`name`, `nombre_comercial`, `slogan`, `primary_color`,
`secondary_color`). Viola DRY y es propenso a desincronización.

**Caso visible**: Grasas y Huesos del Norte tiene `pwa_name="StrateKaz App"`,
`pwa_theme_color="#000000"`, `pwa_background_color="#ec268f"` (pink StrateKaz)
— data quality issue. Resultado: desktop app PWA muestra "StrateKaz App" con
logo amarillo StrateKaz en lugar del branding real del tenant.

**Decisión 2026-04-19**: NO se aplica workaround en prod (ni one-liner en
Django shell, ni management command paliativo, ni data-fix manual). Política
de desarrollo: **solución de fondo o deuda documentada, sin punto medio**.

Motivo: aplicar workaround en prod crea falsa sensación de resolución; la
deuda se evapora de la memoria del equipo y el refactor pierde urgencia.
El síntoma visible (branding PWA genérico) queda activo como recordatorio
de la deuda abierta.

**Alcance**: el problema es **multi-tenant**, no aislado. TODOS los tenants
(presentes y futuros) están afectados porque el data model fuerza la
duplicación. Fix por tenant no escala.

Solución de fondo scheduled: sprint dedicado **"Branding Unificado v2"**
post-S6 Supply Chain. Detalle en `H-S5-pwa-branding-unificado`.

### 3. Política operativa registrada como feedback memory

Creado `~/.claude/projects/.../memory/feedback_no_workarounds.md` para que
futuras sesiones respeten la política. Incluye señales de cuándo estoy a
punto de violarla y escalada correcta ante un issue arquitectónico.

## Deuda consciente activa

### Nueva en esta sesión

- **H-S5-pwa-branding-unificado** (MEDIA) — refactor 1-2d post-S6. Elimina
  los 5 campos duplicados del modelo Tenant, computa manifest desde core,
  actualiza `TabPwa.tsx`, data migration con rescue/override, verificación
  visual en ≥2 tenants productivos. Ver hallazgo completo en
  `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md`.

### Heredada (no atendida esta sesión)

- Toda la deuda de la sesión matutina (H-S4-views-refactor, H-S4-tipomateriaprima,
  H-S4-reversal, H-S5-tipo-sin-behavior, H-S5-searchable-select,
  H-S5-estadisticas-no-usadas, H-S5-servicios-precio, H-S5-sentry-*).
  Ver `docs/history/2026-04-19-catalogo-productos-s5-completo.md`.

## Próximo paso claro

1. Esperar CI verde de `fa03a318` → deploy VPS sólo sidebar (Opción C de `deploy.md`).
2. Validación visual en producción del sidebar (label INFRAESTRUCTURA tipo
   Material/Atlassian).
3. Siguiente sesión: arrancar **S6 Supply Chain** (gestion_proveedores UI, o
   activar almacenamiento/recepcion/liquidaciones en `base.py`, o refactor
   deuda L17/L20 — decidir en `/buenos-dias`).
4. Post-S6: **sprint Branding Unificado v2** para cerrar H-S5-pwa-branding.

## Archivos clave tocados

### Frontend
- `frontend/src/layouts/Sidebar.tsx` — Branch `is_category` refactorizado
  a estilo label estructural. Removido separador horizontal. Reducidos
  tamaños de icon/chevron. Color `text-gray-400` muted. Sin fondo hover,
  sólo cambio de color de texto.
- `frontend/package.json` — bump `5.7.0 → 5.7.1`.

### Docs
- `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md` — agregado hallazgo
  H-S5-pwa-branding-unificado con severidad, alcance multi-tenant, síntoma,
  error de fondo, patrones de industria, solución propuesta, esfuerzo,
  trigger de activación, política NO workaround, criterio de cierre.
  También actualizado el "Orden de ataque sugerido" (fila 16).

### Memory (scratch pad Claude, no commiteado)
- `feedback_no_workarounds.md` — nueva entrada feedback con política
  "no parches en prod". Incluye why, cuándo aplicar, señales de violación,
  escalada correcta.
- `MEMORY.md` — agregado puntero al feedback nuevo.

## Hallazgos abiertos

- **H-S5-pwa-branding-unificado** — Modelo Tenant duplica 5 campos de
  branding PWA con branding core. Afecta a TODOS los tenants (no caso
  aislado). Refactor de fondo 1-2 días scheduled post-S6. Severidad
  **MEDIA** (arquitectónico, no bloquea funcionalidad pero genera data
  quality issues recurrentes).

## Nota de cierre

Sesión corta con alto valor: un fix de UX alineado con industria (sidebar)
y una decisión arquitectónica importante documentada correctamente (política
no-workaround, hallazgo PWA con alcance real). El branding PWA feo en
producción es intencional al cierre de esta sesión — es el recordatorio
visible de la deuda hasta el sprint Branding v2.
