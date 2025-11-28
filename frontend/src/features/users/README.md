# Módulo de Gestión de Usuarios

Módulo completo para administrar usuarios del sistema Grasas y Huesos del Norte.

## Estructura

```
features/users/
├── api/              # API clients (no usado, se usa /api/users.api.ts global)
├── components/       # Componentes específicos del módulo
│   ├── UserForm.tsx           # Formulario crear/editar usuario
│   └── UsersTable.tsx         # Tabla con lista de usuarios
├── hooks/            # Custom hooks
│   └── useUsers.ts            # Hooks con React Query
├── pages/            # Páginas
│   └── UsersPage.tsx          # Página principal
└── types/            # Types (no usado, se usa /types/users.types.ts global)
```

## Características

### CRUD Completo
- Crear usuario con validación
- Editar usuario existente
- Eliminar usuario (soft delete)
- Activar/Desactivar usuario

### Filtros y Búsqueda
- Búsqueda por nombre o username
- Filtro por cargo
- Filtro por estado (activo/inactivo)
- Paginación

### Validaciones
- Username: 3-20 caracteres alfanuméricos
- Email: formato válido
- Password: mínimo 8 caracteres (solo en creación)
- Documento: 6-11 dígitos numéricos
- Teléfono: opcional, 10 dígitos

### Permisos
Solo usuarios con roles: `superadmin`, `gerente`, `administrador`

## Uso

### Importar en rutas
```typescript
import UsersPage from '@/features/users/pages/UsersPage';

<Route path="/usuarios" element={<UsersPage />} />
```

### Usar hooks personalizados
```typescript
import { useUsers, useCreateUser, useUpdateUser } from '@/features/users/hooks/useUsers';

const { data: usersData, isLoading } = useUsers({ search: 'juan' });
const createMutation = useCreateUser();
```

### Componentes reutilizables
```typescript
import { UserStatusBadge } from '@/components/users/UserStatusBadge';
import { CargoLevelBadge } from '@/components/users/CargoLevelBadge';

<UserStatusBadge isActive={user.is_active} />
<CargoLevelBadge cargo={user.cargo} />
```

## API Endpoints

- `GET /core/users/` - Listar usuarios (con filtros)
- `GET /core/users/{id}/` - Detalle de usuario
- `POST /core/users/` - Crear usuario
- `PATCH /core/users/{id}/` - Actualizar usuario
- `DELETE /core/users/{id}/` - Eliminar usuario (soft delete)
- `POST /core/users/{id}/change_password/` - Cambiar contraseña
- `GET /core/cargos/` - Listar cargos

## Dependencias

- `react-hook-form` + `zod` - Manejo de formularios y validación
- `@tanstack/react-query` - Estado del servidor
- `react-hot-toast` - Notificaciones
- `lucide-react` - Iconos
- `date-fns` - Formateo de fechas

## Notas

- El formulario muestra campos de contraseña solo en modo creación
- La eliminación es un soft delete (cambia is_active a false)
- Los badges de cargo tienen colores según el nivel:
  - Nivel 0 (Gerencia): Azul
  - Nivel 1 (Supervisión): Verde
  - Nivel 2 (Operativo): Amarillo
  - Nivel 3 (Temporal): Rojo
