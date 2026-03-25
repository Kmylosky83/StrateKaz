# Gestión de Usuarios — Centro de Control

Vista centralizada de todos los usuarios del tenant. Solo lectura + edición + control de estado.

**La creación de usuarios se realiza desde el módulo origen:**
- Colaboradores → Mi Equipo > Colaboradores
- Proveedores → Supply Chain > Proveedores
- Clientes → Sales CRM > Clientes
- Admin → Admin Global (DB)

## Estructura

```
features/users/
├── components/
│   ├── UserEditForm.tsx          # Formulario de edición (sin creación)
│   ├── UsersTable.tsx            # Tabla con lista de usuarios
│   └── ImpersonateVerifyModal.tsx # 2FA para impersonación
├── hooks/
│   └── useUsers.ts              # Hooks React Query (read/update/delete)
└── pages/
    └── UsersPage.tsx            # Página principal
```

## Funcionalidades

- Listar usuarios con filtros (cargo, origen, estado, tipo)
- Editar información de usuario existente
- Activar / Desactivar usuarios
- Eliminar usuario (soft delete)
- Impersonar usuario (superadmin, con 2FA)
- Cambiar contraseña

## API Endpoints

- `GET /core/users/` - Listar usuarios (con filtros)
- `GET /core/users/{id}/` - Detalle de usuario
- `POST /core/users/` - **DESHABILITADO** (405 Method Not Allowed)
- `PATCH /core/users/{id}/` - Actualizar usuario
- `DELETE /core/users/{id}/` - Eliminar usuario (soft delete)
- `POST /core/users/{id}/change_password/` - Cambiar contraseña
