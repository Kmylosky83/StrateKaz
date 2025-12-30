# Instalación y Configuración de Swagger/OpenAPI

## Estado de Implementación

Se ha configurado completamente la documentación automática de API usando `drf-spectacular`.

### Archivos Modificados

1. **requirements.txt** - Agregado `drf-spectacular==0.27.0`
2. **config/settings.py** - Configuración completa de SPECTACULAR_SETTINGS
3. **config/urls.py** - URLs de documentación agregadas
4. **ViewSets documentados:**
   - `apps/analytics/config_indicadores/views.py` - CatalogoKPIViewSet
   - `apps/audit_system/centro_notificaciones/views.py` - NotificacionViewSet
   - `apps/sales_crm/gestion_clientes/views.py` - ClienteViewSet

## Pasos para Completar la Instalación

### 1. Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 2. Verificar Instalación

```bash
python manage.py spectacular --validate
```

### 3. Generar Schema

```bash
python manage.py spectacular --color --file schema.yml
```

### 4. Acceder a la Documentación

Una vez el servidor esté corriendo:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Schema JSON**: http://localhost:8000/api/schema/

## URLs de Documentación Configuradas

```python
path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
```

## Características Implementadas

### Configuración General

- **Título**: SGI Grasas y Huesos del Norte API
- **Versión**: 2.0.0
- **Descripción**: Incluye arquitectura de 6 niveles, 16 módulos, ~92 apps, ~300 endpoints

### Tags Configurados

1. Autenticación
2. Core
3. Dirección Estratégica
4. Motor de Cumplimiento
5. Motor de Riesgos
6. HSEQ
7. Supply Chain
8. Production Ops
9. Logistics Fleet
10. Sales CRM
11. Talent Hub
12. Admin Finance
13. Analytics
14. Audit System

### Swagger UI Settings

- Deep Linking habilitado
- Persistencia de autorización
- Filtros habilitados
- Syntax highlighting con tema Monokai

## ViewSets Documentados

### Analytics - CatalogoKPIViewSet

Operaciones CRUD completas con decoradores @extend_schema:
- `list`, `retrieve`, `create`, `update`, `partial_update`, `destroy`
- Acciones personalizadas:
  - `por_categoria` - KPIs agrupados por categoría
  - `por_area` - Alias (marcado como deprecated)

### Audit System - NotificacionViewSet

Gestión de notificaciones con:
- Operaciones CRUD estándar
- Acciones personalizadas:
  - `marcar_leida` - Marcar notificación individual
  - `marcar_todas_leidas` - Marcar todas del usuario
  - `no_leidas` - Obtener notificaciones pendientes

### Sales CRM - ClienteViewSet

Gestión completa de clientes:
- CRUD con filtros avanzados
- Acciones personalizadas:
  - `actualizar_scoring` - Recalcular scoring
  - `historial_compras` - Historial del cliente
  - `dashboard` - Métricas y KPIs

## Próximos Pasos Sugeridos

### 1. Documentar ViewSets Adicionales

Agregar decoradores @extend_schema a ViewSets de:
- Production Ops
- Logistics Fleet
- Talent Hub
- Supply Chain
- HSEQ Management

### 2. Personalizar Schemas

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

@extend_schema(
    parameters=[
        OpenApiParameter(
            name='filtro_personalizado',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='Descripción del filtro'
        )
    ]
)
@action(detail=False, methods=['get'])
def endpoint_personalizado(self, request):
    pass
```

### 3. Agregar Ejemplos de Respuesta

```python
@extend_schema(
    examples=[
        OpenApiExample(
            'Ejemplo de Cliente',
            value={
                'codigo_cliente': 'CLI-001',
                'razon_social': 'Empresa Ejemplo S.A.S',
                'nit': '900123456-1'
            }
        )
    ]
)
```

## Autenticación en Swagger

Para probar endpoints autenticados:

1. Obtener token JWT:
   ```bash
   POST /api/auth/login/
   {
     "username": "usuario",
     "password": "contraseña"
   }
   ```

2. En Swagger UI, click en "Authorize"
3. Ingresar: `Bearer {token}`

## Comandos Útiles

```bash
# Validar schema
python manage.py spectacular --validate

# Generar schema YAML
python manage.py spectacular --color --file schema.yml

# Generar schema JSON
python manage.py spectacular --format openapi-json --file schema.json

# Ver estadísticas
python manage.py spectacular --urlconf config.urls
```

## Solución de Problemas

### Error: "Module not found"
```bash
pip install drf-spectacular==0.27.0
```

### Error en validación de schema
Verificar que todos los serializers estén correctamente importados y que los modelos tengan campos válidos.

### Endpoints no aparecen
- Verificar que el ViewSet esté registrado en urls.py
- Verificar que `DEFAULT_SCHEMA_CLASS` esté configurado en settings.py

## Referencias

- Documentación oficial: https://drf-spectacular.readthedocs.io/
- GitHub: https://github.com/tfranzel/drf-spectacular
- Django REST Framework: https://www.django-rest-framework.org/
