/**
 * Tab de Organizacion - Modulo Direccion Estrategica
 *
 * Secciones (orden desde BD):
 * 1. Areas - Gestion de areas/departamentos
 * 2. Cargos - Gestion de cargos organizacionales
 * 3. Organigrama - Vista del organigrama
 * 4. Colaboradores - Gestión de usuarios/colaboradores
 * 5. Roles - Control de Acceso (permisos, roles adicionales)
 *
 * Las secciones se controlan desde DynamicSections en la pagina padre
 */

// Importar componentes de RBAC (re-exports desde ./rbac/index.ts)
import { CargosTab, RolesTab } from './rbac';

// Importar componentes internos
import { OrganigramaView } from './OrganigramaView';
import { AreasTab } from './AreasTab';
import { ColaboradoresSection } from './ColaboradoresSection';

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
  roles: RolesTab,
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
