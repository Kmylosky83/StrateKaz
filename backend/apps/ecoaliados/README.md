# Módulo Ecoaliados

Módulo para gestión de Ecoaliados - Proveedores pequeños de ACU (Aceite Comestible Usado) vinculados a Unidades de Negocio.

## Descripción

Los **Ecoaliados** son proveedores pequeños (restaurantes, cafeterías, etc.) que venden Aceite Comestible Usado (ACU) a las Unidades de Negocio de la empresa. Este módulo permite:

- Registro y gestión de ecoaliados
- Asignación a comerciales
- Gestión de precios de compra
- Historial completo de cambios de precio
- Geolocalización de ecoaliados
- Estadísticas y reportes

## Estructura del Módulo

```
ecoaliados/
├── models.py              # Modelos Ecoaliado y HistorialPrecioEcoaliado
├── serializers.py         # Serializers para API REST
├── viewsets.py            # ViewSets con lógica de negocio
├── permissions.py         # Permisos por rol
├── filters.py             # Filtros personalizados
├── admin.py              # Configuración del admin de Django
├── urls.py               # Rutas del módulo
├── tests.py              # Tests unitarios
└── README.md             # Esta documentación
```

## Modelos

### Ecoaliado

Modelo principal que representa a un proveedor pequeño de ACU.

**Campos principales:**
- `codigo`: Código único autoincremental (ECO-0001)
- `razon_social`: Nombre o razón social
- `documento_tipo` / `documento_numero`: Identificación
- `unidad_negocio`: FK a Proveedor (tipo UNIDAD_NEGOCIO que maneje ACU)
- `comercial_asignado`: FK a User (cargo lider_com_econorte o comercial_econorte)
- `precio_compra_kg`: Precio de compra pactado
- `latitud` / `longitud`: Geolocalización GPS (opcional)
- `is_active`: Estado activo/inactivo
- `deleted_at`: Soft delete

**Métodos importantes:**
- `soft_delete()`: Eliminación lógica
- `restore()`: Restauración de eliminado
- `is_deleted`: Property que verifica eliminación
- `tiene_geolocalizacion`: Property que verifica coordenadas GPS

### HistorialPrecioEcoaliado

Registro de auditoría para cambios de precio.

**Campos principales:**
- `ecoaliado`: FK al ecoaliado
- `precio_anterior`: Precio antes del cambio
- `precio_nuevo`: Nuevo precio
- `tipo_cambio`: CREACION, AUMENTO, DISMINUCION, AJUSTE
- `justificacion`: Motivo del cambio
- `modificado_por`: Usuario que realizó el cambio
- `fecha_modificacion`: Timestamp del cambio

**Properties calculadas:**
- `diferencia_precio`: Diferencia entre precio nuevo y anterior
- `porcentaje_cambio`: Porcentaje de variación

## API Endpoints

### Ecoaliados

```
GET    /api/ecoaliados/ecoaliados/                    # Lista de ecoaliados
POST   /api/ecoaliados/ecoaliados/                    # Crear ecoaliado
GET    /api/ecoaliados/ecoaliados/{id}/               # Detalle
PUT    /api/ecoaliados/ecoaliados/{id}/               # Actualizar completo
PATCH  /api/ecoaliados/ecoaliados/{id}/               # Actualizar parcial
DELETE /api/ecoaliados/ecoaliados/{id}/               # Soft delete
POST   /api/ecoaliados/ecoaliados/{id}/cambiar-precio/ # Cambiar precio
GET    /api/ecoaliados/ecoaliados/{id}/historial-precios/ # Ver historial
POST   /api/ecoaliados/ecoaliados/{id}/restore/       # Restaurar eliminado
GET    /api/ecoaliados/ecoaliados/estadisticas/       # Estadísticas
```

### Historial de Precios

```
GET /api/ecoaliados/historial-precios/     # Lista de cambios
GET /api/ecoaliados/historial-precios/{id}/ # Detalle de cambio
```

## Permisos por Rol

### comercial_econorte
- **CRUD**: Solo de SUS propios ecoaliados (filtrado por `comercial_asignado=request.user`)
- **Cambio de precio**: NO permitido
- **Ver estadísticas**: Solo de sus ecoaliados

### lider_com_econorte
- **CRUD**: Todos los ecoaliados
- **Cambio de precio**: SÍ permitido
- **Ver estadísticas**: Todos los ecoaliados

### gerente / superadmin
- **CRUD**: Todos los ecoaliados
- **Cambio de precio**: SÍ permitido
- **Ver estadísticas**: Todos los ecoaliados

## Filtros Disponibles

### Filtros exactos
- `unidad_negocio`: ID de la unidad de negocio
- `comercial_asignado`: ID del comercial
- `is_active`: true/false
- `documento_tipo`: CC, CE, NIT, PASAPORTE

### Filtros con búsqueda (icontains)
- `ciudad`: Búsqueda por ciudad
- `departamento`: Búsqueda por departamento
- `codigo`: Búsqueda por código
- `razon_social`: Búsqueda por razón social

### Filtros de rango
- `precio_min`: Precio mínimo
- `precio_max`: Precio máximo

### Filtros booleanos
- `tiene_geolocalizacion`: true/false

### Ejemplo de uso:
```
GET /api/ecoaliados/ecoaliados/?ciudad=Bogotá&is_active=true&precio_min=1000&precio_max=2000
```

