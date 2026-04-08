# /usuarios — Centro de Control (solo lectura)

## Principio
La página `/usuarios` es un **centro de control**, NO un CRUD. No crea ni edita usuarios.

## Acciones disponibles
| Acción | Cómo |
|--------|------|
| Ver detalle | Click en ojo → UserDetailDrawer (panel lateral) |
| Impersonar | Menú ⋯ → Impersonar (requiere 2FA) |
| Toggle estado | Switch inline (activo/inactivo) |
| Ver actividad | Menú ⋯ → Ver actividad (futuro) |
| Ir a módulo origen | Menú ⋯ → navega a Colaboradores/Proveedores/etc. |

## Reglas
- **NO hay botón crear** — usuarios se crean desde su módulo origen
- **NO hay modal editar** — edición solo en módulo origen (SSOT)
- **NO hay botón eliminar** — solo desactivar vía Switch
- **Superadmin**: no se puede desactivar, no muestra firma digital
- **Filtro default**: `is_active=true` (muestra activos por defecto)

## Componentes
- `UsersPage.tsx` — página principal con filtros y tabla
- `UsersTable.tsx` — tabla con menú contextual
- `UserDetailDrawer.tsx` — panel lateral solo lectura
- `Drawer.tsx` — componente Design System (Framer Motion, portal, Escape)

## Origen de usuarios
| Tipo | Creado desde | Módulo origen |
|------|-------------|---------------|
| Colaborador | Gestión de Personas > Colaboradores | `/mi-equipo/colaboradores` |
| Proveedor | Supply Chain > Proveedores (futuro L50) | — |
| Cliente | Sales CRM > Clientes (futuro L53) | — |
| Manual | Solo DB (admin/superadmin) | — |
