/**
 * NovedadesSection - Componente principal del modulo Novedades
 * Talento Humano > Novedades
 *
 * 5 sub-tabs para gestionar novedades laborales:
 * 1. Incapacidades - Registro y seguimiento de incapacidades
 * 2. Licencias - Solicitudes de licencias
 * 3. Permisos - Solicitudes de permisos
 * 4. Vacaciones - Periodos y solicitudes de vacaciones
 * 5. Dotacion - Configuracion y entregas de dotacion
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Stethoscope, FileCheck, Clock, Palmtree, Shirt } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IncapacidadesTab } from './IncapacidadesTab';
import { LicenciasTab } from './LicenciasTab';
import { PermisosTab } from './PermisosTab';
import { VacacionesTab } from './VacacionesTab';
import { DotacionTab } from './DotacionTab';

interface SubTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SUB_TABS: SubTab[] = [
  {
    key: 'incapacidades',
    label: 'Incapacidades',
    icon: <Stethoscope size={16} />,
    component: IncapacidadesTab,
  },
  {
    key: 'licencias',
    label: 'Licencias',
    icon: <FileCheck size={16} />,
    component: LicenciasTab,
  },
  {
    key: 'permisos',
    label: 'Permisos',
    icon: <Clock size={16} />,
    component: PermisosTab,
  },
  {
    key: 'vacaciones',
    label: 'Vacaciones',
    icon: <Palmtree size={16} />,
    component: VacacionesTab,
  },
  {
    key: 'dotacion',
    label: 'Dotacion',
    icon: <Shirt size={16} />,
    component: DotacionTab,
  },
];

export const NovedadesSection = () => {
  const [activeTab, setActiveTab] = useState('incapacidades');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sub-tabs de novedades">
          {SUB_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {TabComponent ? (
        <TabComponent />
      ) : (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                {currentTab.icon}
              </div>
            }
            title={currentTab.label}
            description="Seccion en desarrollo."
          />
        </Card>
      )}
    </div>
  );
};
