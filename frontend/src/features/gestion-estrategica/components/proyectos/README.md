# Módulo de Gestión de Proyectos PMI - Semana 5

Este módulo implementa la gestión de proyectos siguiendo la metodología PMI (Project Management Institute), integrando las fases del ciclo de vida del proyecto con el portafolio estratégico de la organización.

## Estructura de Archivos

```
frontend/src/features/gestion-estrategica/
├── types/
│   └── proyectos.ts                    # Interfaces TypeScript
├── api/
│   └── proyectosApi.ts                 # Funciones de API
├── hooks/
│   ├── useProyectos.ts                 # Hooks React Query para proyectos
│   └── usePortafolios.ts               # Hooks React Query para portafolios
└── components/
    └── proyectos/
        ├── GestionProyectosTab.tsx     # Componente principal
        ├── PortafolioDashboard.tsx     # Dashboard de estadísticas
        ├── ProyectosKanban.tsx         # Board Kanban de proyectos
        ├── subtabs/
        │   ├── PortafolioSubTab.tsx    # Vista general y Kanban
        │   ├── IniciacionSubTab.tsx    # Fase de Iniciación
        │   ├── PlanificacionSubTab.tsx # Fase de Planificación
        │   ├── MonitoreoSubTab.tsx     # Fase de Ejecución/Monitoreo
        │   └── CierreSubTab.tsx        # Fase de Cierre
        ├── index.ts                    # Exportaciones del módulo
        └── README.md                   # Esta documentación
```

## Componentes Principales

### 1. GestionProyectosTab.tsx

Componente raíz que maneja la navegación entre las diferentes fases del proyecto.

**Props:**
- `activeSection?: string` - Código de la sección activa desde la API

**Secciones disponibles:**
- `portafolio` - Vista general del portafolio
- `iniciacion` - Proyectos en iniciación
- `planificacion` - Proyectos en planificación
- `ejecucion-monitoreo` - Proyectos en ejecución
- `cierre` - Proyectos en cierre

**Uso:**
```tsx
import { GestionProyectosTab } from '@/features/gestion-estrategica/components/proyectos';

<GestionProyectosTab activeSection="portafolio" />
```

### 2. PortafolioDashboard.tsx

Dashboard con KPIs y estadísticas del portafolio de proyectos.

**Características:**
- Métricas de portafolios y programas activos
- Estados de proyectos (propuestos, en ejecución, completados)
- Salud del portafolio (semáforo verde/amarillo/rojo)
- Presupuesto total, ejecutado y disponible
- Proyectos por prioridad

**Hooks utilizados:**
- `useProyectosDashboard()` - Obtiene estadísticas generales
- `usePortafolios()` - Lista de portafolios activos
- `useProgramas()` - Lista de programas activos

### 3. ProyectosKanban.tsx

Board Kanban interactivo para gestionar proyectos por estado.

**Características:**
- Drag & Drop entre columnas
- 7 estados del proyecto: Propuesto → Iniciación → Planificación → Ejecución → Monitoreo → Cierre → Completado
- Indicadores de salud (verde/amarillo/rojo)
- Badges de prioridad
- Información resumida: PM, fechas, presupuesto, progreso
- Contador de hitos y miembros del equipo

**Props:**
- `onProjectClick?: (proyecto: Proyecto) => void` - Callback al hacer clic en un proyecto

**Uso:**
```tsx
<ProyectosKanban
  onProjectClick={(proyecto) => console.log('Proyecto:', proyecto)}
/>
```

## SubTabs

### PortafolioSubTab.tsx

Vista general con dos tabs internos:
- **Dashboard**: Estadísticas y métricas del portafolio
- **Vista Kanban**: Board interactivo de proyectos

### IniciacionSubTab.tsx

Gestión de proyectos en fase de iniciación.

**Incluye:**
- Checklist de iniciación (Acta de constitución, Stakeholders, Objetivos, Cronograma)
- Lista de proyectos en iniciación
- Información de sponsor y project manager

### PlanificacionSubTab.tsx

Gestión de proyectos en fase de planificación.

**Incluye:**
- Áreas de conocimiento PMI (Alcance, Cronograma, Costos, Riesgos, Recursos, Calidad)
- Lista de proyectos en planificación
- Información de presupuesto, hitos, equipo y fechas

