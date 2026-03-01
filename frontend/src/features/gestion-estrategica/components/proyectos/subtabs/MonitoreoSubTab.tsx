/**
 * SubTab de Ejecucion y Monitoreo
 * Gestion de proyectos en ejecucion y monitoreo
 *
 * Sprint PLANNER-1: Agrega vista Kanban de actividades.
 * Toggle: Lista (proyectos) | Kanban (actividades del proyecto seleccionado)
 */
import { useState } from 'react';
import { Card, Badge, Button, EmptyState, ViewToggle, SectionHeader } from '@/components/common';
import { Select } from '@/components/forms';
import { useProyectos } from '../../../hooks/useProyectos';
import { KanbanBoard } from '../kanban';
import type { Proyecto } from '../../../types/proyectos.types';
import {
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  DollarSign,
  List,
  KanbanSquare,
  BarChart3,
} from 'lucide-react';

type ViewMode = 'list' | 'kanban' | 'timeline';

const VIEW_OPTIONS = [
  { value: 'list' as const, label: 'Lista', icon: List },
  { value: 'kanban' as const, label: 'Kanban', icon: KanbanSquare },
  { value: 'timeline' as const, label: 'Cronograma', icon: BarChart3 },
];

// ==================== LISTA DE PROYECTOS (vista existente) ====================

interface ProyectoListViewProps {
  proyectos: Proyecto[];
  onSelectProject: (proyecto: Proyecto) => void;
}

const ProyectoListView = ({ proyectos, onSelectProject }: ProyectoListViewProps) => {
  if (proyectos.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-12 w-12" />}
        title="No hay proyectos en ejecucion"
        description="Los proyectos pasaran a esta fase desde planificacion"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {proyectos.map((proyecto) => (
        <Card key={proyecto.id}>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {proyecto.nombre}
                  </h3>
                  <Badge variant="info" size="sm">
                    {proyecto.codigo}
                  </Badge>
                  <Badge
                    variant={proyecto.estado === 'ejecucion' ? 'primary' : 'warning'}
                    size="sm"
                  >
                    {proyecto.estado_display ?? proyecto.estado}
                  </Badge>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onSelectProject(proyecto)}>
                Ver Kanban
              </Button>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progreso General
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {proyecto.porcentaje_avance ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${proyecto.porcentaje_avance ?? 0}%` }}
                />
              </div>
            </div>

            {/* Footer info */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              {proyecto.total_actividades !== undefined && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{proyecto.total_actividades} actividades</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Fin:{' '}
                  {proyecto.fecha_fin_plan
                    ? new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-CO')
                    : 'Sin definir'}
                </span>
              </div>
              {proyecto.gerente_nombre && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{proyecto.gerente_nombre}</span>
                </div>
              )}
              {(proyecto.presupuesto_aprobado ?? proyecto.costo_real) != null && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>
                    ${proyecto.costo_real ?? '0'} / ${proyecto.presupuesto_aprobado ?? '0'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ==================== KANBAN VIEW CON SELECTOR ====================

interface KanbanViewProps {
  proyectos: Proyecto[];
  selectedProjectId: number | null;
  onSelectProject: (id: number | null) => void;
}

const KanbanView = ({ proyectos, selectedProjectId, onSelectProject }: KanbanViewProps) => {
  const projectOptions = proyectos.map((p) => ({
    value: String(p.id),
    label: `${p.codigo} - ${p.nombre}`,
  }));

  return (
    <div className="space-y-4">
      {/* Project selector */}
      <Card>
        <div className="p-4">
          <Select
            label="Proyecto"
            placeholder="Selecciona un proyecto para ver sus actividades..."
            value={selectedProjectId ? String(selectedProjectId) : ''}
            onChange={(e) => {
              const val = e.target.value;
              onSelectProject(val ? Number(val) : null);
            }}
            options={[{ value: '', label: 'Seleccionar proyecto...' }, ...projectOptions]}
          />
        </div>
      </Card>

      {/* Kanban board */}
      <KanbanBoard proyectoId={selectedProjectId} />
    </div>
  );
};

// ==================== TIMELINE PLACEHOLDER ====================

const TimelineView = () => (
  <EmptyState
    icon={<BarChart3 className="h-12 w-12" />}
    title="Vista de cronograma"
    description="La vista de cronograma (Gantt) estara disponible proximamente."
  />
);

// ==================== COMPONENTE PRINCIPAL ====================

export const MonitoreoSubTab = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: proyectosEjecucion, isLoading: loadingEjecucion } = useProyectos({
    estado: 'ejecucion',
    is_active: true,
  });
  const { data: proyectosMonitoreo, isLoading: loadingMonitoreo } = useProyectos({
    estado: 'monitoreo',
    is_active: true,
  });

  const isLoading = loadingEjecucion || loadingMonitoreo;

  // Combinar proyectos de ambos estados
  const rawEjecucion =
    proyectosEjecucion?.results ?? (Array.isArray(proyectosEjecucion) ? proyectosEjecucion : []);
  const rawMonitoreo =
    proyectosMonitoreo?.results ?? (Array.isArray(proyectosMonitoreo) ? proyectosMonitoreo : []);
  const proyectos: Proyecto[] = [...rawEjecucion, ...rawMonitoreo];

  const handleSelectProject = (proyecto: Proyecto) => {
    setSelectedProjectId(proyecto.id);
    setViewMode('kanban');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse-subtle">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const totalProyectos = proyectos.length;

  return (
    <div className="space-y-6">
      {/* Header con toggle de vista */}
      <SectionHeader
        icon={
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        }
        title="Ejecucion y Monitoreo"
        description={`${totalProyectos} proyecto${totalProyectos !== 1 ? 's' : ''} en ejecucion o monitoreo`}
        actions={
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
            moduleColor="purple"
          />
        }
      />

      {/* Contenido segun vista seleccionada */}
      {viewMode === 'list' && (
        <ProyectoListView proyectos={proyectos} onSelectProject={handleSelectProject} />
      )}
      {viewMode === 'kanban' && (
        <KanbanView
          proyectos={proyectos}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />
      )}
      {viewMode === 'timeline' && <TimelineView />}
    </div>
  );
};
