/**
 * usePageHeader - Hook para configurar el Header desde cualquier pagina
 *
 * Simplifica la configuracion del HeaderContext al:
 * - Auto-limpiar al desmontar
 * - Proveer API declarativa
 * - Sincronizar con useTabSections automaticamente
 *
 * Uso basico:
 * ```tsx
 * const { activeSection, setActiveSection, searchQuery } = usePageHeader({
 *   moduleCode: 'gestion_estrategica',
 *   tabCode: 'configuracion',
 *   moduleColor: 'purple',
 *   searchEnabled: true,
 *   searchPlaceholder: 'Buscar en configuracion...',
 * });
 * ```
 */
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { useTabSections } from '@/hooks/useModules';
import type { ReactNode } from 'react';
import type { TabSection } from '@/hooks/useModules';

type ModuleColor =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'gray'
  | 'teal'
  | 'red'
  | 'yellow'
  | 'pink'
  | 'indigo';

export interface UsePageHeaderOptions {
  /** Codigo del modulo (para cargar secciones desde API) */
  moduleCode?: string;
  /** Codigo del tab (para cargar secciones desde API) */
  tabCode?: string;
  /** Color del modulo para estilizado */
  moduleColor?: ModuleColor;
  /** Habilitar buscador */
  searchEnabled?: boolean;
  /** Placeholder del buscador */
  searchPlaceholder?: string;
  /** Seccion inicial (si no se especifica, usa la primera) */
  initialSection?: string;
  /** Acciones a mostrar en el header */
  actions?: ReactNode;
}

export interface UsePageHeaderReturn {
  /** Seccion activa actual */
  activeSection: string;
  /** Nombre de la seccion activa */
  activeSectionName: string;
  /** Descripcion de la seccion activa */
  activeSectionDescription: string;
  /** Cambiar seccion activa */
  setActiveSection: (code: string) => void;
  /** Query de busqueda actual */
  searchQuery: string;
  /** Si las secciones estan cargando */
  isLoading: boolean;
  /** Configurar acciones del header */
  setActions: (actions: ReactNode | null) => void;
  /** Todas las secciones disponibles */
  sections: TabSection[];
}

export const usePageHeader = (options: UsePageHeaderOptions = {}): UsePageHeaderReturn => {
  const {
    moduleCode,
    tabCode,
    moduleColor = 'purple',
    searchEnabled = false,
    searchPlaceholder = 'Buscar...',
    initialSection,
    actions,
  } = options;

  const {
    activeSection,
    setActiveSection,
    searchQuery,
    sections: contextSections,
    setSections,
    setSectionsLoading,
    setModuleColor,
    setSearchConfig,
    setActions,
    resetHeader,
  } = useHeaderContext();

  // Cargar secciones desde API si se proporcionan moduleCode y tabCode
  const { sections, isLoading } = useTabSections(moduleCode || '', tabCode || '');

  // Ref para rastrear si ya se inicializó la sección activa
  const initializedRef = useRef(false);
  // Ref para rastrear el último moduleCode+tabCode para resetear cuando cambian
  const lastModuleTabRef = useRef<string>('');
  // Ref para rastrear el último isLoading para evitar llamadas innecesarias
  const lastLoadingRef = useRef<boolean | null>(null);
  // Ref para rastrear las secciones por valor (evitar actualizaciones si son iguales)
  const lastSectionsKeyRef = useRef<string>('');

  // Configurar secciones cuando se cargan
  useEffect(() => {
    if (moduleCode && tabCode) {
      const currentKey = `${moduleCode}:${tabCode}`;

      // Si cambió el módulo/tab, resetear el flag de inicialización
      if (lastModuleTabRef.current !== currentKey) {
        initializedRef.current = false;
        lastModuleTabRef.current = currentKey;
        lastLoadingRef.current = null;
        lastSectionsKeyRef.current = '';
      }

      // Solo actualizar loading si cambió
      if (lastLoadingRef.current !== isLoading) {
        lastLoadingRef.current = isLoading;
        setSectionsLoading(isLoading);
      }

      if (!isLoading && sections.length > 0) {
        // Crear una key basada en los códigos de sección para comparar por valor
        const sectionsKey = sections.map((s) => s.code).join(',');

        // Solo actualizar secciones si realmente cambiaron
        if (lastSectionsKeyRef.current !== sectionsKey) {
          lastSectionsKeyRef.current = sectionsKey;
          setSections(sections);
        }

        // Establecer sección inicial SOLO si no se ha inicializado aún
        if (!initializedRef.current) {
          const initial = initialSection || sections[0]?.code || '';
          setActiveSection(initial);
          initializedRef.current = true;
        }
      }
    }
  }, [
    moduleCode,
    tabCode,
    sections,
    isLoading,
    initialSection,
    setSections,
    setSectionsLoading,
    setActiveSection,
  ]);

  // Configurar color del modulo
  useEffect(() => {
    setModuleColor(moduleColor);
  }, [moduleColor, setModuleColor]);

  // Configurar buscador
  useEffect(() => {
    setSearchConfig({
      enabled: searchEnabled,
      placeholder: searchPlaceholder,
    });
  }, [searchEnabled, searchPlaceholder, setSearchConfig]);

  // Configurar acciones
  useEffect(() => {
    if (actions !== undefined) {
      setActions(actions);
    }
  }, [actions, setActions]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  // Wrapper para setActiveSection que tambien actualiza el contexto
  const handleSetActiveSection = useCallback(
    (code: string) => {
      setActiveSection(code);
    },
    [setActiveSection]
  );

  // Obtener datos de la seccion activa
  const activeSectionData = useMemo(() => {
    const section = contextSections.find((s) => s.code === activeSection);
    return {
      name: section?.name || '',
      description: section?.description || '',
    };
  }, [contextSections, activeSection]);

  return {
    activeSection,
    activeSectionName: activeSectionData.name,
    activeSectionDescription: activeSectionData.description,
    setActiveSection: handleSetActiveSection,
    searchQuery,
    isLoading,
    setActions,
    sections: contextSections,
  };
};

export default usePageHeader;
