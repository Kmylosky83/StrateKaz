/**
 * ProcesoDisciplinarioSection - Componente principal del modulo Proceso Disciplinario
 * Talento Humano > Proceso Disciplinario
 *
 * 4 sub-tabs para gestionar el proceso disciplinario:
 * 1. Llamados - Llamados de atencion verbal/escrito
 * 2. Descargos - Citaciones y descargos segun Ley 2466/2025
 * 3. Memorandos - Sanciones formales
 * 4. Historial - Historial disciplinario por colaborador
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertTriangle, Scale, FileText, History } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LlamadosTab } from './LlamadosTab';
import { DescargosTab } from './DescargosTab';
import { MemorandosTab } from './MemorandosTab';
import { HistorialTab } from './HistorialTab';

interface SubTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SUB_TABS: SubTab[] = [
  {
    key: 'llamados',
    label: 'Llamados',
    icon: <AlertTriangle size={16} />,
    component: LlamadosTab,
  },
  {
    key: 'descargos',
    label: 'Descargos',
    icon: <Scale size={16} />,
    component: DescargosTab,
  },
  {
    key: 'memorandos',
    label: 'Memorandos',
    icon: <FileText size={16} />,
    component: MemorandosTab,
  },
  {
    key: 'historial',
    label: 'Historial',
    icon: <History size={16} />,
    component: HistorialTab,
  },
];

export const ProcesoDisciplinarioSection = () => {
  const [activeTab, setActiveTab] = useState('llamados');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav
          className="-mb-px flex gap-1 overflow-x-auto"
          aria-label="Sub-tabs de proceso disciplinario"
        >
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
            description="Seccion en desarrollo."
          />
        </Card>
      )}
    </div>
  );
};
