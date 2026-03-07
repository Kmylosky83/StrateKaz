/**
 * SubTab de Ejecución y Monitoreo — Workspace por proyecto
 * Selector de proyecto + Tabs: Dashboard | Actividades | Kanban | Gantt | Riesgos | Seguimiento | Calendario
 */
import { useState, useEffect } from 'react';
import { Card, Badge, EmptyState } from '@/components/common';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { Tabs } from '@/components/common/Tabs';
import { Select } from '@/components/forms';
import { useProyectos, useProyecto } from '../../../hooks/useProyectos';
import { KanbanBoard } from '../kanban';
import { CalendarView } from '../calendar';
import { ActividadesSection } from '../planificacion/ActividadesSection';
import { ActividadFormModal } from '../planificacion/ActividadFormModal';
import { GanttView } from '../planificacion/GanttView';
import { RiesgosSection } from '../monitoreo/RiesgosSection';
import { SeguimientoSection } from '../monitoreo/SeguimientoSection';
import type { Proyecto, ActividadProyecto } from '../../../types/proyectos.types';
import type { Tab } from '@/components/common/Tabs';
import {
  Activity,
  ListChecks,
  KanbanSquare,
  Calendar,
  BarChart3,
  ShieldAlert,
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

// ==================== TABS CONFIG ====================

const MONITOREO_TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Activity className="h-4 w-4" /> },
  { id: 'actividades', label: 'Actividades', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'kanban', label: 'Kanban', icon: <KanbanSquare className="h-4 w-4" /> },
  { id: 'gantt', label: 'Gantt', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'riesgos', label: 'Riesgos', icon: <ShieldAlert className="h-4 w-4" /> },
  { id: 'seguimiento', label: 'Seguimiento', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'calendario', label: 'Calendario', icon: <Calendar className="h-4 w-4" /> },
];

// ==================== DASHBOARD TAB ====================

const DashboardTab = ({ proyectoId }: { proyectoId: number }) => {
  const { data: proyecto } = useProyecto(proyectoId);

  if (!proyecto) return null;

  return (
    <div className="space-y-4">
      <StatsGrid
        columns={4}
        variant="compact"
        stats={[
          {
            label: 'Avance',
            value: `${proyecto.porcentaje_avance ?? 0}%`,
            icon: Target,
            iconColor: 'primary',
          },
          {
            label: 'Actividades',
            value: proyecto.total_actividades ?? 0,
            icon: CheckCircle2,
            iconColor: 'info',
          },
          {
            label: 'Presupuesto',
            value: `$${proyecto.presupuesto_aprobado ?? '0'}`,
            icon: DollarSign,
            iconColor: 'success',
          },
          {
            label: 'Costo Real',
            value: `$${proyecto.costo_real ?? '0'}`,
            icon: DollarSign,
            iconColor: 'warning',
          },
        ]}
      />

      <Card>
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Resumen del Proyecto
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Gerente</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {proyecto.gerente_nombre || 'Sin asignar'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Sponsor</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {proyecto.sponsor_nombre || 'Sin asignar'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <Badge variant="info" size="sm">
                {proyecto.estado_display ?? proyecto.estado}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Inicio Plan</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {proyecto.fecha_inicio_plan
                  ? new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')
                  : 'Sin definir'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Fin Plan</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {proyecto.fecha_fin_plan
                  ? new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-CO')
                  : 'Sin definir'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Prioridad</p>
              <Badge
                variant={
                  proyecto.prioridad === 'critica'
                    ? 'danger'
                    : proyecto.prioridad === 'alta'
                      ? 'warning'
                      : 'info'
                }
                size="sm"
              >
                {proyecto.prioridad_display}
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Progreso General</span>
              <span className="text-sm font-bold">{proyecto.porcentaje_avance ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all"
                style={{ width: `${proyecto.porcentaje_avance ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const MonitoreoSubTab = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Edit activity from Kanban/Calendar/Gantt
  const [editActivity, setEditActivity] = useState<ActividadProyecto | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);

  const { data: proyectosEjecucion, isLoading: loadingEjecucion } = useProyectos({
    estado: 'ejecucion',
    is_active: true,
  });
  const { data: proyectosMonitoreo, isLoading: loadingMonitoreo } = useProyectos({
    estado: 'monitoreo',
    is_active: true,
  });

  const isLoading = loadingEjecucion || loadingMonitoreo;

  const rawEjecucion =
    proyectosEjecucion?.results ?? (Array.isArray(proyectosEjecucion) ? proyectosEjecucion : []);
  const rawMonitoreo =
    proyectosMonitoreo?.results ?? (Array.isArray(proyectosMonitoreo) ? proyectosMonitoreo : []);
  const proyectos: Proyecto[] = [...rawEjecucion, ...rawMonitoreo];

  // Auto-select first project
  useEffect(() => {
    if (proyectos.length > 0 && !selectedProjectId) {
      setSelectedProjectId(proyectos[0].id);
    }
  }, [proyectos, selectedProjectId]);

  const selectedProyecto = proyectos.find((p) => p.id === selectedProjectId);

  const proyectoOptions = [
    { value: '', label: 'Seleccionar proyecto...' },
    ...proyectos.map((p) => ({
      value: String(p.id),
      label: `${p.codigo} - ${p.nombre}`,
    })),
  ];

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

  if (proyectos.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-12 w-12" />}
        title="No hay proyectos en ejecución"
        description="Los proyectos pasarán a esta fase desde planificación"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Project Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div className="w-full sm:max-w-md">
          <Select
            label="Proyecto"
            value={selectedProjectId ? String(selectedProjectId) : ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProjectId(val ? Number(val) : null);
              setActiveTab('dashboard');
            }}
            options={proyectoOptions}
          />
        </div>
        {selectedProyecto && (
          <div className="flex items-center gap-2 pb-1">
            <Badge variant="info" size="sm">
              {selectedProyecto.codigo}
            </Badge>
            <Badge variant="primary" size="sm">
              {selectedProyecto.estado_display ?? selectedProyecto.estado}
            </Badge>
            <span className="text-xs text-gray-500">
              {selectedProyecto.porcentaje_avance ?? 0}% avance
            </span>
          </div>
        )}
      </div>

      {selectedProjectId && (
        <>
          {/* Tabs */}
          <Tabs
            tabs={MONITOREO_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'dashboard' && <DashboardTab proyectoId={selectedProjectId} />}
            {activeTab === 'actividades' && <ActividadesSection proyectoId={selectedProjectId} />}
            {activeTab === 'kanban' && (
              <KanbanBoard
                proyectoId={selectedProjectId}
                onCardClick={(actividad) => {
                  setEditActivity(actividad);
                  setShowActivityForm(true);
                }}
              />
            )}
            {activeTab === 'gantt' && <GanttView proyectoId={selectedProjectId} />}
            {activeTab === 'riesgos' && <RiesgosSection proyectoId={selectedProjectId} />}
            {activeTab === 'seguimiento' && <SeguimientoSection proyectoId={selectedProjectId} />}
            {activeTab === 'calendario' && (
              <Card>
                <div className="p-4">
                  <CalendarView
                    proyectoId={selectedProjectId}
                    onActivityClick={(actividad) => {
                      setEditActivity(actividad);
                      setShowActivityForm(true);
                    }}
                  />
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Shared Activity Edit Modal */}
      {showActivityForm && selectedProjectId && (
        <ActividadFormModal
          actividad={editActivity}
          proyectoId={selectedProjectId}
          isOpen={showActivityForm}
          onClose={() => {
            setShowActivityForm(false);
            setEditActivity(null);
          }}
        />
      )}
    </div>
  );
};
