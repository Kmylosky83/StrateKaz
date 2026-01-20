/**
 * React Query Hooks para el Sistema Dinámico de Módulos
 * Sistema de Gestión StrateKaz
 *
 * Hooks especializados para la gestión de módulos, tabs y secciones
 * con funcionalidad de toggle y navegación dinámica
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios-config';
import type {
  ModulesTree,
  SystemModuleTree,
  ToggleResponse,
  SidebarModule,
  ModuleDependentsResponse,
} from '../types/modules.types';
import { strategicKeys } from './useStrategic';

// ============================================================================
// QUERY KEYS
// ============================================================================
export const modulesKeys = {
  all: ['modules'] as const,
  tree: () => [...modulesKeys.all, 'tree'] as const,
  sidebar: () => [...modulesKeys.all, 'sidebar'] as const,
  detail: (id: number) => [...modulesKeys.all, 'detail', id] as const,
  dependents: (id: number) => [...modulesKeys.all, 'dependents', id] as const,
  tabs: (moduleId: number) => [...modulesKeys.all, moduleId, 'tabs'] as const,
  sections: (tabId: number) => [...modulesKeys.all, 'tabs', tabId, 'sections'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================
const modulesApi = {
  /**
   * Obtener árbol completo de módulos
   * Incluye todos los módulos con sus tabs y secciones (habilitados y deshabilitados)
   */
  getTree: async (): Promise<ModulesTree> => {
    const { data } = await axiosInstance.get('/core/system-modules/tree/');
    return data;
  },

  /**
   * Obtener módulos para sidebar (solo habilitados, versión compacta)
   * Optimizado para renderizado de navegación lateral
   */
  getSidebar: async (): Promise<SidebarModule[]> => {
    const { data } = await axiosInstance.get('/core/system-modules/sidebar/');
    return data;
  },

  /**
   * Toggle estado de un módulo
   * @param id - ID del módulo
   * @param isEnabled - Nuevo estado (true/false)
   */
  toggleModule: async (id: number, isEnabled: boolean): Promise<ToggleResponse> => {
    const { data } = await axiosInstance.patch(`/core/system-modules/${id}/toggle/`, {
      is_enabled: isEnabled,
    });
    return data;
  },

  /**
   * MM-003: Obtener dependientes de un módulo
   * @param id - ID del módulo
   * @returns Información de dependencias y elementos hijos
   */
  getDependents: async (id: number): Promise<ModuleDependentsResponse> => {
    const { data } = await axiosInstance.get(`/core/system-modules/${id}/dependents/`);
    return data;
  },

  /**
   * Toggle estado de un tab
   * @param id - ID del tab
   * @param isEnabled - Nuevo estado (true/false)
   */
  toggleTab: async (id: number, isEnabled: boolean): Promise<ToggleResponse> => {
    const { data } = await axiosInstance.patch(`/core/module-tabs/${id}/toggle/`, {
      is_enabled: isEnabled,
    });
    return data;
  },

  /**
   * Toggle estado de una sección
   * @param id - ID de la sección
   * @param isEnabled - Nuevo estado (true/false)
   */
  toggleSection: async (id: number, isEnabled: boolean): Promise<ToggleResponse> => {
    const { data } = await axiosInstance.patch(`/core/tab-sections/${id}/toggle/`, {
      is_enabled: isEnabled,
    });
    return data;
  },
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obtener el árbol completo de módulos
 * Usado en ConfiguracionTab para mostrar todos los módulos/tabs/secciones
 *
 * @returns Query con árbol completo de módulos
 *
 * @example
 * ```tsx
 * const { data: tree, isLoading } = useModulesTree();
 *
 * tree?.modules.forEach(module => {
 *   console.log(module.name, module.is_enabled);
 * });
 * ```
 */
