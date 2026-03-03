/**
 * API Client para Proveedores - Gestión de Proveedores
 * Backend: /api/supply-chain/proveedores/
 *
 * URLS alineadas con ViewSet url_path (kebab-case)
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

/** Respuesta del endpoint historial-precio */
interface HistorialPrecioResponse {
  proveedor: string;
  proveedor_id: number;
  precios_actuales: PrecioMateriaPrima[];
  historial: HistorialPrecioProveedor[];
}

export const proveedorApi = {
  /**
   * Listar proveedores con filtros
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_proveedor?: number;
    tipo_materia_prima?: number;
    categoria_materia_prima?: number;
    modalidad_logistica?: number;
    departamento?: number;
    forma_pago?: number;
    unidad_negocio?: number;
    is_active?: boolean;
    es_materia_prima?: boolean;
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
   * Actualizar proveedor (PATCH)
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
   * Restaurar proveedor eliminado
   */
  restore: async (id: number): Promise<Proveedor> => {
    const response = await apiClient.post<Proveedor>(`${BASE_URL}/proveedores/${id}/restore/`);
    return response.data;
  },

  /**
   * Cambiar precio de materia prima (solo Gerente/SuperAdmin)
   * Backend url_path: 'cambiar-precio'
   */
  cambiarPrecio: async (
    id: number,
    data: CambiarPrecioDTO
  ): Promise<{
    detail: string;
    tipo_materia: string;
    tipo_materia_id: number;
    precio_nuevo: string;
    modificado_por: string;
    fecha_modificacion: string;
  }> => {
    const response = await apiClient.post(`${BASE_URL}/proveedores/${id}/cambiar-precio/`, data);
    return response.data;
  },

  /**
   * Obtener historial de precios y precios actuales
   * Backend url_path: 'historial-precio'
   * Retorna precios_actuales + historial completo
   */
  getHistorialPrecio: async (id: number): Promise<HistorialPrecioResponse> => {
    const response = await apiClient.get<HistorialPrecioResponse>(
      `${BASE_URL}/proveedores/${id}/historial-precio/`
    );
    return response.data;
  },

  /**
   * Obtener condiciones comerciales de un proveedor
   * Backend url_path: 'condiciones-comerciales'
   */
  getCondicionesComerciales: async (
    id: number
  ): Promise<{
    proveedor: string;
    proveedor_id: number;
    condiciones: CondicionComercialProveedor[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/proveedores/${id}/condiciones-comerciales/`);
    return response.data;
  },

  /**
   * Crear condición comercial para un proveedor
   * Backend url_path: 'condiciones-comerciales' (POST)
   */
  createCondicionComercial: async (
    id: number,
    data: CreateCondicionComercialDTO
  ): Promise<CondicionComercialProveedor> => {
    const response = await apiClient.post<CondicionComercialProveedor>(
      `${BASE_URL}/proveedores/${id}/condiciones-comerciales/`,
      data
    );
    return response.data;
  },

  /**
   * Activar/Desactivar proveedor (via PATCH is_active)
   * El modelo NO tiene campo 'estado', solo is_active boolean
   */
  toggleActivo: async (id: number, is_active: boolean): Promise<Proveedor> => {
    const response = await apiClient.patch<Proveedor>(`${BASE_URL}/proveedores/${id}/`, {
      is_active,
    });
    return response.data;
  },

  /**
   * Obtener estadísticas de proveedores
   * Backend url_path: 'estadisticas'
   */
  getEstadisticas: async (): Promise<EstadisticasProveedores> => {
    const response = await apiClient.get<EstadisticasProveedores>(
      `${BASE_URL}/proveedores/estadisticas/`
    );
    return response.data;
  },

  /**
   * Descargar plantilla de importación Excel
   * Backend url_path: 'plantilla-importacion'
   */
  getPlantillaImportacion: async (): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/proveedores/plantilla-importacion/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Importar proveedores desde archivo Excel
   * Backend url_path: 'importar'
   */
  importar: async (
    file: File
  ): Promise<{
    detail: string;
    importados: number;
    errores: Array<{ fila: number; error: string }>;
  }> => {
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await apiClient.post(`${BASE_URL}/proveedores/importar/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Crear acceso al sistema para un proveedor
   * Backend url_path: 'crear-acceso'
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

  /**
   * Portal: Obtener mi empresa (proveedor vinculado al usuario)
   * Backend url_path: 'mi-empresa'
   */
  getMiEmpresa: async (): Promise<Proveedor> => {
    const response = await apiClient.get<Proveedor>(`${BASE_URL}/proveedores/mi-empresa/`);
    return response.data;
  },

  /**
   * Portal: Obtener contratos/condiciones de mi empresa
   * Backend url_path: 'mi-empresa/contratos'
   */
  getMiEmpresaContratos: async (): Promise<CondicionComercialProveedor[]> => {
    const response = await apiClient.get(`${BASE_URL}/proveedores/mi-empresa/contratos/`);
    return response.data;
  },

  /**
   * Portal: Obtener evaluaciones de mi empresa
   * Backend url_path: 'mi-empresa/evaluaciones'
   */
  getMiEmpresaEvaluaciones: async (): Promise<unknown[]> => {
    const response = await apiClient.get(`${BASE_URL}/proveedores/mi-empresa/evaluaciones/`);
    return response.data;
  },
};

// ==================== HISTORIAL DE PRECIOS (ViewSet independiente) ====================

export const historialPrecioApi = {
  /**
   * Listar historial de precios (solo lectura, ViewSet separado)
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    proveedor?: number;
    tipo_materia?: number;
    tipo_materia_codigo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    modificado_por?: number;
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

// ==================== CONDICIONES COMERCIALES (ViewSet independiente) ====================

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
