/**
 * Página: Mis Políticas y Reglamentos — Tab 4 de Fundación
 *
 * "¿Con qué reglas opero?" — Marco normativo interno obligatorio.
 *
 * Secciones (desde BD: fundacion > politicas_reglamentos):
 * 1. politicas_obligatorias — Política Integral, Habeas Data, Acoso Laboral, Desconexión, Seguridad Info
 * 2. reglamento_interno — Reglamento Interno de Trabajo (CST Art. 104-125)
 * 3. contratos_tipo — Plantillas de contratos laborales
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { PoliticasReglamentosTab } from '../components/PoliticasReglamentosTab';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'fundacion';
const TAB_CODE = 'politicas_reglamentos';

export const PoliticasReglamentosPage = () => {
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

  const { color: moduleColor } = useModuleColor('fundacion');

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
      <PageHeader title="Mis Políticas y Reglamentos" description={activeSectionData.description} />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && <PoliticasReglamentosTab activeSection={activeSection} />}
    </div>
  );
};

export default PoliticasReglamentosPage;
