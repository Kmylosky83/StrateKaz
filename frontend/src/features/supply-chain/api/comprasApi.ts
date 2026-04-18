/**
 * API Functions para Gestión de Compras - Supply Chain
 */

import apiClient from '@/api/axios-config';
import type {
  Requisicion,
  RequisicionList,
  CreateRequisicionDTO,
  UpdateRequisicionDTO,
  Cotizacion,
  CotizacionList,
  CreateCotizacionDTO,
  UpdateCotizacionDTO,
  EvaluacionCotizacion,
  CreateEvaluacionCotizacionDTO,
  OrdenCompra,
  OrdenCompraList,
  CreateOrdenCompraDTO,
  UpdateOrdenCompraDTO,
  Contrato,
  ContratoList,
  CreateContratoDTO,
  UpdateContratoDTO,
  PaginatedResponse,
  EstadisticasComprasResponse,
} from '../types';

const BASE_URL = '/supply-chain/compras';

const requisicionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<RequisicionList>>(`${BASE_URL}/requisiciones/`, { params }),
  getById: (id: number) => apiClient.get<Requisicion>(`${BASE_URL}/requisiciones/${id}/`),
  create: (data: CreateRequisicionDTO) =>
    apiClient.post<Requisicion>(`${BASE_URL}/requisiciones/`, data),
  update: (id: number, data: UpdateRequisicionDTO) =>
    apiClient.patch<Requisicion>(`${BASE_URL}/requisiciones/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_URL}/requisiciones/${id}/`),
  aprobar: (id: number) => apiClient.post<Requisicion>(`${BASE_URL}/requisiciones/${id}/aprobar/`),
  rechazar: (id: number, motivo: string) =>
    apiClient.post<Requisicion>(`${BASE_URL}/requisiciones/${id}/rechazar/`, { motivo }),
};

const cotizacionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<CotizacionList>>(`${BASE_URL}/cotizaciones/`, { params }),
  getById: (id: number) => apiClient.get<Cotizacion>(`${BASE_URL}/cotizaciones/${id}/`),
  create: (data: CreateCotizacionDTO) =>
    apiClient.post<Cotizacion>(`${BASE_URL}/cotizaciones/`, data),
  update: (id: number, data: UpdateCotizacionDTO) =>
    apiClient.patch<Cotizacion>(`${BASE_URL}/cotizaciones/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_URL}/cotizaciones/${id}/`),
  evaluar: (id: number, data: CreateEvaluacionCotizacionDTO) =>
    apiClient.post<EvaluacionCotizacion>(`${BASE_URL}/cotizaciones/${id}/evaluar/`, data),
  seleccionar: (id: number) =>
    apiClient.post<Cotizacion>(`${BASE_URL}/cotizaciones/${id}/seleccionar/`),
};

const ordenCompraApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<OrdenCompraList>>(`${BASE_URL}/ordenes-compra/`, { params }),
  getById: (id: number) => apiClient.get<OrdenCompra>(`${BASE_URL}/ordenes-compra/${id}/`),
  create: (data: CreateOrdenCompraDTO) =>
    apiClient.post<OrdenCompra>(`${BASE_URL}/ordenes-compra/`, data),
  update: (id: number, data: UpdateOrdenCompraDTO) =>
    apiClient.patch<OrdenCompra>(`${BASE_URL}/ordenes-compra/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_URL}/ordenes-compra/${id}/`),
  aprobar: (id: number) => apiClient.post<OrdenCompra>(`${BASE_URL}/ordenes-compra/${id}/aprobar/`),
};

const contratoApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ContratoList>>(`${BASE_URL}/contratos/`, { params }),
  getById: (id: number) => apiClient.get<Contrato>(`${BASE_URL}/contratos/${id}/`),
  create: (data: CreateContratoDTO) => apiClient.post<Contrato>(`${BASE_URL}/contratos/`, data),
  update: (id: number, data: UpdateContratoDTO) =>
    apiClient.patch<Contrato>(`${BASE_URL}/contratos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_URL}/contratos/${id}/`),
  vigentes: () => apiClient.get<Contrato[]>(`${BASE_URL}/contratos/vigentes/`),
  porVencer: (dias: number = 30) =>
    apiClient.get<Contrato[]>(`${BASE_URL}/contratos/por-vencer/?dias=${dias}`),
};

// Nota: recepcionApi eliminado en S3. Ver features/supply-chain/recepcion/api
// para VoucherRecepcion (nuevo documento primario de recepción de MP).

const comprasApi = {
  requisicion: requisicionApi,
  cotizacion: cotizacionApi,
  ordenCompra: ordenCompraApi,
  contrato: contratoApi,
  estadisticas: () => apiClient.get<EstadisticasComprasResponse>(`${BASE_URL}/estadisticas/`),
};

export default comprasApi;
