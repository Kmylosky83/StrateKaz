# API REST - Gestión de Usuarios
## Sistema de Gestión Grasas y Huesos del Norte

## Endpoints Disponibles

### Cargos

**Base URL:** `/api/core/cargos/`

- **GET** `/api/core/cargos/` - Lista de cargos activos
  - Query params: `level`, `is_active`, `parent_cargo`, `search`, `ordering`
  - Paginación: 20 por página
  - Permisos: Usuario autenticado

- **GET** `/api/core/cargos/{id}/` - Detalle de cargo
  - Permisos: Usuario autenticado

---

### Usuarios

**Base URL:** `/api/core/users/`

#### Endpoints CRUD

- **GET** `/api/core/users/` - Lista de usuarios
  - Query params: `cargo`, `is_active`, `is_staff`, `document_type`, `search`, `ordering`, `include_deleted`
  - Filtros de búsqueda: username, email, nombre, apellido, document_number
  - Paginación: 20 por página
  - Permisos: Usuario autenticado
  - Serializer: `UserListSerializer`

- **POST** `/api/core/users/` - Crear nuevo usuario
  - Permisos: Autenticado + CanManageUsers (nivel 2+)
  - Serializer: `UserCreateSerializer`
  - Body:
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string (min 8 chars)",
      "password_confirm": "string",
      "first_name": "string",
      "last_name": "string",
      "cargo_id": "integer",
      "phone": "string",
      "document_type": "CC|CE|NIT",
      "document_number": "string",
      "is_active": "boolean",
      "is_staff": "boolean"
    }
    ```

- **GET** `/api/core/users/{id}/` - Detalle de usuario
  - Permisos: Usuario autenticado
  - Serializer: `UserDetailSerializer`

- **PUT** `/api/core/users/{id}/` - Actualizar usuario completo
  - Permisos: Usuario autenticado
  - Serializer: `UserUpdateSerializer`

- **PATCH** `/api/core/users/{id}/` - Actualizar usuario parcial
  - Permisos: Usuario autenticado
  - Serializer: `UserUpdateSerializer`
  - Body:
    ```json
    {
      "first_name": "string",
      "last_name": "string",
      "email": "string",
      "phone": "string",
      "cargo_id": "integer",
      "is_active": "boolean",
      "is_staff": "boolean"
    }
    ```

- **DELETE** `/api/core/users/{id}/` - Soft delete de usuario
  - Permisos: Autenticado + CanManageUsers (nivel 2+)
  - Nota: No elimina físicamente, marca deleted_at

#### Acciones Personalizadas

- **POST** `/api/core/users/{id}/change_password/` - Cambiar contraseña
  - Permisos: Propio usuario o Admin (nivel 2+)
  - Body:
    ```json
    {
      "old_password": "string",
      "new_password": "string (min 8 chars)",
      "confirm_password": "string"
    }
    ```

- **POST** `/api/core/users/{id}/restore/` - Restaurar usuario eliminado
  - Permisos: Autenticado + CanManageUsers (nivel 2+)

- **GET** `/api/core/users/me/` - Información del usuario actual
  - Permisos: Usuario autenticado
  - Retorna: UserDetailSerializer del usuario actual

- **GET** `/api/core/users/stats/` - Estadísticas de usuarios
  - Permisos: Usuario autenticado
  - Retorna:
    ```json
    {
      "total": "integer",
      "active": "integer",
      "inactive": "integer",
      "deleted": "integer",
      "by_cargo": [
        {
          "cargo__name": "string",
          "cargo__code": "string",
          "count": "integer"
        }
      ]
    }
    ```

---

### Permisos

**Base URL:** `/api/core/permisos/`

- **GET** `/api/core/permisos/` - Lista de permisos
  - Query params: `module`, `action`, `scope`, `is_active`, `search`, `ordering`
  - Permisos: Autenticado + CanManageUsers
  - Serializer: `PermisoSerializer`

- **GET** `/api/core/permisos/{id}/` - Detalle de permiso
  - Permisos: Autenticado + CanManageUsers

- **GET** `/api/core/permisos/by_module/` - Permisos agrupados por módulo
  - Permisos: Autenticado + CanManageUsers
  - Retorna: Diccionario con permisos agrupados por módulo

---

## Permisos del Sistema

### Clases de Permisos Disponibles

1. **CanManageUsers** - Gestión de usuarios
   - Requiere: Cargo nivel 2+ o SuperAdmin
   - Aplica a: CREATE, UPDATE, DELETE usuarios

2. **IsOwnerOrAdmin** - Solo propietario o admin
   - Requiere: Ser propietario del recurso o nivel 2+

3. **IsActiveUser** - Usuario activo
   - Requiere: Usuario activo y no eliminado

4. **CanViewUsers** - Ver usuarios
   - Requiere: Usuario autenticado

5. **HasModulePermission** - Permiso basado en módulo
   - Requiere: Permiso específico en modelo Permiso

6. **IsSuperAdmin** - Solo SuperAdmin
   - Requiere: is_superuser = True

7. **CanManageCargos** - Gestión de cargos
   - Requiere: SuperAdmin

8. **CanManagePermissions** - Gestión de permisos
   - Requiere: SuperAdmin

---

## Validaciones

### Usuarios

- **username**: Sin espacios, único
- **email**: Formato válido, único
- **document_number**: Único, obligatorio
- **password**: Mínimo 8 caracteres (en creación)
- **cargo**: Debe existir y estar activo

### Soft Delete

- Los usuarios no se eliminan físicamente
- Se marca `deleted_at` con timestamp
- Se desactiva automáticamente (`is_active = False`)
- Pueden restaurarse con endpoint `/restore/`

---

## Paginación

Todos los endpoints de lista retornan paginación estándar de DRF:

```json
{
  "count": "integer - total de registros",
  "next": "string - URL próxima página",
  "previous": "string - URL página anterior",
  "results": "array - datos de la página actual"
}
```

Tamaño de página: 20 registros

---

## Filtros y Búsqueda

### Usuarios
- **Filtros exactos**: `cargo`, `is_active`, `is_staff`, `document_type`
- **Búsqueda**: `username`, `email`, `first_name`, `last_name`, `document_number`
- **Ordenamiento**: `date_joined`, `username`, `last_name`

### Cargos
- **Filtros exactos**: `level`, `is_active`, `parent_cargo`
- **Búsqueda**: `code`, `name`, `description`
- **Ordenamiento**: `level`, `name`, `created_at`

### Permisos
- **Filtros exactos**: `module`, `action`, `scope`, `is_active`
- **Búsqueda**: `code`, `name`, `description`
- **Ordenamiento**: `module`, `action`, `created_at`

---

## Ejemplos de Uso

### Crear Usuario
```bash
POST /api/core/users/
Content-Type: application/json
Authorization: Bearer <token>

