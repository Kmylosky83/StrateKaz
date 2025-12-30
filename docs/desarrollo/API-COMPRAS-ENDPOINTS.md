# API Endpoints - Módulo Compras

**Base URL:** `/api/compras/`
**Autenticación:** JWT Bearer Token
**Formato:** JSON

## Catálogos Dinámicos

### Estados de Requisición
```
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

### Estados de Cotización
```
GET    /api/compras/estados-cotizacion/
POST   /api/compras/estados-cotizacion/
GET    /api/compras/estados-cotizacion/{id}/
PUT    /api/compras/estados-cotizacion/{id}/
PATCH  /api/compras/estados-cotizacion/{id}/
DELETE /api/compras/estados-cotizacion/{id}/
```

**Estructura:**
```json
{
    "codigo": "COT_PENDIENTE",
    "nombre": "Pendiente de Evaluación",
    "descripcion": "Cotización recibida pendiente de evaluar",
    "es_estado_inicial": true,
    "es_estado_final": false,
    "permite_evaluacion": true,
    "color_hex": "#ffc107",
    "orden": 1,
    "is_active": true
}
```

### Estados de Orden de Compra
```
GET    /api/compras/estados-orden-compra/
POST   /api/compras/estados-orden-compra/
GET    /api/compras/estados-orden-compra/{id}/
PUT    /api/compras/estados-orden-compra/{id}/
PATCH  /api/compras/estados-orden-compra/{id}/
DELETE /api/compras/estados-orden-compra/{id}/
```

**Estructura:**
```json
{
    "codigo": "ORD_APROBADA",
    "nombre": "Aprobada",
    "descripcion": "Orden de compra aprobada",
    "es_estado_inicial": false,
    "es_estado_final": false,
    "permite_recepcion": true,
    "color_hex": "#28a745",
    "orden": 2,
    "is_active": true
}
```

### Prioridades de Requisición
```
GET    /api/compras/prioridades-requisicion/
POST   /api/compras/prioridades-requisicion/
GET    /api/compras/prioridades-requisicion/{id}/
PUT    /api/compras/prioridades-requisicion/{id}/
PATCH  /api/compras/prioridades-requisicion/{id}/
DELETE /api/compras/prioridades-requisicion/{id}/
```

**Estructura:**
```json
{
    "codigo": "URGENTE",
    "nombre": "Urgente",
    "descripcion": "Requiere atención inmediata",
    "color_hex": "#dc3545",
    "orden": 4,
    "is_active": true
}
```

### Tipos de Contrato
```
GET    /api/compras/tipos-contrato/
POST   /api/compras/tipos-contrato/
GET    /api/compras/tipos-contrato/{id}/
PUT    /api/compras/tipos-contrato/{id}/
PATCH  /api/compras/tipos-contrato/{id}/
DELETE /api/compras/tipos-contrato/{id}/
```

### Monedas
```
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

### Estados de Contrato
```
GET    /api/compras/estados-contrato/
# ... (mismo patrón CRUD)
```

### Estados de Material
```
GET    /api/compras/estados-material/
# ... (mismo patrón CRUD)
```

## Modelos Principales

### Requisiciones

#### Listar Requisiciones
```
GET /api/compras/requisiciones/
```

**Query Parameters:**
- `estado` - Filtrar por estado
- `prioridad` - Filtrar por prioridad
- `solicitante` - Filtrar por solicitante
- `fecha_desde` - Filtrar desde fecha
- `fecha_hasta` - Filtrar hasta fecha
- `search` - Buscar por número o justificación
- `ordering` - Ordenar por campo (ej: `-fecha_requisicion`)
- `page` - Página (paginación)
- `page_size` - Tamaño de página

**Respuesta:**
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
```
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
        },
        {
            "material": 15,
            "descripcion": "Hueso bovino",
            "cantidad": "1000.00",
            "unidad_medida": "KG",
            "precio_estimado": "1000.00"
        }
    ]
}
```

**Respuesta:** (201 Created)
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
    "observaciones": "Necesario para cumplir orden de producción #1234",
    "aprobador": null,
    "fecha_aprobacion": null,
    "total": "2250000.00",
    "esta_aprobada": false,
    "puede_editar": true,
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
        },
        {
            "id": 2,
            "material": 15,
            "material_nombre": "Hueso Bovino",
            "descripcion": "Hueso bovino",
            "cantidad": "1000.00",
            "unidad_medida": "KG",
            "precio_estimado": "1000.00",
            "subtotal": "1000000.00"
        }
    ],
    "created_at": "2025-12-27T10:00:00Z",
    "updated_at": "2025-12-27T10:00:00Z"
}
```

#### Obtener Requisición
```
GET /api/compras/requisiciones/{id}/
```

#### Actualizar Requisición
```
PUT /api/compras/requisiciones/{id}/
PATCH /api/compras/requisiciones/{id}/
```

#### Eliminar Requisición
```
DELETE /api/compras/requisiciones/{id}/
```

#### Aprobar Requisición
```
POST /api/compras/requisiciones/{id}/aprobar/
```

**Request Body:**
```json
{
    "aprobador": 2,
    "observaciones": "Aprobado según presupuesto"
}
```

**Respuesta:** (200 OK)
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
```
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
```
GET /api/compras/cotizaciones/
```

**Query Parameters:**
- `requisicion` - Filtrar por requisición
- `proveedor` - Filtrar por proveedor
- `estado` - Filtrar por estado
- `es_seleccionada` - Filtrar seleccionadas (true/false)
- `fecha_desde` - Desde fecha
- `fecha_hasta` - Hasta fecha
- `search` - Buscar
- `ordering` - Ordenar

