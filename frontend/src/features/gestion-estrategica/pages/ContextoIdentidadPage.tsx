/**
 * Página: Mi Contexto e Identidad — Tab 2 de Fundación
 *
 * "¿Dónde estoy y quién soy?" — Diagnóstico del entorno y direccionamiento estratégico.
 *
 * Secciones (desde BD: fundacion > contexto_identidad):
 * 1. partes_interesadas — Catálogo maestro de stakeholders
 * 2. analisis_contexto — Herramientas PCI, POAM, PESTEL, Porter
 * 3. mision_vision — Direccionamiento estratégico
 * 4. valores — Principios y valores corporativos
 * 5. normas_iso — Normas ISO aplicables
 * 6. alcance_sig — Cobertura del Sistema Integrado de Gestión
 */
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { ContextoIdentidadTab } from '../components/ContextoIdentidadTab';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'fundacion';
const TAB_CODE = 'contexto_identidad';

export const ContextoIdentidadPage = () => {
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
      <PageHeader title="Mi Contexto e Identidad" description={activeSectionData.description} />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && <ContextoIdentidadTab activeSection={activeSection} />}
    </div>
  );
};

export default ContextoIdentidadPage;
