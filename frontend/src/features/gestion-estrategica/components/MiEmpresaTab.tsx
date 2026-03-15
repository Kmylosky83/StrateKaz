/**
 * Tab: Mi Empresa — Tab 1 de Fundación
 *
 * Subtabs (orden empresarial):
 * 1. Empresa — Datos generales, branding y configuración regional
 * 2. Direccionamiento — Misión, visión y propósito organizacional
 * 3. Valores — Principios y valores corporativos
 * 4. Sedes — Ubicaciones físicas de la empresa
 *
 * Lógica: "¿Quién soy?" — Lo primero que configura un empresario.
 */
import { GenericSectionFallback } from '@/components/common';
import { EmpresaSection } from './EmpresaSection';
import { MisionVisionSection } from './MisionVisionSection';
import { ValoresSection } from './ValoresSection';
import { SedesSection } from './SedesSection';

interface MiEmpresaTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
  mision_vision: MisionVisionSection,
  valores: ValoresSection,
  sedes: SedesSection,
};

export const MiEmpresaTab = ({ activeSection }: MiEmpresaTabProps) => {
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  if (activeSection && !ActiveComponent) {
    return <GenericSectionFallback sectionCode={activeSection} parentName="Mi Empresa" />;
  }

  if (!ActiveComponent) {
    return <EmpresaSection />;
  }

  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
