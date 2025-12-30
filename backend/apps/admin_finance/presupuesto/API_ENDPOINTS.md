# API Endpoints - Módulo Presupuesto

## Base URL
`/api/presupuesto/`

---

## 1. Centros de Costo

### Listar Centros de Costo
```http
GET /api/presupuesto/centros-costo/
```
**Query Params:**
- `estado` - Filtrar por estado (activo/inactivo)
- `area` - Filtrar por área (ID)
- `search` - Buscar por codigo o nombre
- `ordering` - Ordenar por: codigo, nombre, created_at

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "codigo": "CC-001",
      "nombre": "Centro Administrativo",
      "area_nombre": "Administración",
      "estado": "activo",
      "estado_display": "Activo"
    }
  ]
}
```

### Crear Centro de Costo
```http
POST /api/presupuesto/centros-costo/
```
**Body:**
```json
{
  "codigo": "CC-001",
  "nombre": "Centro Administrativo",
  "descripcion": "Centro de costo para gastos administrativos",
  "area": 1,
  "responsable": 5,
  "estado": "activo"
}
```

### Detalle Centro de Costo
```http
GET /api/presupuesto/centros-costo/{id}/
```

### Actualizar Centro de Costo
```http
PUT /api/presupuesto/centros-costo/{id}/
PATCH /api/presupuesto/centros-costo/{id}/
```

### Eliminar Centro de Costo (Soft Delete)
```http
DELETE /api/presupuesto/centros-costo/{id}/
```

---

## 2. Rubros Presupuestales

### Listar Rubros
```http
GET /api/presupuesto/rubros/
```
**Query Params:**
- `tipo` - Filtrar por tipo (ingreso/egreso)
- `categoria` - Filtrar por categoría
- `search` - Buscar por codigo o nombre
- `ordering` - Ordenar por: codigo, nombre, tipo, created_at

**Response:**
```json
{
  "count": 20,
  "results": [
    {
      "id": 1,
      "codigo": "RUB-001",
      "nombre": "Salarios y Prestaciones",
      "tipo": "egreso",
      "tipo_display": "Egreso",
      "categoria": "operacional",
      "categoria_display": "Operacional"
    }
  ]
}
```

### Crear Rubro (Código Auto-generado)
```http
POST /api/presupuesto/rubros/
```
**Body:**
```json
{
  "nombre": "Salarios y Prestaciones",
  "tipo": "egreso",
  "categoria": "operacional",
  "descripcion": "Nómina y prestaciones sociales",
  "rubro_padre": null
}
```
**Response:** Código generado automáticamente (RUB-001, RUB-002...)

### Listar Rubros por Tipo
```http
GET /api/presupuesto/rubros/por_tipo/?tipo=ingreso
```
**Response:**
```json
{
  "tipo": "ingreso",
  "count": 5,
  "results": [...]
}
```

### Detalle Rubro (con subrubros)
```http
GET /api/presupuesto/rubros/{id}/
```
**Response:**
```json
{
  "id": 1,
  "codigo": "RUB-001",
  "nombre": "Gastos de Personal",
  "tipo": "egreso",
  "categoria": "operacional",
  "subrubros": [
    {
      "id": 2,
      "codigo": "RUB-002",
      "nombre": "Salarios Básicos"
    }
  ]
}
```

---

## 3. Presupuestos por Área

### Listar Presupuestos
```http
GET /api/presupuesto/presupuestos/
```
**Query Params:**
- `estado` - Filtrar por estado
- `anio` - Filtrar por año (ej: 2025)
- `area` - Filtrar por área (ID)
- `centro_costo` - Filtrar por centro de costo (ID)
- `rubro` - Filtrar por rubro (ID)
- `search` - Buscar por codigo
- `ordering` - Ordenar por: anio, monto_asignado, monto_ejecutado, created_at

**Response:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "codigo": "PRE-2025-0001",
      "area_nombre": "Producción",
      "centro_costo_nombre": null,
      "rubro_nombre": "Materias Primas",
      "anio": 2025,
      "monto_asignado": "500000.00",
      "monto_ejecutado": "250000.00",
      "saldo_disponible": "250000.00",
      "porcentaje_ejecucion": "50.00",
      "estado": "vigente",
      "estado_display": "Vigente"
    }
  ]
}
```

