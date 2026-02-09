# Referencia de API Endpoints

**Fecha:** 2026-02-06
**Versión API:** v1
**Sistema:** StrateKaz ERP

## Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Módulo Compras](#módulo-compras)
4. [Módulo Tesorería](#módulo-tesorería)
5. [Módulo Notificaciones](#módulo-notificaciones)
6. [Convenciones y Estándares](#convenciones-y-estándares)

---

## Información General

### URL Base

```
http://localhost:8000/api/
```

### Formato de Respuesta

Todas las respuestas están en formato JSON.

### Autenticación Requerida

Todos los endpoints requieren autenticación JWT Bearer Token, salvo los endpoints de autenticación.

### Códigos de Estado HTTP

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `204 No Content` - Eliminación exitosa
- `400 Bad Request` - Datos inválidos
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No autorizado
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

---

## Autenticación

### Obtener Token JWT

```http
POST /api/auth/token/
```

**Request Body:**
```json
{
    "username": "usuario",
    "password": "contraseña"
}
```

**Response 200:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Usar Token en Requests

Incluir en el header de todas las peticiones:

```
Authorization: Bearer <access_token>
```

---

## Módulo Compras

**Base URL:** `/api/compras/`
**Autenticación:** JWT Bearer Token

### Catálogos Dinámicos

#### Estados de Requisición

```http
GET    /api/compras/estados-requisicion/          # Listar todos
POST   /api/compras/estados-requisicion/          # Crear nuevo
GET    /api/compras/estados-requisicion/{id}/     # Obtener uno
PUT    /api/compras/estados-requisicion/{id}/     # Actualizar completo
PATCH  /api/compras/estados-requisicion/{id}/     # Actualizar parcial
DELETE /api/compras/estados-requisicion/{id}/     # Eliminar
```

**Estructura:**
```json
{
    "codigo": "REQ_BORRADOR",
    "nombre": "Borrador",
    "descripcion": "Requisición en estado borrador",
    "es_estado_inicial": true,
    "es_estado_final": false,
    "permite_edicion": true,
    "color_hex": "#6c757d",
    "orden": 1,
    "is_active": true
}
```

#### Estados de Cotización

```http
GET    /api/compras/estados-cotizacion/
POST   /api/compras/estados-cotizacion/
GET    /api/compras/estados-cotizacion/{id}/
PUT    /api/compras/estados-cotizacion/{id}/
PATCH  /api/compras/estados-cotizacion/{id}/
DELETE /api/compras/estados-cotizacion/{id}/
```

#### Estados de Orden de Compra

```http
GET    /api/compras/estados-orden-compra/
POST   /api/compras/estados-orden-compra/
GET    /api/compras/estados-orden-compra/{id}/
PUT    /api/compras/estados-orden-compra/{id}/
PATCH  /api/compras/estados-orden-compra/{id}/
DELETE /api/compras/estados-orden-compra/{id}/
```

#### Prioridades de Requisición

```http
GET    /api/compras/prioridades-requisicion/
POST   /api/compras/prioridades-requisicion/
GET    /api/compras/prioridades-requisicion/{id}/
PUT    /api/compras/prioridades-requisicion/{id}/
PATCH  /api/compras/prioridades-requisicion/{id}/
DELETE /api/compras/prioridades-requisicion/{id}/
```

#### Tipos de Contrato

```http
GET    /api/compras/tipos-contrato/
POST   /api/compras/tipos-contrato/
GET    /api/compras/tipos-contrato/{id}/
PUT    /api/compras/tipos-contrato/{id}/
PATCH  /api/compras/tipos-contrato/{id}/
DELETE /api/compras/tipos-contrato/{id}/
```

#### Monedas

```http
GET    /api/compras/monedas/
POST   /api/compras/monedas/
GET    /api/compras/monedas/{id}/
PUT    /api/compras/monedas/{id}/
PATCH  /api/compras/monedas/{id}/
DELETE /api/compras/monedas/{id}/
```

**Estructura:**
```json
{
    "codigo": "COP",
    "nombre": "Peso Colombiano",
    "simbolo": "$",
    "tasa_cambio": "1.00",
    "orden": 1,
    "is_active": true
}
```

### Requisiciones

#### Listar Requisiciones

```http
GET /api/compras/requisiciones/
```

**Query Parameters:**
- `estado` - Filtrar por estado
- `prioridad` - Filtrar por prioridad
- `solicitante` - Filtrar por solicitante
- `fecha_desde` - Filtrar desde fecha (YYYY-MM-DD)
- `fecha_hasta` - Filtrar hasta fecha (YYYY-MM-DD)
- `search` - Buscar por número o justificación
- `ordering` - Ordenar por campo (ej: `-fecha_requisicion`)
- `page` - Número de página
- `page_size` - Tamaño de página

**Response 200:**
```json
{
    "count": 100,
    "next": "http://api.../requisiciones/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "numero_requisicion": "REQ-2025-0001",
            "fecha_requisicion": "2025-12-27",
            "solicitante_nombre": "Juan Pérez",
            "prioridad_nombre": "Alta",
            "prioridad_color": "#ff9800",
            "estado_nombre": "Aprobada",
            "estado_color": "#28a745",
            "total": "1250000.00",
            "esta_aprobada": true,
            "created_at": "2025-12-27T10:00:00Z"
        }
    ]
}
```

#### Crear Requisición

```http
POST /api/compras/requisiciones/
```

**Request Body:**
```json
{
    "empresa_config": 1,
    "sede": 1,
    "fecha_requisicion": "2025-12-27",
    "solicitante": 5,
    "prioridad": 3,
    "estado": 1,
    "justificacion": "Materiales para producción diciembre",
    "observaciones": "Necesario para cumplir orden de producción #1234",
    "detalles": [
        {
            "material": 10,
            "descripcion": "Grasa animal grado A",
            "cantidad": "500.00",
            "unidad_medida": "KG",
            "precio_estimado": "2500.00"
        }
    ]
}
```

**Response 201:**
```json
{
    "id": 1,
    "numero_requisicion": "REQ-2025-0001",
    "empresa_config": 1,
    "sede": 1,
    "fecha_requisicion": "2025-12-27",
    "solicitante": 5,
    "solicitante_nombre": "Juan Pérez",
    "prioridad": 3,
    "prioridad_nombre": "Alta",
    "estado": 1,
    "estado_nombre": "Borrador",
    "justificacion": "Materiales para producción diciembre",
    "total": "1250000.00",
    "esta_aprobada": false,
    "detalles": [
        {
            "id": 1,
            "material": 10,
            "material_nombre": "Grasa Animal",
            "descripcion": "Grasa animal grado A",
            "cantidad": "500.00",
            "unidad_medida": "KG",
            "precio_estimado": "2500.00",
            "subtotal": "1250000.00"
        }
    ],
    "created_at": "2025-12-27T10:00:00Z"
}
```

#### Obtener Requisición

```http
GET /api/compras/requisiciones/{id}/
```

#### Actualizar Requisición

```http
PUT   /api/compras/requisiciones/{id}/
PATCH /api/compras/requisiciones/{id}/
```

#### Eliminar Requisición

```http
DELETE /api/compras/requisiciones/{id}/
```

#### Aprobar Requisición

```http
POST /api/compras/requisiciones/{id}/aprobar/
```

**Request Body:**
```json
{
    "aprobador": 2,
    "observaciones": "Aprobado según presupuesto"
}
```

**Response 200:**
```json
{
    "message": "Requisición aprobada exitosamente",
    "requisicion": {
        "id": 1,
        "numero_requisicion": "REQ-2025-0001",
        "esta_aprobada": true,
        "fecha_aprobacion": "2025-12-27T14:30:00Z",
        "aprobador_nombre": "María González"
    }
}
```

#### Rechazar Requisición

```http
POST /api/compras/requisiciones/{id}/rechazar/
```

**Request Body:**
```json
{
    "observaciones": "Presupuesto insuficiente, revisar cantidades"
}
```

### Cotizaciones

#### Listar Cotizaciones

```http
GET /api/compras/cotizaciones/
```

**Query Parameters:**
- `requisicion` - Filtrar por requisición
- `proveedor` - Filtrar por proveedor
- `estado` - Filtrar por estado
- `es_seleccionada` - Filtrar seleccionadas (true/false)
- `fecha_desde` - Desde fecha
- `fecha_hasta` - Hasta fecha
- `search` - Búsqueda
- `ordering` - Ordenar

#### Crear Cotización

```http
POST /api/compras/cotizaciones/
```

**Request Body:**
```json
{
    "requisicion": 1,
    "proveedor": 5,
    "fecha_cotizacion": "2025-12-27",
    "fecha_validez": "2026-01-27",
    "moneda": 1,
    "estado": 1,
    "subtotal": "2100000.00",
    "impuestos": "399000.00",
    "condiciones_pago": "30 días",
    "tiempo_entrega": "5 días hábiles",
    "garantia": "6 meses",
    "observaciones": "Precios incluyen transporte"
}
```

#### Evaluar Cotización

```http
POST /api/compras/cotizaciones/{id}/evaluar/
```

**Request Body:**
```json
{
    "evaluador": 3,
    "calificacion_precio": 85,
    "calificacion_plazo": 90,
    "calificacion_calidad": 95,
    "observaciones": "Buen proveedor, cumple requisitos"
}
```

#### Seleccionar Cotización

```http
POST /api/compras/cotizaciones/{id}/seleccionar/
```

### Órdenes de Compra

#### Listar Órdenes de Compra

```http
GET /api/compras/ordenes-compra/
```

**Query Parameters:**
- `cotizacion` - Filtrar por cotización
- `proveedor` - Filtrar por proveedor
- `estado` - Filtrar por estado
- `fecha_desde` - Desde fecha
- `fecha_hasta` - Hasta fecha
- `search` - Búsqueda
- `ordering` - Ordenar

#### Crear Orden de Compra

```http
POST /api/compras/ordenes-compra/
```

**Request Body:**
```json
{
    "empresa_config": 1,
    "sede": 1,
    "fecha_orden": "2025-12-27",
    "cotizacion": 1,
    "proveedor": 5,
    "estado": 1,
    "moneda": 1,
    "fecha_entrega_esperada": "2026-01-05",
    "lugar_entrega": "Bodega Principal - Calle 123 #45-67",
    "subtotal": "2100000.00",
    "impuestos": "399000.00",
    "condiciones_pago": "30 días crédito",
    "terminos_condiciones": "Según contrato marco vigente",
    "detalles": [
        {
            "material": 10,
            "descripcion": "Grasa animal grado A",
            "cantidad_solicitada": "500.00",
            "unidad_medida": "KG",
            "precio_unitario": "2500.00"
        }
    ]
}
```

#### Aprobar Orden de Compra

```http
POST /api/compras/ordenes-compra/{id}/aprobar/
```

**Request Body:**
```json
{
    "aprobador": 2
}
```

#### Registrar Recepción

```http
POST /api/compras/ordenes-compra/{id}/registrar_recepcion/
```

**Request Body (Sin No Conformidades):**
```json
{
    "detalle_orden": 1,
    "cantidad_recibida": "500.00",
    "recibido_por": 4,
    "tiene_no_conformidades": false,
    "observaciones": "Material conforme, sin novedad"
}
```

**Request Body (Con No Conformidades):**
```json
{
    "detalle_orden": 1,
    "cantidad_recibida": "480.00",
    "recibido_por": 4,
    "tiene_no_conformidades": true,
    "descripcion_no_conformidad": "20 kg con temperatura fuera de especificación",
    "observaciones": "Se requiere devolución de material no conforme"
}
```

### Contratos

#### Listar Contratos

```http
GET /api/compras/contratos/
```

#### Crear Contrato

```http
POST /api/compras/contratos/
```

**Request Body:**
```json
{
    "empresa_config": 1,
    "sede": 1,
    "proveedor": 5,
    "tipo_contrato": 1,
    "estado": 1,
    "moneda": 1,
    "objeto_contrato": "Suministro de grasa animal grado A",
    "alcance": "Suministro mensual de hasta 10 toneladas",
    "fecha_inicio": "2025-01-01",
    "fecha_fin": "2025-12-31",
    "valor_total": "30000000.00",
    "condiciones_pago": "30 días crédito",
    "observaciones": "Contrato marco anual"
}
```

#### Contratos Vigentes

```http
GET /api/compras/contratos/vigentes/
```

#### Contratos Por Vencer

```http
GET /api/compras/contratos/por_vencer/?dias=30
```

**Query Parameters:**
- `dias` - Número de días para considerar próximo a vencer

### Recepciones

#### Listar Recepciones

```http
GET /api/compras/recepciones/
```

#### Recepciones No Conformes

```http
GET /api/compras/recepciones/no_conformes/
```

---

## Módulo Tesorería

**Base URL:** `/api/admin-finance/tesoreria/`
**Autenticación:** JWT Bearer Token

### Bancos

#### Listar Bancos

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

#### Crear Banco

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

#### Detalle de Banco

```http
GET /api/admin-finance/tesoreria/bancos/{id}/
```

#### Actualizar Banco

```http
PUT   /api/admin-finance/tesoreria/bancos/{id}/
PATCH /api/admin-finance/tesoreria/bancos/{id}/
```

#### Eliminar Banco (Soft Delete)

```http
DELETE /api/admin-finance/tesoreria/bancos/{id}/
```

#### Resumen de Saldos

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
            "numero_cuenta": "123456789",
            "nombre_cuenta": "Cuenta Principal",
            "saldo_actual": "50000000.00",
            "saldo_disponible": "45000000.00",
            "estado": "activo"
        }
    ]
}
```

### Cuentas Por Pagar

#### Listar Cuentas Por Pagar

```http
GET /api/admin-finance/tesoreria/cuentas-por-pagar/
```

**Query Parameters:**
- `estado` - Filtrar por estado (pendiente, parcial, pagada, vencida, anulada)
- `proveedor` - Filtrar por ID de proveedor
- `search` - Búsqueda por código, concepto
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

#### Crear Cuenta Por Pagar

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

#### Cuentas Vencidas

```http
GET /api/admin-finance/tesoreria/cuentas-por-pagar/vencidas/
```

#### Cuentas Por Vencer

```http
GET /api/admin-finance/tesoreria/cuentas-por-pagar/por_vencer/
```

**Nota:** Retorna cuentas que vencen en los próximos 7 días.

#### Estadísticas de Cuentas Por Pagar

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

### Cuentas Por Cobrar

#### Listar Cuentas Por Cobrar

```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/
```

**Query Parameters:**
- `estado` - Filtrar por estado
- `cliente` - Filtrar por ID de cliente
- `search` - Búsqueda por código, concepto
- `ordering` - Ordenar
- `page`, `page_size`

#### Crear Cuenta Por Cobrar

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

#### Cuentas Vencidas

```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/vencidas/
```

#### Cuentas Por Vencer

```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/por_vencer/
```

#### Estadísticas

```http
GET /api/admin-finance/tesoreria/cuentas-por-cobrar/estadisticas/
```

### Flujo de Caja

#### Listar Flujos de Caja

```http
GET /api/admin-finance/tesoreria/flujo-caja/
```

**Query Parameters:**
- `tipo` - Filtrar por tipo (ingreso, egreso)
- `banco` - Filtrar por ID de banco
- `search` - Búsqueda por código, concepto
- `ordering` - Ordenar (ej: -fecha)
- `page`, `page_size`

#### Crear Flujo de Caja

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

#### Resumen por Período

```http
GET /api/admin-finance/tesoreria/flujo-caja/resumen_periodo/?fecha_inicio=2025-01-01&fecha_fin=2025-01-31
```

**Query Parameters (Requeridos):**
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

### Pagos

#### Listar Pagos

```http
GET /api/admin-finance/tesoreria/pagos/
```

**Query Parameters:**
- `banco` - Filtrar por ID de banco
- `metodo_pago` - Filtrar por método (efectivo, transferencia, cheque, etc.)
- `cuenta_por_pagar` - Filtrar por ID de cuenta por pagar
- `search` - Búsqueda por código, referencia
- `ordering` - Ordenar (ej: -fecha_pago)
- `page`, `page_size`

#### Registrar Pago

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
    "created_at": "2025-01-15T10:30:00Z"
}
```

