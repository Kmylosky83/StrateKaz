/**
 * Tab: Mi Organización — Tab 3 de Fundación (Cascada V2)
 *
 * Subtabs:
 * 1. Áreas — Estructura jerárquica de áreas y procesos
 * 2. Cargos — Gestión de cargos, manual de funciones y permisos RBAC
 * 3. Mapa de Procesos — Visualización interactiva
 * 4. Caracterizaciones — Ficha SIPOC por proceso
 * 5. Organigrama — Visualización interactiva de la jerarquía de cargos
 *
 * Lógica: "¿Cómo funciono?" — Estructura operativa de la empresa.
 */
import { AreasTab } from './AreasTab';
import { MapaProcesosSection } from './MapaProcesosSection';
import { CaracterizacionesSection } from './CaracterizacionesSection';
import { CargosTab as CargosSection } from '@/features/configuracion/components/CargosTab';
import { OrganigramaView } from './OrganigramaView';

/**
 * Wrapper para OrganigramaView con los modos de cargos
 */
const OrganigramaSection = () => (
  <OrganigramaView allowedModes={['cargos', 'compact']} defaultMode="cargos" showToolbar={false} />
);

/**
 * Props del OrganizacionTab
 * activeSection viene desde DynamicSections en la página padre
 */
interface OrganizacionTabProps {
  /** Código de la sección activa (desde API) */
  activeSection?: string;
}

/**
 * Mapeo de códigos de sección a componentes
 * Los códigos deben coincidir con los de la BD (TabSection.code)
 * IMPORTANTE: Los códigos en BD están en minúsculas
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  areas: AreasTab,
  cargos: CargosSection,
  mapa_procesos: MapaProcesosSection,
  caracterizaciones: CaracterizacionesSection,
  organigrama: OrganigramaSection,
};

export const OrganizacionTab = ({ activeSection }: OrganizacionTabProps) => {
  // Renderizar el componente de la sección activa
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  // Si no hay sección activa o no existe el componente, mostrar Áreas por defecto
  if (!ActiveComponent) {
    if (activeSection) {
      console.warn(
        `[OrganizacionTab] Sección "${activeSection}" no encontrada en SECTION_COMPONENTS. ` +
          `Secciones disponibles: ${Object.keys(SECTION_COMPONENTS).join(', ')}`
      );
    }
    return <AreasTab />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