export function useModulesTree() {
  return useQuery({
    queryKey: modulesKeys.tree(),
    queryFn: modulesApi.getTree,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener módulos del sidebar (solo habilitados)
 * Usado en Sidebar.tsx para renderizar la navegación
 *
 * @returns Query con módulos habilitados en estructura jerárquica
 *
 * @example
 * ```tsx
 * const { data: sidebarModules } = useSidebarModules();
 *
 * sidebarModules?.map(module => (
 *   <SidebarItem key={module.code} {...module} />
 * ));
 * ```
 */
export function useSidebarModules() {
  return useQuery({
    queryKey: modulesKeys.sidebar(),
    queryFn: modulesApi.getSidebar,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * MM-003: Hook para obtener dependientes de un módulo
 * Útil para mostrar feedback antes de desactivar
 *
 * @param moduleId - ID del módulo
 * @param enabled - Si la query está habilitada (default: false)
 * @returns Query con información de dependencias
 *
 * @example
 * ```tsx
 * const { data: dependents, isLoading } = useModuleDependents(moduleId, showConfirm);
 *
 * if (dependents?.warning_message) {
 *   // Mostrar advertencia antes de desactivar
 * }
 * ```
 */
export function useModuleDependents(moduleId: number, enabled = false) {
  return useQuery({
    queryKey: modulesKeys.dependents(moduleId),
    queryFn: () => modulesApi.getDependents(moduleId),
    enabled: enabled && moduleId > 0,
    staleTime: 30 * 1000, // 30 segundos (datos cambian frecuentemente)
  });
}

/**
 * Hook para toggle de módulo
 * Invalida tanto el árbol como el sidebar al completarse
 *
 * @returns Mutation para cambiar estado de módulo
 *
 * @example
 * ```tsx
 * const toggleModule = useToggleModule();
 *
 * toggleModule.mutate({
 *   id: 5,
 *   isEnabled: false
 * });
 * ```
 */
export function useToggleModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      modulesApi.toggleModule(id, isEnabled),
    onSuccess: (response) => {
      // Invalidar tanto el árbol como el sidebar
      queryClient.invalidateQueries({ queryKey: modulesKeys.tree() });
      queryClient.invalidateQueries({ queryKey: modulesKeys.sidebar() });
      // Invalidar StatsGrid de módulos para actualización automática
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('modulos') });

      // Mostrar mensaje de éxito con información de elementos afectados
      if (response.affected_items && Object.keys(response.affected_items).length > 0) {
        const affectedCount = [
          response.affected_items.modules?.length || 0,
          response.affected_items.tabs?.length || 0,
          response.affected_items.sections?.length || 0,
        ].reduce((sum, count) => sum + count, 0);

        toast.success(`${response.message} (${affectedCount} elementos afectados)`);
      } else {
        toast.success(response.message);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar estado del módulo';
      toast.error(message);
    },
  });
}

/**
 * Hook para toggle de tab
 * Invalida árbol y sidebar al completarse
 *
 * @returns Mutation para cambiar estado de tab
 *
 * @example
 * ```tsx
 * const toggleTab = useToggleTab();
 *
 * toggleTab.mutate({
 *   id: tabId,
 *   isEnabled: true
 * });
 * ```
 */
export function useToggleTab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      modulesApi.toggleTab(id, isEnabled),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: modulesKeys.tree() });
      queryClient.invalidateQueries({ queryKey: modulesKeys.sidebar() });
      // Invalidar StatsGrid de módulos para actualización automática
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('modulos') });

      if (response.affected_items && response.affected_items.sections?.length) {
        toast.success(
          `${response.message} (${response.affected_items.sections.length} secciones afectadas)`
        );
      } else {
        toast.success(response.message);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar estado del tab';
      toast.error(message);
    },
  });
}

/**
 * Hook para toggle de sección
 * Invalida árbol y sidebar al completarse
 *
 * @returns Mutation para cambiar estado de sección
 *
 * @example
 * ```tsx
 * const toggleSection = useToggleSection();
 *
 * toggleSection.mutate({
 *   id: sectionId,
 *   isEnabled: false
 * });
 * ```
 */
