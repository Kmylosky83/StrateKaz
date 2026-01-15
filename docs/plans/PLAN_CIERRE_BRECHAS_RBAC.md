# Plan de Cierre de Brechas RBAC - StrateKaz

**Versión:** 1.0
**Fecha:** 2026-01-12
**Estado:** Pendiente Aprobación
**Criticidad:** ALTA - Requerido para Producción

---

## 1. RESUMEN EJECUTIVO

### 1.1 Problema Identificado

El sistema de control de acceso basado en cargos (RBAC) tiene datos configurados pero **no se aplican**:

| Componente | Estado Actual | Estado Esperado |
|------------|---------------|-----------------|
| Tab 5 - Acceso UI | Guarda `section_ids` en BD | Debe filtrar navegación |
| Tab 6 - Permisos CRUD | Guarda `permission_ids` en BD | Debe validar acciones |
| Endpoint Sidebar | Retorna TODO a todos | Debe filtrar por cargo |
| ViewSets | Solo validan autenticación | Deben validar permisos |

### 1.2 Impacto de Seguridad

```
ACTUAL:  Usuario Normal → Ve TODO el sistema → Puede intentar TODAS las acciones
ESPERADO: Usuario Normal → Ve SOLO sus secciones → Puede ejecutar SOLO sus acciones
          Super Usuario → Ve TODO → Puede hacer TODO
```

### 1.3 Reglas de Negocio Confirmadas

1. **Super Usuario (`is_superuser=True`)**: Acceso total sin restricciones
2. **Usuario Normal**: Solo ve secciones asignadas a su cargo (Tab 5)
3. **Usuario Normal**: Solo puede ejecutar acciones asignadas a su cargo (Tab 6)
4. **Todo usuario DEBE tener un cargo asignado** (validación existente)
5. **Filtrado granular**: Sección → Tab → Módulo (de abajo hacia arriba)

---

## 2. ARQUITECTURA

### 2.1 Arquitectura Actual (DEFICIENTE)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO ACTUAL                              │
└─────────────────────────────────────────────────────────────┘

[Usuario Login]
       ↓
[GET /auth/me/] → Retorna user sin section_ids ni permissions
       ↓
[GET /sidebar/] → Retorna TODOS los módulos (sin filtrar)
       ↓
[Frontend Sidebar] → Renderiza TODO
       ↓
[Usuario ve TODO el sistema]
       ↓
[Acciones CRUD] → Solo valida IsAuthenticated ❌
       ↓
[Usuario puede intentar cualquier acción]
```

### 2.2 Arquitectura Objetivo (SEGURA)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO OBJETIVO                            │
└─────────────────────────────────────────────────────────────┘

[Usuario Login]
       ↓
[GET /auth/me/] → Retorna user CON:
                  - section_ids: [1,2,5,8] (de CargoSectionAccess)
                  - permissions: ["mod.recurso.accion", ...] (de CargoPermiso)
       ↓
[GET /sidebar/] → Backend filtra por cargo:
                  - Si is_superuser → TODO
                  - Si no → Solo módulos/tabs/secciones autorizadas
       ↓
[Frontend Sidebar] → Renderiza SOLO lo autorizado
       ↓
[Usuario ve SOLO sus secciones]
       ↓
[Acciones CRUD] → Valida:
                  1. IsAuthenticated ✓
                  2. CargoSectionAccess (puede ver la sección) ✓
                  3. CargoPermiso (puede ejecutar la acción) ✓
       ↓
[Usuario solo puede ejecutar acciones autorizadas]
```

### 2.3 Modelo de Datos Relevante

```
┌──────────────┐       ┌─────────────────────┐
│    Cargo     │───M2M─│  CargoSectionAccess │
└──────────────┘       └─────────────────────┘
       │                        │
       │                        ↓
       │               ┌─────────────────┐
       │               │   TabSection    │
       │               └─────────────────┘
       │                        │
       │                        ↓
       │               ┌─────────────────┐
       │               │   ModuleTab     │
       │               └─────────────────┘
       │                        │
       │                        ↓
       │               ┌─────────────────┐
       │               │  SystemModule   │
       │               └─────────────────┘
       │
       │               ┌─────────────────┐
       └───────M2M─────│  CargoPermiso   │
                       └─────────────────┘
                               │
                               ↓
                       ┌─────────────────┐
                       │    Permiso      │
                       └─────────────────┘
```

---

## 3. FASES DE IMPLEMENTACIÓN

### FASE 1: Backend - Endpoint Sidebar Filtrado
**Prioridad:** CRÍTICA
**Dependencias:** Ninguna
**Riesgo:** Bajo (no requiere migración)

