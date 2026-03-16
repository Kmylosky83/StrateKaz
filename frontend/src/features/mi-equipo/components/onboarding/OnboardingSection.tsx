/**
 * OnboardingSection - Componente principal del modulo Onboarding e Induccion
 * Talento Humano > Onboarding e Induccion
 *
 * 5 sub-tabs para gestionar el proceso de incorporacion:
 * 1. Dashboard - KPIs y metricas
 * 2. Modulos - CRUD modulos de induccion
 * 3. Proceso - Ejecuciones y checklist por colaborador
 * 4. EPP y Activos - Entregas y devoluciones
 * 5. Documentos - Firmas de documentos
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { BarChart3, BookOpen, ListChecks, HardHat, FileSignature } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DashboardTab } from './DashboardTab';
import { ModulosTab } from './ModulosTab';
import { ProcesoTab } from './ProcesoTab';
import { EppActivosTab } from './EppActivosTab';
import { DocumentosTab } from './DocumentosTab';

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
    key: 'modulos',
    label: 'Modulos',
    icon: <BookOpen size={16} />,
    component: ModulosTab,
  },
  {
    key: 'proceso',
    label: 'Proceso',
    icon: <ListChecks size={16} />,
    component: ProcesoTab,
  },
  {
    key: 'epp-activos',
    label: 'EPP y Activos',
    icon: <HardHat size={16} />,
    component: EppActivosTab,
  },
  {
    key: 'documentos',
    label: 'Documentos',
    icon: <FileSignature size={16} />,
    component: DocumentosTab,
  },
];

export const OnboardingSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sub-tabs de onboarding">
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

      {/* Tab content */}
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
