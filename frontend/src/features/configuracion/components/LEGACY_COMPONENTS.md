# Componentes Legacy - Módulo Configuración

Este documento lista los componentes que ya NO se usan activamente en la aplicación pero se mantienen por compatibilidad o referencia histórica.

## RolesTab.tsx

**Estado**: LEGACY - NO USADO

**Ubicación**: `frontend/src/features/configuracion/components/RolesTab.tsx`

**Tamaño**: 832 líneas

**Razón**: Este componente fue reemplazado por la nueva arquitectura modular en `gestion-estrategica`:
- `gestion-estrategica/components/rbac/RolesPermisosWrapper.tsx` (wrapper con subtabs)
- `gestion-estrategica/components/rbac/RolesAdicionalesSubTab.tsx` (gestión completa)

**Funcionalidad Original**:
- Plantillas sugeridas de roles predefinidos
- Tabla de roles adicionales existentes
- CRUD completo de roles
- Asignación de roles a usuarios

**Exportaciones**:
- Se exporta en `configuracion/index.ts`
- NO se importa en ningún componente activo de la aplicación

**Decisión**:
- ✅ Se mantiene por referencia histórica
- ✅ Documentado claramente como LEGACY en el header del archivo
- ❌ NO eliminar aún (puede servir para referencia o migración)

## Resolución de Conflictos de Nombres

### Problema
Existían dos archivos con el nombre `RolesTab.tsx`:
1. `gestion-estrategica/components/rbac/RolesTab.tsx` (58 líneas) - ACTIVO
2. `configuracion/components/RolesTab.tsx` (832 líneas) - LEGACY

### Solución
Se renombró el componente activo:
- `rbac/RolesTab.tsx` → `rbac/RolesPermisosWrapper.tsx`
- Se exporta como `RolesTab` desde `rbac/index.ts` para mantener compatibilidad
- El componente legacy conserva su nombre original con documentación clara

### Mapa de Migración

```
ANTES (Conflicto):
├── configuracion/components/RolesTab.tsx (832 líneas, NO usado)
└── gestion-estrategica/components/rbac/RolesTab.tsx (58 líneas, USADO)

DESPUÉS (Resuelto):
├── configuracion/components/RolesTab.tsx (832 líneas, LEGACY documentado)
└── gestion-estrategica/components/rbac/
    ├── RolesPermisosWrapper.tsx (58 líneas, ACTIVO)
    └── index.ts (exporta como RolesTab para compatibilidad)
```

## Notas para Desarrolladores

1. **NO usar** `configuracion/components/RolesTab.tsx` en nuevo código
2. **SÍ usar** `gestion-estrategica/components/rbac` con import desde `./rbac`
3. Si necesitas la funcionalidad de roles, importa desde:
   ```typescript
   import { RolesTab } from '@/features/gestion-estrategica/components/rbac';
   ```
4. El componente legacy puede ser eliminado en una versión futura si no se requiere

## Historial de Cambios

- **2025-12-24**: Documentado como LEGACY y resuelto conflicto de nombres
- **2025-12-XX**: Reemplazado por arquitectura modular en gestion-estrategica