**Nota:** Al crear un pago se actualizan automáticamente:
- `CuentaPorPagar.monto_pagado` += monto
- `CuentaPorPagar.estado` (según saldo)
- `Banco.saldo_actual` -= monto
- `Banco.saldo_disponible` -= monto

### Recaudos

#### Listar Recaudos

```http
GET /api/admin-finance/tesoreria/recaudos/
```

**Query Parameters:**
- `banco` - Filtrar por ID de banco
- `metodo_pago` - Filtrar por método
- `cuenta_por_cobrar` - Filtrar por ID de cuenta por cobrar
- `search` - Búsqueda por código, referencia
- `ordering` - Ordenar (ej: -fecha_recaudo)
- `page`, `page_size`

#### Registrar Recaudo

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

**Nota:** Al crear un recaudo se actualizan automáticamente:
- `CuentaPorCobrar.monto_cobrado` += monto
- `CuentaPorCobrar.estado` (según saldo)
- `Banco.saldo_actual` += monto
- `Banco.saldo_disponible` += monto

---

## Módulo Notificaciones

**Base URL:** `/api/audit-system/notificaciones/`
**Módulo:** `audit_system.centro_notificaciones`
**Autenticación:** JWT Bearer Token

### Servicio de Notificaciones

El Centro de Notificaciones es un servicio centralizado para enviar notificaciones a usuarios del sistema.

