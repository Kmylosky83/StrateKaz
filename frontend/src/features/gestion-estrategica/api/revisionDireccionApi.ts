/**
 * API Client para Revisión por Dirección (ISO 9.3)
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  ProgramacionRevision,
  CreateProgramacionRevisionDTO,
  UpdateProgramacionRevisionDTO,
  ProgramacionFilters,
  ActaRevision,
  CreateActaRevisionDTO,
  UpdateActaRevisionDTO,
  ActaFilters,
  CompromisoAccion,
  CreateCompromisoAccionDTO,
  UpdateCompromisoDTO,
  CompromisoFilters,
  ParticipanteConvocado,
  CreateParticipanteConvocadoDTO,
  ParticipanteActa,
  CreateParticipanteActaDTO,
  ElementoEntrada,
  CreateElementoEntradaDTO,
  DecisionResultado,
  CreateDecisionResultadoDTO,
  AprobarActaDTO,
  RevisionDireccionStats,
  DashboardRevision,
} from '../types/revisionDireccion';
import type { PaginatedResponse, SelectOption } from '../types/strategic.types';

const BASE_URL = '/revision-direccion';

// ==================== PROGRAMACIÓN DE REVISIÓN ====================

export const programacionApi = {
  getAll: async (
    filters?: ProgramacionFilters
  ): Promise<PaginatedResponse<ProgramacionRevision>> => {
    const response = await axiosInstance.get(`${BASE_URL}/programaciones/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ProgramacionRevision> => {
    const response = await axiosInstance.get(`${BASE_URL}/programaciones/${id}/`);
    return response.data;
  },

  getProximas: async (limit: number = 5): Promise<ProgramacionRevision[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/programaciones/proximas/`, {
      params: { limit },
    });
    return response.data;
  },

  create: async (data: CreateProgramacionRevisionDTO): Promise<ProgramacionRevision> => {
    const response = await axiosInstance.post(`${BASE_URL}/programaciones/`, data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateProgramacionRevisionDTO
  ): Promise<ProgramacionRevision> => {
    const response = await axiosInstance.patch(`${BASE_URL}/programaciones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/programaciones/${id}/`);
  },

  enviarNotificaciones: async (id: number): Promise<{ message: string; enviados: number }> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/programaciones/${id}/enviar-notificaciones/`
    );
    return response.data;
  },

  reprogramar: async (
    id: number,
    data: { nueva_fecha: string; hora_inicio: string; motivo?: string }
  ): Promise<ProgramacionRevision> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/programaciones/${id}/reprogramar/`,
      data
    );
    return response.data;
  },

  cancelar: async (id: number, data: { motivo: string }): Promise<ProgramacionRevision> => {
    const response = await axiosInstance.post(`${BASE_URL}/programaciones/${id}/cancelar/`, data);
    return response.data;
  },

  getChoices: async (): Promise<{
    frecuencias: SelectOption[];
    modalidades: SelectOption[];
    estados: SelectOption[];
    roles_reunion: SelectOption[];
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/programaciones/choices/`);
    return response.data;
  },
};

// ==================== PARTICIPANTES CONVOCADOS ====================

export const participantesConvocadosApi = {
  addParticipante: async (
    programacionId: number,
    data: CreateParticipanteConvocadoDTO
  ): Promise<ParticipanteConvocado> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/programaciones/${programacionId}/participantes/`,
      data
    );
    return response.data;
  },

  updateParticipante: async (
    programacionId: number,
    participanteId: number,
    data: Partial<CreateParticipanteConvocadoDTO>
  ): Promise<ParticipanteConvocado> => {
    const response = await axiosInstance.patch(
      `${BASE_URL}/programaciones/${programacionId}/participantes/${participanteId}/`,
      data
    );
    return response.data;
  },

  removeParticipante: async (programacionId: number, participanteId: number): Promise<void> => {
    await axiosInstance.delete(
      `${BASE_URL}/programaciones/${programacionId}/participantes/${participanteId}/`
    );
  },

  confirmarAsistencia: async (
    programacionId: number,
    participanteId: number,
    data: { confirmado: boolean; observaciones?: string }
  ): Promise<ParticipanteConvocado> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/programaciones/${programacionId}/participantes/${participanteId}/confirmar/`,
      data
    );
    return response.data;
  },
};

// ==================== ACTAS DE REVISIÓN ====================

export const actasApi = {
  getAll: async (filters?: ActaFilters): Promise<PaginatedResponse<ActaRevision>> => {
    const response = await axiosInstance.get(`${BASE_URL}/actas/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ActaRevision> => {
    const response = await axiosInstance.get(`${BASE_URL}/actas/${id}/`);
    return response.data;
  },

  getByProgramacion: async (programacionId: number): Promise<ActaRevision | null> => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/actas/by-programacion/${programacionId}/`
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  create: async (data: CreateActaRevisionDTO): Promise<ActaRevision> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateActaRevisionDTO): Promise<ActaRevision> => {
    const response = await axiosInstance.patch(`${BASE_URL}/actas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/actas/${id}/`);
  },

  aprobar: async (id: number, data?: AprobarActaDTO): Promise<ActaRevision> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas/${id}/aprobar/`, data || {});
    return response.data;
  },

  cerrar: async (id: number, data: { observaciones?: string }): Promise<ActaRevision> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas/${id}/cerrar/`, data);
    return response.data;
  },

  generarPDF: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(`${BASE_URL}/export/acta/${id}/pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  duplicar: async (id: number): Promise<ActaRevision> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas/${id}/duplicar/`);
    return response.data;
  },

  getChoices: async (): Promise<{
    estados: SelectOption[];
    categorias_entrada: SelectOption[];
    tipos_decision: SelectOption[];
    prioridades: SelectOption[];
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/actas/choices/`);
    return response.data;
  },
};

// ==================== ELEMENTOS DE ENTRADA ====================

export const elementosEntradaApi = {
  add: async (actaId: number, data: CreateElementoEntradaDTO): Promise<ElementoEntrada> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/actas/${actaId}/elementos-entrada/`,
      data
    );
    return response.data;
  },

  update: async (
    actaId: number,
    elementoId: number,
    data: Partial<CreateElementoEntradaDTO>
  ): Promise<ElementoEntrada> => {
    const response = await axiosInstance.patch(
      `${BASE_URL}/actas/${actaId}/elementos-entrada/${elementoId}/`,
      data
    );
    return response.data;
  },

  delete: async (actaId: number, elementoId: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/actas/${actaId}/elementos-entrada/${elementoId}/`);
  },

  reorder: async (
    actaId: number,
    data: { elementos: Array<{ id: number; order: number }> }
  ): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/actas/${actaId}/elementos-entrada/reordenar/`, data);
  },
};

// ==================== DECISIONES Y RESULTADOS ====================

export const decisionesApi = {
  add: async (actaId: number, data: CreateDecisionResultadoDTO): Promise<DecisionResultado> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas/${actaId}/decisiones/`, data);
    return response.data;
  },

  update: async (
    actaId: number,
    decisionId: number,
    data: Partial<CreateDecisionResultadoDTO>
  ): Promise<DecisionResultado> => {
    const response = await axiosInstance.patch(
      `${BASE_URL}/actas/${actaId}/decisiones/${decisionId}/`,
      data
    );
    return response.data;
  },

  delete: async (actaId: number, decisionId: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/actas/${actaId}/decisiones/${decisionId}/`);
  },

  reorder: async (
    actaId: number,
    data: { decisiones: Array<{ id: number; order: number }> }
  ): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/actas/${actaId}/decisiones/reordenar/`, data);
  },
};

// ==================== PARTICIPANTES DE ACTA ====================

export const participantesActaApi = {
  add: async (actaId: number, data: CreateParticipanteActaDTO): Promise<ParticipanteActa> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas/${actaId}/participantes/`, data);
    return response.data;
  },

  update: async (
    actaId: number,
    participanteId: number,
    data: Partial<CreateParticipanteActaDTO>
  ): Promise<ParticipanteActa> => {
    const response = await axiosInstance.patch(
      `${BASE_URL}/actas/${actaId}/participantes/${participanteId}/`,
      data
    );
    return response.data;
  },

  delete: async (actaId: number, participanteId: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/actas/${actaId}/participantes/${participanteId}/`);
  },

  registrarAsistencia: async (
    actaId: number,
    participanteId: number,
    data: { asistencia: string; hora_llegada?: string; observaciones?: string }
  ): Promise<ParticipanteActa> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/actas/${actaId}/participantes/${participanteId}/registrar-asistencia/`,
      data
    );
    return response.data;
  },
};

// ==================== COMPROMISOS Y ACCIONES ====================

export const compromisosApi = {
  getAll: async (filters?: CompromisoFilters): Promise<PaginatedResponse<CompromisoAccion>> => {
    const response = await axiosInstance.get(`${BASE_URL}/compromisos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<CompromisoAccion> => {
    const response = await axiosInstance.get(`${BASE_URL}/compromisos/${id}/`);
    return response.data;
  },

  getVencidos: async (): Promise<CompromisoAccion[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/compromisos/vencidos/`);
    return response.data;
  },

  getCriticos: async (limit: number = 10): Promise<CompromisoAccion[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/compromisos/criticos/`, {
      params: { limit },
    });
    return response.data;
  },

  create: async (actaId: number, data: CreateCompromisoAccionDTO): Promise<CompromisoAccion> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas/${actaId}/compromisos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCompromisoDTO): Promise<CompromisoAccion> => {
    const response = await axiosInstance.patch(`${BASE_URL}/compromisos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/compromisos/${id}/`);
  },

  updateProgreso: async (id: number, data: { progreso: number }): Promise<CompromisoAccion> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/compromisos/${id}/actualizar-progreso/`,
      data
    );
    return response.data;
  },

  marcarCompletado: async (
    id: number,
    data: { evidencia_cumplimiento?: string; observaciones?: string }
  ): Promise<CompromisoAccion> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/compromisos/${id}/marcar-completado/`,
      data
    );
    return response.data;
  },

  verificar: async (
    id: number,
    data: { es_eficaz: boolean; observaciones?: string }
  ): Promise<CompromisoAccion> => {
    const response = await axiosInstance.post(`${BASE_URL}/compromisos/${id}/verificar/`, data);
    return response.data;
  },

  getChoices: async (): Promise<{
    estados: SelectOption[];
    prioridades: SelectOption[];
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/compromisos/choices/`);
    return response.data;
  },
};

// ==================== ESTADÍSTICAS Y DASHBOARD ====================

export const statsApi = {
  getStats: async (): Promise<RevisionDireccionStats> => {
    const response = await axiosInstance.get(`${BASE_URL}/stats/`);
    return response.data;
  },

  getDashboard: async (): Promise<DashboardRevision> => {
    const response = await axiosInstance.get(`${BASE_URL}/dashboard/`);
    return response.data;
  },
};
