/**
 * API Functions para Gestión de Compras - Supply Chain
 */

import axios from 'axios';
import type {
  Requisicion, RequisicionList, CreateRequisicionDTO, UpdateRequisicionDTO,
  Cotizacion, CotizacionList, CreateCotizacionDTO, UpdateCotizacionDTO,
  EvaluacionCotizacion, CreateEvaluacionCotizacionDTO,
  OrdenCompra, OrdenCompraList, CreateOrdenCompraDTO, UpdateOrdenCompraDTO,
  Contrato, ContratoList, CreateContratoDTO, UpdateContratoDTO,
  RecepcionCompra, RecepcionCompraList, CreateRecepcionCompraDTO,
  PaginatedResponse, EstadisticasComprasResponse
} from '../types';

const BASE_URL = '/api/v1/supply-chain/compras';

const requisicionApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<RequisicionList>>(`${BASE_URL}/requisiciones/`, { params }),
  getById: (id: number) => axios.get<Requisicion>(`${BASE_URL}/requisiciones/${id}/`),
  create: (data: CreateRequisicionDTO) => axios.post<Requisicion>(`${BASE_URL}/requisiciones/`, data),
  update: (id: number, data: UpdateRequisicionDTO) => axios.patch<Requisicion>(`${BASE_URL}/requisiciones/${id}/`, data),
  delete: (id: number) => axios.delete(`${BASE_URL}/requisiciones/${id}/`),
  aprobar: (id: number) => axios.post<Requisicion>(`${BASE_URL}/requisiciones/${id}/aprobar/`),
  rechazar: (id: number, motivo: string) => axios.post<Requisicion>(`${BASE_URL}/requisiciones/${id}/rechazar/`, { motivo }),
};

const cotizacionApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<CotizacionList>>(`${BASE_URL}/cotizaciones/`, { params }),
  getById: (id: number) => axios.get<Cotizacion>(`${BASE_URL}/cotizaciones/${id}/`),
  create: (data: CreateCotizacionDTO) => axios.post<Cotizacion>(`${BASE_URL}/cotizaciones/`, data),
  update: (id: number, data: UpdateCotizacionDTO) => axios.patch<Cotizacion>(`${BASE_URL}/cotizaciones/${id}/`, data),
  delete: (id: number) => axios.delete(`${BASE_URL}/cotizaciones/${id}/`),
  evaluar: (id: number, data: CreateEvaluacionCotizacionDTO) => axios.post<EvaluacionCotizacion>(`${BASE_URL}/cotizaciones/${id}/evaluar/`, data),
  seleccionar: (id: number) => axios.post<Cotizacion>(`${BASE_URL}/cotizaciones/${id}/seleccionar/`),
};

const ordenCompraApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<OrdenCompraList>>(`${BASE_URL}/ordenes-compra/`, { params }),
  getById: (id: number) => axios.get<OrdenCompra>(`${BASE_URL}/ordenes-compra/${id}/`),
  create: (data: CreateOrdenCompraDTO) => axios.post<OrdenCompra>(`${BASE_URL}/ordenes-compra/`, data),
  update: (id: number, data: UpdateOrdenCompraDTO) => axios.patch<OrdenCompra>(`${BASE_URL}/ordenes-compra/${id}/`, data),
  delete: (id: number) => axios.delete(`${BASE_URL}/ordenes-compra/${id}/`),
  aprobar: (id: number) => axios.post<OrdenCompra>(`${BASE_URL}/ordenes-compra/${id}/aprobar/`),
};

const contratoApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<ContratoList>>(`${BASE_URL}/contratos/`, { params }),
  getById: (id: number) => axios.get<Contrato>(`${BASE_URL}/contratos/${id}/`),
  create: (data: CreateContratoDTO) => axios.post<Contrato>(`${BASE_URL}/contratos/`, data),
  update: (id: number, data: UpdateContratoDTO) => axios.patch<Contrato>(`${BASE_URL}/contratos/${id}/`, data),
  delete: (id: number) => axios.delete(`${BASE_URL}/contratos/${id}/`),
  vigentes: () => axios.get<Contrato[]>(`${BASE_URL}/contratos/vigentes/`),
  porVencer: (dias: number = 30) => axios.get<Contrato[]>(`${BASE_URL}/contratos/por-vencer/?dias=${dias}`),
};

const recepcionApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<RecepcionCompraList>>(`${BASE_URL}/recepciones/`, { params }),
  getById: (id: number) => axios.get<RecepcionCompra>(`${BASE_URL}/recepciones/${id}/`),
  create: (data: CreateRecepcionCompraDTO) => axios.post<RecepcionCompra>(`${BASE_URL}/recepciones/`, data),
  registrarRecepcion: (ordenCompraId: number, data: CreateRecepcionCompraDTO) =>
    axios.post<RecepcionCompra>(`${BASE_URL}/ordenes-compra/${ordenCompraId}/registrar-recepcion/`, data),
  noConformes: () => axios.get<RecepcionCompra[]>(`${BASE_URL}/recepciones/no-conformes/`),
};

const comprasApi = {
  requisicion: requisicionApi,
  cotizacion: cotizacionApi,
  ordenCompra: ordenCompraApi,
  contrato: contratoApi,
  recepcion: recepcionApi,
  estadisticas: () => axios.get<EstadisticasComprasResponse>(`${BASE_URL}/estadisticas/`),
};

export default comprasApi;