#### Crear Cotización
```
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
```
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

**Respuesta:**
```json
{
    "message": "Cotización evaluada exitosamente",
    "evaluacion": {
        "id": 1,
        "cotizacion": 1,
        "evaluador_nombre": "Carlos Rodríguez",
        "puntaje_total": 270,
        "fecha_evaluacion": "2025-12-27T15:00:00Z"
    }
}
```

#### Seleccionar Cotización
```
POST /api/compras/cotizaciones/{id}/seleccionar/
```

**Respuesta:**
```json
{
    "message": "Cotización seleccionada exitosamente",
    "cotizacion": {
        "id": 1,
        "numero_cotizacion": "COT-2025-0001",
        "es_seleccionada": true,
        "proveedor_nombre": "Proveedor XYZ S.A.S."
    }
}
```

### Órdenes de Compra

#### Listar Órdenes de Compra
```
GET /api/compras/ordenes-compra/
```

**Query Parameters:**
- `cotizacion` - Filtrar por cotización
- `proveedor` - Filtrar por proveedor
- `estado` - Filtrar por estado
- `fecha_desde` - Desde fecha
- `fecha_hasta` - Hasta fecha
- `search` - Buscar
- `ordering` - Ordenar

#### Crear Orden de Compra
```
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
```
POST /api/compras/ordenes-compra/{id}/aprobar/
```

**Request Body:**
```json
{
    "aprobador": 2
}
```

#### Registrar Recepción
```
POST /api/compras/ordenes-compra/{id}/registrar_recepcion/
```

**Request Body:**
```json
{
    "detalle_orden": 1,
    "cantidad_recibida": "500.00",
    "recibido_por": 4,
    "tiene_no_conformidades": false,
    "observaciones": "Material conforme, sin novedad"
}
```

**Con No Conformidades:**
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
```
GET /api/compras/contratos/
```

#### Crear Contrato
```
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
    "documento_contrato": "<file upload>",
    "observaciones": "Contrato marco anual"
}
```

#### Contratos Vigentes
```
GET /api/compras/contratos/vigentes/
```

**Respuesta:**
```json
{
    "count": 5,
    "results": [
        {
            "id": 1,
            "numero_contrato": "CTR-2025-0001",
            "proveedor_nombre": "Proveedor XYZ S.A.S.",
            "tipo_contrato_nombre": "Marco",
            "fecha_inicio": "2025-01-01",
            "fecha_fin": "2025-12-31",
            "esta_vigente": true,
            "dias_vigencia": 365
        }
    ]
}
```

#### Contratos Por Vencer
```
GET /api/compras/contratos/por_vencer/?dias=30
```

**Respuesta:**
```json
{
    "count": 2,
    "results": [
        {
            "id": 3,
            "numero_contrato": "CTR-2025-0003",
            "proveedor_nombre": "Proveedor ABC Ltda",
            "fecha_fin": "2026-01-15",
            "dias_restantes": 19
        }
    ]
}
```

### Recepciones

#### Listar Recepciones
```
GET /api/compras/recepciones/
```

#### Recepciones No Conformes
```
GET /api/compras/recepciones/no_conformes/
```

**Respuesta:**
```json
{
    "count": 3,
    "results": [
        {
            "id": 5,
            "numero_recepcion": "REC-2025-0005",
            "orden_compra_numero": "ORD-2025-0002",
            "fecha_recepcion": "2025-12-27T09:00:00Z",
            "tiene_no_conformidades": true,
            "descripcion_no_conformidad": "Material con temperatura fuera de especificación",
            "cantidad_recibida": "480.00"
        }
    ]
}
```

## Códigos de Estado HTTP

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `204 No Content` - Eliminación exitosa
- `400 Bad Request` - Datos inválidos
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No autorizado
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

## Paginación

Todas las listas están paginadas por defecto:
- `page_size` por defecto: 20
- Personalizable: `?page_size=50`
- Navegar: `?page=2`

## Ordenamiento

Usar parámetro `ordering`:
```
GET /api/compras/requisiciones/?ordering=-fecha_requisicion
GET /api/compras/ordenes-compra/?ordering=total
GET /api/compras/contratos/?ordering=-fecha_inicio
```

Prefijo `-` para orden descendente.

## Filtros

### Filtros Comunes:
- `search` - Búsqueda en múltiples campos
- `estado` - ID de estado
- `fecha_desde` - Fecha inicio (formato: YYYY-MM-DD)
- `fecha_hasta` - Fecha fin (formato: YYYY-MM-DD)

### Filtros Específicos:
- **Requisiciones:** `solicitante`, `prioridad`, `aprobador`
- **Cotizaciones:** `requisicion`, `proveedor`, `es_seleccionada`
- **Órdenes:** `cotizacion`, `proveedor`
- **Contratos:** `tipo_contrato`, `proveedor`
- **Recepciones:** `orden_compra`, `recibido_por`, `tiene_no_conformidades`

## Autenticación

Todas las peticiones requieren token JWT en header:
```
Authorization: Bearer <your_jwt_token>
```

Obtener token:
```
POST /api/auth/token/
{
    "username": "usuario",
    "password": "contraseña"
}
```

---
**Documentación generada:** 27 de diciembre de 2025
**Versión API:** v1
**Módulo:** Compras - Supply Chain
