/**
 * Tab de Riesgos y Oportunidades
 *
 * Secciones dinamicas desde BD (TabSection.code):
 * - resumen: Vista general de indicadores de riesgos y oportunidades
 * - mapa_calor: Visualización matricial de probabilidad vs impacto
 * - riesgos: Identificación y gestión de riesgos organizacionales
 * - oportunidades: Identificación y aprovechamiento de oportunidades
 * - tratamientos: Planes de tratamiento y controles
 *
 * Usa Design System:
 * - GenericSectionFallback para secciones no implementadas
 * - DataSection, DataGrid, DataCard para visualizacion
 * - Vista 2B para listas con filtros
 */
import { GenericSectionFallback } from '@/components/common';
import {
  ResumenRiesgosSection,
  MapaCalorSection,
  RiesgosSection,
  OportunidadesSection,
  TratamientosSection,
} from './riesgos-oportunidades';

// =============================================================================
// CODIGOS DE SECCION (deben coincidir con BD - TabSection.code)
// =============================================================================

const SECTION_KEYS = {
  RESUMEN: 'resumen',
  MAPA_CALOR: 'mapa_calor',
  RIESGOS: 'riesgos',
  OPORTUNIDADES: 'oportunidades',
  TRATAMIENTOS: 'tratamientos',
} as const;

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface RiesgosOportunidadesTabProps {
  /** Codigo de la seccion activa (desde API/DynamicSections) */
  activeSection?: string;
  /** Trigger para abrir formulario de nuevo elemento */
  triggerNewForm?: number;
}

export const RiesgosOportunidadesTab = ({ activeSection, triggerNewForm }: RiesgosOportunidadesTabProps) => {
  // Renderizar seccion segun activeSection
  const renderSection = () => {
    switch (activeSection) {
      case SECTION_KEYS.RESUMEN:
        return <ResumenRiesgosSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.MAPA_CALOR:
        return <MapaCalorSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.RIESGOS:
        return <RiesgosSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.OPORTUNIDADES:
        return <OportunidadesSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.TRATAMIENTOS:
        return <TratamientosSection triggerNewForm={triggerNewForm} />;

      default:
        // Si no hay seccion activa o no esta mapeada, mostrar fallback
        if (activeSection) {
          console.warn(
            `[RiesgosOportunidadesTab] Seccion "${activeSection}" no encontrada en SECTION_KEYS. ` +
              `Secciones disponibles: ${Object.values(SECTION_KEYS).join(', ')}`
          );
        }
        return (
          <GenericSectionFallback
            sectionCode={activeSection || 'desconocido'}
            moduleName="Riesgos y Oportunidades"
            message="Seleccione una sección del menú para comenzar"
          />
        );
    }
  };

  return <div className="space-y-6">{renderSection()}</div>;
};

export default RiesgosOportunidadesTab;
