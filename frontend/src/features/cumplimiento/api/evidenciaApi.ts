/**
 * API client para Evidencias Centralizadas.
 */
import apiClient from '@/api/axios-config';
import type {
  Evidencia,
  EvidenciaDetalle,
  CrearEvidenciaPayload,
  ActualizarEvidenciaPayload,
  RechazarEvidenciaPayload,
  ResumenEvidencias,
  EvidenciaFilters,
} from '../types/evidencia.types';

const BASE_URL = '/cumplimiento/evidencias';

export const evidenciaApi = {
  /** Lista evidencias con filtros */
  listar: async (filters?: EvidenciaFilters): Promise<Evidencia[]> => {
    const params: Record<string, string> = {};
    if (filters?.estado) params.estado = filters.estado;
    if (filters?.categoria) params.categoria = filters.categoria;
    if (filters?.norma) params.norma = filters.norma;
    if (filters?.tag) params.tag = filters.tag;
    if (filters?.search) params.search = filters.search;
    if (filters?.ordering) params.ordering = filters.ordering;
    const { data } = await apiClient.get(`${BASE_URL}/`, { params });
    return data;
  },

  /** Detalle de una evidencia (incluye historial) */
  detalle: async (id: number): Promise<EvidenciaDetalle> => {
    const { data } = await apiClient.get(`${BASE_URL}/${id}/`);
    return data;
  },

  /** Crear evidencia (multipart/form-data) */
  crear: async (payload: CrearEvidenciaPayload): Promise<EvidenciaDetalle> => {
    const formData = new FormData();
    formData.append('archivo', payload.archivo);
    formData.append('titulo', payload.titulo);
    formData.append('entity_type', payload.entity_type);
    formData.append('entity_id', String(payload.entity_id));
    if (payload.descripcion) formData.append('descripcion', payload.descripcion);
    if (payload.categoria) formData.append('categoria', payload.categoria);
    if (payload.normas_relacionadas) {
      formData.append('normas_relacionadas', JSON.stringify(payload.normas_relacionadas));
    }
    if (payload.tags) {
      formData.append('tags', JSON.stringify(payload.tags));
    }
    if (payload.fecha_vigencia) formData.append('fecha_vigencia', payload.fecha_vigencia);

    const { data } = await apiClient.post(`${BASE_URL}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Actualizar metadata de evidencia */
  actualizar: async (id: number, payload: ActualizarEvidenciaPayload): Promise<Evidencia> => {
    const { data } = await apiClient.patch(`${BASE_URL}/${id}/`, payload);
    return data;
  },

  /** Eliminar evidencia */
  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}/`);
  },

  /** Aprobar evidencia */
  aprobar: async (id: number): Promise<Evidencia> => {
    const { data } = await apiClient.post(`${BASE_URL}/${id}/aprobar/`);
    return data;
  },

  /** Rechazar evidencia con motivo */
  rechazar: async (id: number, payload: RechazarEvidenciaPayload): Promise<Evidencia> => {
    const { data } = await apiClient.post(`${BASE_URL}/${id}/rechazar/`, payload);
    return data;
  },

  /** Archivar evidencia */
  archivar: async (id: number): Promise<Evidencia> => {
    const { data } = await apiClient.post(`${BASE_URL}/${id}/archivar/`);
    return data;
  },

  /** Listar evidencias de una entidad específica */
  porEntidad: async (entityType: string, entityId: number): Promise<Evidencia[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/por-entidad/`, {
      params: { entity_type: entityType, entity_id: entityId },
    });
    return data;
  },

  /** Resumen/dashboard de evidencias */
  resumen: async (norma?: string): Promise<ResumenEvidencias> => {
    const params = norma ? { norma } : {};
    const { data } = await apiClient.get(`${BASE_URL}/resumen/`, { params });
    return data;
  },

  /** Listar evidencias pendientes */
  pendientes: async (): Promise<Evidencia[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/pendientes/`);
    return data;
  },

  /** Listar evidencias vencidas */
  vencidas: async (): Promise<Evidencia[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/vencidas/`);
    return data;
  },

  /** Historial de una evidencia */
  historial: async (id: number) => {
    const { data } = await apiClient.get(`${BASE_URL}/${id}/historial/`);
    return data;
  },
};
