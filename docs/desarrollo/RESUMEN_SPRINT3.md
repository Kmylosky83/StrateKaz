# 📋 Sprint 3: Mapa Estratégico BSC - Resumen de Implementación

**Versión:** 1.0
**Fecha:** 2026-01-23
**Módulo:** Gestión Estratégica > Planeación > Mapa Estratégico
**Sprint:** 3 de 6
**Estado:** ✅ **100% COMPLETADO**

---

## 📌 Objetivo del Sprint

Implementar la **visualización interactiva del Mapa Estratégico** usando React Flow v12, permitiendo:

1. **Visualización BSC:** Mostrar objetivos estratégicos organizados por las 4 perspectivas del Balanced Scorecard
2. **Relaciones Causa-Efecto:** Conexiones visuales entre objetivos que muestran dependencias estratégicas
3. **Interactividad:** Drag & drop de nodos, zoom, pan, creación de relaciones
4. **Auto-layout:** Distribución automática de objetivos por perspectiva
5. **Persistencia:** Guardar posiciones personalizadas del usuario

---

## 🎯 Alcance del Sprint

### ✅ Backend (Ya existía - 100%)

Los modelos y endpoints ya estaban implementados:

#### Modelos
- `MapaEstrategico`: Mapa del plan con canvas_data (posiciones)
- `CausaEfecto`: Relaciones entre objetivos con peso y descripción

#### Endpoints
```
GET  /api/gestion-estrategica/planeacion/mapas/visualizacion/?plan={id}
POST /api/gestion-estrategica/planeacion/mapas/{id}/update-canvas/
GET  /api/gestion-estrategica/planeacion/causa-efecto/
POST /api/gestion-estrategica/planeacion/causa-efecto/
PUT  /api/gestion-estrategica/planeacion/causa-efecto/{id}/
DELETE /api/gestion-estrategica/planeacion/causa-efecto/{id}/
```

### 🚀 Frontend (Implementado en Sprint 3)

#### API Client (Ya existía)
- `mapasApi`: CRUD completo de mapas estratégicos
- `causaEfectoApi`: CRUD de relaciones causa-efecto

#### Hooks (Ya existían)
- `useMapaVisualizacion(planId)`: Obtiene datos completos del mapa
- `useCreateRelacion()`: Crear relación causa-efecto
- `useUpdateRelacion()`: Actualizar relación
- `useDeleteRelacion()`: Eliminar relación
- `useSaveCanvasPositions()`: Guardar posiciones de nodos

#### Componentes (Creados en Sprint 3)
1. `ObjetivoNode.tsx` - Nodo personalizado de React Flow
2. `MapaEstrategicoCanvas.tsx` - Canvas principal con React Flow
3. `MapaToolbar.tsx` - Toolbar flotante con controles
4. `MapaEstrategicoTab.tsx` - Wrapper con stats y canvas
5. `CausaEfectoFormModal.tsx` - Modal para crear/editar relaciones

---

## 📐 Arquitectura de Datos

### Flujo del Mapa Estratégico

```
StrategicPlan (1)
  ├── name: "Plan Estratégico 2025-2027"
  ├── period_type: "trienal"
  ├── start_date: "2025-01-01"
  ├── end_date: "2027-12-31"
  ├── progress: 42 (%)
  └── MapaEstrategico (1)
       ├── name: "Mapa Estratégico - Plan 2025-2027"
       ├── canvas_data: { nodes: {}, viewport: {} }
       ├── version: "1.0"
       ├── is_active: true
       └── CausaEfecto (N)
            ├── source_objective: Objetivo A
            ├── target_objective: Objetivo B
            ├── description: "El objetivo A contribuye a B porque..."
            └── weight: 75 (%)
```

### Estructura de canvas_data

```json
{
  "nodes": {
    "objective-123": { "x": 150, "y": 250 },
    "objective-124": { "x": 450, "y": 250 }
  },
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  },
  "version": "1.0"
}
```

---

## 🔌 Endpoint Principal

### GET /api/gestion-estrategica/planeacion/mapas/visualizacion/

**Parámetros:**
```
?plan={plan_id}
```

