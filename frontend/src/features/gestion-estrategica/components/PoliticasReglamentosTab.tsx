/**
 * Tab: Mis Políticas y Reglamentos — Tab 4 de Fundación
 *
 * Secciones:
 * 1. Políticas Obligatorias — Política Integral, Habeas Data, Acoso Laboral, Desconexión, Seguridad Info
 * 2. Reglamento Interno — Reglamento Interno de Trabajo (CST Art. 104-125)
 * 3. Contratos Tipo — Plantillas de contratos laborales
 *
 * Lógica: "¿Con qué reglas opero?" — Marco normativo interno.
 */
import { GenericSectionFallback } from '@/components/common';
import { PoliticasSection } from './PoliticasSection';
import { ReglamentoInternoSection } from './ReglamentoInternoSection';
import { ContratosTipoSection } from './ContratosTipoSection';

interface PoliticasReglamentosTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  politicas_obligatorias: PoliticasSection,
  reglamento_interno: ReglamentoInternoSection,
  contratos_tipo: ContratosTipoSection,
};

export const PoliticasReglamentosTab = ({ activeSection }: PoliticasReglamentosTabProps) => {
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  if (activeSection && !ActiveComponent) {
    return (
      <GenericSectionFallback
        sectionCode={activeSection}
        parentName="Mis Políticas y Reglamentos"
      />
    );
  }

  if (!ActiveComponent) {
    return <PoliticasSection />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
