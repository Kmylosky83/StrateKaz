/* eslint-disable react-refresh/only-export-components */
/**
 * HeaderContext - Comunicacion bidireccional entre paginas y Header
 *
 * Permite que cada pagina defina:
 * - Tabs de secciones (dinamicos desde API)
 * - Buscador contextual
 * - Acciones del header
 *
 * El Header se suscribe a este contexto y renderiza los elementos
 * de forma consistente en toda la aplicacion.
 */
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { TabSection } from '@/hooks/useModules';

// Tipo para el color del modulo
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

export interface HeaderContextValue {
  // Tabs de secciones
  sections: TabSection[];
  activeSection: string;
  onSectionChange: (code: string) => void;
  sectionsLoading: boolean;
  moduleColor: ModuleColor;

  // Buscador
  searchEnabled: boolean;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Acciones contextuales (ReactNode para flexibilidad)
  actions: ReactNode | null;

  // Metodos para que las paginas configuren el header
  setSections: (sections: TabSection[]) => void;
  setActiveSection: (code: string) => void;
  setSectionsLoading: (loading: boolean) => void;
  setModuleColor: (color: ModuleColor) => void;
  setSearchConfig: (config: { enabled: boolean; placeholder?: string }) => void;
  setActions: (actions: ReactNode | null) => void;
  resetHeader: () => void;
}

const defaultContext: HeaderContextValue = {
  sections: [],
  activeSection: '',
  onSectionChange: () => {},
  sectionsLoading: false,
  moduleColor: 'purple',
  searchEnabled: false,
  searchPlaceholder: 'Buscar...',
  searchQuery: '',
  onSearchChange: () => {},
  actions: null,
  setSections: () => {},
  setActiveSection: () => {},
  setSectionsLoading: () => {},
  setModuleColor: () => {},
  setSearchConfig: () => {},
  setActions: () => {},
  resetHeader: () => {},
};

const HeaderContext = createContext<HeaderContextValue>(defaultContext);

export const useHeaderContext = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeaderContext must be used within a HeaderProvider');
  }
  return context;
};

interface HeaderProviderProps {
  children: ReactNode;
}

export const HeaderProvider = ({ children }: HeaderProviderProps) => {
  // Estado de tabs/secciones
  const [sections, setSectionsState] = useState<TabSection[]>([]);
  const [activeSection, setActiveSectionState] = useState<string>('');
  const [sectionsLoading, setSectionsLoadingState] = useState(false);
  const [moduleColor, setModuleColorState] = useState<ModuleColor>('purple');

  // Estado del buscador
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Buscar...');
  const [searchQuery, setSearchQuery] = useState('');

  // Acciones contextuales
  const [actions, setActionsState] = useState<ReactNode | null>(null);

  // Handlers
  const setSections = useCallback((newSections: TabSection[]) => {
    setSectionsState(newSections);
  }, []);

  const setActiveSection = useCallback((code: string) => {
    setActiveSectionState(code);
  }, []);

  const onSectionChange = useCallback((code: string) => {
    setActiveSectionState(code);
  }, []);

  const setSectionsLoading = useCallback((loading: boolean) => {
    setSectionsLoadingState(loading);
  }, []);

  const setModuleColor = useCallback((color: ModuleColor) => {
    setModuleColorState(color);
  }, []);

  const setSearchConfig = useCallback((config: { enabled: boolean; placeholder?: string }) => {
    setSearchEnabled(config.enabled);
    if (config.placeholder) {
      setSearchPlaceholder(config.placeholder);
    }
    // Reset query when disabling search
    if (!config.enabled) {
      setSearchQuery('');
    }
  }, []);

  const onSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const setActions = useCallback((newActions: ReactNode | null) => {
    setActionsState(newActions);
  }, []);

  const resetHeader = useCallback(() => {
    setSectionsState([]);
    setActiveSectionState('');
    setSectionsLoadingState(false);
    setModuleColorState('purple');
    setSearchEnabled(false);
    setSearchPlaceholder('Buscar...');
    setSearchQuery('');
    setActionsState(null);
  }, []);

  const value = useMemo<HeaderContextValue>(
    () => ({
      sections,
      activeSection,
      onSectionChange,
      sectionsLoading,
      moduleColor,
      searchEnabled,
      searchPlaceholder,
      searchQuery,
      onSearchChange,
      actions,
      setSections,
      setActiveSection,
      setSectionsLoading,
      setModuleColor,
      setSearchConfig,
      setActions,
      resetHeader,
    }),
    [
      sections,
      activeSection,
      onSectionChange,
      sectionsLoading,
      moduleColor,
      searchEnabled,
      searchPlaceholder,
      searchQuery,
      onSearchChange,
      actions,
      setSections,
      setActiveSection,
      setSectionsLoading,
      setModuleColor,
      setSearchConfig,
      setActions,
      resetHeader,
    ]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
};

export default HeaderContext;
