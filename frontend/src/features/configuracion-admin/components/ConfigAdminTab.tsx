/**
 * Tab router: Configuración de Plataforma
 *
 * Mapea section codes del backend a componentes React.
 * Solo secciones con implementación real — sin placeholders.
 */
import { GenericSectionFallback } from '@/components/common';
import { CatalogosSection } from './CatalogosSection';
import { IntegracionesSection } from './IntegracionesSection';

// 2026-04-22 — tab "general" eliminado del seed configuracion_plataforma.
//   - `modulos` (activar/desactivar módulos): se gestiona desde Admin Global
//     → TenantFormModal → TabModulos (decisión V3 "control de plataforma").
//   - `consecutivos` (Sistema B ConsecutivoConfig UI): eliminada. Los códigos
//     se autogeneran desde cada modelo via `apps/core/utils/consecutivos.py`
//     (Sistema A, scan-and-increment). El modelo ConsecutivoConfig queda en
//     backend hasta que último consumer residual (configuracion.Sede, tests)
//     se refactorice.
interface ConfigAdminTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
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
