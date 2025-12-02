# Permisos de Recolecciones - RBAC

## Resumen

Este documento describe el sistema de control de acceso basado en roles (RBAC) implementado para el módulo de Recolecciones.

## Clases de Permisos

### 1. PuedeRegistrarRecoleccion

**Descripción**: Controla quién puede registrar nuevas recolecciones.

**Roles permitidos**:
- `recolector_econorte` - Puede registrar sus propias recolecciones
- `lider_logistica_econorte` - Puede registrar cualquier recolección
- `gerente` (nivel 3+) - Puede registrar cualquier recolección
- `superadmin` - Puede registrar cualquier recolección

**Aplica a**:
- `POST /api/recolecciones/registrar/`

---

### 2. PuedeVerRecolecciones

**Descripción**: Controla quién puede ver recolecciones. Todos los usuarios autenticados pueden ver recolecciones, pero el queryset se filtra automáticamente según el rol.

**Roles permitidos**:
- Todos los usuarios autenticados

**Filtrado automático**:
- `recolector_econorte`: Solo ve sus propias recolecciones
- `comercial_econorte`: Solo ve recolecciones de sus ecoaliados asignados
- `lider_com_econorte`, `lider_logistica_econorte`, `gerente`, `superadmin`: Ven todas las recolecciones

**Aplica a**:
- `GET /api/recolecciones/`
- `GET /api/recolecciones/{id}/`
- `GET /api/recolecciones/mis-recolecciones/`
- `GET /api/recolecciones/por-ecoaliado/{id}/`

---

### 3. PuedeGenerarVoucher

**Descripción**: Controla quién puede generar/ver vouchers de recolecciones.

**Roles permitidos**:
- `recolector_econorte` - Solo puede ver vouchers de sus propias recolecciones
- `lider_logistica_econorte` - Puede ver todos los vouchers
- `gerente` (nivel 3+) - Puede ver todos los vouchers
- `superadmin` - Puede ver todos los vouchers

**Validación a nivel de objeto**: Los recolectores solo pueden acceder a vouchers de recolecciones donde `recoleccion.recolector == request.user`

**Aplica a**:
- `GET /api/recolecciones/{id}/voucher/`

---

### 4. PuedeVerEstadisticas

**Descripción**: Controla quién puede ver estadísticas de recolecciones.

**Roles permitidos**:
- `lider_com_econorte` - Puede ver estadísticas
- `comercial_econorte` - Puede ver estadísticas (filtradas por sus ecoaliados)
- `lider_logistica_econorte` - Puede ver todas las estadísticas
- `gerente` (nivel 3+) - Puede ver todas las estadísticas
- `superadmin` - Puede ver todas las estadísticas

**Aplica a**:
- `GET /api/recolecciones/estadisticas/`

---

### 5. PuedeEditarRecoleccion

**Descripción**: Controla quién puede editar recolecciones existentes.

**Roles permitidos**:
- `lider_logistica_econorte` - Puede editar cualquier recolección
- `gerente` (nivel 3+) - Puede editar cualquier recolección
- `superadmin` - Puede editar cualquier recolección

**NOTA IMPORTANTE**: Los recolectores NO pueden editar recolecciones una vez registradas.

**Aplica a**:
- `PUT /api/recolecciones/{id}/`
- `PATCH /api/recolecciones/{id}/`

---

### 6. PuedeEliminarRecoleccion

**Descripción**: Controla quién puede eliminar recolecciones.

**Roles permitidos** (CRÍTICO):
- `gerente` (nivel 3+) - Puede eliminar cualquier recolección
- `superadmin` - Puede eliminar cualquier recolección

**NOTA CRÍTICA**: Solo roles de Dirección (nivel 3+) pueden eliminar recolecciones para mantener integridad de datos.

**Aplica a**:
- `DELETE /api/recolecciones/{id}/`

---

## Matriz de Permisos por Rol