**Características:**
- Notificaciones en la aplicación (bandeja)
- Envío por email
- Respeto de preferencias de usuario
- Plantillas con variables dinámicas
- Envío individual o masivo
- Prioridades (baja, normal, alta, urgente)

### Uso del Servicio (Backend)

#### Importar el Servicio

```python
from apps.audit_system.centro_notificaciones.services import NotificationService
from apps.audit_system.centro_notificaciones.models import TipoNotificacion
```

#### Notificación Simple

```python
tipo = TipoNotificacion.objects.get(codigo='NUEVA_TAREA')

NotificationService.send_notification(
    tipo=tipo,
    usuario=request.user,
    titulo="Nueva tarea asignada",
    mensaje="Revisa la tarea urgente: Actualizar documentación ISO",
    url="/planeacion/tareas/456",
    prioridad='alta'
)
```

#### Notificación con Plantilla

```python
tipo = TipoNotificacion.objects.get(codigo='NUEVA_TAREA')

titulo = NotificationService.render_template(
    tipo.plantilla_titulo,
    {'titulo_tarea': 'Auditoría interna Q1'}
)

mensaje = NotificationService.render_template(
    tipo.plantilla_mensaje,
    {
        'descripcion': 'Preparar documentos para auditoría ISO 9001',
        'responsable': tarea.responsable.get_full_name()
    }
)

NotificationService.send_notification(
    tipo=tipo,
    usuario=tarea.responsable,
    titulo=titulo,
    mensaje=mensaje,
    url=f"/planeacion/tareas/{tarea.id}",
    datos_extra={'tarea_id': tarea.id, 'modulo': 'planeacion'}
)
```

