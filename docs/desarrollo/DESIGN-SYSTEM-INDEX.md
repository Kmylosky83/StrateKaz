# Índice de Documentación - Design System y Componentes

## Documentos Disponibles

### 1. RESUMEN-COMPONENTES.md 📋
**Archivo:** `docs/RESUMEN-COMPONENTES.md`
**Lectura estimada:** 5 minutos

Resumen ejecutivo con:
- Tabla rápida de componentes disponibles
- Ubicaciones de carpetas
- Ejemplo de estructura completa
- Checklist para comenzar
- Patrones a seguir

**Ideal para:** Primera lectura, overview rápido

---

### 2. COMPONENTES-DESIGN-SYSTEM.md 🎨
**Archivo:** `docs/COMPONENTES-DESIGN-SYSTEM.md`
**Lectura estimada:** 20-30 minutos

Documentación detallada de TODOS los componentes:

**Secciones:**
1. **Componentes Layout** (5 componentes)
   - PageHeader - Headers de página
   - StatsGrid - Tarjetas de estadísticas
   - FilterCard - Filtros con buscador
   - DataTableCard - Wrapper para tablas
   - PageTabs - Tabs de navegación

2. **Componentes Comunes** (5 componentes)
   - Button - Botones reutilizables
   - Badge - Badges y etiquetas
   - Card - Contenedores
   - Modal - Diálogos
   - Spinner - Indicadores de carga

3. **Componentes de Formulario** (2 componentes)
   - Input - Campos de entrada
   - Select - Dropdowns

4. **Ejemplos de Uso**
   - Ejemplos para cada componente
   - Casos de uso en Recepción
   - Propiedades y variantes

5. **Estructura Completa de Página**
   - Ejemplo completo de RecepcionPage
   - Cómo usar todos los componentes juntos

**Ideal para:** Implementación, referencia detallada

---

### 3. VISUAL-REFERENCE.md 🖼️
**Archivo:** `docs/VISUAL-REFERENCE.md`
**Lectura estimada:** 10-15 minutos

Guía visual con:
- Diagramas ASCII de layouts
- Estructura de página completa
- Componentes individuales
- Buttons y variantes
- Badges y estados
- Modals
- Responsive design
- Iconos recomendados
- Colores del proyecto

**Ideal para:** Diseño, UX, referencia visual

---

### 4. EJEMPLO-IMPLEMENTACION-RECEPCION.md 💻
**Archivo:** `docs/EJEMPLO-IMPLEMENTACION-RECEPCION.md`
**Lectura estimada:** 30-40 minutos

Código completo LISTO PARA USAR:

**Secciones:**
1. **Estructura de Carpetas** - Organización recomendada
2. **Tipos TypeScript** - Todas las interfaces necesarias
3. **RecepcionStatusBadge** - Badge de estado (componente)
4. **RecepcionTable** - Tabla de recepciones (componente)
5. **RecepcionForm** - Formulario crear/editar (componente)
6. **useRecepcion** - Hooks de API (queries)
7. **RecepcionPage** - Página principal completa
8. **Exports** - Qué exportar del módulo
9. **Rutas** - Cómo registrar en el router
10. **Próximos Pasos** - Checklist de implementación

**Ideal para:** Copy-paste directo, implementación rápida

---

## Cómo Usar Esta Documentación

### Escenario 1: Soy nuevo en el proyecto
1. Lee **RESUMEN-COMPONENTES.md** (5 min)
2. Revisa **VISUAL-REFERENCE.md** (10 min)
3. Consulta componentes específicos en **COMPONENTES-DESIGN-SYSTEM.md**

**Tiempo total:** ~15 minutos

---

### Escenario 2: Quiero implementar el módulo de Recepción
1. Lee **RESUMEN-COMPONENTES.md** (5 min)
2. Abre **EJEMPLO-IMPLEMENTACION-RECEPCION.md**
3. Copia el código necesario
4. Consulta **COMPONENTES-DESIGN-SYSTEM.md** si necesitas detalles
5. Referencia **VISUAL-REFERENCE.md** para diseño