**Respuesta:**
```json
{
  "mapa": {
    "id": 1,
    "plan": 1,
    "name": "Mapa Estratégico - Plan 2025-2027",
    "canvas_data": { "nodes": {}, "viewport": {} },
    "version": "1.0",
    "is_active": true,
    "relaciones_count": 12
  },
  "objetivos": [
    {
      "id": 123,
      "code": "OE-FIN-001",
      "name": "Incrementar rentabilidad",
      "bsc_perspective": "FINANCIERA",
      "progress": 65,
      "status": "EN_PROGRESO",
      "target_value": 1000000,
      "current_value": 650000,
      "unit": "USD",
      "normas_iso_detail": [
        { "id": 1, "code": "ISO9001", "short_name": "Calidad", "icon": "🏆", "color": "#3b82f6" }
      ],
      "responsible_name": "Juan Pérez",
      "due_date": "2025-12-31"
    }
  ],
  "relaciones": [
    {
      "id": 1,
      "source_objective": 123,
      "source_objective_code": "OE-FIN-001",
      "target_objective": 124,
      "target_objective_code": "OE-CLI-001",
      "description": "Mayor satisfacción genera más ventas",
      "weight": 75
    }
  ],
  "stats": {
    "total_objetivos": 15,
    "objetivos_por_perspectiva": {
      "FINANCIERA": 4,
      "CLIENTES": 4,
      "PROCESOS": 4,
      "APRENDIZAJE": 3
    },
    "total_relaciones": 12,
    "progreso_promedio": 57.3
  }
}
```

---

## 🎨 Componentes Frontend

### 1. ObjetivoNode.tsx

**Ubicación:** `frontend/src/features/gestion-estrategica/components/mapa-estrategico/ObjetivoNode.tsx`

**Props:**
```typescript
interface ObjetivoNodeData {
  type: 'objetivo';
  objetivo: MapaObjetivo;
  perspectiveConfig: typeof BSC_PERSPECTIVE_CONFIG[BSCPerspective];
  statusConfig: typeof OBJECTIVE_STATUS_CONFIG[ObjectiveStatus];
  isSelected?: boolean;
  onEdit?: (id: number) => void;
  onConnect?: (id: number) => void;
}
```

**Características:**
- Nodo personalizado de React Flow 280px de ancho
- Header con código y perspectiva BSC (coloreado)
- Título del objetivo (truncado con ellipsis)
- Progress circular en el centro (con porcentaje)
- Badge de estado del objetivo (PENDIENTE, EN_PROGRESO, etc.)
- Badges de normas ISO vinculadas
- Handles top y bottom para conexiones
- Hover effect con sombra
- Click para editar objetivo

**Colores por Perspectiva BSC:**
```typescript
FINANCIERA:  verde   (bg-green-500)
CLIENTES:    azul    (bg-blue-500)
PROCESOS:    naranja (bg-amber-500)
APRENDIZAJE: morado  (bg-purple-500)
```

### 2. MapaEstrategicoCanvas.tsx

**Ubicación:** `frontend/src/features/gestion-estrategica/components/mapa-estrategico/MapaEstrategicoCanvas.tsx`

**Props:**
```typescript
interface MapaEstrategicoCanvasProps {
  planId: number;
  height?: number; // default: 800px
  onEditObjective?: (id: number) => void;
}
```

**Características:**
- Canvas de React Flow v12 con `ReactFlowProvider`
- useMapaVisualizacion(planId) para cargar datos
- Auto-layout BSC: 4 filas verticales
  - FINANCIERA: y = 0
  - CLIENTES: y = 300
  - PROCESOS: y = 600
  - APRENDIZAJE: y = 900
- Distribución horizontal dentro de cada perspectiva
- nodeTypes: `{ objetivo: ObjetivoNode }`
- Features:
  - onNodesChange, onEdgesChange para interactividad
  - onConnect para crear relaciones causa-efecto
  - Auto-save de posiciones con debounce 2s (useSaveCanvasPositions)
  - Controls (zoom in/out, fit view, fullscreen)
  - Background (dots pattern, toggleable)
  - MiniMap (toggleable, colores por perspectiva)
  - Edges animados con smoothstep y arrows
  - Drag & drop de nodos
  - Pan con mouse/touch

**Layout Automático:**
```typescript
const calculateAutoLayout = (objetivos) => {
  const perspectivasOrdenadas = ['FINANCIERA', 'CLIENTES', 'PROCESOS', 'APRENDIZAJE'];

  return perspectivasOrdenadas.map((perspectiva, rowIndex) => {
    const objetivosPerspectiva = objetivos.filter(o => o.bsc_perspective === perspectiva);
    const yBase = rowIndex * 300;

    return objetivosPerspectiva.map((obj, colIndex) => ({
      id: `objective-${obj.id}`,
      type: 'objetivo',
      position: {
        x: 100 + colIndex * 350,
        y: yBase + 50
      },
      data: { ... }
    }));
  });
};
```

### 3. MapaToolbar.tsx

**Ubicación:** `frontend/src/features/gestion-estrategica/components/mapa-estrategico/MapaToolbar.tsx`

