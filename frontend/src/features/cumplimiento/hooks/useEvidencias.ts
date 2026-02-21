/**
 * TanStack Query hooks para Evidencias Centralizadas.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Direct import to avoid circular dependency: common/index.ts → EvidenceUploader → useEvidencias → common/index.ts
import { toast } from '@/components/common/Toast';
import { createQueryKeys } from '@/lib/query-keys';
import { evidenciaApi } from '../api/evidenciaApi';
import type {
  EvidenciaFilters,
  CrearEvidenciaPayload,
  ActualizarEvidenciaPayload,
  RechazarEvidenciaPayload,
} from '../types/evidencia.types';

export const evidenciaKeys = createQueryKeys<EvidenciaFilters>('evidencias');

// ============ QUERIES ============

export function useEvidencias(filters?: EvidenciaFilters) {
  return useQuery({
    queryKey: evidenciaKeys.list(filters),
    queryFn: () => evidenciaApi.listar(filters),
  });
}

export function useEvidencia(id: number | null) {
  return useQuery({
    queryKey: evidenciaKeys.detail(id ?? 0),
    queryFn: () => evidenciaApi.detalle(id!),
    enabled: !!id,
  });
}

export function useEvidenciasPorEntidad(entityType: string, entityId: number) {
  return useQuery({
    queryKey: evidenciaKeys.custom('por-entidad', entityType, entityId),
    queryFn: () => evidenciaApi.porEntidad(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useResumenEvidencias(norma?: string) {
  return useQuery({
    queryKey: evidenciaKeys.custom('resumen', norma),
    queryFn: () => evidenciaApi.resumen(norma),
  });
}

export function useEvidenciasPendientes() {
  return useQuery({
    queryKey: evidenciaKeys.custom('pendientes'),
    queryFn: () => evidenciaApi.pendientes(),
  });
}

export function useEvidenciasVencidas() {
  return useQuery({
    queryKey: evidenciaKeys.custom('vencidas'),
    queryFn: () => evidenciaApi.vencidas(),
  });
}

export function useHistorialEvidencia(id: number | null) {
  return useQuery({
    queryKey: evidenciaKeys.custom('historial', id),
    queryFn: () => evidenciaApi.historial(id!),
    enabled: !!id,
  });
}

// ============ MUTATIONS ============

export function useCrearEvidencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearEvidenciaPayload) => evidenciaApi.crear(payload),
    onSuccess: (_data, variables) => {
      toast.success('Evidencia subida correctamente');
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: evidenciaKeys.custom('por-entidad', variables.entity_type, variables.entity_id),
      });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.custom('resumen') });
    },
    onError: () => {
      toast.error('Error al subir la evidencia');
    },
  });
}

export function useActualizarEvidencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarEvidenciaPayload }) =>
      evidenciaApi.actualizar(id, payload),
    onSuccess: (_data, { id }) => {
      toast.success('Evidencia actualizada');
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.lists() });
    },
    onError: () => {
      toast.error('Error al actualizar');
    },
  });
}

export function useEliminarEvidencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => evidenciaApi.eliminar(id),
    onSuccess: () => {
      toast.success('Evidencia eliminada');
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.custom('resumen') });
    },
    onError: () => {
      toast.error('Error al eliminar');
    },
  });
}

export function useAprobarEvidencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => evidenciaApi.aprobar(id),
    onSuccess: (_data, id) => {
      toast.success('Evidencia aprobada');
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.custom('pendientes') });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.custom('resumen') });
    },
    onError: () => {
      toast.error('Error al aprobar');
    },
  });
}

export function useRechazarEvidencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RechazarEvidenciaPayload }) =>
      evidenciaApi.rechazar(id, payload),
    onSuccess: (_data, { id }) => {
      toast.success('Evidencia rechazada');
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.custom('pendientes') });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.custom('resumen') });
    },
    onError: () => {
      toast.error('Error al rechazar');
    },
  });
}

export function useArchivarEvidencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => evidenciaApi.archivar(id),
    onSuccess: (_data, id) => {
      toast.success('Evidencia archivada');
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenciaKeys.custom('resumen') });
    },
    onError: () => {
      toast.error('Error al archivar');
    },
  });
}
