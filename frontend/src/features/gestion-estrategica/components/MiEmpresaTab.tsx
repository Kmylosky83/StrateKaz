/**
 * Tab: Mi Empresa — Tab 1 de Fundación (Cascada V2)
 *
 * Subtabs:
 * 1. Empresa — Datos generales, branding y configuración regional
 * 2. Sedes — Ubicaciones físicas + roles (UN, centro acopio, proveedor interno)
 *
 * Lógica: "¿Quién soy?" — Lo primero que configura un empresario.
 * Nota: UnidadNegocio unificada con SedeEmpresa desde v5.2.0
 */
import { GenericSectionFallback } from '@/components/common';
import { EmpresaSection } from './EmpresaSection';
import { SedesSection } from './SedesSection';

interface MiEmpresaTabProps {
  activeSection?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
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
