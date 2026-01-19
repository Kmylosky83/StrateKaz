/**
 * API Client para Centro de Notificaciones
 *
 * MN-001: Conectar notificaciones con backend
 */
import axiosInstance from '@/api/axios-config';
import type {
  Notificacion,
  TipoNotificacion,
  PreferenciaNotificacion,
  NotificacionMasiva,
  NotificacionFilters,
} from '../types/notificaciones.types';

const BASE_URL = '/audit/notificaciones';

export const notificacionesAPI = {
  // ==================== NOTIFICACIONES ====================

  /**
   * Obtener lista de notificaciones con filtros
   */
  getNotificaciones: async (filters?: NotificacionFilters): Promise<Notificacion[]> => {
    const params = new URLSearchParams();

    if (filters?.usuario) params.append('usuario', filters.usuario.toString());
    if (filters?.esta_leida !== undefined) params.append('esta_leida', String(filters.esta_leida));
    if (filters?.prioridad) params.append('prioridad', filters.prioridad);

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}/?${queryString}` : `${BASE_URL}/`;

    const response = await axiosInstance.get<Notificacion[]>(url);
    return response.data;
  },

  /**
   * Obtener notificaciones no leídas del usuario actual
   */
  getNoLeidas: async (usuarioId?: number): Promise<Notificacion[]> => {
    const params = usuarioId ? `?usuario_id=${usuarioId}` : '';
    const response = await axiosInstance.get<Notificacion[]>(`${BASE_URL}/no_leidas/${params}`);
    return response.data;
  },

  /**
   * Obtener detalle de una notificación
   */
  getNotificacion: async (id: number): Promise<Notificacion> => {
    const response = await axiosInstance.get<Notificacion>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  /**
   * Marcar notificación como leída
   */
  marcarLeida: async (id: number): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/marcar_leida/`);
  },

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasLeidas: async (usuarioId: number): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/marcar_todas_leidas/`, {
      usuario_id: usuarioId,
    });
  },

  /**
   * Archivar notificación
   */
  archivarNotificacion: async (id: number): Promise<Notificacion> => {
    const response = await axiosInstance.patch<Notificacion>(`${BASE_URL}/${id}/`, {
      archivada: true,
    });
    return response.data;
  },

  // ==================== TIPOS DE NOTIFICACIÓN ====================

  /**
   * Obtener tipos de notificación
   */
  getTipos: async (filters?: {
    categoria?: string;
    is_active?: boolean;
  }): Promise<TipoNotificacion[]> => {
    const params = new URLSearchParams();
    if (filters?.categoria) params.append('categoria', filters.categoria);
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}/tipos/?${queryString}` : `${BASE_URL}/tipos/`;

    const response = await axiosInstance.get<TipoNotificacion[]>(url);
    return response.data;
  },

  /**
   * Crear tipo de notificación
   */
  createTipo: async (data: Partial<TipoNotificacion>): Promise<TipoNotificacion> => {
    const response = await axiosInstance.post<TipoNotificacion>(`${BASE_URL}/tipos/`, data);
    return response.data;
  },

  /**
   * Actualizar tipo de notificación
   */
  updateTipo: async (id: number, data: Partial<TipoNotificacion>): Promise<TipoNotificacion> => {
    const response = await axiosInstance.patch<TipoNotificacion>(`${BASE_URL}/tipos/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar tipo de notificación
   */
  deleteTipo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/tipos/${id}/`);
  },

  // ==================== PREFERENCIAS ====================

  /**
   * Obtener preferencias del usuario
   */
  getPreferencias: async (usuarioId?: number): Promise<PreferenciaNotificacion[]> => {
    const params = usuarioId ? `?usuario=${usuarioId}` : '';
    const response = await axiosInstance.get<PreferenciaNotificacion[]>(
      `${BASE_URL}/preferencias/${params}`
    );
    return response.data;
  },

  /**
   * Actualizar preferencia
   */
  updatePreferencia: async (
    id: number,
    data: Partial<PreferenciaNotificacion>
  ): Promise<PreferenciaNotificacion> => {
    const response = await axiosInstance.patch<PreferenciaNotificacion>(
      `${BASE_URL}/preferencias/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Crear preferencia
   */
  createPreferencia: async (
    data: Partial<PreferenciaNotificacion>
  ): Promise<PreferenciaNotificacion> => {
    const response = await axiosInstance.post<PreferenciaNotificacion>(
      `${BASE_URL}/preferencias/`,
      data
    );
    return response.data;
  },

  // ==================== NOTIFICACIONES MASIVAS ====================

  /**
   * Obtener envíos masivos
   */
  getMasivas: async (): Promise<NotificacionMasiva[]> => {
    const response = await axiosInstance.get<NotificacionMasiva[]>(`${BASE_URL}/masivas/`);
    return response.data;
  },

  /**
   * Crear envío masivo
   */
  createMasiva: async (data: Partial<NotificacionMasiva>): Promise<NotificacionMasiva> => {
    const response = await axiosInstance.post<NotificacionMasiva>(`${BASE_URL}/masivas/`, data);
    return response.data;
  },
};
