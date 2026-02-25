/**
 * Acciones de Mejora - Sistema de Gestión
 *
 * Secciones desde BD (sistema_gestion > acciones_mejora):
 * - no_conformidades: No Conformidades
 * - acciones_correctivas: Acciones Correctivas
 * - acciones_preventivas: Acciones Preventivas
 * - oportunidades_mejora: Oportunidades de Mejora
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections, GenericSectionFallback } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'sistema_gestion';
const TAB_CODE = 'acciones_mejora';

export const AccionesMejoraPage = () => {
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
        title="Acciones de Mejora"
        description={
          activeSectionData.description ||
          'No conformidades, acciones correctivas, preventivas y oportunidades de mejora'
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
        <GenericSectionFallback sectionCode={activeSection} moduleName="Acciones de Mejora" />
      )}
    </div>
  );
};

export default AccionesMejoraPage;
