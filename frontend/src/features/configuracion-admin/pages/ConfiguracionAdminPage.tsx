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

      {/* DEBUG: DynamicSections comentado para aislar crash */}
      {sections.length > 1 && (
        <div className="flex gap-2 border-b pb-2">
          {sections.map((s) => (
            <button
              key={s.code}
              onClick={() => setActiveSection(s.code)}
              className={`px-3 py-1.5 text-sm rounded ${activeSection === s.code ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {activeSection && <ConfigAdminTab activeSection={activeSection} />}
    </div>
  );
};

export default ConfiguracionAdminPage;
