/**
 * API Functions para Gestión de Almacenamiento e Inventario - Supply Chain
 */

import axios from 'axios';
import type {
  Inventario, InventarioList, CreateInventarioDTO, UpdateInventarioDTO,
  MovimientoInventario, MovimientoInventarioList, CreateMovimientoInventarioDTO,
  Kardex, KardexResponse, ConsultaKardexParams,
  AlertaStock, AlertaStockList, CreateAlertaStockDTO,
  ConfiguracionStock, ConfiguracionStockList, CreateConfiguracionStockDTO, UpdateConfiguracionStockDTO,
  PaginatedResponse, EstadisticasAlmacenamientoResponse
} from '../types';

const BASE_URL = '/api/v1/supply-chain/almacenamiento';

const inventarioApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<InventarioList>>(`${BASE_URL}/inventarios/`, { params }),
  getById: (id: number) => axios.get<Inventario>(`${BASE_URL}/inventarios/${id}/`),
  create: (data: CreateInventarioDTO) => axios.post<Inventario>(`${BASE_URL}/inventarios/`, data),
  update: (id: number, data: UpdateInventarioDTO) => axios.patch<Inventario>(`${BASE_URL}/inventarios/${id}/`, data),
  delete: (id: number) => axios.delete(`${BASE_URL}/inventarios/${id}/`),
  stockBajo: () => axios.get<Inventario[]>(`${BASE_URL}/inventarios/stock-bajo/`),
  stockCritico: () => axios.get<Inventario[]>(`${BASE_URL}/inventarios/stock-critico/`),
  porVencer: (dias: number = 30) => axios.get<Inventario[]>(`${BASE_URL}/inventarios/por-vencer/?dias=${dias}`),
};

const movimientoApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<MovimientoInventarioList>>(`${BASE_URL}/movimientos/`, { params }),
  getById: (id: number) => axios.get<MovimientoInventario>(`${BASE_URL}/movimientos/${id}/`),
  create: (data: CreateMovimientoInventarioDTO) => axios.post<MovimientoInventario>(`${BASE_URL}/movimientos/`, data),
  registrarMovimiento: (data: CreateMovimientoInventarioDTO) =>
    axios.post<MovimientoInventario>(`${BASE_URL}/movimientos/registrar/`, data),
};

const kardexApi = {
  consultar: (params: ConsultaKardexParams) =>
    axios.get<KardexResponse>(`${BASE_URL}/kardex/consultar/`, { params }),
  getByInventario: (inventarioId: number, params?: Record<string, any>) =>
    axios.get<PaginatedResponse<Kardex>>(`${BASE_URL}/kardex/inventario/${inventarioId}/`, { params }),
};

const alertaApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<AlertaStockList>>(`${BASE_URL}/alertas/`, { params }),
  getById: (id: number) => axios.get<AlertaStock>(`${BASE_URL}/alertas/${id}/`),
  create: (data: CreateAlertaStockDTO) => axios.post<AlertaStock>(`${BASE_URL}/alertas/`, data),
  generarAlertas: () => axios.post<{ alertas_generadas: number }>(`${BASE_URL}/alertas/generar/`),
  marcarLeida: (id: number) => axios.post<AlertaStock>(`${BASE_URL}/alertas/${id}/marcar-leida/`),
  resolver: (id: number, observaciones?: string) =>
    axios.post<AlertaStock>(`${BASE_URL}/alertas/${id}/resolver/`, { observaciones }),
  noLeidas: () => axios.get<AlertaStock[]>(`${BASE_URL}/alertas/no-leidas/`),
};

const configuracionApi = {
  getAll: (params?: Record<string, any>) => axios.get<PaginatedResponse<ConfiguracionStockList>>(`${BASE_URL}/configuraciones/`, { params }),
  getById: (id: number) => axios.get<ConfiguracionStock>(`${BASE_URL}/configuraciones/${id}/`),
  create: (data: CreateConfiguracionStockDTO) => axios.post<ConfiguracionStock>(`${BASE_URL}/configuraciones/`, data),
  update: (id: number, data: UpdateConfiguracionStockDTO) => axios.patch<ConfiguracionStock>(`${BASE_URL}/configuraciones/${id}/`, data),
  delete: (id: number) => axios.delete(`${BASE_URL}/configuraciones/${id}/`),
};

const almacenamientoApi = {
  inventario: inventarioApi,
  movimiento: movimientoApi,
  kardex: kardexApi,
  alerta: alertaApi,
  configuracion: configuracionApi,
  estadisticas: () => axios.get<EstadisticasAlmacenamientoResponse>(`${BASE_URL}/estadisticas/`),
};

export default almacenamientoApi;