### FASE 2: Backend - Enriquecer Respuesta /auth/me/
**Prioridad:** CRÍTICA
**Dependencias:** Ninguna
**Riesgo:** Bajo (solo serializer)

### FASE 3: Frontend - Implementar Filtrado Local
**Prioridad:** CRÍTICA
**Dependencias:** Fase 2
**Riesgo:** Medio (cambios en UI)

### FASE 4: Backend - Validación CRUD en ViewSets
**Prioridad:** ALTA
**Dependencias:** Fase 1
**Riesgo:** Medio (puede bloquear acciones)

### FASE 5: Frontend - Deshabilitar Acciones sin Permiso
**Prioridad:** ALTA
**Dependencias:** Fase 2, 4
**Riesgo:** Bajo (UX improvement)

### FASE 6: Testing y Validación
**Prioridad:** CRÍTICA
**Dependencias:** Fases 1-5
**Riesgo:** N/A

---

## 4. DETALLE POR FASE

### FASE 1: Backend - Endpoint Sidebar Filtrado

#### 4.1.1 Archivo a Modificar
```
backend/apps/gestion_estrategica/viewsets_strategic.py
Método: SystemModuleViewSet.sidebar()
Líneas: 584-640
```

#### 4.1.2 Cambios Requeridos

**ANTES:**
```python
@action(detail=False, methods=['get'])
def sidebar(self, request):
    modules = SystemModule.objects.filter(
        is_enabled=True
    ).prefetch_related(
        Prefetch(
            'tabs',
            queryset=ModuleTab.objects.filter(is_enabled=True).order_by('orden')
        )
    ).order_by('orden', 'name')
    # ... retorna TODO
```

**DESPUÉS:**
```python
@action(detail=False, methods=['get'])
def sidebar(self, request):
    """
    GET /api/core/system-modules/sidebar/

    Retorna módulos filtrados según permisos del usuario:
    - Super usuario: todos los módulos habilitados
    - Usuario normal: solo módulos/tabs/secciones autorizadas por su cargo
    """
    user = request.user

    # Super usuario ve todo
    if user.is_superuser:
        return self._get_full_sidebar()

    # Usuario normal: filtrar por CargoSectionAccess
    cargo = getattr(user, 'cargo', None)
    if not cargo:
        # Usuario sin cargo no ve nada (no debería pasar por validación previa)
        return Response([])

    # Obtener section_ids autorizados para este cargo
    from apps.core.models import CargoSectionAccess, TabSection, ModuleTab

    authorized_section_ids = set(
        CargoSectionAccess.objects.filter(cargo=cargo)
        .values_list('section_id', flat=True)
    )

    if not authorized_section_ids:
        # Sin secciones autorizadas = sidebar vacío
        return Response([])

    # Obtener tabs que contienen secciones autorizadas
    authorized_tab_ids = set(
        TabSection.objects.filter(
            id__in=authorized_section_ids,
            is_enabled=True
        ).values_list('tab_id', flat=True)
    )

    # Obtener módulos que contienen tabs autorizados
    authorized_module_ids = set(
        ModuleTab.objects.filter(
            id__in=authorized_tab_ids,
            is_enabled=True
        ).values_list('module_id', flat=True)
    )

    # Construir sidebar filtrado
    modules = SystemModule.objects.filter(
        id__in=authorized_module_ids,
        is_enabled=True
    ).prefetch_related(
        Prefetch(
            'tabs',
            queryset=ModuleTab.objects.filter(
                id__in=authorized_tab_ids,
                is_enabled=True
            ).prefetch_related(
                Prefetch(
                    'sections',
                    queryset=TabSection.objects.filter(
                        id__in=authorized_section_ids,
                        is_enabled=True
                    ).order_by('orden')
                )
            ).order_by('orden')
        )
    ).order_by('orden', 'name')

    return self._build_sidebar_response(modules, include_sections=True)


def _get_full_sidebar(self):
    """Retorna sidebar completo para super usuarios."""
    modules = SystemModule.objects.filter(
        is_enabled=True
    ).prefetch_related(
        Prefetch(
            'tabs',
            queryset=ModuleTab.objects.filter(is_enabled=True).order_by('orden')
        )
    ).order_by('orden', 'name')
    return self._build_sidebar_response(modules, include_sections=False)


def _build_sidebar_response(self, modules, include_sections=False):
    """Construye la respuesta del sidebar."""
    result = []
    for module in modules:
        enabled_tabs = list(module.tabs.all())
        children = None
        module_effective_color = module.get_effective_color()

        if enabled_tabs:
            children = []
            for tab in enabled_tabs:
                tab_data = {
                    'code': tab.code,
                    'name': tab.name,
                    'icon': tab.icon,
                    'color': module_effective_color,
                    'route': f"/{module.code.replace('_', '-')}/{tab.code.replace('_', '-')}",
                    'is_category': False,
                    'children': None
                }

                # Incluir secciones si es usuario normal (para filtrado adicional)
                if include_sections and hasattr(tab, 'sections'):
                    sections = list(tab.sections.all())
                    if sections:
                        tab_data['sections'] = [
                            {
                                'id': s.id,
                                'code': s.code,
                                'name': s.name
                            }
                            for s in sections
                        ]

                children.append(tab_data)

        module_data = {
            'code': module.code,
            'name': module.name,
            'icon': module.icon,
            'color': module_effective_color,
            'route': f"/{module.code.replace('_', '-')}" if not children else None,
            'is_category': False,
            'children': children
        }
        result.append(module_data)

    return Response(result)
```