## Validaciones Importantes

### Al crear/actualizar ecoaliado:
1. La `unidad_negocio` debe ser tipo `UNIDAD_NEGOCIO`
2. La `unidad_negocio` debe manejar ACU en `subtipo_materia`
3. El `comercial_asignado` debe tener cargo `lider_com_econorte` o `comercial_econorte`
4. El `comercial_asignado` debe estar activo
5. El `precio_compra_kg` debe ser >= 0
6. Las coordenadas GPS deben estar en rangos válidos:
   - Latitud: -90 a 90
   - Longitud: -180 a 180

### Al cambiar precio:
1. Solo Líder Comercial, Gerente o SuperAdmin
2. El nuevo precio debe ser diferente al actual
3. Debe proporcionar justificación
4. No se puede cambiar precio de ecoaliado eliminado

## Serializers

### EcoaliadoListSerializer
Para listados - campos resumidos + nombres relacionados

### EcoaliadoDetailSerializer
Para detalle completo + historial de precios reciente (últimos 5)

### EcoaliadoCreateSerializer
Para creación con validaciones completas

### EcoaliadoUpdateSerializer
Para actualización (NO permite cambiar código ni documento_numero)

### CambiarPrecioEcoaliadoSerializer
Para cambio de precio con validaciones de permisos

### HistorialPrecioEcoaliadoSerializer
Para historial con campos calculados (diferencia, porcentaje)

## Ejemplo de Uso

### Crear ecoaliado

```python
POST /api/ecoaliados/ecoaliados/
{
    "razon_social": "Restaurante El Buen Sabor",
    "documento_tipo": "NIT",
    "documento_numero": "900123456-1",
    "unidad_negocio": 1,  // ID de unidad de negocio
    "telefono": "3001234567",
    "email": "contacto@buensabor.com",
    "direccion": "Carrera 15 # 85-20",
    "ciudad": "Bogotá",
    "departamento": "Bogotá D.C.",
    "latitud": 4.6535,
    "longitud": -74.0835,
    "precio_compra_kg": 1500.00,
    "comercial_asignado": 5,  // ID del comercial
    "observaciones": "Cliente de hace 2 años",
    "is_active": true
}
```

### Cambiar precio

```python
POST /api/ecoaliados/ecoaliados/1/cambiar-precio/
{
    "precio_nuevo": 1800.00,
    "justificacion": "Ajuste por inflación y aumento en costos de transporte"
}
```

### Ver historial de precios

```python
GET /api/ecoaliados/ecoaliados/1/historial-precios/

Response:
{
    "ecoaliado": {
        "id": 1,
        "codigo": "ECO-0001",
        "razon_social": "Restaurante El Buen Sabor",
        "precio_actual": 1800.00
    },
    "total_cambios": 3,
    "historial": [
        {
            "id": 3,
            "precio_anterior": 1500.00,
            "precio_nuevo": 1800.00,
            "diferencia_precio": 300.00,
            "porcentaje_cambio": 20.00,
            "tipo_cambio": "AUMENTO",
            "justificacion": "Ajuste por inflación",
            "modificado_por_nombre": "Juan Pérez",
            "fecha_modificacion": "2024-11-21T10:30:00Z"
        },
        ...
    ]
}
```

## Soft Delete

Todos los ecoaliados eliminados usan soft delete:

```python
# Eliminar
DELETE /api/ecoaliados/ecoaliados/1/
# Marca deleted_at con timestamp y is_active=False

# Restaurar
POST /api/ecoaliados/ecoaliados/1/restore/
# Limpia deleted_at y is_active=True
```

## Estadísticas

```python
GET /api/ecoaliados/ecoaliados/estadisticas/

Response:
{
    "resumen": {
        "total": 45,
        "activos": 42,
        "inactivos": 3,
        "con_geolocalizacion": 38,
        "porcentaje_geolocalizacion": 84.44
    },
    "precios": {
        "promedio": 1650.50,
        "minimo": 1200.00,
        "maximo": 2500.00
    },
    "por_unidad_negocio": [...],
    "por_comercial": [...],
    "por_ciudad": [...]
}
```

## Notas Importantes

1. **NO modificar `settings.py`** - Debe hacerse manualmente después
2. **NO crear migraciones** - Se crearán después con `python manage.py makemigrations`
3. El código de ecoaliado se genera **automáticamente** (ECO-0001, ECO-0002, etc.)
4. Al crear un ecoaliado, se crea automáticamente el primer registro en historial de precios
5. El historial de precios es **inmutable** (solo lectura en el admin)
6. Los comerciales solo ven sus propios ecoaliados en las consultas

## Testing

Ejecutar tests:
```bash
python manage.py test apps.ecoaliados
```

## Integración con otros módulos

- **Proveedores**: Relación con Unidades de Negocio (tipo UNIDAD_NEGOCIO)
- **Core**: Relación con Users (comerciales asignados)
- **Liquidaciones**: Los ecoaliados pueden ser proveedores en liquidaciones de ACU

## Siguiente paso

Después de crear estos archivos:

1. Agregar `'apps.ecoaliados'` a `INSTALLED_APPS` en `settings.py`
2. Agregar las rutas en el `urls.py` principal
3. Ejecutar: `python manage.py makemigrations ecoaliados`
4. Ejecutar: `python manage.py migrate`
5. Crear datos de prueba
