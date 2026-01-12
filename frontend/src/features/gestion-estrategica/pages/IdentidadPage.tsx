/**
 * Página de Identidad - Tab 3 de Dirección Estratégica
 *
 * Layout:
 * 1. PageHeader
 * 2. DynamicSections (sub-navigation desde API, si existen)
 * 3. Contenido de la sección activa
 *
 * Sin hardcoding - secciones cargadas desde API
 *
 * v3.0: Showcase eliminado (se moverá a módulo de Reportes en el futuro)
 */
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useTabSections } from '../hooks/useModules';
import { IdentidadTab } from '../components/IdentidadTab';
import { useModuleColor } from '@/hooks/useModuleColor';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'identidad';

export const IdentidadPage = () => {
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const { sections, isLoading: sectionsLoading } = useTabSections(MODULE_CODE, TAB_CODE);

  // Sección activa - inicializar con la primera sección habilitada
  const [activeSection, setActiveSection] = useState<string>('');

  // Establecer sección inicial cuando se cargan
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identidad Corporativa"
        description="Gestiona la misión, visión, valores y políticas de la organización"
      />

      {/* Sub-navigation dinámica desde API (si existen secciones) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        moduleColor={moduleColor}
        variant="pills"
      />

      {/* Contenido - IdentidadTab maneja sus propios tabs internos */}
      <IdentidadTab activeSection={activeSection} />
    </div>
  );
};

export default IdentidadPage;