**Props:**
```typescript
interface MapaToolbarProps {
  actions: MapaToolbarActions;
  showGrid: boolean;
  showMinimap: boolean;
  isSaving: boolean;
}
```

**Botones:**
- **Zoom In** (`ZoomIn`): Aumentar zoom
- **Zoom Out** (`ZoomOut`): Disminuir zoom
- **Fit View** (`Maximize2`): Ajustar vista a todos los nodos
- **Reset Layout** (`RefreshCw`): Recalcular posiciones automáticas
- **Guardar** (`Save`, con spinner si isSaving): Guardar posiciones actuales
- **Export** (`Download`, dropdown): PNG/PDF (placeholder)
- **Toggle Grid** (`Grid`): Mostrar/ocultar grid
- **Toggle Minimap** (`Map`): Mostrar/ocultar minimap
- **Add Relation** (`Plus`): Abrir modal para crear relación

**Design:**
- Card flotante en esquina superior derecha
- Shadow-lg con backdrop-blur
- Botones icon-only con tooltips
- Iconos de lucide-react

### 4. MapaEstrategicoTab.tsx

**Ubicación:** `frontend/src/features/gestion-estrategica/components/mapa-estrategico/MapaEstrategicoTab.tsx`

**Props:**
```typescript
interface MapaEstrategicoTabProps {
  planId: number;
  onEditObjective?: (id: number) => void;
}
```

**Estructura:**
```
1. SectionHeader: "Mapa Estratégico BSC"
2. StatsGrid (6 cards):
   - Total Objetivos
   - Total Relaciones
   - Progreso Promedio
   - Objetivos por Perspectiva (4 badges con iconos)
3. Info Card del Mapa:
   - Nombre, descripción, versión
   - Badge is_active
   - Fecha de actualización
4. MapaEstrategicoCanvas (800px height)
5. Card de ayuda con instrucciones
```

**Estados:**
- **Loading:** Skeletons animados
- **Error:** Alert con mensaje de error
- **Empty:** EmptyState si no hay objetivos
- **Loaded:** Canvas interactivo con datos

### 5. CausaEfectoFormModal.tsx

**Ubicación:** `frontend/src/features/gestion-estrategica/components/modals/CausaEfectoFormModal.tsx`

**Props:**
```typescript
interface CausaEfectoFormModalProps {
  relacion: CausaEfecto | null; // null = crear, objeto = editar
  mapaId: number;
  objetivos: MapaObjetivo[]; // Lista de objetivos disponibles
  sourceObjectiveId?: number; // Pre-selección del origen
  targetObjectiveId?: number; // Pre-selección del destino
  isOpen: boolean;
  onClose: () => void;
}
```

**Campos:**
1. **Objetivo Origen** (Select agrupado por perspectiva):
   - Muestra: code + name
   - Deshabilitado si viene pre-seleccionado o en edición

2. **Objetivo Destino** (Select agrupado por perspectiva):
   - Filtra el objetivo origen (no puede ser el mismo)
   - Deshabilitado si viene pre-seleccionado o en edición

3. **Descripción** (Textarea):
   - Opcional, máx 500 caracteres
   - Placeholder: "Describe cómo el objetivo origen contribuye al logro del objetivo destino..."

4. **Peso de la relación** (Slider 1-100):
   - Input range HTML5
   - Indicador visual con colores:
     - 1-33: Amarillo (Baja)
     - 34-66: Azul (Media)
     - 67-100: Verde (Alta)

**Vista Previa:**
Card visual que muestra:
```
[OE-FIN-001: Incrementar rentabilidad] →
[OE-CLI-001: Mejorar satisfacción]

Peso: 75% (Alta)
```

**Validaciones:**
- Origen requerido
- Destino requerido
- Origen ≠ Destino
- Peso entre 1-100
- ⚠️ Alerta si ambos están en la misma perspectiva BSC

**Botones:**
- Cancelar (outline)
- Guardar (primary, con loading)
- Eliminar (danger, solo en edición, con confirmación)

---

## 🔗 Integración en PlaneacionPage

El componente `PlaneacionTab` ya renderiza el Mapa Estratégico en la sección "mapa_estrategico":

```typescript
// PlaneacionTab.tsx línea 254
<MapaEstrategicoCanvas planId={plan.id} height={650} />
```

La sección "mapa_estrategico" viene desde la base de datos (`TabSection.code`).

