/**
 * React Query hooks para Encuestas Colaborativas DOFA
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  encuestasApi,
  preguntasContextoApi,
  temasApi,
  participantesApi,
  respuestasApi,
  encuestaPublicaApi,
} from '../api/encuestasApi';
import type {
  EncuestaFilters,
  CreateEncuestaDTO,
  UpdateEncuestaDTO,
  CreateTemaDTO,
  ParticipanteFilters,
  CreateParticipanteDTO,
  RespuestaFilters,
  CreateRespuestaDTO,
  RespuestasLoteDTO,
  CompartirEmailDTO,
} from '../types/encuestas.types';

// Query keys
export const encuestasKeys = {
  all: ['encuestas-dofa'] as const,
  lists: () => [...encuestasKeys.all, 'list'] as const,
  list: (filters?: EncuestaFilters) => [...encuestasKeys.lists(), filters] as const,
  details: () => [...encuestasKeys.all, 'detail'] as const,
  detail: (id: number) => [...encuestasKeys.details(), id] as const,
  estadisticas: (id: number) => [...encuestasKeys.all, 'estadisticas', id] as const,
  temas: (encuestaId: number) => [...encuestasKeys.all, 'temas', encuestaId] as const,
  participantes: (encuestaId: number) =>
    [...encuestasKeys.all, 'participantes', encuestaId] as const,
  respuestas: (filters?: RespuestaFilters) =>
    [...encuestasKeys.all, 'respuestas', filters] as const,
  publica: (token: string) => [...encuestasKeys.all, 'publica', token] as const,
  preguntasContexto: () => [...encuestasKeys.all, 'preguntas-contexto'] as const,
  qrCode: (id: number) => [...encuestasKeys.all, 'qr-code', id] as const,
};

// ==============================================================================
// ENCUESTAS
// ==============================================================================

/**
 * Hook para listar encuestas
 */
export function useEncuestas(filters?: EncuestaFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...encuestasKeys.list(filters), page, pageSize],
    queryFn: () => encuestasApi.list(filters, page, pageSize),
  });
}

/**
 * Hook para obtener detalle de encuesta
 */
export function useEncuesta(id: number | undefined) {
  return useQuery({
    queryKey: encuestasKeys.detail(id!),
    queryFn: () => encuestasApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener estadísticas de encuesta
 */
export function useEstadisticasEncuesta(id: number | undefined) {
  return useQuery({
    queryKey: encuestasKeys.estadisticas(id!),
    queryFn: () => encuestasApi.estadisticas(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear encuesta
 */
export function useCreateEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEncuestaDTO) => encuestasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
      toast.success('Encuesta creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear encuesta: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar encuesta
 */
export function useUpdateEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEncuestaDTO }) =>
      encuestasApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
      toast.success('Encuesta actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar encuesta
 */
export function useDeleteEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => encuestasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
      toast.success('Encuesta eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

/**
 * Hook para activar encuesta
 */
export function useActivarEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => encuestasApi.activar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
      toast.success('Encuesta activada');
    },
    onError: (error: Error) => {
      toast.error(`Error al activar: ${error.message}`);
    },
  });
}

/**
 * Hook para cerrar encuesta
 */
export function useCerrarEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => encuestasApi.cerrar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
      toast.success('Encuesta cerrada');
    },
    onError: (error: Error) => {
      toast.error(`Error al cerrar: ${error.message}`);
    },
  });
}

/**
 * Hook para enviar notificaciones
 * @alias useEnviarNotificacionesEncuesta
 */
export function useEnviarNotificacionesEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => encuestasApi.enviarNotificaciones(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      if (result.success) {
        toast.success(`Notificaciones enviadas: ${result.total_notificados} participantes`);
      } else {
        toast.warning(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar notificaciones: ${error.message}`);
    },
  });
}

/**
 * Hook para enviar recordatorio
 */
export function useEnviarRecordatorio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => encuestasApi.enviarRecordatorio(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      if (result.success) {
        toast.success(`Recordatorios enviados: ${result.total_notificados}`);
      } else {
        toast.warning(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar recordatorio: ${error.message}`);
    },
  });
}

/**
 * Hook para consolidar respuestas en DOFA
 */
