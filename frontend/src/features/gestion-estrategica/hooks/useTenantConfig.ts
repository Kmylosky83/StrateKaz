/**
 * Hook para gestionar la configuración del tenant
 * Feature Flags y UI Settings para control dinámico del sistema
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  TenantConfig,
  TenantFeatures,
  TenantUISettings,
  UpdateTenantFeaturesDTO,
  UpdateTenantUISettingsDTO,
} from '../types/strategic.types';

// ==================== QUERY KEYS ====================

export const tenantKeys = {
  config: ['tenant-config'] as const,
  features: ['tenant-features'] as const,
  uiSettings: ['tenant-ui-settings'] as const,
};

// ==================== DEFAULT CONFIG ====================

// Configuración por defecto cuando no hay datos del backend
const DEFAULT_TENANT_CONFIG: TenantConfig = {
  id: 1,
  enabled_modules: ['core', 'proveedores', 'planta', 'econorte'],
  features: {
    enable_econorte: true,
    enable_sst: true,
    enable_pesv: true,
    enable_iso: true,
    enable_cadena_valor: true,
    enable_inteligencia: true,
    enable_certificados: true,
    enable_multiples_politicas: true,
    enable_auditoria: true,
  },
  ui_settings: {
    sidebar_collapsed_default: false,
    show_module_badges: true,
    dark_mode_enabled: true,
    custom_theme_enabled: false,
  },
  tenant_name: 'StrateKaz',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ==================== LOCAL STORAGE HELPERS ====================

const STORAGE_KEY = 'tenant_config';

const getStoredConfig = (): TenantConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignorar errores de parsing
  }
  return DEFAULT_TENANT_CONFIG;
};

const setStoredConfig = (config: TenantConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignorar errores de storage
  }
};

// ==================== API MOCK (mientras no hay backend) ====================

// Simulamos llamadas al API usando localStorage
const tenantApi = {
  getConfig: async (): Promise<TenantConfig> => {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getStoredConfig();
  },

  updateFeatures: async (data: UpdateTenantFeaturesDTO): Promise<TenantConfig> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const current = getStoredConfig();
    const updated: TenantConfig = {
      ...current,
      features: {
        ...current.features,
        ...data,
      },
      updated_at: new Date().toISOString(),
    };
    setStoredConfig(updated);
    return updated;
  },

  updateUISettings: async (data: UpdateTenantUISettingsDTO): Promise<TenantConfig> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const current = getStoredConfig();
    const updated: TenantConfig = {
      ...current,
      ui_settings: {
        ...current.ui_settings,
        ...data,
      },
      updated_at: new Date().toISOString(),
    };
    setStoredConfig(updated);
    return updated;
  },
};

// ==================== HOOKS ====================

/**
 * Hook principal para obtener la configuración del tenant
 */
export const useTenantConfig = () => {
  return useQuery({
    queryKey: tenantKeys.config,
    queryFn: tenantApi.getConfig,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener solo los feature flags
 */
export const useTenantFeatures = () => {
  const { data, ...rest } = useTenantConfig();
  return {
    ...rest,
    data: data?.features ?? DEFAULT_TENANT_CONFIG.features,
  };
};

/**
 * Hook para obtener solo los UI settings
 */
export const useTenantUISettings = () => {
  const { data, ...rest } = useTenantConfig();
  return {
    ...rest,
    data: data?.ui_settings ?? DEFAULT_TENANT_CONFIG.ui_settings,
  };
};

/**
 * Hook para actualizar feature flags
 */
export const useUpdateTenantFeatures = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTenantFeaturesDTO) => tenantApi.updateFeatures(data),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(tenantKeys.config, updatedConfig);
      toast.success('Feature actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el feature');
    },
  });
};

/**
 * Hook para actualizar UI settings
 */
export const useUpdateTenantUISettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTenantUISettingsDTO) => tenantApi.updateUISettings(data),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(tenantKeys.config, updatedConfig);
      toast.success('Configuración de interfaz actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar la configuración');
    },
  });
};

// ==================== HELPER HOOKS ====================

/**
 * Hook para verificar si un feature específico está habilitado
 */
export const useIsFeatureEnabled = (feature: keyof TenantFeatures): boolean => {
  const { data } = useTenantFeatures();
  return data?.[feature] ?? true;
};

/**
 * Hook para obtener múltiples features a la vez
 */
export const useFeatureFlags = <K extends keyof TenantFeatures>(
  features: K[]
): Record<K, boolean> => {
  const { data } = useTenantFeatures();
  return features.reduce(
    (acc, feature) => {
      acc[feature] = data?.[feature] ?? true;
      return acc;
    },
    {} as Record<K, boolean>
  );
};

/**
 * Hook para verificar si un módulo del sidebar debe mostrarse
 * Mapea los códigos de módulo a sus feature flags correspondientes
 */
export const useModuleVisibility = () => {
  const { data: features } = useTenantFeatures();

  return {
    // Mapeo de rutas/módulos a features
    isEcoNorteVisible: features?.enable_econorte ?? true,
    isSSTVisible: features?.enable_sst ?? true,
    isPESVVisible: features?.enable_pesv ?? true,
    isISOVisible: features?.enable_iso ?? true,
    isCadenaValorVisible: features?.enable_cadena_valor ?? true,
    isInteligenciaVisible: features?.enable_inteligencia ?? true,
    // Sub-features
    isCertificadosEnabled: features?.enable_certificados ?? true,
    isMultiplesPoliticasEnabled: features?.enable_multiples_politicas ?? true,
    isAuditoriaEnabled: features?.enable_auditoria ?? true,
  };
};
