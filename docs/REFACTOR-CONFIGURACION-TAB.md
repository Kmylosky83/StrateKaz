# Refactorización ConfiguracionTab.tsx

## Resumen
Refactorización completa del componente `ConfiguracionTab.tsx` para usar la API dinámica de módulos desde la base de datos en lugar de arrays hardcodeados.

## Cambios Realizados

### 1. Imports Actualizados

**Antes:**
```typescript
import { useTenantConfig, useUpdateTenantFeatures, useUpdateTenantUISettings } from '../hooks/useTenantConfig';
```

**Después:**
```typescript
import { useModulesTree, useToggleModule, useToggleTab, useToggleSection } from '../hooks/useModules';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/modules.types';
import type { SystemModuleTree } from '../types/modules.types';
```

### 2. Arrays Hardcodeados Eliminados

Se eliminaron completamente:
- `FEATURE_DEFINITIONS` (9 items hardcodeados de módulos y features)
- `FeatureDefinition` interface

Se mantuvieron:
- `UI_SETTINGS_DEFINITIONS` (4 items para configuraciones de interfaz)
- `UISettingDefinition` interface

### 3. Helper para Iconos Dinámicos

```typescript
/**
 * Helper para obtener el componente de icono de Lucide por nombre
 * Retorna Circle si el icono no existe o no se especifica
 */
const getIconComponent = (iconName?: string): LucideIcon => {
  if (!iconName) return Circle;
  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons];
  return (IconComponent as LucideIcon) || Circle;
};
```

**Uso:**
- Lee el nombre del icono desde la BD (ej: "ShieldCheck", "Car", "Package")
- Importa dinámicamente el componente correcto de `lucide-react`
- Fallback a `Circle` si el icono no existe

### 4. Refactorización de `ModulosAndFeaturesSection`

#### Antes: Arrays estáticos
- Usaba `FEATURE_DEFINITIONS` hardcodeado
- Dividía en `moduleFeatures` y `subFeatures`
- No mostraba jerarquía de tabs/secciones

#### Después: Árbol dinámico desde BD
- Usa `useModulesTree()` para obtener todos los módulos
- Agrupa por categoría con `useMemo`
- Muestra jerarquía completa: **Categorías → Módulos → Tabs → Secciones**

```typescript
const { data: tree, isLoading } = useModulesTree();
const toggleModule = useToggleModule();
const toggleTab = useToggleTab();
const toggleSection = useToggleSection();

// Agrupación por categoría
const modulesByCategory = useMemo(() => {
  if (!tree) return {};
  return tree.modules.reduce((acc, module) => {
    const cat = module.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(module);
    return acc;
  }, {} as Record<string, SystemModuleTree[]>);
}, [tree]);
```

### 5. Nueva Estructura Visual

#### Por cada categoría:
```
┌─────────────────────────────────────────────┐
│ 📦 Dirección Estratégica                     │
│ 3 módulos disponibles                      │
├─────────────────────────────────────────────┤
│ [Grid 3 columnas]                          │
│  ┌─────┐  ┌─────┐  ┌─────┐                │
│  │ Mod1│  │ Mod2│  │ Mod3│                │
│  └─────┘  └─────┘  └─────┘                │
├─────────────────────────────────────────────┤
│ ⚙️ Tabs de Módulo 1        [2/3]          │
│   → Tab 1 (habilitado)                     │
│     └── Sección 1.1                        │
│     └── Sección 1.2                        │
│   → Tab 2 (deshabilitado)                  │
│   → Tab 3 (habilitado)                     │
└─────────────────────────────────────────────┘
```

### 6. Características de la Nueva Implementación

#### Toggle en Cascada
- **Módulo OFF** → Deshabilita todos sus tabs y secciones
- **Tab OFF** → Deshabilita todas sus secciones
- **Dependencias** → El backend notifica elementos afectados

#### Estados Disabled
```typescript
// Módulos: Solo disabled si está pendiente otra operación
disabled={!module.is_core && isPending}

// Tabs: Disabled si el módulo padre está off O hay operación pendiente
disabled={!tab.is_core && (isPending || !module.is_enabled)}

// Secciones: Disabled si el tab padre está off O hay operación pendiente
disabled={!section.is_core && (isPending || !tab.is_enabled)}
```

#### Badges Informativos
```typescript
<Badge variant="gray" size="sm">
  {module.enabled_tabs_count}/{module.total_tabs_count}
</Badge>
```

### 7. UISettingsCard Separado

Se extrajo a un componente independiente:

```typescript
const UISettingsCard = () => {
  // Estado local temporal (TODO: conectar a API)
  const [uiSettings, setUiSettings] = useState<Partial<TenantUISettings>>({
    sidebar_collapsed_default: false,
    show_module_badges: true,
    dark_mode_enabled: true,
    custom_theme_enabled: false,
  });

  const handleToggle = (key: keyof TenantUISettings) => {
    setUiSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    // TODO: Llamar a API cuando esté disponible
  };

  return (
    <Card>
      {/* Render de UI settings */}
    </Card>
  );
};
```

**Nota:** Los UI Settings todavía usan estado local porque no son parte del sistema de módulos dinámicos. Se pueden conectar a la API más adelante.

## Datos Consumidos de la API

### Endpoint: `GET /core/modules/tree/`

Retorna:
```typescript
{
  modules: [
    {
      id: 1,
      code: "SST",
      name: "Seguridad y Salud en el Trabajo",
      description: "Sistema de Gestión SST",
      icon: "ShieldCheck",
      color: "orange",
      category: "INTEGRAL",
      is_enabled: true,
      is_core: false,
      tabs: [
        {
          id: 5,
          code: "INCIDENTES",
          name: "Incidentes y Accidentes",
          icon: "AlertTriangle",
          is_enabled: true,
          sections: [
            {
              id: 10,
              code: "REPORTAR",
              name: "Reportar Incidente",
              is_enabled: true
            }
          ]
        }
      ],
      enabled_tabs_count: 3,
      total_tabs_count: 5
    }
  ],
  total_modules: 15,
  enabled_modules: 12,
  categories: [...]
}
```

### Mutations Usadas

1. **toggleModule:** `PATCH /core/modules/{id}/toggle/`
2. **toggleTab:** `PATCH /core/tabs/{id}/toggle/`
3. **toggleSection:** `PATCH /core/sections/{id}/toggle/`

Todas retornan:
```typescript
{
  success: true,
  message: "Módulo actualizado correctamente",
  affected_items: {
    modules: [],
    tabs: ["TAB-1", "TAB-2"],
    sections: ["SEC-1", "SEC-2", "SEC-3"]
  }
}
```

## Beneficios de la Refactorización

1. **Configuración Dinámica**
   - Los módulos se gestionan desde la BD
   - No requiere deployment para agregar/modificar módulos
   - Soporte para multi-tenant con diferentes configuraciones

2. **Jerarquía Visible**
   - El usuario ve claramente la estructura: Categoría → Módulo → Tab → Sección
   - Mejor comprensión de dependencias

3. **Iconos Dinámicos**
   - Los iconos se configuran por nombre en la BD
   - Fallback automático si el icono no existe

4. **Mejor UX**
   - Mensajes informativos de elementos afectados
   - Estados disabled coherentes con la jerarquía
   - Loading states mejorados

5. **Mantenibilidad**
   - Eliminación de 80+ líneas de código hardcodeado
   - Single source of truth (la BD)
   - Fácil de extender con nuevos módulos

## Compatibilidad

- **Mantenidas:** Secciones de Branding y Consecutivos (sin cambios)
- **Preservado:** UI Settings (por ahora con estado local)
- **Mejorado:** Módulos y Features (ahora dinámico)

## Archivos Modificados

```
frontend/src/features/gestion-estrategica/
└── components/
    └── ConfiguracionTab.tsx  ✅ Refactorizado
```

## Próximos Pasos

1. **UI Settings API:** Conectar `UISettingsCard` a un endpoint real cuando esté disponible
2. **Permisos:** Integrar con el sistema RBAC para mostrar/ocultar módulos según permisos
3. **Licencias:** Mostrar advertencias si un módulo requiere licencia que está por vencer
4. **Testing:** Agregar tests unitarios para la nueva lógica de agrupación

## Ejemplo de Uso

```typescript
// El componente se usa igual que antes
<ConfiguracionTab />

// Internamente ahora consume:
const { data: tree } = useModulesTree();

// Y permite toggle jerárquico:
toggleModule.mutate({ id: 5, isEnabled: false });
// → Deshabilita el módulo y todos sus tabs/secciones

toggleTab.mutate({ id: 10, isEnabled: true });
// → Habilita solo ese tab (si el módulo padre está habilitado)
```

## Notas de Implementación

- **TypeScript:** Tipos correctos importados desde `modules.types.ts`
- **Performance:** `useMemo` para evitar re-agrupaciones innecesarias
- **Error Handling:** Los hooks de mutation manejan errores y muestran toasts
- **Optimistic Updates:** TanStack Query maneja invalidaciones automáticas
- **Accesibilidad:** Mantiene la estructura semántica de Cards y Grids del Design System
