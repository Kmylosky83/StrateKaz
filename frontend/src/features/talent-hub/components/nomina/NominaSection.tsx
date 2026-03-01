/**
 * NominaSection - Componente principal del modulo Nomina
 * Talento Humano > Nomina
 *
 * 5 sub-tabs para gestionar nomina:
 * 1. Configuracion - Parametros anuales de nomina
 * 2. Conceptos - Devengados y deducciones
 * 3. Periodos - Liquidaciones mensuales/quincenales
 * 4. Prestaciones - Cesantias, prima, vacaciones
 * 5. Pagos - Registro de pagos realizados
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Settings, List, Calendar, Gift, Banknote } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ConfiguracionTab } from './ConfiguracionTab';
import { ConceptosTab } from './ConceptosTab';
import { PeriodosTab } from './PeriodosTab';
import { PrestacionesTab } from './PrestacionesTab';
import { PagosTab } from './PagosTab';

interface SubTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SUB_TABS: SubTab[] = [
  {
    key: 'configuracion',
    label: 'Configuración',
    icon: <Settings size={16} />,
    component: ConfiguracionTab,
  },
  {
    key: 'conceptos',
    label: 'Conceptos',
    icon: <List size={16} />,
    component: ConceptosTab,
  },
  {
    key: 'periodos',
    label: 'Periodos',
    icon: <Calendar size={16} />,
    component: PeriodosTab,
  },
  {
    key: 'prestaciones',
    label: 'Prestaciones',
    icon: <Gift size={16} />,
    component: PrestacionesTab,
  },
  {
    key: 'pagos',
    label: 'Pagos',
    icon: <Banknote size={16} />,
    component: PagosTab,
  },
];

export const NominaSection = () => {
  const [activeTab, setActiveTab] = useState('configuracion');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sub-tabs de nómina">
          {SUB_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Button
                key={tab.key}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 !px-4 !py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap rounded-none',
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                {tab.icon}
                {tab.label}
              </Button>
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
            description="Sección en desarrollo."
          />
        </Card>
      )}
    </div>
  );
};
