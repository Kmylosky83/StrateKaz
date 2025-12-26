# Arquitectura 100% Dinámica

> **Principio Fundamental:** Este sistema es completamente dinámico desde la base de datos. NO SE PERMITE HARDCODING.

## Filosofía

El sistema está diseñado para que **cualquier configuración** pueda modificarse sin tocar código fuente. Esto permite:

- Adaptación a diferentes industrias sin desarrollo adicional
- Configuración por parte de administradores sin conocimientos técnicos
- Cambios en tiempo real sin redeployment

---

## Qué es Dinámico

| Elemento | Configuración | API/Modelo | Ejemplo |
|----------|---------------|------------|---------|
| **Sidebar/Navegación** | Módulos, tabs, secciones | `GET /api/core/modulos/` | Admin activa/desactiva módulos |
| **Cargos y Roles** | RBAC completo | `Cargo`, `Rol`, `Permiso` | Crear "Gerente SST" sin código |
| **Permisos** | Granulares por módulo/acción | `user.has_perm()` | `sst.view_matriz_peligros` |
| **Branding** | Logos, colores, nombre | `EmpresaConfig` | Cambiar logo en caliente |
| **Formularios** | Campos dinámicos | JSON Schema | `TipoRecoleccion.form_schema` |
| **Tipos de documentos** | Categorías configurables | `TipoDocumento` | Añadir categorías desde admin |
| **Iconos** | Lucide React por nombre | `icon_name` field | `icon_name: "Shield"` |
| **Consecutivos** | Formatos configurables | `ConsecutivoConfig` | `{PREFIJO}-{YYYY}-{####}` |

---

## Ejemplos de Buenas y Malas Prácticas

### Backend (Python/Django)

```python
# PROHIBIDO - Hardcoding de cargos
CARGOS = ['GERENTE', 'LIDER_SST', 'OPERARIO']

if user.cargo.codigo == 'LIDER_SST':
    return True

# CORRECTO - Verificar permiso dinámico
if user.has_perm('sst.manage_matriz_peligros'):
    return True

# CORRECTO - Consultar desde BD
cargos = Cargo.objects.filter(is_active=True)
```

```python
# PROHIBIDO - Hardcoding de tipos
TIPOS_DOCUMENTO = ['PROCEDIMIENTO', 'FORMATO', 'MANUAL']

# CORRECTO - Modelo dinámico
tipos = TipoDocumento.objects.filter(is_active=True)
```

### Frontend (TypeScript/React)

```typescript
// PROHIBIDO - Hardcoding de navegación
const MENU_ITEMS = [
  { label: 'SST', path: '/sst' },
  { label: 'Calidad', path: '/calidad' },
];

// CORRECTO - Cargar desde API
const { data: modules } = useSidebarModules();
```

```typescript
// PROHIBIDO - Hardcoding de cargos
const CARGOS = ['GERENTE', 'LIDER_SST', 'OPERARIO'];

// CORRECTO - Cargar desde API
const { data: cargos } = useCargos();
```

```typescript
// PROHIBIDO - Hardcoding de permisos
if (user.cargo === 'ADMIN') {
  showButton = true;
}

// CORRECTO - Verificar permiso
const { hasPermission } = usePermissions();
if (hasPermission('sst.create_incidente')) {
  showButton = true;
}
```

---

## Modelos Base para Sistema Dinámico

### SystemModule (Módulos del Sistema)

```python
class SystemModule(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    icon_name = models.CharField(max_length=50)  # Nombre de icono Lucide
    color = models.CharField(max_length=20)       # Color del macroproceso
    route = models.CharField(max_length=100)
    order = models.PositiveIntegerField()
    is_enabled = models.BooleanField(default=True)
```

### ModuleTab (Tabs de Módulo)

```python
class ModuleTab(models.Model):
    module = models.ForeignKey(SystemModule, related_name='tabs')
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    icon_name = models.CharField(max_length=50)
    route = models.CharField(max_length=100)
    order = models.PositiveIntegerField()
    is_enabled = models.BooleanField(default=True)
```

### TabSection (Secciones de Tab)

```python
class TabSection(models.Model):
    tab = models.ForeignKey(ModuleTab, related_name='sections')
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    icon_name = models.CharField(max_length=50)
    order = models.PositiveIntegerField()
    is_enabled = models.BooleanField(default=True)
```

---

## API Endpoints para Configuración Dinámica

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/core/system-modules/sidebar/` | GET | Módulos para sidebar (habilitados) |
| `/api/core/system-modules/tree/` | GET | Árbol completo para configuración |
| `/api/core/system-modules/{id}/toggle/` | PATCH | Activar/desactivar módulo |
| `/api/core/module-tabs/{id}/toggle/` | PATCH | Activar/desactivar tab |
| `/api/core/tab-sections/{id}/toggle/` | PATCH | Activar/desactivar sección |
| `/api/core/cargos/` | GET | Lista de cargos dinámicos |
| `/api/core/permisos/` | GET | Lista de permisos del sistema |

---

## Iconos Dinámicos

Los iconos se cargan dinámicamente desde Lucide React usando el nombre almacenado en BD:

```typescript
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className }) => {
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons];

  if (!IconComponent) {
    return <LucideIcons.HelpCircle className={className} />;
  }

  return <IconComponent className={className} />;
};

// Uso
<DynamicIcon name={module.icon_name} className="w-5 h-5" />
```

---

## Colores por Macroproceso

| Macroproceso | Color | Uso |
|--------------|-------|-----|
| Estratégico | `purple` | Dirección, planeación |
| Cumplimiento | `blue` | Legal, riesgos |
| HSEQ | `green` | Calidad, SST, Ambiental |
| Cadena de Valor | `orange` | Operaciones, producción |
| Habilitadores | `cyan` | RRHH, Finanzas |
| Inteligencia | `indigo` | Analytics, Auditoría |

---

## Documentación Relacionada

- [RBAC-SYSTEM.md](RBAC-SYSTEM.md) - Sistema de roles y permisos
- [NAVEGACION-DINAMICA.md](NAVEGACION-DINAMICA.md) - Implementación de navegación
- [BRANDING-DINAMICO.md](BRANDING-DINAMICO.md) - Configuración de marca