#### 4.1.3 Tests Requeridos
```python
# backend/apps/gestion_estrategica/tests/test_sidebar_permissions.py

class TestSidebarPermissions(APITestCase):
    def test_superuser_sees_all_modules(self):
        """Super usuario debe ver todos los módulos habilitados."""
        pass

    def test_normal_user_sees_only_authorized_sections(self):
        """Usuario normal solo ve secciones de CargoSectionAccess."""
        pass

    def test_user_without_cargo_sees_nothing(self):
        """Usuario sin cargo ve sidebar vacío."""
        pass

    def test_user_with_no_section_access_sees_nothing(self):
        """Usuario con cargo sin secciones asignadas ve sidebar vacío."""
        pass

    def test_disabled_section_not_shown(self):
        """Secciones deshabilitadas no aparecen aunque estén asignadas."""
        pass
```

---

### FASE 2: Backend - Enriquecer Respuesta /auth/me/

#### 4.2.1 Archivos a Modificar
```
backend/apps/users/serializers.py (o donde esté el serializer de User)
backend/apps/users/views.py (endpoint /auth/me/)
```

#### 4.2.2 Campos a Agregar en Respuesta

```python
# En el serializer de User (GetMe)
class UserMeSerializer(serializers.ModelSerializer):
    # Campos existentes...

    # NUEVOS CAMPOS RBAC
    section_ids = serializers.SerializerMethodField()
    permission_codes = serializers.SerializerMethodField()

    def get_section_ids(self, obj):
        """Retorna IDs de secciones autorizadas por el cargo."""
        if obj.is_superuser:
            return None  # Super usuario no necesita filtrado

        cargo = getattr(obj, 'cargo', None)
        if not cargo:
            return []

        from apps.core.models import CargoSectionAccess
        return list(
            CargoSectionAccess.objects.filter(cargo=cargo)
            .values_list('section_id', flat=True)
        )

    def get_permission_codes(self, obj):
        """Retorna códigos de permisos CRUD autorizados."""
        if obj.is_superuser:
            return ['*']  # Super usuario tiene todos los permisos

        cargo = getattr(obj, 'cargo', None)
        if not cargo:
            return []

        from apps.core.models import CargoPermiso
        return list(
            CargoPermiso.objects.filter(cargo=cargo)
            .select_related('permiso')
            .values_list('permiso__code', flat=True)
        )

    class Meta:
        model = User
        fields = [
            # Campos existentes...
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_superuser', 'is_staff', 'is_active',
            'cargo', 'cargo_id',
            # NUEVOS
            'section_ids',
            'permission_codes',
        ]
```

#### 4.2.3 Respuesta Esperada

```json
{
  "id": 1,
  "username": "juan.perez",
  "email": "juan@empresa.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "is_superuser": false,
  "is_staff": false,
  "is_active": true,
  "cargo": {
    "id": 5,
    "code": "LIDER_COMERCIAL",
    "name": "Líder Comercial",
    "nivel_jerarquico": 2
  },
  "cargo_id": 5,
  "section_ids": [1, 2, 5, 8, 12],
  "permission_codes": [
    "gestion_estrategica.politica.view",
    "gestion_estrategica.politica.create",
    "gestion_estrategica.identidad.view",
    "configuracion.area.view"
  ]
}
```

---

### FASE 3: Frontend - Implementar Filtrado Local

#### 4.3.1 Archivos a Modificar
```
frontend/src/types/auth.types.ts
frontend/src/hooks/usePermissions.ts
frontend/src/stores/authStore.ts (si existe)
frontend/src/layouts/Sidebar.tsx
```

#### 4.3.2 Actualizar Tipos

```typescript
// frontend/src/types/auth.types.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
  cargo: Cargo | null;
  cargo_id: number | null;
  // NUEVOS CAMPOS
  section_ids: number[] | null;  // null para superuser
  permission_codes: string[] | null;  // ['*'] para superuser
}
```

#### 4.3.3 Actualizar Hook usePermissions

