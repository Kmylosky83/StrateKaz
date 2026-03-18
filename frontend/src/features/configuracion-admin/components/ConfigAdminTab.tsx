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
  // Sin sección activa = aún cargando, no renderizar nada
  if (!activeSection) {
    return null;
  }

  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  if (!ActiveComponent) {
    return <GenericSectionFallback sectionCode={activeSection} parentName="Configuración" />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