export function useToggleSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      modulesApi.toggleSection(id, isEnabled),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: modulesKeys.tree() });
      queryClient.invalidateQueries({ queryKey: modulesKeys.sidebar() });
      // Invalidar StatsGrid de módulos para actualización automática
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('modulos') });
      toast.success(response.message);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar estado de la sección';
      toast.error(message);
    },
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook helper para verificar si un módulo está habilitado
 * Útil para condicionales en componentes
 *
 * @param moduleCode - Código del módulo (ej: 'SST', 'PESV')
 * @returns Estado de habilitación y módulo
 *
 * @example
 * ```tsx
 * const { isEnabled, isLoading, module } = useModuleEnabled('SST');
 *
 * if (!isEnabled) {
 *   return <DisabledModuleMessage />;
 * }
 * ```
 */
export function useModuleEnabled(moduleCode: string) {
  const { data: tree, isLoading } = useModulesTree();

  if (isLoading || !tree) {
    return { isEnabled: true, isLoading: true, module: undefined };
  }

  const module = tree.modules.find((m) => m.code === moduleCode);

  return {
    isEnabled: module?.is_enabled ?? false,
    isLoading: false,
    module,
  };
}

/**
 * Hook helper para verificar si un tab está habilitado
 * Verifica tanto el módulo como el tab
 *
 * @param moduleCode - Código del módulo
 * @param tabCode - Código del tab
 * @returns Estado de habilitación y tab
 *
 * @example
 * ```tsx
 * const { isEnabled } = useTabEnabled('SST', 'INCIDENTES');
 *
 * if (!isEnabled) return null;
 * ```
 */
export function useTabEnabled(moduleCode: string, tabCode: string) {
  const { data: tree, isLoading } = useModulesTree();

  if (isLoading || !tree) {
    return { isEnabled: true, isLoading: true, tab: undefined };
  }

  const module = tree.modules.find((m) => m.code === moduleCode);
  const tab = module?.tabs.find((t) => t.code === tabCode);

  return {
    isEnabled: (module?.is_enabled && tab?.is_enabled) ?? false,
    isLoading: false,
    tab,
  };
}

/**
 * Hook helper para verificar si una sección está habilitada
 * Verifica módulo, tab y sección en cascada
 *
 * @param moduleCode - Código del módulo
 * @param tabCode - Código del tab
 * @param sectionCode - Código de la sección
 * @returns Estado de habilitación y sección
 *
 * @example
 * ```tsx
 * const { isEnabled } = useSectionEnabled('SST', 'INCIDENTES', 'REPORTAR');
 *
 * <Tab disabled={!isEnabled}>Reportar Incidente</Tab>
 * ```
 */
export function useSectionEnabled(moduleCode: string, tabCode: string, sectionCode: string) {
  const { data: tree, isLoading } = useModulesTree();

  if (isLoading || !tree) {
    return { isEnabled: true, isLoading: true, section: undefined };
  }

  const module = tree.modules.find((m) => m.code === moduleCode);
  const tab = module?.tabs.find((t) => t.code === tabCode);
  const section = tab?.sections.find((s) => s.code === sectionCode);

  return {
    isEnabled: (module?.is_enabled && tab?.is_enabled && section?.is_enabled) ?? false,
    isLoading: false,
    section,
  };
}

/**
 * Hook para obtener las secciones habilitadas de un tab específico
 * Retorna las secciones en formato compatible con el componente Tabs
 *
 * @param moduleCode - Código del módulo (ej: 'GESTION_ESTRATEGICA')
 * @param tabCode - Código del tab (ej: 'CONFIGURACION')
 * @returns Secciones habilitadas con sus propiedades
 *
 * @example
 * ```tsx
 * const { sections, isLoading, activeSection, setActiveSection } = useTabSections('GESTION_ESTRATEGICA', 'CONFIGURACION');
 *
 * <DynamicSections sections={sections} activeSection={activeSection} onChange={setActiveSection} />
 * ```
 */
