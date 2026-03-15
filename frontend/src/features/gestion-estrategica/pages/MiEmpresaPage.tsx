/**
 * Página: Mi Empresa — Tab 1 de Fundación
 *
 * "¿Quién soy?" — Datos, identidad, valores y ubicaciones.
 *
 * Layout estandarizado:
 * 1. PageHeader (título y descripción dinámica)
 * 2. DynamicSections (subtabs underline, color dinámico)
 * 3. Contenido de la sección activa
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { MiEmpresaTab } from '../components/MiEmpresaTab';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'fundacion';
const TAB_CODE = 'mi_empresa';

export const MiEmpresaPage = () => {
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
      <PageHeader title="Mi Empresa" description={activeSectionData.description} />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && <MiEmpresaTab activeSection={activeSection} />}
    </div>
  );
};

export default MiEmpresaPage;
