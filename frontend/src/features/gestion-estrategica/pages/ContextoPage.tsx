/**
 * Página de Contexto Organizacional - Tab de Dirección Estratégica
 *
 * Layout según Catálogo de Vistas UI:
 * 1. PageHeader con secciones alineadas a la derecha
 * 2. Contenido de la sección activa (cada sección maneja su propio StatsGrid)
 *
 * Secciones (desde BD):
 * - stakeholders: Partes interesadas (ISO 9001:2015 Cláusula 4.2)
 * - analisis_dofa: Análisis DOFA (Fortalezas, Debilidades, Oportunidades, Amenazas)
 * - encuestas_dofa: Encuestas colaborativas para identificar F/D
 * - analisis_pestel: Análisis PESTEL (Político, Económico, Social, etc.)
 * - fuerzas_porter: 5 Fuerzas de Porter
 * - estrategias_tows: Matriz TOWS (estrategias cruzadas)
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { PageHeader } from '@/components/layout';
import { usePageSections } from '@/hooks/usePageSections';
import { ContextoTab } from '../components/ContextoTab';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'contexto';

export const ContextoPage = () => {
  // Hook que maneja secciones localmente (igual que PlaneacionPage)
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
        title="Contexto Organizacional"
        description={activeSectionData.description || 'Análisis del contexto interno y externo de la organización (ISO 9001:2015 Cláusula 4.1)'}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="purple"
      />

      {/* Contenido - cada sección maneja su propio StatsGrid según Vista 2B */}
      {activeSection && <ContextoTab activeSection={activeSection} />}
    </div>
  );
};

export default ContextoPage;
