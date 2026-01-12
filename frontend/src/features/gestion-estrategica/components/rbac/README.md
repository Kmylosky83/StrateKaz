# Modulo RBAC - Roles y Permisos (v3.3.0)

Este modulo gestiona el sistema de Control de Acceso Basado en Roles (RBAC) hibrido de la aplicacion.

## Arquitectura

### Componente Principal
- **RolesPermisosWrapper.tsx**: Wrapper principal que contiene 3 subtabs de referencia
  - Matriz de Accesos (vista global de accesos por cargo)
  - Matriz de Permisos (vista global de permisos por cargo)
  - Catalogo de Permisos (68 permisos del sistema)

### Subtabs (Sub-componentes)
1. **PermisosCargoSubTab.tsx**: Matriz de permisos directos asignados a cargos
2. **RolesAdicionalesSubTab.tsx**: CRUD completo de roles adicionales
3. **TodosPermisosSubTab.tsx**: Vista de referencia de todos los permisos del sistema

## Flujo de Configuracion RBAC

### Configuracion de Permisos por Cargo
Los permisos se configuran directamente en el modal de cargo:

```text
Configuracion > Cargos > Editar Cargo (6 tabs)
├── Tab 5: Acceso UI (modulos/tabs/secciones visibles)
└── Tab 6: Permisos (acciones CRUD autorizadas)
```

### Roles Adicionales
Los roles adicionales se gestionan desde Talento Humano:

```text
Talento Humano > Roles Adicionales
├── CRUD de roles (COPASST, Brigadista, Auditor ISO, etc.)
└── Asignacion a usuarios
```

## Dependencias Cross-Feature

### CargosTab
`CargosTab` proviene de `configuracion/components/CargosTab.tsx` pero se re-exporta desde este modulo para evitar dependencias cross-feature directas en `OrganizacionTab.tsx`.

```typescript
// rbac/index.ts
export { CargosTab } from '@/features/configuracion/components/CargosTab';
export { RolesPermisosWrapper as RolesTab } from './RolesPermisosWrapper';
```

## Uso en OrganizacionTab

```typescript
import { CargosTab, RolesTab } from './rbac';

const SECTION_COMPONENTS = {
  cargos: CargosTab,
  roles: RolesTab,  // Realmente es RolesPermisosWrapper
  // ...
};
```

## Estructura de Archivos

```text
rbac/
├── README.md                      # Este archivo
├── index.ts                       # Exportaciones publicas del modulo
├── RolesPermisosWrapper.tsx       # Componente principal (wrapper con 3 tabs)
├── PermisosCargoSubTab.tsx        # Subtab: Matriz de permisos por cargo
├── RolesAdicionalesSubTab.tsx     # Subtab: Roles adicionales (gestion completa)
└── TodosPermisosSubTab.tsx        # Subtab: Catalogo de permisos
```

## Historial de Cambios

- **2025-01-12**: RBAC v3.3.0
  - ELIMINADO: `configuracion/components/RolesTab.tsx` (componente legacy de 832 lineas)
  - RolesPermisosWrapper simplificado a 3 subtabs (eliminado tab Roles Adicionales)
  - Roles Adicionales movido a Talent Hub
  - Configuracion de permisos unificada en CargoFormModal (tabs 5-6)

## Notas de Mantenimiento

- El nombre real del componente es `RolesPermisosWrapper` pero se exporta como `RolesTab`
- Todos los imports externos deben usar `from './rbac'` para obtener las exportaciones correctas
- Si se necesita acceder directamente a `RolesPermisosWrapper`, importar especificamente:
  ```typescript
  import { RolesPermisosWrapper } from '@/features/gestion-estrategica/components/rbac/RolesPermisosWrapper';
  ```