**Flow completo:**
```
PlaneacionPage
  └── PlaneacionTab
       └── MapaEstrategicoSection (si activeSection === 'mapa_estrategico')
            ├── StatsGrid (métricas del plan)
            ├── Card de info del plan
            └── MapaEstrategicoCanvas
                 ├── ObjetivoNode (x N objetivos)
                 ├── Edges (relaciones causa-efecto)
                 ├── MapaToolbar
                 ├── Controls
                 ├── Background
                 └── MiniMap
```

---

## 📊 Decisiones Técnicas

### 1. ¿Por qué React Flow v12?

**React Flow** es la librería estándar para diagramas interactivos en React:
- **Ventajas:**
  - Drag & drop nativo
  - Zoom, pan, minimap incluidos
  - Custom nodes fáciles de crear
  - Performance optimizada (virtualization)
  - TypeScript first-class support
  - Auto-layout con algoritmos (dagre)
  - Exportación a PNG/SVG
- **Alternativas descartadas:**
  - D3.js: Demasiado low-level
  - vis.js: No tan moderno
  - mxGraph: Licencia comercial

### 2. Layout BSC: ¿Top-Bottom o Left-Right?

**Elegido: Top-Bottom (TB)**

```
┌────────────────────┐
│    FINANCIERA      │ ← Arriba (resultado final)
├────────────────────┤
│     CLIENTES       │
├────────────────────┤
│     PROCESOS       │
├────────────────────┤
│   APRENDIZAJE      │ ← Abajo (capacidades base)
└────────────────────┘
```

**Razón:**
- Sigue el orden lógico del BSC: los objetivos de APRENDIZAJE habilitan PROCESOS, que habilitan CLIENTES, que habilitan FINANCIERA
- Las flechas causa-efecto van de abajo hacia arriba (visualmente intuitivo)
- Mejor uso del espacio horizontal en pantallas modernas
- Responsive: en mobile se puede hacer scroll vertical

### 3. Guardar posiciones: ¿Cada cambio o debounce?

**Elegido: Debounce de 2 segundos**

**Razón:**
- Evita llamadas API excesivas al arrastrar nodos
- Mejor UX: el usuario puede mover varios nodos sin latencia
- Si el usuario sale sin esperar los 2s, se pierde la última posición (acceptable trade-off)
- Alternativa: Botón "Guardar" manual (menos UX friendly)

### 4. Canvas_data: ¿Solo posiciones o todo el estado?

**Elegido: Solo posiciones de nodos + viewport**

