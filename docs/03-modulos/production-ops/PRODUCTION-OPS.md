# Production Ops — Modulo C2

**Capa:** C2 (Operaciones) | **Grupo visual:** NIVEL_OPS | **Color:** `#10B981`

## Sub-apps (4)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| recepcion | `production_ops_recepcion` | Recepcion de materia prima, inspeccion de calidad |
| procesamiento | `production_ops_procesamiento` | Ordenes de produccion, lotes, trazabilidad |
| producto_terminado | `production_ops_producto_terminado` | Almacen PT, liberacion de lotes, despacho |
| mantenimiento | `production_ops_mantenimiento` | Mantenimiento preventivo/correctivo de equipos |

## Modelos: 28

## Backend
- **Path:** `backend/apps/production_ops/`
- **API prefix:** `/api/production-ops/`

## Frontend
- **Feature:** `frontend/src/features/production-ops/`
- **Ruta:** `/production-ops`

## Dependencias cross-module
- Lee de: supply_chain (materias primas), talent_hub (operarios)
- Alimenta: sales_crm (producto terminado), logistics_fleet (despachos)

## Estado
Esqueleto backend creado. Frontend pendiente de implementacion.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
