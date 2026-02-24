/**
 * API Client para Gestión de Comités - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Tipos de Comité
 * - Comités Activos
 * - Miembros del Comité
 * - Reuniones y Asistencias
 * - Actas de Reunión
 * - Compromisos y Seguimiento
 * - Votaciones
 */
import { apiClient } from '@/lib/api-client';
import type {
  TipoComite,
  TipoComiteList,
  Comite,
  ComiteList,
  MiembroComite,
  MiembroComiteList,
  Reunion,
  ReunionList,
  AsistenciaReunion,
  ActaReunion,
  ActaReunionList,
  Compromiso,
  CompromisoList,
  SeguimientoCompromiso,
  Votacion,
  VotacionList,
  VotoMiembro,
  CreateTipoComiteDTO,
  UpdateTipoComiteDTO,
  CreateComiteDTO,
  UpdateComiteDTO,
  CreateMiembroComiteDTO,
  UpdateMiembroComiteDTO,
  CreateReunionDTO,
  UpdateReunionDTO,
  CreateActaReunionDTO,
  UpdateActaReunionDTO,
  CreateCompromisoDTO,
  UpdateCompromisoDTO,
  CreateSeguimientoCompromisoDTO,
  CreateVotacionDTO,
  UpdateVotacionDTO,
  CreateVotoMiembroDTO,
  RegistrarAsistenciaDTO,
  AprobarActaDTO,
  CerrarCompromisoDTO,
  CerrarVotacionDTO,
  ActualizarAvanceCompromisoDTO,
  RetirarMiembroDTO,
  PaginatedResponse,
  EstadisticasComite,
} from '../types/comites.types';

const BASE_URL = '/hseq/comites';

// ==================== TIPOS DE COMITÉ ====================

export const tipoComiteApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: boolean;
    requiere_eleccion?: boolean;
    empresa_id?: number;
  }): Promise<PaginatedResponse<TipoComiteList>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-comite/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoComite> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-comite/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoComiteDTO): Promise<TipoComite> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-comite/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoComiteDTO): Promise<TipoComite> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-comite/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-comite/${id}/`);
  },

  getActivos: async (params?: { empresa_id?: number }): Promise<TipoComiteList[]> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-comite/activos/`, { params });
    return response.data;
  },
};

// ==================== COMITÉS ====================

export const comiteApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_comite?: number;
    estado?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<ComiteList>> => {
    const response = await apiClient.get(`${BASE_URL}/comites/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Comite> => {
    const response = await apiClient.get(`${BASE_URL}/comites/${id}/`);
    return response.data;
  },

  create: async (data: CreateComiteDTO): Promise<Comite> => {
    const response = await apiClient.post(`${BASE_URL}/comites/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateComiteDTO): Promise<Comite> => {
    const response = await apiClient.patch(`${BASE_URL}/comites/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/comites/${id}/`);
  },

  getVigentes: async (params?: { empresa_id?: number }): Promise<ComiteList[]> => {
    const response = await apiClient.get(`${BASE_URL}/comites/vigentes/`, { params });
    return response.data;
  },

  activar: async (id: number): Promise<Comite> => {
    const response = await apiClient.post(`${BASE_URL}/comites/${id}/activar/`);
    return response.data;
  },

  getEstadisticas: async (id: number): Promise<EstadisticasComite> => {
    const response = await apiClient.get(`${BASE_URL}/comites/${id}/estadisticas/`);
    return response.data;
  },
};

// ==================== MIEMBROS DE COMITÉ ====================

export const miembroComiteApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    comite?: number;
    activo?: boolean;
    rol?: string;
    es_principal?: boolean;
    empresa_id?: number;
  }): Promise<PaginatedResponse<MiembroComiteList>> => {
    const response = await apiClient.get(`${BASE_URL}/miembros/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<MiembroComite> => {
    const response = await apiClient.get(`${BASE_URL}/miembros/${id}/`);
    return response.data;
  },

  create: async (data: CreateMiembroComiteDTO): Promise<MiembroComite> => {
    const response = await apiClient.post(`${BASE_URL}/miembros/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateMiembroComiteDTO): Promise<MiembroComite> => {
    const response = await apiClient.patch(`${BASE_URL}/miembros/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/miembros/${id}/`);
  },

  retirar: async (id: number, data: RetirarMiembroDTO): Promise<MiembroComite> => {
    const response = await apiClient.post(`${BASE_URL}/miembros/${id}/retirar/`, data);
    return response.data;
  },
};

