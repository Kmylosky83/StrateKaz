/**
 * Tab: Mi Contexto e Identidad — Tab 2 de Fundación
 *
 * Secciones (orden lógico diagnóstico → identidad):
 * 1. Partes Interesadas — Catálogo maestro de stakeholders
 * 2. Análisis del Contexto — PCI, POAM, PESTEL, Porter, DOFA
 * 3. Misión y Visión — Direccionamiento estratégico
 * 4. Valores — Principios y valores corporativos
 * 5. Normas ISO — Sistemas de gestión aplicables
 * 6. Alcance SIG — Cobertura y exclusiones del Sistema Integrado
 *
 * Lógica: Primero conozco mi entorno (partes interesadas, contexto),
 * luego defino quién soy (misión, valores, normas, alcance).
 */
import { GenericSectionFallback } from '@/components/common';
import { StakeholdersSection, AnalisisContextoSection } from './contexto';
import { MisionVisionSection } from './MisionVisionSection';
import { ValoresSection } from './ValoresSection';
import { NormasISOSection } from './NormasISOSection';
import { AlcanceSIGSection } from './AlcanceSIGSection';

interface ContextoIdentidadTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  partes_interesadas: StakeholdersSection,
  analisis_contexto: AnalisisContextoSection,
  mision_vision: MisionVisionSection,
  valores: ValoresSection,
  normas_iso: NormasISOSection,
  alcance_sig: AlcanceSIGSection,
};

export const ContextoIdentidadTab = ({ activeSection }: ContextoIdentidadTabProps) => {
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  if (activeSection && !ActiveComponent) {
    return (
      <GenericSectionFallback sectionCode={activeSection} parentName="Mi Contexto e Identidad" />
    );
  }

  if (!ActiveComponent) {
    return <StakeholdersSection />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
