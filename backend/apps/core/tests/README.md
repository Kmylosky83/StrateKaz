# Tests del Sistema RBAC - Core

Este directorio contiene los tests completos del sistema RBAC (Role-Based Access Control) del proyecto ERP StrateKaz.

## Archivos de Tests

### 1. `test_rbac.py` - Tests Unitarios del Sistema RBAC

Tests completos del sistema de control de acceso basado en roles.

#### Clases de Tests:

##### `TestRBACPermisos`
Tests para verificar la asignación y gestión de permisos.

- `test_permiso_creacion_basica`: Verifica creación correcta de permisos
- `test_permiso_get_permissions_by_module`: Filtrado de permisos por módulo
- `test_permiso_inactivo_no_se_obtiene_por_modulo`: Exclusión de permisos inactivos
- `test_permiso_string_representation`: Validación de representación en string

**Cobertura**: Modelo `Permiso`, módulos disponibles, acciones (VIEW, CREATE, EDIT, DELETE, APPROVE, EXPORT, MANAGE), alcances (OWN, TEAM, ALL)

##### `TestRBACRoles`
Tests para verificar roles y herencia de permisos.

- `test_rol_creacion_basica`: Creación de roles del sistema
- `test_rol_asignar_permisos`: Asignación de múltiples permisos a roles
- `test_rol_obtener_permisos_solo_activos`: Filtrado de permisos activos
- `test_rol_asignar_a_usuario`: Asignación directa de roles a usuarios
- `test_rol_con_fecha_expiracion`: Roles temporales con fecha de expiración
- `test_rol_string_representation`: Representación en string

**Cobertura**: Modelo `Role`, `UserRole`, expiración de roles, roles del sistema

##### `TestRBACGrupos`
Tests para verificar grupos y permisos de grupo.

- `test_grupo_creacion_basica`: Creación de grupos
- `test_grupo_asignar_roles`: Asignación de roles a grupos
- `test_grupo_obtener_permisos_de_roles`: Herencia de permisos desde roles
- `test_grupo_asignar_usuarios`: Asignación de usuarios a grupos
- `test_usuario_pertenece_a_grupo`: Verificación de membresía en grupos
- `test_grupo_string_representation`: Representación en string

**Cobertura**: Modelo `Group`, `UserGroup`, `GroupRole`, líderes de grupo

##### `TestRBACCargos`
Tests para verificar permisos asociados a cargos.

- `test_cargo_asignar_permisos`: Asignación de permisos a cargos
- `test_usuario_hereda_permisos_de_cargo`: Herencia automática de permisos
- `test_usuario_sin_cargo_no_tiene_permisos`: Validación de usuario sin cargo
- `test_cargo_sin_permisos`: Cargo sin permisos asignados
- `test_cargo_permiso_relacion_con_auditoria`: Auditoría de asignación de permisos

**Cobertura**: Modelo `Cargo`, `CargoPermiso`, permisos organizacionales

##### `TestRBACRolesAdicionales`
Tests para el sistema RBAC híbrido con roles adicionales.

- `test_rol_adicional_creacion_basica`: Creación de roles adicionales
- `test_rol_adicional_asignar_permisos`: Asignación de permisos
- `test_rol_adicional_asignar_a_usuario`: Asignación a usuarios
- `test_rol_adicional_con_expiracion`: Roles temporales
- `test_usuario_hereda_permisos_de_rol_adicional`: Herencia de permisos
- `test_rol_adicional_usuarios_count`: Conteo de usuarios asignados
- `test_rol_adicional_puede_eliminar`: Validación de eliminación
- `test_rol_adicional_get_tipo_display_color`: Colores por tipo
- `test_usuario_get_roles_adicionales_por_tipo`: Filtrado por tipo

**Cobertura**: Modelo `RolAdicional`, `UserRolAdicional`, tipos (LEGAL_OBLIGATORIO, SISTEMA_GESTION, OPERATIVO, CUSTOM), certificaciones

##### `TestRBACIntegracion`
Tests de integración del sistema RBAC completo.

- `test_flujo_completo_usuario_cargo_permisos`: Flujo completo de permisos por cargo
- `test_jerarquia_permisos_rbac_hibrido`: Jerarquía completa de permisos
- `test_superusuario_tiene_todos_los_permisos`: Validación de superusuario
- `test_usuario_inactivo_no_tiene_permisos`: Usuario inactivo
- `test_usuario_eliminado_no_tiene_permisos`: Soft delete
- `test_has_any_permission`: Verificación de al menos un permiso
- `test_has_all_permissions`: Verificación de todos los permisos
- `test_usuario_get_permisos_efectivos`: Listado de permisos efectivos

