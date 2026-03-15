/**
 * Tab de Contexto Organizacional
 *
 * Secciones (REORG-B: PI movido a Fundación → Mi Organización):
 * 1. analisis_contexto: Encuestas PCI/POAM + PESTEL + Porter (3 sub-tabs)
 * 2. dofa_estrategias: Matriz DOFA + Estrategias TOWS (2 sub-tabs)
 *
 * Flujo: Recopilar (analisis_contexto) → Sintetizar (dofa) → Actuar (estrategias)
 */
import { GenericSectionFallback } from '@/components/common';
import { AnalisisContextoSection, DofaEstrategiasSection } from './contexto';

// =============================================================================
// CODIGOS DE SECCION (deben coincidir con BD - TabSection.code)
// =============================================================================

const SECTION_KEYS = {
  ANALISIS_CONTEXTO: 'analisis_contexto',
  DOFA_ESTRATEGIAS: 'dofa_estrategias',
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
  const renderSection = () => {
    switch (activeSection) {
      case SECTION_KEYS.ANALISIS_CONTEXTO:
        return <AnalisisContextoSection triggerNewForm={triggerNewForm} />;

      case SECTION_KEYS.DOFA_ESTRATEGIAS:
        return <DofaEstrategiasSection triggerNewForm={triggerNewForm} />;

      default:
        if (activeSection) {
          console.warn(
            `[ContextoTab] Sección "${activeSection}" no encontrada en SECTION_KEYS. ` +
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
