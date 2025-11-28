# Instrucciones de Instalación - Módulo Ecoaliados

## Archivos Creados

Se han creado los siguientes archivos para el módulo Ecoaliados:

```
backend/apps/ecoaliados/
├── __init__.py              ✓ (ya existía)
├── apps.py                  ✓ (ya existía)
├── models.py                ✓ (ya existía)
├── serializers.py           ✓ NUEVO - 14,545 líneas
├── viewsets.py              ✓ NUEVO - 12,635 líneas
├── permissions.py           ✓ NUEVO - 4,758 líneas
├── filters.py               ✓ NUEVO - 2,475 líneas
├── admin.py                 ✓ NUEVO - 8,281 líneas
├── urls.py                  ✓ NUEVO - 552 líneas
├── tests.py                 ✓ NUEVO - 8,821 líneas
├── README.md                ✓ NUEVO - Documentación completa
└── INSTALACION.md           ✓ NUEVO - Este archivo
```

**Total: 2,221 líneas de código** (Python + Markdown)

## Pasos de Integración

### 1. Agregar a INSTALLED_APPS

Editar `backend/config/settings.py`:

```python
INSTALLED_APPS = [
    # ...apps existentes...
    'apps.proveedores',
    'apps.ecoaliados',  # ← AGREGAR ESTA LÍNEA
    # ...otras apps...
]
```

### 2. Registrar URLs

Editar el archivo principal de URLs (probablemente `backend/config/urls.py` o `backend/urls.py`):

```python
urlpatterns = [
    # ...otras rutas...
    path('api/ecoaliados/', include('apps.ecoaliados.urls')),  # ← AGREGAR ESTA LÍNEA
    # ...otras rutas...
]
```

### 3. Crear Migraciones

```bash
cd backend
python manage.py makemigrations ecoaliados
```

Esto generará archivos de migración en `apps/ecoaliados/migrations/`.

**Verificar la migración:**
```bash
python manage.py sqlmigrate ecoaliados 0001
```

### 4. Aplicar Migraciones

```bash
python manage.py migrate ecoaliados
```

### 5. Crear Superusuario (si no existe)

```bash
python manage.py createsuperuser
```

### 6. Verificar en Django Admin

1. Iniciar servidor:
   ```bash
   python manage.py runserver
   ```

2. Acceder al admin: `http://localhost:8000/admin/`

3. Verificar que aparezcan:
   - **Ecoaliados** → Ecoaliado
   - **Ecoaliados** → Historial de Precio Ecoaliado

## Datos de Prueba

### Requisitos Previos

Para crear ecoaliados necesitas:

1. **Cargo de Comercial Econorte o Líder Comercial Econorte** en la tabla `Cargo`
   ```sql
   INSERT INTO core_cargo (code, name, level, is_active) VALUES
   ('comercial_econorte', 'Comercial Econorte', 2, 1),
   ('lider_com_econorte', 'Líder Comercial Econorte', 2, 1);
   ```

2. **Usuario con cargo de comercial**
   - Crear desde el admin de Django
   - Asignar cargo `comercial_econorte` o `lider_com_econorte`

3. **Unidad de Negocio que maneje ACU**
   - Tipo proveedor: `UNIDAD_NEGOCIO`
   - Subtipo materia: `["ACU"]`

### Script de Datos de Prueba

Crear archivo `backend/scripts/crear_datos_ecoaliados.py`:

```python
from apps.core.models import User, Cargo
from apps.proveedores.models import Proveedor
from apps.ecoaliados.models import Ecoaliado
from decimal import Decimal

# Obtener o crear cargo
cargo, _ = Cargo.objects.get_or_create(
    code='comercial_econorte',
    defaults={
        'name': 'Comercial Econorte',
        'level': 2,
        'is_active': True
    }
)

# Obtener comercial (ajustar según tu usuario)
comercial = User.objects.filter(cargo__code='comercial_econorte').first()

# Obtener o crear unidad de negocio
unidad, _ = Proveedor.objects.get_or_create(
    numero_documento='900555666-1',
    defaults={
        'tipo_proveedor': 'UNIDAD_NEGOCIO',
        'subtipo_materia': ['ACU'],
        'nombre_comercial': 'Econorte Bogotá',
        'razon_social': 'Econorte Bogotá SAS',
        'tipo_documento': 'NIT',
        'direccion': 'Calle 100 # 20-30',
        'ciudad': 'Bogotá',
        'departamento': 'BOGOTA',
        'is_active': True
    }
)

# Crear ecoaliados de prueba
ecoaliados_data = [
    {
        'razon_social': 'Restaurante El Buen Sabor',
        'documento_numero': '800111222-1',
        'telefono': '3001111111',
        'ciudad': 'Bogotá',
        'precio_compra_kg': Decimal('1500.00'),
    },
    {
        'razon_social': 'Cafetería La Esquina',
        'documento_numero': '800222333-1',
        'telefono': '3002222222',
        'ciudad': 'Medellín',
        'precio_compra_kg': Decimal('1400.00'),
    },
    {
        'razon_social': 'Hotel Central',
        'documento_numero': '900333444-1',
        'telefono': '3003333333',
        'ciudad': 'Cali',
        'precio_compra_kg': Decimal('1800.00'),
    },
]

for data in ecoaliados_data:
    Ecoaliado.objects.get_or_create(
        documento_numero=data['documento_numero'],
        defaults={
            'razon_social': data['razon_social'],
            'documento_tipo': 'NIT',
            'unidad_negocio': unidad,
            'telefono': data['telefono'],
            'direccion': 'Dirección de prueba',
            'ciudad': data['ciudad'],
            'departamento': 'BOGOTA',
            'precio_compra_kg': data['precio_compra_kg'],
            'comercial_asignado': comercial,
            'created_by': comercial,
            'is_active': True
        }
    )

print("Datos de prueba creados exitosamente")
```

