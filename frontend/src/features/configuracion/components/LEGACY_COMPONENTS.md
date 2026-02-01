# Componentes Legacy - Modulo Configuracion

Este documento lista los componentes que fueron eliminados o deprecados durante la refactorizacion RBAC.

## Componentes Eliminados

### RolesTab.tsx (ELIMINADO)

**Estado**: ELIMINADO - 2025-01-12

**Ubicacion anterior**: `frontend/src/features/configuracion/components/RolesTab.tsx`

**Tamano**: 832 lineas

**Razon de eliminacion**: Componente redundante reemplazado por arquitectura modular.

---

### TabPermisosAcciones.tsx (ELIMINADO)

**Estado**: ELIMINADO - 2025-01-13

**Ubicacion anterior**: `frontend/src/features/configuracion/components/CargoFormTabs/TabPermisosAcciones.tsx`

**Razon de eliminacion**: RBAC Unificado v4.0 - Las acciones CRUD ahora estan integradas
directamente en TabAccesoSecciones.tsx. Cada seccion tiene sus propios checkboxes de
acciones (Ver, Crear, Editar, Eliminar).

---

## Arquitectura RBAC Actual (v4.0 - Unificado)

### Sistema de Permisos Unificado

El sistema de permisos se ha unificado completamente. Ya no hay separacion entre
"acceso a secciones" y "permisos de acciones". Ahora todo se configura en un solo lugar:

```
CargoSectionAccess (modelo Django)
├── cargo_id: FK al cargo
├── section_id: FK a la seccion del sistema
├── can_view: Puede ver la seccion
├── can_create: Puede crear en la seccion
├── can_edit: Puede editar en la seccion
└── can_delete: Puede eliminar en la seccion
```

### Generacion de Codigos de Permiso

Los permisos se generan automaticamente con el formato:

```
{modulo_code}.{section_code}.{accion}

Ejemplos:
- gestion_estrategica.empresa.view
- gestion_estrategica.empresa.edit
- gestion_estrategica.politicas.create
- gestion_estrategica.politicas.delete
```

### Flujo de Configuracion Simplificado

```
Configuracion > Cargos > Modal de Cargo (5 tabs)
├── Tab 1: Identificacion (datos basicos)
├── Tab 2: Funciones (manual de funciones)
├── Tab 3: Requisitos (formacion, experiencia)
├── Tab 4: SST (riesgos, EPP)
└── Tab 5: Acceso y Permisos (RBAC Unificado v4.0)
         └── Por cada seccion: checkboxes Ver, Crear, Editar, Eliminar
```

### Componentes Activos

```
frontend/src/features/
├── configuracion/components/
│   ├── CargoFormModal.tsx (5 tabs, Acceso y Permisos unificados)
│   └── CargoFormTabs/
│       ├── TabAccesoSecciones.tsx (RBAC v4.0 - secciones con acciones CRUD)
│       └── index.ts
└── talent-hub/pages/
    └── TalentHubPage.tsx (6 tabs: Estructura, Seleccion, Colaboradores, Onboarding, Formacion, Desempeno)
```

### Verificacion de Permisos en Frontend

Usar el hook `usePermissions` para verificar permisos:

```typescript
import { usePermissions } from '@/hooks/usePermissions';

const { hasPermission, canDo } = usePermissions();

// Verificar permiso directo
if (hasPermission('gestion_estrategica.empresa.edit')) {
  // Mostrar boton editar
}

// Usar helper canDo
if (canDo('gestion_estrategica', 'politicas', 'create')) {
  // Mostrar boton crear politica
}
```

## Historial de Cambios

- **2025-01-13**: RBAC Unificado v4.0
  - ELIMINADO: `CargoFormTabs/TabPermisosAcciones.tsx`
  - Tab 5 y Tab 6 unificados en un solo tab "Acceso y Permisos"
  - TabAccesoSecciones ahora incluye checkboxes de acciones CRUD por seccion
  - Modelo CargoSectionAccess ampliado con can_view, can_create, can_edit, can_delete
  - Permisos generados dinamicamente desde CargoSectionAccess
  - usePermissions actualizado: canDo ahora usa 'edit' en lugar de 'update'

- **2025-01-12**: RBAC v3.3.0
  - ELIMINADO: `configuracion/components/RolesTab.tsx` (832 lineas)
  - CargoFormModal expandido a 6 tabs (agregados Acceso UI y Permisos)
  - RolesAdicionalesSubTab movido a Talent Hub
  - RolesPermisosWrapper simplificado a 3 subtabs
  - UserForm simplificado (eliminada seccion Roles Funcionales)
