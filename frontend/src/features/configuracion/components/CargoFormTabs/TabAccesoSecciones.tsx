/**
 * TabAccesoSecciones - Tab de acceso a secciones del UI para el modal de cargo
 *
 * Componente auto-contenido que carga y guarda automáticamente los accesos del cargo.
 * Reutiliza hooks existentes de gestion-estrategica.
 */
import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, Layers, FolderTree, File, Save, RefreshCw } from 'lucide-react';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/lib/utils';
import { useModulesTree } from '@/features/gestion-estrategica/hooks/useModules';
import {
  useCargoSectionAccess,
  useSaveCargoSectionAccess,
} from '@/features/gestion-estrategica/hooks/useCargoSectionAccess';
import type {
  SystemModuleTree,
  ModuleTab,
} from '@/features/gestion-estrategica/types/modules.types';

interface TabAccesoSeccionesProps {
  /** ID del cargo */
  cargoId: number;
  /** Nombre del cargo (para mostrar) */
  cargoName: string;
}

type SelectionState = 'none' | 'partial' | 'all';

export const TabAccesoSecciones = ({ cargoId, cargoName: _cargoName }: TabAccesoSeccionesProps) => {
  // Estado local de selección
  const [localSectionIds, setLocalSectionIds] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Estado de expansión
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedTabs, setExpandedTabs] = useState<Set<number>>(new Set());

  // Queries
  const { data: modulesTree, isLoading: isLoadingModules } = useModulesTree();
  const { data: cargoAccessData, isLoading: isLoadingAccess } = useCargoSectionAccess(cargoId);
  const saveMutation = useSaveCargoSectionAccess();

  // Inicializar estado local desde servidor
  useMemo(() => {
    if (cargoAccessData?.section_ids && !initialized) {
      setLocalSectionIds(cargoAccessData.section_ids);
      setInitialized(true);
    }
  }, [cargoAccessData, initialized]);

  // Set de IDs para búsqueda rápida
  const selectedSet = useMemo(() => new Set(localSectionIds), [localSectionIds]);

  // Detectar si hay cambios sin guardar
  const hasChanges = useMemo(() => {
    if (!cargoAccessData?.section_ids) return localSectionIds.length > 0;
    const serverSet = new Set(cargoAccessData.section_ids);
    if (serverSet.size !== selectedSet.size) return true;
    return localSectionIds.some((id) => !serverSet.has(id));
  }, [localSectionIds, cargoAccessData, selectedSet]);

  // Toggle módulo expandido
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

  // Toggle tab expandido
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

  // Toggle sección individual
  const toggleSection = useCallback((sectionId: number) => {
    setLocalSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  }, []);

  // Toggle todas las secciones de un tab
  const toggleAllSectionsInTab = useCallback(
    (tab: ModuleTab) => {
      const sectionIds = tab.sections.filter((s) => s.is_enabled).map((s) => s.id);
      const allSelected = sectionIds.every((id) => selectedSet.has(id));

      if (allSelected) {
        setLocalSectionIds((prev) => prev.filter((id) => !sectionIds.includes(id)));
      } else {
        setLocalSectionIds((prev) => [...new Set([...prev, ...sectionIds])]);
      }
    },
    [selectedSet]
  );

  // Toggle todas las secciones de un módulo
  const toggleAllSectionsInModule = useCallback(
    (module: SystemModuleTree) => {
      const sectionIds = module.tabs
        .filter((t) => t.is_enabled)
        .flatMap((t) => t.sections.filter((s) => s.is_enabled).map((s) => s.id));

      const allSelected = sectionIds.every((id) => selectedSet.has(id));

      if (allSelected) {
        setLocalSectionIds((prev) => prev.filter((id) => !sectionIds.includes(id)));
      } else {
        setLocalSectionIds((prev) => [...new Set([...prev, ...sectionIds])]);
      }
    },
    [selectedSet]
  );

  // Calcular estado de selección para módulo
  const getModuleSelectionState = useCallback(
    (module: SystemModuleTree): SelectionState => {
      const sectionIds = module.tabs
        .filter((t) => t.is_enabled)
        .flatMap((t) => t.sections.filter((s) => s.is_enabled).map((s) => s.id));

      if (sectionIds.length === 0) return 'none';
      const selectedCount = sectionIds.filter((id) => selectedSet.has(id)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === sectionIds.length) return 'all';
      return 'partial';
    },
    [selectedSet]
  );

  // Calcular estado de selección para tab
  const getTabSelectionState = useCallback(
    (tab: ModuleTab): SelectionState => {
      const sectionIds = tab.sections.filter((s) => s.is_enabled).map((s) => s.id);
      if (sectionIds.length === 0) return 'none';
      const selectedCount = sectionIds.filter((id) => selectedSet.has(id)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === sectionIds.length) return 'all';
      return 'partial';
    },
    [selectedSet]
  );

  // Guardar cambios
  const handleSave = async () => {
    await saveMutation.mutateAsync({
      cargoId,
      sectionIds: localSectionIds,
    });
  };

  // Revertir cambios
  const handleRevert = () => {
    if (cargoAccessData?.section_ids) {
      setLocalSectionIds(cargoAccessData.section_ids);
    } else {
      setLocalSectionIds([]);
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    if (!modulesTree) return { total: 0, selected: 0 };
    const enabledSections = modulesTree.modules
      .filter((m) => m.is_enabled)
      .flatMap((m) => m.tabs.filter((t) => t.is_enabled))
      .flatMap((t) => t.sections.filter((s) => s.is_enabled));
    return { total: enabledSections.length, selected: localSectionIds.length };
  }, [modulesTree, localSectionIds]);

  if (isLoadingModules || isLoadingAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400 mt-3">Cargando estructura de módulos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Layers className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {stats.selected} de {stats.total} secciones
          </span>
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              (cambios sin guardar)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevert}
              disabled={saveMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Revertir
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            isLoading={saveMutation.isPending}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Guardar Accesos
          </Button>
        </div>
      </div>

      {/* Árbol de módulos */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-[50vh] overflow-y-auto">
        {modulesTree?.modules
          .filter((m) => m.is_enabled)
          .map((module) => {
            const isExpanded = expandedModules.has(module.id);
            const selectionState = getModuleSelectionState(module);
            const hasSections = module.tabs.some((t) => t.sections.some((s) => s.is_enabled));

            return (
              <div key={module.id}>
                {/* Fila del módulo */}
                <div
                  className={cn(
                    'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    !hasSections && 'opacity-50'
                  )}
                  onClick={() => toggleModule(module.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}

                  <input
                    type="checkbox"
                    checked={selectionState === 'all'}
                    ref={(el) => {
                      if (el) el.indeterminate = selectionState === 'partial';
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleAllSectionsInModule(module);
                    }}
                    disabled={!hasSections}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                  />

                  <Layers className="h-4 w-4 text-primary-500 flex-shrink-0" />
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {module.name}
                  </span>
                  {!hasSections && (
                    <span className="text-xs text-gray-400 ml-auto">(sin secciones)</span>
                  )}
                </div>

                {/* Tabs del módulo */}
                {isExpanded && (
                  <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-700">
                    {module.tabs
                      .filter((t) => t.is_enabled)
                      .map((tab) => {
                        const isTabExpanded = expandedTabs.has(tab.id);
                        const tabSelectionState = getTabSelectionState(tab);
                        const hasSectionsInTab = tab.sections.some((s) => s.is_enabled);

                        return (
                          <div key={tab.id}>
                            <div
                              className={cn(
                                'flex items-center gap-3 p-2 pl-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                !hasSectionsInTab && 'opacity-50'
                              )}
                              onClick={() => toggleTab(tab.id)}
                            >
                              {isTabExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              )}

                              <input
                                type="checkbox"
                                checked={tabSelectionState === 'all'}
                                ref={(el) => {
                                  if (el) el.indeterminate = tabSelectionState === 'partial';
                                }}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleAllSectionsInTab(tab);
                                }}
                                disabled={!hasSectionsInTab}
                                className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                              />

                              <FolderTree className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {tab.name}
                              </span>
                            </div>

                            {/* Secciones */}
                            {isTabExpanded && (
                              <div className="ml-8">
                                {tab.sections
                                  .filter((s) => s.is_enabled)
                                  .map((section) => (
                                    <label
                                      key={section.id}
                                      className="flex items-center gap-3 p-2 pl-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedSet.has(section.id)}
                                        onChange={() => toggleSection(section.id)}
                                        className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                                      />
                                      <File className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        {section.name}
                                      </span>
                                    </label>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {saveMutation.isError && (
        <Alert variant="error" message="Error al guardar los accesos. Intenta de nuevo." />
      )}
      {saveMutation.isSuccess && (
        <Alert variant="success" message="Accesos guardados correctamente." />
      )}
    </div>
  );
};
