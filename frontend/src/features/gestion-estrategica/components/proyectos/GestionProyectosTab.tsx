/**
 * Tab Principal de Gestión de Proyectos PMI
 * Semana 5: Gestión de Proyectos
 *
 * Secciones (orden desde BD):
 * 1. Portafolio - Vista general y Kanban
 * 2. Iniciación - Proyectos en fase de iniciación
 * 3. Planificación - Proyectos en fase de planificación
 * 4. Ejecución/Monitoreo - Proyectos en ejecución
 * 5. Cierre - Proyectos en cierre y completados
 *
 * Las secciones se controlan desde DynamicSections en la página padre
 */

import { PortafolioSubTab } from './subtabs/PortafolioSubTab';
import { IniciacionSubTab } from './subtabs/IniciacionSubTab';
import { PlanificacionSubTab } from './subtabs/PlanificacionSubTab';
import { MonitoreoSubTab } from './subtabs/MonitoreoSubTab';
import { CierreSubTab } from './subtabs/CierreSubTab';

/**
 * Props del GestionProyectosTab
 * activeSection viene desde DynamicSections en la página padre
 */
interface GestionProyectosTabProps {
  /** Código de la sección activa (desde API) */
  activeSection?: string;
}

/**
 * Mapeo de códigos de sección a componentes
 * Los códigos deben coincidir con los de la BD (TabSection.code)
 * IMPORTANTE: Los códigos en BD están en minúsculas y con guiones
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  portafolio: PortafolioSubTab,
  iniciacion: IniciacionSubTab,
  planificacion: PlanificacionSubTab,
  ejecucion_monitoreo: MonitoreoSubTab,
  cierre: CierreSubTab,
};

export const GestionProyectosTab = ({ activeSection }: GestionProyectosTabProps) => {
  // Renderizar el componente de la sección activa
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  // Si no hay sección activa o no existe el componente, mostrar Portafolio por defecto
  if (!ActiveComponent) {
    if (activeSection) {
      console.warn(
        `[GestionProyectosTab] Sección "${activeSection}" no encontrada en SECTION_COMPONENTS. ` +
          `Secciones disponibles: ${Object.keys(SECTION_COMPONENTS).join(', ')}`
      );
    }
    return <PortafolioSubTab />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
