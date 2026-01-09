/**
 * React Query Hooks para EmpresaConfig
 * Sistema de Gestión StrateKaz
 *
 * Hooks para gestionar los datos fiscales y legales de la empresa
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { empresaApi } from '../api/empresaApi';
import type {
  EmpresaConfig,
  EmpresaConfigFormData,
  EmpresaConfigChoices,
} from '../types/empresa.types';

// ============================================================================
// QUERY KEYS
// ============================================================================
export const empresaKeys = {
  all: ['empresa'] as const,
  config: () => [...empresaKeys.all, 'config'] as const,
  choices: () => [...empresaKeys.all, 'choices'] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obtener la configuración de la empresa
 *
 * @returns Query con la configuración de la empresa
 *
 * @example
 * ```tsx
 * const { data: empresa, isLoading, isConfigured } = useEmpresaConfig();
 *
 * if (!isConfigured) {
 *   return <EmpresaSetupForm />;
 * }
 * ```
 */
export function useEmpresaConfig() {
  const query = useQuery({
    queryKey: empresaKeys.config(),
    queryFn: empresaApi.get,
    staleTime: 10 * 60 * 1000, // 10 minutos (datos que cambian poco)
    retry: 1,
  });

  return {
    ...query,
    empresa: query.data,
    isConfigured: query.data?.configured ?? false,
  };
}

/**
 * Hook para obtener las opciones de los campos select
 *
 * @returns Query con las opciones para dropdowns
 *
 * @example
 * ```tsx
 * const { data: choices } = useEmpresaChoices();
 *
 * <Select options={choices?.departamentos} />
 * ```
 */
export function useEmpresaChoices() {
  return useQuery({
    queryKey: empresaKeys.choices(),
    queryFn: empresaApi.getChoices,
    staleTime: 60 * 60 * 1000, // 1 hora (datos estáticos)
    retry: 1,
  });
}

/**
 * Hook para crear la configuración de la empresa
 *
 * @returns Mutation para crear la configuración
 *
 * @example
 * ```tsx
 * const createEmpresa = useCreateEmpresa();
 *
 * createEmpresa.mutate(formData, {
 *   onSuccess: () => navigate('/dashboard')
 * });
 * ```
 */
export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: EmpresaConfigFormData) => empresaApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaKeys.config() });
      toast.success('Configuración de empresa creada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
        error.response?.data?.nit?.[0] ||
        'Error al crear la configuración de empresa';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar la configuración de la empresa
 *
 * @returns Mutation para actualizar la configuración
 *
 * @example
 * ```tsx
 * const updateEmpresa = useUpdateEmpresa();
 *
 * updateEmpresa.mutate({
 *   telefono_principal: '3001234567'
 * });
 * ```
 */
export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: Partial<EmpresaConfigFormData>) => empresaApi.update(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaKeys.config() });
      toast.success('Configuración de empresa actualizada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
        error.response?.data?.nit?.[0] ||
        'Error al actualizar la configuración de empresa';
      toast.error(message);
    },
  });
}

/**
 * Hook para inicializar la configuración con valores por defecto
 *
 * @returns Mutation para inicializar la configuración
 *
 * @example
 * ```tsx
 * const initEmpresa = useInitializeEmpresa();
 *
 * initEmpresa.mutate();
 * ```
 */
export function useInitializeEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => empresaApi.initialize(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: empresaKeys.config() });
      if (response.created) {
        toast.success('Configuración inicializada con valores por defecto');
      } else {
        toast.info('Ya existe una configuración de empresa');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al inicializar la configuración';
      toast.error(message);
    },
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook helper para obtener datos específicos de la empresa
 * Útil para mostrar información en headers, footers, etc.
 *
 * @returns Datos básicos de la empresa
 *
 * @example
 * ```tsx
 * const { razonSocial, nit, isLoading } = useEmpresaBasicInfo();
 *
 * <Header title={razonSocial} />
 * ```
 */
export function useEmpresaBasicInfo() {
  const { empresa, isLoading, isConfigured } = useEmpresaConfig();

  return {
    razonSocial: empresa?.razon_social ?? '',
    nombreComercial: empresa?.nombre_comercial ?? empresa?.razon_social ?? '',
    nit: empresa?.nit ?? '',
    nitDisplay: empresa?.nit ?? 'Sin configurar',
    ciudad: empresa?.ciudad ?? '',
    departamento: empresa?.departamento_display ?? '',
    direccion: empresa?.direccion_completa ?? '',
    telefono: empresa?.telefono_principal ?? '',
    email: empresa?.email_corporativo ?? '',
    representante: empresa?.representante_legal ?? '',
    isLoading,
    isConfigured,
  };
}

/**
 * Hook helper para obtener la configuración regional
 * Útil para formatear fechas, números y monedas
 *
 * @returns Configuración regional de la empresa
 *
 * @example
 * ```tsx
 * const { formatoFecha, simboloMoneda } = useEmpresaRegional();
 *
 * formatDate(fecha, formatoFecha);
 * ```
 */
export function useEmpresaRegional() {
  const { empresa, isLoading } = useEmpresaConfig();

  return {
    zonaHoraria: empresa?.zona_horaria ?? 'America/Bogota',
    formatoFecha: empresa?.formato_fecha ?? 'DD/MM/YYYY',
    moneda: empresa?.moneda ?? 'COP',
    simboloMoneda: empresa?.simbolo_moneda ?? '$',
    separadorMiles: empresa?.separador_miles ?? '.',
    separadorDecimales: empresa?.separador_decimales ?? ',',
    isLoading,
  };
}
