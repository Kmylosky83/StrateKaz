/**
 * Página de Identidad - Tab 3 de Dirección Estratégica
 *
 * Layout estandarizado:
 * 1. PageHeader (solo titulo y descripcion)
 * 2. DynamicSections (sub-tabs debajo del header, variante underline)
 * 3. Contenido de la sección activa
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { IdentidadTab } from '../components/IdentidadTab';
import { usePageSections } from '@/hooks/usePageSections';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'identidad';

export const IdentidadPage = () => {
  // Hook que maneja secciones localmente (igual que OrganizacionPage y ConfiguracionPage)
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

  // Si no hay sección activa aún (cargando), mostrar skeleton básico
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
      {/* PageHeader solo titulo y descripcion */}
      <PageHeader title="Identidad Corporativa" description={activeSectionData.description} />

      {/* Sub-tabs debajo del header (underline, color dinamico) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {/* Contenido de la sección activa */}
      {activeSection && <IdentidadTab activeSection={activeSection} />}
    </div>
  );
};

export default IdentidadPage;
