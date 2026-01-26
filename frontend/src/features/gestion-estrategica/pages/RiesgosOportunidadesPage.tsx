/**
 * Página de Riesgos y Oportunidades - Tab de Dirección Estratégica
 *
 * Layout según Catálogo de Vistas UI:
 * 1. PageHeader con secciones alineadas a la derecha
 * 2. Contenido de la sección activa (cada sección maneja su propio StatsGrid)
 *
 * Secciones (desde BD):
 * - resumen: Vista general de indicadores de riesgos y oportunidades
 * - mapa_calor: Visualización matricial de probabilidad vs impacto
 * - riesgos: Identificación y gestión de riesgos organizacionales
 * - oportunidades: Identificación y aprovechamiento de oportunidades
 * - tratamientos: Planes de tratamiento y controles
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { PageHeader } from '@/components/layout';
import { usePageSections } from '@/hooks/usePageSections';
import { RiesgosOportunidadesTab } from '../components/RiesgosOportunidadesTab';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'riesgos_oportunidades';

export const RiesgosOportunidadesPage = () => {
  // Hook que maneja secciones localmente (igual que ContextoPage)
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
    <div className="space-y-6">
      {/* PageHeader con secciones alineadas a la derecha */}
      <PageHeader
        title="Riesgos y Oportunidades"
        description={activeSectionData.description || 'Gestión integral de riesgos y oportunidades organizacionales (ISO 31000 / ISO 9001:2015 Cláusula 6.1)'}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="purple"
      />

      {/* Contenido - cada sección maneja su propio StatsGrid según Vista 2B */}
      {activeSection && <RiesgosOportunidadesTab activeSection={activeSection} />}
    </div>
  );
};

export default RiesgosOportunidadesPage;
