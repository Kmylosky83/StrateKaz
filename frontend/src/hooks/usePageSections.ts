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
import { useTabSections } from '@/features/gestion-estrategica/hooks/useModules';
import type { TabSection } from '@/features/gestion-estrategica/types/modules.types';

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

  // Cargar secciones desde API
  const { sections, isLoading } = useTabSections(moduleCode, tabCode);

  // Estado local para seccion activa
  const [activeSection, setActiveSectionState] = useState<string>('');

  // Inicializar seccion activa cuando se cargan las secciones
  useEffect(() => {
    if (!isLoading && sections.length > 0 && !activeSection) {
      const initial = initialSection || sections[0]?.code || '';
      setActiveSectionState(initial);
    }
  }, [isLoading, sections, activeSection, initialSection]);

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
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading,
  };
};

export default usePageSections;
