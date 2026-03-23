/**
 * React Query Hooks para Plantillas de Estructura Organizacional
 *
 * Gestiona:
 * - Listado de templates disponibles
 * - Aplicación de template al tenant actual
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  orgTemplatesApi,
  type OrgTemplate,
  type ApplyTemplateResult,
} from '../api/orgTemplatesApi';

// ==================== QUERY KEYS ====================

const orgTemplatesKeys = {
  all: ['org-templates'] as const,
};

// ==================== QUERIES ====================

/**
 * Hook para obtener todas las plantillas disponibles
 */
export function useOrgTemplates() {
  return useQuery<OrgTemplate[]>({
    queryKey: orgTemplatesKeys.all,
    queryFn: orgTemplatesApi.getAll,
    staleTime: 1000 * 60 * 60, // 1 hora — templates no cambian
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para aplicar una plantilla al tenant actual
 */
export function useApplyOrgTemplate() {
  const queryClient = useQueryClient();

  return useMutation<ApplyTemplateResult, Error, string>({
    mutationFn: (templateCode: string) => orgTemplatesApi.apply(templateCode),
    onSuccess: (result) => {
      toast.success(
        `Plantilla "${result.template_name}" aplicada: ${result.areas_created} áreas y ${result.cargos_created} cargos creados`
      );
      // Invalidar queries de áreas y cargos para refrescar
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
    onError: (error) => {
      toast.error(`Error al aplicar plantilla: ${error.message}`);
    },
  });
}

// Re-exportar tipos
export type { OrgTemplate, ApplyTemplateResult };
