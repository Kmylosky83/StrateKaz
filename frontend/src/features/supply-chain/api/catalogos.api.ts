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
 * Crea funciones CRUD genéricas para catálogos
 */
function createCatalogoApi<T, CreateDTO, UpdateDTO>(endpoint: string) {
  return {
    getAll: async (params?: {
      page?: number;
      page_size?: number;
      search?: string;
      is_active?: boolean;
      ordering?: string;
    }): Promise<PaginatedResponse<T>> => {
      const response = await apiClient.get<PaginatedResponse<T>>(`${BASE_URL}/${endpoint}/`, {
        params,
      });
      return response.data;
    },

    getById: async (id: number): Promise<T> => {
      const response = await apiClient.get<T>(`${BASE_URL}/${endpoint}/${id}/`);
      return response.data;
    },

    create: async (data: CreateDTO): Promise<T> => {
      const response = await apiClient.post<T>(`${BASE_URL}/${endpoint}/`, data);
      return response.data;
    },

    update: async (id: number, data: UpdateDTO): Promise<T> => {
      const response = await apiClient.patch<T>(`${BASE_URL}/${endpoint}/${id}/`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`${BASE_URL}/${endpoint}/${id}/`);
    },

    getActivos: async (): Promise<T[]> => {
      const response = await apiClient.get<PaginatedResponse<T>>(`${BASE_URL}/${endpoint}/`, {
        params: { is_active: true, page_size: 1000 },
      });
      return response.data.results;
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
      `${BASE_URL}/tipos-materia-prima/por_acidez/`,
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

export const tipoDocumentoIdentidadApi = createCatalogoApi<
  TipoDocumentoIdentidad,
  CreateTipoDocumentoIdentidadDTO,
  UpdateTipoDocumentoIdentidadDTO
>('tipos-documento');

export const departamentoApi = createCatalogoApi<
  Departamento,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO
>('departamentos');

export const ciudadApi = {
  ...createCatalogoApi<Ciudad, CreateCiudadDTO, UpdateCiudadDTO>('ciudades'),

  /**
   * Obtener ciudades por departamento
   */
  porDepartamento: async (departamentoId: number): Promise<Ciudad[]> => {
    const response = await apiClient.get<PaginatedResponse<Ciudad>>(`${BASE_URL}/ciudades/`, {
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
