/**
 * TabAccesoSecciones - Tab unificado de acceso a secciones CON acciones CRUD
 *
 * Sistema RBAC Unificado v4.0:
 * - Controla qué secciones puede VER el usuario
 * - Controla qué acciones CRUD puede realizar en cada sección
 * - Un solo lugar de configuración
 *
 * Estructura visual:
 * └── Módulo
 *     └── Tab
 *         └── Sección
 *             ☑ Ver  ☐ Crear  ☐ Editar  ☐ Eliminar
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  FolderTree,
  File,
  Save,
  RefreshCw,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Send,
  CheckCheck,
  Zap,
} from 'lucide-react';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/utils/cn';
import { useModulesTree } from '@/features/gestion-estrategica/hooks/useModules';
import { useCargoSectionAccess, useSaveCargoSectionAccess } from '../../hooks/useCargos';
import { useAuthStore } from '@/store/authStore';
import type {
  SystemModuleTree,
  ModuleTab,
  TabSectionTree,
} from '@/features/gestion-estrategica/types/modules.types';

interface TabAccesoSeccionesProps {
  /** ID del cargo */
  cargoId: number;
  /** Nombre del cargo (para mostrar) */
  cargoName: string;
}

/** Acceso a una sección con sus acciones CRUD */
interface SectionAccess {
  section_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  custom_actions?: Record<string, boolean>;
}

/** Mapa de accesos por section_id */
type AccessMap = Map<number, SectionAccess>;

