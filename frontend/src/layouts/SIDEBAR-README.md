# Sidebar Dinámico - Sistema de 6 Niveles

## Descripción

El Sidebar es completamente **dinámico** y carga su estructura desde el backend. Soporta una jerarquía de **6 niveles** según la arquitectura del ERP.

## Arquitectura de 6 Niveles

### NIVEL 1: ESTRATÉGICO (Dirección)
- **Color:** Purple
- **Módulos:** Dirección Estratégica

### NIVEL 2: CUMPLIMIENTO Y CONTROL (Governance)
- **Color:** Orange
- **Módulos:** Cumplimiento, Riesgos, Flujos de Trabajo

### NIVEL 3: TORRE DE CONTROL (HSEQ)
- **Color:** Blue
- **Módulos:** Gestión HSEQ

### NIVEL 4: CADENA DE VALOR (Operaciones)
- **Color:** Green
- **Módulos:** Cadena de Suministro, Producción, Logística y Flota, Ventas y CRM

### NIVEL 5: HABILITADORES (Soporte)
- **Color:** Gray
- **Módulos:** Centro de Talento, Administración y Finanzas, Contabilidad

### NIVEL 6: INTELIGENCIA (Analytics)
- **Color:** Purple
- **Módulos:** Analítica, Sistema de Auditoría

## Estructura de Datos

### Formato de Módulo

```typescript
interface SidebarModule {
  code: string;              // Código único (ej: "GESTION_ESTRATEGICA")
  name: string;              // Nombre mostrado
  icon: string;              // Nombre del icono de Lucide React
  color?: ModuleColor;       // purple | blue | green | orange | gray
  route?: string;            // Ruta de navegación
  is_category: boolean;      // true si es categoría/nivel
  children?: SidebarModule[]; // Sub-módulos o tabs
}
```

### Ejemplo de Estructura

```json
{
  "modules": [
    {
      "code": "NIVEL_1_ESTRATEGICO",
      "name": "NIVEL 1: ESTRATÉGICO",
      "is_category": true,
      "icon": "Layers",
      "color": "purple",
      "children": [
        {
          "code": "GESTION_ESTRATEGICA",
          "name": "Dirección Estratégica",
          "icon": "Target",
          "route": "/direccion-estrategica",
          "color": "purple",
          "children": [
            {
              "code": "IDENTIDAD",
              "name": "Identidad Corporativa",
              "icon": "Building2",
              "route": "/direccion-estrategica/identidad"
            },
            {
              "code": "PLANEACION",
              "name": "Planeación Estratégica",
              "icon": "Target",
              "route": "/direccion-estrategica/planeacion"
            }
          ]
        }
      ]
    }
  ]
}
```

## Características Visuales

### Niveles Principales (NIVEL_1, NIVEL_2, etc.)

Los niveles principales tienen un tratamiento especial:

- **Separador visual**: Línea gradiente antes de cada nivel
- **Tipografía**: Mayúsculas, negrita, tamaño reducido (uppercase text-xs)
- **Espaciado**: Mayor margen superior (mt-6)
- **Sin borde lateral**: Los hijos se renderizan sin borde izquierdo

### Módulos (Segundo Nivel)

Los módulos dentro de cada nivel:

- **Color temático**: Según el nivel (purple, blue, green, orange, gray)
- **Iconos**: De Lucide React (5x5)
- **Expandibles**: Con chevron para mostrar/ocultar tabs
- **Borde lateral**: Con color temático del módulo

### Tabs (Tercer Nivel)

Los tabs dentro de cada módulo:

- **Iconos pequeños**: 4x4
- **Links navegables**: Redirigen a la ruta especificada
- **Estados**: Activo (resaltado), hover, default

## Colores por Nivel

### Purple (Estratégico e Inteligencia)
```css
bg: bg-purple-50/50 dark:bg-purple-900/10
hover: hover:bg-purple-50 dark:hover:bg-purple-900/20
active: bg-purple-100 dark:bg-purple-900/30
text: text-purple-600 dark:text-purple-400
border: border-l-purple-500
```

### Orange (Cumplimiento)
```css
bg: bg-orange-50/50 dark:bg-orange-900/10
hover: hover:bg-orange-50 dark:hover:bg-orange-900/20
active: bg-orange-100 dark:bg-orange-900/30
text: text-orange-600 dark:text-orange-400
border: border-l-orange-500
```

### Blue (HSEQ)
```css
bg: bg-blue-50/50 dark:bg-blue-900/10
hover: hover:bg-blue-50 dark:hover:bg-blue-900/20
active: bg-blue-100 dark:bg-blue-900/30
text: text-blue-600 dark:text-blue-400
border: border-l-blue-500
```

### Green (Cadena de Valor)
```css
bg: bg-emerald-50/50 dark:bg-emerald-900/10
hover: hover:bg-emerald-50 dark:hover:bg-emerald-900/20
active: bg-emerald-100 dark:bg-emerald-900/30
text: text-emerald-600 dark:text-emerald-400
border: border-l-emerald-500
```

