# Sistema RBAC (Role-Based Access Control)

Sistema de control de acceso basado en roles para Grasas y Huesos del Norte SGI.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      USUARIO                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │  CARGO  │    │  ROLES  │    │ GRUPOS  │                 │
│  │  (1:1)  │    │  (1:N)  │    │  (1:N)  │                 │
│  └────┬────┘    └────┬────┘    └────┬────┘                 │
│       │              │              │                       │
│       ▼              ▼              ▼                       │
│  ┌─────────────────────────────────────────────────┐       │
│  │              PERMISOS (OR Logic)                 │       │
│  │   - Cargo tiene permisos                        │       │
│  │   - Rol tiene permisos                          │       │
│  │   - Grupo tiene roles → permisos                │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Jerarquia de Verificacion

Cuando se verifica un permiso, el sistema sigue esta logica (OR):

1. **Superusuario** → Acceso total
2. **Cargo** → Permisos asignados al cargo del usuario
3. **Roles directos** → Permisos de roles asignados directamente al usuario
4. **Grupos** → Permisos de roles asignados a grupos del usuario

## Modelos de Datos

### Cargo (Posicion Organizacional)

```python
class Cargo(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    level = models.IntegerField()  # 0-3
    parent_cargo = models.ForeignKey('self', null=True)
    permisos = models.ManyToManyField(Permiso, through=CargoPermiso)
```

Niveles:
- **0 - Operativo**: Recolector, Auxiliar
- **1 - Supervision**: Coordinador, Operador
- **2 - Coordinacion**: Lider, Contador
- **3 - Direccion**: Gerente General

### Role (Funcion Transversal)

```python
class Role(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    permisos = models.ManyToManyField(Permiso, through=RolePermiso)
```

Ejemplos:
- `aprobador_recolecciones`: Puede aprobar recolecciones
- `gestor_precios`: Puede modificar precios
- `auditor`: Acceso solo lectura a multiples modulos

### Group (Equipo de Trabajo)

```python
class Group(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    roles = models.ManyToManyField(Role, through=GroupRole)
```

Ejemplos:
- `equipo_recolecciones`: Equipo completo de recolecciones
- `equipo_sst`: Comite de seguridad y salud

### Permiso

```python
class Permiso(models.Model):
    code = models.CharField(max_length=50, unique=True)  # ej: 'recolecciones.create'
    name = models.CharField(max_length=100)
    module = models.CharField(max_length=30)  # RECOLECCIONES, PROGRAMACIONES, etc.
    action = models.CharField(max_length=10)  # VIEW, CREATE, EDIT, DELETE, APPROVE, MANAGE
    scope = models.CharField(max_length=10)   # OWN, TEAM, ALL
```

## Uso en Backend (Django/DRF)

### Clases de Permisos para ViewSets

```python
from apps.core.permissions import RequirePermission, RequireCargo, RequireRole
from apps.core.permissions_constants import PermissionCodes, CargoCodes

class RecoleccionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, RequirePermission]

    # Mapeo de accion a permiso
    permission_map = {
        'list': PermissionCodes.RECOLECCIONES.VIEW_LIST,
        'retrieve': PermissionCodes.RECOLECCIONES.VIEW_DETAIL,
        'create': PermissionCodes.RECOLECCIONES.CREATE,
        'update': PermissionCodes.RECOLECCIONES.UPDATE,
        'destroy': PermissionCodes.RECOLECCIONES.DELETE,
    }
```

### Decoradores para Vistas Basadas en Funciones

```python
from apps.core.permissions import require_permission, require_role, require_cargo

@api_view(['POST'])
@require_permission(PermissionCodes.RECOLECCIONES.APPROVE)
def approve_recoleccion(request, pk):
    ...

@api_view(['GET'])
@require_cargo(CargoCodes.GERENTE_GENERAL)
def get_executive_dashboard(request):
    ...

@api_view(['DELETE'])
@require_level(2)  # Coordinacion o superior
def delete_batch(request):
    ...
```

### Verificacion en Codigo

