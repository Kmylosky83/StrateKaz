import axiosInstance from './axios-config';
import type {
  Proveedor,
  PrecioMateriaPrima,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  CambiarPrecioDTO,
  ProveedorFilters,
  HistorialPrecio,
  CondicionComercial,
  CreateCondicionComercialDTO,
  UpdateCondicionComercialDTO,
  PruebaAcidez,
  CreatePruebaAcidezDTO,
  SimularPruebaAcidezDTO,
  SimularPruebaAcidezResponse,
  PruebaAcidezFilters,
  EstadisticasAcidez,
} from '@/types/proveedores.types';
import type { PaginatedResponse } from '@/types/api.types';

/**
 * API Client para gestión de proveedores
 */
export const proveedoresAPI = {
  // ==================== PROVEEDORES CRUD ====================

  /**
   * Obtener lista de proveedores con paginación y filtros
   */
  getProveedores: async (filters?: ProveedorFilters): Promise<PaginatedResponse<Proveedor>> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo_proveedor) params.append('tipo_proveedor', filters.tipo_proveedor);
    if (filters?.subtipo_materia) params.append('subtipo_materia', filters.subtipo_materia);
    if (filters?.modalidad_logistica)
      params.append('modalidad_logistica', filters.modalidad_logistica);
    if (filters?.is_active !== undefined) {
      params.append('is_active', String(filters.is_active));
    }
    if (filters?.unidad_negocio) params.append('unidad_negocio', String(filters.unidad_negocio));
    if (filters?.ciudad) params.append('ciudad', filters.ciudad);
    if (filters?.departamento) params.append('departamento', filters.departamento);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString
      ? `/proveedores/proveedores/?${queryString}`
      : '/proveedores/proveedores/';

    const response = await axiosInstance.get<PaginatedResponse<Proveedor>>(url);
    return response.data;
  },

  /**
   * Obtener un proveedor por ID
   */
  getProveedor: async (id: number): Promise<Proveedor> => {
    const response = await axiosInstance.get<Proveedor>(`/proveedores/proveedores/${id}/`);
    return response.data;
  },

  /**
   * Crear nuevo proveedor
   */
  createProveedor: async (data: CreateProveedorDTO): Promise<Proveedor> => {
    const response = await axiosInstance.post<Proveedor>('/proveedores/proveedores/', data);
    return response.data;
  },

  /**
   * Actualizar proveedor existente
   */
  updateProveedor: async (id: number, data: UpdateProveedorDTO): Promise<Proveedor> => {
    const response = await axiosInstance.patch<Proveedor>(`/proveedores/proveedores/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar proveedor (soft delete)
   */
  deleteProveedor: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/proveedores/proveedores/${id}/`);
  },

  /**
   * Restaurar proveedor eliminado
   */
  restoreProveedor: async (id: number): Promise<Proveedor> => {
    const response = await axiosInstance.post<Proveedor>(`/proveedores/proveedores/${id}/restore/`);
    return response.data;
  },

  // ==================== GESTIÓN DE PRECIOS ====================

  /**
   * Cambiar precio de proveedor (Solo Gerente)
   */
  cambiarPrecio: async (
    id: number,
    data: CambiarPrecioDTO
  ): Promise<{ message: string; proveedor: Proveedor }> => {
    const response = await axiosInstance.post<{ message: string; proveedor: Proveedor }>(
      `/proveedores/proveedores/${id}/cambiar-precio/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener historial de cambios de precio
   */
  getHistorialPrecio: async (
    id: number
  ): Promise<{
    proveedor: string;
    precios_actuales: PrecioMateriaPrima[];
    historial: HistorialPrecio[];
  }> => {
    const response = await axiosInstance.get<{
      proveedor: string;
      precios_actuales: PrecioMateriaPrima[];
      historial: HistorialPrecio[];
    }>(`/proveedores/proveedores/${id}/historial-precio/`);
    return response.data;
  },

  // ==================== CONDICIONES COMERCIALES ====================

  /**
   * Obtener condiciones comerciales de un proveedor
   */
  getCondicionesComerciales: async (
    proveedorId?: number
  ): Promise<PaginatedResponse<CondicionComercial>> => {
    const url = proveedorId
      ? `/proveedores/condiciones-comerciales/?proveedor=${proveedorId}`
      : '/proveedores/condiciones-comerciales/';

    const response = await axiosInstance.get<PaginatedResponse<CondicionComercial>>(url);
    return response.data;
  },

  /**
   * Crear condición comercial
   */
  createCondicionComercial: async (
    data: CreateCondicionComercialDTO
  ): Promise<CondicionComercial> => {
    const response = await axiosInstance.post<CondicionComercial>(
      '/proveedores/condiciones-comerciales/',
      data
    );
    return response.data;
  },

  /**
   * Actualizar condición comercial
   */
  updateCondicionComercial: async (
    id: number,
    data: UpdateCondicionComercialDTO
  ): Promise<CondicionComercial> => {
    const response = await axiosInstance.patch<CondicionComercial>(
      `/proveedores/condiciones-comerciales/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Activar/Desactivar proveedor
   */
  toggleProveedorStatus: async (id: number, is_active: boolean): Promise<Proveedor> => {
    const response = await axiosInstance.patch<Proveedor>(`/proveedores/proveedores/${id}/`, {
      is_active,
    });
    return response.data;
  },

  // ==================== PRUEBAS DE ACIDEZ ====================

  /**
   * Obtener lista de pruebas de acidez con paginación y filtros
   */
  getPruebasAcidez: async (
    filters?: PruebaAcidezFilters
  ): Promise<PaginatedResponse<PruebaAcidez>> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.proveedor) params.append('proveedor', String(filters.proveedor));
    if (filters?.calidad_resultante)
      params.append('calidad_resultante', filters.calidad_resultante);
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString
      ? `/proveedores/pruebas-acidez/?${queryString}`
      : '/proveedores/pruebas-acidez/';

    const response = await axiosInstance.get<PaginatedResponse<PruebaAcidez>>(url);
    return response.data;
  },

  /**
   * Obtener una prueba de acidez por ID
   */
  getPruebaAcidez: async (id: number): Promise<PruebaAcidez> => {
    const response = await axiosInstance.get<PruebaAcidez>(`/proveedores/pruebas-acidez/${id}/`);
    return response.data;
  },

  /**
   * Crear nueva prueba de acidez (con foto)
   */
  createPruebaAcidez: async (data: CreatePruebaAcidezDTO): Promise<PruebaAcidez> => {
    const formData = new FormData();

    formData.append('proveedor', String(data.proveedor));
    formData.append('fecha_prueba', data.fecha_prueba);
    formData.append('valor_acidez', String(data.valor_acidez));
    formData.append('foto_prueba', data.foto_prueba);
    formData.append('cantidad_kg', String(data.cantidad_kg));

    if (data.observaciones) {
      formData.append('observaciones', data.observaciones);
    }
    if (data.lote_numero) {
      formData.append('lote_numero', data.lote_numero);
    }

    const response = await axiosInstance.post<PruebaAcidez>(
      '/proveedores/pruebas-acidez/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Eliminar prueba de acidez (soft delete)
   */
  deletePruebaAcidez: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/proveedores/pruebas-acidez/${id}/`);
  },

  /**
   * Restaurar prueba de acidez eliminada
   */
  restorePruebaAcidez: async (id: number): Promise<PruebaAcidez> => {
    const response = await axiosInstance.post<PruebaAcidez>(
      `/proveedores/pruebas-acidez/${id}/restore/`
    );
    return response.data;
  },

  /**
   * Simular resultado de prueba de acidez (sin crear)
   */
  simularPruebaAcidez: async (
    data: SimularPruebaAcidezDTO
  ): Promise<SimularPruebaAcidezResponse> => {
    const response = await axiosInstance.post<SimularPruebaAcidezResponse>(
      '/proveedores/pruebas-acidez/simular/',
      data
    );
    return response.data;
  },

  /**
   * Obtener pruebas de acidez de un proveedor específico
   */
  getPruebasAcidezPorProveedor: async (
    proveedorId: number,
    filters?: Omit<PruebaAcidezFilters, 'proveedor'>
  ): Promise<PaginatedResponse<PruebaAcidez>> => {
    const params = new URLSearchParams();

    if (filters?.calidad_resultante)
      params.append('calidad_resultante', filters.calidad_resultante);
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString
      ? `/proveedores/pruebas-acidez/por-proveedor/?proveedor_id=${proveedorId}&${queryString}`
      : `/proveedores/pruebas-acidez/por-proveedor/?proveedor_id=${proveedorId}`;

    const response = await axiosInstance.get<PaginatedResponse<PruebaAcidez>>(url);
    return response.data;
  },

  /**
   * Obtener estadísticas de pruebas de acidez
   */
  getEstadisticasAcidez: async (filters?: {
    proveedor_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<EstadisticasAcidez> => {
    const params = new URLSearchParams();

    if (filters?.proveedor_id) params.append('proveedor_id', String(filters.proveedor_id));
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);

    const queryString = params.toString();
    const url = queryString
      ? `/proveedores/pruebas-acidez/estadisticas/?${queryString}`
      : '/proveedores/pruebas-acidez/estadisticas/';

    const response = await axiosInstance.get<EstadisticasAcidez>(url);
    return response.data;
  },
};