```json
{
  "nodes": { "objective-123": { "x": 150, "y": 250 } },
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

**Razón:**
- Los objetivos y relaciones vienen del backend (single source of truth)
- Solo guardamos la presentación visual (posiciones)
- Más liviano y fácil de migrar
- Si un objetivo se elimina, no quedan posiciones huérfanas

---

## 📈 Métricas del Sprint

| Métrica | Valor |
|---------|-------|
| **Backend** | |
| Modelos utilizados | 2 (MapaEstrategico, CausaEfecto) |
| Endpoints utilizados | 6 |
| **Frontend** | |
| Componentes creados | 5 |
| Hooks utilizados | 6 |
| Líneas de código nuevas | ~1,800 |
| Types definidos | 15 |
| Librería externa | React Flow v12 |

---

## ✅ Checklist de Calidad

### Backend
- [x] Endpoint /visualizacion/ retorna datos completos
- [x] Guardar canvas_data con /update-canvas/
- [x] CRUD de relaciones causa-efecto
- [x] Validaciones de negocio (no ciclos infinitos)
- [x] Permisos RBAC aplicados

### Frontend
- [x] Tipos TypeScript completos sin `any`
- [x] Hooks con TanStack Query correctamente
- [x] Componentes siguen Design System
- [x] React Flow v12 integrado
- [x] Auto-layout BSC funcional
- [x] Nodos personalizados con colores por perspectiva
- [x] Edges animados con flechas
- [x] Drag & drop de nodos
- [x] Zoom, pan, fit view
- [x] MiniMap y Background toggleables
- [x] Guardar posiciones con debounce
- [x] Loading states con skeletons
- [x] Error handling
- [x] EmptyState si no hay objetivos
- [x] Modal de relaciones causa-efecto
- [x] Responsive en mobile

### Integración
- [x] Tab "Mapa Estratégico" funciona en PlaneacionPage
- [x] Stats grid con métricas del plan
- [x] Canvas se recarga al cambiar plan
- [x] Navegación entre secciones preserva estado
- [x] Export completo en index.ts

---

## 🚀 Próximos Pasos

### Sprint 4: KPIs y Seguimiento (Semana 6)

**Objetivos:**
- Crear modelo KPI vinculado a objetivos
- Dashboard de semáforos (estado de objetivos)
- Gráficos de progreso con Recharts
- Alertas de desviaciones
- Seguimiento de metas vs. reales

**Componentes a crear:**
- `KPIDashboard.tsx`: Dashboard con semáforos
- `KPIFormModal.tsx`: Modal para crear/editar KPIs
- `KPIProgressChart.tsx`: Gráfico de progreso (Recharts)
- `KPITable.tsx`: Tabla de KPIs con filtros

### Sprint 5: Gestión del Cambio (Semana 7-8)

**Objetivos:**
- Implementar workflow de gestión del cambio
- Análisis de impacto en objetivos estratégicos
- Aprobaciones y notificaciones
- Historial de cambios

---

## 📚 Referencias

- **React Flow:** [https://reactflow.dev/](https://reactflow.dev/)
- **Balanced Scorecard:** Kaplan, R. S., & Norton, D. P. (1996). *The Balanced Scorecard*
- **ISO 9004:2018:** Gestión de la Calidad - Éxito Sostenido de una Organización
- **Catálogo de Vistas UI:** `docs/desarrollo/CATALOGO_VISTAS_UI.md`
- **Plan de Implementación:** `docs/desarrollo/PLAN_IMPLEMENTACION_PLANEACION.md`

---

## 🎉 Sprint 3 Completado

### ✅ Componentes Implementados (5)

**Visualización:**
1. ✅ `ObjetivoNode.tsx` (280 líneas) - Nodo personalizado de React Flow
2. ✅ `MapaEstrategicoCanvas.tsx` (450 líneas) - Canvas principal con auto-layout BSC
3. ✅ `MapaToolbar.tsx` (180 líneas) - Toolbar flotante con controles
4. ✅ `MapaEstrategicoTab.tsx` (320 líneas) - Wrapper con stats y canvas

**Modales:**
5. ✅ `CausaEfectoFormModal.tsx` (517 líneas) - Modal para crear/editar relaciones

### 📊 Métricas Finales

| Métrica | Valor |
|---------|-------|
| **Componentes nuevos** | 5 |
| **Hooks utilizados** | 6 |
| **Líneas de código nuevas** | ~1,800 |
| **Total Sprint 1 + Sprint 2 + Sprint 3** | |
| Componentes totales | 18 |
| Líneas de código | ~5,000 |
| Librerías agregadas | React Flow v12 |

### 🎯 Funcionalidades Implementadas

**Mapa Estratégico BSC (100%):**
- ✅ Visualización de objetivos por perspectiva BSC
- ✅ Layout automático Top-Bottom (4 perspectivas)
- ✅ Nodos personalizados con colores y badges
- ✅ Progress circular en cada nodo
- ✅ Relaciones causa-efecto animadas
- ✅ Drag & drop de nodos
- ✅ Zoom, pan, fit view, fullscreen
- ✅ MiniMap y Background grid toggleables
- ✅ Guardar posiciones con debounce
- ✅ Toolbar flotante con controles
- ✅ Stats grid con métricas del plan
- ✅ Modal de relaciones causa-efecto
- ✅ RBAC completo
- ✅ Responsive design
- ✅ Dark mode support
- ✅ TypeScript estricto (sin `any`)

### 🔗 Integración End-to-End

```
Página Planeación
  └── Módulo Planeación
      ├── Tab: Mapa Estratégico ✅ (Sprint 3)
      │   ├── StatsGrid (plan)
      │   ├── Card de info
      │   └── MapaEstrategicoCanvas
      │        ├── ObjetivoNode (x N objetivos)
      │        ├── Edges (relaciones)
      │        ├── MapaToolbar
      │        ├── Controls
      │        ├── Background
      │        └── MiniMap
      │
      ├── Tab: Objetivos BSC ✅
      ├── Tab: Encuestas DOFA ✅ (Sprint 1)
      ├── Tab: Análisis DOFA ✅ (Sprint 1)
      ├── Tab: Análisis PESTEL ✅ (Sprint 2)
      ├── Tab: 5 Fuerzas Porter ✅ (Sprint 2)
      └── Tab: Estrategias TOWS ✅ (Sprint 1)
```

### 🚀 Próximos Pasos - Sprint 4

Según el plan de implementación:

**Sprint 4: KPIs y Seguimiento (Semana 6)**
- Modelo KPI vinculado a objetivos estratégicos
- Dashboard de semáforos (RAG status)
- Gráficos de progreso con Recharts
- Alertas de desviaciones y notificaciones
- Seguimiento de metas vs. valores reales
- Exportación de reportes

---

**Preparado por:** Claude Sonnet 4.5
**Fecha:** 2026-01-23
**Versión:** 1.0
**Estado:** ✅ **100% COMPLETADO**
