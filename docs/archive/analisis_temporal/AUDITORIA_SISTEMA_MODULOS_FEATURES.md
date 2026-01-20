# AUDITORÍA EXHAUSTIVA: SISTEMA DE MÓDULOS Y FEATURES - FRONTEND STRATEKAZ

**Fecha**: 2026-01-18
**Auditor**: Claude (Análisis Arquitectónico)
**Alcance**: Sistema de activación/desactivación granular de módulos, tabs y secciones

---

## 📋 RESUMEN EJECUTIVO

El sistema de Módulos y Features en StrateKaz es una arquitectura **DINÁMICA Y GRANULAR** que permite controlar la disponibilidad de funcionalidades a tres niveles:

1. **Módulo** (Nivel superior - ej: "Gestión Estratégica")
2. **Tab** (Nivel intermedio - ej: "Configuración")
3. **Sección** (Nivel granular - ej: "Branding", "Módulos", "Sedes")

**Hallazgos Principales**:
- ✅ Sistema **ROBUSTO** con arquitectura completa Backend ↔ Frontend
- ✅ Integración **CORRECTA** con RBAC v3.3 (CargoSectionAccess)
- ✅ Componentes del Design System **BIEN IMPLEMENTADOS**
- ⚠️ **BRECHA CRÍTICA**: No se actualiza automáticamente cuando se crean nuevas secciones
- ⚠️ Falta sistema de seeding/migración para nuevos módulos

**Líneas de Código Analizadas**: 2,277 líneas (4 archivos core)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### 1. FLUJO DE DATOS COMPLETO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Django)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ MODELS (apps/core/models/models_system_modules.py - 522 líneas)  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  ┌───────────────────┐  ┌──────────────────┐  ┌───────────────┐ │  │
│  │  │  SystemModule     │  │  ModuleTab       │  │  TabSection   │ │  │
│  │  ├───────────────────┤  ├──────────────────┤  ├───────────────┤ │  │
│  │  │ - code (unique)   │  │ - code (único    │  │ - code        │ │  │
│  │  │ - name            │  │   dentro de      │  │ - name        │ │  │
│  │  │ - description     │  │   módulo)        │  │ - description │ │  │
│  │  │ - category        │  │ - name           │  │ - icon        │ │  │
│  │  │ - color           │  │ - icon           │  │ - orden       │ │  │
│  │  │ - icon            │  │ - orden          │  │ - is_enabled  │ │  │
│  │  │ - route           │  │ - is_enabled     │  │ - is_core     │ │  │
│  │  │ - is_core         │  │ - is_core        │  │ - supported_  │ │  │
│  │  │ - is_enabled      │  │ - module (FK)    │  │   actions     │ │  │
│  │  │ - orden           │  │                  │  │ - tab (FK)    │ │  │
│  │  │ - dependencies    │  │                  │  │               │ │  │
│  │  │   (M2M)           │  │                  │  │               │ │  │
│  │  └───────────────────┘  └──────────────────┘  └───────────────┘ │  │
│  │           │                      │                      │         │  │
│  │           └──────────────────────┴──────────────────────┘         │  │
│  │                                                                    │  │
│  │  JERARQUÍA:  Módulo → Tabs → Secciones (3 niveles)                │  │
│  │                                                                    │  │
│  │  MÉTODOS CLAVE:                                                   │  │
│  │  • can_disable() - Validación de dependencias                     │  │
│  │  • enable() - Activación en cascada                               │  │
│  │  • disable() - Desactivación con validación                       │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ VIEWSETS (apps/core/viewsets_config.py - 604 líneas)             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  SystemModuleViewSet:                                             │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  • GET  /api/core/system-modules/                                │  │
│  │  • POST /api/core/system-modules/                                │  │
│  │  • GET  /api/core/system-modules/{id}/                           │  │
│  │  • PATCH /api/core/system-modules/{id}/toggle/                   │  │
│  │                                                                    │  │
│  │  ⭐ ENDPOINTS ESPECIALES:                                         │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  • GET  /api/core/system-modules/tree/                           │  │
│  │    └─> Árbol completo con FILTRADO RBAC                          │  │
│  │    └─> Super usuario: TODO                                       │  │
│  │    └─> Usuario normal: FILTRADO por CargoSectionAccess           │  │
│  │                                                                    │  │
│  │  • GET  /api/core/system-modules/sidebar/                        │  │
│  │    └─> Versión compacta para navegación lateral                  │  │
│  │    └─> Solo habilitados + filtrado RBAC                          │  │
│  │                                                                    │  │
│  │  • GET  /api/core/system-modules/categories/                     │  │
│  │  • GET  /api/core/system-modules/enabled/                        │  │
│  │                                                                    │  │
│  │  ModuleTabViewSet + TabSectionViewSet:                           │  │
│  │  • PATCH /api/core/module-tabs/{id}/toggle/                      │  │
│  │  • PATCH /api/core/tab-sections/{id}/toggle/                     │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ INTEGRACIÓN RBAC v3.3                                             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  CargoSectionAccess (Modelo de permisos granulares):             │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ cargo (FK) → section (FK to TabSection)                      │ │  │
│  │  │ can_view, can_create, can_edit, can_delete                   │ │  │
│  │  │ additional_permissions (JSONField)                           │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  FILTRADO EN /tree/ Y /sidebar/:                                  │  │
│  │  1. Obtener section_ids autorizados del cargo                    │  │
│  │  2. Filtrar tabs que contienen esas secciones                    │  │
│  │  3. Filtrar módulos que contienen esos tabs                      │  │
│  │  4. Prefetch con queryset filtrado                               │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

                                    ↓ HTTP / REST API

┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ HOOKS (hooks/useModules.ts - 502 líneas)                         │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  REACT QUERY HOOKS:                                               │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  • useModulesTree()        → Árbol completo                      │  │
│  │  • useSidebarModules()     → Navegación lateral                  │  │
│  │  • useToggleModule()       → Activar/Desactivar módulo           │  │
│  │  • useToggleTab()          → Activar/Desactivar tab              │  │
│  │  • useToggleSection()      → Activar/Desactivar sección          │  │
│  │                                                                    │  │
│  │  HELPER HOOKS:                                                    │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  • useModuleEnabled(code)                                         │  │
│  │  • useTabEnabled(moduleCode, tabCode)                            │  │
│  │  • useSectionEnabled(moduleCode, tabCode, sectionCode)           │  │
│  │  • useTabSections(moduleCode, tabCode)  → Para Header dinámico  │  │
│  │  • useModulesByCategory()                                         │  │
│  │  • useModulesStats()                                              │  │
│  │                                                                    │  │
│  │  CACHE & INVALIDATION:                                            │  │
│  │  • staleTime: 5 minutos                                           │  │
│  │  • Invalidación en cascada al toggle                             │  │
│  │  • Optimistic updates en toggles                                 │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ COMPONENTES (ConfiguracionTab.tsx - 649 líneas)                  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  ModulosAndFeaturesSection:                                       │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  1. Obtiene árbol con useModulesTree()                           │  │
│  │  2. Agrupa módulos por categoría (useMemo)                       │  │
│  │  3. Renderiza por categoría:                                     │  │
│  │     • Header de categoría con color                              │  │
│  │     • FeatureToggleGrid con módulos                              │  │
│  │     • Tabs expandibles por módulo                                │  │
│  │     • Secciones anidadas (ml-8)                                  │  │
│  │                                                                    │  │
│  │  4. Usa FeatureToggleCard del Design System                      │  │
│  │     • Layout "card" para módulos (grid)                          │  │
│  │     • Layout "row" para tabs y secciones                         │  │
│  │                                                                    │  │
│  │  5. RBAC Integration:                                             │  │
│  │     • canEditModules = canDo(MODULOS, 'edit')                    │  │
│  │     • Deshabilita switches si no tiene permiso                   │  │
│  │                                                                    │  │
│  │  6. Prevención de desactivación:                                 │  │
│  │     • disabled={is_core || !canEdit || isPending || !parent}     │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ DESIGN SYSTEM (components/common/)                                │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  FeatureToggleCard:                                               │  │
│  │  • Layout "card" vs "row"                                         │  │
│  │  • 10 colores predefinidos (Tailwind estático)                   │  │
│  │  • Switch del Design System                                       │  │
│  │  • Soporte para badges (Core, Lock)                              │  │
│  │                                                                    │  │
│  │  FeatureToggleGrid:                                               │  │
│  │  • Responsive: 1/2/3 columnas                                     │  │
│  │  • gap-4 consistente                                              │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 ANÁLISIS DETALLADO POR COMPONENTE

### 2.1 BACKEND - MODELOS

**Archivo**: `backend/apps/core/models/models_system_modules.py` (522 líneas)

#### SystemModule (Líneas 13-200)

```python
class SystemModule(models.Model):
    CATEGORY_CHOICES = [
        ('ESTRATEGICO', 'Nivel Estrategico'),
        ('MOTOR', 'Motores del Sistema'),
        ('INTEGRAL', 'Gestion Integral'),
        ('MISIONAL', 'Nivel Misional'),
        ('APOYO', 'Nivel de Apoyo'),
        ('INTELIGENCIA', 'Inteligencia de Negocio'),
    ]

    CATEGORY_DEFAULT_COLORS = {
        'ESTRATEGICO': 'purple',
        'MOTOR': 'teal',
        'INTEGRAL': 'orange',
        'MISIONAL': 'blue',
        'APOYO': 'green',
        'INTELIGENCIA': 'purple',
    }

    # Campos clave
    code = CharField(unique=True, db_index=True)  # ej: "gestion_estrategica"
    name = CharField(max_length=100)              # ej: "Dirección Estratégica"
    category = CharField(choices=CATEGORY_CHOICES, db_index=True)
    color = CharField(choices=COLOR_CHOICES, blank=True)
    is_core = BooleanField(default=False)         # No puede desactivarse
    is_enabled = BooleanField(default=True, db_index=True)
    dependencies = ManyToManyField('self', symmetrical=False)
```

**Métodos Críticos**:

| Método | Línea | Función | Validaciones |
|--------|-------|---------|--------------|
| `can_disable()` | 149-160 | Valida si se puede desactivar | • is_core = False<br>• No tiene dependents activos |
| `enable()` | 162-170 | Activa en cascada | • Activa dependencies primero<br>• Luego se activa a sí mismo |
| `disable()` | 172-178 | Desactiva con validación | • Llama can_disable()<br>• Raise ValidationError si no puede |
| `get_effective_color()` | 192-199 | Color para UI | • Usa self.color o default de categoría |

**✅ Fortalezas**:
- Validación robusta de dependencias
- Activación en cascada automática
- Prevención de desactivación de módulos core

**⚠️ Debilidades**:
- No hay método `cascade_disable()` (solo valida, no desactiva dependents automáticamente)

#### ModuleTab (Líneas 202-317)

```python
class ModuleTab(models.Model):
    module = ForeignKey(SystemModule, on_delete=CASCADE, related_name='tabs')
    code = CharField(max_length=50, db_index=True)
    name = CharField(max_length=100)
    is_enabled = BooleanField(default=True, db_index=True)
    is_core = BooleanField(default=False)
    orden = PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['module', 'code']]  # ✅ Evita duplicados
```

**Índices**:
- `['module', 'is_enabled']` → Consultas rápidas de tabs habilitados por módulo
- `['code']` → Búsqueda por código

#### TabSection (Líneas 319-430)

```python
class TabSection(models.Model):
    tab = ForeignKey(ModuleTab, on_delete=CASCADE, related_name='sections')
    code = CharField(max_length=50, db_index=True)
    name = CharField(max_length=100)
    supported_actions = JSONField(default=list)  # ✅ Acciones personalizadas

    class Meta:
        unique_together = [['tab', 'code']]
```

**supported_actions** permite extensiones como `["enviar", "aprobar", "firmar"]` más allá de CRUD.

---

### 2.2 BACKEND - VIEWSETS

**Archivo**: `backend/apps/core/viewsets_config.py` (604 líneas)

#### SystemModuleViewSet

**Endpoints Standard**:
| Método | Endpoint | Permisos | Función |
|--------|----------|----------|---------|
| GET | `/api/core/system-modules/` | GranularActionPermission | Lista módulos |
| POST | `/api/core/system-modules/` | GranularActionPermission | Crear módulo |
| PATCH | `/api/core/system-modules/{id}/toggle/` | GranularActionPermission (edit) | Toggle on/off |

**⭐ Endpoints Especiales** (Líneas 164-350):

##### `/tree/` - Árbol Completo con RBAC (Líneas 164-284)

```python
@action(detail=False, methods=['get'])
def tree(self, request):
    """
    RBAC v3.3: Retorna árbol filtrado según permisos del usuario
    """
    user = request.user

    # Super usuario ve todo
    if user.is_superuser:
        return self._get_full_tree()

    # Usuario normal: filtrar por CargoSectionAccess
    cargo = getattr(user, 'cargo', None)
    if not cargo:
        return Response({'modules': [], ...})

    # Obtener section_ids autorizados
    authorized_section_ids = set(
        CargoSectionAccess.objects.filter(cargo=cargo)
        .values_list('section_id', flat=True)
    )

    return self._get_filtered_tree(authorized_section_ids)
```

**Algoritmo de Filtrado** (Líneas 230-284):

```python
def _get_filtered_tree(self, authorized_section_ids):
    # 1. Obtener tabs que contienen secciones autorizadas
    authorized_tab_ids = set(
        TabSection.objects.filter(id__in=authorized_section_ids)
        .values_list('tab_id', flat=True)
    )

    # 2. Obtener módulos que contienen tabs autorizados
    authorized_module_ids = set(
        ModuleTab.objects.filter(id__in=authorized_tab_ids)
        .values_list('module_id', flat=True)
    )

    # 3. Cargar módulos con prefetch filtrado
    modules = SystemModule.objects.filter(
        id__in=authorized_module_ids
    ).prefetch_related(
        Prefetch('tabs', queryset=ModuleTab.objects.filter(...)),
        Prefetch('tabs__sections', queryset=TabSection.objects.filter(...))
    )
```

