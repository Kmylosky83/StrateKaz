# Instalación del Módulo Programaciones

Sistema de Gestión Grasas y Huesos del Norte S.A.S

## Archivos Creados

El módulo completo de Programaciones ha sido creado con los siguientes archivos:

```
backend/apps/programaciones/
├── __init__.py              # Inicialización del módulo
├── apps.py                  # Configuración de la app Django
├── models.py                # Modelo Programacion con validaciones
├── serializers.py           # 7 serializers para diferentes operaciones
├── viewsets.py              # ViewSet con 5 custom actions
├── permissions.py           # 4 clases de permisos por rol
├── filters.py               # 13 filtros personalizados
├── urls.py                  # Configuración de rutas API
├── admin.py                 # Configuración del admin de Django
├── signals.py               # Señales para eventos del modelo
├── README.md                # Documentación completa del módulo
└── INSTALACION.md           # Este archivo
```

## Archivos Actualizados

### 1. `backend/config/settings.py`

Se agregó `'apps.programaciones'` a INSTALLED_APPS:

```python
INSTALLED_APPS = [
    # ...
    'apps.ecoaliados',
    'apps.programaciones',  # ← AGREGADO
    'apps.recolecciones',
    # ...
]
```

### 2. `backend/config/urls.py`

Se agregó la ruta del módulo:

```python
urlpatterns = [
    # ...
    path('api/ecoaliados/', include('apps.ecoaliados.urls')),
    path('api/programaciones/', include('apps.programaciones.urls')),  # ← AGREGADO
    path('api/recolecciones/', include('apps.recolecciones.urls')),
    # ...
]
```

### 3. `backend/apps/core/models.py`

Se agregó PROGRAMACIONES a MODULE_CHOICES:

```python
MODULE_CHOICES = [
    # ...
    ('ECOALIADOS', 'Ecoaliados'),
    ('PROGRAMACIONES', 'Programaciones'),  # ← AGREGADO
    ('UNIDADES', 'Unidades de Recolección'),
    # ...
]
```

## Pasos de Instalación

### 1. Crear y Aplicar Migraciones

```bash
cd backend

# Crear migración del modelo
python manage.py makemigrations programaciones

# Verificar la migración generada
python manage.py showmigrations programaciones

# Aplicar la migración
python manage.py migrate programaciones
```

**Salida esperada:**
```
Migrations for 'programaciones':
  apps/programaciones/migrations/0001_initial.py
    - Create model Programacion

Operations to perform:
  Apply all migrations: programaciones
Running migrations:
  Applying programaciones.0001_initial... OK
```

### 2. Verificar Instalación

```bash
# Verificar que el modelo se creó correctamente
python manage.py dbshell
```

En MySQL:
```sql
SHOW TABLES LIKE 'programaciones%';
DESCRIBE programaciones_programacion;
EXIT;
```

### 3. Crear Permisos en el Admin (Opcional)

Si se desea gestionar permisos específicos para el módulo:

```bash
python manage.py shell
```

```python
from apps.core.models import Permiso

# Crear permisos para el módulo Programaciones
Permiso.objects.get_or_create(
    code='PROGRAMACIONES_VIEW_OWN',
    defaults={
        'name': 'Ver Programaciones Propias',
        'description': 'Puede ver sus propias programaciones',
        'module': 'PROGRAMACIONES',
        'action': 'VIEW',
        'scope': 'OWN',
        'is_active': True
    }
)

Permiso.objects.get_or_create(
    code='PROGRAMACIONES_VIEW_ALL',
    defaults={
        'name': 'Ver Todas las Programaciones',
        'description': 'Puede ver todas las programaciones',
        'module': 'PROGRAMACIONES',
        'action': 'VIEW',
        'scope': 'ALL',
        'is_active': True
    }
)

Permiso.objects.get_or_create(
    code='PROGRAMACIONES_CREATE',
    defaults={
        'name': 'Crear Programaciones',
        'description': 'Puede crear programaciones',
        'module': 'PROGRAMACIONES',
        'action': 'CREATE',
        'scope': 'OWN',
        'is_active': True
    }
)

Permiso.objects.get_or_create(
    code='PROGRAMACIONES_MANAGE_ALL',
    defaults={
        'name': 'Administrar Programaciones',
        'description': 'Puede administrar todas las programaciones',
        'module': 'PROGRAMACIONES',
        'action': 'MANAGE',
        'scope': 'ALL',
        'is_active': True
    }
)

print("Permisos creados exitosamente")
exit()
```

### 4. Verificar Endpoints

Iniciar el servidor:

```bash
python manage.py runserver
```

Probar endpoints (con herramienta como Postman o curl):

```bash
# Login (obtener token)
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Listar programaciones
curl -X GET http://localhost:8000/api/programaciones/programaciones/ \
  -H "Authorization: Bearer <TOKEN>"

# Obtener recolectores disponibles
curl -X GET http://localhost:8000/api/programaciones/programaciones/recolectores-disponibles/ \
  -H "Authorization: Bearer <TOKEN>"

# Estadísticas
curl -X GET http://localhost:8000/api/programaciones/programaciones/estadisticas/ \
  -H "Authorization: Bearer <TOKEN>"
```