```python
# En el modelo User
user.has_permission('recolecciones.create')  # True/False
user.has_role('aprobador_recolecciones')     # True/False
user.has_cargo('lider_com_econorte')         # True/False
user.has_cargo_level(2)                       # True/False (nivel 2+)
user.is_in_group('equipo_recolecciones')     # True/False

# Obtener todos los permisos
permissions = user.get_all_permissions()  # QuerySet de Permiso
```

## Uso en Frontend (React/TypeScript)

### Hook usePermissions

```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionCodes, CargoCodes, CargoLevels } from '@/constants/permissions';

function MyComponent() {
  const {
    hasPermission,
    hasCargo,
    hasCargoLevel,
    canAccess,
    isSuperAdmin
  } = usePermissions();

  // Verificar permiso
  const canCreate = hasPermission(PermissionCodes.RECOLECCIONES.CREATE);

  // Verificar cargo
  const isLider = hasCargo(CargoCodes.LIDER_COMERCIAL_ECONORTE);

  // Verificar nivel
  const isCoordination = hasCargoLevel(CargoLevels.COORDINACION);

  // Verificacion combinada (OR)
  const canManage = canAccess({
    permissions: [PermissionCodes.RECOLECCIONES.APPROVE],
    cargos: [CargoCodes.GERENTE_GENERAL],
    minLevel: CargoLevels.COORDINACION,
  });

  return (
    <div>
      {canCreate && <Button>Crear</Button>}
    </div>
  );
}
```

### Componente ProtectedAction

```tsx
import { ProtectedAction } from '@/components/common';
import { CargoCodes, PermissionCodes, CargoLevels } from '@/constants/permissions';

// Por permiso
<ProtectedAction permission={PermissionCodes.RECOLECCIONES.CREATE}>
  <Button>Crear Recoleccion</Button>
</ProtectedAction>

// Por cargo(s)
<ProtectedAction cargos={[CargoCodes.LIDER_COMERCIAL_ECONORTE, CargoCodes.GERENTE]}>
  <AdminPanel />
</ProtectedAction>

// Por nivel minimo
<ProtectedAction minLevel={CargoLevels.COORDINACION}>
  <ManagementDashboard />
</ProtectedAction>

// Con fallback
<ProtectedAction
  permission={PermissionCodes.RECOLECCIONES.DELETE}
  fallback={<DisabledButton>No autorizado</DisabledButton>}
>
  <Button variant="danger">Eliminar</Button>
</ProtectedAction>

// Solo superadmin
<ProtectedAction superAdminOnly>
  <SystemConfiguration />
</ProtectedAction>
```

## Constantes de Permisos

### Modulos

| Modulo | Codigo | Descripcion |
|--------|--------|-------------|
| Recolecciones | `recolecciones` | Gestion de recolecciones |
| Programaciones | `programaciones` | Programacion de rutas |
| Proveedores | `proveedores` | Gestion de proveedores |
| Ecoaliados | `ecoaliados` | Gestion de ecoaliados |
| Recepciones | `recepciones` | Recepcion en planta |
| Certificados | `certificados` | Certificados ambientales |
| Usuarios | `users` | Gestion de usuarios |
| Configuracion | `config` | Configuracion del sistema |
| SST | `sst` | Seguridad y Salud en el Trabajo |

### Acciones

| Accion | Codigo | Descripcion |
|--------|--------|-------------|
| Ver | `VIEW` | Lectura de datos |
| Crear | `CREATE` | Creacion de registros |
| Editar | `EDIT` | Modificacion de registros |
| Eliminar | `DELETE` | Eliminacion de registros |
| Aprobar | `APPROVE` | Aprobacion de flujos |
| Exportar | `EXPORT` | Exportacion de datos |
| Administrar | `MANAGE` | Administracion completa |

### Alcance

| Alcance | Codigo | Descripcion |
|---------|--------|-------------|
| Propios | `OWN` | Solo registros propios |
| Equipo | `TEAM` | Registros del equipo |
| Todos | `ALL` | Todos los registros |

## Cargos del Sistema