#### Notificación Masiva

```python
usuarios = User.objects.filter(is_active=True)
tipo = TipoNotificacion.objects.get(codigo='MANTENIMIENTO_PROGRAMADO')

stats = NotificationService.send_bulk_notification(
    tipo=tipo,
    usuarios=usuarios,
    titulo="Mantenimiento del sistema",
    mensaje="El sistema estará en mantenimiento el 25/01 de 2am a 4am",
    prioridad='alta'
)
```

#### Por Cargo (Rol)

```python
tipo = TipoNotificacion.objects.get(codigo='CAPACITACION_SST')

stats = NotificationService.send_notification_by_role(
    tipo=tipo,
    cargo_id=5,
    titulo="Capacitación SST obligatoria",
    mensaje="Todos los operarios deben asistir el viernes a las 2pm",
    url="/hseq/capacitaciones/123",
    prioridad='alta'
)
```

#### Por Área

```python
tipo = TipoNotificacion.objects.get(codigo='REUNION_AREA')

stats = NotificationService.send_notification_by_area(
    tipo=tipo,
    area_id=3,
    titulo="Reunión de área - Viernes 10am",
    mensaje="Asistencia obligatoria para revisar KPIs del mes"
)
```

### Métodos del Servicio

#### `send_notification()`

Envía una notificación individual.

