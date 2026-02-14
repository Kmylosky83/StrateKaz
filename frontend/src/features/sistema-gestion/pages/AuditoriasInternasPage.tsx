/**
 * Auditorías Internas - Sistema de Gestión
 *
 * Secciones desde BD (sistema_gestion > auditorias_internas):
 * - programacion: Programación de Auditorías
 * - ejecucion_auditoria: Ejecución
 * - informes: Informes de Auditoría
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections, GenericSectionFallback } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'sistema_gestion';
const TAB_CODE = 'auditorias_internas';

export const AuditoriasInternasPage = () => {
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
        title="Auditorías Internas"
        description={
          activeSectionData.description ||
          'Programación, ejecución e informes de auditorías internas del sistema de gestión'
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
        <GenericSectionFallback sectionCode={activeSection} moduleName="Auditorías Internas" />
      )}
    </div>
  );
};

export default AuditoriasInternasPage;