**✅ Fortaleza CRÍTICA**: Filtrado granular a nivel de sección, no solo módulo.

##### `/sidebar/` - Navegación Lateral (Líneas 286-350)

Similar a `/tree/` pero:
- Solo módulos **habilitados** (`is_enabled=True`)
- Formato compacto (sin conteos, sin metadata extra)
- Optimizado para renderizado de navegación

**Permisos Personalizados** (Líneas 75-87):

```python
def get_permissions(self):
    if self.action in ['sidebar', 'tree', 'categories', 'enabled']:
        return [IsAuthenticated()]  # ✅ Cualquier usuario autenticado
    return super().get_permissions()  # GranularActionPermission
```

**Razón**: `/tree/` y `/sidebar/` filtran internamente según RBAC. No deben requerir permisos de "configuración de módulos" porque eso bloquearía a usuarios normales.

---

### 2.3 FRONTEND - HOOKS

**Archivo**: `frontend/src/features/gestion-estrategica/hooks/useModules.ts` (502 líneas)

#### Query Keys (Líneas 22-29)

```typescript
export const modulesKeys = {
  all: ['modules'] as const,
  tree: () => [...modulesKeys.all, 'tree'] as const,
  sidebar: () => [...modulesKeys.all, 'sidebar'] as const,
  detail: (id: number) => [...modulesKeys.all, 'detail', id] as const,
  tabs: (moduleId: number) => [...modulesKeys.all, moduleId, 'tabs'] as const,
  sections: (tabId: number) => [...modulesKeys.all, 'tabs', tabId, 'sections'] as const,
};
```

**✅ Fortaleza**: Query keys bien estructuradas para invalidación granular.

#### useModulesTree (Líneas 109-116)

```typescript
export function useModulesTree() {
  return useQuery({
    queryKey: modulesKeys.tree(),
    queryFn: modulesApi.getTree,
    staleTime: 5 * 60 * 1000, // ✅ 5 minutos - evita refetch excesivo
    retry: 2,
  });
}
```

**Uso**: ConfiguracionTab para mostrar todos los módulos/tabs/secciones.

#### useToggleModule (Líneas 158-189)

```typescript
export function useToggleModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isEnabled }) => modulesApi.toggleModule(id, isEnabled),
    onSuccess: (response) => {
      // ✅ Invalidación en cascada
      queryClient.invalidateQueries({ queryKey: modulesKeys.tree() });
      queryClient.invalidateQueries({ queryKey: modulesKeys.sidebar() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('modulos') });

      // ✅ Toast con elementos afectados
      if (response.affected_items && Object.keys(response.affected_items).length > 0) {
        const affectedCount = [...].reduce((sum, count) => sum + count, 0);
        toast.success(`${response.message} (${affectedCount} elementos afectados)`);
      }
    },
  });
}
```

**✅ Fortalezas**:
- Invalidación de tree + sidebar + stats
- Toast informativo con conteo de afectados
- Manejo de errores

**Replica para**:
- `useToggleTab()` (Líneas 207-230)
- `useToggleSection()` (Líneas 248-266)

#### Helper Hooks Útiles

| Hook | Líneas | Uso |
|------|--------|-----|
| `useModuleEnabled(code)` | 288-302 | Verificar si módulo está habilitado |
| `useTabEnabled(moduleCode, tabCode)` | 319-334 | Verificar módulo + tab |
| `useSectionEnabled(...)` | 352-368 | Verificar módulo + tab + sección |
| `useTabSections(moduleCode, tabCode)` | 385-411 | **Obtener secciones para Header** |
| `useModulesStats()` | 460-502 | Estadísticas agregadas |

---

### 2.4 FRONTEND - COMPONENTES

**Archivo**: `frontend/src/features/gestion-estrategica/components/ConfiguracionTab.tsx` (649 líneas)

#### ModulosAndFeaturesSection (Líneas 354-541)

**Estructura**:

```typescript
const ModulosAndFeaturesSection = () => {
  const { canDo } = usePermissions();
  const { data: tree, isLoading } = useModulesTree();
  const toggleModule = useToggleModule();
  const toggleTab = useToggleTab();
  const toggleSection = useToggleSection();

  // ✅ RBAC
  const canEditModules = canDo(Modules.GESTION_ESTRATEGICA, Sections.MODULOS, 'edit');

  // ✅ Agrupación por categoría (optimizada con useMemo)
  const modulesByCategory = useMemo(() => {
    if (!tree) return {};
    return tree.modules.reduce((acc, module) => {
      const cat = module.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(module);
      return acc;
    }, {} as Record<string, SystemModuleTree[]>);
  }, [tree]);

  return (
    <div className="space-y-6">
      {/* Alerta informativa */}
      <Alert variant="info" message="Los módulos controlan..." />

      {/* Renderizar por categoría */}
      {Object.entries(modulesByCategory).map(([category, modules]) => (
        <Card key={category}>
          {/* Header de categoría con color */}
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5" color={categoryColor} />
            <h3>{CATEGORY_LABELS[category]}</h3>
          </div>

          {/* Grid de módulos */}
          <FeatureToggleGrid columns={3}>
            {modules.map(module => (
              <FeatureToggleCard
                icon={getIconComponent(module.icon)}
                title={module.name}
                description={module.description}
                checked={module.is_enabled}
                onChange={() => toggleModule.mutate({...})}
                color={module.color || categoryColor}
                disabled={!canEditModules || module.is_core || isPending}
              />
            ))}
          </FeatureToggleGrid>

          {/* Tabs expandibles */}
          {modules.map(module => (
            <div key={`tabs-${module.id}`}>
              <h4>Tabs de {module.name}</h4>
              {module.tabs.map(tab => (
                <FeatureToggleCard
                  layout="row"  {/* ✅ Horizontal */}
                  {...}
                  disabled={!canEditModules || !module.is_enabled}
                />

                {/* Secciones anidadas (ml-8) */}
                {tab.sections.map(section => (
                  <FeatureToggleCard
                    layout="row"
                    disabled={!canEditModules || !tab.is_enabled}
                  />
                ))}
              ))}
            </div>
          ))}
        </Card>
      ))}

      {/* UI Settings Card */}
      <UISettingsCard />
    </div>
  );
};
```

**Lógica de Deshabilitación en Cascada**:

```typescript
// Módulo
disabled={!canEditModules || module.is_core || isPending}

// Tab
disabled={!canEditModules || tab.is_core || isPending || !module.is_enabled}
                                                           ^^^^^^^^^^^^^^^^
// Sección
disabled={!canEditModules || section.is_core || isPending || !tab.is_enabled}
                                                              ^^^^^^^^^^^^^^^
```

**✅ Fortaleza**: Lógica de cascada visual correcta.

#### Mapeo de Colores Estáticos (Líneas 60-126)