**Parámetros:**
- `tipo` (TipoNotificacion, requerido) - Tipo de notificación
- `usuario` (User, requerido) - Usuario destinatario
- `titulo` (str, requerido) - Título de la notificación
- `mensaje` (str, requerido) - Cuerpo del mensaje
- `url` (str, opcional) - URL para navegación
- `datos_extra` (dict, opcional) - JSON con datos adicionales
- `prioridad` (str, opcional) - 'baja', 'normal', 'alta', 'urgente'
- `force` (bool, opcional) - Ignorar preferencias de usuario

**Returns:** Instancia de Notificacion o None

#### `send_bulk_notification()`

Envía notificaciones a múltiples usuarios.

**Parámetros:**
- `tipo` (TipoNotificacion, requerido)
- `usuarios` (QuerySet o List[User], requerido)
- `titulo` (str, requerido)
- `mensaje` (str, requerido)
- `url` (str, opcional)
- `datos_extra` (dict, opcional)
- `prioridad` (str, opcional)

**Returns:** Dict con estadísticas `{'enviadas': int, 'bloqueadas': int, 'errores': int}`

#### `send_notification_by_role()`

Envía notificaciones a todos los usuarios con un cargo específico.

**Parámetros:**
- `tipo` (TipoNotificacion, requerido)
- `cargo_id` (int, requerido)
- `titulo` (str, requerido)
- `mensaje` (str, requerido)
- `url` (str, opcional)