Ejecutar:
```bash
python manage.py shell < scripts/crear_datos_ecoaliados.py
```

## Verificación de Endpoints

### 1. Listar Ecoaliados

```bash
curl -X GET http://localhost:8000/api/ecoaliados/ecoaliados/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Crear Ecoaliado

```bash
curl -X POST http://localhost:8000/api/ecoaliados/ecoaliados/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razon_social": "Restaurante Test API",
    "documento_tipo": "NIT",
    "documento_numero": "800999888-1",
    "unidad_negocio": 1,
    "telefono": "3009999999",
    "direccion": "Calle Test 123",
    "ciudad": "Bogotá",
    "departamento": "Bogotá D.C.",
    "precio_compra_kg": 1600.00,
    "comercial_asignado": 1,
    "is_active": true
  }'
```

### 3. Cambiar Precio (Líder Comercial+)

```bash
curl -X POST http://localhost:8000/api/ecoaliados/ecoaliados/1/cambiar-precio/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "precio_nuevo": 1900.00,
    "justificacion": "Ajuste por inflación"
  }'
```

### 4. Ver Historial de Precios

```bash
curl -X GET http://localhost:8000/api/ecoaliados/ecoaliados/1/historial-precios/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Estadísticas

```bash
curl -X GET http://localhost:8000/api/ecoaliados/ecoaliados/estadisticas/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Tests

Ejecutar todos los tests:
```bash
python manage.py test apps.ecoaliados
```

Ejecutar tests con verbose:
```bash
python manage.py test apps.ecoaliados --verbosity=2
```

Ejecutar test específico:
```bash
python manage.py test apps.ecoaliados.tests.EcoaliadoModelTest.test_crear_ecoaliado
```

## Solución de Problemas

### Error: No module named 'apps.ecoaliados'

- Verificar que `'apps.ecoaliados'` esté en `INSTALLED_APPS`
- Reiniciar el servidor Django

### Error: Table 'ecoaliados_ecoaliado' doesn't exist

- Ejecutar: `python manage.py migrate ecoaliados`

### Error: Usuario no puede crear ecoaliados

- Verificar que el usuario tenga cargo `comercial_econorte` o `lider_com_econorte`
- Verificar que el cargo esté activo (`is_active=True`)

### Error: Unidad de negocio no válida

- Verificar que el proveedor sea tipo `UNIDAD_NEGOCIO`
- Verificar que `subtipo_materia` incluya `'ACU'`

### Error al cambiar precio: Permiso denegado

- Solo Líder Comercial, Gerente o SuperAdmin pueden cambiar precios
- Comerciales solo pueden crear ecoaliados con precio inicial

## Checklist de Verificación

- [ ] Módulo agregado a `INSTALLED_APPS`
- [ ] URLs registradas en `urls.py` principal
- [ ] Migraciones creadas con `makemigrations`
- [ ] Migraciones aplicadas con `migrate`
- [ ] Modelos visibles en Django Admin
- [ ] Cargos de comerciales creados
- [ ] Al menos un usuario comercial creado
- [ ] Al menos una unidad de negocio con ACU creada
- [ ] Ecoaliado de prueba creado exitosamente
- [ ] Endpoints API funcionando correctamente
- [ ] Tests pasando correctamente

## Documentación Adicional

Ver `README.md` para:
- Descripción detallada de modelos
- Ejemplos de uso de API
- Permisos por rol
- Filtros disponibles
- Validaciones implementadas

## Soporte

Para más información sobre la estructura del proyecto Django y patrones implementados, consultar:
- `apps/proveedores/` - Módulo de referencia similar
- `apps/core/` - Modelos base y autenticación
