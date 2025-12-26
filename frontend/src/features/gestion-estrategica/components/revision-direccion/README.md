# Componentes de Revisión por la Dirección (ISO 9.3)

Este directorio contiene todos los componentes relacionados con la Revisión por la Dirección según ISO 9.3.

## Estructura de Archivos

```
revision-direccion/
├── RevisionDireccionTab.tsx      # Componente principal con subtabs
├── CompromisosDashboard.tsx      # Dashboard de compromisos pendientes
├── subtabs/
│   ├── ProgramacionTab.tsx       # Calendario y programación
│   ├── ActasTab.tsx              # Gestión de actas
│   └── index.ts
├── index.ts                       # Exportaciones
└── README.md                      # Este archivo
```

## Componentes Principales

### RevisionDireccionTab

Componente principal que integra todos los subtabs de la revisión por dirección.

**Uso:**
```tsx
import { RevisionDireccionTab } from '@/features/gestion-estrategica/components';

function App() {
  return <RevisionDireccionTab />;
}
```

**Características:**
- Navegación por tabs: Programación, Actas, Compromisos
- Indicadores de estado en cada tab
- Integración con estadísticas en tiempo real

### CompromisosDashboard

Dashboard completo de compromisos pendientes de revisiones.

**Características:**
- StatsGrid: Estadísticas principales (Total, Pendientes, En Progreso, Completados, Vencidos)
- Alertas: Compromisos próximos a vencer
- Indicadores por Responsable: Muestra tasa de cumplimiento individual
- Tabla de Compromisos: Con filtros por estado y prioridad
- Filtros Dinámicos: Estado, prioridad, responsable, fechas

## Hooks Utilizados

- useRevisionDireccionDashboard() - Estadísticas generales del dashboard
- useCompromisos(filters) - Lista de compromisos
- useCompromisosVencidos() - Compromisos vencidos
- useCompromisosCriticos(limit) - Compromisos críticos

## Flujo de Datos

1. Programación: Se programa una revisión con fecha y participantes
2. Notificación: Se envían notificaciones a los convocados
3. Realización: Se lleva a cabo la revisión
4. Generación de Acta: Se crea el acta con elementos de entrada y decisiones
5. Compromisos: Se registran los compromisos derivados de la revisión
6. Seguimiento: Se hace seguimiento a través del dashboard de compromisos
7. Aprobación: El acta es aprobada y cerrada
