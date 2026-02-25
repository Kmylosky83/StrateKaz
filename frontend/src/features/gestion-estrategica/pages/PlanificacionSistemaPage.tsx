/**
 * Planificación del Sistema - Sistema de Gestión
 *
 * Secciones desde BD (sistema_gestion > planificacion_sistema):
 * - programas: Programas del Sistema
 * - plan_auditorias: Plan de Auditorías
 * - objetivos_metas: Objetivos y Metas
 * - indicadores_gestion: Indicadores de Gestión
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections, GenericSectionFallback } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'sistema_gestion';
const TAB_CODE = 'planificacion_sistema';

export const PlanificacionSistemaPage = () => {
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

  const { color: moduleColor } = useModuleColor('sistema_gestion');

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
        title="Planificación del Sistema"
        description={
          activeSectionData.description ||
          'Programas, plan de auditorías, objetivos, metas e indicadores del sistema de gestión'
        }
      />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && (
        <GenericSectionFallback
          sectionCode={activeSection}
          moduleName="Planificación del Sistema"
        />
      )}
    </div>
  );
};

export default PlanificacionSistemaPage;