```typescript
const CATEGORY_STYLE_CLASSES: Record<ModuleColor, {...}> = {
  purple: {
    bgLight: 'bg-purple-100',
    bgDark: 'dark:bg-purple-900/30',
    textLight: 'text-purple-600',
    textDark: 'dark:text-purple-400',
  },
  // ... 9 colores más
};
```

**✅ CRÍTICO**: Clases **estáticas** de Tailwind. Si se usaran clases dinámicas (`bg-${color}-100`), se purgarían en producción.

---

### 2.5 DESIGN SYSTEM - FeatureToggleCard

**Archivo**: `frontend/src/components/common/FeatureToggleCard.tsx` (265 líneas)

#### Props Interface (Líneas 37-58)

```typescript
export interface FeatureToggleCardProps {
  icon: LucideIcon;
  title: ReactNode;  // ✅ Permite badges inline
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: FeatureToggleColor;
  disabled?: boolean;
  layout?: 'card' | 'row';  // ✅ Dual layout
  className?: string;
  children?: ReactNode;  // ✅ Badges externos
}
```

#### Layout "card" (Líneas 152-196)

```typescript
if (layout === 'card') {
  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all',
      checked ? colors.cardEnabled : disabledStyles.card
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Icono + Título */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg">
              <Icon className="h-4 w-4" />
            </div>
            <span>{title}</span>
            {children}  {/* ✅ Badges como "Core" */}
          </div>

          {/* Descripción */}
          <p className="text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Switch */}
        <Switch checked={checked} onChange={...} disabled={disabled} />
      </div>
    </div>
  );
}
```

#### Layout "row" (Líneas 199-234)

```typescript
return (
  <div className="flex items-center justify-between p-4 rounded-lg border">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5" />
      <div>
        <span>{title}</span>
        <p className="text-sm">{description}</p>
      </div>
      {children}
    </div>
    <Switch ... />
  </div>
);
```

**✅ Uso perfecto**:
- `card` para módulos (grids visuales)
- `row` para tabs/secciones (listas compactas)

---

## 🔗 INTEGRACIÓN CON RBAC v3.3

### Sistema de Permisos Granulares

**Tabla**: `core_cargo_section_access`

```sql
CREATE TABLE core_cargo_section_access (
  id SERIAL PRIMARY KEY,
  cargo_id INT REFERENCES configuracion_cargo(id),
  section_id INT REFERENCES core_tab_section(id),
  can_view BOOLEAN DEFAULT TRUE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  additional_permissions JSONB DEFAULT '{}',
  UNIQUE(cargo_id, section_id)
);
```

### Flujo de Autorización Completo

```
┌──────────────────────────────────────────────────────────────────┐
│ Usuario hace login                                                │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 1. Backend carga user.cargo                                       │
│ 2. Busca CargoSectionAccess.filter(cargo=user.cargo)             │
│ 3. Obtiene lista de section_ids autorizados                      │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ GET /api/core/system-modules/tree/                                │
│ ├─ Filtra tabs que tienen esas secciones                         │
│ ├─ Filtra módulos que tienen esos tabs                           │
│ └─ Retorna árbol filtrado                                        │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ GET /api/core/system-modules/sidebar/                             │
│ └─ Similar pero solo habilitados                                 │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ FRONTEND:                                                         │
│ • useModulesTree() recibe árbol filtrado                         │
│ • useSidebarModules() recibe navegación filtrada                 │
│ • usePermissions() valida acciones individuales                  │
│   └─ canDo(MODULOS, 'edit') → verifica CargoSectionAccess        │
└──────────────────────────────────────────────────────────────────┘
```

### Ejemplo Real de Uso RBAC en Componentes

**ConfiguracionTab.tsx** (Línea 361):

```typescript
const canEditModules = canDo(Modules.GESTION_ESTRATEGICA, Sections.MODULOS, 'edit');

// En el FeatureToggleCard:
<FeatureToggleCard
  disabled={!canEditModules || module.is_core || isPending}
/>
```

**Flujo interno de `canDo`**:

```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const user = useAuthStore(state => state.user);
  const cargo = user?.cargo;

  const canDo = (moduleCode: string, sectionCode: string, action: string) => {
    if (!cargo) return false;

    // Buscar CargoSectionAccess para este cargo + section
    const access = cargoSectionAccesses.find(
      a => a.cargo_id === cargo.id && a.section.code === sectionCode
    );

    if (!access) return false;

    // Verificar acción específica
    if (action === 'view') return access.can_view;
    if (action === 'create') return access.can_create;
    if (action === 'edit') return access.can_edit;
    if (action === 'delete') return access.can_delete;

    // Verificar additional_permissions
    return access.additional_permissions?.[action] ?? false;
  };

  return { canDo };
}
```

**✅ Integración PERFECTA**: El sistema de módulos respeta completamente RBAC v3.3.

---

## 📊 FLUJO DE ACTIVACIÓN/DESACTIVACIÓN

### Escenario 1: Activar Módulo

```
Usuario clickea switch de módulo "SST" (desactivado → activado)
│
├─ 1. FRONTEND (FeatureToggleCard)
│   ├─ onChange={() => toggleModule.mutate({id: 5, isEnabled: true})}
│   └─ Switch se deshabilita (isPending=true)
│
├─ 2. FRONTEND (useToggleModule)
│   ├─ mutationFn: modulesApi.toggleModule(5, true)
│   └─ PATCH /api/core/system-modules/5/toggle/ { is_enabled: true }
│
├─ 3. BACKEND (SystemModuleViewSet.toggle)
│   ├─ module = get_object()  # SystemModule.objects.get(pk=5)
│   ├─ is_enabled = request.data.get('is_enabled')  # True
│   ├─ module.enable()  # ✅ Activa dependencias en cascada
│   │   ├─ Busca module.dependencies.all()
│   │   ├─ Si dep.is_enabled=False → dep.is_enabled=True, dep.save()
│   │   └─ module.is_enabled=True, module.save()
│   └─ Response({'success': True, 'message': 'Módulo activado correctamente'})
│
├─ 4. FRONTEND (onSuccess)
│   ├─ queryClient.invalidateQueries({ queryKey: ['modules', 'tree'] })
│   ├─ queryClient.invalidateQueries({ queryKey: ['modules', 'sidebar'] })
│   ├─ queryClient.invalidateQueries({ queryKey: ['config-stats', 'modulos'] })
│   └─ toast.success('Módulo activado correctamente')
│
└─ 5. REACT QUERY REFETCH
    ├─ useModulesTree() se re-ejecuta
    ├─ useSidebarModules() se re-ejecuta
    ├─ ConfiguracionTab se re-renderiza con nuevo árbol
    └─ Sidebar se actualiza con módulo visible
```

### Escenario 2: Desactivar Módulo con Dependents

