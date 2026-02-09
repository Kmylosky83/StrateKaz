# Sistema de Navegación Dinámica

El sistema implementa una navegación completamente dinámica cargada desde la base de datos, permitiendo control granular sobre módulos, tabs y secciones.

## Arquitectura de 3 Niveles

```
SystemModule (Módulo)
  └── ModuleTab (Tab/Pestaña)
        └── TabSection (Sección/Sub-navegación)
```

### Ejemplo Práctico

```
Dirección Estratégica (SystemModule)
  ├── Configuración (ModuleTab)
  │     ├── Empresa (TabSection)
  │     ├── Branding (TabSection)
  │     └── Integraciones (TabSection)
  ├── Organización (ModuleTab)
  │     ├── Áreas (TabSection)
  │     ├── Cargos (TabSection)
  │     └── Organigrama (TabSection)
  └── Identidad (ModuleTab)
        ├── Misión/Visión (TabSection)
        └── Valores (TabSection)
```

---

## Características

| Característica | Descripción |
|----------------|-------------|
| **Sin hardcoding** | Toda la navegación viene de la API |
| **Control granular** | Activar/desactivar módulos, tabs y secciones individualmente |
| **Iconos dinámicos** | Iconos de Lucide React cargados por nombre desde BD |
| **Colores por módulo** | Cada módulo tiene su color de macroproceso |
| **Tiempo real** | Cambios en configuración se reflejan inmediatamente |
| **Permisos integrados** | Solo muestra elementos para los que el usuario tiene permiso |

---

## Modelos de Base de Datos

### SystemModule

```python
class SystemModule(models.Model):
    code = models.CharField(max_length=50, unique=True)      # 'gestion_estrategica'
    name = models.CharField(max_length=100)                   # 'Dirección Estratégica'
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50)               # 'Target'
    color = models.CharField(max_length=20)                   # 'purple'
    route = models.CharField(max_length=100)                  # '/gestion-estrategica'
    order = models.PositiveIntegerField(default=0)
    is_enabled = models.BooleanField(default=True)
    required_permission = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['order']
```

### ModuleTab

```python
class ModuleTab(models.Model):
    module = models.ForeignKey(SystemModule, related_name='tabs', on_delete=models.CASCADE)
    code = models.CharField(max_length=50)                    # 'configuracion'
    name = models.CharField(max_length=100)                   # 'Configuración'
    icon_name = models.CharField(max_length=50)               # 'Settings'
    route = models.CharField(max_length=100)                  # 'configuracion'
    order = models.PositiveIntegerField(default=0)
    is_enabled = models.BooleanField(default=True)
    required_permission = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ['module', 'code']
```

### TabSection

```python
class TabSection(models.Model):
    tab = models.ForeignKey(ModuleTab, related_name='sections', on_delete=models.CASCADE)
    code = models.CharField(max_length=50)                    # 'empresa'
    name = models.CharField(max_length=100)                   # 'Empresa'
    icon_name = models.CharField(max_length=50)               # 'Building'
    order = models.PositiveIntegerField(default=0)
    is_enabled = models.BooleanField(default=True)
    required_permission = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ['tab', 'code']
```

---

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/core/system-modules/` | GET | Lista todos los módulos |
| `/api/core/system-modules/sidebar/` | GET | Módulos para sidebar (solo habilitados) |
| `/api/core/system-modules/tree/` | GET | Árbol completo (módulos → tabs → secciones) |
| `/api/core/system-modules/{id}/` | GET | Detalle de un módulo |
| `/api/core/system-modules/{id}/toggle/` | PATCH | Activar/desactivar módulo |
| `/api/core/module-tabs/{id}/toggle/` | PATCH | Activar/desactivar tab |
| `/api/core/tab-sections/{id}/toggle/` | PATCH | Activar/desactivar sección |

### Respuesta de `/sidebar/`

```json
[
  {
    "id": 1,
    "code": "gestion_estrategica",
    "name": "Dirección Estratégica",
    "icon_name": "Target",
    "color": "purple",
    "route": "/gestion-estrategica",
    "tabs": [
      {
        "id": 1,
        "code": "configuracion",
        "name": "Configuración",
        "icon_name": "Settings",
        "route": "configuracion",
        "sections": [
          {
            "id": 1,
            "code": "empresa",
            "name": "Empresa",
            "icon_name": "Building"
          }
        ]
      }
    ]
  }
]
```

---

## Uso en Frontend

### Hook para Sidebar

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useSidebarModules() {
  return useQuery({
    queryKey: ['sidebar-modules'],
    queryFn: async () => {
      const response = await apiClient.get('/api/core/system-modules/sidebar/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

### Hook para Secciones de Tab

```typescript
export function useTabSections(moduleCode: string, tabCode: string) {
  const { data: modules } = useSidebarModules();

  const sections = useMemo(() => {
    const module = modules?.find(m => m.code === moduleCode);
    const tab = module?.tabs?.find(t => t.code === tabCode);
    return tab?.sections || [];
  }, [modules, moduleCode, tabCode]);

  return { sections };
}
```

### Componente DynamicSections

```tsx
import { DynamicIcon } from '@/components/common/DynamicIcon';

interface Section {
  code: string;
  name: string;
  icon_name: string;
}

interface DynamicSectionsProps {
  sections: Section[];
  activeSection: string;
  onChange: (code: string) => void;
  macroprocessColor: string;
}

export function DynamicSections({
  sections,
  activeSection,
  onChange,
  macroprocessColor
}: DynamicSectionsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {sections.map(section => (
        <button
          key={section.code}
          onClick={() => onChange(section.code)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-all
            ${activeSection === section.code
              ? `bg-${macroprocessColor}-100 text-${macroprocessColor}-700 border-${macroprocessColor}-300`
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          <DynamicIcon name={section.icon_name} className="w-4 h-4" />
          {section.name}
        </button>
      ))}
    </div>
  );
}
```

### Uso en Página

```tsx
function ConfiguracionPage() {
  const { sections } = useTabSections('gestion_estrategica', 'configuracion');
  const [activeSection, setActiveSection] = useState('empresa');

  return (
    <div>
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        macroprocessColor="purple"
      />

      <div className="mt-6">
        {activeSection === 'empresa' && <EmpresaSection />}
        {activeSection === 'branding' && <BrandingSection />}
        {activeSection === 'integraciones' && <IntegracionesSection />}
      </div>
    </div>
  );
}
```

---

## Configuración desde Admin

### Activar/Desactivar Módulos

```bash
# Toggle módulo
PATCH /api/core/system-modules/1/toggle/

# Toggle tab
PATCH /api/core/module-tabs/1/toggle/

# Toggle sección
PATCH /api/core/tab-sections/1/toggle/
```

### Reordenar

```bash
# Actualizar orden
PATCH /api/core/system-modules/1/
{
  "order": 5
}
```

---

## Permisos

Cada elemento puede tener un `required_permission`. Si el usuario no tiene ese permiso:

- El elemento no aparece en el sidebar
- La ruta devuelve 403
- Las secciones se ocultan

```python
# Backend: Verificar permiso
if module.required_permission:
    if not request.user.has_perm(module.required_permission):
        continue  # No incluir en respuesta
```

---

## Documentación Relacionada

- [ARQUITECTURA-DINAMICA.md](ARQUITECTURA-DINAMICA.md) - Sistema 100% dinámico
- [RBAC-SYSTEM.md](RBAC-SYSTEM.md) - Sistema de permisos
