/**
 * Página: Mi Sistema de Gestión — Tab 3 de Fundación
 *
 * "¿Con qué reglas opero?" — Normas, alcance, políticas y config técnica.
 *
 * Layout estandarizado:
 * 1. PageHeader (título y descripción dinámica)
 * 2. DynamicSections (subtabs underline, color dinámico)
 * 3. Contenido de la sección activa
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { MiSistemaGestionTab } from '../components/MiSistemaGestionTab';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'fundacion';
const TAB_CODE = 'sistema_gestion';

export const MiSistemaGestionPage = () => {
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

  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');

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
      <PageHeader title="Mi Sistema de Gestión" description={activeSectionData.description} />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && <MiSistemaGestionTab activeSection={activeSection} />}
    </div>
  );
};

export default MiSistemaGestionPage;