```typescript
// frontend/src/hooks/usePermissions.ts

export function usePermissions() {
  const { user } = useAuth();

  const isSuperAdmin = useMemo(() => {
    return user?.is_superuser ?? false;
  }, [user?.is_superuser]);

  // NUEVO: Verificar acceso a sección
  const hasSectionAccess = useCallback((sectionId: number): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (!user.section_ids) return false;
    return user.section_ids.includes(sectionId);
  }, [user, isSuperAdmin]);

  // NUEVO: Verificar permiso CRUD
  const hasPermission = useCallback((permissionCode: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (!user.permission_codes) return false;
    if (user.permission_codes.includes('*')) return true;
    return user.permission_codes.includes(permissionCode);
  }, [user, isSuperAdmin]);

  // NUEVO: Verificar cualquier permiso de una lista
  const hasAnyPermission = useCallback((codes: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return codes.some(code => hasPermission(code));
  }, [user, isSuperAdmin, hasPermission]);

  // NUEVO: Verificar todos los permisos de una lista
  const hasAllPermissions = useCallback((codes: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return codes.every(code => hasPermission(code));
  }, [user, isSuperAdmin, hasPermission]);

  // NUEVO: Verificar permiso CRUD por módulo/recurso/acción
  const canDo = useCallback((
    modulo: string,
    recurso: string,
    accion: 'view' | 'create' | 'update' | 'delete'
  ): boolean => {
    const code = `${modulo}.${recurso}.${accion}`;
    return hasPermission(code);
  }, [hasPermission]);

  return {
    isSuperAdmin,
    hasSectionAccess,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canDo,
    // Mantener compatibilidad con funciones existentes
    hasCargo: /* existente */,
    hasCargoLevel: /* existente */,
    hasRole: /* existente */,
    canAccess: /* existente */,
  };
}
```

#### 4.3.4 Actualizar Sidebar (Doble Validación)

```typescript
// frontend/src/layouts/Sidebar.tsx

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const { data: sidebarModules, isLoading } = useSidebarModules();
  const { isSuperAdmin, hasSectionAccess } = usePermissions();

  // El backend ya filtra, pero aplicamos filtrado adicional por seguridad
  const filteredModules = useMemo(() => {
    if (!sidebarModules) return [];
    if (isSuperAdmin) return sidebarModules;

    // Filtrar módulos que tienen al menos un tab visible
    return sidebarModules
      .map(module => ({
        ...module,
        children: module.children?.filter(tab => {
          // Si el tab tiene secciones, verificar que al menos una esté autorizada
          if (tab.sections && tab.sections.length > 0) {
            return tab.sections.some(section => hasSectionAccess(section.id));
          }
          // Si no tiene secciones (legacy), mantener visible
          return true;
        })
      }))
      .filter(module => module.children && module.children.length > 0);
  }, [sidebarModules, isSuperAdmin, hasSectionAccess]);

  // ... resto del render
};
```

---

### FASE 4: Backend - Validación CRUD en ViewSets

#### 4.4.1 Crear Permission Class para Secciones

```python
# backend/apps/core/permissions.py

class RequireSectionAccess(BasePermission):
    """
    Valida que el usuario tenga acceso a la sección correspondiente.

    Uso:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, RequireSectionAccess]
            section_code = 'identidad_corporativa'  # o section_id
    """
    message = "No tiene acceso a esta sección del sistema."

    def has_permission(self, request, view):
        user = request.user

        # Super usuario tiene acceso total
        if user.is_superuser:
            return True

        # Obtener código o ID de sección del view
        section_code = getattr(view, 'section_code', None)
        section_id = getattr(view, 'section_id', None)

        if not section_code and not section_id:
            # Sin configuración de sección, permitir (backwards compatibility)
            return True

        cargo = getattr(user, 'cargo', None)
        if not cargo:
            return False

        from apps.core.models import CargoSectionAccess, TabSection

        if section_id:
            return CargoSectionAccess.objects.filter(
                cargo=cargo,
                section_id=section_id
            ).exists()

        if section_code:
            return CargoSectionAccess.objects.filter(
                cargo=cargo,
                section__code=section_code
            ).exists()

        return False


class RequireCRUDPermission(BasePermission):
    """
    Valida permisos CRUD dinámicos por acción.

    Uso:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, RequireCRUDPermission]
            permission_module = 'gestion_estrategica'
            permission_resource = 'politica'

            # Opcionalmente, mapear acciones personalizadas:
            permission_action_map = {
                'approve': 'update',
                'publish': 'update',
                'archive': 'delete',
            }
    """
    message = "No tiene permiso para realizar esta acción."

    # Mapeo estándar de acciones DRF a permisos
    DEFAULT_ACTION_MAP = {
        'list': 'view',
        'retrieve': 'view',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete',
    }

    def has_permission(self, request, view):
        user = request.user

        if user.is_superuser:
            return True

        # Obtener configuración del view
        module = getattr(view, 'permission_module', None)
        resource = getattr(view, 'permission_resource', None)

        if not module or not resource:
            # Sin configuración, permitir (backwards compatibility)
            return True

        # Determinar acción
        action = view.action
        custom_map = getattr(view, 'permission_action_map', {})
        action_map = {**self.DEFAULT_ACTION_MAP, **custom_map}

        permission_action = action_map.get(action)
        if not permission_action:
            # Acción no mapeada, denegar por seguridad
            return False

        # Construir código de permiso
        permission_code = f"{module}.{resource}.{permission_action}"

        # Verificar permiso
        cargo = getattr(user, 'cargo', None)
        if not cargo:
            return False

        from apps.core.models import CargoPermiso
        return CargoPermiso.objects.filter(
            cargo=cargo,
            permiso__code=permission_code,
            permiso__is_active=True
        ).exists()
```

