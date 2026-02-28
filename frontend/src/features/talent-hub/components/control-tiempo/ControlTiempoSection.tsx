/**
 * ControlTiempoSection - Componente principal del módulo Control de Tiempo
 * Talento Humano > Control de Tiempo
 *
 * 5 sub-tabs para gestionar asistencia y horas:
 * 1. Dashboard - KPIs, calendario y acceso rápido a marcaje
 * 2. Turnos - CRUD turnos laborales
 * 3. Asistencia - Registros de asistencia
 * 4. Horas Extras - Solicitudes y aprobaciones
 * 5. Consolidados - Resumen mensual
 */
import { useState } from 'react';
import { LayoutDashboard, Clock, UserCheck, Timer, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DashboardTiempo } from './DashboardTiempo';
import { TurnosTab } from './TurnosTab';
import { AsistenciaTab } from './AsistenciaTab';
import { HorasExtrasTab } from './HorasExtrasTab';
import { ConsolidadosTab } from './ConsolidadosTab';

interface SubTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const SUB_TABS: SubTab[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={16} />,
    component: DashboardTiempo,
  },
  {
    key: 'turnos',
    label: 'Turnos',
    icon: <Clock size={16} />,
    component: TurnosTab,
  },
  {
    key: 'asistencia',
    label: 'Asistencia',
    icon: <UserCheck size={16} />,
    component: AsistenciaTab,
  },
  {
    key: 'horas-extras',
    label: 'Horas Extras',
    icon: <Timer size={16} />,
    component: HorasExtrasTab,
  },
  {
    key: 'consolidados',
    label: 'Consolidados',
    icon: <FileText size={16} />,
    component: ConsolidadosTab,
  },
];

export const ControlTiempoSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav
          className="-mb-px flex gap-1 overflow-x-auto"
          aria-label="Sub-tabs de control de tiempo"
        >
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

      {activeTab === 'dashboard' ? (
        <DashboardTiempo onNavigateTab={setActiveTab} />
      ) : (
        <TabComponent />
      )}
    </div>
  );
};
