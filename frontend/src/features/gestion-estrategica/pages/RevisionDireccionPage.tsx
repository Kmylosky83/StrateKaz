/**
 * Página de Revisión por Dirección - Tab 6 de Dirección Estratégica
 *
 * Cumplimiento ISO 9001:2015 - Cláusula 9.3
 *
 * Layout:
 * 1. PageHeader
 * 2. DynamicSections (sub-navigation desde API, si existen)
 * 3. StatsGrid
 * 4. Contenido de la sección activa (RevisionDireccionTab)
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useTabSections } from '../hooks/useModules';
import { RevisionDireccionTab } from '../components/revision-direccion';
import { useRevisionDireccionStats } from '../hooks/useRevisionDireccion';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'revision_direccion';

export const RevisionDireccionPage = () => {
  const { data: stats, isLoading: statsLoading } = useRevisionDireccionStats();
  const { sections, isLoading: sectionsLoading } = useTabSections(MODULE_CODE, TAB_CODE);

  // Sección activa - inicializar con la primera sección habilitada
  const [activeSection, setActiveSection] = useState<string>('');

  // Establecer sección inicial cuando se cargan
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  // Formatear próxima revisión
  const proximaRevisionText = stats?.proxima_revision
    ? `Próxima: ${stats.proxima_revision.codigo}`
    : 'Sin programar';

  const statsItems: StatItem[] = [
    {
      label: 'Revisiones Programadas',
      value: stats?.total_programaciones ?? 0,
      icon: Calendar,
      iconColor: 'primary',
      description: proximaRevisionText,
    },
    {
      label: 'Actas Generadas',
      value: stats?.total_actas ?? 0,
      icon: ClipboardCheck,
      iconColor: 'info',
      description: `${stats?.actas_aprobadas ?? 0} aprobadas`,
    },
    {
      label: 'Compromisos Pendientes',
      value: stats?.compromisos_pendientes ?? 0,
      icon: AlertCircle,
      iconColor: stats?.compromisos_pendientes && stats.compromisos_pendientes > 0 ? 'warning' : 'success',
      description: `${stats?.compromisos_vencidos ?? 0} vencidos`,
    },
    {
      label: 'Compromisos Cumplidos',
      value: stats?.compromisos_completados ?? 0,
      icon: CheckCircle2,
      iconColor: 'success',
      description: `${Math.round(stats?.tasa_cumplimiento_compromisos ?? 0)}% de cumplimiento`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revisión por la Dirección"
        description="Gestiona las revisiones gerenciales según ISO 9001:2015 - Cláusula 9.3"
      />

      {/* Sub-navigation dinámica desde API (si existen secciones) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        macroprocessColor="purple"
        variant="pills"
      />

      {statsLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={statsItems} columns={4} macroprocessColor="purple" />
      )}

      {/* Contenido */}
      <RevisionDireccionTab />
    </div>
  );
};

export default RevisionDireccionPage;