## Verificación de Funcionalidad

### 1. Crear Programación (Comercial)

```bash
curl -X POST http://localhost:8000/api/programaciones/programaciones/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "ecoaliado": 1,
    "tipo_programacion": "PROGRAMADA",
    "fecha_programada": "2024-12-01",
    "cantidad_estimada_kg": 50.00,
    "observaciones_comercial": "Primera recolección del mes"
  }'
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "ecoaliado": 1,
  "tipo_programacion": "PROGRAMADA",
  "estado": "PROGRAMADA",
  "fecha_programada": "2024-12-01",
  "cantidad_estimada_kg": "50.00",
  ...
}
```

### 2. Asignar Recolector (Líder Logística)

```bash
curl -X POST http://localhost:8000/api/programaciones/programaciones/1/asignar-recolector/ \
  -H "Authorization: Bearer <TOKEN_LIDER_LOGISTICA>" \
  -H "Content-Type: application/json" \
  -d '{
    "recolector_asignado": 5,
    "observaciones_logistica": "Asignado por cercanía"
  }'
```

**Respuesta esperada:**
```json
{
  "detail": "Recolector asignado exitosamente",
  "programacion": {
    "id": 1,
    "estado": "CONFIRMADA",
    "recolector_asignado": 5,
    ...
  }
}
```

### 3. Cambiar Estado (Recolector)

```bash
curl -X POST http://localhost:8000/api/programaciones/programaciones/1/cambiar-estado/ \
  -H "Authorization: Bearer <TOKEN_RECOLECTOR>" \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_estado": "EN_RUTA",
    "observaciones": "Iniciando ruta"
  }'
```

## Validaciones Importantes

El módulo incluye las siguientes validaciones automáticas:

1. **Una programación por ecoaliado por día** (constraint en BD)
2. **Fecha programada debe ser futura** (al crear)
3. **Cantidad estimada > 0**
4. **Ecoaliado debe estar activo**
5. **Recolector debe tener cargo correcto**
6. **Transiciones de estado según rol**

## Filtrado por Rol

El módulo implementa filtrado automático según el rol del usuario:

- **comercial_econorte**: Solo ve sus programaciones (programado_por=usuario)
- **lider_com_econorte**: Ve todas las programaciones
- **lider_logistica_econorte**: Ve todas las programaciones
- **recolector_econorte**: Solo ve las asignadas a él
- **gerente/superadmin**: Ve todas

## Troubleshooting

### Error: "UNIQUE constraint failed"

Si al crear una programación recibes este error:
```
IntegrityError: UNIQUE constraint failed: programaciones_programacion.ecoaliado_id, programaciones_programacion.fecha_programada
```

**Causa**: Ya existe una programación activa para ese ecoaliado en esa fecha.

**Solución**:
- Cambiar la fecha de la programación
- O cancelar/eliminar la programación existente

### Error: "ValidationError: La fecha programada debe ser futura"

**Causa**: Intentas crear una programación con fecha pasada.

**Solución**: Usar fecha igual o posterior a hoy.

### Error: "No tiene permisos para gestionar programaciones"

**Causa**: El usuario no tiene el cargo correcto o no está activo.

**Solución**:
- Verificar que el usuario tenga cargo: comercial_econorte, lider_com_econorte, lider_logistica_econorte o recolector_econorte
- Verificar que el usuario esté activo (is_active=True)

### Error: "No se puede cambiar el estado"

**Causa**: La transición de estado no es válida o el usuario no tiene permisos.

**Solución**:
- Verificar las transiciones válidas en README.md
- Verificar que el usuario tenga el rol correcto para esa transición

## Endpoints Disponibles

Todos los endpoints del módulo:

```
GET    /api/programaciones/programaciones/
POST   /api/programaciones/programaciones/
GET    /api/programaciones/programaciones/{id}/
PUT    /api/programaciones/programaciones/{id}/
PATCH  /api/programaciones/programaciones/{id}/
DELETE /api/programaciones/programaciones/{id}/

POST   /api/programaciones/programaciones/{id}/asignar-recolector/
POST   /api/programaciones/programaciones/{id}/cambiar-estado/
POST   /api/programaciones/programaciones/{id}/reprogramar/
POST   /api/programaciones/programaciones/{id}/restore/

GET    /api/programaciones/programaciones/calendario/
GET    /api/programaciones/programaciones/estadisticas/
GET    /api/programaciones/programaciones/recolectores-disponibles/
```

## Próximos Pasos

Después de verificar que el módulo funciona correctamente:

1. **Crear fixtures de prueba**: Agregar datos de ejemplo para desarrollo
2. **Implementar tests**: Crear tests unitarios y de integración
3. **Agregar notificaciones**: Email/SMS cuando se asigna recolector
4. **Tarea automática**: Celery task para cambiar a EN_RUTA automáticamente
5. **Dashboard**: Crear vistas de calendario y estadísticas en el frontend

## Soporte

Para problemas o dudas:
- Revisar logs: `backend/logs/django.log`
- Consultar README.md para documentación completa
- Contactar al equipo de desarrollo

---

**Módulo creado el**: 2024-11-23
**Versión del sistema**: v8.0-reescritura
**Django**: 5.0.9
**DRF**: 3.14+
