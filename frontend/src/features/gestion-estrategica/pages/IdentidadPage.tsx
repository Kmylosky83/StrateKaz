/**
 * Página de Identidad - Tab 3 de Dirección Estratégica
 *
 * Vista 1B: Cards de Información con secciones en PageHeader
 * - PageHeader con título y secciones inline (alineadas a la derecha)
 * - Contenido de la sección activa
 *
 * Sin hardcoding - secciones cargadas desde API
 *
 * Secciones:
 * - mision_vision: Vista 1B Glassmorphism + DataSection
 * - valores: Vista 2B Especial - DataSection + Card con Drag & Drop
 * - politicas: Vista 2B - DataSection + Lista
 *
 * v3.1: Migrado a Vista 1B con secciones en PageHeader
 * v3.2: Valores refactorizado a Vista 2B Especial con DataSection externo
 */
import { PageHeader } from '@/components/layout';
import { IdentidadTab } from '../components/IdentidadTab';
import { usePageSections } from '@/hooks/usePageSections';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'identidad';

export const IdentidadPage = () => {
  // Hook que maneja secciones localmente (igual que OrganizacionPage y ConfiguracionPage)
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
        title="Identidad Corporativa"
        description={activeSectionData.description}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="purple"
      />

      {/* Contenido de la sección activa */}
      {activeSection && (
        <IdentidadTab activeSection={activeSection} />
      )}
    </div>
  );
};

export default IdentidadPage;
