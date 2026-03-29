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
} from '../types/encuestas.types';

// Query keys
export const encuestasKeys = {
  all: ['encuestas-dofa'] as const,
  lists: () => [...encuestasKeys.all, 'list'] as const,
  list: (filters?: EncuestaFilters) => [...encuestasKeys.lists(), filters] as const,
  details: () => [...encuestasKeys.all, 'detail'] as const,
  detail: (id: number) => [...encuestasKeys.details(), id] as const,
  estadisticas: (id: number) => [...encuestasKeys.all, 'estadisticas', id] as const,
  temas: (_encuestaId: number) => [...encuestasKeys.all, 'temas', _encuestaId] as const,
  participantes: (_encuestaId: number) =>
    [...encuestasKeys.all, 'participantes', _encuestaId] as const,
  respuestas: (filters?: RespuestaFilters) =>
    [...encuestasKeys.all, 'respuestas', filters] as const,
  preguntasContexto: () => [...encuestasKeys.all, 'preguntas-contexto'] as const,
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
 * Hook para consolidar respuestas en DOFA y PESTEL
 */
export function useConsolidarEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, umbral }: { id: number; umbral?: number }) =>
      encuestasApi.consolidar(id, umbral),
    onSuccess: (result, { id }) => {
      // Invalidar encuesta + estadísticas
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.estadisticas(id) });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });

      // Invalidar factores DOFA y PESTEL para que las tablas se refresquen
      queryClient.invalidateQueries({ queryKey: ['factores-dofa'] });
      queryClient.invalidateQueries({ queryKey: ['factores-pestel'] });
      queryClient.invalidateQueries({ queryKey: ['analisis-dofa'] });
      queryClient.invalidateQueries({ queryKey: ['analisis-pestel'] });

      if (result.success) {
        const partes = [];
        if (result.factores_dofa_creados > 0) {
          partes.push(`${result.factores_dofa_creados} factores DOFA`);
        }
        if (result.factores_pestel_creados > 0) {
          partes.push(`${result.factores_pestel_creados} factores PESTEL`);
        }
        const sinConsenso = result.sin_consenso?.length || 0;

        const prefijo = result.es_reconsolidacion ? 'Re-consolidación' : 'Consolidación';

        if (partes.length > 0) {
          toast.success(`${prefijo} exitosa: ${partes.join(' y ')} creados`);
        } else {
          toast.warning(
            `${prefijo} completada pero no se crearon factores. Verifique el umbral de consenso.`
          );
        }

        if (result.analisis_pestel_auto_creado) {
          toast.info(
            'Se creó automáticamente un Análisis PESTEL para vincular los factores del entorno.'
          );
        }

        if (sinConsenso > 0) {
          toast.info(
            `${sinConsenso} tema(s) sin consenso suficiente (umbral: ${((result.umbral_usado || 0.6) * 100).toFixed(0)}%)`
          );
        }
      } else {
        toast.warning(result.mensaje || 'No se pudo consolidar la encuesta');
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al consolidar: ${error.message}`);
    },
  });
}

/**
 * Hook para regenerar temas PCI-POAM (si se crearon con error)
 */
export function useRegenerarTemas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => encuestasApi.regenerarTemas(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.temas(id) });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
      toast.success(result.detail);
    },
    onError: (error: Error) => {
      toast.error(`Error al regenerar temas: ${error.message}`);
    },
  });
}

// ==============================================================================
// TEMAS
// ==============================================================================

/**
 * Hook para listar temas de una encuesta
 */
export function useTemasEncuesta(_encuestaId: number | undefined) {
  return useQuery({
    queryKey: encuestasKeys.temas(_encuestaId!),
    queryFn: () => temasApi.list(_encuestaId!),
    enabled: !!_encuestaId,
  });
}

/**
 * Hook para crear tema
 */
export function useCreateTema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ _encuestaId, data }: { _encuestaId: number; data: CreateTemaDTO }) =>
      temasApi.create(_encuestaId, data),
    onSuccess: (_, { _encuestaId }) => {
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.temas(_encuestaId),
      });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.detail(_encuestaId),
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
    mutationFn: ({ id, _encuestaId }: { id: number; _encuestaId: number }) => temasApi.delete(id),
    onSuccess: (_, { _encuestaId }) => {
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.temas(_encuestaId),
      });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.detail(_encuestaId),
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
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
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
    mutationFn: ({ id, _encuestaId }: { id: number; _encuestaId: number }) =>
      participantesApi.delete(id),
    onSuccess: (_, { _encuestaId }) => {
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.participantes(_encuestaId),
      });
      queryClient.invalidateQueries({
        queryKey: encuestasKeys.detail(_encuestaId),
      });
      queryClient.invalidateQueries({ queryKey: encuestasKeys.lists() });
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

/**
 * Hook para actualizar respuesta existente (Mi Portal — el respondente cambia su respuesta)
 */
export function useUpdateRespuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateRespuestaDTO> }) =>
      respuestasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encuestasKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar respuesta: ${error.message}`);
    },
  });
}

// ==============================================================================
// MI PORTAL — MIS ENCUESTAS PENDIENTES
// ==============================================================================

/**
 * Hook para obtener las encuestas activas donde el usuario es participante
 */
export function useMisEncuestas() {
  return useQuery({
    queryKey: [...encuestasKeys.all, 'mis-encuestas'],
    queryFn: () => encuestasApi.misEncuestas(),
    staleTime: 60_000,
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
