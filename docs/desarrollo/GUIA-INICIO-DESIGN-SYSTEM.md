# Guía de Inicio - Design System del Proyecto

Bienvenido a la guía del Design System disponible en el proyecto "StrateKaz".

---

## Qué Encontrarás

Has accedido a una documentación completa del sistema de componentes reutilizables del proyecto, listo para construir nuevos módulos como el de **Recepción de Materias Primas**.

---

## 📚 Documentación Disponible

### 1️⃣ **DESIGN-SYSTEM-INDEX.md** ← EMPIEZA AQUÍ
- Índice general de la documentación
- Navegación por tema
- Tabla de referencia rápida
- Checklist de implementación

**Lectura:** 5 minutos

---

### 2️⃣ **RESUMEN-COMPONENTES.md**
- Tabla rápida de componentes
- Dónde encontrar cada componente
- Colores y variantes
- Patrones a seguir

**Lectura:** 5 minutos

---

### 3️⃣ **COMPONENTES-DESIGN-SYSTEM.md**
- Documentación detallada de cada componente
- Props disponibles
- Ejemplos de uso
- Casos reales para Recepción

**Lectura:** 20-30 minutos

---

### 4️⃣ **VISUAL-REFERENCE.md**
- Diagramas ASCII de layouts
- Estructura visual de páginas
- Modals, tables, formularios
- Iconos recomendados
- Responsive design

**Lectura:** 10-15 minutos

---

### 5️⃣ **EJEMPLO-IMPLEMENTACION-RECEPCION.md**
- Código COMPLETO listo para usar
- Estructuras de carpetas
- Types TypeScript
- Componentes implementados
- Hooks de API
- Página principal con todo integrado

**Lectura:** 30-40 minutos (o solo consulta cuando necesites)

---

### 6️⃣ **SNIPPETS-RAPIDOS.md**
- Copy & Paste listos
- Imports esenciales
- Componentes comunes
- Modals, tablas, formularios
- Validación y manejo de errores

**Lectura:** Consultar según necesites

---

## 🎯 Ruta Recomendada

### Si eres completamente nuevo:
```
1. DESIGN-SYSTEM-INDEX.md (5 min)
   ↓
2. RESUMEN-COMPONENTES.md (5 min)
   ↓
3. VISUAL-REFERENCE.md (10 min)
   ↓
4. COMPONENTES-DESIGN-SYSTEM.md (selecciona lo que necesites)

Tiempo total: ~30 minutos
```

### Si quieres implementar Recepción:
```
1. RESUMEN-COMPONENTES.md (5 min)
   ↓
2. EJEMPLO-IMPLEMENTACION-RECEPCION.md (copia + adapta)
   ↓
3. COMPONENTES-DESIGN-SYSTEM.md (consulta detalles)
   ↓
4. SNIPPETS-RAPIDOS.md (si necesitas más ejemplos)

Tiempo total: 1-2 horas de implementación
```

### Si necesitas un componente específico:
```
1. RESUMEN-COMPONENTES.md → Tabla rápida
   ↓
2. COMPONENTES-DESIGN-SYSTEM.md → Sección del componente
   ↓
3. SNIPPETS-RAPIDOS.md → Copy & Paste
   ↓
4. VISUAL-REFERENCE.md → Ver cómo se ve

Tiempo total: 5-10 minutos
```

---

## 🚀 Quick Start (5 minutos)

### Estructura del Proyecto

```
Componentes disponibles:
├── Layout (5 componentes)
│   ├── PageHeader
│   ├── StatsGrid
│   ├── FilterCard
│   ├── DataTableCard
│   └── PageTabs
├── Common (5 componentes)
│   ├── Button
│   ├── Badge
│   ├── Card
│   ├── Modal
│   └── Spinner
└── Forms (2 componentes)
    ├── Input
    └── Select
```

### Ubicación en el Proyecto

```
c:\Proyectos\StrateKaz\
├── frontend\src\components\
│   ├── layout\              ← Componentes de estructura
│   ├── common\              ← Componentes básicos
│   └── forms\               ← Componentes de formulario
└── docs\                    ← Esta documentación
```