```
Usuario intenta desactivar módulo "Core" (activado → desactivado)
│
├─ 1-2. [Igual que Escenario 1]
│
├─ 3. BACKEND (SystemModuleViewSet.toggle)
│   ├─ module = get_object()  # SystemModule con code="core"
│   ├─ is_enabled = False
│   ├─ can_disable, reason = module.can_disable()
│   │   ├─ if module.is_core → return False, "Es módulo core"
│   │   ├─ dependents = module.dependents.filter(is_enabled=True)
│   │   ├─ if dependents.exists():
│   │   │   └─ return False, "Los siguientes módulos dependen: SST, PESV"
│   │   └─ return True, None
│   ├─ if not can_disable → Response 400 BAD REQUEST
│   └─ return {'error': 'Los siguientes módulos dependen: SST, PESV'}
│
├─ 4. FRONTEND (onError)
│   └─ toast.error('Los siguientes módulos dependen: SST, PESV')
│
└─ 5. UI
    └─ Switch vuelve a estado anterior (activado)
```

### Escenario 3: Activar Tab (con Módulo desactivado)

```
Usuario intenta activar tab "Incidentes" (módulo SST desactivado)
│
├─ FeatureToggleCard ya está disabled={!module.is_enabled}
└─ ❌ Switch no responde al click (visual feedback: cursor-not-allowed)
```

**✅ Prevención en Frontend**: No se hace request innecesario al backend.

---

## 🔄 SINCRONIZACIÓN CON BASE DE DATOS

### Estado Actual de Módulos en BD

**Query de Diagnóstico**:

```sql
-- Ver todos los módulos con conteo de tabs y secciones
SELECT
  m.code,
  m.name,
  m.category,
  m.is_enabled,
  m.is_core,
  COUNT(DISTINCT t.id) AS total_tabs,
  COUNT(DISTINCT CASE WHEN t.is_enabled THEN t.id END) AS enabled_tabs,
  COUNT(DISTINCT s.id) AS total_sections,
  COUNT(DISTINCT CASE WHEN s.is_enabled THEN s.id END) AS enabled_sections
FROM core_system_module m
LEFT JOIN core_module_tab t ON t.module_id = m.id
LEFT JOIN core_tab_section s ON s.tab_id = t.id
GROUP BY m.id
ORDER BY m.category, m.orden;
```

**Ejemplo de Resultado**:

| code | name | category | is_enabled | total_tabs | enabled_tabs | total_sections |
|------|------|----------|------------|------------|--------------|----------------|
| gestion_estrategica | Dirección Estratégica | ESTRATEGICO | ✅ | 4 | 4 | 12 |
| hseq | HSEQ | INTEGRAL | ✅ | 5 | 5 | 18 |
| supply_chain | Cadena de Suministro | MOTOR | ❌ | 3 | 0 | 9 |

### ¿Cómo se Registran Módulos Nuevos?

**⚠️ BRECHA CRÍTICA IDENTIFICADA**: No hay sistema automático de seeding/migración.

**Proceso Manual Actual**:

1. Crear módulo via Admin Django o API:
```python
# Via Admin o management command
module = SystemModule.objects.create(
    code='supply_chain',
    name='Cadena de Suministro',
    category='MOTOR',
    icon='Truck',
    is_core=False,
    is_enabled=True,
    orden=10
)

# Crear tabs
tab_compras = ModuleTab.objects.create(
    module=module,
    code='compras',
    name='Compras',
    icon='ShoppingCart',
    orden=1
)

# Crear secciones
TabSection.objects.create(
    tab=tab_compras,
    code='ordenes',
    name='Órdenes de Compra',
    icon='FileText',
    orden=1
)
```

**Problemas**:
- ❌ Propenso a errores humanos
- ❌ No hay versionado de la estructura
- ❌ Dificulta deploys automatizados
- ❌ Riesgo de inconsistencias entre entornos

---

## ⚠️ BRECHAS Y GAPS IDENTIFICADOS

### 🔴 CRÍTICO - P0

#### 1. No hay Sistema de Seeding/Migración Automatizado

**Problema**:
Cuando se crea un nuevo módulo en código (ej: nuevo feature `gestion_proyectos`), hay que:
1. Crear manualmente `SystemModule` en BD
2. Crear manualmente `ModuleTabs` asociados
3. Crear manualmente `TabSections` asociadas
4. Asignar permisos en `CargoSectionAccess` para cada cargo

**Impacto**:
- Deploys manuales propensos a errores
- Inconsistencias entre dev/staging/prod
- Onboarding lento de nuevos módulos

**Solución Recomendada**:

```python
# backend/apps/core/management/commands/seed_modules.py
from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab, TabSection

class Command(BaseCommand):
    help = 'Seed system modules structure'

    def handle(self, *args, **options):
        # Definición declarativa de módulos
        MODULES_STRUCTURE = {
            'gestion_estrategica': {
                'name': 'Dirección Estratégica',
                'category': 'ESTRATEGICO',
                'icon': 'Compass',
                'tabs': {
                    'identidad': {
                        'name': 'Identidad',
                        'sections': {
                            'mision_vision': {'name': 'Misión y Visión'},
                            'valores': {'name': 'Valores'},
                            'politicas': {'name': 'Políticas'},
                        }
                    },
                    'planeacion': {...},
                    'organizacion': {...},
                    'configuracion': {...},
                }
            },
            'hseq': {...},
            'supply_chain': {...},
        }

        for mod_code, mod_data in MODULES_STRUCTURE.items():
            module, created = SystemModule.objects.get_or_create(
                code=mod_code,
                defaults={
                    'name': mod_data['name'],
                    'category': mod_data['category'],
                    'icon': mod_data['icon'],
                }
            )

            for tab_code, tab_data in mod_data['tabs'].items():
                tab, _ = ModuleTab.objects.get_or_create(
                    module=module,
                    code=tab_code,
                    defaults={'name': tab_data['name']}
                )

                for sec_code, sec_data in tab_data['sections'].items():
                    TabSection.objects.get_or_create(
                        tab=tab,
                        code=sec_code,
                        defaults={'name': sec_data['name']}
                    )

        self.stdout.write('✅ Modules seeded successfully')
```

**Uso**:
```bash
python manage.py seed_modules
# En post_migrate signal o como parte del CI/CD
```

#### 2. Falta Validación de `section_code` en Frontend vs BD

**Problema**:
El mapping de secciones en `ConfiguracionTab.tsx` es **hardcoded**:

```typescript
// ConfiguracionTab.tsx línea 619
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
  sedes: SedesSection,
  integraciones: IntegracionesSection,
  branding: BrandingSection,
  modulos: ModulosAndFeaturesSection,
};
```

Si se crea una nueva sección en BD (ej: `consecutivos`), pero no se agrega aquí, **no se renderiza**.

**Impacto**:
- Sections dinámicas en BD no se muestran automáticamente
- Require deploy de frontend para cada nueva sección

**Solución Propuesta**:

```typescript
// Opción 1: Componente genérico de fallback
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
  sedes: SedesSection,
  // ...
  __default__: GenericSectionRenderer,  // ✅ Fallback dinámico
};

// Opción 2: Sistema de plugins (más avanzado)
const sectionRegistry = new SectionRegistry();
sectionRegistry.register('empresa', EmpresaSection);
// Permite registrar secciones desde diferentes módulos
```

