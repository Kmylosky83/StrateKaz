/**
 * SeleccionSection - Componente principal del modulo Seleccion y Contratacion
 * Talento Humano > Seleccion y Contratacion
 *
 * Contiene 8 sub-tabs internos para gestionar todo el proceso:
 * 0. Dashboard - KPIs y metricas del proceso
 * 1. Vacantes - CRUD de vacantes activas
 * 2. Candidatos - Pipeline de candidatos
 * 3. Entrevistas - Sincronas + Asincronicas por email
 * 4. Pruebas - Tests dinamicos, psicometricos y evaluaciones
 * 5. Perfilamiento - Matching y scoring candidato-vacante
 * 6. Afiliaciones - Gestion SS (EPS, ARL, AFP, CCF)
 * 7. Contratos - Historial contractual (Ley 2466/2025)
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  BarChart3,
  Briefcase,
  Users,
  MessageSquare,
  ClipboardCheck,
  Target,
  Shield,
  FileText,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { DashboardTab } from './DashboardTab';
import { VacantesTab } from './VacantesTab';
import { CandidatosTab } from './CandidatosTab';
import { EntrevistasTab } from './EntrevistasTab';
import { PruebasDinamicasTab } from './PruebasDinamicasTab';
import { PerfilamientoTab } from './PerfilamientoTab';
import { AfiliacionesTab } from './AfiliacionesTab';
import { ContratosTab } from './ContratosTab';

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
    key: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 size={16} />,
    component: DashboardTab,
  },
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
    component: EntrevistasTab,
  },
  {
    key: 'pruebas',
    label: 'Pruebas',
    icon: <ClipboardCheck size={16} />,
    component: PruebasDinamicasTab,
  },
  {
    key: 'perfilamiento',
    label: 'Perfilamiento',
    icon: <Target size={16} />,
    component: PerfilamientoTab,
  },
  {
    key: 'afiliaciones',
    label: 'Afiliaciones SS',
    icon: <Shield size={16} />,
    component: AfiliacionesTab,
  },
  {
    key: 'contratos',
    label: 'Contratos',
    icon: <FileText size={16} />,
    component: ContratosTab,
  },
];

// ============================================================================
// Componente
// ============================================================================

export const SeleccionSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

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
                {!tab.component && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    Pronto
                  </span>
                )}
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
            description={`Seccion en desarrollo. Estara disponible proximamente.`}
          />
        </Card>
      )}
    </div>
  );
};
