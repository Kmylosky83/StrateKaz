/**
 * EstructuraSection - Estructura de Cargos con sub-navegacion dinamica
 *
 * Sub-tabs desde BD (DynamicSections):
 * 1. Cargos - CRUD de cargos y niveles jerarquicos
 * 2. Organigrama - Visualizacion interactiva de jerarquia de cargos
 *
 * Patron: Igual que OrganizacionTab en GE — secciones desde API,
 * componente mapeado por codigo.
 */
import { useState, useEffect } from 'react';
import { DynamicSections } from '@/components/common';
import { useTabSections } from '@/hooks/useModules';
import { useModuleColor } from '@/hooks/useModuleColor';
// Importar directamente de fuentes (NO del barrel index.ts para evitar circular deps)
import { CargosTab as CargosSection } from '@/features/configuracion/components/CargosTab';
import { OrganigramaSection } from './OrganigramaSection';

const MODULE_CODE = 'talent_hub';
const TAB_CODE = 'estructura_cargos';

/**
 * Mapeo de codigos de seccion (BD) a componentes
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  cargos: CargosSection,
  organigrama: OrganigramaSection,
};

export const EstructuraSection = () => {
  const { sections, isLoading } = useTabSections(MODULE_CODE, TAB_CODE);
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const [activeSection, setActiveSection] = useState<string>('');

  // Inicializar con la primera seccion habilitada
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  return (
    <div className="space-y-4">
      {/* Sub-navegacion dinamica (pills) */}
      {sections.length > 1 && (
        <DynamicSections
          sections={sections}
          activeSection={activeSection}
          onChange={setActiveSection}
          isLoading={isLoading}
          variant="underline"
          moduleColor={moduleColor}
        />
      )}

      {/* Contenido de la seccion activa */}
      {ActiveComponent ? (
        <ActiveComponent />
      ) : (
        // Default: mostrar cargos si no hay seccion activa
        <CargosSection />
      )}
    </div>
  );
};