**Returns:** Dict con estadísticas

#### `send_notification_by_area()`

Envía notificaciones a todos los usuarios de un área.

**Parámetros:**
- `tipo` (TipoNotificacion, requerido)
- `area_id` (int, requerido)
- `titulo` (str, requerido)
- `mensaje` (str, requerido)
- `url` (str, opcional)

**Returns:** Dict con estadísticas

#### `render_template()`

Renderiza una plantilla con variables.

**Parámetros:**
- `template_string` (str, requerido) - Plantilla con `{variables}`
- `context` (dict, requerido) - Diccionario con valores

**Returns:** String renderizado

#### Utilidades

```python
# Marcar como leída
NotificationService.mark_as_read(notificacion_id=123)

# Marcar todas como leídas
count = NotificationService.mark_all_as_read(usuario_id=5)

# Obtener contador de no leídas
unread = NotificationService.get_unread_count(usuario_id=5)
```

### Tipos de Notificación

Antes de enviar notificaciones, debes crear los tipos correspondientes:

```python
TipoNotificacion.objects.create(
    codigo='NUEVA_TAREA',
    nombre='Nueva Tarea Asignada',
    descripcion='Se notifica al usuario cuando se le asigna una nueva tarea',
    categoria='tarea',
    color='#3B82F6',
    icono='bell',
    plantilla_titulo='Nueva tarea: {titulo_tarea}',
    plantilla_mensaje='Se te ha asignado: {descripcion}. Responsable: {responsable}',
    url_template='/planeacion/tareas/{tarea_id}',
    es_email=True,
    es_push=True,
    company_id=1
)
```

