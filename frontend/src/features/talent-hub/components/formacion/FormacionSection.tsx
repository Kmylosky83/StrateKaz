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
import { cn } from '@/utils/cn';
import { DashboardTab } from './DashboardTab';
import { CapacitacionesTab } from './CapacitacionesTab';
import { ProgramacionTab } from './ProgramacionTab';
import { GamificacionTab } from './GamificacionTab';
import { CertificadosTab } from './CertificadosTab';

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
    key: 'capacitaciones',
    label: 'Capacitaciones',
    icon: <GraduationCap size={16} />,
    component: CapacitacionesTab,
  },
  {
    key: 'programacion',
    label: 'Programacion',
    icon: <CalendarDays size={16} />,
    component: ProgramacionTab,
  },
  {
    key: 'gamificacion',
    label: 'Gamificacion',
    icon: <Trophy size={16} />,
    component: GamificacionTab,
  },
  {
    key: 'certificados',
    label: 'Certificados',
    icon: <Award size={16} />,
    component: CertificadosTab,
  },
];

export const FormacionSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentTab = SUB_TABS.find((t) => t.key === activeTab) || SUB_TABS[0];
  const TabComponent = currentTab.component;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sub-tabs de formacion">
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
