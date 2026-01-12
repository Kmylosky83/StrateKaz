/**
 * Hook para la lógica de MatrizPermisosSection
 *
 * Maneja:
 * - Estado de cargo seleccionado
 * - Estados de expansión de módulos y tabs
 * - Secciones seleccionadas con detección de cambios
 * - Guardado y reset de permisos
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Briefcase, Layers, FolderTree, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useCargos } from '@/features/configuracion/hooks/useCargos';
import { useModulesTree } from './useModules';
import { useCargoSectionAccess, useSaveCargoSectionAccess } from './useCargoSectionAccess';
import type { SystemModuleTree, ModuleTab, StatItem } from '../components/matriz-permisos/types';
import type { SelectionState, MatrizPermisosStats, CargoResumen } from '../components/matriz-permisos/types';

export function useMatrizPermisos() {
  // Estado del cargo seleccionado
  const [selectedCargoId, setSelectedCargoId] = useState<number | null>(null);

  // Estado de módulos y tabs expandidos
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedTabs, setExpandedTabs] = useState<Set<number>>(new Set());

  // Estado de secciones seleccionadas
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set());
  const [originalSections, setOriginalSections] = useState<Set<number>>(new Set());

  // Queries
  const { data: cargosData, isLoading: isLoadingCargos } = useCargos({
    is_active: true,
    page_size: 100,
  });

  const { data: modulesTree, isLoading: isLoadingModules } = useModulesTree();

  const {
    data: cargoAccessData,
    isLoading: isLoadingAccess,
    refetch: refetchAccess,
  } = useCargoSectionAccess(selectedCargoId);

  const saveMutation = useSaveCargoSectionAccess();

  // Sincronizar secciones cuando se cargan del backend
  useEffect(() => {
    if (cargoAccessData?.section_ids) {
      const sectionsSet = new Set(cargoAccessData.section_ids);
      setSelectedSections(sectionsSet);
      setOriginalSections(sectionsSet);
    } else if (selectedCargoId && !isLoadingAccess) {
      setSelectedSections(new Set());
      setOriginalSections(new Set());
    }
  }, [cargoAccessData, selectedCargoId, isLoadingAccess]);

  // Opciones del selector de cargos
  const cargoOptions = useMemo(() => {
    if (!cargosData?.results) return [];
    return cargosData.results.map((c) => ({
      value: c.id,
      label: c.name,
    }));
  }, [cargosData]);

  // Cargo seleccionado
  const selectedCargo = useMemo((): CargoResumen | null => {
    if (!selectedCargoId || !cargosData?.results) return null;
    const cargo = cargosData.results.find((c) => c.id === selectedCargoId);
    return cargo || null;
  }, [selectedCargoId, cargosData]);

  // Lista de cargos para la tabla
  const cargosList = useMemo((): CargoResumen[] => {
    return cargosData?.results || [];
  }, [cargosData]);

  // Detectar cambios
  const hasChanges = useMemo(() => {
    if (selectedSections.size !== originalSections.size) return true;
    for (const id of selectedSections) {
      if (!originalSections.has(id)) return true;
    }
    return false;
  }, [selectedSections, originalSections]);

  // Handler: cambiar cargo
  const handleCargoChange = useCallback((value: string | number) => {
    const cargoId = typeof value === 'string' ? parseInt(value, 10) : value;
    setSelectedCargoId(cargoId || null);
    setExpandedModules(new Set());
    setExpandedTabs(new Set());
  }, []);

  // Handler: toggle módulo
  const toggleModule = useCallback((moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  // Handler: toggle tab
  const toggleTab = useCallback((tabId: number) => {
    setExpandedTabs((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  }, []);

  // Handler: toggle sección individual
  const toggleSection = useCallback((sectionId: number) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Handler: toggle todas las secciones de un tab
  const toggleAllSectionsInTab = useCallback(
    (tab: ModuleTab) => {
      const sectionIds = tab.sections.filter((s) => s.is_enabled).map((s) => s.id);
      const allSelected = sectionIds.every((id) => selectedSections.has(id));

      setSelectedSections((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          sectionIds.forEach((id) => next.delete(id));
        } else {
          sectionIds.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    [selectedSections]
  );

  // Handler: toggle todas las secciones de un módulo
  const toggleAllSectionsInModule = useCallback(
    (module: SystemModuleTree) => {
      const sectionIds = module.tabs
        .filter((t) => t.is_enabled)
        .flatMap((t) => t.sections.filter((s) => s.is_enabled).map((s) => s.id));

      const allSelected = sectionIds.every((id) => selectedSections.has(id));

      setSelectedSections((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          sectionIds.forEach((id) => next.delete(id));
        } else {
          sectionIds.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    [selectedSections]
  );

  // Handler: guardar
  const handleSave = useCallback(async () => {
    if (!selectedCargoId) return;

    try {
      await saveMutation.mutateAsync({
        cargoId: selectedCargoId,
        sectionIds: Array.from(selectedSections),
      });
      setOriginalSections(new Set(selectedSections));
      toast.success('Permisos guardados exitosamente');
      refetchAccess();
    } catch (error) {
      toast.error('Error al guardar los permisos');
      console.error('Error saving section accesses:', error);
    }
  }, [selectedCargoId, selectedSections, saveMutation, refetchAccess]);

  // Handler: reset
  const handleReset = useCallback(() => {
    setSelectedSections(new Set(originalSections));
  }, [originalSections]);

  // Calcular estado de selección para módulo
  const getModuleSelectionState = useCallback(
    (module: SystemModuleTree): SelectionState => {
      const sectionIds = module.tabs
        .filter((t) => t.is_enabled)
        .flatMap((t) => t.sections.filter((s) => s.is_enabled).map((s) => s.id));

      if (sectionIds.length === 0) return 'none';

      const selectedCount = sectionIds.filter((id) => selectedSections.has(id)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === sectionIds.length) return 'all';
      return 'partial';
    },
    [selectedSections]
  );

  // Calcular estado de selección para tab
  const getTabSelectionState = useCallback(
    (tab: ModuleTab): SelectionState => {
      const sectionIds = tab.sections.filter((s) => s.is_enabled).map((s) => s.id);

      if (sectionIds.length === 0) return 'none';

      const selectedCount = sectionIds.filter((id) => selectedSections.has(id)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === sectionIds.length) return 'all';
      return 'partial';
    },
    [selectedSections]
  );

  // Contar secciones de un módulo
  const getModuleSectionsCount = useCallback((module: SystemModuleTree): number => {
    return module.tabs
      .filter((t) => t.is_enabled)
      .flatMap((t) => t.sections.filter((s) => s.is_enabled)).length;
  }, []);

  // Stats
  const stats = useMemo((): MatrizPermisosStats => {
    if (!modulesTree) {
      return { totalSections: 0, selectedCount: 0, modulesWithoutSections: 0, totalModules: 0, totalTabs: 0 };
    }

    const enabledModules = modulesTree.modules.filter((m) => m.is_enabled);
    const enabledTabs = enabledModules.flatMap((m) => m.tabs.filter((t) => t.is_enabled));
    const totalSections = enabledTabs.flatMap((t) => t.sections.filter((s) => s.is_enabled)).length;
    const modulesWithoutSections = enabledModules.filter((m) => {
      const sectionCount = m.tabs
        .filter((t) => t.is_enabled)
        .flatMap((t) => t.sections.filter((s) => s.is_enabled)).length;
      return sectionCount === 0;
    }).length;

    return {
      totalSections,
      selectedCount: selectedSections.size,
      modulesWithoutSections,
      totalModules: enabledModules.length,
      totalTabs: enabledTabs.length,
    };
  }, [modulesTree, selectedSections]);

  // Stats para StatsGrid
  const statsItems: StatItem[] = useMemo(() => {
    const cargosCount = cargosData?.count || cargosData?.results?.length || 0;
    return [
      { label: 'Cargos Activos', value: cargosCount, icon: Briefcase, iconColor: 'info' },
      { label: 'Módulos', value: stats.totalModules, icon: Layers, iconColor: 'primary' },
      { label: 'Tabs', value: stats.totalTabs, icon: FolderTree, iconColor: 'gray' },
      { label: 'Secciones', value: stats.totalSections, icon: Shield, iconColor: 'success' },
    ];
  }, [cargosData, stats]);

  // Estados de carga
  const isLoading = isLoadingCargos || isLoadingModules;
  const isSaving = saveMutation.isPending;

  return {
    // Estado
    selectedCargoId,
    selectedCargo,
    cargosList,
    cargoOptions,
    expandedModules,
    expandedTabs,
    selectedSections,
    hasChanges,

    // Data
    modulesTree,
    stats,
    statsItems,

    // Loading states
    isLoading,
    isLoadingCargos,
    isLoadingAccess,
    isSaving,

    // Handlers
    handleCargoChange,
    toggleModule,
    toggleTab,
    toggleSection,
    toggleAllSectionsInTab,
    toggleAllSectionsInModule,
    handleSave,
    handleReset,

    // Helpers
    getModuleSelectionState,
    getTabSelectionState,
    getModuleSectionsCount,
  };
}