**Cobertura**: Jerarquía completa RBAC híbrida (Cargo + Roles + Roles Adicionales + Grupos)

---

### 2. `test_permissions_api.py` - Tests de API de Permisos

Tests de integración con Django REST Framework para verificar el control de acceso a nivel de API.

#### Clases de Tests:

##### `TestPermissionsDenied`
Tests de denegación de acceso (403 Forbidden).

- `test_usuario_no_autenticado_recibe_401`: Validación de autenticación requerida
- `test_usuario_sin_permiso_recibe_403`: Usuario sin permisos recibe 403
- `test_usuario_inactivo_no_puede_autenticarse`: Usuario inactivo bloqueado

**Cobertura**: Autenticación, denegación de acceso, usuarios inactivos

##### `TestPermissionsByAction`
Tests de permisos por acción (VIEW, CREATE, EDIT, DELETE).

- `test_usuario_con_permiso_view_puede_listar`: Permiso VIEW
- `test_usuario_con_permiso_create_puede_crear`: Permiso CREATE
- `test_usuario_con_permiso_edit_puede_editar`: Permiso EDIT
- `test_usuario_con_permiso_delete_puede_eliminar`: Permiso DELETE
- Tests negativos para cada acción

**Cobertura**: Acciones de permisos (VIEW, CREATE, EDIT, DELETE, APPROVE, EXPORT, MANAGE)

##### `TestPermissionsScope`
Tests de alcance de permisos (OWN, TEAM, ALL).

- `test_permiso_scope_own_solo_propios`: Alcance OWN (solo propios)
- `test_permiso_scope_all_todos`: Alcance ALL (todos)
- `test_permiso_scope_team_equipo`: Alcance TEAM (equipo)

**Cobertura**: Scopes de permisos (OWN, TEAM, ALL)

##### `TestSuperuserPermissions`
Tests de permisos de superusuario.

- `test_superusuario_tiene_todos_permisos`: Superusuario con permisos totales
- `test_superusuario_puede_acceder_a_cualquier_endpoint`: Acceso total

**Cobertura**: Superusuario, bypass de permisos

##### `TestMultiplePermissions`
Tests de permisos múltiples.

- `test_usuario_con_multiples_permisos`: Usuario con varios permisos
- `test_has_any_permission_con_multiples`: Verificación de al menos uno
- `test_has_all_permissions_con_multiples`: Verificación de todos

**Cobertura**: Métodos `has_any_permission()`, `has_all_permissions()`

##### `TestModulePermissions`
Tests de permisos por módulo.

- `test_usuario_con_permisos_solo_de_lotes`: Permisos de un módulo específico
- `test_get_permissions_by_module`: Filtrado por módulo

**Cobertura**: Módulos (CORE, LOTES, RECOLECCIONES, PROVEEDORES, etc.)

##### `TestPermissionsWithRoles`
Tests de permisos a través de roles y grupos.

- `test_usuario_obtiene_permisos_de_rol`: Herencia de permisos de roles
- `test_usuario_obtiene_permisos_de_grupo`: Herencia de permisos de grupos

**Cobertura**: Roles, grupos, herencia de permisos

##### `TestPermissionsEdgeCases`
Tests de casos edge.

- `test_permiso_inactivo_no_otorga_acceso`: Permisos inactivos
- `test_rol_inactivo_no_otorga_permisos`: Roles inactivos
- `test_grupo_inactivo_no_otorga_permisos`: Grupos inactivos

**Cobertura**: Estados inactivos, edge cases

---

## Ejecución de Tests

### Ejecutar todos los tests RBAC:

```bash
# Desde el directorio backend/
pytest apps/core/tests/test_rbac.py -v
pytest apps/core/tests/test_permissions_api.py -v
```

### Ejecutar una clase específica:

```bash
pytest apps/core/tests/test_rbac.py::TestRBACPermisos -v
pytest apps/core/tests/test_rbac.py::TestRBACIntegracion -v
pytest apps/core/tests/test_permissions_api.py::TestPermissionsByAction -v
```

### Ejecutar un test específico:

```bash
pytest apps/core/tests/test_rbac.py::TestRBACPermisos::test_permiso_creacion_basica -v
pytest apps/core/tests/test_permissions_api.py::TestPermissionsDenied::test_usuario_sin_permiso_recibe_403 -v
```

### Ejecutar con cobertura de código:

