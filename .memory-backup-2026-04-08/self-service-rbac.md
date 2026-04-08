---
name: self-service-rbac
description: Patrón RBAC para acciones self-service en portales — bypass GranularActionPermission
type: feedback
---

Acciones self-service (usuario gestiona SUS propios datos) DEBEN usar solo `IsAuthenticated`, NO `GranularActionPermission`.

**Why:** Los portales (Mi Portal, Mi Perfil) son transversales — cualquier usuario autenticado accede a sus propios datos independientemente de los permisos de módulo. GranularActionPermission verifica CargoSectionAccess del cargo, lo cual bloquea a usuarios cuyos cargos no tienen acceso a la sección del ViewSet.

**How to apply:**

1. **En ViewSets con acciones self-service**, override `get_permissions()`:
```python
SELF_SERVICE_ACTIONS = frozenset({'me', 'update_profile', 'upload_photo', 'firma_guardada'})

def get_permissions(self):
    if self.action in self.SELF_SERVICE_ACTIONS:
        return [IsAuthenticated()]
    return super().get_permissions()
```

2. **Endpoints self-service ya corregidos (2026-03-26):**
   - `UserViewSet`: me, update_profile, upload_photo, firma_guardada
   - `AceptacionDocumentalViewSet`: mis_pendientes (lecturas del usuario)
   - `HojaVidaViewSet`: por_colaborador (Mi Portal)

3. **Regla para nuevos endpoints:** Si la acción opera sobre datos DEL usuario autenticado (no de otros), es self-service → solo IsAuthenticated.

4. **Páginas contenedoras** que agrupan múltiples secciones RBAC deben usar `withModuleGuard`, NO `withFullGuard`. Las sub-secciones internas controlan su propio acceso. Ejemplo: OrganizacionPage (contiene areas, cargos, organigrama) usa `withModuleGuard('fundacion')`.
