# Supply Chain — Modulo C2

**Capa:** C2 (Operaciones) | **Grupo visual:** NIVEL_OPS | **Color:** `#10B981`

## Sub-apps (5)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| catalogos | `supply_chain_catalogos` | Categorias, unidades de medida, bodegas |
| gestion_proveedores | `supply_chain_gestion_proveedores` | Proveedores, evaluaciones, documentos, portal |
| compras | `supply_chain_compras` | Solicitudes, ordenes de compra, recepciones |
| almacenamiento | `supply_chain_almacenamiento` | Inventario, movimientos, stock minimo/maximo |
| programacion_abastecimiento | `supply_chain_programacion_abastecimiento` | MRP basico, programacion de compras |

## Modelos: 48

## Backend
- **Path:** `backend/apps/supply_chain/`
- **API prefix:** `/api/supply-chain/`

## Frontend
- **Feature:** `frontend/src/features/supply-chain/`
- **Ruta:** `/supply-chain`

## Portal Proveedores
- Usuarios portal: `cargo.code === 'PROVEEDOR_PORTAL'`
- 4 tipos: MATERIA_PRIMA, PRODUCTOS_SERVICIOS, UNIDAD_NEGOCIO, TRANSPORTISTA
- FK: `core.User.proveedor` → `gestion_proveedores.Proveedor`
- Layout: AdaptiveLayout → PortalLayout → `/proveedor-portal`

## Dependencias cross-module
- Lee de: talent_hub (compradores), motor_cumplimiento (requisitos legales)
- Alimenta: production_ops (materias primas), accounting (cuentas por pagar)

## Estado
Backend funcional. Frontend con CRUD proveedores y portal implementados. UI de compras optimizada (Sprint SUPPLY-CHAIN-UI).

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