#### 4.4.2 Aplicar a ViewSets Existentes

```python
# backend/apps/gestion_estrategica/viewsets_strategic.py

class CorporateIdentityViewSet(viewsets.ModelViewSet):
    """ViewSet para Identidad Corporativa."""
    queryset = CorporateIdentity.objects.all()
    serializer_class = CorporateIdentitySerializer
    permission_classes = [IsAuthenticated, RequireSectionAccess, RequireCRUDPermission]

    # Configuración de permisos
    section_code = 'identidad_corporativa'
    permission_module = 'gestion_estrategica'
    permission_resource = 'identidad'


class PoliticaViewSet(viewsets.ModelViewSet):
    """ViewSet para Políticas."""
    queryset = Politica.objects.all()
    serializer_class = PoliticaSerializer
    permission_classes = [IsAuthenticated, RequireSectionAccess, RequireCRUDPermission]

    # Configuración de permisos
    section_code = 'politicas'
    permission_module = 'gestion_estrategica'
    permission_resource = 'politica'

    # Mapeo de acciones personalizadas
    permission_action_map = {
        'approve': 'update',
        'publish': 'update',
        'send_for_signature': 'update',
    }
```

#### 4.4.3 Mixin Reutilizable (Opcional)

```python
# backend/apps/core/mixins.py

class RBACViewSetMixin:
    """
    Mixin que agrega validación RBAC a ViewSets.

    Configurar en el ViewSet:
        section_code = 'mi_seccion'
        permission_module = 'mi_modulo'
        permission_resource = 'mi_recurso'
    """

    def get_permissions(self):
        """Agrega permisos RBAC a los existentes."""
        permissions = super().get_permissions()

        # Solo agregar si está configurado
        if hasattr(self, 'section_code'):
            permissions.append(RequireSectionAccess())

        if hasattr(self, 'permission_module') and hasattr(self, 'permission_resource'):
            permissions.append(RequireCRUDPermission())

        return permissions

    def check_object_permissions(self, request, obj):
        """Validación adicional a nivel de objeto."""
        super().check_object_permissions(request, obj)

        # Aquí se puede agregar validación de alcance (ALL, OWN, TEAM)
        # basado en PermisoAlcance
```

---

### FASE 5: Frontend - Deshabilitar Acciones sin Permiso

#### 4.5.1 Componente ProtectedAction Mejorado

```typescript
// frontend/src/components/common/ProtectedAction.tsx

interface ProtectedActionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;

  // Permisos RBAC
  permission?: string;           // Código exacto: "modulo.recurso.accion"
  permissions?: string[];        // Lista de permisos (OR por defecto)
  requireAll?: boolean;          // true = AND, false = OR

  // Acceso a secciones
  sectionId?: number;
  sectionCode?: string;

  // Opciones de renderizado
  hideIfDenied?: boolean;        // true = no renderiza, false = renderiza deshabilitado
  showTooltip?: boolean;         // Mostrar tooltip explicando por qué está deshabilitado
  tooltipMessage?: string;
}

export function ProtectedAction({
  children,
  fallback = null,
  permission,
  permissions,
  requireAll = false,
  sectionId,
  sectionCode,
  hideIfDenied = true,
  showTooltip = true,
  tooltipMessage = 'No tiene permiso para esta acción',
}: ProtectedActionProps) {
  const {
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasSectionAccess
  } = usePermissions();

  // Super admin siempre tiene acceso
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Verificar acceso a sección
  if (sectionId && !hasSectionAccess(sectionId)) {
    return hideIfDenied ? <>{fallback}</> : (
      <DisabledWrapper tooltip={showTooltip ? tooltipMessage : undefined}>
        {children}
      </DisabledWrapper>
    );
  }

  // Verificar permisos CRUD
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return hideIfDenied ? <>{fallback}</> : (
      <DisabledWrapper tooltip={showTooltip ? tooltipMessage : undefined}>
        {children}
      </DisabledWrapper>
    );
  }

  return <>{children}</>;
}
```

