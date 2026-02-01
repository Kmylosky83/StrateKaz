/**
 * Tab de Organizacion - Modulo Direccion Estrategica
 *
 * Secciones (orden desde BD):
 * 1. Áreas - Gestión de áreas/departamentos (Vista 7: Tree Cards)
 * 2. Cargos - Gestión de cargos organizacionales (Vista 2: Lista CRUD)
 * 3. Organigrama - Vista interactiva del organigrama (Vista 8: Organigrama)
 * 4. Colaboradores - Gestión de usuarios/colaboradores (Vista 2: Lista CRUD)
 * 5. Consecutivos - Configuración de consecutivos automáticos (Vista 2: Lista CRUD)
 * 6. Unidades - Catálogo de unidades de medida (Vista 2: Lista CRUD)
 *
 * Las secciones se controlan desde DynamicSections en la página padre.
 *
 * NOTA: La sección "Control de Acceso" fue removida del sistema.
 * Los permisos RBAC se configuran dentro del modal de edición de Cargos
 * (CargoFormModal > TabAccesoSecciones).
 */

// Importar CargosTab desde configuracion
import { CargosTab } from '@/features/configuracion/components/CargosTab';

// Importar componentes internos
import { OrganigramaView } from './OrganigramaView';
import { AreasTab } from './AreasTab';
import { ColaboradoresSection } from './ColaboradoresSection';

// Consecutivos y Unidades de Medida migrados desde Configuración
import { ConsecutivosSection } from './ConsecutivosSection';
import { UnidadesMedidaSection } from './UnidadesMedidaSection';

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
  cargos: CargosTab,
  organigrama: OrganigramaView,
  colaboradores: ColaboradoresSection,
  // Migrados desde Configuración
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