---

## Convenciones y Estándares

### Paginación

Todas las listas están paginadas por defecto:
- `page_size` por defecto: 20
- Personalizable: `?page_size=50`
- Navegar: `?page=2`

**Formato de respuesta paginada:**
```json
{
    "count": 100,
    "next": "http://api.../recurso/?page=2",
    "previous": null,
    "results": [...]
}
```

### Ordenamiento

Usar parámetro `ordering`:

```
GET /api/compras/requisiciones/?ordering=-fecha_requisicion
GET /api/compras/ordenes-compra/?ordering=total
GET /api/compras/contratos/?ordering=-fecha_inicio
```

Prefijo `-` para orden descendente.

### Filtros Comunes

- `search` - Búsqueda en múltiples campos
- `estado` - ID de estado
- `fecha_desde` - Fecha inicio (YYYY-MM-DD)
- `fecha_hasta` - Fecha fin (YYYY-MM-DD)
- `ordering` - Campo para ordenar
- `page` - Número de página
- `page_size` - Elementos por página

### Filtro de Registros Inactivos

Todos los endpoints incluyen:
- Por defecto solo muestra registros con `is_active=True`
- Para incluir inactivos: `?include_inactive=true`

### Acciones de Toggle

```http
POST /api/{modulo}/{recurso}/{id}/toggle-active/
```

### Acciones Masivas

```http
POST /api/{modulo}/{recurso}/bulk-activate/
{"ids": [1, 2, 3]}

POST /api/{modulo}/{recurso}/bulk-deactivate/
{"ids": [1, 2, 3]}

POST /api/{modulo}/{recurso}/bulk-delete/
{"ids": [1, 2, 3], "confirm": true}
```

### Validaciones

#### Banco
- `saldo_disponible` no puede ser mayor a `saldo_actual`
- `numero_cuenta` debe ser único

#### Cuenta Por Pagar/Cobrar
- `fecha_vencimiento` debe ser posterior a `fecha_documento`
- `monto_pagado/cobrado` no puede ser mayor a `monto_total`
- Debe tener al menos un origen (proveedor/cliente/factura/orden)

#### Pago
- `monto` no puede exceder el saldo pendiente de la cuenta
- `banco` debe tener saldo disponible suficiente

#### Recaudo
- `monto` no puede exceder el saldo pendiente de la cuenta

#### Flujo de Caja
- Tipo `egreso` no puede tener `cuenta_por_cobrar`
- Tipo `ingreso` no puede tener `cuenta_por_pagar`

### Manejo de Errores

#### 400 Bad Request

```json
{
    "monto": [
        "El monto (2000000.00) excede el saldo pendiente (1500000.00)"
    ]
}
```

#### 401 Unauthorized

```json
{
    "detail": "Authentication credentials were not provided."
}
```

#### 403 Forbidden

```json
{
    "detail": "You do not have permission to perform this action."
}
```

#### 404 Not Found

```json
{
    "detail": "Not found."
}
```

#### 500 Internal Server Error

```json
{
    "detail": "Internal server error."
}
```

### Multi-tenant

Todas las consultas se filtran automáticamente por empresa del usuario autenticado.

### Auditoría

Los campos `created_by` y `updated_by` se asignan automáticamente.

### Soft Delete

El método DELETE no elimina físicamente, solo marca `is_active=False`.

---

## Notas Finales

1. **Autenticación:** Todos los endpoints requieren JWT token en header salvo los de autenticación
2. **Multi-tenant:** Las consultas se filtran por empresa del usuario autenticado
3. **Auditoría:** Los campos de auditoría se asignan automáticamente
4. **Paginación:** Por defecto 20 elementos por página (configurable)
5. **Ordenamiento:** Usar prefijo `-` para orden descendente
6. **Soft Delete:** DELETE marca `is_active=False`, no elimina físicamente

---

**Última actualización:** 2026-02-06
**Versión del documento:** 1.0
