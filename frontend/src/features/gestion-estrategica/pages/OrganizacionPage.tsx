/**
 * Página de Organización - Tab 2 de Dirección Estratégica
 *
 * Layout según Catálogo de Vistas UI:
 * - PageHeader con título y secciones inline (alineadas a la derecha)
 * - Contenido de la sección activa (cada sección maneja su propio StatsGrid)
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { PageHeader } from '@/components/layout';
import { OrganizacionTab } from '../components/OrganizacionTab';
import { usePageSections } from '@/hooks/usePageSections';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'organizacion';

export const OrganizacionPage = () => {
  // Hook que maneja secciones localmente (igual que ConfiguracionPage)
  const {
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading: sectionsLoading,
  } = usePageSections({
    moduleCode: MODULE_CODE,
    tabCode: TAB_CODE,
  });

  // Si no hay sección activa aún (cargando), mostrar skeleton básico
  if (!activeSection && sectionsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PageHeader con título y secciones inline (alineadas a la derecha) */}
      <PageHeader
        title="Organización"
        description={activeSectionData.description}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="purple"
      />

      {/* Contenido de la sección activa - cada sección maneja su propio StatsGrid */}
      {activeSection && (
        <OrganizacionTab activeSection={activeSection} />
      )}
    </div>
  );
};

export default OrganizacionPage;