### Ejemplo Mínimo

```typescript
import { PageHeader, StatsGrid, FilterCard, DataTableCard } from '@/components/layout';
import { Button } from '@/components/common/Button';
import { Plus } from 'lucide-react';

export default function RecepcionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recepción"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>Nueva</Button>}
      />
      <StatsGrid stats={stats} columns={4} />
      <FilterCard collapsible>Filtros aquí</FilterCard>
      <DataTableCard>Tabla aquí</DataTableCard>
    </div>
  );
}
```

---

## 📋 Componentes Disponibles

| Componente | Ubicación | Uso |
|-----------|-----------|-----|
| **PageHeader** | `components/layout/PageHeader.tsx` | Header de página con título, badges, acciones |
| **StatsGrid** | `components/layout/StatsGrid.tsx` | Grid de tarjetas KPI |
| **FilterCard** | `components/layout/FilterCard.tsx` | Filtros colapsables con buscador |
| **DataTableCard** | `components/layout/DataTableCard.tsx` | Tabla con paginación |
| **PageTabs** | `components/layout/PageTabs.tsx` | Tabs de navegación |
| **Button** | `components/common/Button.tsx` | Botones reutilizables |
| **Badge** | `components/common/Badge.tsx` | Badges/etiquetas de estado |
| **Card** | `components/common/Card.tsx` | Contenedor reutilizable |
| **Modal** | `components/common/Modal.tsx` | Diálogos |
| **Spinner** | `components/common/Spinner.tsx` | Indicador de carga |
| **Input** | `components/forms/Input.tsx` | Campos de entrada |
| **Select** | `components/forms/Select.tsx` | Dropdowns |

---

## 🎨 Temas y Colores

```
Sistema de colores:
├── Primary    → Azul (#3B82F6)       Acciones principales
├── Secondary  → Gris (#6B7280)       Acciones secundarias
├── Success    → Verde (#10B981)      Completado/éxito
├── Warning    → Naranja (#F59E0B)    Pendiente/advertencia
├── Danger     → Rojo (#EF4444)       Error/rechazo
└── Info       → Celeste (#0EA5E9)    Información

Todos incluyen Dark Mode automático
```

---

## 📱 Responsive

```
Mobile:   < 640px   (1 columna)
Tablet:   640-1024  (2 columnas)
Desktop:  > 1024px  (3-4 columnas)

Todos los componentes son mobile-first
```

---

## 🔗 Patrón de Importación

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

## ✅ Checklist para Comenzar

- [ ] Lee DESIGN-SYSTEM-INDEX.md
- [ ] Revisa RESUMEN-COMPONENTES.md
- [ ] Consulta VISUAL-REFERENCE.md
- [ ] Abre COMPONENTES-DESIGN-SYSTEM.md para referencia
- [ ] Copia código de EJEMPLO-IMPLEMENTACION-RECEPCION.md
- [ ] Usa SNIPPETS-RAPIDOS.md para copy & paste

---

## 💡 Ejemplos Existentes en Proyecto

Consulta estas implementaciones reales:

1. **ProveedoresPage** - Implementación completa
   ```
   frontend/src/features/proveedores/pages/ProveedoresPage.tsx
   ```

2. **UsersPage** - Otra implementación
   ```
   frontend/src/features/users/pages/UsersPage.tsx
   ```

3. **ProveedoresTable** - Tabla con acciones
   ```
   frontend/src/features/proveedores/components/ProveedoresTable.tsx
   ```

---

## 🚧 Cómo Crear el Módulo de Recepción

### Paso 1: Estructura (5 min)
```bash
mkdir -p frontend/src/features/recepcion/{components,hooks,pages,types}
```

### Paso 2: Copiar Tipos (5 min)
- Copia `recepcion.types.ts` de EJEMPLO-IMPLEMENTACION-RECEPCION.md
- Adapta según tu API