#### 4.5.2 Uso en Componentes

```typescript
// Ejemplo: Botón de crear política
<ProtectedAction permission="gestion_estrategica.politica.create">
  <Button onClick={handleCreate}>
    <Plus className="h-4 w-4 mr-2" />
    Nueva Política
  </Button>
</ProtectedAction>

// Ejemplo: Botón de eliminar (oculto si no tiene permiso)
<ProtectedAction
  permission="gestion_estrategica.politica.delete"
  hideIfDenied={true}
>
  <Button variant="destructive" onClick={handleDelete}>
    Eliminar
  </Button>
</ProtectedAction>

// Ejemplo: Botón de editar (deshabilitado si no tiene permiso)
<ProtectedAction
  permission="gestion_estrategica.politica.update"
  hideIfDenied={false}
  tooltipMessage="Necesita permiso de edición de políticas"
>
  <Button onClick={handleEdit}>
    Editar
  </Button>
</ProtectedAction>
```

---

### FASE 6: Testing y Validación

#### 4.6.1 Tests Backend

```python
# backend/apps/core/tests/test_rbac_permissions.py

class TestCargoSectionAccess(APITestCase):
    """Tests para validación de acceso a secciones."""

    def setUp(self):
        self.superuser = User.objects.create_superuser(...)
        self.cargo_admin = Cargo.objects.create(code='ADMIN', ...)
        self.cargo_viewer = Cargo.objects.create(code='VIEWER', ...)
        self.user_admin = User.objects.create(cargo=self.cargo_admin, ...)
        self.user_viewer = User.objects.create(cargo=self.cargo_viewer, ...)

        # Crear secciones
        self.section_politicas = TabSection.objects.create(code='politicas', ...)
        self.section_identidad = TabSection.objects.create(code='identidad', ...)

        # Asignar acceso solo a admin
        CargoSectionAccess.objects.create(
            cargo=self.cargo_admin,
            section=self.section_politicas
        )

    def test_superuser_can_access_all_sections(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.get('/api/core/system-modules/sidebar/')
        # Debe ver todas las secciones
        self.assertEqual(response.status_code, 200)
        # ... verificar contenido

    def test_admin_sees_only_authorized_sections(self):
        self.client.force_authenticate(self.user_admin)
        response = self.client.get('/api/core/system-modules/sidebar/')
        # Debe ver solo politicas, no identidad
        self.assertEqual(response.status_code, 200)
        # ... verificar contenido

    def test_viewer_without_access_sees_empty_sidebar(self):
        self.client.force_authenticate(self.user_viewer)
        response = self.client.get('/api/core/system-modules/sidebar/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])


class TestCRUDPermissions(APITestCase):
    """Tests para validación de permisos CRUD."""

    def setUp(self):
        # ... setup similar
        self.permiso_view = Permiso.objects.create(
            code='gestion_estrategica.politica.view', ...
        )
        self.permiso_create = Permiso.objects.create(
            code='gestion_estrategica.politica.create', ...
        )

        # Admin tiene view y create
        CargoPermiso.objects.create(cargo=self.cargo_admin, permiso=self.permiso_view)
        CargoPermiso.objects.create(cargo=self.cargo_admin, permiso=self.permiso_create)

        # Viewer solo tiene view
        CargoPermiso.objects.create(cargo=self.cargo_viewer, permiso=self.permiso_view)

    def test_user_with_create_permission_can_create(self):
        self.client.force_authenticate(self.user_admin)
        response = self.client.post('/api/gestion-estrategica/politicas/', {...})
        self.assertEqual(response.status_code, 201)

    def test_user_without_create_permission_cannot_create(self):
        self.client.force_authenticate(self.user_viewer)
        response = self.client.post('/api/gestion-estrategica/politicas/', {...})
        self.assertEqual(response.status_code, 403)

    def test_user_with_view_permission_can_list(self):
        self.client.force_authenticate(self.user_viewer)
        response = self.client.get('/api/gestion-estrategica/politicas/')
        self.assertEqual(response.status_code, 200)
```

#### 4.6.2 Tests Frontend

```typescript
// frontend/src/__tests__/hooks/usePermissions.test.ts

describe('usePermissions', () => {
  describe('hasSectionAccess', () => {
    it('returns true for superuser regardless of section', () => {
      // ...
    });

    it('returns true if section_id is in user.section_ids', () => {
      // ...
    });

    it('returns false if section_id is not in user.section_ids', () => {
      // ...
    });
  });

  describe('hasPermission', () => {
    it('returns true for superuser', () => {
      // ...
    });

    it('returns true if permission_code is in user.permission_codes', () => {
      // ...
    });

    it('returns false if permission_code is not in user.permission_codes', () => {
      // ...
    });
  });
});
```

