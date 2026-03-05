/**
 * API Client para Catálogos Dinámicos - Gestión de Proveedores
 * Backend: /api/supply-chain/
 */
import { apiClient } from '@/lib/api-client';
import type {
  CategoriaMateriaPrima,
  TipoMateriaPrima,
  TipoProveedor,
  ModalidadLogistica,
  FormaPago,
  TipoCuentaBancaria,
  TipoDocumentoIdentidad,
  Departamento,
  Ciudad,
  CreateCategoriaMateriaPrimaDTO,
  UpdateCategoriaMateriaPrimaDTO,
  CreateTipoMateriaPrimaDTO,
  UpdateTipoMateriaPrimaDTO,
  CreateTipoProveedorDTO,
  UpdateTipoProveedorDTO,
  CreateModalidadLogisticaDTO,
  UpdateModalidadLogisticaDTO,
  CreateFormaPagoDTO,
  UpdateFormaPagoDTO,
  CreateTipoCuentaBancariaDTO,
  UpdateTipoCuentaBancariaDTO,
  CreateTipoDocumentoIdentidadDTO,
  UpdateTipoDocumentoIdentidadDTO,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO,
  CreateCiudadDTO,
  UpdateCiudadDTO,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/supply-chain';

// ==================== HELPER GENÉRICO ====================

/**
 * Crea funciones CRUD genéricas para catálogos (usa BASE_URL de supply-chain)
 */
function createCatalogoApi<T, CreateDTO, UpdateDTO>(endpoint: string) {
  return createCatalogoApiWithBase<T, CreateDTO, UpdateDTO>(BASE_URL, endpoint);
}

/**
 * Crea funciones CRUD genéricas para catálogos con base URL configurable
 */
function createCatalogoApiWithBase<T, CreateDTO, UpdateDTO>(baseUrl: string, endpoint: string) {
  return {
    getAll: async (params?: {
      page?: number;
      page_size?: number;
      search?: string;
      is_active?: boolean;
      ordering?: string;
    }): Promise<PaginatedResponse<T>> => {
      const response = await apiClient.get(`${baseUrl}/${endpoint}/`, {
        params,
      });
      const data = response.data;
      // Manejar respuestas con y sin paginación (core no pagina)
      if (Array.isArray(data)) {
        return { count: data.length, next: null, previous: null, results: data };
      }
      return data;
    },

    getById: async (id: number): Promise<T> => {
      const response = await apiClient.get<T>(`${baseUrl}/${endpoint}/${id}/`);
      return response.data;
    },

    create: async (data: CreateDTO): Promise<T> => {
      const response = await apiClient.post<T>(`${baseUrl}/${endpoint}/`, data);
      return response.data;
    },

    update: async (id: number, data: UpdateDTO): Promise<T> => {
      const response = await apiClient.patch<T>(`${baseUrl}/${endpoint}/${id}/`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`${baseUrl}/${endpoint}/${id}/`);
    },

    getActivos: async (): Promise<T[]> => {
      const response = await apiClient.get(`${baseUrl}/${endpoint}/`, {
        params: { is_active: true, page_size: 1000 },
      });
      const data = response.data;
      return Array.isArray(data) ? data : (data?.results ?? []);
    },
  };
}

// ==================== CATÁLOGOS ESPECÍFICOS ====================

export const categoriaMateriaPrimaApi = createCatalogoApi<
  CategoriaMateriaPrima,
  CreateCategoriaMateriaPrimaDTO,
  UpdateCategoriaMateriaPrimaDTO
>('categorias-materia-prima');

export const tipoMateriaPrimaApi = {
  ...createCatalogoApi<TipoMateriaPrima, CreateTipoMateriaPrimaDTO, UpdateTipoMateriaPrimaDTO>(
    'tipos-materia-prima'
  ),

  /**
   * Obtener tipos por categoría
   */
  porCategoria: async (categoriaId: number): Promise<TipoMateriaPrima[]> => {
    const response = await apiClient.get<PaginatedResponse<TipoMateriaPrima>>(
      `${BASE_URL}/tipos-materia-prima/`,
      {
        params: { categoria: categoriaId, is_active: true, page_size: 1000 },
      }
    );
    return response.data.results;
  },

  /**
   * Obtener tipo por acidez (para sebo procesado)
   */
  porAcidez: async (valorAcidez: number): Promise<TipoMateriaPrima | null> => {
    const response = await apiClient.get<TipoMateriaPrima[]>(
      `${BASE_URL}/tipos-materia-prima/por-acidez/`,
      {
        params: { valor_acidez: valorAcidez },
      }
    );
    return response.data[0] || null;
  },
};

export const tipoProveedorApi = createCatalogoApi<
  TipoProveedor,
  CreateTipoProveedorDTO,
  UpdateTipoProveedorDTO
>('tipos-proveedor');

export const modalidadLogisticaApi = createCatalogoApi<
  ModalidadLogistica,
  CreateModalidadLogisticaDTO,
  UpdateModalidadLogisticaDTO
>('modalidades-logistica');

export const formaPagoApi = createCatalogoApi<FormaPago, CreateFormaPagoDTO, UpdateFormaPagoDTO>(
  'formas-pago'
);

export const tipoCuentaBancariaApi = createCatalogoApi<
  TipoCuentaBancaria,
  CreateTipoCuentaBancariaDTO,
  UpdateTipoCuentaBancariaDTO
>('tipos-cuenta-bancaria');

// Datos Maestros Compartidos — ahora en Core (C0): /api/core/
const CORE_URL = '/core';

export const tipoDocumentoIdentidadApi = createCatalogoApiWithBase<
  TipoDocumentoIdentidad,
  CreateTipoDocumentoIdentidadDTO,
  UpdateTipoDocumentoIdentidadDTO
>(CORE_URL, 'tipos-documento');

export const departamentoApi = createCatalogoApiWithBase<
  Departamento,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO
>(CORE_URL, 'departamentos');

export const ciudadApi = {
  ...createCatalogoApiWithBase<Ciudad, CreateCiudadDTO, UpdateCiudadDTO>(CORE_URL, 'ciudades'),

  /**
   * Obtener ciudades por departamento
   */
  porDepartamento: async (departamentoId: number): Promise<Ciudad[]> => {
    const response = await apiClient.get<PaginatedResponse<Ciudad>>(`${CORE_URL}/ciudades/`, {
      params: { departamento: departamentoId, is_active: true, page_size: 1000 },
    });
    return response.data.results;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  categoriaMateriaPrima: categoriaMateriaPrimaApi,
  tipoMateriaPrima: tipoMateriaPrimaApi,
  tipoProveedor: tipoProveedorApi,
  modalidadLogistica: modalidadLogisticaApi,
  formaPago: formaPagoApi,
  tipoCuentaBancaria: tipoCuentaBancariaApi,
  tipoDocumentoIdentidad: tipoDocumentoIdentidadApi,
  departamento: departamentoApi,
  ciudad: ciudadApi,
};
