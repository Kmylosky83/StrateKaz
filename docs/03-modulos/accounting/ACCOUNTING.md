# Accounting — Modulo C2

**Capa:** C2 (Organizacion) | **Grupo visual:** NIVEL_ORG | **Color:** `#F59E0B`

## Sub-apps (4)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| config_contable | `accounting_config_contable` | Plan de cuentas, centros de costo, periodos contables |
| movimientos | `accounting_movimientos` | Asientos contables, comprobantes, auxiliares |
| informes_contables | `accounting_informes_contables` | Balance general, estado de resultados, libros oficiales |
| integracion | `accounting_integracion` | Puentes con facturacion electronica, DIAN, bancos |

## Modelos: 16

## Backend
- **Path:** `backend/apps/accounting/`
- **API prefix:** `/api/accounting/`

## Frontend
- **Feature:** `frontend/src/features/accounting/`
- **Ruta:** `/accounting`

## Dependencias cross-module
- Lee de: admin_finance (tesoreria), supply_chain (compras), sales_crm (facturacion)
- Patron: `PositiveBigIntegerField` + `apps.get_model()`

## Estado
Esqueleto backend creado. Frontend pendiente de implementacion.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