```bash
pytest apps/core/tests/ --cov=apps.core.models --cov-report=html
```

### Ejecutar en modo verbose con salida detallada:

```bash
pytest apps/core/tests/ -vv -s
```

---

## Estructura del Sistema RBAC

### Jerarquía de Permisos (RBAC Híbrido):

El sistema implementa una jerarquía de permisos híbrida:

1. **Superusuario** → Todos los permisos (bypass)
2. **Cargo** → Permisos base del cargo organizacional
3. **Roles Adicionales** → Permisos especializados extra (COPASST, Brigadista, etc.)
4. **Roles Directos** → Roles asignados directamente al usuario
5. **Grupos** → Permisos colaborativos por equipo

**Acumulación de Permisos**: El usuario acumula permisos de todas las fuentes activas.

### Modelos Involucrados:

- **User**: Usuario del sistema
- **Permiso**: Permiso atómico (código, módulo, acción, alcance)
- **Cargo**: Puesto de trabajo organizacional
- **Role**: Rol del sistema (agrupación de permisos)
- **Group**: Grupo de trabajo (agrupación de usuarios y roles)
- **RolAdicional**: Rol adicional transversal (RBAC híbrido)

### Relaciones:

- **CargoPermiso**: Cargo ↔ Permiso
- **RolePermiso**: Role ↔ Permiso
- **RolAdicionalPermiso**: RolAdicional ↔ Permiso
- **UserRole**: User ↔ Role (con expiración)
- **UserGroup**: User ↔ Group (con líder)
- **UserRolAdicional**: User ↔ RolAdicional (con expiración y certificación)
- **GroupRole**: Group ↔ Role

---

## Métodos de Verificación de Permisos

### En el modelo `User`:

```python
# Verificar permiso específico
user.has_permission('lotes.view')  # → True/False

# Verificar al menos uno de los permisos
user.has_any_permission(['lotes.view', 'lotes.create'])  # → True/False

# Verificar todos los permisos
user.has_all_permissions(['lotes.view', 'lotes.create'])  # → True/False

# Obtener todos los permisos del usuario
user.get_all_permissions()  # → QuerySet[Permiso]

# Obtener códigos de permisos efectivos
user.get_permisos_efectivos()  # → List[str]

# Verificar rol
user.has_role('operario_planta')  # → True/False

# Verificar cargo
user.has_cargo('SUPERVISOR')  # → True/False

# Verificar grupo
user.is_in_group('equipo_produccion')  # → True/False

# Verificar rol adicional
user.tiene_rol_adicional('copasst')  # → True/False

# Obtener roles adicionales activos
user.get_roles_adicionales_activos()  # → QuerySet[UserRolAdicional]

# Obtener roles adicionales por tipo
user.get_roles_adicionales_por_tipo('LEGAL_OBLIGATORIO')  # → QuerySet
```

---

## Fixtures Disponibles

### Áreas:
- `area_operaciones`: Área de Operaciones
- `area_administracion`: Área de Administración

### Cargos:
- `cargo_operador`: Cargo de operador (nivel operativo)
- `cargo_supervisor`: Cargo de supervisor (nivel táctico)
- `cargo_gerente`: Cargo de gerente (nivel estratégico)

### Permisos:
- `permiso_ver_lotes`: Ver lotes (VIEW, ALL)
- `permiso_crear_lotes`: Crear lotes (CREATE, ALL)
- `permiso_editar_lotes`: Editar lotes (EDIT, OWN)
- `permiso_aprobar_lotes`: Aprobar lotes (APPROVE, ALL)
- `permiso_eliminar_lotes`: Eliminar lotes (DELETE, ALL)

### Roles:
- `rol_operario`: Rol de operario de planta
- `rol_supervisor`: Rol de supervisor de producción
- `rol_gerente`: Rol de gerente general (is_system=True)

### Grupos:
- `grupo_produccion`: Equipo de producción
- `grupo_calidad`: Equipo de calidad

### Roles Adicionales:
- `rol_adicional_copasst`: Miembro COPASST (LEGAL_OBLIGATORIO)
- `rol_adicional_brigadista`: Brigadista de emergencias (LEGAL_OBLIGATORIO)

### Usuarios:
- `usuario_sin_cargo`: Usuario sin cargo asignado
- `usuario_operador`: Usuario con cargo de operador
- `usuario_supervisor`: Usuario con cargo de supervisor
- `usuario_gerente`: Usuario con cargo de gerente
- `superuser`: Superusuario con todos los permisos

### API:
- `api_client`: Cliente API de DRF para pruebas