**Tiempo total:** ~40-60 minutos para implementación completa

---

### Escenario 3: Necesito un componente específico
1. Busca en **RESUMEN-COMPONENTES.md** tabla rápida
2. Lee sección específica en **COMPONENTES-DESIGN-SYSTEM.md**
3. Consulta ejemplo de uso
4. Revisa **VISUAL-REFERENCE.md** si necesitas visual

**Tiempo total:** ~5-10 minutos

---

## Mapa de Componentes

```
LAYOUT (Estructuras)
├── PageHeader          → Header de página
├── StatsGrid           → Tarjetas KPI
├── FilterCard          → Filtros colapsables
├── DataTableCard       → Wrapper tabla + paginación
└── PageTabs            → Tabs de navegación

COMMON (Básicos)
├── Button              → Botones
├── Badge               → Etiquetas/badges
├── Card                → Contenedores
├── Modal               → Diálogos
└── Spinner             → Indicador carga

FORMS (Entrada)
├── Input               → Campos texto/fecha
└── Select              → Dropdowns

CUSTOM (Para Recepción)
├── RecepcionStatusBadge    → Badge estado recepción
├── RecepcionTable          → Tabla recepciones
├── RecepcionForm           → Modal crear/editar
└── RecepcionDetailModal    → Modal detalles
```

---

## Ubicaciones de Archivos

### Componentes Desarrollados
```
c:\Proyectos\StrateKaz\frontend\src\components\
├── layout\                          (PageHeader, StatsGrid, etc.)
├── common\                          (Button, Badge, Card, Modal)
├── forms\                           (Input, Select)
├── layout\index.ts                  (Exports de layout)
└── layout\PageHeader.tsx            (Ejemplo: PageHeader)
```

### Módulo de Recepción (A crear)
```
c:\Proyectos\StrateKaz\frontend\src\features\recepcion\
├── components\
│   ├── RecepcionStatusBadge.tsx
│   ├── RecepcionTable.tsx
│   ├── RecepcionForm.tsx
│   └── RecepcionDetailModal.tsx
├── hooks\
│   └── useRecepcion.ts
├── pages\
│   └── RecepcionPage.tsx
├── types\
│   └── recepcion.types.ts
└── index.ts
```

---

## Colores del Sistema

```
Variantes de Badge/Button:
─────────────────────────────────
primary     Azul        (#3B82F6)    Acciones principales
secondary   Gris        (#6B7280)    Secundarias
success     Verde       (#10B981)    Completado/Éxito
warning     Naranja     (#F59E0B)    Pendiente/Advertencia
danger      Rojo        (#EF4444)    Error/Rechazo
info        Celeste     (#0EA5E9)    Información
gray        Gris        (#6B7280)    Neutral

Todos incluyen variantes dark:
dark:bg-primary-900/30   (Dark mode)
```

---

## Patrón de Importación Estándar

```typescript
// Layout components
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  StatsGrid,
  DataTableCard,
  PageTabs,
} from '@/components/layout';

// Common components
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';

// Form components
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';

// Icons (lucide-react)
import { Plus, Download, Edit2, Trash2, Eye } from 'lucide-react';
```

---

## Responsive Breakpoints

```
Mobile:   < 640px    1 columna
Tablet:   640-1024px 2 columnas (md)
Desktop:  > 1024px   3-4 columnas (lg)

Todos los componentes son mobile-first
```

---

## Props Comunes

### Componentes de Layout
```typescript
// Todos tienen className?: string para Tailwind
{
  className?: string;        // Clases Tailwind personalizadas
}

// StatsGrid, FilterCard, PageTabs adicionales
{
  columns?: number;          // Columnas en desktop
  variant?: 'default' | ...  // Variante de estilo
}
```

### Componentes Comunes
```typescript
// Button
{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Badge
{
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

// Modal
{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  showCloseButton?: boolean;
}
```

