# Admin Finance — Modulo C2

**Capa:** C2 (Organizacion) | **Grupo visual:** NIVEL_ORG | **Color:** `#F59E0B`

## Sub-apps (4)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| presupuesto | `admin_finance_presupuesto` | Presupuesto anual, rubros, ejecucion presupuestal |
| tesoreria | `admin_finance_tesoreria` | Flujo de caja, cuentas bancarias, conciliaciones |
| activos_fijos | `admin_finance_activos_fijos` | Inventario de activos, depreciacion, mantenimiento |
| servicios_generales | `admin_finance_servicios_generales` | Servicios internos, contratos de servicio |

## Modelos: 20

## Backend
- **Path:** `backend/apps/admin_finance/`
- **API prefix:** `/api/admin-finance/`

## Frontend
- **Feature:** `frontend/src/features/admin-finance/`
- **Ruta:** `/admin-finance`

## Dependencias cross-module
- Lee de: supply_chain (ordenes de compra), talent_hub (nomina)
- Alimenta: accounting (movimientos contables)

## Estado
Esqueleto backend creado. Frontend pendiente de implementacion.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
