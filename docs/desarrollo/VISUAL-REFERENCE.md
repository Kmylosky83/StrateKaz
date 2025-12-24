# Referencia Visual - Componentes en Acción

## Página Completa de Recepción

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Recepción de Materias Primas                                  [Exportar]  │
│  Gestione la recepción, validación y almacenamiento              [Nueva]   │
│  [24 Total]  [2 Rechazadas]                                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Todas]  [Pendientes]  [En Proceso]  [Completadas]  [Rechazadas]        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌──────────────────────┐                        │
│  │ 📦 Pendientes       │  │ 📦 En Recepción     │  ┌──────────────────┐  │
│  │ 24                   │  │ 8                    │  │ ✅ Completadas  │  │
│  │ Por procesar         │  │ En progreso          │  │ 156              │  │
│  └──────────────────────┘  └──────────────────────┘  │ Procesadas       │  │
│                                                       └──────────────────┘  │
│  ┌──────────────────────┐  ┌──────────────────────┐                        │
│  │ ⚠️  Rechazadas      │  │ 📈 Tasa Recepción   │                        │
│  │ 2                    │  │ 94.2%                │                        │
│  │ Con problemas        │  │ +2.1% vs mes anterior│                        │
│  └──────────────────────┘  └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar...]   [Filtros (3)] [X]                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Estado ⏬]  [Proveedor ⏬]  [Materia ⏬]  [Desde 📅]  [Hasta 📅]           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Recepciones                                                   [📄 Reporte] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REC-001  │  Proveedor A    │  Sebo Animal  │  100 kg  │  Premium  │ 01d │
│           │                 │               │          │  ⏸️ Pendiente    │
│           │                 │               │          │          │ 👁️📝🗑️ │
│  ─────────┴─────────────────┴───────────────┴──────────┴──────────┴─────  │
│                                                                             │
│  REC-002  │  Proveedor B    │  Grasa Bov    │  250 kg  │  Estándar │ 02d │
│           │                 │               │          │  ✅ En Recepción │
│           │                 │               │          │          │ 👁️📝⚠️ │
│  ─────────┴─────────────────┴───────────────┴──────────┴──────────┴─────  │
│                                                                             │
│  REC-003  │  Proveedor A    │  Sebo Animal  │  150 kg  │  Baja     │ 02d │
│           │                 │               │          │  ❌ Rechazada    │
│           │                 │               │          │          │ 👁️🗑️     │
│  ─────────┴─────────────────┴───────────────┴──────────┴──────────┴─────  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Mostrando 1 - 3 de 24          [Anterior]  [Siguiente]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes Individuales

### PageHeader con PageTabs

```
┌─────────────────────────────────────────────────────────────┐
│ Recepción de Materias Primas  [ACTIVO]  [24 Pendientes]    │
│ Gestione la recepción y almacenamiento        [Exportar]    │
│                                                [+Nueva]     │
├─────────────────────────────────────────────────────────────┤
│ [📦 Todas (24)]  [⏳ Pendientes (12)]  [✅ Completadas (10)] │
└─────────────────────────────────────────────────────────────┘
```

### StatsGrid (2x2 en tablet, 4 en desktop)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ⏳ Pend.    │  │ 📦 Proceso  │  │ ✅ Complet. │  │ ⚠️  Rechaz.  │
│ 12          │  │ 8           │  │ 156         │  │ 2           │
│ +2 esta sem │  │ En progreso │  │ +10% vs ant │  │ -1 vs ant   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### FilterCard (Modo Colapsable)

```
┌────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar...]        [Filtros (3)] [X]                       │
├────────────────────────────────────────────────────────────────┤
│ [Estado ⏬]   [Proveedor ⏬]   [Materia ⏬]   [Desde 📅]         │
│ [Hasta 📅]   [Calidad ⏬]                                      │
└────────────────────────────────────────────────────────────────┘
```

### FilterCard (Siempre Visible)

```
┌────────────────────────────────────────────────────────────────┐
│ Filtros                                   [Limpiar Filtros]   │
├────────────────────────────────────────────────────────────────┤
│ [Estado ⏬]   [Proveedor ⏬]   [Materia ⏬]   [Desde 📅]         │
│ [Hasta 📅]   [Calidad ⏬]                                      │
└────────────────────────────────────────────────────────────────┘
```

