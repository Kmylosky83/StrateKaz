/**
 * Página: Mi Organización — Tab 3 de Fundación
 *
 * "¿Cómo funciono?" — Procesos, caracterizaciones SIPOC y mapa.
 *
 * Layout estandarizado:
 * 1. PageHeader (título y descripción dinámica)
 * 2. DynamicSections (subtabs underline, color dinámico)
 * 3. Contenido de la sección activa
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { OrganizacionTab } from '../components/OrganizacionTab';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'fundacion';
const TAB_CODE = 'organizacion';

export const OrganizacionPage = () => {
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
      <PageHeader title="Mi Organización" description={activeSectionData.description} />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && <OrganizacionTab activeSection={activeSection} />}
    </div>
  );
};

export default OrganizacionPage;