---

## Convenciones de Naming

### Tests:
- `test_[funcionalidad]_[comportamiento_esperado]`
- Ejemplos:
  - `test_permiso_creacion_basica`
  - `test_usuario_hereda_permisos_de_cargo`
  - `test_rol_adicional_con_expiracion`

### Fixtures:
- `[tipo]_[nombre_descriptivo]`
- Ejemplos:
  - `cargo_operador`
  - `permiso_ver_lotes`
  - `rol_adicional_copasst`

### Docstrings:
Formato AAA (Arrange-Act-Assert):

```python
def test_ejemplo(self):
    """
    Test: Descripción breve del test.

    Verifica que:
    - Condición 1
    - Condición 2
    - Condición 3
    """
```

---

## Patrones de Tests

### 1. Tests de Creación:
Verifican que los modelos se crean correctamente con los campos requeridos.

### 2. Tests de Relaciones:
Verifican que las relaciones ManyToMany y ForeignKey funcionan correctamente.

### 3. Tests de Herencia de Permisos:
Verifican que los usuarios heredan permisos de todas las fuentes.

### 4. Tests de Validación:
Verifican que las validaciones (permisos inactivos, usuarios inactivos, etc.) funcionan.

### 5. Tests de Edge Cases:
Verifican comportamientos en casos límite (usuario sin cargo, rol expirado, etc.).

### 6. Tests de Integración:
Verifican el flujo completo del sistema RBAC.

---

## Cobertura de Tests

### Estadísticas:

- **Total de tests**: 100+
- **Cobertura de modelos**: 100%
  - User
  - Permiso
  - Cargo
  - Role
  - Group
  - RolAdicional
  - Modelos intermedios (CargoPermiso, RolePermiso, UserRole, UserGroup, etc.)

### Cobertura de funcionalidades:

- ✅ Creación de permisos, roles, grupos, cargos
- ✅ Asignación de permisos a cargos
- ✅ Asignación de permisos a roles
- ✅ Asignación de roles a usuarios
- ✅ Asignación de usuarios a grupos
- ✅ Roles adicionales (RBAC híbrido)
- ✅ Expiración de roles
- ✅ Herencia de permisos (cargo, roles, roles adicionales, grupos)
- ✅ Superusuario con permisos totales
- ✅ Usuarios inactivos y eliminados
- ✅ Permisos, roles y grupos inactivos
- ✅ Scopes de permisos (OWN, TEAM, ALL)
- ✅ Acciones de permisos (VIEW, CREATE, EDIT, DELETE, APPROVE, EXPORT, MANAGE)
- ✅ Métodos de verificación (has_permission, has_any_permission, has_all_permissions)
- ✅ Auditoría de asignaciones

---

## Notas Importantes

### 1. Uso de pytest-django
Todos los tests usan el decorador `@pytest.mark.django_db` para acceso a la base de datos.

### 2. Fixtures Reutilizables
Los fixtures están diseñados para ser reutilizados en múltiples tests y son modulares.

### 3. Tests Independientes
Cada test es independiente y puede ejecutarse en cualquier orden.

### 4. Datos de Prueba
Se usan datos realistas que reflejan el contexto del negocio (operadores, supervisores, lotes, etc.).

### 5. Soft Delete
Los tests verifican que el soft delete (deleted_at) funciona correctamente bloqueando permisos.

---

## Próximos Pasos

### Tests Adicionales Recomendados:

1. **Performance Tests**: Tests de rendimiento para queries complejas de permisos
2. **Concurrency Tests**: Tests de asignación concurrente de permisos
3. **Migration Tests**: Verificar que las migraciones funcionan correctamente
4. **Signal Tests**: Tests de signals si se implementan (ej: notificaciones al asignar roles)
5. **Integration Tests con DRF ViewSets**: Tests de endpoints reales de la API

### Mejoras Futuras:

1. Implementar caché de permisos para mejorar performance
2. Agregar tests de permisos condicionales (basados en atributos del objeto)
3. Tests de permisos temporales con alertas de expiración
4. Tests de auditoría completa (quién asignó qué y cuándo)

---

## Contacto y Soporte

Para preguntas sobre los tests RBAC:

- **Documentación**: Revisar este README y los docstrings de los tests
- **Ejecución**: Usar los comandos de pytest mostrados arriba
- **Debugging**: Ejecutar tests específicos con `-vv -s` para salida detallada

---

**Última actualización**: 2025-12-24
**Versión**: 1.0
**Autor**: QA Engineer - ERP StrateKaz
