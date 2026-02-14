/**
 * Tab principal de Revisión por la Dirección (ISO 9.3)
 *
 * Recibe activeSection desde la página padre y renderiza
 * el componente correspondiente. Mismo patrón que ConfiguracionTab,
 * ContextoTab, etc.
 *
 * Secciones: programacion, actas, compromisos
 */
import { ProgramacionTab, ActasTab } from './subtabs';
import { CompromisosDashboard } from './CompromisosDashboard';

interface RevisionDireccionTabProps {
  activeSection: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  programacion: ProgramacionTab,
  actas: ActasTab,
  compromisos: CompromisosDashboard,
};

export const RevisionDireccionTab = ({ activeSection }: RevisionDireccionTabProps) => {
  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  if (!ActiveComponent) {
    return <ProgramacionTab />;
  }

  return <ActiveComponent />;
};
