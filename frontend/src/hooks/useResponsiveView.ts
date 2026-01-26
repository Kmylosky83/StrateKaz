/**
 * useResponsiveView - Hook para vistas responsivas tabla/cards
 *
 * Gestiona automáticamente el cambio entre vista de tabla (desktop)
 * y vista de tarjetas (móvil), con opción de override manual.
 *
 * Características:
 * - Auto-switch basado en breakpoint
 * - Override manual para usuarios que prefieran una vista
 * - Persistencia en localStorage (opcional)
 * - Integración con useIsMobile
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useIsMobile } from './useMediaQuery';

export type ViewMode = 'table' | 'cards' | 'auto';

export interface UseResponsiveViewOptions {
  /** Clave para persistir preferencia en localStorage */
  storageKey?: string;
  /** Vista por defecto cuando no hay preferencia guardada */
  defaultView?: ViewMode;
  /** Forzar una vista específica (ignora auto-switch) */
  forceView?: 'table' | 'cards';
}

export interface UseResponsiveViewReturn {
  /** Vista actual efectiva (siempre 'table' o 'cards') */
  currentView: 'table' | 'cards';
  /** Modo configurado por el usuario */
  viewMode: ViewMode;
  /** Si está en modo auto */
  isAutoMode: boolean;
  /** Si está mostrando cards */
  isCardsView: boolean;
  /** Si está mostrando tabla */
  isTableView: boolean;
  /** Cambiar a vista tabla */
  setTableView: () => void;
  /** Cambiar a vista cards */
  setCardsView: () => void;
  /** Cambiar a modo auto */
  setAutoView: () => void;
  /** Toggle entre tabla y cards */
  toggleView: () => void;
  /** Setter genérico */
  setViewMode: (mode: ViewMode) => void;
}

export const useResponsiveView = (
  options: UseResponsiveViewOptions = {}
): UseResponsiveViewReturn => {
  const { storageKey, defaultView = 'auto', forceView } = options;

  const isMobile = useIsMobile();

  // Cargar preferencia guardada o usar default
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'table' || saved === 'cards' || saved === 'auto') {
        return saved;
      }
    }
    return defaultView;
  });

  // Persistir cambios en localStorage
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, viewMode);
    }
  }, [storageKey, viewMode]);

  // Calcular vista efectiva
  const currentView = useMemo<'table' | 'cards'>(() => {
    // Si hay una vista forzada, usarla
    if (forceView) {
      return forceView;
    }

    // Si el modo es auto, basarse en el breakpoint
    if (viewMode === 'auto') {
      return isMobile ? 'cards' : 'table';
    }

    // Usar la vista explícita
    return viewMode;
  }, [viewMode, isMobile, forceView]);

  // Setters
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const setTableView = useCallback(() => {
    setViewModeState('table');
  }, []);

  const setCardsView = useCallback(() => {
    setViewModeState('cards');
  }, []);

  const setAutoView = useCallback(() => {
    setViewModeState('auto');
  }, []);

  const toggleView = useCallback(() => {
    setViewModeState((prev) => {
      if (prev === 'auto') {
        // Si está en auto, cambiar al opuesto del actual
        return isMobile ? 'table' : 'cards';
      }
      return prev === 'table' ? 'cards' : 'table';
    });
  }, [isMobile]);

  return {
    currentView,
    viewMode,
    isAutoMode: viewMode === 'auto',
    isCardsView: currentView === 'cards',
    isTableView: currentView === 'table',
    setTableView,
    setCardsView,
    setAutoView,
    toggleView,
    setViewMode,
  };
};

/**
 * Hook simplificado que solo devuelve si mostrar cards o tabla
 * basado en el breakpoint móvil
 */
export const useAutoTableView = (): {
  showCards: boolean;
  showTable: boolean;
} => {
  const isMobile = useIsMobile();

  return {
    showCards: isMobile,
    showTable: !isMobile,
  };
};

export type { UseResponsiveViewOptions, UseResponsiveViewReturn };
