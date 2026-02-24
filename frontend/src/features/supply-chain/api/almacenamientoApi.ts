/**
 * API Functions para Gestión de Almacenamiento e Inventario - Supply Chain
 */

import apiClient from '@/api/axios-config';
import type {
  Inventario,
  InventarioList,
  CreateInventarioDTO,
  UpdateInventarioDTO,
  MovimientoInventario,
  MovimientoInventarioList,
  CreateMovimientoInventarioDTO,
  Kardex,
  KardexResponse,
  ConsultaKardexParams,
  AlertaStock,
  AlertaStockList,
  CreateAlertaStockDTO,
  ConfiguracionStock,
  ConfiguracionStockList,
  CreateConfiguracionStockDTO,
  UpdateConfiguracionStockDTO,
  PaginatedResponse,
  EstadisticasAlmacenamientoResponse,
} from '../types';

const BASE_URL = '/api/supply-chain/almacenamiento';

const inventarioApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<InventarioList>>(`${BASE_URL}/inventarios/`, { params }),
  getById: (id: number) => apiClient.get<Inventario>(`${BASE_URL}/inventarios/${id}/`),
  create: (data: CreateInventarioDTO) =>
    apiClient.post<Inventario>(`${BASE_URL}/inventarios/`, data),
  update: (id: number, data: UpdateInventarioDTO) =>
    apiClient.patch<Inventario>(`${BASE_URL}/inventarios/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_URL}/inventarios/${id}/`),
  stockBajo: () => apiClient.get<Inventario[]>(`${BASE_URL}/inventarios/stock-bajo/`),
  stockCritico: () => apiClient.get<Inventario[]>(`${BASE_URL}/inventarios/stock-critico/`),
  porVencer: (dias: number = 30) =>
    apiClient.get<Inventario[]>(`${BASE_URL}/inventarios/por-vencer/?dias=${dias}`),
};

const movimientoApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<MovimientoInventarioList>>(`${BASE_URL}/movimientos/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<MovimientoInventario>(`${BASE_URL}/movimientos/${id}/`),
  create: (data: CreateMovimientoInventarioDTO) =>
    apiClient.post<MovimientoInventario>(`${BASE_URL}/movimientos/`, data),
  registrarMovimiento: (data: CreateMovimientoInventarioDTO) =>
    apiClient.post<MovimientoInventario>(`${BASE_URL}/movimientos/registrar/`, data),
};

const kardexApi = {
  consultar: (params: ConsultaKardexParams) =>
    apiClient.get<KardexResponse>(`${BASE_URL}/kardex/consultar/`, { params }),
  getByInventario: (inventarioId: number, params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<Kardex>>(`${BASE_URL}/kardex/inventario/${inventarioId}/`, {
      params,
    }),
};

const alertaApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<AlertaStockList>>(`${BASE_URL}/alertas/`, { params }),
  getById: (id: number) => apiClient.get<AlertaStock>(`${BASE_URL}/alertas/${id}/`),
  create: (data: CreateAlertaStockDTO) => apiClient.post<AlertaStock>(`${BASE_URL}/alertas/`, data),
  generarAlertas: () =>
    apiClient.post<{ alertas_generadas: number }>(`${BASE_URL}/alertas/generar/`),
  marcarLeida: (id: number) =>
    apiClient.post<AlertaStock>(`${BASE_URL}/alertas/${id}/marcar-leida/`),
  resolver: (id: number, observaciones?: string) =>
    apiClient.post<AlertaStock>(`${BASE_URL}/alertas/${id}/resolver/`, { observaciones }),
  noLeidas: () => apiClient.get<AlertaStock[]>(`${BASE_URL}/alertas/no-leidas/`),
};

const configuracionApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<ConfiguracionStockList>>(`${BASE_URL}/configuraciones/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<ConfiguracionStock>(`${BASE_URL}/configuraciones/${id}/`),
  create: (data: CreateConfiguracionStockDTO) =>
    apiClient.post<ConfiguracionStock>(`${BASE_URL}/configuraciones/`, data),
  update: (id: number, data: UpdateConfiguracionStockDTO) =>
    apiClient.patch<ConfiguracionStock>(`${BASE_URL}/configuraciones/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_URL}/configuraciones/${id}/`),
};

const almacenamientoApi = {
  inventario: inventarioApi,
  movimiento: movimientoApi,
  kardex: kardexApi,
  alerta: alertaApi,
  configuracion: configuracionApi,
  estadisticas: () =>
    apiClient.get<EstadisticasAlmacenamientoResponse>(`${BASE_URL}/estadisticas/`),
};

export default almacenamientoApi;