export function useConsolidarEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, umbral }: { id: number; umbral?: number }) =>
      encuestasApi.consolidar(id, umbral),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.estadisticas(id),
      });
      if (result.success) {
        toast.success(`Consolidación exitosa: ${result.factores_creados} factores creados`);
      } else {
        toast.warning(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al consolidar: ${error.message}`);
    },
  });
}

// ==============================================================================
// TEMAS
// ==============================================================================

/**
 * Hook para listar temas de una encuesta
 */
export function useTemasEncuesta(encuestaId: number | undefined) {
  return useQuery({
    queryKey: encuestasKeys.temas(encuestaId!),
    queryFn: () => temasApi.list(encuestaId!),
    enabled: !!encuestaId,
  });
}

/**
 * Hook para crear tema
 */
export function useCreateTema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ encuestaId, data }: { encuestaId: number; data: CreateTemaDTO }) =>
      temasApi.create(encuestaId, data),
    onSuccess: (_, { encuestaId }) => {
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.temas(encuestaId),
      });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.detail(encuestaId),
      });
      toast.success('Tema agregado');
    },
    onError: (error: Error) => {
      toast.error(`Error al agregar tema: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar tema
 */
export function useDeleteTema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, encuestaId }: { id: number; encuestaId: number }) => temasApi.delete(id),
    onSuccess: (_, { encuestaId }) => {
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.temas(encuestaId),
      });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.detail(encuestaId),
      });
      toast.success('Tema eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar tema: ${error.message}`);
    },
  });
}

// ==============================================================================
// PARTICIPANTES
// ==============================================================================

/**
 * Hook para listar participantes
 */
export function useParticipantes(filters?: ParticipanteFilters) {
  return useQuery({
    queryKey: encuestasKeys.participantes(filters?.encuesta || 0),
    queryFn: () => participantesApi.list(filters),
    enabled: !!filters?.encuesta,
  });
}

/**
 * Hook para agregar participante
 */
export function useAddParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ encuestaId, data }: { encuestaId: number; data: CreateParticipanteDTO }) =>
      participantesApi.create(encuestaId, data),
    onSuccess: (_, { encuestaId }) => {
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.participantes(encuestaId),
      });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.detail(encuestaId),
      });
      toast.success('Participante agregado');
    },
    onError: (error: Error) => {
      toast.error(`Error al agregar participante: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar participante
 */
export function useDeleteParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, encuestaId }: { id: number; encuestaId: number }) =>
      participantesApi.delete(id),
    onSuccess: (_, { encuestaId }) => {
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.participantes(encuestaId),
      });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.detail(encuestaId),
      });
      toast.success('Participante eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar participante: ${error.message}`);
    },
  });
}

// ==============================================================================
// RESPUESTAS
// ==============================================================================

/**
 * Hook para listar respuestas
 */
export function useRespuestas(filters?: RespuestaFilters) {
  return useQuery({
    queryKey: encuestasKeys.respuestas(filters),
    queryFn: () => respuestasApi.list(filters),
    enabled: !!filters?.tema || !!filters?.tema__encuesta,
  });
}

/**
 * Hook para crear respuesta (usuario autenticado)
 */
export function useCreateRespuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRespuestaDTO) => respuestasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.all });
      toast.success('Respuesta registrada');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar respuesta: ${error.message}`);
    },
  });
}

// ==============================================================================
// PREGUNTAS CONTEXTO PCI-POAM
// ==============================================================================

/**
 * Hook para listar banco de preguntas PCI-POAM
 */
export function usePreguntasContexto(filters?: {
  perfil?: string;
  capacidad_pci?: string;
  factor_poam?: string;
}) {
  return useQuery({
    queryKey: [...encuestasKeys.preguntasContexto(), filters],
    queryFn: () => preguntasContextoApi.list(filters),
  });
}

// ==============================================================================
// COMPARTIR & QR
// ==============================================================================

/**
 * Hook para compartir encuesta por email
 */
export function useCompartirEmail() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompartirEmailDTO }) =>
      encuestasApi.compartirEmail(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al compartir: ${error.message}`);
    },
  });
}

/**
 * Hook para obtener QR code de encuesta
 */
export function useQrCode(id: number | undefined) {
  return useQuery({
    queryKey: encuestasKeys.qrCode(id!),
    queryFn: () => encuestasApi.getQrCode(id!),
    enabled: !!id,
    staleTime: Infinity,
  });
}

// ==============================================================================
// ENCUESTA PÚBLICA
// ==============================================================================

/**
 * Hook para obtener encuesta pública por token
 */
export function useEncuestaPublica(token: string | undefined) {
  return useQuery({
    queryKey: encuestasKeys.publica(token!),
    queryFn: () => encuestaPublicaApi.get(token!),
    enabled: !!token,
    retry: false,
  });
}

/**
 * Hook para enviar respuestas a encuesta pública
 */
export function useResponderEncuestaPublica() {
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: RespuestasLoteDTO }) =>
      encuestaPublicaApi.responder(token, data),
    onSuccess: (result) => {
      toast.success(`¡Gracias por participar! ${result.respuestas_creadas} respuestas registradas`);
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar respuestas: ${error.message}`);
    },
  });
}
