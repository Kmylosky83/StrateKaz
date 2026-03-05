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
import { PageTabs, type TabItem } from '@/components/layout/PageTabs';
import { DashboardTab } from './DashboardTab';
import { EvaluacionesTab } from './EvaluacionesTab';
import { PlanesMejoraTab } from './PlanesMejoraTab';
import { ReconocimientosTab } from './ReconocimientosTab';
import { MuroTab } from './MuroTab';

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck },
  { id: 'planes', label: 'Planes de Mejora', icon: TrendingUp },
  { id: 'reconocimientos', label: 'Reconocimientos', icon: Award },
  { id: 'muro', label: 'Muro', icon: MessageSquare },
];

const TAB_COMPONENTS: Record<string, React.ComponentType | null> = {
  dashboard: DashboardTab,
  evaluaciones: EvaluacionesTab,
  planes: PlanesMejoraTab,
  reconocimientos: ReconocimientosTab,
  muro: MuroTab,
};

export const DesempenoSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const TabComponent = TAB_COMPONENTS[activeTab] ?? null;

  return (
    <div className="space-y-4">
      <PageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />

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
            description="Sección en desarrollo."
          />
        </Card>
      )}
    </div>
  );
};
