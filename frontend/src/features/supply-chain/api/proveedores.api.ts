/**
 * API Client para Proveedores - Gestión de Proveedores
 * Backend: /api/supply-chain/proveedores/
 */
import { apiClient } from '@/lib/api-client';
import type {
  Proveedor,
  ProveedorList,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  UnidadNegocio,
  CreateUnidadNegocioDTO,
  UpdateUnidadNegocioDTO,
  PrecioMateriaPrima,
  HistorialPrecioProveedor,
  CambiarPrecioDTO,
  CondicionComercialProveedor,
  CreateCondicionComercialDTO,
  UpdateCondicionComercialDTO,
  EstadisticasProveedores,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/supply-chain';

// ==================== UNIDADES DE NEGOCIO ====================

export const unidadNegocioApi = {
  /**
   * Listar unidades de negocio
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    es_planta_produccion?: boolean;
    es_centro_distribucion?: boolean;
  }): Promise<PaginatedResponse<UnidadNegocio>> => {
    const response = await apiClient.get<PaginatedResponse<UnidadNegocio>>(
      `${BASE_URL}/unidades-negocio/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener unidad de negocio por ID
   */
  getById: async (id: number): Promise<UnidadNegocio> => {
    const response = await apiClient.get<UnidadNegocio>(`${BASE_URL}/unidades-negocio/${id}/`);
    return response.data;
  },

  /**
   * Crear unidad de negocio
   */
  create: async (data: CreateUnidadNegocioDTO): Promise<UnidadNegocio> => {
    const response = await apiClient.post<UnidadNegocio>(`${BASE_URL}/unidades-negocio/`, data);
    return response.data;
  },

  /**
   * Actualizar unidad de negocio
   */
  update: async (id: number, data: UpdateUnidadNegocioDTO): Promise<UnidadNegocio> => {
    const response = await apiClient.patch<UnidadNegocio>(
      `${BASE_URL}/unidades-negocio/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar unidad de negocio
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/unidades-negocio/${id}/`);
  },

  /**
   * Obtener unidades activas
   */
  getActivas: async (): Promise<UnidadNegocio[]> => {
    const response = await apiClient.get<PaginatedResponse<UnidadNegocio>>(
      `${BASE_URL}/unidades-negocio/`,
      { params: { is_active: true, page_size: 1000 } }
    );
    return response.data.results;
  },
};

// ==================== PROVEEDORES ====================

export const proveedorApi = {
  /**
   * Listar proveedores con filtros
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_proveedor?: number;
    tipos_materia_prima?: number[];
    modalidad_logistica?: number;
    departamento?: number;
    is_active?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<ProveedorList>> => {
    const response = await apiClient.get<PaginatedResponse<ProveedorList>>(
      `${BASE_URL}/proveedores/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener proveedor por ID (con todos los detalles)
   */
  getById: async (id: number): Promise<Proveedor> => {
    const response = await apiClient.get<Proveedor>(`${BASE_URL}/proveedores/${id}/`);
    return response.data;
  },

  /**
   * Crear proveedor
   */
  create: async (data: CreateProveedorDTO): Promise<Proveedor> => {
    const response = await apiClient.post<Proveedor>(`${BASE_URL}/proveedores/`, data);
    return response.data;
  },

  /**
   * Actualizar proveedor
   */
  update: async (id: number, data: UpdateProveedorDTO): Promise<Proveedor> => {
    const response = await apiClient.patch<Proveedor>(`${BASE_URL}/proveedores/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar proveedor (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/proveedores/${id}/`);
  },

  /**
   * Cambiar precio de materia prima (custom action)
   */
  cambiarPrecio: async (id: number, data: CambiarPrecioDTO): Promise<Proveedor> => {
    const response = await apiClient.post<Proveedor>(
      `${BASE_URL}/proveedores/${id}/cambiar_precio/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener historial de precios de un proveedor
   */
  getHistorialPrecios: async (
    id: number,
    params?: { tipo_materia_prima?: number; limit?: number }
  ): Promise<HistorialPrecioProveedor[]> => {
    const response = await apiClient.get<HistorialPrecioProveedor[]>(
      `${BASE_URL}/proveedores/${id}/historial_precios/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener precios actuales del proveedor
   */
  getPreciosActuales: async (id: number): Promise<PrecioMateriaPrima[]> => {
    const response = await apiClient.get<PrecioMateriaPrima[]>(
      `${BASE_URL}/proveedores/${id}/precios_actuales/`
    );
    return response.data;
  },

  /**
   * Cambiar estado del proveedor
   */
  cambiarEstado: async (
    id: number,
    estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO',
    motivo?: string
  ): Promise<Proveedor> => {
    const response = await apiClient.post<Proveedor>(
      `${BASE_URL}/proveedores/${id}/cambiar_estado/`,
      { estado, motivo }
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de proveedores
   */
  getEstadisticas: async (): Promise<EstadisticasProveedores> => {
    const response = await apiClient.get<EstadisticasProveedores>(
      `${BASE_URL}/proveedores/estadisticas/`
    );
    return response.data;
  },

  /**
   * Exportar proveedores a Excel
   */
  exportExcel: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/proveedores/export_excel/`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Crear acceso al sistema para un proveedor
   */
  crearAcceso: async (
    id: number,
    data: { email: string; username: string; cargo_id?: number }
  ): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      `${BASE_URL}/proveedores/${id}/crear-acceso/`,
      data
    );
    return response.data;
  },
};

// ==================== HISTORIAL DE PRECIOS ====================

export const historialPrecioApi = {
  /**
   * Listar historial de precios (solo lectura)
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    proveedor?: number;
    tipo_materia_prima?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<HistorialPrecioProveedor>> => {
    const response = await apiClient.get<PaginatedResponse<HistorialPrecioProveedor>>(
      `${BASE_URL}/historial-precios/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener detalle de historial de precio
   */
  getById: async (id: number): Promise<HistorialPrecioProveedor> => {
    const response = await apiClient.get<HistorialPrecioProveedor>(
      `${BASE_URL}/historial-precios/${id}/`
    );
    return response.data;
  },
};

// ==================== CONDICIONES COMERCIALES ====================

export const condicionComercialApi = {
  /**
   * Listar condiciones comerciales
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    proveedor?: number;
    forma_pago?: number;
    is_active?: boolean;
    vigente?: boolean;
  }): Promise<PaginatedResponse<CondicionComercialProveedor>> => {
    const response = await apiClient.get<PaginatedResponse<CondicionComercialProveedor>>(
      `${BASE_URL}/condiciones-comerciales/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener condición comercial por ID
   */
  getById: async (id: number): Promise<CondicionComercialProveedor> => {
    const response = await apiClient.get<CondicionComercialProveedor>(
      `${BASE_URL}/condiciones-comerciales/${id}/`
    );
    return response.data;
  },

  /**
   * Crear condición comercial
   */
  create: async (data: CreateCondicionComercialDTO): Promise<CondicionComercialProveedor> => {
    const response = await apiClient.post<CondicionComercialProveedor>(
      `${BASE_URL}/condiciones-comerciales/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar condición comercial
   */
  update: async (
    id: number,
    data: UpdateCondicionComercialDTO
  ): Promise<CondicionComercialProveedor> => {
    const response = await apiClient.patch<CondicionComercialProveedor>(
      `${BASE_URL}/condiciones-comerciales/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar condición comercial
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/condiciones-comerciales/${id}/`);
  },

  /**
   * Obtener condiciones vigentes de un proveedor
   */
  porProveedor: async (proveedorId: number): Promise<CondicionComercialProveedor[]> => {
    const response = await apiClient.get<PaginatedResponse<CondicionComercialProveedor>>(
      `${BASE_URL}/condiciones-comerciales/`,
      { params: { proveedor: proveedorId, vigente: true, page_size: 1000 } }
    );
    return response.data.results;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  unidadNegocio: unidadNegocioApi,
  proveedor: proveedorApi,
  historialPrecio: historialPrecioApi,
  condicionComercial: condicionComercialApi,
};
