---
name: TypeScript Errors Policy
description: Política fix-on-activate para errores tsc por nivel de cascada — estado post-limpieza 2026-03-28, patrones comunes, deuda por nivel
type: project
---

## Estado post-limpieza (2026-03-28)

Oleada 1 completada: 66 archivos corregidos, -319 errores en módulos LIVE.

| Métrica | Antes | Después |
|---------|-------|---------|
| Errores totales tsc | ~2,400 | ~2,005 |
| Errores en LIVE (L0-L20) | 1,403 | ~1,084 |
| Archivos LIVE con error | 265 | ~256 |

El **build de Vite sí pasa** (usa esbuild, no tsc). El CI marca tsc como paso informativo, no bloqueante.

## Errores por nivel de cascada

### LIVE (L0-L20) — corregir progresivamente

| Nivel | Errores est. | Acción |
|-------|-------------|--------|
| L0 Core + Shared + Portales | ~200 | Al tocar archivo, corregir |
| L10 Fundación + Config | ~130 | Al tocar archivo, corregir |
| L12 Audit + Workflows + Analytics base | ~50 | Al tocar archivo, corregir |
| L15 Gestión Documental | ~21 | Al tocar archivo, corregir |
| L20 Talent Hub (selección, off-boarding) | ~46 | Al tocar archivo, corregir |
| **TOTAL LIVE** | **~447** | |

### APAGADO (L25+) — fix-on-activate obligatorio

| Nivel | Feature | Errores est. |
|-------|---------|-------------|
| L25 | Planeación Estratégica | ~364 |
| L25 | Analytics Avanzado (Dashboard Builder, Generador Informes, etc.) | ~253 |
| L30 | Auditorías Internas + Motor Cumplimiento + Motor Riesgos | ~100 |
| L35 | HSEQ + Planificación Operativa | ~200 |
| L40 | Supply Chain | ~80 |
| L45 | Sales CRM + Logistics + Production Ops | ~150 |
| L50 | Accounting + Admin Finance | ~200 |
| DEFER | Portales proveedor/cliente + juego SST | ~50 |
| **TOTAL APAGADO** | | **~1,558** |

## Patrones comunes de error

| Patrón | Error TS | Fix |
|--------|----------|-----|
| Hooks retornan `unknown` | TS18046 | `useQuery<Type>()` o `asList<Type>()` |
| KpiCard: `title`→`label`, `variant`→`color` | TS2322 | Renombrar props |
| Button: `loading`→`isLoading`, `icon`→`leftIcon` | TS2322 | Renombrar props |
| ConfirmDialog: `confirmLabel`→`confirmText`, `description`→`message` | TS2322 | Renombrar props |
| ECharts `params` unknown | TS18046 | `(params: any)` en formatters |
| Unused variables `_xxx` | TS6133 | Eliminar o quitar `_` si se usa |
| Implicit `any` params | TS7006 | Agregar type annotation |
| Property renames en tipos | TS2551 | Usar nombre sugerido |
| `size: "medium"`→`"md"` | TS2322 | Usar enum correcto |
| Framer Motion types | TS2322 | Cast ease como tuple, type como literal |

## Política: Fix-on-Activate

**NO arreglar errores tsc en código APAGADO.** Al activar cada nivel:

1. `npx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "src/features/<modulo>"`
2. Aplicar patrones comunes (tabla arriba)
3. Verificar que el módulo compila limpio
4. Commit separado: `fix(modulo): corregir errores TypeScript pre-activación`

Para código LIVE: **al abrir un archivo con errores tsc, corregirlos como parte del PR.**

**Why:** Arreglar 1,500+ errores en código apagado es esfuerzo desperdiciado — ese código puede cambiar antes de activarse.

**How to apply:** Agregar check tsc como paso previo en el checklist de activación de cada nivel.
