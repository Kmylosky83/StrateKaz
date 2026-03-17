/**
 * Tab router: Configuración de Plataforma
 *
 * Mapea section codes del backend a componentes React.
 * 4 funcionales + 5 EmptyState placeholders.
 * (Personalización eliminado — branding ya está en Fundación)
 */
import { Bell, Workflow, ArrowUpDown, BarChart3, ShieldCheck } from 'lucide-react';
import { GenericSectionFallback } from '@/components/common';
import { ModulosSection } from './ModulosSection';
import { ConsecutivosSection } from './ConsecutivosSection';
import { CatalogosSection } from './CatalogosSection';
import { IntegracionesSection } from './IntegracionesSection';
import { EmptyStateSection } from './EmptyStateSection';

interface ConfigAdminTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  modulos: ModulosSection,
  consecutivos: ConsecutivosSection,
  catalogos: CatalogosSection,
  integraciones: IntegracionesSection,
  plantillas_notificacion: () => (
    <EmptyStateSection
      icon={Bell}
      title="Plantillas de Notificación"
      description="Configura las plantillas de email, push y notificaciones del sistema."
      level="Level 20"
    />
  ),
  automatizaciones: () => (
    <EmptyStateSection
      icon={Workflow}
      title="Automatizaciones"
      description="Define reglas automáticas para flujos de trabajo recurrentes."
      level="Level 20"
    />
  ),
  importacion_exportacion: () => (
    <EmptyStateSection
      icon={ArrowUpDown}
      title="Importación y Exportación"
      description="Importa datos masivos y exporta información del sistema."
      level="Level 15"
    />
  ),
  config_indicadores: () => (
    <EmptyStateSection
      icon={BarChart3}
      title="Configuración de Indicadores"
      description="Define indicadores KPI, fórmulas y metas del sistema de gestión."
      level="Level 80"
    />
  ),
  auditoria_configuracion: () => (
    <EmptyStateSection
      icon={ShieldCheck}
      title="Auditoría de Configuración"
      description="Historial de cambios en la configuración del sistema."
      level="Level 30"
    />
  ),
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
