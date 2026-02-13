/**
 * SeleccionSection - Componente principal del modulo Seleccion y Contratacion
 * Talento Humano > Seleccion y Contratacion
 *
 * Contiene 6 sub-tabs internos para gestionar todo el proceso:
 * 1. Vacantes - CRUD de vacantes activas
 * 2. Candidatos - Pipeline de candidatos (pendiente)
 * 3. Entrevistas - Programacion y evaluacion (pendiente)
 * 4. Pruebas - Tests y evaluaciones (pendiente)
 * 5. Afiliaciones - Seguridad social (pendiente)
 * 6. Contratos - Historial contractual (pendiente)
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Briefcase, Users, MessageSquare, ClipboardCheck, Shield, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';
import { VacantesTab } from './VacantesTab';
import { CandidatosTab } from './CandidatosTab';
import { PruebasDinamicasTab } from './PruebasDinamicasTab';

// ============================================================================
// Sub-tabs internos
// ============================================================================

interface SubTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SUB_TABS: SubTab[] = [
  {
    key: 'vacantes',
    label: 'Vacantes',
    icon: <Briefcase size={16} />,
    component: VacantesTab,
  },
  {
    key: 'candidatos',
    label: 'Candidatos',
    icon: <Users size={16} />,
    component: CandidatosTab,
  },
  {
    key: 'entrevistas',
    label: 'Entrevistas',
    icon: <MessageSquare size={16} />,
    component: null,
  },
  {
    key: 'pruebas',
    label: 'Pruebas',
    icon: <ClipboardCheck size={16} />,
    component: PruebasDinamicasTab,
  },
  {
    key: 'afiliaciones',
    label: 'Afiliaciones SS',
    icon: <Shield size={16} />,
    component: null,
  },
  {
    key: 'contratos',
    label: 'Contratos',
    icon: <FileText size={16} />,
    component: null,
  },
];

// ============================================================================
// Componente
// ============================================================================

export const SeleccionSection = () => {
  const [activeTab, setActiveTab] = useState('vacantes');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sub-tabs de seleccion">
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
                {!tab.component && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    Pronto
                  </span>
                )}
              </button>
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
            description={`Seccion en desarrollo. Estara disponible proximamente.`}
          />
        </Card>
      )}
    </div>
  );
};
