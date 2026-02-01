/**
 * Tab principal de Revisión por la Dirección (ISO 9.3)
 * Integra los subtabs: Programación, Actas y Compromisos
 */
import { useState } from 'react';
import { Calendar, FileText, ClipboardList } from 'lucide-react';
import { PageTabs, type TabItem } from '@/components/layout/PageTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgramacionTab, ActasTab } from './subtabs';
import { CompromisosDashboard } from './CompromisosDashboard';
import { useRevisionDireccionStats } from '../../hooks/useRevisionDireccion';

export const RevisionDireccionTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('programacion');
  const { data: stats } = useRevisionDireccionStats();

  // Configuración de subtabs
  const subtabs: TabItem[] = [
    {
      id: 'programacion',
      label: 'Programación',
      icon: Calendar,
      badge: stats?.proximas_revisiones || undefined,
    },
    {
      id: 'actas',
      label: 'Actas',
      icon: FileText,
      badge: stats?.actas_pendientes_aprobacion || undefined,
    },
    {
      id: 'compromisos',
      label: 'Compromisos',
      icon: ClipboardList,
      badge: stats?.stats_compromisos?.total_vencidos || undefined,
    },
  ];

  // Renderizar contenido según subtab activo
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'programacion':
        return <ProgramacionTab />;
      case 'actas':
        return <ActasTab />;
      case 'compromisos':
        return <CompromisosDashboard />;
      default:
        return <ProgramacionTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Revisión por la Dirección"
        description="Gestión de revisiones periódicas del Sistema de Gestión (ISO 9.3)"
      />

      {/* Subtabs - Enhanced Pills */}
      <PageTabs
        tabs={subtabs}
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        variant="pills"
        moduleColor="purple"
        size="md"
      />

      {/* Contenido del subtab activo */}
      <div className="mt-6">
        {renderSubTabContent()}
      </div>
    </div>
  );
};
