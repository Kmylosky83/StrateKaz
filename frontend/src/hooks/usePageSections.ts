/**
 * usePageSections - Hook para manejar secciones de una pagina localmente
 *
 * Este hook reemplaza usePageHeader para el manejo de secciones,
 * manteniendo el estado localmente en la pagina en lugar del contexto global.
 *
 * Uso:
 * ```tsx
 * const { sections, activeSection, setActiveSection, isLoading } = usePageSections({
 *   moduleCode: 'gestion_estrategica',
 *   tabCode: 'configuracion',
 * });
 *
 * <PageHeader
 *   title="Configuracion"
 *   sections={sections}
 *   activeSection={activeSection}
 *   onSectionChange={setActiveSection}
 * />
 * ```
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTabSections } from '@/hooks/useModules';
import type { TabSection } from '@/hooks/useModules';

export interface UsePageSectionsOptions {
  /** Codigo del modulo */
  moduleCode: string;
  /** Codigo del tab */
  tabCode: string;
  /** Seccion inicial (si no se especifica, usa la primera) */
  initialSection?: string;
}

export interface UsePageSectionsReturn {
  /** Secciones disponibles */
  sections: TabSection[];
  /** Seccion activa */
  activeSection: string;
  /** Cambiar seccion activa */
  setActiveSection: (code: string) => void;
  /** Datos de la seccion activa */
  activeSectionData: {
    name: string;
    description: string;
  };
  /** Si esta cargando */
  isLoading: boolean;
}

export const usePageSections = (options: UsePageSectionsOptions): UsePageSectionsReturn => {
  const { moduleCode, tabCode, initialSection } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  // Extraer el valor STRING del param (no el objeto URLSearchParams que cambia referencia cada render)
  const sectionParam = searchParams.get('section');

  // Cargar secciones desde API
  const { sections, isLoading } = useTabSections(moduleCode, tabCode);

  // Estado local para seccion activa
  const [activeSection, setActiveSectionState] = useState<string>('');

  // Resetear seccion activa cuando cambia el tab (navegación entre tabs)
  useEffect(() => {
    setActiveSectionState('');
  }, [moduleCode, tabCode]);

  // Inicializar seccion activa: ?section= query param > initialSection > primera
  useEffect(() => {
    if (isLoading || sections.length === 0) return;

    const validParam = sectionParam && sections.some((s) => s.code === sectionParam);

    // Si hay ?section= válido, SIEMPRE navegar a esa sección (incluso si ya hay una activa)
    if (validParam) {
      setActiveSectionState(sectionParam);
      // Usar forma funcional para no necesitar searchParams en deps
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('section');
          return next;
        },
        { replace: true }
      );
      return;
    }

    // Solo inicializar si no hay sección activa aún
    if (!activeSection) {
      setActiveSectionState(initialSection || sections[0]?.code || '');
    }
  }, [isLoading, sections, activeSection, initialSection, sectionParam, setSearchParams]);

  // Handler para cambiar seccion
  const setActiveSection = useCallback((code: string) => {
    setActiveSectionState(code);
  }, []);

  // Datos de la seccion activa
  const activeSectionData = useMemo(() => {
    const section = sections.find((s) => s.code === activeSection);
    return {
      name: section?.name || '',
      description: section?.description || '',
    };
  }, [sections, activeSection]);

  return {
    sections: sections as TabSection[],
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading,
  };
};

export default usePageSections;