{
  "username": "jperez",
  "email": "jperez@example.com",
  "password": "Password123!",
  "password_confirm": "Password123!",
  "first_name": "Juan",
  "last_name": "Pérez",
  "cargo_id": 1,
  "document_type": "CC",
  "document_number": "1234567890",
  "phone": "+57 300 1234567",
  "is_active": true
}
```

### Actualizar Usuario
```bash
PATCH /api/core/users/1/
Content-Type: application/json
Authorization: Bearer <token>

{
  "first_name": "Juan Carlos",
  "phone": "+57 300 9999999"
}
```

### Cambiar Contraseña
```bash
POST /api/core/users/1/change_password/
Content-Type: application/json
Authorization: Bearer <token>

{
  "old_password": "Password123!",
  "new_password": "NewPassword456!",
  "confirm_password": "NewPassword456!"
}
```

### Buscar Usuarios
```bash
GET /api/core/users/?search=juan&cargo=2&is_active=true
Authorization: Bearer <token>
```

### Estadísticas
```bash
GET /api/core/users/stats/
Authorization: Bearer <token>
```

---

## Códigos de Estado HTTP

- **200 OK** - Operación exitosa
- **201 Created** - Recurso creado exitosamente
- **204 No Content** - Eliminación exitosa
- **400 Bad Request** - Error de validación
- **401 Unauthorized** - No autenticado
- **403 Forbidden** - Sin permisos
- **404 Not Found** - Recurso no encontrado
- **500 Internal Server Error** - Error del servidor
