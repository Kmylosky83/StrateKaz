/**
 * Tab router: Configuración de Plataforma
 *
 * Mapea section codes del backend a componentes React.
 * Solo secciones con implementación real — sin placeholders.
 */
import { GenericSectionFallback } from '@/components/common';
import { ModulosSection } from './ModulosSection';
import { ConsecutivosSection } from './ConsecutivosSection';
import { CatalogosSection } from './CatalogosSection';
import { IntegracionesSection } from './IntegracionesSection';

interface ConfigAdminTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  modulos: ModulosSection,
  consecutivos: ConsecutivosSection,
  catalogos: CatalogosSection,
  integraciones: IntegracionesSection,
};

export const ConfigAdminTab = ({ activeSection }: ConfigAdminTabProps) => {
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  if (activeSection && !ActiveComponent) {
    return <GenericSectionFallback sectionCode={activeSection} parentName="Configuración" />;
  }

  if (!ActiveComponent) {
    return <ModulosSection />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
