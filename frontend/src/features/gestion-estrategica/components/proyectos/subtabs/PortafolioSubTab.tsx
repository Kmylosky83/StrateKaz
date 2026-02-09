/**
 * SubTab de Portafolio - Gestión de Proyectos PMI
 *
 * Layout según Catálogo de Vistas UI:
 * - SectionHeader con título, contador, toggle de vista y botón de acción
 * - Contenido: Dashboard con KPIs o Vista Kanban
 *
 * El toggle Dashboard/Kanban está integrado en el SectionHeader (no como tabs separados)
 */
import { useState } from 'react';
import { Briefcase, LayoutDashboard, KanbanSquare, Plus } from 'lucide-react';
import { SectionHeader, Button, ViewToggle } from '@/components/common';
import { PortafolioDashboard } from '../PortafolioDashboard';
import { ProyectosKanban } from '../ProyectosKanban';
import { useProyectosDashboard } from '../../../hooks/useProyectos';
import type { Proyecto } from '../../../types/proyectos.types';

type ViewMode = 'dashboard' | 'kanban';

const VIEW_OPTIONS = [
  { value: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { value: 'kanban' as const, label: 'Kanban', icon: KanbanSquare },
];

export const PortafolioSubTab = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [_selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const { data: dashboard } = useProyectosDashboard();

  const handleProjectClick = (proyecto: Proyecto) => {
    setSelectedProject(proyecto);
    // TODO: Abrir modal de detalles del proyecto
  };

  const handleCreateProject = () => {
    // TODO: Abrir modal de crear proyecto
  };

  // Contador de proyectos para el SectionHeader
  const totalProyectos = dashboard?.total_proyectos ?? 0;

  return (
    <div className="space-y-6">
      {/* SectionHeader con toggle de vista y botón de acción */}
      <SectionHeader
        icon={
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        }
        title="Portafolio de Proyectos"
        description={`${totalProyectos} proyecto${totalProyectos !== 1 ? 's' : ''} en portafolio`}
        actions={
          <div className="flex items-center gap-3">
            {/* Toggle Dashboard/Kanban */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={VIEW_OPTIONS}
              moduleColor="purple"
            />

            {/* Botón crear proyecto */}
            <Button variant="primary" size="sm" onClick={handleCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        }
      />

      {/* Contenido según modo de vista */}
      {viewMode === 'dashboard' ? (
        <PortafolioDashboard />
      ) : (
        <ProyectosKanban onProjectClick={handleProjectClick} />
      )}
    </div>
  );
};
