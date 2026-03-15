/**
 * Página de Riesgos y Oportunidades - Tab de Dirección Estratégica
 *
 * Layout estandarizado:
 * 1. PageHeader (solo titulo y descripcion)
 * 2. DynamicSections (sub-tabs debajo del header, variante underline)
 * 3. Contenido de la sección activa (cada sección maneja su propio StatsGrid)
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';
import { RiesgosOportunidadesTab } from '../components/RiesgosOportunidadesTab';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'planeacion_estrategica';
const TAB_CODE = 'riesgos_oportunidades';

export const RiesgosOportunidadesPage = () => {
  // Hook que maneja secciones localmente (igual que ContextoPage)
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

  const { color: moduleColor } = useModuleColor('planeacion_estrategica');

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
      <PageHeader
        title="Riesgos y Oportunidades"
        description={
          activeSectionData.description ||
          'Gestión integral de riesgos y oportunidades organizacionales (ISO 31000 / ISO 9001:2015 Cláusula 6.1)'
        }
      />

      {/* Sub-tabs debajo del header (underline, color dinamico) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {/* Contenido - cada sección maneja su propio StatsGrid */}
      {activeSection && <RiesgosOportunidadesTab activeSection={activeSection} />}
    </div>
  );
};

export default RiesgosOportunidadesPage;