### MonitoreoSubTab.tsx

Gestión de proyectos en ejecución y monitoreo.

**Incluye:**
- Métricas EVM (Earned Value Management): PV, EV, AC, CPI/SPI
- Progreso general y por dimensión (alcance, tiempo, costo, calidad)
- Indicadores de salud del proyecto
- Información de presupuesto ejecutado vs estimado

### CierreSubTab.tsx

Gestión de proyectos en cierre y completados.

**Incluye:**
- Checklist de cierre (Acta de cierre, Lecciones aprendidas, Archivo, Liberación de recursos)
- Proyectos en proceso de cierre
- Historial de proyectos completados con métricas finales

## Tipos de Datos

### Interfaces Principales

```typescript
// Portafolio
interface Portafolio {
  id: number;
  code: string;
  name: string;
  status: EstadoPortafolio;
  owner?: number | null;
  programas_count?: number;
  proyectos_count?: number;
  health_status?: SaludProyecto;
  // ...
}

// Programa
interface Programa {
  id: number;
  portafolio: number;
  code: string;
  name: string;
  status: EstadoPrograma;
  manager?: number | null;
  proyectos_count?: number;
  // ...
}

// Proyecto
interface Proyecto {
  id: number;
  programa?: number | null;
  code: string;
  name: string;
  tipo: TipoProyecto;
  estado: EstadoProyecto;
  prioridad: PrioridadProyecto;
  health_status: SaludProyecto;
  sponsor?: number | null;
  project_manager?: number | null;
  progreso_general?: number;
  progreso_alcance?: number;
  progreso_tiempo?: number;
  progreso_costo?: number;
  progreso_calidad?: number;
  // ...
}

// Equipo de Proyecto
interface EquipoProyecto {
  id: number;
  proyecto: number;
  usuario?: number | null;
  cargo?: number | null;
  rol: RolProyecto;
  responsabilidades?: string | null;
  dedicacion_porcentaje?: number;
  // ...
}

// Hito de Proyecto
interface HitoProyecto {
  id: number;
  proyecto: number;
  code: string;
  name: string;
  fecha_prevista: string;
  fecha_real?: string | null;
  is_completed: boolean;
  // ...
}
```

### Enumeraciones

```typescript
// Estados del proyecto
type EstadoProyecto =
  | 'PROPUESTO'
  | 'INICIACION'
  | 'PLANIFICACION'
  | 'EJECUCION'
  | 'MONITOREO'
  | 'CIERRE'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'EN_ESPERA';

// Prioridades
type PrioridadProyecto = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// Tipos de proyecto
type TipoProyecto =
  | 'ESTRATEGICO'
  | 'OPERACIONAL'
  | 'INFRAESTRUCTURA'
  | 'TECNOLOGIA'
  | 'MEJORA_CONTINUA'
  | 'NORMATIVO'
  | 'INNOVACION'
  | 'OTRO';

// Roles en el proyecto
type RolProyecto =
  | 'SPONSOR'
  | 'DIRECTOR'
  | 'GERENTE'
  | 'LIDER_TECNICO'
  | 'MIEMBRO_EQUIPO'
  | 'STAKEHOLDER'
  | 'OBSERVADOR';

// Salud del proyecto
type SaludProyecto = 'VERDE' | 'AMARILLO' | 'ROJO';
```

## Hooks Disponibles

### Proyectos

```typescript
// Consultas
useProyectos(filters?: ProyectoFilters)
useProyecto(id: number)
useProyectosDashboard()
useProyectosPorEstado()

// Mutaciones
useCreateProyecto()
useUpdateProyecto()
useDeleteProyecto()
useCambiarEstadoProyecto()
useActualizarSaludProyecto()
```

### Portafolios

```typescript
// Consultas
usePortafolios(filters?: PortafolioFilters)
usePortafolio(id: number)

// Mutaciones
useCreatePortafolio()
useUpdatePortafolio()
useDeletePortafolio()
```

### Programas

```typescript
// Consultas
useProgramas(filters?: ProgramaFilters)
usePrograma(id: number)

// Mutaciones
useCreatePrograma()
useUpdatePrograma()
useDeletePrograma()
```

### Equipo de Proyecto

```typescript
useEquipoProyecto(filters?: EquipoProyectoFilters)
useCreateEquipoProyecto()
useUpdateEquipoProyecto()
useDeleteEquipoProyecto()
```

