/**
 * FormacionSection - Componente principal del modulo Formacion y Reinduccion
 * Talento Humano > Formacion y Reinduccion
 *
 * 5 sub-tabs para gestionar formacion y desarrollo:
 * 1. Dashboard - KPIs y metricas
 * 2. Capacitaciones - CRUD cursos y programas
 * 3. Programacion - Calendario de sesiones
 * 4. Gamificacion - Leaderboard, badges, puntos
 * 5. Certificados - Emision y verificacion
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { BarChart3, GraduationCap, CalendarDays, Trophy, Award } from 'lucide-react';
import { PageTabs, type TabItem } from '@/components/layout/PageTabs';
import { DashboardTab } from './DashboardTab';
import { CapacitacionesTab } from './CapacitacionesTab';
import { ProgramacionTab } from './ProgramacionTab';
import { GamificacionTab } from './GamificacionTab';
import { CertificadosTab } from './CertificadosTab';

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'capacitaciones', label: 'Capacitaciones', icon: GraduationCap },
  { id: 'programacion', label: 'Programación', icon: CalendarDays },
  { id: 'gamificacion', label: 'Gamificación', icon: Trophy },
  { id: 'certificados', label: 'Certificados', icon: Award },
];

const TAB_COMPONENTS: Record<string, React.ComponentType | null> = {
  dashboard: DashboardTab,
  capacitaciones: CapacitacionesTab,
  programacion: ProgramacionTab,
  gamificacion: GamificacionTab,
  certificados: CertificadosTab,
};

export const FormacionSection = () => {
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
