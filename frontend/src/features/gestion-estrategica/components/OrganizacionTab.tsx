/**
 * Tab de Organizacion - Modulo Direccion Estrategica
 *
 * Secciones (orden desde BD):
 * 1. Procesos (Areas) - Gestión de áreas/departamentos (Vista 7: Tree Cards)
 * 2. Mapa de Procesos - Visualización interactiva de áreas (modo 'areas' del canvas)
 * 3. Consecutivos - Configuración de consecutivos automáticos (Vista 2: Lista CRUD)
 *
 * NOTA: 'Cargos' y 'Colaboradores' migrados a Talento Humano (Sprint 13).
 * NOTA: 'Organigrama de Cargos' migrado a TH > Estructura de Cargos (Sprint 13).
 * NOTA: 'Unidades de Medida' eliminado — catálogo del sistema cargado vía seeds,
 *        se consume desde modal de Sedes (choices endpoint), no requiere vista propia.
 */

// Importar componentes internos
import { AreasTab } from './AreasTab';
import { MapaProcesosSection } from './MapaProcesosSection';
import { CaracterizacionesSection } from './CaracterizacionesSection';

// Consecutivos migrados desde Configuración
import { ConsecutivosSection } from './ConsecutivosSection';

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
  caracterizaciones: CaracterizacionesSection,
  mapa_procesos: MapaProcesosSection,
  consecutivos: ConsecutivosSection,
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
