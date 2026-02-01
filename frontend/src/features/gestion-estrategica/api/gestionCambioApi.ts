/**
 * API Client para Gestión del Cambio
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  GestionCambio,
  CreateGestionCambioDTO,
  UpdateGestionCambioDTO,
  TransitionStatusDTO,
  GestionCambioFilters,
  PaginatedResponse,
  GestionCambioStats,
} from '../types/gestion-cambio.types';
import type { SelectOption } from '../types/strategic.types';

const PLANEACION_URL = '/planeacion';

export const gestionCambioApi = {
  /**
   * Obtener todos los cambios con filtros
   */
  getAll: async (
    filters?: GestionCambioFilters
  ): Promise<PaginatedResponse<GestionCambio>> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/gestion-cambio/`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener un cambio por ID
   */
  getById: async (id: number): Promise<GestionCambio> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/gestion-cambio/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo cambio
   */
  create: async (data: CreateGestionCambioDTO): Promise<GestionCambio> => {
    const response = await axiosInstance.post(`${PLANEACION_URL}/gestion-cambio/`, data);
    return response.data;
  },

  /**
   * Actualizar un cambio existente
   */
  update: async (id: number, data: UpdateGestionCambioDTO): Promise<GestionCambio> => {
    const response = await axiosInstance.patch(`${PLANEACION_URL}/gestion-cambio/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un cambio (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${PLANEACION_URL}/gestion-cambio/${id}/`);
  },

  /**
   * Transicionar el estado de un cambio
   */
  transitionStatus: async (
    id: number,
    data: TransitionStatusDTO
  ): Promise<{ cambio: GestionCambio; message: string }> => {
    const response = await axiosInstance.post(
      `${PLANEACION_URL}/gestion-cambio/${id}/transition_status/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de gestión del cambio
   */
  getStats: async (): Promise<GestionCambioStats> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/gestion-cambio/stats/`);
    return response.data;
  },

  /**
   * Obtener opciones de tipos de cambio para selects
   */
  getChangeTypes: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(
      `${PLANEACION_URL}/gestion-cambio/change-types/`
    );
    return response.data;
  },

  /**
   * Obtener opciones de prioridades para selects
   */
  getPriorities: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/gestion-cambio/priorities/`);
    return response.data;
  },

  /**
   * Obtener opciones de estados para selects
   */
  getStatuses: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/gestion-cambio/statuses/`);
    return response.data;
  },
};
