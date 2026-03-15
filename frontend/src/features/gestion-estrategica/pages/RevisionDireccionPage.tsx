/**
 * Página de Revisión por Dirección - Tab 8 de Dirección Estratégica
 *
 * Cumplimiento ISO 9001:2015 - Cláusula 9.3
 *
 * Layout estandarizado (igual que las demas paginas GE):
 * 1. PageHeader (solo titulo y descripcion)
 * 2. DynamicSections (sub-tabs debajo del header, variante underline)
 * 3. StatsGrid con KPIs
 * 4. Contenido de la seccion activa (RevisionDireccionTab)
 *
 * Secciones desde BD: programacion, actas, compromisos
 */
import { ClipboardCheck, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';
import { RevisionDireccionTab } from '../components/revision-direccion';
import { useRevisionDireccionStats } from '../hooks/useRevisionDireccion';

// Códigos del módulo y tab en la BD
const MODULE_CODE = 'revision_direccion';
const TAB_CODE = 'revision_direccion';

export const RevisionDireccionPage = () => {
  const { data: stats, isLoading: statsLoading } = useRevisionDireccionStats();
  const { color: moduleColor } = useModuleColor('revision_direccion');

  const {
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading: sectionsLoading,
  } = usePageSections({
    moduleCode: MODULE_CODE,
    tabCode: TAB_CODE,
  });

  // Formatear próxima revisión
  const proximaRevisionText = stats?.proxima_revision
    ? `Próxima: ${stats.proxima_revision.codigo}`
    : 'Sin programar';

  const statsItems: StatItem[] = [
    {
      label: 'Revisiones Programadas',
      value: stats?.total_programaciones ?? 0,
      icon: Calendar,
      iconColor: 'info',
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
      iconColor:
        stats?.compromisos_pendientes && stats.compromisos_pendientes > 0 ? 'warning' : 'success',
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

  // Si no hay sección activa aún (cargando), mostrar skeleton básico
  if (!activeSection && sectionsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Revisión por la Dirección"
        description={
          activeSectionData.description ||
          'Gestiona las revisiones gerenciales según ISO 9001:2015 - Cláusula 9.3'
        }
      />

      {/* Sub-tabs debajo del header (underline, color dinamico) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {statsLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={statsItems} columns={4} moduleColor={moduleColor} />
      )}

      {/* Contenido de la seccion activa */}
      {activeSection && <RevisionDireccionTab activeSection={activeSection} />}
    </div>
  );
};

export default RevisionDireccionPage;