// ==================== REUNIONES ====================

export const reunionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    comite?: number;
    estado?: string;
    tipo?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<ReunionList>> => {
    const response = await apiClient.get(`${BASE_URL}/reuniones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Reunion> => {
    const response = await apiClient.get(`${BASE_URL}/reuniones/${id}/`);
    return response.data;
  },

  create: async (data: CreateReunionDTO): Promise<Reunion> => {
    const response = await apiClient.post(`${BASE_URL}/reuniones/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateReunionDTO): Promise<Reunion> => {
    const response = await apiClient.patch(`${BASE_URL}/reuniones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/reuniones/${id}/`);
  },

  registrarAsistencia: async (
    id: number,
    data: RegistrarAsistenciaDTO
  ): Promise<{
    message: string;
    num_asistentes: number;
    cumple_quorum: boolean;
    asistencias: AsistenciaReunion[];
  }> => {
    const response = await apiClient.post(
      `${BASE_URL}/reuniones/${id}/registrar_asistencia/`,
      data
    );
    return response.data;
  },

  iniciar: async (id: number): Promise<Reunion> => {
    const response = await apiClient.post(`${BASE_URL}/reuniones/${id}/iniciar/`);
    return response.data;
  },

  finalizar: async (id: number): Promise<Reunion> => {
    const response = await apiClient.post(`${BASE_URL}/reuniones/${id}/finalizar/`);
    return response.data;
  },

  cancelar: async (id: number, motivo?: string): Promise<Reunion> => {
    const response = await apiClient.post(`${BASE_URL}/reuniones/${id}/cancelar/`, {
      motivo_cancelacion: motivo,
    });
    return response.data;
  },
};

// ==================== ACTAS DE REUNIÓN ====================

export const actaReunionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    reunion__comite?: number;
    estado?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<ActaReunionList>> => {
    const response = await apiClient.get(`${BASE_URL}/actas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ActaReunion> => {
    const response = await apiClient.get(`${BASE_URL}/actas/${id}/`);
    return response.data;
  },

  create: async (data: CreateActaReunionDTO): Promise<ActaReunion> => {
    const response = await apiClient.post(`${BASE_URL}/actas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateActaReunionDTO): Promise<ActaReunion> => {
    const response = await apiClient.patch(`${BASE_URL}/actas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/actas/${id}/`);
  },

  aprobar: async (
    id: number,
    data: AprobarActaDTO
  ): Promise<{ message: string; acta: ActaReunion }> => {
    const response = await apiClient.post(`${BASE_URL}/actas/${id}/aprobar_acta/`, data);
    return response.data;
  },

  rechazar: async (id: number, observaciones?: string): Promise<ActaReunion> => {
    const response = await apiClient.post(`${BASE_URL}/actas/${id}/rechazar/`, {
      observaciones_revision: observaciones,
    });
    return response.data;
  },

  enviarRevision: async (id: number): Promise<ActaReunion> => {
    const response = await apiClient.post(`${BASE_URL}/actas/${id}/enviar_revision/`);
    return response.data;
  },
};

// ==================== COMPROMISOS ====================

export const compromisoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    acta__reunion__comite?: number;
    estado?: string;
    responsable_id?: number;
    prioridad?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<CompromisoList>> => {
    const response = await apiClient.get(`${BASE_URL}/compromisos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Compromiso> => {
    const response = await apiClient.get(`${BASE_URL}/compromisos/${id}/`);
    return response.data;
  },

  create: async (data: CreateCompromisoDTO): Promise<Compromiso> => {
    const response = await apiClient.post(`${BASE_URL}/compromisos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCompromisoDTO): Promise<Compromiso> => {
    const response = await apiClient.patch(`${BASE_URL}/compromisos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/compromisos/${id}/`);
  },

  getVencidos: async (params?: { empresa_id?: number }): Promise<CompromisoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/compromisos/vencidos/`, { params });
    return response.data;
  },

  getProximosVencer: async (params?: { empresa_id?: number }): Promise<CompromisoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/compromisos/proximos_vencer/`, { params });
    return response.data;
  },

  cerrar: async (
    id: number,
    data: CerrarCompromisoDTO
  ): Promise<{ message: string; compromiso: Compromiso }> => {
    const response = await apiClient.post(`${BASE_URL}/compromisos/${id}/cerrar_compromiso/`, data);
    return response.data;
  },

  actualizarAvance: async (
    id: number,
    data: ActualizarAvanceCompromisoDTO
  ): Promise<Compromiso> => {
    const response = await apiClient.post(`${BASE_URL}/compromisos/${id}/actualizar_avance/`, data);
    return response.data;
  },
};

