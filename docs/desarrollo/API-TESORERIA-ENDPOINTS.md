# API Endpoints - Tesorería (Admin Finance)

**Base URL:** `/api/admin-finance/tesoreria/`
**Autenticación:** JWT Bearer Token requerido
**Formato:** JSON

## Índice

1. [Bancos](#bancos)
2. [Cuentas Por Pagar](#cuentas-por-pagar)
3. [Cuentas Por Cobrar](#cuentas-por-cobrar)
4. [Flujo de Caja](#flujo-de-caja)
5. [Pagos](#pagos)
6. [Recaudos](#recaudos)

---

## Bancos

### Listar Bancos
```http
GET /api/admin-finance/tesoreria/bancos/
```

**Query Parameters:**
- `estado` - Filtrar por estado (activo, inactivo, bloqueado)
- `tipo_cuenta` - Filtrar por tipo (ahorros, corriente, fiducia, credito)
- `entidad_bancaria` - Filtrar por nombre del banco
- `search` - Búsqueda por nombre_cuenta, numero_cuenta, entidad_bancaria
- `ordering` - Ordenar (ej: saldo_actual, -created_at)
- `page` - Número de página
- `page_size` - Elementos por página

**Response 200:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "entidad_bancaria": "Bancolombia",
      "tipo_cuenta": "corriente",
      "tipo_cuenta_display": "Corriente",
      "numero_cuenta": "123456789",
      "nombre_cuenta": "Cuenta Principal - Operaciones",
      "saldo_actual": "50000000.00",
      "saldo_disponible": "45000000.00",
      "estado": "activo",
      "estado_display": "Activo"
    }
  ]
}
```

### Crear Banco
```http
POST /api/admin-finance/tesoreria/bancos/
```

**Request Body:**
```json
{
  "entidad_bancaria": "Bancolombia",
  "tipo_cuenta": "corriente",
  "numero_cuenta": "123456789",
  "nombre_cuenta": "Cuenta Principal - Operaciones",
  "saldo_actual": "50000000.00",
  "saldo_disponible": "50000000.00",
  "estado": "activo",
  "sucursal": "Centro Cali",
  "responsable": 1,
  "observaciones": "Cuenta principal de operaciones diarias"
}
```

**Response 201:**
```json
{
  "id": 1,
  "empresa": 1,
  "entidad_bancaria": "Bancolombia",
  "tipo_cuenta": "corriente",
  "tipo_cuenta_display": "Corriente",
  "numero_cuenta": "123456789",
  "nombre_cuenta": "Cuenta Principal - Operaciones",
  "saldo_actual": "50000000.00",
  "saldo_disponible": "50000000.00",
  "saldo_comprometido": "0.00",
  "estado": "activo",
  "estado_display": "Activo",
  "sucursal": "Centro Cali",
  "responsable": 1,
  "responsable_nombre": "Juan Pérez",
  "observaciones": "Cuenta principal de operaciones diarias",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "created_by": 1,
  "updated_by": 1
}
```

### Detalle de Banco
```http
GET /api/admin-finance/tesoreria/bancos/{id}/
```

**Response 200:** (mismo formato que crear)

### Actualizar Banco
```http
PUT /api/admin-finance/tesoreria/bancos/{id}/
PATCH /api/admin-finance/tesoreria/bancos/{id}/
```

**Request Body:** (igual que crear, PATCH permite campos parciales)

### Eliminar Banco (Soft Delete)
```http
DELETE /api/admin-finance/tesoreria/bancos/{id}/
```

**Response 204:** No Content

### Resumen de Saldos
```http
GET /api/admin-finance/tesoreria/bancos/saldos/
```

**Response 200:**
```json
{
  "total_bancos": 3,
  "saldo_total": "85000000.00",
  "saldo_disponible": "75000000.00",
  "saldo_comprometido": "10000000.00",
  "bancos": [
    {
      "id": 1,
      "entidad_bancaria": "Bancolombia",
      "tipo_cuenta": "corriente",
      "tipo_cuenta_display": "Corriente",
      "numero_cuenta": "123456789",
      "nombre_cuenta": "Cuenta Principal",
      "saldo_actual": "50000000.00",
      "saldo_disponible": "45000000.00",
      "estado": "activo",
      "estado_display": "Activo"
    }
  ]
}
```

---

## Cuentas Por Pagar

### Listar Cuentas Por Pagar
```http
GET /api/admin-finance/tesoreria/cuentas-por-pagar/
```

**Query Parameters:**
- `estado` - Filtrar por estado (pendiente, parcial, pagada, vencida, anulada)
- `proveedor` - Filtrar por ID de proveedor
- `search` - Búsqueda por codigo, concepto
- `ordering` - Ordenar (ej: fecha_vencimiento, -monto_total)
- `page`, `page_size`

**Response 200:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "CPP-2025-0001",
      "concepto": "Factura #001 - Suministros",
      "proveedor_nombre": "Proveedor ABC S.A.S.",
      "monto_total": "1500000.00",
      "monto_pagado": "0.00",
      "saldo_pendiente": "1500000.00",
      "fecha_vencimiento": "2025-02-15",
      "dias_para_vencimiento": 15,
      "estado": "pendiente",
      "estado_display": "Pendiente"
    }
  ]
}
```

### Crear Cuenta Por Pagar
```http
POST /api/admin-finance/tesoreria/cuentas-por-pagar/
```

**Request Body:**
```json
{
  "proveedor": 1,
  "orden_compra": 5,
  "concepto": "Factura #001 - Suministros de oficina",
  "monto_total": "1500000.00",
  "fecha_documento": "2025-01-15",
  "fecha_vencimiento": "2025-02-15",
  "observaciones": "Plazo 30 días calendario"
}
```

**Response 201:**
```json
{
  "id": 1,
  "empresa": 1,
  "codigo": "CPP-2025-0001",
  "concepto": "Factura #001 - Suministros de oficina",
  "proveedor": 1,
  "proveedor_nombre": "Proveedor ABC S.A.S.",
  "orden_compra": 5,
  "orden_compra_numero": "OC-2025-0005",
  "liquidacion_nomina": null,
  "liquidacion_numero": null,
  "monto_total": "1500000.00",
  "monto_pagado": "0.00",
  "saldo_pendiente": "1500000.00",
  "fecha_documento": "2025-01-15",
  "fecha_vencimiento": "2025-02-15",
  "dias_para_vencimiento": 31,
  "estado": "pendiente",
  "estado_display": "Pendiente",
  "esta_vencida": false,
  "observaciones": "Plazo 30 días calendario",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "created_by": 1,
  "updated_by": 1
}
```

### Cuentas Vencidas
```http
GET /api/admin-finance/tesoreria/cuentas-por-pagar/vencidas/
```

**Response 200:**
```json
{
  "count": 3,
  "total": "4500000.00",
  "results": [
    {
      "id": 1,
      "codigo": "CPP-2025-0001",
      "concepto": "Factura vencida",
      "proveedor_nombre": "Proveedor XYZ",
      "monto_total": "1500000.00",
      "monto_pagado": "0.00",
      "saldo_pendiente": "1500000.00",
      "fecha_vencimiento": "2025-01-01",
      "dias_para_vencimiento": -14,
      "estado": "vencida",
      "estado_display": "Vencida"
    }
  ]
}
```

### Cuentas Por Vencer (próximos 7 días)
```http
GET /api/admin-finance/tesoreria/cuentas-por-pagar/por_vencer/
```

**Response 200:**
```json
{
  "count": 2,
  "total": "3000000.00",
  "results": [
    {
      "id": 2,
      "codigo": "CPP-2025-0002",
      "concepto": "Factura próxima a vencer",
      "proveedor_nombre": "Proveedor ABC",
      "monto_total": "1500000.00",
      "monto_pagado": "0.00",
      "saldo_pendiente": "1500000.00",
      "fecha_vencimiento": "2025-01-20",
      "dias_para_vencimiento": 5,
      "estado": "pendiente",
      "estado_display": "Pendiente"
    }
  ]
}
```

### Estadísticas de Cuentas Por Pagar
```http
GET /api/admin-finance/tesoreria/cuentas-por-pagar/estadisticas/
```

**Response 200:**
```json
{
  "total_cuentas": 25,
  "pendientes": 10,
  "parciales": 5,
  "vencidas": 3,
  "pagadas": 7,
  "monto_total_pendiente": "15000000.00"
}
```

---

## Cuentas Por Cobrar

### Listar Cuentas Por Cobrar
```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/
```

**Query Parameters:** (similares a cuentas por pagar)
- `estado` - Filtrar por estado
- `cliente` - Filtrar por ID de cliente
- `search` - Búsqueda por codigo, concepto
- `ordering` - Ordenar
- `page`, `page_size`

**Response 200:**
```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "CPC-2025-0001",
      "concepto": "Factura de Venta #FV-2025-0001",
      "cliente_nombre": "Cliente Premium S.A.S.",
      "monto_total": "2500000.00",
      "monto_cobrado": "0.00",
      "saldo_pendiente": "2500000.00",
      "fecha_vencimiento": "2025-01-30",
      "dias_para_vencimiento": 15,
      "estado": "pendiente",
      "estado_display": "Pendiente"
    }
  ]
}
```

### Crear Cuenta Por Cobrar
```http
POST /api/admin-finance/tesoreria/cuentas-por-cobrar/
```

**Request Body:**
```json
{
  "cliente": 1,
  "factura": 10,
  "concepto": "Factura de Venta #FV-2025-0001",
  "monto_total": "2500000.00",
  "fecha_documento": "2025-01-15",
  "fecha_vencimiento": "2025-01-30",
  "observaciones": "Plazo 15 días calendario"
}
```

**Response 201:** (similar a crear cuenta por pagar)

### Cuentas Vencidas
```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/vencidas/
```

### Cuentas Por Vencer
```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/por_vencer/
```

### Estadísticas
```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/estadisticas/
```

---

## Flujo de Caja

### Listar Flujos de Caja
```http
GET /api/admin-finance/tesoreria/flujo-caja/
```

**Query Parameters:**
- `tipo` - Filtrar por tipo (ingreso, egreso)
- `banco` - Filtrar por ID de banco
- `search` - Búsqueda por codigo, concepto
- `ordering` - Ordenar (ej: -fecha)
- `page`, `page_size`

**Response 200:**
```json
{
  "count": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "FC-2025-0001",
      "tipo": "ingreso",
      "tipo_display": "Ingreso",
      "concepto": "Cobro de facturas enero",
      "fecha": "2025-01-31",
      "monto_proyectado": "10000000.00",
      "monto_real": "9500000.00",
      "variacion": "-500000.00"
    }
  ]
}
```

### Crear Flujo de Caja
```http
POST /api/admin-finance/tesoreria/flujo-caja/
```

**Request Body:**
```json
{
  "tipo": "ingreso",
  "concepto": "Proyección cobros enero",
  "fecha": "2025-01-31",
  "monto_proyectado": "10000000.00",
  "monto_real": "0.00",
  "banco": 1,
  "cuenta_por_cobrar": 1,
  "observaciones": "Estimación basada en facturas pendientes"
}
```

**Response 201:**
```json
{
  "id": 1,
  "empresa": 1,
  "codigo": "FC-2025-0001",
  "tipo": "ingreso",
  "tipo_display": "Ingreso",
  "concepto": "Proyección cobros enero",
  "banco": 1,
  "banco_nombre": "Cuenta Principal - Operaciones",
  "cuenta_por_pagar": null,
  "cuenta_pagar_codigo": null,
  "cuenta_por_cobrar": 1,
  "cuenta_cobrar_codigo": "CPC-2025-0001",
  "fecha": "2025-01-31",
  "monto_proyectado": "10000000.00",
  "monto_real": "0.00",
  "variacion": "-10000000.00",
  "porcentaje_cumplimiento": "0.00",
  "observaciones": "Estimación basada en facturas pendientes",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "created_by": 1,
  "updated_by": 1
}
```

### Resumen por Período
```http
GET /api/admin-finance/tesoreria/flujo-caja/resumen_periodo/?fecha_inicio=2025-01-01&fecha_fin=2025-01-31
```

**Query Parameters (requeridos):**
- `fecha_inicio` - Fecha inicio (YYYY-MM-DD)
- `fecha_fin` - Fecha fin (YYYY-MM-DD)

**Response 200:**
```json
{
  "periodo": {
    "inicio": "2025-01-01",
    "fin": "2025-01-31"
  },
  "ingresos": {
    "proyectado": "25000000.00",
    "real": "22000000.00"
  },
  "egresos": {
    "proyectado": "18000000.00",
    "real": "17500000.00"
  },
  "neto": {
    "proyectado": "7000000.00",
    "real": "4500000.00"
  }
}
```

---

## Pagos

### Listar Pagos
```http
GET /api/admin-finance/tesoreria/pagos/
```

**Query Parameters:**
- `banco` - Filtrar por ID de banco
- `metodo_pago` - Filtrar por método (efectivo, transferencia, cheque, etc.)
- `cuenta_por_pagar` - Filtrar por ID de cuenta por pagar
- `search` - Búsqueda por codigo, referencia
- `ordering` - Ordenar (ej: -fecha_pago)
- `page`, `page_size`

**Response 200:**
```json
{
  "count": 50,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "PAG-2025-0001",
      "fecha_pago": "2025-01-15",
      "monto": "1500000.00",
      "cuenta_concepto": "Factura #001 - Suministros",
      "proveedor_nombre": "Proveedor ABC S.A.S.",
      "metodo_pago": "transferencia",
      "metodo_pago_display": "Transferencia Bancaria",
      "referencia": "TRF-123456"
    }
  ]
}
```

### Registrar Pago
```http
POST /api/admin-finance/tesoreria/pagos/
```

**Request Body:**
```json
{
  "cuenta_por_pagar": 1,
  "banco": 1,
  "fecha_pago": "2025-01-15",
  "monto": "1500000.00",
  "metodo_pago": "transferencia",
  "referencia": "TRF-123456",
  "observaciones": "Pago total factura #001"
}
```

**Response 201:**
```json
{
  "id": 1,
  "empresa": 1,
  "codigo": "PAG-2025-0001",
  "cuenta_por_pagar": 1,
  "cuenta_por_pagar_codigo": "CPP-2025-0001",
  "cuenta_por_pagar_concepto": "Factura #001 - Suministros",
  "banco": 1,
  "banco_nombre": "Cuenta Principal - Operaciones",
  "proveedor_nombre": "Proveedor ABC S.A.S.",
  "fecha_pago": "2025-01-15",
  "monto": "1500000.00",
  "metodo_pago": "transferencia",
  "metodo_pago_display": "Transferencia Bancaria",
  "referencia": "TRF-123456",
  "comprobante": null,
  "observaciones": "Pago total factura #001",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "created_by": 1,
  "updated_by": 1
}
```

**Nota:** Al crear un pago se actualizan automáticamente:
- `CuentaPorPagar.monto_pagado` += monto
- `CuentaPorPagar.estado` (según saldo)
- `Banco.saldo_actual` -= monto
- `Banco.saldo_disponible` -= monto

---

## Recaudos

### Listar Recaudos
```http
GET /api/admin-finance/tesoreria/recaudos/
```

**Query Parameters:**
- `banco` - Filtrar por ID de banco
- `metodo_pago` - Filtrar por método
- `cuenta_por_cobrar` - Filtrar por ID de cuenta por cobrar
- `search` - Búsqueda por codigo, referencia
- `ordering` - Ordenar (ej: -fecha_recaudo)
- `page`, `page_size`

**Response 200:**
```json
{
  "count": 40,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "REC-2025-0001",
      "fecha_recaudo": "2025-01-15",
      "monto": "2500000.00",
      "cuenta_concepto": "Factura de Venta #FV-2025-0001",
      "cliente_nombre": "Cliente Premium S.A.S.",
      "metodo_pago": "transferencia",
      "metodo_pago_display": "Transferencia Bancaria",
      "referencia": "TRF-789012"
    }
  ]
}
```

### Registrar Recaudo
```http
POST /api/admin-finance/tesoreria/recaudos/
```

**Request Body:**
```json
{
  "cuenta_por_cobrar": 1,
  "banco": 1,
  "fecha_recaudo": "2025-01-15",
  "monto": "2500000.00",
  "metodo_pago": "transferencia",
  "referencia": "TRF-789012",
  "observaciones": "Pago completo factura FV-2025-0001"
}
```

**Response 201:**
```json
{
  "id": 1,
  "empresa": 1,
  "codigo": "REC-2025-0001",
  "cuenta_por_cobrar": 1,
  "cuenta_por_cobrar_codigo": "CPC-2025-0001",
  "cuenta_por_cobrar_concepto": "Factura de Venta #FV-2025-0001",
  "banco": 1,
  "banco_nombre": "Cuenta Principal - Operaciones",
  "cliente_nombre": "Cliente Premium S.A.S.",
  "fecha_recaudo": "2025-01-15",
  "monto": "2500000.00",
  "metodo_pago": "transferencia",
  "metodo_pago_display": "Transferencia Bancaria",
  "referencia": "TRF-789012",
  "comprobante": null,
  "observaciones": "Pago completo factura FV-2025-0001",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "created_by": 1,
  "updated_by": 1
}
```

**Nota:** Al crear un recaudo se actualizan automáticamente:
- `CuentaPorCobrar.monto_cobrado` += monto
- `CuentaPorCobrar.estado` (según saldo)
- `Banco.saldo_actual` += monto
- `Banco.saldo_disponible` += monto

---

## Validaciones Comunes

### Banco
- `saldo_disponible` no puede ser mayor a `saldo_actual`
- `numero_cuenta` debe ser único

### Cuenta Por Pagar/Cobrar
- `fecha_vencimiento` debe ser posterior a `fecha_documento`
- `monto_pagado/cobrado` no puede ser mayor a `monto_total`
- Debe tener al menos un origen (proveedor/cliente/factura/orden)

### Pago
- `monto` no puede exceder el saldo pendiente de la cuenta
- `banco` debe tener saldo disponible suficiente

### Recaudo
- `monto` no puede exceder el saldo pendiente de la cuenta

### Flujo de Caja
- Tipo `egreso` no puede tener `cuenta_por_cobrar`
- Tipo `ingreso` no puede tener `cuenta_por_pagar`

---

## Códigos de Error

### 400 Bad Request
```json
{
  "monto": [
    "El monto (2000000.00) excede el saldo pendiente (1500000.00)"
  ]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error."
}
```

---

## Filtros Globales de StandardViewSetMixin

Todos los endpoints incluyen:

### Filtro de Inactivos
- Por defecto solo muestra registros con `is_active=True`
- Para incluir inactivos: `?include_inactive=true`

### Acciones de Toggle
```http
POST /api/admin-finance/tesoreria/{recurso}/{id}/toggle-active/
```

### Acciones Masivas
```http
POST /api/admin-finance/tesoreria/{recurso}/bulk-activate/
{"ids": [1, 2, 3]}

POST /api/admin-finance/tesoreria/{recurso}/bulk-deactivate/
{"ids": [1, 2, 3]}

POST /api/admin-finance/tesoreria/{recurso}/bulk-delete/
{"ids": [1, 2, 3], "confirm": true}
```

---

## Notas de Implementación

1. **Autenticación:** Todos los endpoints requieren JWT token en header: `Authorization: Bearer <token>`
2. **Multi-tenant:** Todas las consultas se filtran automáticamente por empresa del usuario autenticado
3. **Auditoría:** Los campos `created_by` y `updated_by` se asignan automáticamente
4. **Paginación:** Por defecto 20 elementos por página (configurable con `page_size`)
5. **Ordenamiento:** Usar prefijo `-` para orden descendente (ej: `-created_at`)
6. **Soft Delete:** El DELETE no elimina físicamente, solo marca `is_active=False`

---

**Última actualización:** 29 de diciembre de 2025
**Versión del API:** 1.0