### Crear Presupuesto (Código Auto-generado)
```http
POST /api/presupuesto/presupuestos/
```
**Body:**
```json
{
  "area": 2,
  "centro_costo": null,
  "rubro": 5,
  "anio": 2025,
  "monto_asignado": "500000.00",
  "monto_ejecutado": "0.00",
  "estado": "borrador",
  "observaciones": "Presupuesto anual de producción"
}
```
**Response:** Código generado: PRE-2025-0001

### Detalle Presupuesto
```http
GET /api/presupuesto/presupuestos/{id}/
```
**Response:**
```json
{
  "id": 1,
  "codigo": "PRE-2025-0001",
  "area": 2,
  "area_nombre": "Producción",
  "rubro": 5,
  "rubro_nombre": "Materias Primas",
  "rubro_tipo": "egreso",
  "anio": 2025,
  "monto_asignado": "500000.00",
  "monto_ejecutado": "250000.00",
  "saldo_disponible": "250000.00",
  "porcentaje_ejecucion": "50.00",
  "estado": "vigente"
}
```

### Resumen de Ejecución por Área
```http
GET /api/presupuesto/presupuestos/resumen_ejecucion/?anio=2025
```
**Response:**
```json
{
  "anio": 2025,
  "total_areas": 5,
  "resumen": [
    {
      "area": "Producción",
      "total_asignado": "1500000.00",
      "total_ejecutado": "750000.00",
      "saldo_disponible": "750000.00",
      "porcentaje_ejecucion": 50.0,
      "presupuestos": [
        {
          "codigo": "PRE-2025-0001",
          "rubro": "Materias Primas",
          "asignado": "500000.00",
          "ejecutado": "250000.00",
          "porcentaje": 50.0,
          "saldo": "250000.00"
        }
      ]
    }
  ]
}
```

### Presupuesto Disponible por Rubro
```http
GET /api/presupuesto/presupuestos/disponible/?anio=2025&tipo=egreso
```
**Response:**
```json
{
  "anio": 2025,
  "tipo_rubro": "egreso",
  "total_rubros": 10,
  "rubros": [
    {
      "rubro": "Salarios",
      "tipo": "egreso",
      "total_asignado": "2000000.00",
      "total_ejecutado": "1000000.00",
      "saldo_disponible": "1000000.00",
      "porcentaje_disponible": 50.0,
      "areas": [
        {
          "area": "Administración",
          "asignado": 800000.00,
          "ejecutado": 400000.00,
          "disponible": 400000.00
        }
      ]
    }
  ]
}
```

---

## 4. Aprobaciones

### Listar Aprobaciones
```http
GET /api/presupuesto/aprobaciones/
```
**Query Params:**
- `estado` - Filtrar por estado (pendiente/aprobado/rechazado)
- `nivel_aprobacion` - Filtrar por nivel (supervisor/gerencia/direccion)
- `presupuesto` - Filtrar por presupuesto (ID)
- `search` - Buscar por presupuesto__codigo

**Response:**
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "presupuesto_codigo": "PRE-2025-0001",
      "nivel_aprobacion": "supervisor",
      "nivel_aprobacion_display": "Supervisor de Área",
      "orden": 1,
      "aprobado_por_nombre": "Juan Pérez",
      "fecha_aprobacion": "2025-01-15T10:30:00Z",
      "estado": "aprobado",
      "estado_display": "Aprobado"
    }
  ]
}
```

### Crear Aprobación
```http
POST /api/presupuesto/aprobaciones/
```
**Body:**
```json
{
  "presupuesto": 1,
  "nivel_aprobacion": "supervisor",
  "orden": 1
}
```

### Aprobar Presupuesto
```http
POST /api/presupuesto/aprobaciones/{id}/aprobar/
```
**Response:**
```json
{
  "message": "Presupuesto aprobado exitosamente",
  "aprobacion": {
    "id": 1,
    "estado": "aprobado",
    "aprobado_por_nombre": "Juan Pérez",
    "fecha_aprobacion": "2025-01-15T10:30:00Z"
  }
}
```

### Rechazar Presupuesto
```http
POST /api/presupuesto/aprobaciones/{id}/rechazar/
```
**Body:**
```json
{
  "observaciones": "Monto muy elevado para el rubro de servicios"
}
```
**Response:**
```json
{
  "message": "Presupuesto rechazado",
  "aprobacion": {
    "id": 1,
    "estado": "rechazado",
    "observaciones": "Monto muy elevado..."
  }
}
```

### Aprobaciones Pendientes
```http
GET /api/presupuesto/aprobaciones/pendientes/
```
**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 3,
      "presupuesto_codigo": "PRE-2025-0003",
      "nivel_aprobacion": "gerencia",
      "nivel_aprobacion_display": "Gerencia",
      "estado": "pendiente"
    }
  ]
}
```