### 🟡 MEDIO - P1

#### 3. No hay Feedback Visual de Dependencias

**Problema**:
Cuando se desactiva un módulo, no se muestra qué otros módulos se desactivarán en cascada.

**Solución**:
- Modal de confirmación con lista de elementos afectados
- Resaltado visual de dependencias en el árbol

#### 4. Falta Historial de Cambios

**Problema**:
No se registra quién activó/desactivó módulos ni cuándo.

**Solución**:
```python
class ModuleActivityLog(models.Model):
    module = ForeignKey(SystemModule)
    action = CharField(choices=[('ENABLE', 'Activado'), ('DISABLE', 'Desactivado')])
    user = ForeignKey(User)
    timestamp = DateTimeField(auto_now_add=True)
    affected_items = JSONField()  # Tabs/Sections afectadas
```

#### 5. No hay Búsqueda en Módulos

**Problema**:
Si hay 50+ módulos, no hay forma de buscar rápidamente.

**Solución**:
- SearchBar arriba del `ModulosAndFeaturesSection`
- Filtra por nombre/categoría/código

### 🟢 BAJO - P2

#### 6. Falta Modo "Ver Solo Habilitados"

**Problema**:
Siempre se muestran todos los módulos (habilitados + deshabilitados).

**Solución**:
- Toggle "Mostrar solo habilitados"
- Útil para administradores

---

## 📖 GUÍA PARA DESARROLLADORES

### Cómo Agregar un Nuevo Módulo

#### Paso 1: Definir Estructura en BD

**Opción A - Admin Django**:
1. Ir a `/admin/core/systemmodule/add/`
2. Llenar:
   - Code: `gestion_proyectos`
   - Name: `Gestión de Proyectos`
   - Category: `MOTOR`
   - Icon: `Folders`

**Opción B - Management Command** (Recomendado):

```python
# backend/apps/core/management/commands/add_module_proyectos.py
from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab, TabSection

class Command(BaseCommand):
    def handle(self, *args, **options):
        module, created = SystemModule.objects.get_or_create(
            code='gestion_proyectos',
            defaults={
                'name': 'Gestión de Proyectos',
                'category': 'MOTOR',
                'icon': 'Folders',
                'is_core': False,
                'orden': 15,
            }
        )

        portafolio_tab, _ = ModuleTab.objects.get_or_create(
            module=module,
            code='portafolio',
            defaults={'name': 'Portafolio', 'orden': 1}
        )

        TabSection.objects.get_or_create(
            tab=portafolio_tab,
            code='proyectos_activos',
            defaults={'name': 'Proyectos Activos', 'orden': 1}
        )
```

#### Paso 2: Crear Componentes Frontend

```typescript
// frontend/src/features/gestion-proyectos/components/ProyectosActivosSection.tsx
export const ProyectosActivosSection = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_PROYECTOS, Sections.PROYECTOS_ACTIVOS, 'create');

  return (
    <div>
      <h2>Proyectos Activos</h2>
      {/* ... */}
    </div>
  );
};
```

#### Paso 3: Registrar en `constants/permissions.ts`

```typescript
export const Modules = {
  // ...
  GESTION_PROYECTOS: 'gestion_proyectos',
} as const;

export const Sections = {
  // ...
  PROYECTOS_ACTIVOS: 'proyectos_activos',
} as const;
```

#### Paso 4: Registrar en ConfiguracionTab (si es subsección de Configuración)

Si el nuevo módulo tiene una sección en Configuración:

```typescript
// ConfiguracionTab.tsx
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  // ...
  proyectos: ProyectosConfigSection,  // ✅ Mapeo por section.code
};
```

#### Paso 5: Asignar Permisos a Cargos

```sql
-- Via Admin o script
INSERT INTO core_cargo_section_access (cargo_id, section_id, can_view, can_create, can_edit, can_delete)
SELECT
  c.id AS cargo_id,
  s.id AS section_id,
  true AS can_view,
  (c.nivel_acceso >= 3) AS can_create,  -- Ejemplo: nivel 3+ puede crear
  (c.nivel_acceso >= 3) AS can_edit,
  (c.nivel_acceso >= 4) AS can_delete
FROM configuracion_cargo c
CROSS JOIN core_tab_section s
WHERE s.code = 'proyectos_activos';
```

#### Paso 6: Verificar

1. **Árbol dinámico**: `/gestion-estrategica/configuracion` → Tab "Módulos"
   - Debería aparecer el nuevo módulo en la categoría correspondiente
2. **Sidebar**: Debería aparecer si está `is_enabled=true`
3. **RBAC**: Usuarios con cargo autorizado deberían verlo

---

## 🎯 VALIDACIÓN RBAC - Ejemplos Reales

### Ejemplo 1: Usuario Coordinador SST

**Cargo**: Coordinador SST
**Permisos**:
```sql
SELECT s.code, csa.can_view, csa.can_edit
FROM core_cargo_section_access csa
JOIN core_tab_section s ON s.id = csa.section_id
WHERE csa.cargo_id = 5;  -- Coordinador SST
```

**Resultado**:
| section_code | can_view | can_edit |
|--------------|----------|----------|
| incidentes | ✅ | ✅ |
| inspecciones | ✅ | ✅ |
| capacitaciones | ✅ | ✅ |
| modulos | ✅ | ❌ |  ← No puede editar configuración

**Árbol Filtrado** (`GET /api/core/system-modules/tree/`):
```json
{
  "modules": [
    {
      "code": "hseq",
      "name": "HSEQ",
      "tabs": [
        {
          "code": "sst",
          "name": "SST",
          "sections": [
            {"code": "incidentes", "name": "Incidentes"},
            {"code": "inspecciones", "name": "Inspecciones"},
            {"code": "capacitaciones", "name": "Capacitaciones"}
          ]
        }
      ]
    },
    {
      "code": "gestion_estrategica",
      "name": "Dirección Estratégica",
      "tabs": [
        {
          "code": "configuracion",
          "name": "Configuración",
          "sections": [
            {"code": "modulos", "name": "Módulos"}  // ✅ Visible pero read-only
          ]
        }
      ]
    }
  ]
}
```

**UI Behavior**:
- En ConfiguracionTab → Sección "Módulos":
  - `canEditModules = false` → Todos los switches están deshabilitados
  - Puede VER el estado de módulos pero no cambiarlos

### Ejemplo 2: Usuario Trabajador

**Cargo**: Trabajador
**Permisos**: Solo `can_view=true` en secciones operativas

**Árbol Filtrado**:
```json
{
  "modules": []  // ❌ No tiene acceso a ninguna configuración
}
```

**Sidebar**:
```json
[
  {
    "code": "hseq",
    "name": "HSEQ",
    "children": [
      {"code": "reportar_incidente", "name": "Reportar Incidente"}
    ]
  }
]
```

---

## 📈 ESTADÍSTICAS Y MÉTRICAS

### useModulesStats() Output

