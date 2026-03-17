/**
 * Página: Configuración de Plataforma
 *
 * Centro de control técnico del tenant: módulos, consecutivos,
 * catálogos maestros, integraciones y configuración transversal.
 *
 * Layout: PageHeader + DynamicSections (underline) + ConfigAdminTab
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';
import { ConfigAdminTab } from '../components/ConfigAdminTab';

const MODULE_CODE = 'configuracion_plataforma';
const TAB_CODE = 'configuracion';

export const ConfiguracionAdminPage = () => {
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

  const { color: moduleColor } = useModuleColor('configuracion_plataforma');

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
      <PageHeader title="Configuración de Plataforma" description={activeSectionData.description} />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && <ConfigAdminTab activeSection={activeSection} />}
    </div>
  );
};

export default ConfiguracionAdminPage;