---

## 5. Ejecuciones Presupuestales

### Listar Ejecuciones
```http
GET /api/presupuesto/ejecuciones/
```
**Query Params:**
- `estado` - Filtrar por estado (pendiente/ejecutado/anulado)
- `presupuesto` - Filtrar por presupuesto (ID)
- `search` - Buscar por codigo, concepto, numero_documento
- `ordering` - Ordenar por: fecha, monto, created_at

**Response:**
```json
{
  "count": 100,
  "results": [
    {
      "id": 1,
      "codigo": "EJE-2025-0001",
      "fecha": "2025-01-10",
      "monto": "50000.00",
      "concepto": "Compra de materias primas",
      "presupuesto_codigo": "PRE-2025-0001",
      "presupuesto_area": "Producción",
      "presupuesto_rubro": "Materias Primas",
      "estado": "ejecutado",
      "estado_display": "Ejecutado"
    }
  ]
}
```

### Registrar Ejecución (Código Auto-generado)
```http
POST /api/presupuesto/ejecuciones/
```
**Body:**
```json
{
  "presupuesto": 1,
  "fecha": "2025-01-10",
  "monto": "50000.00",
  "concepto": "Compra de materias primas lote #123",
  "numero_documento": "FAC-2025-0456",
  "estado": "ejecutado",
  "observaciones": ""
}
```
**Con archivo:**
```http
POST /api/presupuesto/ejecuciones/
Content-Type: multipart/form-data

presupuesto=1
fecha=2025-01-10
monto=50000.00
concepto=Compra de materias primas
documento_soporte=<file.pdf>
numero_documento=FAC-2025-0456
```
**Response:** Código generado: EJE-2025-0001
- Actualiza automáticamente `monto_ejecutado` del presupuesto

### Detalle Ejecución
```http
GET /api/presupuesto/ejecuciones/{id}/
```
**Response:**
```json
{
  "id": 1,
  "codigo": "EJE-2025-0001",
  "presupuesto": 1,
  "presupuesto_codigo": "PRE-2025-0001",
  "presupuesto_area": "Producción",
  "presupuesto_rubro": "Materias Primas",
  "presupuesto_saldo_disponible": "450000.00",
  "fecha": "2025-01-10",
  "monto": "50000.00",
  "concepto": "Compra de materias primas",
  "documento_soporte": "/media/presupuesto/ejecuciones/2025/01/factura.pdf",
  "numero_documento": "FAC-2025-0456",
  "estado": "ejecutado"
}
```

### Anular Ejecución
```http
POST /api/presupuesto/ejecuciones/{id}/anular/
```
**Response:**
```json
{
  "message": "Ejecución anulada exitosamente",
  "ejecucion": {
    "id": 1,
    "codigo": "EJE-2025-0001",
    "estado": "anulado"
  }
}
```
**Efecto:** Revierte el monto del presupuesto (`monto_ejecutado -= monto`)

---

## Códigos de Estado HTTP

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado
- `204 No Content` - Eliminación exitosa
- `400 Bad Request` - Error de validación
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Sin permisos
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

---

## Validaciones Comunes

### Presupuesto
- ❌ No se puede ejecutar sin aprobar
- ❌ Monto ejecutado no puede exceder asignado
- ❌ Debe tener área o centro de costo

### Aprobación
- ❌ Solo se puede aprobar presupuestos en borrador/pendiente_aprobacion
- ❌ Rechazar requiere observaciones

### Ejecución
- ❌ Monto no puede exceder saldo disponible
- ❌ Solo sobre presupuestos aprobados/vigentes
- ❌ No se puede anular dos veces

---

## Autenticación

Todos los endpoints requieren autenticación JWT:

```http
Authorization: Bearer <token>
```

Los datos se filtran automáticamente por empresa del usuario autenticado.
