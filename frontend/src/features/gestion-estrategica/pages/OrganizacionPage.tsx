/**
 * Página de Organización - Tab 2 de Dirección Estratégica
 *
 * Layout:
 * 1. PageHeader
 * 2. DynamicSections (sub-navigation desde API)
 * 3. Contenido de la sección activa (cada sección tiene su propio StatsGrid)
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useTabSections } from '../hooks/useModules';
import { OrganizacionTab } from '../components/OrganizacionTab';
import { useModuleColor } from '@/hooks/useModuleColor';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'organizacion';

export const OrganizacionPage = () => {
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
        title="Organización"
        description="Administra la estructura organizacional, cargos, roles y permisos del sistema"
      />

      {/* Sub-navigation dinámica desde API */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        moduleColor={moduleColor}
        variant="pills"
      />

      {/* Contenido de la sección activa - cada sección tiene su propio StatsGrid */}
      <OrganizacionTab activeSection={activeSection} />
    </div>
  );
};

export default OrganizacionPage;
