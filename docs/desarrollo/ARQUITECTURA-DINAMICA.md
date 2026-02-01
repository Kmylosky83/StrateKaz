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
| **Permisos de Acciones** | 68 permisos granulares | `CargoPermiso` | CRUD por módulo/sección |
| **Acceso a Secciones** | Visibilidad de UI | `CargoSectionAccess` | Qué tabs/secciones puede ver |
| **Branding** | Logos, colores, nombre | `EmpresaConfig` | Cambiar logo en caliente |
| **Formularios** | Campos dinámicos | JSON Schema | `TipoRecoleccion.form_schema` |
| **Iconos** | Lucide React por nombre | `icon_name` field | `icon_name: "Shield"` |

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
# PROHIBIDO - Hardcoding de permisos
if user.cargo.codigo == 'ADMIN':
    return True

# CORRECTO - Verificar acceso a sección
from apps.core.models import CargoSectionAccess
has_access = CargoSectionAccess.objects.filter(
    cargo=user.cargo,
    section__code='areas'
).exists()
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

## Iconos Dinámicos - Sistema Completo desde BD

El sistema de iconos es 100% dinámico desde la base de datos. NUNCA hardcodear iconos en el código.

Ver documentación completa: [SISTEMA-ICONOS-DINAMICOS.md](./SISTEMA-ICONOS-DINAMICOS.md)

### Modelo Backend: IconRegistry

```python
class IconRegistry(TimestampedModel, SoftDeleteModel):
    """
    Registro de Iconos Disponibles - 100% dinámico.
    56 iconos precargados en 7 categorías.
    """
    name = models.CharField(max_length=50)           # "Heart"
    label = models.CharField(max_length=100)         # "Corazón"
    category = models.CharField(max_length=30)       # "VALORES"
    keywords = models.CharField(max_length=200)      # "amor,pasión,compromiso"
    orden = models.PositiveIntegerField(default=0)
    es_sistema = models.BooleanField(default=False)

# Métodos disponibles
IconRegistry.cargar_iconos_sistema()           # Cargar 56 iconos
IconRegistry.obtener_por_categoria('VALORES')  # Filtrar por categoría
IconRegistry.buscar('corazon')                 # Buscar iconos
```

### API Endpoints

```http
GET /api/configuracion/icons/                      # Lista todos
GET /api/configuracion/icons/categories/           # Categorías con conteo
GET /api/configuracion/icons/by_category/?category=VALORES
GET /api/configuracion/icons/search/?q=corazon
POST /api/configuracion/icons/load_system_icons/   # Solo admin
```

### Componentes Frontend

```typescript
import { DynamicIcon, IconPicker } from '@/components/common';
import { useIcons } from '@/hooks/useIcons';

// Hook para obtener iconos
const { icons, categories, searchIcons, getIconsByCategory } = useIcons();

// Renderizar icono dinámicamente
<DynamicIcon
  name={valor.icono_nombre}
  size={24}
  className="text-purple-600"
/>

// Selector de iconos
<IconPicker
  value={selectedIcon}
  onChange={setSelectedIcon}
  category="VALORES"
  label="Seleccionar Icono"
/>
```

### Categorías de Iconos

| Categoría | Código | Iconos | Uso |
|-----------|--------|--------|-----|
| Valores Corporativos | VALORES | 18 | Misión, visión, valores |
| Normas y Sistemas | NORMAS | 6 | ISO, certificaciones |
| Estados y Status | ESTADOS | 6 | Workflows, procesos |
| Riesgos y Alertas | RIESGOS | 5 | Peligros, emergencias |
| Personas y Equipos | PERSONAS | 5 | Usuarios, colaboradores |
| Documentos | DOCUMENTOS | 6 | Archivos, carpetas |
| Uso General | GENERAL | 10 | Acciones, botones |

### Ejemplo: Migración de Código Hardcodeado

```typescript
// PROHIBIDO - Hardcoding
import { Heart, Shield, Star } from 'lucide-react';
const ICON_MAP = { heart: Heart, shield: Shield };

// CORRECTO - Sistema dinámico
import { DynamicIcon, IconPicker } from '@/components/common';
<DynamicIcon name={item.icon_name} />
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