---

## 5. POLÍTICA DE MIGRACIONES

### 5.1 Reglas Estrictas

1. **TODA migración DEBE ser reversible**
   - Incluir `reverse_code` o `RunSQL` con reversa
   - Probar reversión antes de merge

2. **NO hardcoding de IDs**
   - Usar `get_or_create` con códigos únicos
   - Referencias por `code`, no por `id`

3. **Migraciones de datos separadas**
   - Estructura en una migración
   - Datos en otra migración
   - Facilita rollback

4. **Validación pre-migración**
   ```bash
   # Antes de aplicar
   python manage.py migrate --plan
   python manage.py migrate --check

   # Después de aplicar
   python manage.py showmigrations
   ```

5. **Seed data en commands, no en migraciones**
   - Migraciones solo para estructura
   - `management/commands/seed_*.py` para datos

### 5.2 Estructura de Migración Segura

```python
# migrations/XXXX_descripcion_clara.py

from django.db import migrations

def forward_migration(apps, schema_editor):
    """
    Descripción clara de qué hace.
    """
    Model = apps.get_model('app', 'Model')
    # Usar get_or_create, nunca IDs hardcoded
    obj, created = Model.objects.get_or_create(
        code='UNIQUE_CODE',
        defaults={'name': 'Nombre', ...}
    )

def reverse_migration(apps, schema_editor):
    """
    Reversa completa de forward_migration.
    """
    Model = apps.get_model('app', 'Model')
    Model.objects.filter(code='UNIQUE_CODE').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('app', 'XXXX_previous'),
    ]

    operations = [
        migrations.RunPython(
            forward_migration,
            reverse_migration,  # OBLIGATORIO
        ),
    ]
```

### 5.3 Checklist Pre-Migración

- [ ] Migración tiene `reverse_code`
- [ ] No hay IDs hardcodeados
- [ ] Se probó en base de datos limpia
- [ ] Se probó en base de datos con datos existentes
- [ ] Se probó rollback completo
- [ ] No rompe datos existentes
- [ ] Documentada en changelog

---

## 6. CHECKLIST DE VALIDACIÓN PRE-PRODUCCIÓN

### 6.1 Backend

- [ ] **Endpoint Sidebar**
  - [ ] Super usuario ve todos los módulos
  - [ ] Usuario normal ve solo secciones autorizadas
  - [ ] Usuario sin secciones ve sidebar vacío
  - [ ] Performance < 200ms