| Acción | Recolector | Comercial | Líder Com. | Líder Log. | Gerente | SuperAdmin |
|--------|-----------|-----------|-----------|-----------|---------|-----------|
| Listar recolecciones | ✅ (propias) | ✅ (sus eco.) | ✅ (todas) | ✅ (todas) | ✅ | ✅ |
| Ver detalle | ✅ (propias) | ✅ (sus eco.) | ✅ (todas) | ✅ (todas) | ✅ | ✅ |
| Registrar recolección | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver voucher | ✅ (propias) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver estadísticas | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar recolección | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Eliminar recolección | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Mis recolecciones | ✅ | N/A | N/A | N/A | N/A | N/A |

## Implementación en el Código

### En views.py

```python
from .permissions import (
    PuedeRegistrarRecoleccion,
    PuedeVerRecolecciones,
    PuedeGenerarVoucher,
    PuedeVerEstadisticas,
    PuedeEditarRecoleccion,
    PuedeEliminarRecoleccion,
)

class RecoleccionViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        """Retorna los permisos según la acción"""
        if self.action == 'registrar':
            permission_classes = [PuedeRegistrarRecoleccion]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [PuedeEditarRecoleccion]
        elif self.action == 'destroy':
            permission_classes = [PuedeEliminarRecoleccion]
        elif self.action == 'voucher':
            permission_classes = [PuedeGenerarVoucher]
        elif self.action == 'estadisticas':
            permission_classes = [PuedeVerEstadisticas]
        elif self.action in ['list', 'retrieve', 'mis_recolecciones', 'por_ecoaliado']:
            permission_classes = [PuedeVerRecolecciones]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]
```

## Mensajes de Error

Cada clase de permiso define un mensaje de error personalizado cuando se deniega el acceso:

- **PuedeRegistrarRecoleccion**: "No tiene permisos para registrar recolecciones. Se requiere cargo de Recolector, Líder Logística o superior."
- **PuedeVerRecolecciones**: "Debe estar autenticado para ver recolecciones."
- **PuedeGenerarVoucher**: "No tiene permisos para generar vouchers."
- **PuedeVerEstadisticas**: "No tiene permisos para ver estadísticas de recolecciones."
- **PuedeEditarRecoleccion**: "No tiene permisos para editar recolecciones. Se requiere cargo de Líder Logística o superior."
- **PuedeEliminarRecoleccion**: "No tiene permisos para eliminar recolecciones. Se requiere cargo de Gerente o SuperAdmin."

## Testing

Para probar los permisos:

```bash
# Como recolector - debe funcionar
curl -H "Authorization: Bearer <token_recolector>" \
  -X POST http://localhost:8000/api/recolecciones/registrar/ \
  -d '{"programacion_id": 1, "cantidad_kg": 100}'

# Como comercial - debe fallar
curl -H "Authorization: Bearer <token_comercial>" \
  -X POST http://localhost:8000/api/recolecciones/registrar/ \
  -d '{"programacion_id": 1, "cantidad_kg": 100}'
# Respuesta: 403 Forbidden

# Como recolector ver voucher de otro - debe fallar
curl -H "Authorization: Bearer <token_recolector_1>" \
  http://localhost:8000/api/recolecciones/123/voucher/
# Respuesta: 403 Forbidden (si recoleccion 123 no es suya)
```

## Notas de Seguridad

1. **Separación de responsabilidades**: Los recolectores solo pueden registrar, no editar ni eliminar.
2. **Validación en dos niveles**:
   - `has_permission()`: Valida a nivel de vista/acción
   - `has_object_permission()`: Valida a nivel de objeto específico (ej: voucher)
3. **SuperAdmin siempre tiene acceso**: El superadmin bypasses todas las restricciones.
4. **Eliminación restringida**: Solo gerentes pueden eliminar para evitar pérdida de datos accidental.
5. **Filtrado automático de queryset**: Además de permisos, el queryset se filtra automáticamente por rol.

## Changelog

- **2024-12-02**: Implementación inicial de RBAC para módulo Recolecciones
  - 6 clases de permisos creadas
  - Integración completa en RecoleccionViewSet
  - Documentación de permisos