### DataTableCard

```
┌────────────────────────────────────────────────────────────────┐
│ Recepciones                                  [Generar Reporte] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Tabla de datos aquí]                                        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Mostrando 1 - 10 de 100          [Anterior]  [Siguiente]     │
└────────────────────────────────────────────────────────────────┘
```

### Table con Acciones

```
┌──────────────┬──────────────┬──────────────┬───────────┬──────────────┐
│ N° Recepción │ Proveedor    │ Materia Prima│ Cantidad  │ Estado       │
├──────────────┼──────────────┼──────────────┼───────────┼──────────────┤
│ REC-2024-001 │ Proveedor A  │ Sebo Animal  │ 100 kg    │ 🟡 Pendiente │
│              │              │              │           │  👁️ 📝 ⚠️ 🗑️  │
├──────────────┼──────────────┼──────────────┼───────────┼──────────────┤
│ REC-2024-002 │ Proveedor B  │ Grasa Bovina │ 250 kg    │ 🔵 En Proc.  │
│              │              │              │           │  👁️ 📝 ⚠️ 🗑️  │
├──────────────┼──────────────┼──────────────┼───────────┼──────────────┤
│ REC-2024-003 │ Proveedor A  │ Sebo Animal  │ 150 kg    │ 🔴 Rechazada │
│              │              │              │           │  👁️       🗑️  │
└──────────────┴──────────────┴──────────────┴───────────┴──────────────┘
```

---

## Buttons y Variantes

```
┌─────────────────────────────────────────────────────────────┐
│                        BUTTONS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Primary] [Secondary] [Danger] [Ghost] [Outline]         │
│                                                             │
│  [+ Nueva]  [🔍 Buscar]  [↓ Exportar]  [x] [⚙️]           │
│                                                             │
│  Sizes: [sm] [md] [lg]                                    │
│                                                             │
│  Estados: [Normal] [Hover] [Disabled] [Loading ⏳]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Badges y Estados

```
┌──────────────────────────────────────────────────────────┐
│                    ESTADOS RECEPCIÓN                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🟡 Pendiente      ← Naranja (Warning)                 │
│  🔵 En Recepción   ← Azul (Primary)                    │
│  ✅ Completada     ← Verde (Success)                   │
│  ❌ Rechazada      ← Rojo (Danger)                     │
│                                                          │
│                    CALIDAD                              │
│                                                          │
│  PREMIUM    ← Azul                                      │
│  ESTÁNDAR   ← Azul                                      │
│  BAJA       ← Azul                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Modal - Crear Recepción

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                [x] ║
║ Nueva Recepción de Materia Prima                                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Información Básica                                              ║
║  ┌──────────────────────────┐  ┌──────────────────────────┐      ║
║  │ Proveedor *              │  │ Materia Prima *          │      ║
║  │ [Selecciona proveedor ⏬]│  │ [Selecciona materia ⏬]  │      ║
║  └──────────────────────────┘  └──────────────────────────┘      ║
║  ┌──────────────────────────┐  ┌──────────────────────────┐      ║
║  │ Código de Lote *         │  │ Fecha de Recepción *    │      ║
║  │ [LOTE-2024-001______]    │  │ [2024-12-04____________]│      ║
║  └──────────────────────────┘  └──────────────────────────┘      ║
║                                                                    ║
║  Cantidad                                                         ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           ║
║  │ Cantidad *   │  │ Unidad *     │  │ Calidad *    │           ║
║  │ [100_______] │  │ [kg________] │  │ [Premium__] │           ║
║  └──────────────┘  └──────────────┘  └──────────────┘           ║
║                                                                    ║
║  Pesos (Kg)                                                       ║
║  ┌──────────────────────────┐  ┌──────────────────────────┐      ║
║  │ Peso Neto *              │  │ Peso Bruto *             │      ║
║  │ [100.50________________] │  │ [102.00________________] │      ║
║  └──────────────────────────┘  └──────────────────────────┘      ║
║                                                                    ║
║  Condiciones                                                      ║
║  ┌──────────────┐  ┌──────────────┐                             ║
║  │ Temp (°C)    │  │ Humedad (%)  │                             ║
║  │ [25.5______] │  │ [65.0______] │                             ║
║  └──────────────┘  └──────────────┘                             ║
║                                                                    ║
║  Observaciones                                                    ║
║  ┌────────────────────────────────────────────────────────┐      ║
║  │ [Notas adicionales sobre la recepción...]             │      ║
║  │                                                        │      ║
║  │                                                        │      ║
║  └────────────────────────────────────────────────────────┘      ║
║                                                                    ║
║                              [Cancelar] [Crear Recepción]        ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Modal - Rechazar Recepción

