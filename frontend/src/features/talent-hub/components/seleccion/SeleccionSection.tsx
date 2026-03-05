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
import { PageTabs, type TabItem } from '@/components/layout/PageTabs';
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

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'vacantes', label: 'Vacantes', icon: Briefcase },
  { id: 'candidatos', label: 'Candidatos', icon: Users },
  { id: 'entrevistas', label: 'Entrevistas', icon: MessageSquare },
  { id: 'pruebas', label: 'Pruebas', icon: ClipboardCheck },
  { id: 'perfilamiento', label: 'Perfilamiento', icon: Target },
  { id: 'afiliaciones', label: 'Afiliaciones SS', icon: Shield },
  { id: 'contratos', label: 'Contratos', icon: FileText },
];

const TAB_COMPONENTS: Record<string, React.ComponentType | null> = {
  dashboard: DashboardTab,
  vacantes: VacantesTab,
  candidatos: CandidatosTab,
  entrevistas: EntrevistasTab,
  pruebas: PruebasDinamicasTab,
  perfilamiento: PerfilamientoTab,
  afiliaciones: AfiliacionesTab,
  contratos: ContratosTab,
};

// ============================================================================
// Componente
// ============================================================================

export const SeleccionSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const TabComponent = TAB_COMPONENTS[activeTab] ?? null;

  return (
    <div className="space-y-4">
      {/* Sub-tabs navigation */}
      <PageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />

      {/* Tab content */}
      {TabComponent ? (
        <TabComponent />
      ) : (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                {currentTab.icon && <currentTab.icon size={16} />}
              </div>
            }
            title={currentTab.label}
            description={`Sección en desarrollo. Estará disponible próximamente.`}
          />
        </Card>
      )}
    </div>
  );
};