### Paso 3: Crear Componentes (30 min)
- RecepcionStatusBadge.tsx
- RecepcionTable.tsx
- RecepcionForm.tsx

### Paso 4: Crear Hooks (15 min)
- useRecepcion.ts
- Conecta con API

### Paso 5: Crear Página (20 min)
- RecepcionPage.tsx
- Integra todos los componentes

### Paso 6: Registrar Rutas (5 min)
- Agregar en `routes/index.tsx`
- Agregar en `Sidebar.tsx`

**Tiempo total:** 1.5-2 horas

---

## 🎓 Conceptos Clave

### Props Comunes
```typescript
// Todos los componentes tienen:
className?: string;         // Clases Tailwind personalizadas

// Específicos:
variant?: 'primary' | ...   // Variante de estilo
size?: 'sm' | 'md' | 'lg'   // Tamaño
```

### Estados de Componentes
```typescript
// Button
<Button isLoading={true}>Guardando...</Button>
<Button disabled>Deshabilitado</Button>

// Input
<Input error="Campo requerido" />
<Input helperText="Información adicional" />
```

### Validación
```typescript
// FormData con errores
const [errors, setErrors] = useState({});

// Mostrar error en input
<Input
  label="Email"
  value={email}
  error={errors.email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

## 🆘 Solución de Problemas

### "No encuentro un componente"
→ Revisa RESUMEN-COMPONENTES.md tabla rápida

### "No sé cómo usar X componente"
→ Busca en COMPONENTES-DESIGN-SYSTEM.md

### "Necesito código listo"
→ Copia de SNIPPETS-RAPIDOS.md o EJEMPLO-IMPLEMENTACION-RECEPCION.md

### "¿Cómo se vería?"
→ Consulta VISUAL-REFERENCE.md

### "¿Por qué se ve raro?"
→ Verifica responsive en VISUAL-REFERENCE.md

---

## 📞 Preguntas Frecuentes

**P: ¿Puedo modificar los componentes?**
A: Sí, son reutilizables. Usa el prop `className` para personalizar.

**P: ¿Incluyen dark mode?**
A: Sí, automáticamente con Tailwind.

**P: ¿Qué pasa en mobile?**
A: Son responsivos (1 col mobile, 2 tablet, 3-4 desktop).

**P: ¿Cómo creo un componente nuevo?**
A: Composición de componentes existentes + lógica específica.

**P: ¿Dónde están los iconos?**
A: lucide-react (importa los que necesites).

---

## 🔍 Referencia Rápida

```
NECESITO...                          VER...
─────────────────────────────────────────────────────────
Empezar                             → DESIGN-SYSTEM-INDEX
Ver componentes disponibles         → RESUMEN-COMPONENTES
Documentación detallada             → COMPONENTES-DESIGN-SYSTEM
Ver cómo se vería                   → VISUAL-REFERENCE
Código completo para Recepción      → EJEMPLO-IMPLEMENTACION
Copy & Paste                        → SNIPPETS-RAPIDOS
```

---

## 📈 Próximos Pasos

1. ✅ Lee esta guía (5 min)
2. ✅ Consulta DESIGN-SYSTEM-INDEX.md (5 min)
3. ✅ Revisa ejemplos existentes (10 min)
4. 🚀 **Comienza tu implementación** (1-2 horas)

---

## 📌 Recordar

- Todos los componentes están tipados en TypeScript
- Soporte dark mode incluido
- Responsive (mobile-first)
- Accesibilidad integrada
- Listo para producción
- Documentado y con ejemplos

---

## 🎉 ¡Listo!

Tienes todo lo que necesitas para:
- ✅ Entender el sistema de componentes
- ✅ Crear nuevos módulos
- ✅ Mantener consistencia visual
- ✅ Acelerar desarrollo

**¡Comienza con DESIGN-SYSTEM-INDEX.md →**

---

**Última actualización:** 2024-12-04
**Estado:** ✅ Documentación completa y lista
**Componentes:** 12 disponibles
**Ejemplos:** Recepción completamente implementada
