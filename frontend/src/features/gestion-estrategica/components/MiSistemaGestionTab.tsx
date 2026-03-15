/**
 * Tab: Mi Sistema de Gestión — Tab 3 de Fundación
 *
 * Subtabs (orden lógico):
 * 1. Normas — Normas ISO y sistemas de gestión aplicables
 * 2. Alcance del SIG — Cobertura, procesos y exclusiones
 * 3. Políticas — Solo lectura desde Gestión Documental
 * 4. Consecutivos — Numeración automática de documentos
 * 5. Módulos — Activar/desactivar funcionalidades (superadmin)
 * 6. Integraciones — Conexiones con sistemas externos
 *
 * Lógica: "¿Con qué reglas opero?" — Marco normativo y config técnica.
 */
import { GenericSectionFallback } from '@/components/common';
import { NormasISOSection } from './NormasISOSection';
import { AlcanceSIGSection } from './AlcanceSIGSection';
import { PoliticasSection } from './PoliticasSection';
import { ConsecutivosSection } from './ConsecutivosSection';
import { ModulosSection } from './ModulosSection';
import { IntegracionesSection } from './IntegracionesSection';

interface MiSistemaGestionTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  normas_iso: NormasISOSection,
  alcance_sig: AlcanceSIGSection,
  politicas: PoliticasSection,
  consecutivos: ConsecutivosSection,
  modulos: ModulosSection,
  integraciones: IntegracionesSection,
};

export const MiSistemaGestionTab = ({ activeSection }: MiSistemaGestionTabProps) => {
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  if (activeSection && !ActiveComponent) {
    return (
      <GenericSectionFallback sectionCode={activeSection} parentName="Mi Sistema de Gestión" />
    );
  }

  if (!ActiveComponent) {
    return <NormasISOSection />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
