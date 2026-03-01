/**
 * Off-Boarding Section - Main Router
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useState } from 'react';
import { UserMinus, ListChecks, Stethoscope, MessageSquare, Calculator } from 'lucide-react';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';

// Lazy imports
import { ProcesosTab } from './ProcesosTab';
import { ChecklistTab } from './ChecklistTab';
import { ExamenesTab } from './ExamenesTab';
import { EntrevistasTab } from './EntrevistasTab';
import { LiquidacionesTab } from './LiquidacionesTab';

interface SubTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SUB_TABS: SubTab[] = [
  {
    key: 'procesos',
    label: 'Procesos',
    icon: <UserMinus className="h-4 w-4" />,
    component: ProcesosTab,
  },
  {
    key: 'checklist',
    label: 'Checklist',
    icon: <ListChecks className="h-4 w-4" />,
    component: ChecklistTab,
  },
  {
    key: 'examenes',
    label: 'Exámenes',
    icon: <Stethoscope className="h-4 w-4" />,
    component: ExamenesTab,
  },
  {
    key: 'entrevistas',
    label: 'Entrevistas',
    icon: <MessageSquare className="h-4 w-4" />,
    component: EntrevistasTab,
  },
  {
    key: 'liquidaciones',
    label: 'Liquidaciones',
    icon: <Calculator className="h-4 w-4" />,
    component: LiquidacionesTab,
  },
];

export function OffBoardingSection() {
  const [activeTab, setActiveTab] = useState(SUB_TABS[0].key);

  const current = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = current.component;

  return (
    <div className="space-y-4">
      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 !px-4 !py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors rounded-none',
              activeTab === tab.key
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div>
        {TabComponent ? (
          <TabComponent />
        ) : (
          <EmptyState
            title="Funcionalidad en desarrollo"
            description="Esta funcionalidad estará disponible próximamente."
          />
        )}
      </div>
    </div>
  );
}