```
╔════════════════════════════════════════════════════════════╗
║                                                        [x] ║
║ Rechazar Recepción                                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Motivo del rechazo para REC-2024-002:                   ║
║                                                            ║
║  ┌─────────────────────────────────────────────────────┐  ║
║  │ Explique el motivo del rechazo...                  │  ║
║  │                                                     │  ║
║  │                                                     │  ║
║  │                                                     │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                            ║
║                      [Cancelar] [Rechazar]               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## Estructura de Carpetas

```
frontend/src/features/recepcion/
│
├── components/
│   ├── RecepcionStatusBadge.tsx      [Badge de estado]
│   ├── RecepcionTable.tsx             [Tabla con acciones]
│   ├── RecepcionForm.tsx              [Modal crear/editar]
│   └── RecepcionDetailModal.tsx       [Modal detalles]
│
├── hooks/
│   └── useRecepcion.ts                [API queries]
│
├── pages/
│   └── RecepcionPage.tsx              [Página principal]
│
├── types/
│   └── recepcion.types.ts             [TypeScript types]
│
└── index.ts                           [Exports]
```

---

## Colores del Proyecto

```
Primary:   #3B82F6 (Azul)      - Acciones, links
Success:   #10B981 (Verde)     - Completado, éxito
Warning:   #F59E0B (Naranja)   - Pendiente, advertencia
Danger:    #EF4444 (Rojo)      - Error, rechazo
Info:      #0EA5E9 (Celeste)   - Información
Gray:      #6B7280 (Gris)      - Neutral

Dark Mode: Inverso automático con Tailwind dark:
```

---

## Responsive Design

```
MOBILE (0-640px)
┌───────────────┐
│ PageHeader    │  1 columna
│ StatsGrid     │
│ FilterCard    │
│ DataTableCard │
└───────────────┘

TABLET (640-1024px)
┌───────────────────────┐
│ PageHeader            │  2 columnas
│ ┌─────────┬─────────┐ │
│ │  Stat   │  Stat   │ │
│ └─────────┴─────────┘ │
│ FilterCard            │
│ DataTableCard         │
└───────────────────────┘

DESKTOP (1024px+)
┌───────────────────────────────────────┐
│ PageHeader                            │  4 columnas
│ ┌─────┬─────┬─────┬─────┐           │
│ │Stat │Stat │Stat │Stat │           │
│ └─────┴─────┴─────┴─────┘           │
│ FilterCard                            │
│ DataTableCard                         │
└───────────────────────────────────────┘
```

---

## Iconos Recomendados (lucide-react)

```
Acciones:
  Plus              [+]      Crear nuevo
  Edit2             [✏️]     Editar
  Trash2            [🗑️]     Eliminar
  Eye               [👁️]     Ver detalles
  Download          [⬇️]     Descargar/Exportar
  AlertCircle       [⚠️]     Rechazar/Alerta

Estados:
  Clock             [⏳]     Pendiente
  Package           [📦]     En proceso/Recepción
  CheckCircle2      [✅]     Completada
  AlertTriangle     [⚠️]     Error/Problema
  XCircle           [❌]     Rechazada

Información:
  Info              [i]      Información
  FileText          [📄]     Documento
  BarChart3         [📊]     Reporte
  Calendar          [📅]     Fecha
  MapPin            [📍]     Ubicación
```

---

## Notas de Implementación

- Todos los componentes están optimizados para dark mode
- Responsive automático con Tailwind (mobile-first)
- Accesibilidad incluida (labels, ARIA, etc.)
- Animaciones suaves con Tailwind transitions
- Componentes tienen tipos TypeScript completos
- Reutilizable y composable
