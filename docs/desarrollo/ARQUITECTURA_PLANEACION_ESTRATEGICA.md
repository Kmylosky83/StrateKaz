# 🎯 Arquitectura del Módulo: Planeación Estratégica

**Versión:** 1.0
**Fecha:** 2026-01-23
**Estado:** 🔄 En Desarrollo Activo

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura Backend](#arquitectura-backend)
4. [Arquitectura Frontend](#arquitectura-frontend)
5. [Flujo de Datos](#flujo-de-datos)
6. [Dependencias entre Apps](#dependencias-entre-apps)
7. [Plan de Implementación](#plan-de-implementación)

---

## 🎨 Visión General

### Objetivo del Módulo

Crear un **sistema completo de Planeación Estratégica** que permite:

1. **Análisis de Contexto** (ISO 9001 Cláusula 4.1-4.2)
   - Partes Interesadas
   - Análisis PESTEL
   - Análisis DOFA
   - 5 Fuerzas de Porter

2. **Formulación Estratégica**
   - Matriz TOWS (DOFA Cruzado)
   - Objetivos Estratégicos BSC
   - Mapa Estratégico Visual

3. **Operacionalización**
   - KPIs por Objetivo
   - Mediciones Periódicas
   - Semáforos de Desempeño

4. **Ejecución**
   - Gestión del Cambio
   - **Proyectos PMI** (siguiente fase)

---

## 🛠️ Stack Tecnológico

### Backend

```python
# Framework Base
Django 5.0.9
Django REST Framework 3.14.0
MySQL 8.0+

# Validación y Serialización
django-filter 24.2        # Filtros avanzados
drf-spectacular 0.27.0    # OpenAPI 3.0 docs
```

### Frontend - Las Mejores Tecnologías 2026

```json
{
  "framework": "React 18.3 + TypeScript 5.3",
  "state": {
    "client": "Zustand 4.4",
    "server": "TanStack Query v5.90",
    "forms": "React Hook Form 7.66 + Zod 3.22"
  },
  "ui": {
    "styling": "Tailwind CSS 3.4",
    "animation": "Framer Motion 11.x",
    "icons": "Lucide React 0.468",
    "charts": "Recharts 2.10 + Chart.js 4.x",
    "dataDisplay": {
      "tables": "TanStack Table v8.20",
      "drag": "dnd-kit 6.1.0",
      "virtualizer": "TanStack Virtual v3"
    }
  },
  "visualizations": {
    "strategicMap": "React Flow 11.11 (CRÍTICO)",
    "matrixView": "React Grid Layout 1.4",
    "mindMap": "React Flow + dagre 0.8"
  },
  "utilities": {
    "dates": "date-fns 3.0",
    "validation": "Zod 3.22",
    "toast": "Sonner 1.3"
  }
}
```

### 🌟 Librerías Destacadas para UI Impresionante

#### 1. **React Flow 11.11** (Mapa Estratégico)
```bash
npm install reactflow
```
**¿Por qué?**
- Canvas drag & drop profesional
- Nodos personalizables
- Conexiones automáticas con flechas
- Layouting algorítmico (dagre, elkjs)
- Minimap incluido
- Performance optimizado (100k+ nodos)

**Uso:**
- Mapa Estratégico con relaciones causa-efecto
- Visualización de objetivos BSC
- Flujo de estrategias TOWS → Objetivos → Proyectos

#### 2. **TanStack Table v8.20** (Tablas Avanzadas)
```bash
npm install @tanstack/react-table
```
**¿Por qué?**
- Headless (máximo control de diseño)
- Sorting, filtering, pagination nativo
- Row selection con checkboxes
- Column resizing y reordering
- Virtualización para 10k+ filas
- TypeScript first

**Uso:**
- Lista de Objetivos Estratégicos
- Tabla de KPIs con semáforos
- Matriz TOWS con celdas editables

#### 3. **dnd-kit 6.1.0** (Drag & Drop)
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
**¿Por qué?**
- Más moderno que react-beautiful-dnd
- Accesibilidad nativa (ARIA)
- Touch support (móvil)
- Sensores personalizables
- Collision detection algorithms

**Uso:**
- Reordenar factores DOFA por prioridad
- Organizar objetivos en el Mapa Estratégico
- Drag & drop en Matriz TOWS

#### 4. **Recharts 2.10** (Gráficos)
```bash
npm install recharts
```
**¿Por qué?**
- Componentes React nativos
- Animaciones fluidas
- Responsive por defecto
- Composable (combinar gráficos)

**Uso:**
- Radar Chart para PESTEL
- Matriz de impacto (scatter plot)
- Semáforo de KPIs (gauge)
- Tendencias de mediciones (line chart)

#### 5. **Framer Motion 11.x** (Animaciones)
```bash
npm install framer-motion
```
**¿Por qué?**
- Animaciones declarativas
- Layout animations automáticas
- Gestures (drag, hover, tap)
- Variants para estados complejos
- Performance optimizado (60fps)

**Uso:**
- Transiciones entre tabs
- Animaciones de modales
- Hover effects en Mapa Estratégico
- Drag & drop visual feedback

---

## 🏗️ Arquitectura Backend

### Estructura de Apps Django

```
backend/apps/gestion_estrategica/
├── planeacion/                          # APP PRINCIPAL
│   ├── __init__.py
│   ├── models.py                        # StrategicPlan, StrategicObjective, KPI, GestionCambio
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── filters.py                       # django-filter para búsquedas avanzadas
│   ├── permissions.py                   # RBAC personalizado
│   │
│   ├── contexto/                        # SUB-APP: Análisis de Contexto
│   │   ├── __init__.py
│   │   ├── models.py                    # DOFA, PESTEL, Porter, TOWS
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py                  # Lógica de negocio (generar TOWS automático)
│   │
│   ├── stakeholders/                    # SUB-APP: Partes Interesadas (MOVIDO)
│   │   ├── __init__.py
│   │   ├── models.py                    # ParteInteresada, Requisitos, Comunicación
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── mapa_estrategico/                # SUB-APP: Mapa Estratégico
│   │   ├── __init__.py
│   │   ├── models.py                    # MapaEstrategico, CausaEfecto
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py                  # Auto-layout con dagre
│   │
│   └── migrations/
│
├── gestion_proyectos/                   # APP SEPARADA (siguiente fase)
│   ├── models.py                        # Portfolio, Program, Project (PMI)
│   └── ...
│
├── configuracion/                       # YA EXISTE ✅
│   └── models.py                        # EmpresaConfig, NormaISO, TipoCambio
│
├── organizacion/                        # YA EXISTE ✅
│   └── models.py                        # Area, Cargo
│
└── identidad/                           # YA EXISTE ✅
    └── models.py                        # Mision, Vision, Valores, Politicas
```

---

## 🔗 Dependencias entre Apps (Sin Ciclos)

### Diagrama de Dependencias

```
┌─────────────────────────────────────────────────────────────┐
│                    NIVEL 0: CORE                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  User    │  │   RBAC   │  │  Cargo   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
              ▲                ▲                ▲
              │                │                │
┌─────────────┼────────────────┼────────────────┼─────────────┐
│             │   NIVEL 1: GESTIÓN ESTRATÉGICA  │             │
│  ┌──────────┴──────────┐  ┌─────────────────┴──────┐       │
│  │  Configuración      │  │  Organización          │       │
│  │  - EmpresaConfig    │  │  - Area                │       │
│  │  - NormaISO         │  │  - Cargo               │       │
│  │  - TipoCambio       │  │  - Organigrama         │       │
│  └─────────────────────┘  └────────────────────────┘       │
│            ▲                        ▲                       │
│            │                        │                       │
│  ┌─────────┴────────────────────────┴─────────┐            │
│  │          Identidad                         │            │
│  │          - Mision, Vision, Valores         │            │
│  │          - Politicas                       │            │
│  └────────────────────────────────────────────┘            │
│                      ▲                                      │
│                      │                                      │
│  ┌───────────────────┴──────────────────────────────────┐  │
│  │              PLANEACIÓN                              │  │
│  │  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  Stakeholders    │  │  Contexto        │         │  │
│  │  │  - ParteInter... │  │  - DOFA          │         │  │
│  │  │  - Requisitos    │  │  - PESTEL        │         │  │
│  │  └──────────────────┘  │  - Porter        │         │  │
│  │           ▲             │  - TOWS          │         │  │
│  │           │             └─────────┬────────┘         │  │
│  │           │                       │                  │  │
│  │  ┌────────┴───────────────────────┴────────────┐    │  │
│  │  │     StrategicPlan + Objectives              │    │  │
│  │  │     - Plan                                  │    │  │
│  │  │     - Objectives (BSC)                      │    │  │
│  │  │     - KPIs                                  │    │  │
│  │  │     - Mediciones                            │    │  │
│  │  └─────────────┬───────────────────────────────┘    │  │
│  │                │                                     │  │
│  │  ┌─────────────┴───────────────────────────────┐    │  │
│  │  │     MapaEstrategico + CausaEfecto          │    │  │
│  │  └─────────────┬───────────────────────────────┘    │  │
│  │                │                                     │  │
│  │  ┌─────────────┴───────────────────────────────┐    │  │
│  │  │         GestionCambio                       │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      │
                      │
┌─────────────────────┴─────────────────────────────────────┐
│             NIVEL 1B: PROYECTOS (siguiente fase)          │
│  ┌──────────────────────────────────────────────────┐    │
│  │         Gestion Proyectos                        │    │
│  │         - Portfolio, Program, Project            │    │
│  │         - Consume: StrategicObjective, Cambios   │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

### Reglas de Dependencias

#### ✅ Permitido (Hacia arriba o lateral)

```python
# planeacion/stakeholders/models.py
from apps.core.models import User, Cargo
from apps.gestion_estrategica.organizacion.models import Area  # ✅ Lateral permitido

# planeacion/contexto/models.py
from apps.gestion_estrategica.organizacion.models import Area  # ✅ Lateral permitido

# planeacion/models.py (StrategicObjective)
from apps.gestion_estrategica.configuracion.models import NormaISO  # ✅ Lateral permitido
from apps.gestion_estrategica.organizacion.models import Area      # ✅ Lateral permitido
from apps.core.models import User, Cargo                          # ✅ Hacia arriba
```

#### ❌ PROHIBIDO (Hacia abajo - crea ciclos)

```python
# ❌ NUNCA HACER ESTO en configuracion/models.py:
from apps.gestion_estrategica.planeacion.models import StrategicObjective

# ❌ NUNCA HACER ESTO en organizacion/models.py:
from apps.gestion_estrategica.planeacion.contexto.models import FactorDOFA
```

#### 🔧 Solución: Relaciones Inversas

```python
# En configuracion/models.py
class NormaISO(models.Model):
    # NO importar StrategicObjective
    # La relación se define en StrategicObjective con related_name
    pass

# En organizacion/models.py
class Area(models.Model):
    # Acceder a objetivos relacionados:
    # area.objetivos_estrategicos.all()  # ✅ Via related_name
    # area.factores_dofa.all()           # ✅ Via related_name
    pass
```

---

## 🎨 Arquitectura Frontend

### Estructura de Features

```
frontend/src/features/gestion-estrategica/
├── api/
│   ├── strategicApi.ts              # ✅ YA EXISTE
│   ├── contextoApi.ts               # 🔄 EN DESARROLLO
│   ├── stakeholdersApi.ts           # 🆕 NUEVO
│   ├── mapaEstrategicoApi.ts        # 🔄 EN DESARROLLO
│   └── kpisApi.ts                   # 🆕 NUEVO
│
├── components/
│   ├── PlaneacionTab.tsx            # ✅ YA EXISTE
│   │
│   ├── contexto/                    # 🆕 NUEVA CARPETA
│   │   ├── StakeholdersSection.tsx
│   │   │   ├── StakeholdersTable.tsx
│   │   │   ├── StakeholderFormModal.tsx
│   │   │   ├── StakeholderMatrix.tsx       # Matriz Influencia/Interés
│   │   │   └── RequisitosList.tsx
│   │   │
│   │   ├── DOFASection.tsx
│   │   │   ├── DOFAMatrix.tsx              # Matriz 2x2 interactiva
│   │   │   ├── FactorFormModal.tsx
│   │   │   ├── DOFADragDrop.tsx            # Reordenar con dnd-kit
│   │   │   └── DOFACharts.tsx              # Gráficos de impacto
│   │   │
│   │   ├── PESTELSection.tsx
│   │   │   ├── PESTELRadarChart.tsx        # Radar de 6 dimensiones
│   │   │   ├── FactorPESTELList.tsx
│   │   │   ├── FactorPESTELFormModal.tsx
│   │   │   └── PESTELHeatmap.tsx           # Mapa de calor Impacto/Prob
│   │   │
│   │   ├── PorterSection.tsx
│   │   │   ├── PorterDiagram.tsx           # Diagrama 5 fuerzas
│   │   │   ├── FuerzaCard.tsx
│   │   │   └── FuerzaFormModal.tsx
│   │   │
│   │   └── TOWSSection.tsx
│   │       ├── TOWSMatrix.tsx              # Matriz TOWS 2x2
│   │       ├── TOWSCell.tsx                # Celda editable (FO, FA, DO, DA)
│   │       ├── EstrategiaFormModal.tsx
│   │       └── ConvertToObjectiveButton.tsx # Crear objetivo desde estrategia
│   │
│   ├── objetivos/                   # 🆕 NUEVA CARPETA
│   │   ├── ObjectivesSection.tsx
│   │   ├── ObjectivesTable.tsx             # TanStack Table
│   │   ├── ObjectiveFormModal.tsx          # ✅ YA EXISTE (mejorar)
│   │   ├── ObjectiveCard.tsx
│   │   ├── BSCPerspectiveFilter.tsx
│   │   └── ObjectiveKanban.tsx             # Vista Kanban por estado
│   │
│   ├── mapa-estrategico/            # 🔄 EN DESARROLLO
│   │   ├── MapaEstrategicoCanvas.tsx       # React Flow canvas
│   │   ├── ObjectiveNode.tsx               # Nodo personalizado
│   │   ├── CausaEfectoEdge.tsx            # Arista personalizada
│   │   ├── BSCLanes.tsx                    # 4 perspectivas como swimlanes
│   │   ├── MapaControls.tsx                # Zoom, fit view, layout
│   │   ├── MapaMinimap.tsx                 # Minimapa
│   │   └── RelacionFormModal.tsx           # Crear relación causa-efecto
│   │
│   ├── kpis/                        # 🆕 NUEVA CARPETA
│   │   ├── KPIsSection.tsx
│   │   ├── KPIsList.tsx
│   │   ├── KPICard.tsx
│   │   ├── KPIFormModal.tsx
│   │   ├── KPISemaforo.tsx                 # Semáforo verde/amarillo/rojo
│   │   ├── KPIDashboard.tsx                # Dashboard con gráficos
│   │   ├── MedicionFormModal.tsx
│   │   └── TrendChart.tsx                  # Gráfico de tendencia
│   │
│   └── gestion-cambio/              # 🆕 NUEVA CARPETA
│       ├── CambiosSection.tsx
│       ├── CambiosTable.tsx
│       ├── CambioFormModal.tsx
│       ├── CambioKanban.tsx                # Vista Kanban por estado
│       └── CambioTimeline.tsx              # Timeline de cambios
│
├── hooks/
│   ├── useStrategic.ts              # ✅ YA EXISTE
│   ├── useContexto.ts               # 🔄 EN DESARROLLO
│   ├── useStakeholders.ts           # 🆕 NUEVO
│   ├── useMapaEstrategico.ts        # 🔄 EN DESARROLLO
│   ├── useKPIs.ts                   # 🆕 NUEVO
│   └── useTOWSGenerator.ts          # 🆕 NUEVO (lógica TOWS automática)
│
├── types/
│   ├── strategic.types.ts           # ✅ YA EXISTE
│   ├── contexto.types.ts            # 🔄 EN DESARROLLO
│   ├── stakeholders.types.ts        # 🆕 NUEVO
│   ├── mapa-estrategico.types.ts    # 🔄 EN DESARROLLO
│   └── kpis.types.ts                # 🆕 NUEVO
│
└── pages/
    ├── PlaneacionPage.tsx           # ✅ YA EXISTE
    └── ContextoPage.tsx             # 🔄 EN DESARROLLO
```

---

## 🔄 Flujo de Datos Completo

### 1. Análisis de Contexto → Objetivos → Proyectos

```typescript
// FASE 1: Identificar Partes Interesadas
const stakeholder = {
  tipo: 'CLIENTE',
  nombre: 'Clientes Corporativos',
  nivel_influencia: 'ALTA',
  nivel_interes: 'ALTO'
}

// FASE 2: Análisis PESTEL
const factorPestel = {
  tipo: 'TECNOLOGICO',
  descripcion: 'Auge de IA en la industria',
  impacto: 'ALTO',
  probabilidad: 'ALTA'
  // → Se detecta como OPORTUNIDAD
}

// FASE 3: Análisis DOFA
const factorDofa = {
  tipo: 'FORTALEZA',
  descripcion: 'Equipo de desarrollo capacitado en IA',
  impacto: 'ALTO'
}

// FASE 4: Matriz TOWS (Cruce DOFA)
const estrategiaTows = {
  tipo: 'FO', // Fortaleza + Oportunidad
  descripcion: 'Desarrollar módulo de IA para análisis predictivo',
  objetivo: 'Capturar 30% del mercado de analytics con IA',
  estado: 'APROBADA'
}

// FASE 5: Convertir a Objetivo Estratégico
const objetivo = {
  code: 'OE-F-001',
  name: 'Lanzar módulo de IA para analytics en Q2 2026',
  bsc_perspective: 'FINANCIERA',
  target_value: 30,
  unit: '%',
  areas_responsables: ['desarrollo', 'comercial'],
  normas_iso: ['ISO_27001'] // Si aplica seguridad
}

// FASE 6: Crear KPI
const kpi = {
  name: 'Participación de mercado IA',
  formula: '(Clientes IA / Total clientes) * 100',
  target_value: 30,
  warning_threshold: 20,
  critical_threshold: 10,
  frequency: 'MENSUAL'
}

// FASE 7: Gestión del Cambio (si es complejo)
const cambio = {
  code: 'GC-001',
  title: 'Implementación de equipo de IA',
  tipo_cambio: 'TECNOLOGICO',
  priority: 'ALTA',
  status: 'PLANIFICADO',
  related_objectives: [objetivo.id]
}

// FASE 8: Proyecto PMI (siguiente fase)
const proyecto = {
  code: 'PRJ-2026-001',
  nombre: 'Desarrollo Módulo IA Analytics',
  objetivo_estrategico: objetivo.id,
  gestion_cambio: cambio.id,
  fecha_inicio: '2026-02-01',
  fecha_fin: '2026-06-30',
  presupuesto: 150000
}
```

### 2. Flujo en React Flow (Mapa Estratégico)

```typescript
// Nodos = Objetivos Estratégicos
const nodes = [
  {
    id: 'obj-1',
    type: 'objectiveNode', // Custom node
    position: { x: 100, y: 100 },
    data: {
      code: 'OE-F-001',
      name: 'Aumentar ingresos 20%',
      perspective: 'FINANCIERA',
      progress: 45,
      status: 'EN_PROGRESO'
    }
  },
  {
    id: 'obj-2',
    type: 'objectiveNode',
    position: { x: 100, y: 300 },
    data: {
      code: 'OE-C-001',
      name: 'Satisfacción cliente > 90%',
      perspective: 'CLIENTES',
      progress: 70,
      status: 'EN_PROGRESO'
    }
  }
]

// Aristas = Relaciones Causa-Efecto
const edges = [
  {
    id: 'e1-2',
    source: 'obj-2', // Causa
    target: 'obj-1', // Efecto
    type: 'causaEfectoEdge', // Custom edge
    animated: true,
    data: {
      weight: 4, // Importancia 1-5
      description: 'Clientes satisfechos generan más ingresos'
    }
  }
]
```

---

## 📊 Componentes UI Destacados

### 1. Matriz TOWS Interactiva

```typescript
// components/contexto/TOWSMatrix.tsx
<div className="grid grid-cols-3 grid-rows-3 gap-4">
  {/* Header */}
  <div className="col-start-2">Fortalezas</div>
  <div className="col-start-3">Debilidades</div>

  {/* Fila Oportunidades */}
  <div className="row-start-2">Oportunidades</div>
  <TOWSCell tipo="FO" estrategias={estrategiasFO} />
  <TOWSCell tipo="DO" estrategias={estrategiasDO} />

  {/* Fila Amenazas */}
  <div className="row-start-3">Amenazas</div>
  <TOWSCell tipo="FA" estrategias={estrategiasFA} />
  <TOWSCell tipo="DA" estrategias={estrategiasDA} />
</div>

// Cada celda permite:
// - Drag & drop de factores DOFA
// - Generar estrategias automáticas (AI-powered opcional)
// - Convertir estrategia → objetivo con 1 click
```

### 2. Mapa Estratégico con React Flow

```typescript
// components/mapa-estrategico/MapaEstrategicoCanvas.tsx
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'

const MapaEstrategicoCanvas = () => {
  return (
    <div className="h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{
          objectiveNode: ObjectiveNode // Custom node
        }}
        edgeTypes={{
          causaEfectoEdge: CausaEfectoEdge // Custom edge
        }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />

        {/* BSC Lanes (4 perspectivas) */}
        <BSCLanes />
      </ReactFlow>
    </div>
  )
}
```

### 3. Dashboard de KPIs con Semáforos

```typescript
// components/kpis/KPIDashboard.tsx
<div className="grid grid-cols-3 gap-6">
  {kpis.map(kpi => (
    <KPICard key={kpi.id}>
      <KPISemaforo
        value={kpi.last_value}
        target={kpi.target_value}
        warning={kpi.warning_threshold}
        critical={kpi.critical_threshold}
        trendType={kpi.trend_type}
      />
      <TrendChart
        measurements={kpi.measurements}
        height={200}
      />
    </KPICard>
  ))}
</div>
```

### 4. Radar Chart PESTEL

```typescript
// components/contexto/PESTELRadarChart.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts'

const data = [
  { dimension: 'Político', valor: factoresPoliticos.avgImpacto },
  { dimension: 'Económico', valor: factoresEconomicos.avgImpacto },
  { dimension: 'Social', valor: factoresSociales.avgImpacto },
  { dimension: 'Tecnológico', valor: factoresTecnologicos.avgImpacto },
  { dimension: 'Ecológico', valor: factoresEcologicos.avgImpacto },
  { dimension: 'Legal', valor: factoresLegales.avgImpacto }
]

<RadarChart width={500} height={500} data={data}>
  <PolarGrid />
  <PolarAngleAxis dataKey="dimension" />
  <Radar dataKey="valor" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
</RadarChart>
```

---

## 🚀 Plan de Implementación

### Sprint 1: Stakeholders + DOFA (Semana 1-2)

#### Backend
- [x] Mover `partes_interesadas` a `planeacion/stakeholders/`
- [ ] Crear serializers para DOFA
- [ ] ViewSets con filtros avanzados
- [ ] Endpoints REST completos
- [ ] Tests unitarios

#### Frontend
- [ ] `StakeholdersSection` con tabla TanStack
- [ ] Matriz Influencia/Interés (scatter plot)
- [ ] `DOFAMatrix` 2x2 interactiva
- [ ] Drag & drop con dnd-kit
- [ ] Formularios con React Hook Form + Zod

### Sprint 2: PESTEL + Porter (Semana 3)

#### Backend
- [ ] Serializers PESTEL y Porter
- [ ] Endpoints con agregaciones (avg impacto por dimensión)

#### Frontend
- [ ] `PESTELRadarChart` con Recharts
- [ ] Heatmap Impacto/Probabilidad
- [ ] `PorterDiagram` con 5 fuerzas visuales

### Sprint 3: Matriz TOWS (Semana 4)

#### Backend
- [ ] Serializers EstrategiaTOWS
- [ ] Servicio `generar_tows_automatico()` (IA opcional)
- [ ] Endpoint POST `/tows/convertir-objetivo/`

#### Frontend
- [ ] `TOWSMatrix` con 4 celdas editables
- [ ] Botón "Convertir a Objetivo"
- [ ] Modal de confirmación con preview

### Sprint 4: Objetivos + KPIs (Semana 5)

#### Backend
- [ ] Mejorar serializers de StrategicObjective
- [ ] CRUD completo de KPIs
- [ ] Endpoint `/kpis/{id}/mediciones/` (POST)
- [ ] Cálculo automático de semáforo

#### Frontend
- [ ] `ObjectivesTable` con TanStack Table
- [ ] `ObjectiveKanban` por estado
- [ ] `KPIDashboard` con semáforos
- [ ] `TrendChart` de mediciones

### Sprint 5: Mapa Estratégico (Semana 6-7)

#### Backend
- [ ] Serializers MapaEstrategico + CausaEfecto
- [ ] Servicio `auto_layout()` con dagre
- [ ] Endpoint `/mapa/export-image/` (screenshot)

#### Frontend
- [ ] `MapaEstrategicoCanvas` con React Flow
- [ ] Custom nodes `ObjectiveNode`
- [ ] Custom edges `CausaEfectoEdge`
- [ ] `BSCLanes` (swimlanes por perspectiva)
- [ ] Minimap + Controls
- [ ] Modal crear relación causa-efecto

### Sprint 6: Gestión del Cambio (Semana 8)

#### Backend
- [ ] Mejorar serializers GestionCambio
- [ ] Workflow de estados con validaciones

#### Frontend
- [ ] `CambiosTable` con filtros
- [ ] `CambioKanban` drag & drop de estados
- [ ] `CambioTimeline` con eventos

---

## 📦 Instalación de Dependencias Frontend

```bash
cd frontend

# Visualizaciones
npm install reactflow
npm install recharts
npm install @tanstack/react-table

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Layout algorítmico (para auto-layout del mapa)
npm install dagre
npm install @types/dagre -D

# Animaciones
npm install framer-motion

# Utilidades
npm install date-fns
npm install zod

# Ya instalados (verificar):
# - @tanstack/react-query
# - react-hook-form
# - zustand
# - lucide-react
# - sonner
```

---

## 🎯 Resultados Esperados

### UX/UI Impresionante

1. **Animaciones fluidas** con Framer Motion
2. **Drag & drop intuitivo** con dnd-kit
3. **Visualizaciones profesionales** con React Flow + Recharts
4. **Tablas avanzadas** con TanStack Table (sorting, filtering, virtualización)
5. **Feedback visual** en todas las acciones (toasts, loading states)
6. **Responsive** en mobile, tablet, desktop

### Performance

1. **Virtualización** de listas largas (TanStack Virtual)
2. **Code splitting** por sección (React.lazy)
3. **Optimistic updates** con TanStack Query
4. **Memoización** de componentes pesados (React.memo)
5. **Debouncing** en búsquedas y filtros

### Arquitectura Limpia

1. **Sin dependencias circulares** ✅
2. **Separación de concerns** (UI / Lógica / API)
3. **Type-safe** 100% con TypeScript
4. **Testeable** (hooks independientes, componentes puros)
5. **Escalable** (fácil agregar nuevas secciones)

---

## 🔗 Integración con Proyectos (Siguiente Fase)

```typescript
// Flujo: Objetivo → Proyecto
interface CreateProjectFromObjective {
  objective_id: string
  project_data: {
    nombre: string
    fecha_inicio: Date
    fecha_fin: Date
    presupuesto: number
    // ... más campos PMI
  }
}

// Endpoint backend:
POST /api/gestion-estrategica/planeacion/objetivos/{id}/crear-proyecto/

// Frontend:
<Button onClick={() => convertToProject(objetivo)}>
  <RocketIcon />
  Convertir a Proyecto PMI
</Button>
```

---

## 📚 Referencias

- **React Flow:** https://reactflow.dev/
- **TanStack Table:** https://tanstack.com/table/latest
- **dnd-kit:** https://docs.dndkit.com/
- **Recharts:** https://recharts.org/
- **Framer Motion:** https://www.framer.com/motion/

---

**Preparado por:** Claude Sonnet 4.5
**Fecha:** 2026-01-23
**Versión:** 1.0
**Estado:** 🚀 Listo para implementar
