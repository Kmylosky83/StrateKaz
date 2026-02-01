# Migración 0003: Renombrar campo `order` a `orden`

## Contexto

Según la convención de nomenclatura del proyecto, los campos de negocio deben estar en **ESPAÑOL**. El campo de ordenamiento debe ser `orden` (no `order`).

## Cambios Realizados

### 1. Modelos (models.py)
- **StrategicObjective**: Campo `order` renombrado a `orden`
- **Meta.ordering**: Actualizado de `['bsc_perspective', 'order', 'code']` a `['bsc_perspective', 'orden', 'code']`

### 2. Serializers (serializers.py)
- **StrategicObjectiveSerializer**: Campo `order` cambiado a `orden` en fields
- **StrategicObjectiveCreateUpdateSerializer**: Campo `order` cambiado a `orden` en fields

### 3. Views (views.py)
- **StrategicObjectiveViewSet.ordering_fields**: Actualizado de `'order'` a `'orden'`
- **StrategicObjectiveViewSet.ordering**: Actualizado de `['bsc_perspective', 'order', 'code']` a `['bsc_perspective', 'orden', 'code']`

### 4. Admin (admin.py)
- **StrategicObjectiveAdmin.fieldsets**: Campo `order` cambiado a `orden` en sección 'Identificación'

### 5. Migración (0003_rename_order_to_orden.py)
- **RenameField**: Renombra el campo en la base de datos de `order` a `orden`

## Compatibilidad

El `OrderingMixin` en `apps/core/mixins.py` ya estaba configurado para trabajar con el campo `orden`, por lo que no requiere cambios.

## Archivos Modificados

1. `backend/apps/gestion_estrategica/planeacion/models.py`
2. `backend/apps/gestion_estrategica/planeacion/views.py`
3. `backend/apps/gestion_estrategica/planeacion/serializers.py`
4. `backend/apps/gestion_estrategica/planeacion/admin.py`
5. `backend/apps/gestion_estrategica/planeacion/migrations/0003_rename_order_to_orden.py` (nuevo)

## Aplicar Migración

```bash
cd backend
python manage.py migrate planeacion
```

## Verificación

Después de aplicar la migración, verificar que:
- El campo `orden` existe en la base de datos
- El ordenamiento funciona correctamente en la API
- El admin de Django muestra el campo `orden` correctamente

## Fecha
25 de diciembre de 2025
