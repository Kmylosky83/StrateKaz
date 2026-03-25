# Gestión de Usuarios — Centro de Control

Centro de control de identidad digital. Solo lectura + control de estado + impersonación.

**No se editan datos aquí.** La edición se hace en el módulo origen:
- Colaboradores → Mi Equipo > Colaboradores
- Proveedores → Supply Chain > Proveedores
- Clientes → Sales CRM > Clientes

## Estructura

```
features/users/
├── components/
│   ├── UserDetailDrawer.tsx       # Panel lateral de detalle (solo lectura)
│   ├── UsersTable.tsx             # Tabla con Switch + Dropdown contextual
│   └── ImpersonateVerifyModal.tsx # 2FA para impersonación
├── hooks/
│   └── useUsers.ts               # Hooks React Query
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