export const TabAccesoSecciones = ({ cargoId, cargoName: _cargoName }: TabAccesoSeccionesProps) => {
  // Estado local de accesos (mapa section_id -> acciones)
  const [localAccesses, setLocalAccesses] = useState<AccessMap>(new Map());
  const [initialized, setInitialized] = useState(false);

  // Estado de expansión
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedTabs, setExpandedTabs] = useState<Set<number>>(new Set());

  // Queries
  const { data: modulesTree, isLoading: isLoadingModules } = useModulesTree();
  const { data: cargoAccessData, isLoading: isLoadingAccess } = useCargoSectionAccess(cargoId);
  const saveMutation = useSaveCargoSectionAccess();

  // Inicializar estado local desde servidor
  useEffect(() => {
    if (cargoAccessData?.accesses && !initialized) {
      const newMap = new Map<number, SectionAccess>();
      for (const access of cargoAccessData.accesses) {
        newMap.set(access.section_id, {
          section_id: access.section_id,
          can_view: access.can_view,
          can_create: access.can_create,
          can_edit: access.can_edit,
          can_delete: access.can_delete,
          custom_actions: access.custom_actions || {},
        });
      }
      setLocalAccesses(newMap);
      setInitialized(true);
    }
  }, [cargoAccessData, initialized]);

  // Detectar si hay cambios sin guardar
  const hasChanges = useMemo(() => {
    if (!cargoAccessData?.accesses) return localAccesses.size > 0;

    // Crear mapa del servidor
    const serverMap = new Map<number, SectionAccess>();
    for (const access of cargoAccessData.accesses) {
      serverMap.set(access.section_id, access);
    }

    // Comparar tamaños
    if (serverMap.size !== localAccesses.size) return true;

    // Comparar cada acceso
    for (const [sectionId, localAccess] of localAccesses) {
      const serverAccess = serverMap.get(sectionId);
      if (!serverAccess) return true;
      if (
        localAccess.can_view !== serverAccess.can_view ||
        localAccess.can_create !== serverAccess.can_create ||
        localAccess.can_edit !== serverAccess.can_edit ||
        localAccess.can_edit !== serverAccess.can_edit ||
        localAccess.can_delete !== serverAccess.can_delete ||
        JSON.stringify(localAccess.custom_actions || {}) !==
          JSON.stringify(serverAccess.custom_actions || {})
      ) {
        return true;
      }
    }

    return false;
  }, [localAccesses, cargoAccessData]);

  // Toggle módulo expandido
  const toggleModule = useCallback((moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }, []);

  // Toggle tab expandido
  const toggleTab = useCallback((tabId: number) => {
    setExpandedTabs((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  // Toggle acción personalizada
  const toggleCustomAction = useCallback((sectionId: number, actionName: string) => {
    setLocalAccesses((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(sectionId);

      if (current) {
        const currentCustom = current.custom_actions || {};
        const newCustom = { ...currentCustom, [actionName]: !currentCustom[actionName] };

        const newAccess = { ...current, custom_actions: newCustom };
        newMap.set(sectionId, newAccess);
      } else {
        // Si no existe, crear con view=true por defecto (comportamiento estándar)
        const newAccess: SectionAccess = {
          section_id: sectionId,
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
          custom_actions: { [actionName]: true },
        };
        newMap.set(sectionId, newAccess);
      }
      return newMap;
    });
  }, []);

  // Toggle acción individual de una sección
  const toggleAction = useCallback(
    (sectionId: number, action: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') => {
      setLocalAccesses((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(sectionId);

        if (current) {
          // Si ya existe, toggle la acción
          const newAccess = { ...current, [action]: !current[action] };

          // Si se desmarca can_view, desmarcar todas las demás
          if (action === 'can_view' && !newAccess.can_view) {
            newAccess.can_create = false;
            newAccess.can_edit = false;
            newAccess.can_delete = false;
          }

          // Si todas las acciones están desmarcadas, eliminar el acceso
          if (
            !newAccess.can_view &&
            !newAccess.can_create &&
            !newAccess.can_edit &&
            !newAccess.can_delete
          ) {
            newMap.delete(sectionId);
          } else {
            newMap.set(sectionId, newAccess);
          }
        } else {
          // Si no existe, crear con la acción marcada
          const newAccess: SectionAccess = {
            section_id: sectionId,
            can_view: action === 'can_view' ? true : false,
            can_create: action === 'can_create' ? true : false,
            can_edit: action === 'can_edit' ? true : false,
            can_delete: action === 'can_delete' ? true : false,
            custom_actions: {},
          };
          // Si se marca cualquier acción diferente a view, también marcar view
          if (action !== 'can_view') {
            newAccess.can_view = true;
          }
          newMap.set(sectionId, newAccess);
        }

        return newMap;
      });
    },
    []
  );

  // Toggle sección completa (todas las acciones o ninguna)
  const toggleSection = useCallback((section: TabSectionTree) => {
    setLocalAccesses((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(section.id);

      if (current && current.can_view) {
        // Si ya tiene acceso, eliminar
        newMap.delete(section.id);
      } else {
        // Si no tiene acceso, dar solo view por defecto
        newMap.set(section.id, {
          section_id: section.id,
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
          custom_actions: {},
        });
      }

      return newMap;
    });
  }, []);

  // Toggle todas las secciones de un tab
  const toggleAllInTab = useCallback(
    (tab: ModuleTab) => {
      const sectionIds = tab.sections.filter((s) => s.is_enabled).map((s) => s.id);
      const allHaveView = sectionIds.every((id) => localAccesses.get(id)?.can_view);

      setLocalAccesses((prev) => {
        const newMap = new Map(prev);

        if (allHaveView) {
          // Desmarcar todos
          sectionIds.forEach((id) => newMap.delete(id));
        } else {
          // Marcar todos con view
          sectionIds.forEach((id) => {
            if (!newMap.get(id)?.can_view) {
              newMap.set(id, {
                section_id: id,
                can_view: true,
                can_create: false,
                can_edit: false,
                can_delete: false,
                custom_actions: {},
              });
            }
          });
        }

        return newMap;
      });
    },
    [localAccesses]
  );

  // Toggle todas las secciones de un módulo
  const toggleAllInModule = useCallback(
    (module: SystemModuleTree) => {
      const sectionIds = module.tabs
        .filter((t) => t.is_enabled)
        .flatMap((t) => t.sections.filter((s) => s.is_enabled).map((s) => s.id));

      const allHaveView = sectionIds.every((id) => localAccesses.get(id)?.can_view);

      setLocalAccesses((prev) => {
        const newMap = new Map(prev);

        if (allHaveView) {
          sectionIds.forEach((id) => newMap.delete(id));
        } else {
          sectionIds.forEach((id) => {
            if (!newMap.get(id)?.can_view) {
              newMap.set(id, {
                section_id: id,
                can_view: true,
                can_create: false,
                can_edit: false,
                can_delete: false,
                custom_actions: {},
              });
            }
          });
        }

        return newMap;
      });
    },
    [localAccesses]
  );

  // Calcular estado de selección para módulo/tab
  const getSelectionState = useCallback(
    (sectionIds: number[]): 'none' | 'partial' | 'all' => {
      if (sectionIds.length === 0) return 'none';
      const withView = sectionIds.filter((id) => localAccesses.get(id)?.can_view).length;
      if (withView === 0) return 'none';
      if (withView === sectionIds.length) return 'all';
      return 'partial';
    },
    [localAccesses]
  );

  // Usuarios y autenticación
  const user = useAuthStore((s) => s.user);
  const loadUserProfile = useAuthStore((s) => s.loadUserProfile);

  // Guardar cambios
  const handleSave = async () => {
    const accesses = Array.from(localAccesses.values());
    await saveMutation.mutateAsync({
      cargoId,
      accesses,
    });

    // Si estamos editando el cargo del usuario actual, refrescar su perfil
    // para que los cambios de permisos se reflejen inmediatamente en la UI
    if (user?.cargo?.id === cargoId) {
      // Forzar recarga del perfil para actualizar permission_codes
      useAuthStore.setState({ user: null });
      await loadUserProfile();
    }
  };

  // Revertir cambios
  const handleRevert = () => {
    if (cargoAccessData?.accesses) {
      const newMap = new Map<number, SectionAccess>();
      for (const access of cargoAccessData.accesses) {
        newMap.set(access.section_id, {
          section_id: access.section_id,
          can_view: access.can_view,
          can_create: access.can_create,
          can_edit: access.can_edit,
          can_delete: access.can_delete,
          custom_actions: access.custom_actions || {},
        });
      }
      setLocalAccesses(newMap);
    } else {
      setLocalAccesses(new Map());
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    if (!modulesTree) return { total: 0, selected: 0, actions: 0 };
    const enabledSections = modulesTree.modules
      .filter((m) => m.is_enabled)
      .flatMap((m) => m.tabs.filter((t) => t.is_enabled))
      .flatMap((t) => t.sections.filter((s) => s.is_enabled));

    let totalActions = 0;
    localAccesses.forEach((access) => {
      if (access.can_view) totalActions++;
      if (access.can_create) totalActions++;
      if (access.can_edit) totalActions++;
      if (access.can_delete) totalActions++;
    });

    return {
      total: enabledSections.length,
      selected: localAccesses.size,
      actions: totalActions,
    };
  }, [modulesTree, localAccesses]);

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
            {stats.selected} de {stats.total} secciones ({stats.actions} permisos)
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
            Guardar
          </Button>
        </div>
      </div>

      {/* Leyenda de acciones */}
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-100 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium">Acciones:</span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" /> Ver
        </span>
        <span className="flex items-center gap-1">
          <Plus className="h-3 w-3" /> Crear
        </span>
        <span className="flex items-center gap-1">
          <Pencil className="h-3 w-3" /> Editar
        </span>
        <span className="flex items-center gap-1">
          <Trash2 className="h-3 w-3" /> Eliminar
        </span>
        <span className="ml-2 pl-2 border-l border-gray-300 dark:border-gray-600 flex items-center gap-1 text-gray-500">
          <Zap className="h-3 w-3" /> Acciones Personalizadas (Dinámicas)
        </span>
      </div>

      {/* Árbol de módulos */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-[50vh] overflow-y-auto">
        {modulesTree?.modules
          .filter((m) => m.is_enabled)
          .filter((m) => {
            // Solo mostrar módulos que tienen al menos una sección asignable
            return m.tabs
              .filter((t) => t.is_enabled)
              .some((t) => t.sections.some((s) => s.is_enabled));
          })
          .map((module) => {
            const isExpanded = expandedModules.has(module.id);
            const sectionIds = module.tabs
              .filter((t) => t.is_enabled)
              .flatMap((t) => t.sections.filter((s) => s.is_enabled).map((s) => s.id));
            const selectionState = getSelectionState(sectionIds);
            const hasSections = sectionIds.length > 0;

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
                      toggleAllInModule(module);
                    }}
                    disabled={!hasSections}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                  />

                  <Layers className="h-4 w-4 text-primary-500 flex-shrink-0" />
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {module.name}
                  </span>
                </div>

                {/* Tabs del módulo */}
                {isExpanded && (
                  <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-700">
                    {module.tabs
                      .filter((t) => t.is_enabled)
                      .map((tab) => {
                        const isTabExpanded = expandedTabs.has(tab.id);
                        const tabSectionIds = tab.sections
                          .filter((s) => s.is_enabled)
                          .map((s) => s.id);
                        const tabSelectionState = getSelectionState(tabSectionIds);
                        const hasSectionsInTab = tabSectionIds.length > 0;

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
                                  toggleAllInTab(tab);
                                }}
                                disabled={!hasSectionsInTab}
                                className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                              />

                              <FolderTree className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {tab.name}
                              </span>
                            </div>

                            {/* Secciones con acciones CRUD */}
                            {isTabExpanded && (
                              <div className="ml-8">
                                {tab.sections
                                  .filter((s) => s.is_enabled)
                                  .map((section) => {
                                    const access = localAccesses.get(section.id);
                                    const hasAnyAccess = access?.can_view || false;

                                    return (
                                      <div
                                        key={section.id}
                                        className={cn(
                                          'flex items-center gap-3 p-2 pl-4 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                          hasAnyAccess && 'bg-primary-50/50 dark:bg-primary-900/10'
                                        )}
                                      >
                                        {/* Checkbox principal de sección */}
                                        <input
                                          type="checkbox"
                                          checked={hasAnyAccess}
                                          onChange={() => toggleSection(section)}
                                          className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                                        />
                                        <File className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[120px] truncate">
                                          {section.name}
                                        </span>

                                        {/* Acciones CRUD */}
                                        <div className="flex items-center gap-2 ml-auto">
                                          {/* Ver */}
                                          <label
                                            className={cn(
                                              'flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors',
                                              access?.can_view
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                            )}
                                            title="Puede ver"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={access?.can_view || false}
                                              onChange={() => toggleAction(section.id, 'can_view')}
                                              className="sr-only"
                                            />
                                            <Eye className="h-3 w-3" />
                                          </label>

                                          {/* Crear */}
                                          <label
                                            className={cn(
                                              'flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors',
                                              access?.can_create
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                            )}
                                            title="Puede crear"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={access?.can_create || false}
                                              onChange={() =>
                                                toggleAction(section.id, 'can_create')
                                              }
                                              className="sr-only"
                                            />
                                            <Plus className="h-3 w-3" />
                                          </label>

                                          {/* Editar */}
                                          <label
                                            className={cn(
                                              'flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors',
                                              access?.can_edit
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                            )}
                                            title="Puede editar"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={access?.can_edit || false}
                                              onChange={() => toggleAction(section.id, 'can_edit')}
                                              className="sr-only"
                                            />
                                            <Pencil className="h-3 w-3" />
                                          </label>

                                          {/* Eliminar */}
                                          <label
                                            className={cn(
                                              'flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors',
                                              access?.can_delete
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                            )}
                                            title="Puede eliminar"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={access?.can_delete || false}
                                              onChange={() =>
                                                toggleAction(section.id, 'can_delete')
                                              }
                                              className="sr-only"
                                            />
                                            <Trash2 className="h-3 w-3" />
                                          </label>

                                          {/* Acciones Personalizadas Dinámicas */}
                                          {section.supported_actions?.map((actionName) => {
                                            const isChecked =
                                              access?.custom_actions?.[actionName] || false;
                                            // Icon selection logic
                                            let ActionIcon = Zap;
                                            if (
                                              ['enviar', 'send', 'notificar'].some((k) =>
                                                actionName.toLowerCase().includes(k)
                                              )
                                            )
                                              ActionIcon = Send;
                                            if (
                                              ['aprobar', 'approve', 'confirmar'].some((k) =>
                                                actionName.toLowerCase().includes(k)
                                              )
                                            )
                                              ActionIcon = CheckCheck;

                                            return (
                                              <label
                                                key={actionName}
                                                className={cn(
                                                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors border border-dashed',
                                                  isChecked
                                                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
                                                    : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800/50 dark:text-gray-500 dark:border-gray-700'
                                                )}
                                                title={`Acción personalizada: ${actionName}`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() =>
                                                    toggleCustomAction(section.id, actionName)
                                                  }
                                                  className="sr-only"
                                                />
                                                <ActionIcon className="h-3 w-3" />
                                                <span className="capitalize">{actionName}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
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
        <Alert variant="success" message="Accesos y permisos guardados correctamente." />
      )}
    </div>
  );
};
