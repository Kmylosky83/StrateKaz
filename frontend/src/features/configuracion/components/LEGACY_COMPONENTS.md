# Componentes Legacy - Modulo Configuracion

Este documento lista los componentes que fueron eliminados o deprecados durante la refactorizacion RBAC v3.3.0.

## Componentes Eliminados

### RolesTab.tsx (ELIMINADO)

**Estado**: ELIMINADO - 2025-01-12

**Ubicacion anterior**: `frontend/src/features/configuracion/components/RolesTab.tsx`

**Tamano**: 832 lineas

**Razon de eliminacion**: Componente redundante reemplazado por arquitectura modular:
- `gestion-estrategica/components/rbac/RolesPermisosWrapper.tsx` (wrapper con subtabs)
- `gestion-estrategica/components/rbac/RolesAdicionalesSubTab.tsx` (gestion completa)
- `talent-hub/pages/TalentHubPage.tsx` (tab Roles Adicionales)

---

## Arquitectura RBAC Actual (v3.3.0)

### Flujo de Configuracion Unificado

La configuracion de RBAC se ha simplificado para ser mas intuitiva:

```
Configuracion > Cargos > Modal de Cargo (6 tabs)
├── Tab 1: Identificacion (datos basicos)
├── Tab 2: Funciones (manual de funciones)
├── Tab 3: Requisitos (formacion, experiencia)
├── Tab 4: SST (riesgos, EPP)
├── Tab 5: Acceso UI (modulos/tabs/secciones visibles)
└── Tab 6: Permisos (acciones CRUD autorizadas)
```

### Roles Adicionales → Talento Humano

Los Roles Adicionales (COPASST, Brigadista, Auditor ISO, etc.) se gestionan desde:

```
Talento Humano > Roles Adicionales
├── Crear/Editar roles
├── Asignar a usuarios
├── Gestionar certificaciones
└── Ver estadisticas
```

### RolesPermisosWrapper (Vista de Referencia)

El componente `RolesPermisosWrapper` en Organizacion > Roles y Permisos contiene:

```
Organizacion > Roles y Permisos
├── Matriz de Accesos: Vista global de accesos por cargo
├── Matriz de Permisos: Vista global de permisos por cargo
└── Catalogo de Permisos: Referencia de los 68 permisos del sistema
```

### Componentes Activos

```
frontend/src/features/
├── configuracion/components/
│   ├── CargoFormModal.tsx (6 tabs, incluye Acceso y Permisos)
│   └── CargoFormTabs/
│       ├── TabAccesoSecciones.tsx (selector de secciones UI)
│       ├── TabPermisosAcciones.tsx (selector de permisos CRUD)
│       └── index.ts
├── gestion-estrategica/components/rbac/
│   ├── RolesPermisosWrapper.tsx (3 subtabs para vista global)
│   ├── PermisosCargoSubTab.tsx (matriz de permisos)
│   ├── RolesAdicionalesSubTab.tsx (CRUD de roles adicionales)
│   └── TodosPermisosSubTab.tsx (catalogo de permisos)
└── talent-hub/pages/
    └── TalentHubPage.tsx (incluye tab de Roles Adicionales)
```

## Historial de Cambios

- **2025-01-12**: RBAC v3.3.0
  - ELIMINADO: `configuracion/components/RolesTab.tsx` (832 lineas)
  - CargoFormModal expandido a 6 tabs (agregados Acceso UI y Permisos)
  - RolesAdicionalesSubTab movido a Talent Hub
  - RolesPermisosWrapper simplificado a 3 subtabs
  - UserForm simplificado (eliminada seccion Roles Funcionales)
  - ESLint actualizado a v9.39.2