// ==================== SEGUIMIENTO DE COMPROMISOS ====================

export const seguimientoCompromisoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    compromiso?: number;
    requiere_apoyo?: boolean;
    empresa_id?: number;
  }): Promise<PaginatedResponse<SeguimientoCompromiso>> => {
    const response = await apiClient.get(`${BASE_URL}/seguimientos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<SeguimientoCompromiso> => {
    const response = await apiClient.get(`${BASE_URL}/seguimientos/${id}/`);
    return response.data;
  },

  create: async (data: CreateSeguimientoCompromisoDTO): Promise<SeguimientoCompromiso> => {
    const response = await apiClient.post(`${BASE_URL}/seguimientos/`, data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<CreateSeguimientoCompromisoDTO>
  ): Promise<SeguimientoCompromiso> => {
    const response = await apiClient.patch(`${BASE_URL}/seguimientos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/seguimientos/${id}/`);
  },
};

// ==================== VOTACIONES ====================

export const votacionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    comite?: number;
    reunion?: number;
    estado?: string;
    tipo?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<VotacionList>> => {
    const response = await apiClient.get(`${BASE_URL}/votaciones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Votacion> => {
    const response = await apiClient.get(`${BASE_URL}/votaciones/${id}/`);
    return response.data;
  },

  create: async (data: CreateVotacionDTO): Promise<Votacion> => {
    const response = await apiClient.post(`${BASE_URL}/votaciones/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateVotacionDTO): Promise<Votacion> => {
    const response = await apiClient.patch(`${BASE_URL}/votaciones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/votaciones/${id}/`);
  },

  iniciar: async (id: number): Promise<Votacion> => {
    const response = await apiClient.post(`${BASE_URL}/votaciones/${id}/iniciar/`);
    return response.data;
  },

  cerrar: async (
    id: number,
    data: CerrarVotacionDTO
  ): Promise<{
    message: string;
    votacion: Votacion;
    resultados: Record<string, any>;
  }> => {
    const response = await apiClient.post(`${BASE_URL}/votaciones/${id}/cerrar/`, data);
    return response.data;
  },

  getResultados: async (
    id: number
  ): Promise<{
    votacion: Votacion;
    resultados: Record<string, any>;
    opcion_ganadora: string;
    total_votos: number;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/votaciones/${id}/resultados/`);
    return response.data;
  },
};

// ==================== VOTOS DE MIEMBROS ====================

export const votoMiembroApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    votacion?: number;
    miembro?: number;
    es_abstencion?: boolean;
    empresa_id?: number;
  }): Promise<PaginatedResponse<VotoMiembro>> => {
    const response = await apiClient.get(`${BASE_URL}/votos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<VotoMiembro> => {
    const response = await apiClient.get(`${BASE_URL}/votos/${id}/`);
    return response.data;
  },

  create: async (data: CreateVotoMiembroDTO): Promise<VotoMiembro> => {
    const response = await apiClient.post(`${BASE_URL}/votos/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateVotoMiembroDTO>): Promise<VotoMiembro> => {
    const response = await apiClient.patch(`${BASE_URL}/votos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/votos/${id}/`);
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  tipoComite: tipoComiteApi,
  comite: comiteApi,
  miembroComite: miembroComiteApi,
  reunion: reunionApi,
  actaReunion: actaReunionApi,
  compromiso: compromisoApi,
  seguimientoCompromiso: seguimientoCompromisoApi,
  votacion: votacionApi,
  votoMiembro: votoMiembroApi,
};
