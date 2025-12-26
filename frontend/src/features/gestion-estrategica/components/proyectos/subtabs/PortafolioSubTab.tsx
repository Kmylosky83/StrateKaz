/**
 * SubTab de Portafolio
 * Muestra dashboard general y vista Kanban
 */
import { useState } from 'react';
import { Tabs } from '@/components/common';
import { PortafolioDashboard } from '../PortafolioDashboard';
import { ProyectosKanban } from '../ProyectosKanban';
import { LayoutDashboard, KanbanSquare } from 'lucide-react';
import type { Proyecto } from '../../../types/proyectos';

export const PortafolioSubTab = () => {
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);

  const handleProjectClick = (proyecto: Proyecto) => {
    setSelectedProject(proyecto);
    // TODO: Abrir modal de detalles del proyecto
    console.log('Proyecto seleccionado:', proyecto);
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      content: <PortafolioDashboard />,
    },
    {
      id: 'kanban',
      label: 'Vista Kanban',
      icon: <KanbanSquare className="h-4 w-4" />,
      content: <ProyectosKanban onProjectClick={handleProjectClick} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Portafolio de Proyectos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vista general del portafolio y estado de proyectos
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} defaultTab="dashboard" />
    </div>
  );
};
