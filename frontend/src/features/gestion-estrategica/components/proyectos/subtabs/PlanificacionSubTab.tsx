/**
 * SubTab de Planificacion
 * Gestion de proyectos en fase de planificacion
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
  FileText,
  GitBranch,
  Users,
  DollarSign,
  AlertTriangle,
  ListChecks,
  List,
  KanbanSquare,
  Calendar,
} from 'lucide-react';
import { CalendarView } from '../calendar';

type ViewMode = 'list' | 'kanban' | 'calendario';

const VIEW_OPTIONS = [
  { value: 'list' as const, label: 'Lista', icon: List },
  { value: 'kanban' as const, label: 'Kanban', icon: KanbanSquare },
  { value: 'calendario' as const, label: 'Calendario', icon: Calendar },
];

export const PlanificacionSubTab = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: proyectosData, isLoading } = useProyectos({
    estado: 'planificacion',
    is_active: true,
  });

  const proyectos: Proyecto[] =
    proyectosData?.results ?? (Array.isArray(proyectosData) ? proyectosData : []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        icon={
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        }
        title="Fase de Planificacion"
        description="Proyectos en fase de planificacion - Desarrollo de plan de proyecto"
        actions={
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
            moduleColor="blue"
          />
        }
      />

      {/* Vista Kanban */}
      {viewMode === 'kanban' && (
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <Select
                label="Proyecto"
                placeholder="Selecciona un proyecto para ver sus actividades..."
                value={selectedProjectId ? String(selectedProjectId) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedProjectId(val ? Number(val) : null);
                }}
                options={[
                  { value: '', label: 'Seleccionar proyecto...' },
                  ...proyectos.map((p) => ({
                    value: String(p.id),
                    label: `${p.codigo} - ${p.nombre}`,
                  })),
                ]}
              />
            </div>
          </Card>
          <KanbanBoard proyectoId={selectedProjectId} />
        </div>
      )}

      {/* Vista Calendario */}
      {viewMode === 'calendario' && (
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <Select
                label="Proyecto"
                placeholder="Selecciona un proyecto para ver sus actividades..."
                value={selectedProjectId ? String(selectedProjectId) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedProjectId(val ? Number(val) : null);
                }}
                options={[
                  { value: '', label: 'Seleccionar proyecto...' },
                  ...proyectos.map((p) => ({
                    value: String(p.id),
                    label: `${p.codigo} - ${p.nombre}`,
                  })),
                ]}
              />
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <CalendarView proyectoId={selectedProjectId} />
            </div>
          </Card>
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <>
          {/* Areas de Conocimiento PMI */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Areas de Conocimiento PMI
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Gestion del Alcance
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      WBS, entregables y requisitos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ListChecks className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Gestion del Cronograma
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Diagrama de Gantt, hitos, ruta critica
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Gestion de Costos
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Presupuesto, curva S, EVM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Gestion de Riesgos
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Matriz de riesgos, plan de respuesta
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Gestion de Recursos
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Equipo, roles, matriz RACI
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-pink-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Gestion de Calidad
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Metricas, plan de calidad
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Lista de Proyectos */}
          {proyectos.length > 0 ? (
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
                        </div>
                        {proyecto.descripcion && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {proyecto.descripcion}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSelectProject(proyecto)}
                      >
                        Ver Kanban
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Presupuesto:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          ${proyecto.presupuesto_estimado ?? '0'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Actividades:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {proyecto.total_actividades ?? 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Gerente:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {proyecto.gerente_nombre ?? 'Sin asignar'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Fecha Inicio:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {proyecto.fecha_inicio_plan
                            ? new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')
                            : 'Sin definir'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No hay proyectos en planificacion"
              description="Los proyectos pasaran a esta fase desde iniciacion"
            />
          )}
        </>
      )}
    </div>
  );
};
