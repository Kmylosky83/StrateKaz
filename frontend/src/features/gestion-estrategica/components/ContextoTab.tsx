/**
 * Tab de Contexto Organizacional
 *
 * Secciones dinámicas desde BD (TabSection.code) - Orden lógico:
 * 1. stakeholders: Identificación de partes interesadas
 * 2. encuestas_dofa: Encuestas PCI-POAM (fuente principal de datos DOFA+PESTEL)
 * 3. analisis_dofa: Visor de Matriz DOFA (solo lectura, alimentada desde Encuestas)
 * 4. analisis_pestel: Visor de Matriz PESTEL (solo lectura, alimentada desde Encuestas)
 * 5. fuerzas_porter: 5 Fuerzas de Porter
 * 6. estrategias_tows: Matriz TOWS (estrategias cruzadas)
 *
 * Flujo: Encuestas → Consolidar → DOFA + PESTEL automáticos → Porter → TOWS
 */
import { GenericSectionFallback } from '@/components/common';
import {
  StakeholdersSection,
  EncuestasDofaSection,
  AnalisisDofaSection,
  AnalisisPestelSection,
  FuerzasPorterSection,
  EstrategiasTowsSection,
} from './contexto';

// =============================================================================
// CODIGOS DE SECCION (deben coincidir con BD - TabSection.code)
// =============================================================================

const SECTION_KEYS = {
  STAKEHOLDERS: 'stakeholders',
  ENCUESTAS_DOFA: 'encuestas_dofa',
  ANALISIS_DOFA: 'analisis_dofa',
  ANALISIS_PESTEL: 'analisis_pestel',
  FUERZAS_PORTER: 'fuerzas_porter',
  ESTRATEGIAS_TOWS: 'estrategias_tows',
} as const;

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface ContextoTabProps {
  /** Codigo de la seccion activa (desde API/DynamicSections) */
  activeSection?: string;
  /** Trigger para abrir formulario de nuevo elemento */
  triggerNewForm?: number;
}

export const ContextoTab = ({ activeSection, triggerNewForm }: ContextoTabProps) => {
  // Renderizar seccion segun activeSection
  const renderSection = () => {
    switch (activeSection) {
      case SECTION_KEYS.STAKEHOLDERS:
        return <StakeholdersSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.ENCUESTAS_DOFA:
        return <EncuestasDofaSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.ANALISIS_DOFA:
        return <AnalisisDofaSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.ANALISIS_PESTEL:
        return <AnalisisPestelSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.FUERZAS_PORTER:
        return <FuerzasPorterSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.ESTRATEGIAS_TOWS:
        return <EstrategiasTowsSection triggerNewForm={triggerNewForm} />;

      default:
        // Si no hay seccion activa o no esta mapeada, mostrar fallback
        if (activeSection) {
          console.warn(
            `[ContextoTab] Seccion "${activeSection}" no encontrada en SECTION_KEYS. ` +
              `Secciones disponibles: ${Object.values(SECTION_KEYS).join(', ')}`
          );
        }
        return (
          <GenericSectionFallback
            sectionCode={activeSection || 'ninguna'}
            parentName="Contexto Organizacional"
          />
        );
    }
  };

  return <div className="space-y-6">{renderSection()}</div>;
};

export default ContextoTab;