### Hitos

```typescript
useHitosProyecto(filters?: HitoProyectoFilters)
useCreateHitoProyecto()
useUpdateHitoProyecto()
useDeleteHitoProyecto()
useCompletarHitoProyecto()
```

## Endpoints del Backend

Todos los endpoints están bajo `/api/gestion-estrategica/proyectos/`:

### Portafolios
- `GET /portafolios/` - Lista de portafolios
- `POST /portafolios/` - Crear portafolio
- `GET /portafolios/:id/` - Detalle de portafolio
- `PATCH /portafolios/:id/` - Actualizar portafolio
- `DELETE /portafolios/:id/` - Eliminar portafolio

### Programas
- `GET /programas/` - Lista de programas
- `POST /programas/` - Crear programa
- `GET /programas/:id/` - Detalle de programa
- `PATCH /programas/:id/` - Actualizar programa
- `DELETE /programas/:id/` - Eliminar programa

### Proyectos
- `GET /proyectos/` - Lista de proyectos
- `POST /proyectos/` - Crear proyecto
- `GET /proyectos/:id/` - Detalle de proyecto
- `PATCH /proyectos/:id/` - Actualizar proyecto
- `DELETE /proyectos/:id/` - Eliminar proyecto
- `GET /proyectos/dashboard/` - Dashboard de estadísticas
- `GET /proyectos/por_estado/` - Proyectos agrupados por estado (Kanban)
- `POST /proyectos/:id/cambiar_estado/` - Cambiar estado del proyecto
- `POST /proyectos/:id/actualizar_salud/` - Actualizar salud del proyecto

### Equipo de Proyecto
- `GET /equipo/` - Lista de miembros del equipo
- `POST /equipo/` - Agregar miembro al equipo
- `GET /equipo/:id/` - Detalle de miembro
- `PATCH /equipo/:id/` - Actualizar miembro
- `DELETE /equipo/:id/` - Eliminar miembro

### Hitos
- `GET /hitos/` - Lista de hitos
- `POST /hitos/` - Crear hito
- `GET /hitos/:id/` - Detalle de hito
- `PATCH /hitos/:id/` - Actualizar hito
- `DELETE /hitos/:id/` - Eliminar hito
- `POST /hitos/:id/completar/` - Marcar hito como completado

### Choices
- `GET /choices/` - Opciones para selectores (estados, prioridades, tipos, roles)

## Integración con el Sistema

### Vinculación con Objetivos Estratégicos

Los proyectos pueden vincularse con objetivos estratégicos del BSC:

```typescript
interface Proyecto {
  // ...
  objetivos_estrategicos?: number[];
  objetivos_estrategicos_details?: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}
```

Esto permite:
- Alinear proyectos con la estrategia organizacional
- Medir el avance de objetivos estratégicos a través de proyectos
- Reportar contribución de proyectos al BSC

## Mejores Prácticas

### 1. Gestión de Estado
- Usar `useCambiarEstadoProyecto()` para mover proyectos entre fases
- El Kanban actualiza automáticamente el estado al arrastrar

### 2. Monitoreo de Salud
- Actualizar regularmente `health_status` usando `useActualizarSaludProyecto()`
- Verde: Sin riesgos
- Amarillo: Alertas menores
- Rojo: Problemas críticos

### 3. Progreso
- Mantener actualizados los 4 tipos de progreso:
  - `progreso_alcance`: Entregables completados
  - `progreso_tiempo`: Cumplimiento de cronograma
  - `progreso_costo`: Ejecución presupuestal
  - `progreso_calidad`: Cumplimiento de estándares

### 4. Hitos
- Definir hitos claros con criterios de aceptación
- Usar `useCompletarHitoProyecto()` con evidencia

## Próximas Mejoras

- [ ] Diagrama de Gantt interactivo
- [ ] Matriz de riesgos del proyecto
- [ ] Gestión de recursos compartidos
- [ ] Reportes automáticos de avance
- [ ] Integración con calendario
- [ ] Notificaciones de hitos vencidos
- [ ] Dashboard del Project Manager
- [ ] Tablero del Sponsor

## Soporte

Para reportar problemas o sugerir mejoras, contactar al equipo de desarrollo.
