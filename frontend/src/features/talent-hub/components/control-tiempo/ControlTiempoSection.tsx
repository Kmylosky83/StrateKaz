/**
 * ControlTiempoSection - Componente principal del módulo Control de Tiempo
 * Talento Humano > Control de Tiempo
 *
 * 5 sub-tabs para gestionar asistencia y horas:
 * 1. Dashboard - KPIs, calendario y acceso rápido a marcaje
 * 2. Turnos - CRUD turnos laborales
 * 3. Asistencia - Registros de asistencia
 * 4. Horas Extras - Solicitudes y aprobaciones
 * 5. Consolidados - Resumen mensual
 */
import { useState } from 'react';
import { LayoutDashboard, Clock, UserCheck, Timer, FileText } from 'lucide-react';
import { PageTabs, type TabItem } from '@/components/layout/PageTabs';
import { DashboardTiempo } from './DashboardTiempo';
import { TurnosTab } from './TurnosTab';
import { AsistenciaTab } from './AsistenciaTab';
import { HorasExtrasTab } from './HorasExtrasTab';
import { ConsolidadosTab } from './ConsolidadosTab';

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'turnos', label: 'Turnos', icon: Clock },
  { id: 'asistencia', label: 'Asistencia', icon: UserCheck },
  { id: 'horas-extras', label: 'Horas Extras', icon: Timer },
  { id: 'consolidados', label: 'Consolidados', icon: FileText },
];

export const ControlTiempoSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-4">
      <PageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />

      {activeTab === 'dashboard' ? (
        <DashboardTiempo onNavigateTab={setActiveTab} />
      ) : activeTab === 'turnos' ? (
        <TurnosTab />
      ) : activeTab === 'asistencia' ? (
        <AsistenciaTab />
      ) : activeTab === 'horas-extras' ? (
        <HorasExtrasTab />
      ) : activeTab === 'consolidados' ? (
        <ConsolidadosTab />
      ) : null}
    </div>
  );
};
