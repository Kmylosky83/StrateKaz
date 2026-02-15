/**
 * API Client Factory - Genera objetos API CRUD tipados
 *
 * Elimina boilerplate repetitivo en 16+ archivos API.
 * Cada entidad pasa de ~50 lineas a ~3 lineas para CRUD basico.
 * Metodos custom se agregan con spread operator.
 *
 * @example
 * // CRUD basico (3 lineas):
 * export const tipoDocumentoApi = createApiClient<TipoDocumento, CreateTipoDTO>(
 *   '/gestion-estrategica/gestion-documental', 'tipos-documento'
 * );
 *
 * // Con metodos custom:
 * export const documentoApi = {
 *   ...createApiClient<Documento, CreateDocumentoDTO>(BASE_URL, 'documentos'),
 *   aprobar: (id: number) => apiClient.post(`${BASE_URL}/documentos/${id}/aprobar/`).then(r => r.data),
 * };
 */
import { apiClient } from './api-client';
import type { PaginatedResponse } from '@/types';

export interface ApiClient<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  getAll: (params?: Record<string, unknown>) => Promise<PaginatedResponse<T>>;
  getById: (id: number) => Promise<T>;
  create: (data: CreateDTO) => Promise<T>;
  update: (id: number, data: UpdateDTO) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

/**
 * Crea un objeto API CRUD tipado para un endpoint DRF
 *
 * @param baseUrl - URL base del modulo (ej: '/gestion-estrategica/gestion-documental')
 * @param endpoint - Nombre del recurso (ej: 'tipos-documento')
 * @returns Objeto con metodos getAll, getById, create, update, delete
 */
export function createApiClient<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>(
  baseUrl: string,
  endpoint: string
): ApiClient<T, CreateDTO, UpdateDTO> {
  const url = `${baseUrl}/${endpoint}`;

  return {
    getAll: async (params?: Record<string, unknown>) => {
      const response = await apiClient.get<PaginatedResponse<T>>(`${url}/`, { params });
      return response.data;
    },

    getById: async (id: number) => {
      const response = await apiClient.get<T>(`${url}/${id}/`);
      return response.data;
    },

    create: async (data: CreateDTO) => {
      const response = await apiClient.post<T>(`${url}/`, data);
      return response.data;
    },

    update: async (id: number, data: UpdateDTO) => {
      const response = await apiClient.patch<T>(`${url}/${id}/`, data);
      return response.data;
    },

    delete: async (id: number) => {
      await apiClient.delete(`${url}/${id}/`);
    },
  };
}
