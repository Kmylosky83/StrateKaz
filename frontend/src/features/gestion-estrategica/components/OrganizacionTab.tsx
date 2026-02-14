/**
 * Tab de Organizacion - Modulo Direccion Estrategica
 *
 * Secciones (orden desde BD):
 * 1. Procesos (Areas) - Gestion de areas/departamentos (Vista 7: Tree Cards)
 * 2. Consecutivos - Configuracion de consecutivos automaticos (Vista 2: Lista CRUD)
 * 3. Unidades - Catalogo de unidades de medida (Vista 2: Lista CRUD)
 *
 * NOTA: 'Cargos' y 'Colaboradores' migrados a Talento Humano (Sprint 13).
 * NOTA: 'Organigrama' migrado a Talento Humano > Estructura (Sprint 13).
 */

// Importar componentes internos
import { AreasTab } from './AreasTab';

// Consecutivos y Unidades de Medida migrados desde Configuracion
import { ConsecutivosSection } from './ConsecutivosSection';
import { UnidadesMedidaSection } from './UnidadesMedidaSection';

/**
 * Props del OrganizacionTab
 * activeSection viene desde DynamicSections en la pagina padre
 */
interface OrganizacionTabProps {
  /** Codigo de la seccion activa (desde API) */
  activeSection?: string;
}

/**
 * Mapeo de codigos de seccion a componentes
 * Los codigos deben coincidir con los de la BD (TabSection.code)
 * IMPORTANTE: Los codigos en BD estan en minusculas
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  areas: AreasTab,
  consecutivos: ConsecutivosSection,
  unidades_medida: UnidadesMedidaSection,
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
