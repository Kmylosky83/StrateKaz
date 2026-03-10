# Logistics & Fleet — Modulo C2

**Capa:** C2 (Operaciones) | **Grupo visual:** NIVEL_OPS | **Color:** `#10B981`

## Sub-apps (2)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| gestion_flota | `logistics_fleet_gestion_flota` | Vehiculos, documentos, mantenimiento preventivo, GPS |
| gestion_transporte | `logistics_fleet_gestion_transporte` | Rutas, conductores, despachos, PESV |

## Modelos: 16

## Backend
- **Path:** `backend/apps/logistics_fleet/`
- **API prefix:** `/api/logistics-fleet/`

## Frontend
- **Feature:** `frontend/src/features/logistics-fleet/`
- **Ruta:** `/logistics-fleet`

## Regulaciones colombianas
- PESV (Plan Estrategico de Seguridad Vial) — Resolucion 40595 de 2022
- Requisitos RUNT para conductores
- Revision tecnico-mecanica obligatoria

## Dependencias cross-module
- Lee de: talent_hub (conductores como colaboradores), motor_riesgos (riesgos_viales)
- Alimenta: supply_chain (transporte de mercancia)

## Estado
Esqueleto backend creado. Frontend pendiente de implementacion.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
