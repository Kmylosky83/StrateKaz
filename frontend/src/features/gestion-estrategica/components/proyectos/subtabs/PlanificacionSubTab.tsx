/**
 * SubTab de Planificación — Workspace por proyecto
 * Selector de proyecto + Tabs: WBS/Actividades | Kanban | Calendario | Gantt | Recursos | Fases
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, Badge, EmptyState } from '@/components/common';
import { Tabs } from '@/components/common/Tabs';
import { Select } from '@/components/forms';
import { useProyectos } from '../../../hooks/useProyectos';
import { KanbanBoard } from '../kanban';
import { CalendarView } from '../calendar';
import { ActividadesSection } from '../planificacion/ActividadesSection';
import { ActividadFormModal } from '../planificacion/ActividadFormModal';
import { FasesSection } from '../planificacion/FasesSection';
import { RecursosSection } from '../planificacion/RecursosSection';
import { GanttView } from '../planificacion/GanttView';
import type { Proyecto, ActividadProyecto } from '../../../types/proyectos.types';
import type { Tab } from '@/components/common/Tabs';
import { ListChecks, KanbanSquare, Calendar, BarChart3, Wallet, Layers } from 'lucide-react';

// ==================== TABS CONFIG ====================

const PLANIFICACION_TABS: Tab[] = [
  { id: 'actividades', label: 'WBS / Actividades', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'kanban', label: 'Kanban', icon: <KanbanSquare className="h-4 w-4" /> },
  { id: 'calendario', label: 'Calendario', icon: <Calendar className="h-4 w-4" /> },
  { id: 'gantt', label: 'Gantt', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'recursos', label: 'Recursos', icon: <Wallet className="h-4 w-4" /> },
  { id: 'fases', label: 'Fases', icon: <Layers className="h-4 w-4" /> },
];

// ==================== COMPONENTE PRINCIPAL ====================

export const PlanificacionSubTab = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('actividades');

  // For editing activity from Kanban/Calendar/Gantt click
  const [editActivity, setEditActivity] = useState<ActividadProyecto | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);

  const { data: proyectosData, isLoading } = useProyectos({
    estado: 'planificacion',
    is_active: true,
  });

  const proyectos: Proyecto[] = useMemo(
    () => proyectosData?.results ?? (Array.isArray(proyectosData) ? proyectosData : []),
    [proyectosData]
  );

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
        icon={<ListChecks className="h-12 w-12" />}
        title="No hay proyectos en planificación"
        description="Los proyectos pasarán a esta fase desde iniciación"
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
            }}
            options={proyectoOptions}
          />
        </div>
        {selectedProyecto && (
          <div className="flex items-center gap-2 pb-1">
            <Badge variant="info" size="sm">
              {selectedProyecto.codigo}
            </Badge>
            {selectedProyecto.gerente_nombre && (
              <span className="text-xs text-gray-500">
                Gerente: {selectedProyecto.gerente_nombre}
              </span>
            )}
          </div>
        )}
      </div>

      {selectedProjectId && (
        <>
          {/* Tabs */}
          <Tabs
            tabs={PLANIFICACION_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />

          {/* Tab Content */}
          <div className="mt-4">
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
            {activeTab === 'gantt' && <GanttView proyectoId={selectedProjectId} />}
            {activeTab === 'recursos' && <RecursosSection proyectoId={selectedProjectId} />}
            {activeTab === 'fases' && <FasesSection proyectoId={selectedProjectId} />}
          </div>
        </>
      )}

      {/* Shared Activity Edit Modal (from Kanban/Calendar clicks) */}
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