- [ ] **Respuesta /auth/me/**
  - [ ] Incluye `section_ids` (array o null)
  - [ ] Incluye `permission_codes` (array)
  - [ ] Super usuario recibe `permission_codes: ['*']`
  - [ ] Usuario normal recibe lista específica

- [ ] **Validación CRUD**
  - [ ] ViewSets con `RequireSectionAccess`
  - [ ] ViewSets con `RequireCRUDPermission`
  - [ ] Acciones personalizadas mapeadas
  - [ ] Retorna 403 correcto con mensaje claro

- [ ] **Migraciones**
  - [ ] Todas reversibles
  - [ ] Probadas en ambiente staging
  - [ ] Sin hardcoding de IDs

### 6.2 Frontend

- [ ] **Tipos TypeScript**
  - [ ] `User` incluye `section_ids`
  - [ ] `User` incluye `permission_codes`

- [ ] **Hook usePermissions**
  - [ ] `hasSectionAccess()` funciona
  - [ ] `hasPermission()` funciona
  - [ ] `canDo()` funciona

- [ ] **Sidebar**
  - [ ] Filtra módulos correctamente
  - [ ] No muestra secciones no autorizadas
  - [ ] Super usuario ve todo

- [ ] **Botones/Acciones**
  - [ ] `ProtectedAction` aplicado a CRUD
  - [ ] Botones deshabilitados/ocultos correctamente

### 6.3 Pruebas de Integración

- [ ] **Escenario: Super Usuario**
  - [ ] Login → Ve todo el sidebar
  - [ ] Puede ejecutar todas las acciones CRUD

- [ ] **Escenario: Usuario con acceso parcial**
  - [ ] Login → Ve solo secciones autorizadas
  - [ ] Puede ejecutar solo acciones autorizadas
  - [ ] Acciones no autorizadas retornan 403

- [ ] **Escenario: Usuario nuevo (sin configuración)**
  - [ ] Login → Sidebar vacío (o mínimo)
  - [ ] No puede ejecutar acciones CRUD

- [ ] **Escenario: Cambio de permisos en caliente**
  - [ ] Admin modifica permisos de cargo
  - [ ] Usuario afectado ve cambios en próximo request

### 6.4 Seguridad

- [ ] No hay bypass de permisos
- [ ] No hay exposición de datos sensibles
- [ ] Logs de acceso denegado
- [ ] Rate limiting en endpoints sensibles

---

## 7. ORDEN DE IMPLEMENTACIÓN

```
Semana 1:
├── Día 1-2: FASE 1 (Sidebar filtrado)
├── Día 3: FASE 2 (Enriquecer /auth/me/)
└── Día 4-5: Tests backend

Semana 2:
├── Día 1-2: FASE 3 (Frontend filtrado)
├── Día 3-4: FASE 4 (Validación CRUD)
└── Día 5: FASE 5 (ProtectedAction)

Semana 3:
├── Día 1-2: FASE 6 (Testing completo)
├── Día 3: Code review
├── Día 4: Deploy staging
└── Día 5: Validación QA
```

---

## 8. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Bloquear usuarios legítimos | Media | Alto | Feature flag para rollback rápido |
| Performance degradada | Baja | Medio | Cachear section_ids en sesión |
| Inconsistencia frontend/backend | Media | Alto | Doble validación (UI + API) |
| Migraciones fallidas | Baja | Crítico | Backup pre-deploy, migraciones reversibles |

---

## 9. NOTAS FINALES

### 9.1 NO Hacer

- ❌ Hardcodear IDs de secciones o permisos
- ❌ Migraciones sin reversa
- ❌ Confiar solo en frontend para seguridad
- ❌ Bypasses temporales que se olvidan
- ❌ Comentar código legacy en lugar de eliminarlo

### 9.2 SÍ Hacer

- ✅ Validar en backend SIEMPRE
- ✅ Frontend como UX, no como seguridad
- ✅ Tests para cada permiso
- ✅ Documentar cambios en changelog
- ✅ Code review enfocado en seguridad

---

**Documento preparado por:** Claude AI
**Fecha:** 2026-01-12
**Estado:** ✅ IMPLEMENTADO

---

## 10. REGISTRO DE IMPLEMENTACIÓN

### Fecha de Implementación: 2026-01-12

### Archivos Modificados:

#### Backend:
1. **[viewsets_strategic.py](../../backend/apps/gestion_estrategica/viewsets_strategic.py)**
   - Método `sidebar()` ahora filtra por `CargoSectionAccess`
   - Agregados métodos `_get_full_sidebar()` y `_build_sidebar_response()`
   - Super usuario ve todo, usuario normal solo ve secciones autorizadas

2. **[serializers.py](../../backend/apps/core/serializers.py)**
   - `UserDetailSerializer` ahora incluye `section_ids` y `permission_codes`
   - Super usuario recibe `section_ids=null` y `permission_codes=['*']`

3. **[permissions.py](../../backend/apps/core/permissions.py)**
   - Nueva clase `RequireSectionAccess` - valida acceso a sección
   - Nueva clase `RequireCRUDPermission` - valida permisos CRUD dinámicos
   - Nueva clase `RequireSectionAndCRUD` - combina ambas validaciones

#### Frontend:
1. **[auth.types.ts](../../frontend/src/types/auth.types.ts)**
   - Tipo `User` ahora incluye `section_ids` y `permission_codes`

2. **[usePermissions.ts](../../frontend/src/hooks/usePermissions.ts)**
   - Nueva función `hasSectionAccess(sectionId)`
   - Nueva función `canDo(modulo, recurso, accion)`
   - `hasPermission()` ahora usa códigos de permisos del backend
   - Nuevas propiedades `sectionIds` y `permissionCodes`

3. **[ProtectedAction.tsx](../../frontend/src/components/common/ProtectedAction.tsx)**
   - Nueva prop `sectionId` para validar acceso a secciones
   - `permission` ahora acepta códigos de permisos CRUD
   - Soporte para combinación de sección + permiso

### Próximos Pasos (Manual):

1. **Aplicar permisos a ViewSets existentes:**
   ```python
   # Ejemplo para PoliticaViewSet
   class PoliticaViewSet(viewsets.ModelViewSet):
       permission_classes = [IsAuthenticated, RequireSectionAndCRUD]
       section_code = 'politicas'
       permission_module = 'gestion_estrategica'
       permission_resource = 'politica'
   ```

2. **Crear seed data de permisos:**
   ```bash
   python manage.py seed_permisos
   ```

3. **Asignar secciones a cargos existentes:**
   - Usar Tab 5 del modal de cargos en UI
   - O crear migración de datos

4. **Testing en staging antes de producción**