export function useTabSections(moduleCode: string, tabCode: string) {
  const { data: tree, isLoading } = useModulesTree();

  // Memoizar el resultado para evitar crear nuevas referencias en cada render
  // Esto previene loops infinitos en usePageHeader
  return useMemo(() => {
    if (isLoading || !tree) {
      return {
        sections: [] as const,
        isLoading: true,
        tab: undefined,
        moduleEnabled: false,
        tabEnabled: false,
      };
    }

    const module = tree.modules.find((m) => m.code === moduleCode);
    const tab = module?.tabs.find((t) => t.code === tabCode);

    // Solo retornar secciones habilitadas, ordenadas por order
    const enabledSections =
      tab?.sections.filter((s) => s.is_enabled).sort((a, b) => a.order - b.order) ?? [];

    return {
      sections: enabledSections,
      isLoading: false,
      tab,
      moduleEnabled: module?.is_enabled ?? false,
      tabEnabled: tab?.is_enabled ?? false,
    };
  }, [tree, isLoading, moduleCode, tabCode]);
}

/**
 * Hook helper para obtener módulos agrupados por categoría
 * Útil para renderizar módulos en grupos
 *
 * @returns Módulos agrupados por categoría
 *
 * @example
 * ```tsx
 * const { data: groupedModules } = useModulesByCategory();
 *
 * Object.entries(groupedModules || {}).map(([category, modules]) => (
 *   <CategoryGroup key={category} title={category} modules={modules} />
 * ));
 * ```
 */
export function useModulesByCategory() {
  const { data: tree, isLoading } = useModulesTree();

  if (isLoading || !tree) {
    return { data: undefined, isLoading: true };
  }

  const grouped = tree.modules.reduce(
    (acc, module) => {
      const category = module.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(module);
      return acc;
    },
    {} as Record<string, SystemModuleTree[]>
  );

  return { data: grouped, isLoading: false };
}

/**
 * Hook para obtener estadísticas de módulos
 * Calcula totales y porcentajes de habilitación
 *
 * @returns Estadísticas de módulos, tabs y secciones
 *
 * @example
 * ```tsx
 * const { stats } = useModulesStats();
 *
 * console.log(`${stats.enabledModules}/${stats.totalModules} módulos habilitados`);
 * ```
 */
export function useModulesStats() {
  const { data: tree, isLoading } = useModulesTree();

  if (isLoading || !tree) {
    return {
      stats: undefined,
      isLoading: true,
    };
  }

  const totalModules = tree.modules.length;
  const enabledModules = tree.modules.filter((m) => m.is_enabled).length;

  const totalTabs = tree.modules.reduce((sum, m) => sum + m.total_tabs_count, 0);
  const enabledTabs = tree.modules.reduce((sum, m) => sum + m.enabled_tabs_count, 0);

  const totalSections = tree.modules.reduce(
    (sum, m) => sum + m.tabs.reduce((tabSum, t) => tabSum + t.total_sections_count, 0),
    0
  );
  const enabledSections = tree.modules.reduce(
    (sum, m) => sum + m.tabs.reduce((tabSum, t) => tabSum + t.enabled_sections_count, 0),
    0
  );

  return {
    stats: {
      totalModules,
      enabledModules,
      disabledModules: totalModules - enabledModules,
      moduleEnableRate: totalModules > 0 ? (enabledModules / totalModules) * 100 : 0,

      totalTabs,
      enabledTabs,
      disabledTabs: totalTabs - enabledTabs,
      tabEnableRate: totalTabs > 0 ? (enabledTabs / totalTabs) * 100 : 0,

      totalSections,
      enabledSections,
      disabledSections: totalSections - enabledSections,
      sectionEnableRate: totalSections > 0 ? (enabledSections / totalSections) * 100 : 0,
    },
    isLoading: false,
  };
}
