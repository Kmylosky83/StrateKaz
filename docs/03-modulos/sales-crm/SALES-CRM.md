# Sales CRM — Modulo C2

**Capa:** C2 (Operaciones) | **Grupo visual:** NIVEL_OPS | **Color:** `#10B981`

## Sub-apps (4)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| gestion_clientes | `sales_crm_gestion_clientes` | Clientes, contactos, segmentacion, portal cliente |
| pipeline_ventas | `sales_crm_pipeline_ventas` | Oportunidades, cotizaciones, negociaciones |
| pedidos_facturacion | `sales_crm_pedidos_facturacion` | Pedidos, facturacion electronica DIAN |
| servicio_cliente | `sales_crm_servicio_cliente` | PQRS, tickets, satisfaccion, SLA |

## Modelos: 37

## Backend
- **Path:** `backend/apps/sales_crm/`
- **API prefix:** `/api/sales-crm/`

## Frontend
- **Feature:** `frontend/src/features/sales-crm/`
- **Ruta:** `/sales-crm`

## Portal Clientes
- Usuarios portal: `cargo.code === 'CLIENTE_PORTAL'`
- FK: `core.User.cliente` → `gestion_clientes.Cliente`
- Layout: AdaptiveLayout → PortalLayout → `/cliente-portal`

## Dependencias cross-module
- Lee de: production_ops (producto terminado), supply_chain (inventario)
- Alimenta: accounting (facturacion), admin_finance (cartera)

## Estado
Backend con gestion_clientes funcional. Portal clientes implementado. Pipeline y facturacion pendientes.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
