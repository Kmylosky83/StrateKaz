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

  const { sections, activeSection, setActiveSection, activeSectionData } = usePageSections({
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
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {sections.map((s) => (
            <button
              key={s.code}
              onClick={() => setActiveSection(s.code)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeSection === s.code
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              style={
                activeSection === s.code ? { borderBottom: `2px solid ${moduleColor}` } : undefined
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <ConfigAdminTab activeSection={activeSection} />
    </div>
  );
};

export default ConfiguracionAdminPage;