### Gray (Habilitadores)
```css
bg: bg-gray-50/50 dark:bg-gray-900/10
hover: hover:bg-gray-50 dark:hover:bg-gray-900/20
active: bg-gray-100 dark:bg-gray-900/30
text: text-gray-600 dark:text-gray-400
border: border-l-gray-500
```

## Iconos de Lucide React

### Ejemplos por Nivel

**Nivel 1 (Estratégico):**
- `Target` - Objetivos estratégicos
- `Building2` - Identidad corporativa
- `Network` - Organización
- `Settings` - Configuración

**Nivel 2 (Cumplimiento):**
- `ShieldCheck` - Cumplimiento
- `AlertTriangle` - Riesgos
- `GitBranch` - Flujos de trabajo

**Nivel 3 (HSEQ):**
- `Shield` - HSEQ general
- `FileText` - Documentos
- `AlertCircle` - No conformidades
- `Search` - Auditorías

**Nivel 4 (Cadena de Valor):**
- `Package` - Suministro
- `Cog` - Producción
- `Truck` - Logística
- `TrendingUp` - Ventas

**Nivel 5 (Habilitadores):**
- `Users2` - Talento
- `Wallet` - Finanzas
- `Calculator` - Contabilidad

**Nivel 6 (Inteligencia):**
- `BarChart4` - Analítica
- `FileSearch` - Auditoría

## Estados del Sidebar

### Expandido (w-64)
- Muestra nombres completos
- Muestra iconos de chevron
- Muestra separadores de nivel
- Borde lateral en sub-items

### Colapsado (w-16)
- Solo iconos
- Tooltip en hover
- Sin chevrons
- Sin separadores

## Comportamiento

### Expansión Automática
El sidebar detecta la ruta actual y expande automáticamente:
1. El nivel que contiene el módulo activo
2. El módulo activo
3. Scroll hasta el item activo

### Persistencia
El estado de expansión se mantiene en `useState` durante la sesión actual.

## API Backend

### Endpoint

```
GET /api/core/system-modules/sidebar/
```

### Respuesta

```json
[
  {
    "code": "NIVEL_1_ESTRATEGICO",
    "name": "NIVEL 1: ESTRATÉGICO",
    "icon": "Layers",
    "color": "purple",
    "is_category": true,
    "children": [...]
  }
]
```

### Filtrado

- **Solo módulos habilitados**: `is_enabled: true`
- **Solo módulos activos para la empresa**: `empresa_modulo.activo: true`
- **Ordenados**: Por `order` ASC

## Hook de Datos

```typescript
const { data: sidebarModules, isLoading, error } = useSidebarModules();
```

Este hook usa TanStack Query con:
- **Cache:** 5 minutos
- **Retry:** 2 intentos
- **Invalidación:** Al cambiar configuración de módulos

## Permisos

El Sidebar muestra solo los módulos y tabs para los cuales el usuario tiene permisos. El filtrado se hace en el backend basado en:

1. Rol del usuario
2. Permisos asignados
3. Configuración de módulos de la empresa

## Navegación

### Niveles de Navegación

1. **Nivel Principal**: No navegable, solo organización visual
2. **Módulo**: Navegable si tiene `route`
3. **Tab**: Siempre navegable con `route`

### Detección de Ruta Activa

```typescript
const isActive = location.pathname.startsWith(item.route);
```

## Responsive

- **Desktop (md+)**: Sidebar fijo a la izquierda
- **Mobile (<md)**: Drawer overlay
- **Colapsado**: `w-16` (solo iconos)
- **Expandido**: `w-64` (completo)

## Accesibilidad

- **Navegación con teclado**: Tab, Enter, Escape
- **Screen readers**: ARIA labels en iconos
- **Contraste**: Cumple WCAG AA en modo claro y oscuro

## Troubleshooting

### El sidebar no carga módulos

1. Verificar que el usuario esté autenticado
2. Verificar que la empresa tenga módulos activos
3. Revisar permisos del usuario
4. Verificar console del navegador

### Los colores no se aplican

1. Verificar que el módulo tenga `color` definido
2. Verificar que el color esté en `macroprocessColors`
3. Reiniciar servidor de desarrollo

### Los iconos no aparecen

1. Verificar que el nombre del icono exista en Lucide React
2. Usar `Circle` como fallback
3. Revisar mayúsculas/minúsculas

## Referencias

- **Documentación completa**: `/docs/ESTRUCTURA-6-NIVELES-ERP.md`
- **Tipos TypeScript**: `/frontend/src/features/gestion-estrategica/types/modules.types.ts`
- **Hook de datos**: `/frontend/src/features/gestion-estrategica/hooks/useModules.ts`
- **Lucide Icons**: https://lucide.dev/icons

---

**Última actualización:** 2024-12-23
**Versión:** 1.0
