/**
 * API Client para Mapa Estratégico
 *
 * Endpoints (relativo a API_URL que ya incluye /api):
 * - /planeacion/mapas/ - CRUD Mapas Estratégicos
 * - /planeacion/causa-efecto/ - CRUD Relaciones Causa-Efecto
 * - /planeacion/mapas/{id}/visualizacion/ - Datos para el canvas
 * - /planeacion/mapas/{id}/update-canvas/ - Guardar posiciones de nodos
 */

import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type {
  MapaEstrategico,
  MapaVisualizacionResponse,
  CausaEfecto,
  CreateMapaEstrategicoDTO,
  UpdateMapaEstrategicoDTO,
  CreateCausaEfectoDTO,
  UpdateCausaEfectoDTO,
  CanvasData,
} from '../types/mapa-estrategico.types';

// BASE_URL sin prefijo /api porque apiClient.baseURL ya lo incluye
const BASE_URL = '/planeacion';

// ==============================================================================
// MAPAS ESTRATÉGICOS
// ==============================================================================

export const mapasApi = {
  /**
   * Listar mapas estratégicos
   */
  list: async (
    planId?: number,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<MapaEstrategico>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (planId) {
      params.append('plan', planId.toString());
    }

    const response = await apiClient.get<PaginatedResponse<MapaEstrategico>>(
      `${BASE_URL}/mapas/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener detalle de un mapa
   */
  get: async (id: number): Promise<MapaEstrategico> => {
    const response = await apiClient.get<MapaEstrategico>(
      `${BASE_URL}/mapas/${id}/`
    );
    return response.data;
  },

  /**
   * Obtener mapa activo de un plan
   */
  getByPlan: async (planId: number): Promise<MapaEstrategico | null> => {
    const response = await apiClient.get<PaginatedResponse<MapaEstrategico>>(
      `${BASE_URL}/mapas/?plan=${planId}&is_active=true`
    );
    return response.data.results[0] || null;
  },

  /**
   * Obtener datos de visualización del mapa
   * Incluye objetivos y relaciones para renderizar el canvas
   */
  getVisualizacion: async (planId: number): Promise<MapaVisualizacionResponse> => {
    const response = await apiClient.get<MapaVisualizacionResponse>(
      `${BASE_URL}/mapas/visualizacion/?plan=${planId}`
    );
    return response.data;
  },

  /**
   * Crear mapa estratégico
   */
  create: async (data: CreateMapaEstrategicoDTO): Promise<MapaEstrategico> => {
    const response = await apiClient.post<MapaEstrategico>(
      `${BASE_URL}/mapas/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar mapa estratégico
   */
  update: async (
    id: number,
    data: UpdateMapaEstrategicoDTO
  ): Promise<MapaEstrategico> => {
    const response = await apiClient.patch<MapaEstrategico>(
      `${BASE_URL}/mapas/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar solo las posiciones del canvas (nodos)
   */
  updateCanvas: async (
    id: number,
    canvasData: CanvasData
  ): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      `${BASE_URL}/mapas/${id}/update-canvas/`,
      { canvas_data: canvasData }
    );
    return response.data;
  },

  /**
   * Eliminar mapa estratégico
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mapas/${id}/`);
  },

  /**
   * Crear o actualizar mapa para un plan (upsert)
   * Si no existe, crea uno nuevo. Si existe, retorna el existente.
   */
  getOrCreate: async (planId: number, planName: string): Promise<MapaEstrategico> => {
    // Intentar obtener el mapa existente
    const existing = await mapasApi.getByPlan(planId);
    if (existing) {
      return existing;
    }

    // Crear uno nuevo
    return mapasApi.create({
      plan: planId,
      name: `Mapa Estratégico - ${planName}`,
      description: 'Mapa estratégico generado automáticamente',
    });
  },
};

// ==============================================================================
// RELACIONES CAUSA-EFECTO
// ==============================================================================

export const causaEfectoApi = {
  /**
   * Listar relaciones de un mapa
   */
  list: async (
    mapaId: number,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResponse<CausaEfecto>> => {
    const params = new URLSearchParams();
    params.append('mapa', mapaId.toString());
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const response = await apiClient.get<PaginatedResponse<CausaEfecto>>(
      `${BASE_URL}/causa-efecto/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener detalle de una relación
   */
  get: async (id: number): Promise<CausaEfecto> => {
    const response = await apiClient.get<CausaEfecto>(
      `${BASE_URL}/causa-efecto/${id}/`
    );
    return response.data;
  },

  /**
   * Crear relación causa-efecto
   */
  create: async (data: CreateCausaEfectoDTO): Promise<CausaEfecto> => {
    const response = await apiClient.post<CausaEfecto>(
      `${BASE_URL}/causa-efecto/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar relación causa-efecto
   */
  update: async (
    id: number,
    data: UpdateCausaEfectoDTO
  ): Promise<CausaEfecto> => {
    const response = await apiClient.patch<CausaEfecto>(
      `${BASE_URL}/causa-efecto/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar relación causa-efecto
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/causa-efecto/${id}/`);
  },

  /**
   * Crear múltiples relaciones a la vez (batch)
   */
  createBatch: async (
    relations: CreateCausaEfectoDTO[]
  ): Promise<CausaEfecto[]> => {
    const results: CausaEfecto[] = [];
    for (const relation of relations) {
      const created = await causaEfectoApi.create(relation);
      results.push(created);
    }
    return results;
  },

  /**
   * Eliminar múltiples relaciones a la vez (batch)
   */
  deleteBatch: async (ids: number[]): Promise<void> => {
    for (const id of ids) {
      await causaEfectoApi.delete(id);
    }
  },
};

// Export default con todos los métodos
export default {
  mapas: mapasApi,
  causaEfecto: causaEfectoApi,
};
