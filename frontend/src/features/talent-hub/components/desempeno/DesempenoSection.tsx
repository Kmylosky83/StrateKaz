/**
 * DesempenoSection - Componente principal del modulo Desempeno
 * Talento Humano > Desempeno
 *
 * 5 sub-tabs para gestionar evaluaciones y reconocimientos:
 * 1. Dashboard - KPIs y metricas
 * 2. Evaluaciones - Ciclos y evaluaciones 360
 * 3. Planes de Mejora - PID, actividades, seguimientos
 * 4. Reconocimientos - Nominaciones y aprobaciones
 * 5. Muro - Muro social de reconocimientos
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { BarChart3, ClipboardCheck, TrendingUp, Award, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DashboardTab } from './DashboardTab';
import { EvaluacionesTab } from './EvaluacionesTab';
import { PlanesMejoraTab } from './PlanesMejoraTab';
import { ReconocimientosTab } from './ReconocimientosTab';
import { MuroTab } from './MuroTab';

interface SubTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SUB_TABS: SubTab[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 size={16} />,
    component: DashboardTab,
  },
  {
    key: 'evaluaciones',
    label: 'Evaluaciones',
    icon: <ClipboardCheck size={16} />,
    component: EvaluacionesTab,
  },
  {
    key: 'planes',
    label: 'Planes de Mejora',
    icon: <TrendingUp size={16} />,
    component: PlanesMejoraTab,
  },
  {
    key: 'reconocimientos',
    label: 'Reconocimientos',
    icon: <Award size={16} />,
    component: ReconocimientosTab,
  },
  {
    key: 'muro',
    label: 'Muro',
    icon: <MessageSquare size={16} />,
    component: MuroTab,
  },
];

export const DesempenoSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sub-tabs de desempeno">
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
