/**
 * React Query Hooks para Revisión por Dirección (ISO 9.3)
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  programacionApi,
  participantesConvocadosApi,
  actasApi,
  elementosEntradaApi,
  decisionesApi,
  participantesActaApi,
  compromisosApi,
  statsApi,
  informeConsolidadoApi,
  firmaActaApi,
  enviarInformeApi,
  exportInformeGerencialApi,
} from '../api/revisionDireccionApi';
import type {
  CreateProgramacionRevisionDTO,
  UpdateProgramacionRevisionDTO,
  ProgramacionFilters,
  CreateActaRevisionDTO,
  UpdateActaRevisionDTO,
  ActaFilters,
  CreateCompromisoAccionDTO,
  UpdateCompromisoDTO,
  CompromisoFilters,
  CreateParticipanteConvocadoDTO,
  CreateParticipanteActaDTO,
  CreateElementoEntradaDTO,
  CreateDecisionResultadoDTO,
  AprobarActaDTO,
  FirmarActaDTO,
  EnviarInformeDTO,
} from '../types/revisionDireccion';

// ==================== QUERY KEYS ====================

export const revisionDireccionKeys = {
  // Programaciones
  programaciones: (filters?: ProgramacionFilters) => ['programaciones-revision', filters] as const,
  programacion: (id: number) => ['programacion-revision', id] as const,
  programacionesProximas: (limit?: number) => ['programaciones-proximas', limit] as const,
  programacionChoices: ['programacion-choices'] as const,

  // Actas
  actas: (filters?: ActaFilters) => ['actas-revision', filters] as const,
  acta: (id: number) => ['acta-revision', id] as const,
  actaByProgramacion: (programacionId: number) => ['acta-by-programacion', programacionId] as const,
  actaChoices: ['acta-choices'] as const,

  // Compromisos
  compromisos: (filters?: CompromisoFilters) => ['compromisos-revision', filters] as const,
  compromiso: (id: number) => ['compromiso-revision', id] as const,
  compromisosVencidos: ['compromisos-vencidos'] as const,
  compromisosCriticos: (limit?: number) => ['compromisos-criticos', limit] as const,
  compromisoChoices: ['compromiso-choices'] as const,

  // Estadísticas
  stats: ['revision-direccion-stats'] as const,
  dashboard: ['revision-direccion-dashboard'] as const,

  // Informe Consolidado
  informeConsolidado: (fechaDesde?: string, fechaHasta?: string) =>
    ['revision-direccion', 'informe-consolidado', fechaDesde, fechaHasta] as const,

  // Firma Digital
  estadoFirmas: (actaId: number) => ['revision-direccion', 'estado-firmas', actaId] as const,
};

// ==================== PROGRAMACIÓN HOOKS ====================

export const useProgramasRevision = (filters?: ProgramacionFilters) => {
  return useQuery({
    queryKey: revisionDireccionKeys.programaciones(filters),
    queryFn: () => programacionApi.getAll(filters),
  });
};

export const useProgramacionRevision = (id: number) => {
  return useQuery({
    queryKey: revisionDireccionKeys.programacion(id),
    queryFn: () => programacionApi.getById(id),
    enabled: !!id,
  });
};

export const useProgramacionesProximas = (limit: number = 5) => {
  return useQuery({
    queryKey: revisionDireccionKeys.programacionesProximas(limit),
    queryFn: () => programacionApi.getProximas(limit),
    refetchInterval: 120_000, // Refresca cada 2 minutos
  });
};

export const useProgramacionChoices = () => {
  return useQuery({
    queryKey: revisionDireccionKeys.programacionChoices,
    queryFn: programacionApi.getChoices,
    staleTime: Infinity,
  });
};

export const useCreateProgramacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProgramacionRevisionDTO) => programacionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacionesProximas() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Programación de revisión creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la programación');
    },
  });
};

export const useUpdateProgramacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProgramacionRevisionDTO }) =>
      programacionApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacion(id) });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacionesProximas() });
      toast.success('Programación actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la programación');
    },
  });
};

export const useDeleteProgramacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => programacionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacionesProximas() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Programación eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la programación');
    },
  });
};

export const useEnviarNotificaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => programacionApi.enviarNotificaciones(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacion(id) });
      toast.success(`Notificaciones enviadas a ${result.enviados} participantes`);
    },
    onError: () => {
      toast.error('Error al enviar notificaciones');
    },
  });
};

export const useReprogramarRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { nueva_fecha: string; hora_inicio: string; motivo?: string };
    }) => programacionApi.reprogramar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacion(id) });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacionesProximas() });
      toast.success('Revisión reprogramada exitosamente');
    },
    onError: () => {
      toast.error('Error al reprogramar la revisión');
    },
  });
};

export const useCancelarProgramacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { motivo: string } }) =>
      programacionApi.cancelar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.programacion(id) });
      toast.success('Programación cancelada');
    },
    onError: () => {
      toast.error('Error al cancelar la programación');
    },
  });
};

// ==================== PARTICIPANTES CONVOCADOS HOOKS ====================

export const useAddParticipanteConvocado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programacionId,
      data,
    }: {
      programacionId: number;
      data: CreateParticipanteConvocadoDTO;
    }) => participantesConvocadosApi.addParticipante(programacionId, data),
    onSuccess: (_, { programacionId }) => {
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.programacion(programacionId),
      });
      toast.success('Participante agregado');
    },
    onError: () => {
      toast.error('Error al agregar participante');
    },
  });
};

export const useRemoveParticipanteConvocado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programacionId,
      participanteId,
    }: {
      programacionId: number;
      participanteId: number;
    }) => participantesConvocadosApi.removeParticipante(programacionId, participanteId),
    onSuccess: (_, { programacionId }) => {
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.programacion(programacionId),
      });
      toast.success('Participante removido');
    },
    onError: () => {
      toast.error('Error al remover participante');
    },
  });
};

export const useConfirmarAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programacionId,
      participanteId,
      data,
    }: {
      programacionId: number;
      participanteId: number;
      data: { confirmado: boolean; observaciones?: string };
    }) => participantesConvocadosApi.confirmarAsistencia(programacionId, participanteId, data),
    onSuccess: (_, { programacionId }) => {
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.programacion(programacionId),
      });
      toast.success('Asistencia confirmada');
    },
    onError: () => {
      toast.error('Error al confirmar asistencia');
    },
  });
};

// ==================== ACTAS HOOKS ====================

export const useActasRevision = (filters?: ActaFilters) => {
  return useQuery({
    queryKey: revisionDireccionKeys.actas(filters),
    queryFn: () => actasApi.getAll(filters),
  });
};

export const useActaRevision = (id: number) => {
  return useQuery({
    queryKey: revisionDireccionKeys.acta(id),
    queryFn: () => actasApi.getById(id),
    enabled: !!id,
  });
};

export const useActaByProgramacion = (programacionId: number) => {
  return useQuery({
    queryKey: revisionDireccionKeys.actaByProgramacion(programacionId),
    queryFn: () => actasApi.getByProgramacion(programacionId),
    enabled: !!programacionId,
    retry: false,
  });
};

export const useActaChoices = () => {
  return useQuery({
    queryKey: revisionDireccionKeys.actaChoices,
    queryFn: actasApi.getChoices,
    staleTime: Infinity,
  });
};

export const useCreateActa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActaRevisionDTO) => actasApi.create(data),
    onSuccess: (newActa) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.actas() });
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.actaByProgramacion(newActa.programacion),
      });
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.programacion(newActa.programacion),
      });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.dashboard });
      toast.success('Acta de revisión creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el acta');
    },
  });
};

export const useUpdateActa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActaRevisionDTO }) =>
      actasApi.update(id, data),
    onSuccess: (updatedActa) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.actas() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(updatedActa.id) });
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.actaByProgramacion(updatedActa.programacion),
      });
      toast.success('Acta actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el acta');
    },
  });
};

export const useDeleteActa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => actasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.actas() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.dashboard });
      toast.success('Acta eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el acta');
    },
  });
};

export const useAprobarActa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: AprobarActaDTO }) => actasApi.aprobar(id, data),
    onSuccess: (updatedActa) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.actas() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(updatedActa.id) });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Acta aprobada exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar el acta');
    },
  });
};

export const useCerrarActa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { observaciones?: string } }) =>
      actasApi.cerrar(id, data),
    onSuccess: (updatedActa) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.actas() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(updatedActa.id) });
      toast.success('Acta cerrada exitosamente');
    },
    onError: () => {
      toast.error('Error al cerrar el acta');
    },
  });
};

export const useGenerarPDFActa = () => {
  return useMutation({
    mutationFn: (id: number) => actasApi.generarPDF(id),
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Acta_Revision_Direccion_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF generado exitosamente');
    },
    onError: () => {
      toast.error('Error al generar el PDF');
    },
  });
};

// ==================== ELEMENTOS DE ENTRADA HOOKS ====================

export const useAddElementoEntrada = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, data }: { actaId: number; data: CreateElementoEntradaDTO }) =>
      elementosEntradaApi.add(actaId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Elemento de entrada agregado');
    },
    onError: () => {
      toast.error('Error al agregar elemento');
    },
  });
};

export const useUpdateElementoEntrada = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actaId,
      elementoId,
      data,
    }: {
      actaId: number;
      elementoId: number;
      data: Partial<CreateElementoEntradaDTO>;
    }) => elementosEntradaApi.update(actaId, elementoId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Elemento actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar elemento');
    },
  });
};

export const useDeleteElementoEntrada = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, elementoId }: { actaId: number; elementoId: number }) =>
      elementosEntradaApi.delete(actaId, elementoId),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Elemento eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar elemento');
    },
  });
};

// ==================== DECISIONES HOOKS ====================

export const useAddDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, data }: { actaId: number; data: CreateDecisionResultadoDTO }) =>
      decisionesApi.add(actaId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Decisión agregada');
    },
    onError: () => {
      toast.error('Error al agregar decisión');
    },
  });
};

export const useUpdateDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actaId,
      decisionId,
      data,
    }: {
      actaId: number;
      decisionId: number;
      data: Partial<CreateDecisionResultadoDTO>;
    }) => decisionesApi.update(actaId, decisionId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Decisión actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar decisión');
    },
  });
};

export const useDeleteDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, decisionId }: { actaId: number; decisionId: number }) =>
      decisionesApi.delete(actaId, decisionId),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Decisión eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar decisión');
    },
  });
};

// ==================== PARTICIPANTES DE ACTA HOOKS ====================

export const useAddParticipanteActa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, data }: { actaId: number; data: CreateParticipanteActaDTO }) =>
      participantesActaApi.add(actaId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Participante agregado al acta');
    },
    onError: () => {
      toast.error('Error al agregar participante');
    },
  });
};

export const useRegistrarAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actaId,
      participanteId,
      data,
    }: {
      actaId: number;
      participanteId: number;
      data: { asistencia: string; hora_llegada?: string; observaciones?: string };
    }) => participantesActaApi.registrarAsistencia(actaId, participanteId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Asistencia registrada');
    },
    onError: () => {
      toast.error('Error al registrar asistencia');
    },
  });
};

// ==================== COMPROMISOS HOOKS ====================

export const useCompromisos = (filters?: CompromisoFilters) => {
  return useQuery({
    queryKey: revisionDireccionKeys.compromisos(filters),
    queryFn: () => compromisosApi.getAll(filters),
    refetchInterval: 60_000, // Refresca cada minuto
  });
};

export const useCompromiso = (id: number) => {
  return useQuery({
    queryKey: revisionDireccionKeys.compromiso(id),
    queryFn: () => compromisosApi.getById(id),
    enabled: !!id,
  });
};

export const useCompromisosVencidos = () => {
  return useQuery({
    queryKey: revisionDireccionKeys.compromisosVencidos,
    queryFn: compromisosApi.getVencidos,
    refetchInterval: 60_000, // Refresca cada minuto
  });
};

export const useCompromisosCriticos = (limit: number = 10) => {
  return useQuery({
    queryKey: revisionDireccionKeys.compromisosCriticos(limit),
    queryFn: () => compromisosApi.getCriticos(limit),
    refetchInterval: 60_000, // Refresca cada minuto
  });
};

export const useCompromisoChoices = () => {
  return useQuery({
    queryKey: revisionDireccionKeys.compromisoChoices,
    queryFn: compromisosApi.getChoices,
    staleTime: Infinity,
  });
};

export const useCreateCompromiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, data }: { actaId: number; data: CreateCompromisoAccionDTO }) =>
      compromisosApi.create(actaId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.compromisos() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Compromiso creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el compromiso');
    },
  });
};

export const useUpdateCompromiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompromisoDTO }) =>
      compromisosApi.update(id, data),
    onSuccess: (updatedCompromiso) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.compromisos() });
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.compromiso(updatedCompromiso.id),
      });
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.acta(updatedCompromiso.acta),
      });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Compromiso actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el compromiso');
    },
  });
};

export const useDeleteCompromiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => compromisosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.compromisos() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Compromiso eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el compromiso');
    },
  });
};

export const useUpdateProgresoCompromiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progreso }: { id: number; progreso: number }) =>
      compromisosApi.updateProgreso(id, { progreso }),
    onSuccess: (updatedCompromiso) => {
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.compromiso(updatedCompromiso.id),
      });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.compromisos() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Progreso actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar progreso');
    },
  });
};

export const useMarcarCompromisoCompletado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { evidencia_cumplimiento?: string; observaciones?: string };
    }) => compromisosApi.marcarCompletado(id, data),
    onSuccess: (updatedCompromiso) => {
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.compromiso(updatedCompromiso.id),
      });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.compromisos() });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.stats });
      toast.success('Compromiso marcado como completado');
    },
    onError: () => {
      toast.error('Error al marcar como completado');
    },
  });
};

export const useVerificarCompromiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { es_eficaz: boolean; observaciones?: string };
    }) => compromisosApi.verificar(id, data),
    onSuccess: (updatedCompromiso) => {
      queryClient.invalidateQueries({
        queryKey: revisionDireccionKeys.compromiso(updatedCompromiso.id),
      });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.compromisos() });
      toast.success('Compromiso verificado');
    },
    onError: () => {
      toast.error('Error al verificar compromiso');
    },
  });
};

// ==================== ESTADÍSTICAS HOOKS ====================

export const useRevisionDireccionStats = () => {
  return useQuery({
    queryKey: revisionDireccionKeys.stats,
    queryFn: statsApi.getStats,
  });
};

export const useRevisionDireccionDashboard = () => {
  return useQuery({
    queryKey: revisionDireccionKeys.dashboard,
    queryFn: statsApi.getDashboard,
    refetchInterval: 60_000, // Refresca cada minuto para tiempo real
  });
};

// ==================== INFORME CONSOLIDADO HOOKS ====================

export const useInformeConsolidado = (fechaDesde?: string, fechaHasta?: string) => {
  return useQuery({
    queryKey: revisionDireccionKeys.informeConsolidado(fechaDesde, fechaHasta),
    queryFn: () =>
      informeConsolidadoApi.get({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      }),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

// ==================== FIRMA DIGITAL HOOKS ====================

export const useEstadoFirmas = (actaId: number) => {
  return useQuery({
    queryKey: revisionDireccionKeys.estadoFirmas(actaId),
    queryFn: () => firmaActaApi.estado(actaId),
    enabled: !!actaId,
  });
};

export const useIniciarFirma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actaId: number) => firmaActaApi.iniciar(actaId),
    onSuccess: (_, actaId) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.estadoFirmas(actaId) });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      toast.success('Proceso de firma iniciado exitosamente');
    },
    onError: () => {
      toast.error('Error al iniciar el proceso de firma');
    },
  });
};

export const useFirmarActa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, data }: { actaId: number; data: FirmarActaDTO }) =>
      firmaActaApi.firmar(actaId, data),
    onSuccess: (_, { actaId }) => {
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.estadoFirmas(actaId) });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.acta(actaId) });
      queryClient.invalidateQueries({ queryKey: revisionDireccionKeys.actas() });
      toast.success('Firma registrada exitosamente');
    },
    onError: () => {
      toast.error('Error al registrar la firma');
    },
  });
};

// ==================== ENVÍO DE INFORME HOOKS ====================

export const useEnviarInforme = () => {
  return useMutation({
    mutationFn: ({ actaId, data }: { actaId: number; data: EnviarInformeDTO }) =>
      enviarInformeApi.send(actaId, data),
    onSuccess: (result) => {
      toast.success(`Informe enviado a ${result.destinatarios.length} destinatario(s)`);
    },
    onError: () => {
      toast.error('Error al enviar el informe por correo');
    },
  });
};

// ==================== EXPORT INFORME GERENCIAL PDF HOOKS ====================

export const useExportInformeGerencialPDF = () => {
  return useMutation({
    mutationFn: ({
      programacionId,
      fechaDesde,
      fechaHasta,
    }: {
      programacionId: number;
      fechaDesde?: string;
      fechaHasta?: string;
    }) =>
      exportInformeGerencialApi.pdf(programacionId, {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Informe_Gerencial_Revision_Direccion.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF del informe gerencial generado exitosamente');
    },
    onError: () => {
      toast.error('Error al generar el PDF del informe gerencial');
    },
  });
};
