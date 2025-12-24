# Módulo RBAC - Roles y Permisos

Este módulo gestiona el sistema de Control de Acceso Basado en Roles (RBAC) híbrido de la aplicación.

## Arquitectura

### Componente Principal
- **RolesPermisosWrapper.tsx**: Wrapper principal que contiene 3 subtabs
  - Permisos por Cargo
  - Roles Adicionales
  - Todos los Permisos

### Subtabs (Sub-componentes)
1. **PermisosCargoSubTab.tsx**: Gestión de permisos directos asignados a cargos
2. **RolesAdicionalesSubTab.tsx**: CRUD completo de roles adicionales + asignación a usuarios
3. **TodosPermisosSubTab.tsx**: Vista de referencia de todos los permisos del sistema (68 permisos)

## Resolución de Duplicados

### Problema Original
Existían dos componentes con el mismo nombre `RolesTab`:
- `gestion-estrategica/components/rbac/RolesTab.tsx` (58 líneas) - Wrapper activo
- `configuracion/components/RolesTab.tsx` (832 líneas) - Componente legacy NO usado

### Solución Implementada
1. **Renombrado**: `rbac/RolesTab.tsx` → `rbac/RolesPermisosWrapper.tsx`
2. **Export alias**: Se exporta como `RolesTab` desde `index.ts` para mantener compatibilidad
3. **Documentación**: Se agregó documentación clara en ambos archivos indicando el estado

```typescript
// rbac/index.ts
export { RolesPermisosWrapper as RolesTab } from './RolesPermisosWrapper';
```

### Componente Legacy
El archivo `configuracion/components/RolesTab.tsx` se mantiene por:
- Compatibilidad histórica
- Referencia de implementación anterior
- Posible migración futura

**IMPORTANTE**: Este componente NO se usa en ninguna parte activa de la aplicación.

## Dependencias Cross-Feature

### CargosTab
`CargosTab` proviene de `configuracion/components/CargosTab.tsx` pero se re-exporta desde este módulo para evitar dependencias cross-feature directas en `OrganizacionTab.tsx`.

```typescript
// rbac/index.ts
export { CargosTab } from '@/features/configuracion/components/CargosTab';
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

```
rbac/
├── README.md                      # Este archivo
├── index.ts                       # Exportaciones públicas del módulo
├── RolesPermisosWrapper.tsx      # Componente principal (wrapper con 3 tabs)
├── PermisosCargoSubTab.tsx       # Subtab: Permisos por cargo
├── RolesAdicionalesSubTab.tsx    # Subtab: Roles adicionales (gestión completa)
└── TodosPermisosSubTab.tsx       # Subtab: Vista de referencia de permisos
```

## Notas de Mantenimiento

- El nombre real del componente es `RolesPermisosWrapper` pero se exporta como `RolesTab`
- No confundir con `configuracion/RolesTab.tsx` (componente legacy)
- Todos los imports externos deben usar `from './rbac'` para obtener las exportaciones correctas
- Si se necesita acceder directamente a `RolesPermisosWrapper`, importar específicamente:
  ```typescript
  import { RolesPermisosWrapper } from '@/features/gestion-estrategica/components/rbac/RolesPermisosWrapper';
  ```
