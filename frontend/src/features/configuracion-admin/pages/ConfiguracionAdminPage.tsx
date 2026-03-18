/**
 * Página: Configuración de Plataforma
 *
 * Centro de control técnico del tenant: módulos, consecutivos,
 * catálogos maestros e integraciones.
 *
 * 3 tabs: General, Catálogos, Conexiones.
 * tabCode se extrae directo de la URL: /configuracion-admin/{tabCode}
 */
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';
import { ConfigAdminTab } from '../components/ConfigAdminTab';

const MODULE_CODE = 'configuracion_plataforma';

/** Títulos por tab */
const TAB_TITLES: Record<string, string> = {
  general: 'Configuración General',
  catalogos: 'Catálogos Maestros',
  conexiones: 'Conexiones e Integraciones',
};

export const ConfiguracionAdminPage = () => {
  const location = useLocation();
  const tabCode = location.pathname.split('/').pop() || 'general';

  const {
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading: sectionsLoading,
  } = usePageSections({
    moduleCode: MODULE_CODE,
    tabCode,
  });

  const { color: moduleColor } = useModuleColor('configuracion_plataforma');

  if (!activeSection) {
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
        title={TAB_TITLES[tabCode] || 'Configuración de Plataforma'}
        description={activeSectionData?.description || 'Ajustes técnicos de la plataforma'}
      />

      {sections.length > 1 && (
        <DynamicSections
          sections={sections}
          activeSection={activeSection}
          onChange={setActiveSection}
          isLoading={sectionsLoading}
          variant="underline"
          moduleColor={moduleColor}
        />
      )}

      {activeSection && <ConfigAdminTab activeSection={activeSection} />}
    </div>
  );
};

export default ConfiguracionAdminPage;