```typescript
const { stats } = useModulesStats();

console.log(stats);
// {
//   totalModules: 12,
//   enabledModules: 10,
//   disabledModules: 2,
//   moduleEnableRate: 83.33,
//   totalTabs: 48,
//   enabledTabs: 42,
//   disabledTabs: 6,
//   tabEnableRate: 87.5,
//   totalSections: 156,
//   enabledSections: 142,
//   disabledSections: 14,
//   sectionEnableRate: 91.03
// }
```

### StatsGrid en ConfiguracionPage

```typescript
// ConfiguracionPage.tsx usa useConfiguracionStats('modulos')
const statsItems = [
  {
    label: 'Módulos Activos',
    value: '10/12',
    icon: Package,
    iconColor: 'info',
  },
  {
    label: 'Tabs Activos',
    value: '42/48',
    icon: Layers,
    iconColor: 'success',
  },
  {
    label: 'Secciones Activas',
    value: '142/156',
    icon: Grid3X3,
    iconColor: 'warning',
  },
];
```

---

## 🔧 MANTENIMIENTO Y TROUBLESHOOTING

### Problema: "Módulo no aparece en Configuración"

**Diagnóstico**:

1. Verificar en BD:
```sql
SELECT * FROM core_system_module WHERE code = 'mi_modulo';
-- ¿Existe? ¿is_enabled=true?
```

2. Verificar árbol API:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/core/system-modules/tree/ | jq '.modules[] | select(.code=="mi_modulo")'
```

3. Verificar caché frontend:
```javascript
// En DevTools Console
localStorage.clear();
window.location.reload();
```

### Problema: "Switch no responde"

**Checklist**:
- [ ] `canEditModules` es `true`?
- [ ] Módulo no es `is_core=true`?
- [ ] Módulo padre está habilitado? (para tabs/sections)
- [ ] No hay mutation `isPending`?

**Debug**:
```typescript
// En ConfiguracionTab.tsx, agregar console.log
const canEditModules = canDo(Modules.GESTION_ESTRATEGICA, Sections.MODULOS, 'edit');
console.log('🔐 canEditModules:', canEditModules);
console.log('⚙️ module:', module);
console.log('🚫 disabled:', !canEditModules || module.is_core || isPending);
```

### Problema: "Error 400 al desactivar módulo"

**Mensaje típico**: "Los siguientes módulos dependen de este: SST, PESV"

**Solución**:
1. Identificar dependents:
```sql
SELECT m2.name
FROM core_system_module m1
JOIN core_system_module_dependencies md ON md.from_systemmodule_id = m1.id
JOIN core_system_module m2 ON m2.id = md.to_systemmodule_id
WHERE m1.code = 'core' AND m2.is_enabled = true;
```

2. Desactivar dependents primero (en orden inverso de dependencia)
3. Luego desactivar el módulo original

---

## 📊 DIAGRAMAS ADICIONALES

### Diagrama de Clases (Backend)

```
┌──────────────────────┐
│   SystemModule       │
├──────────────────────┤
│ + code: str (unique) │
│ + name: str          │
│ + category: str      │
│ + is_core: bool      │
│ + is_enabled: bool   │
│ + dependencies: M2M  │────────┐
├──────────────────────┤        │
│ + can_disable()      │        │ M2M (self)
│ + enable()           │        │
│ + disable()          │        │
└──────────┬───────────┘        │
           │ 1                  │
           │ has many           │
           ▼ *                  │
┌──────────────────────┐        │
│   ModuleTab          │        │
├──────────────────────┤        │
│ + code: str          │        │
│ + name: str          │        │
│ + module: FK         │────────┘
│ + is_enabled: bool   │
├──────────────────────┤
│ + can_disable()      │
│ + enable()           │
└──────────┬───────────┘
           │ 1
           │ has many
           ▼ *
┌──────────────────────┐        ┌──────────────────────┐
│   TabSection         │        │ CargoSectionAccess   │
├──────────────────────┤        ├──────────────────────┤
│ + code: str          │◄───────┤ + section: FK        │
│ + name: str          │  1   * │ + cargo: FK          │
│ + tab: FK            │────────┤ + can_view: bool     │
│ + is_enabled: bool   │        │ + can_create: bool   │
│ + supported_actions: │        │ + can_edit: bool     │
│   JSONField          │        │ + can_delete: bool   │
└──────────────────────┘        └──────────────────────┘
```

### Diagrama de Secuencia - Toggle Módulo

```
Usuario    Frontend         React Query      Backend         Database
  │            │                 │              │                │
  │  Click     │                 │              │                │
  │  Switch    │                 │              │                │
  ├───────────>│                 │              │                │
  │            │ mutate({        │              │                │
  │            │   id: 5,        │              │                │
  │            │   isEnabled:    │              │                │
  │            │   true          │              │                │
  │            │ })              │              │                │
  │            ├────────────────>│              │                │
  │            │                 │ PATCH        │                │
  │            │                 │ /toggle/     │                │
  │            │                 ├─────────────>│                │
  │            │                 │              │ get_object()   │
  │            │                 │              ├───────────────>│
  │            │                 │              │<───────────────┤
  │            │                 │              │ enable()       │
  │            │                 │              │ (activa deps)  │
  │            │                 │              ├───────────────>│
  │            │                 │              │<───────────────┤
  │            │                 │              │ save()         │
  │            │                 │              ├───────────────>│
  │            │                 │              │<───────────────┤
  │            │                 │ Response     │                │
  │            │                 │ {success:    │                │
  │            │                 │  true}       │                │
  │            │                 │<─────────────┤                │
  │            │ onSuccess       │              │                │
  │            │<────────────────┤              │                │
  │            │ invalidate      │              │                │
  │            │ queries         │              │                │
  │            ├────────────────>│              │                │
  │            │                 │ refetch      │                │
  │            │                 │ /tree/       │                │
  │            │                 ├─────────────>│                │
  │            │                 │              │ query DB       │
  │            │                 │              ├───────────────>│
  │            │                 │              │<───────────────┤
  │            │                 │<─────────────┤                │
  │            │ re-render       │              │                │
  │            │<────────────────┤              │                │
  │  Toast     │                 │              │                │
  │  Success   │                 │              │                │
  │<───────────┤                 │              │                │
