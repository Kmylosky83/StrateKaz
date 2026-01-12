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

---

## Arquitectura RBAC Actual (v3.3.0)

### Flujo de Configuración Unificado

La configuración de RBAC se ha simplificado para ser más intuitiva:

```
Configuración > Cargos > Modal de Cargo (6 tabs)
├── Tab 1: Identificación (datos básicos)
├── Tab 2: Funciones (manual de funciones)
├── Tab 3: Requisitos (formación, experiencia)
├── Tab 4: SST (riesgos, EPP)
├── Tab 5: Acceso UI (módulos/tabs/secciones visibles)
└── Tab 6: Permisos (acciones CRUD autorizadas)
```

### Roles Adicionales → Talento Humano

Los Roles Adicionales (COPASST, Brigadista, Auditor ISO, etc.) se gestionan desde:

```
Talento Humano > Roles Adicionales
├── Crear/Editar roles
├── Asignar a usuarios
├── Gestionar certificaciones
└── Ver estadísticas
```

### RolesPermisosWrapper (Vista de Referencia)

El componente `RolesPermisosWrapper` en Organización > Roles y Permisos ahora contiene:

```
Organización > Roles y Permisos
├── Matriz de Accesos: Vista global de accesos por cargo
├── Matriz de Permisos: Vista global de permisos por cargo
└── Catálogo de Permisos: Referencia de los 68 permisos del sistema
```

### Componentes Involucrados

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
│   └── TodosPermisosSubTab.tsx (catálogo de permisos)
└── talent-hub/pages/
    └── TalentHubPage.tsx (incluye tab de Roles Adicionales)
```

## Historial de Cambios

- **2025-01-12**: Reorganización RBAC v3.3.0
  - CargoFormModal expandido a 6 tabs (agregados Acceso UI y Permisos)
  - RolesAdicionalesSubTab movido a Talent Hub
  - RolesPermisosWrapper simplificado a 3 subtabs
- **2024-12-24**: Documentado como LEGACY y resuelto conflicto de nombres
- **2024-12-XX**: Reemplazado por arquitectura modular en gestion-estrategica