| Codigo | Nombre | Nivel |
|--------|--------|-------|
| `gerente_general` | Gerente General | 3 - Direccion |
| `gerente` | Gerente | 3 - Direccion |
| `lider_com_econorte` | Lider Comercial EcoNorte | 2 - Coordinacion |
| `lider_log_econorte` | Lider Logistica EcoNorte | 2 - Coordinacion |
| `lider_calidad` | Lider de Calidad | 2 - Coordinacion |
| `lider_sst` | Lider SST | 2 - Coordinacion |
| `contador` | Contador | 2 - Coordinacion |
| `comercial_econorte` | Comercial EcoNorte | 1 - Supervision |
| `coordinador_recoleccion` | Coordinador de Recoleccion | 1 - Supervision |
| `operador_bascula` | Operador de Bascula | 1 - Supervision |
| `recolector_econorte` | Recolector EcoNorte | 0 - Operativo |
| `auxiliar_operaciones` | Auxiliar de Operaciones | 0 - Operativo |

## Roles del Sistema

| Codigo | Nombre | Descripcion |
|--------|--------|-------------|
| `superadmin` | Super Administrador | Acceso total |
| `admin_sistema` | Administrador Sistema | Configuracion |
| `aprobador_recolecciones` | Aprobador Recolecciones | Aprobar recolecciones |
| `aprobador_recepciones` | Aprobador Recepciones | Aprobar recepciones |
| `aprobador_compras` | Aprobador Compras | Aprobar compras |
| `gestor_programaciones` | Gestor Programaciones | Gestionar programaciones |
| `gestor_proveedores` | Gestor Proveedores | Gestionar proveedores |
| `gestor_ecoaliados` | Gestor EcoAliados | Gestionar ecoaliados |
| `visualizador` | Visualizador | Solo lectura |
| `reporteador` | Generador Reportes | Generar reportes |

## Grupos del Sistema

| Codigo | Nombre |
|--------|--------|
| `equipo_recolecciones` | Equipo de Recolecciones |
| `equipo_compras` | Equipo de Compras |
| `equipo_calidad` | Equipo de Calidad |
| `equipo_operaciones` | Equipo de Operaciones |
| `equipo_administracion` | Equipo de Administracion |
| `equipo_sst` | Equipo SST |

## Comandos de Administracion

### Inicializar Sistema RBAC

```bash
# Crear/actualizar permisos, cargos, roles y grupos
python manage.py init_rbac

# Con detalle
python manage.py init_rbac --verbose

# Solo permisos
python manage.py init_rbac --permissions-only

# Resetear y recrear (no elimina cargos con usuarios)
python manage.py init_rbac --reset
```

## Mejores Practicas

1. **Nunca hardcodear** strings de permisos/cargos/roles
2. **Usar constantes** de `permissions_constants.py` (backend) o `permissions.ts` (frontend)
3. **Verificar en backend** siempre, el frontend es solo UX
4. **Usar ProtectedAction** para elementos UI condicionales
5. **Preferir permisos** sobre cargos para logica de negocio
6. **Agrupar por roles** cuando multiples usuarios comparten funciones

## Migracion desde Sistema Anterior

Para migrar de permisos hardcodeados:

1. Identificar todos los strings de cargo_code en el codigo
2. Reemplazar con constantes de `CargoCodes`
3. Usar clases de permisos DRF en lugar de verificaciones manuales
4. En frontend, usar `usePermissions` hook
5. Envolver elementos UI con `ProtectedAction`

## Archivos Relacionados

### Backend
- `backend/apps/core/models.py` - Modelos RBAC
- `backend/apps/core/permissions.py` - Clases de permisos DRF
- `backend/apps/core/permissions_constants.py` - Constantes
- `backend/apps/core/management/commands/init_rbac.py` - Comando de inicializacion

### Frontend
- `frontend/src/constants/permissions.ts` - Constantes
- `frontend/src/hooks/usePermissions.ts` - Hook de permisos
- `frontend/src/components/common/ProtectedAction.tsx` - Componente de control