```

---

## ✅ CONCLUSIONES Y RECOMENDACIONES

### Lo Bueno ✅

1. **Arquitectura Sólida**: Sistema de 3 niveles (Módulo → Tab → Sección) bien diseñado
2. **Integración RBAC Perfecta**: Filtrado granular en backend usando `CargoSectionAccess`
3. **React Query Optimizado**: Cache, invalidación y optimistic updates bien implementados
4. **Design System Consistente**: `FeatureToggleCard` reutilizable y responsive
5. **Validación de Dependencias**: `can_disable()` previene desactivaciones conflictivas
6. **Cascada de Activación**: `enable()` activa dependencias automáticamente

### Lo Malo ⚠️

1. **🔴 P0**: No hay sistema de seeding/migración para nuevos módulos
2. **🔴 P0**: Mapping hardcoded de `section_code` → Componente
3. **🟡 P1**: Falta feedback visual de dependencias antes de toggle
4. **🟡 P1**: No hay historial de cambios (audit log)
5. **🟡 P1**: No hay búsqueda en lista de módulos
6. **🟢 P2**: Falta modo "Ver solo habilitados"

### Recomendaciones Inmediatas

#### 1. Implementar Sistema de Seeding (2-3 días)

```python
# management/commands/seed_modules.py
MODULES_STRUCTURE = {
    'gestion_estrategica': {...},
    'hseq': {...},
    # Definición declarativa de TODA la estructura
}
```

**Beneficios**:
- Deploys automatizados
- Consistencia entre entornos
- Versionado de estructura

#### 2. Crear Componente Genérico de Fallback (1 día)

```typescript
// components/GenericSectionRenderer.tsx
export const GenericSectionRenderer = ({ sectionCode }: { sectionCode: string }) => {
  return (
    <EmptyState
      icon={Construction}
      title={`Sección "${sectionCode}" en construcción`}
      description="Esta sección está registrada pero aún no tiene componente asociado."
    />
  );
};
```

#### 3. Agregar Modal de Confirmación con Impacto (2 días)

```typescript
const handleToggle = (module: SystemModule, newState: boolean) => {
  if (!newState) {
    // Desactivando - mostrar impacto
    const affected = calculateAffectedItems(module);

    confirmDialog({
      title: 'Desactivar Módulo',
      message: `Se desactivarán:
        - ${affected.tabs.length} tabs
        - ${affected.sections.length} secciones
        ¿Continuar?`,
      onConfirm: () => toggleModule.mutate({...})
    });
  } else {
    toggleModule.mutate({...});
  }
};
```

### Roadmap Sugerido

**Sprint 1** (1 semana):
- [ ] Implementar `seed_modules.py`
- [ ] Crear script de migración para estructura actual
- [ ] Documentar proceso de agregar módulos

**Sprint 2** (1 semana):
- [ ] Componente `GenericSectionRenderer`
- [ ] Modal de confirmación con impacto
- [ ] Búsqueda en ModulosAndFeaturesSection

**Sprint 3** (1 semana):
- [ ] Sistema de audit log (`ModuleActivityLog`)
- [ ] Exportar/Importar configuración de módulos
- [ ] Dashboard de uso de módulos

---

## 📚 ANEXOS

### Anexo A: Endpoints Completos

```
SystemModuleViewSet:
├─ GET    /api/core/system-modules/
├─ POST   /api/core/system-modules/
├─ GET    /api/core/system-modules/{id}/
├─ PATCH  /api/core/system-modules/{id}/
├─ DELETE /api/core/system-modules/{id}/
├─ PATCH  /api/core/system-modules/{id}/toggle/
├─ GET    /api/core/system-modules/tree/          ⭐
├─ GET    /api/core/system-modules/sidebar/       ⭐
├─ GET    /api/core/system-modules/categories/
└─ GET    /api/core/system-modules/enabled/

ModuleTabViewSet:
├─ GET    /api/core/module-tabs/
├─ POST   /api/core/module-tabs/
├─ PATCH  /api/core/module-tabs/{id}/toggle/
└─ DELETE /api/core/module-tabs/{id}/

TabSectionViewSet:
├─ GET    /api/core/tab-sections/
├─ POST   /api/core/tab-sections/
├─ PATCH  /api/core/tab-sections/{id}/toggle/
└─ DELETE /api/core/tab-sections/{id}/
```

### Anexo B: TypeScript Types Completos

```typescript
// frontend/src/features/gestion-estrategica/types/modules.types.ts

export interface SystemModuleTree {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: ModuleColor;
  category: ModuleCategory;
  route?: string;
  order: number;
  is_enabled: boolean;
  is_core: boolean;
  requires_license: boolean;
  license_expires_at?: string;
  tabs: ModuleTab[];
  enabled_tabs_count: number;
  total_tabs_count: number;
  dependencies?: number[];
  dependents?: number[];
}

export interface ModuleTab {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  is_enabled: boolean;
  is_core: boolean;
  sections: TabSection[];
  enabled_sections_count: number;
  total_sections_count: number;
}

export interface TabSection {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  is_enabled: boolean;
  is_core: boolean;
  supported_actions?: string[];
}

export interface ToggleResponse {
  success: boolean;
  message: string;
  affected_items?: {
    modules?: string[];
    tabs?: string[];
    sections?: string[];
  };
}
```

### Anexo C: Queries SQL Útiles

```sql
-- 1. Ver estructura completa de un módulo
SELECT
  m.code AS module_code,
  m.name AS module_name,
  t.code AS tab_code,
  t.name AS tab_name,
  s.code AS section_code,
  s.name AS section_name,
  s.is_enabled
FROM core_system_module m
LEFT JOIN core_module_tab t ON t.module_id = m.id
LEFT JOIN core_tab_section s ON s.tab_id = t.id
WHERE m.code = 'gestion_estrategica'
ORDER BY t.orden, s.orden;

-- 2. Identificar módulos sin tabs
SELECT
  m.code,
  m.name,
  COUNT(t.id) AS tab_count
FROM core_system_module m
LEFT JOIN core_module_tab t ON t.module_id = m.id
GROUP BY m.id
HAVING COUNT(t.id) = 0;

-- 3. Ver permisos de un cargo sobre secciones
SELECT
  m.name AS module,
  t.name AS tab,
  s.name AS section,
  csa.can_view,
  csa.can_create,
  csa.can_edit,
  csa.can_delete
FROM core_cargo_section_access csa
JOIN core_tab_section s ON s.id = csa.section_id
JOIN core_module_tab t ON t.id = s.tab_id
JOIN core_system_module m ON m.id = t.module_id
WHERE csa.cargo_id = 5  -- Coordinador SST
ORDER BY m.orden, t.orden, s.orden;

-- 4. Identificar dependencias circulares (riesgo)
WITH RECURSIVE deps AS (
  SELECT
    from_systemmodule_id AS origin,
    to_systemmodule_id AS current,
    ARRAY[from_systemmodule_id, to_systemmodule_id] AS path
  FROM core_system_module_dependencies

  UNION ALL

  SELECT
    d.origin,
    md.to_systemmodule_id,
    d.path || md.to_systemmodule_id
  FROM deps d
  JOIN core_system_module_dependencies md ON md.from_systemmodule_id = d.current
  WHERE NOT md.to_systemmodule_id = ANY(d.path)
)
SELECT * FROM deps WHERE current = origin;  -- Ciclos detectados
```

---

**FIN DEL DOCUMENTO**

---

**Metadatos**:
- **Versión**: 1.0
- **Fecha**: 2026-01-18
- **Líneas Analizadas**: 2,277
- **Archivos Revisados**: 15+
- **Nivel de Detalle**: Exhaustivo
- **Tiempo de Análisis**: ~2 horas

**Aprobado para**: Arquitectura, Desarrollo, QA, DevOps