---

## Ejemplos Reales en el Proyecto

Consulta estas páginas como referencia:

1. **ProveedoresPage** - Implementación completa
   ```
   c:\Proyectos\StrateKaz\frontend\src\features\proveedores\pages\ProveedoresPage.tsx
   ```

2. **UsersPage** - Otra implementación completa
   ```
   c:\Proyectos\StrateKaz\frontend\src\features\users\pages\UsersPage.tsx
   ```

3. **ProveedoresTable** - Tabla con acciones
   ```
   c:\Proyectos\StrateKaz\frontend\src\features\proveedores\components\ProveedoresTable.tsx
   ```

---

## Checklist para Implementación

- [ ] Crear carpeta `features/recepcion/`
- [ ] Copiar tipos de `EJEMPLO-IMPLEMENTACION-RECEPCION.md`
- [ ] Crear componentes:
  - [ ] RecepcionStatusBadge.tsx
  - [ ] RecepcionTable.tsx
  - [ ] RecepcionForm.tsx
  - [ ] RecepcionDetailModal.tsx
- [ ] Crear hooks en useRecepcion.ts
- [ ] Crear página RecepcionPage.tsx
- [ ] Agregar rutas en routes/index.tsx
- [ ] Agregar enlace en Sidebar.tsx
- [ ] Conectar con API backend

**Tiempo estimado:** 2-4 horas

---

## Soporte y Referencias

### Documentación Externa
- **Tailwind CSS:** https://tailwindcss.com/
- **Lucide Icons:** https://lucide.dev/
- **React Hooks:** https://react.dev/reference/react

### Librerías Usadas
- `@headlessui/react` - Modal, Dialog
- `lucide-react` - Iconos
- `@tanstack/react-query` - State management (si usas hooks)
- `tailwindcss` - Estilos

---

## Preguntas Frecuentes

### ¿Puedo modificar los componentes?
Sí, son reutilizables y flexibles. Consulta las props disponibles.

### ¿Cómo agrego un color personalizado?
Usa `className` con Tailwind. Consulta `tailwind.config.ts`.

### ¿Los componentes incluyen dark mode?
Sí, automáticamente con `dark:` en Tailwind.

### ¿Cómo adapto componentes para mi módulo?
Crea componentes específicos que compongan los genéricos.
Ejemplo: `RecepcionStatusBadge` = `Badge` con lógica de estado.

### ¿Necesito crear todo de cero?
No, copia del archivo `EJEMPLO-IMPLEMENTACION-RECEPCION.md`.

---

## Tabla de Referencia Rápida

| Componente | Uso | Complejidad | Personalizable |
|-----------|-----|-------------|-----------------|
| Button | Acciones | ⭐ | ✅ |
| Badge | Estados | ⭐ | ✅ |
| Card | Contenedor | ⭐ | ✅ |
| Input | Entrada texto | ⭐⭐ | ✅ |
| Select | Dropdown | ⭐⭐ | ✅ |
| Modal | Diálogos | ⭐⭐ | ✅ |
| PageHeader | Header página | ⭐⭐⭐ | ✅ |
| StatsGrid | KPI cards | ⭐⭐⭐ | ✅ |
| FilterCard | Filtros | ⭐⭐⭐ | ✅ |
| DataTableCard | Tabla completa | ⭐⭐⭐ | ✅ |
| PageTabs | Tabs | ⭐⭐⭐ | ✅ |

---

## Navegación Rápida

```
Primero:    RESUMEN-COMPONENTES.md
Luego:      COMPONENTES-DESIGN-SYSTEM.md
Después:    VISUAL-REFERENCE.md
Finalmente: EJEMPLO-IMPLEMENTACION-RECEPCION.md
```

---

**Última actualización:** 2024-12-04
**Componentes documentados:** 11 (Layout: 5, Common: 5, Forms: 2)
**Ejemplos listos:** Completo módulo Recepción
**Estado:** ✅ Listo para implementación
