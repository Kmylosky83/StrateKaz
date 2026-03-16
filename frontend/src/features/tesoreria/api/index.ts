/**
 * API Clients para Tesoreria — Modulo V2 (Cascada)
 * Endpoints: /api/tesoreria/{resource}/
 */
import { apiClient } from '@/lib/api-client';
import type {
  Banco,
  BancoList,
  BancoSaldos,
  CuentaPorPagar,
  CuentaPorPagarList,
  CuentaPorPagarEstadisticas,
  CuentaPorCobrar,
  CuentaPorCobrarList,
  CuentaPorCobrarEstadisticas,
  FlujoCaja,
  FlujoCajaList,
  FlujoCajaResumen,
  Pago,
  PagoList,
  Recaudo,
  RecaudoList,
  PaginatedResponse,
} from '../types';

const API_BASE = '/tesoreria';

// ==================== TESORERIA API ====================

export const bancosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<BancoList>>(`${API_BASE}/bancos/`, { params }),
  getById: (id: number) => apiClient.get<Banco>(`${API_BASE}/bancos/${id}/`),
  create: (data: Partial<Banco>) => apiClient.post<Banco>(`${API_BASE}/bancos/`, data),
  update: (id: number, data: Partial<Banco>) =>
    apiClient.patch<Banco>(`${API_BASE}/bancos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/bancos/${id}/`),
  getSaldos: () => apiClient.get<BancoSaldos>(`${API_BASE}/bancos/saldos/`),
};

export const cuentasPorPagarApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<CuentaPorPagarList>>(`${API_BASE}/cuentas-por-pagar/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<CuentaPorPagar>(`${API_BASE}/cuentas-por-pagar/${id}/`),
  create: (data: Partial<CuentaPorPagar>) =>
    apiClient.post<CuentaPorPagar>(`${API_BASE}/cuentas-por-pagar/`, data),
  update: (id: number, data: Partial<CuentaPorPagar>) =>
    apiClient.patch<CuentaPorPagar>(`${API_BASE}/cuentas-por-pagar/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/cuentas-por-pagar/${id}/`),
  getVencidas: () =>
    apiClient.get<PaginatedResponse<CuentaPorPagarList>>(`${API_BASE}/cuentas-por-pagar/vencidas/`),
  getPorVencer: () =>
    apiClient.get<PaginatedResponse<CuentaPorPagarList>>(
      `${API_BASE}/cuentas-por-pagar/por-vencer/`
    ),
  getEstadisticas: () =>
    apiClient.get<CuentaPorPagarEstadisticas>(`${API_BASE}/cuentas-por-pagar/estadisticas/`),
};

export const cuentasPorCobrarApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<CuentaPorCobrarList>>(`${API_BASE}/cuentas-por-cobrar/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<CuentaPorCobrar>(`${API_BASE}/cuentas-por-cobrar/${id}/`),
  create: (data: Partial<CuentaPorCobrar>) =>
    apiClient.post<CuentaPorCobrar>(`${API_BASE}/cuentas-por-cobrar/`, data),
  update: (id: number, data: Partial<CuentaPorCobrar>) =>
    apiClient.patch<CuentaPorCobrar>(`${API_BASE}/cuentas-por-cobrar/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/cuentas-por-cobrar/${id}/`),
  getVencidas: () =>
    apiClient.get<PaginatedResponse<CuentaPorCobrarList>>(
      `${API_BASE}/cuentas-por-cobrar/vencidas/`
    ),
  getPorVencer: () =>
    apiClient.get<PaginatedResponse<CuentaPorCobrarList>>(
      `${API_BASE}/cuentas-por-cobrar/por-vencer/`
    ),
  getEstadisticas: () =>
    apiClient.get<CuentaPorCobrarEstadisticas>(`${API_BASE}/cuentas-por-cobrar/estadisticas/`),
};

export const flujoCajaApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<FlujoCajaList>>(`${API_BASE}/flujo-caja/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<FlujoCaja>(`${API_BASE}/flujo-caja/${id}/`),
  create: (data: Partial<FlujoCaja>) => apiClient.post<FlujoCaja>(`${API_BASE}/flujo-caja/`, data),
  update: (id: number, data: Partial<FlujoCaja>) =>
    apiClient.patch<FlujoCaja>(`${API_BASE}/flujo-caja/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/flujo-caja/${id}/`),
  getResumenPeriodo: (params: { fecha_inicio: string; fecha_fin: string }) =>
    apiClient.get<FlujoCajaResumen>(`${API_BASE}/flujo-caja/resumen-periodo/`, {
      params,
    }),
};

export const pagosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<PagoList>>(`${API_BASE}/pagos/`, { params }),
  getById: (id: number) => apiClient.get<Pago>(`${API_BASE}/pagos/${id}/`),
  create: (data: Partial<Pago>) => apiClient.post<Pago>(`${API_BASE}/pagos/`, data),
  update: (id: number, data: Partial<Pago>) =>
    apiClient.patch<Pago>(`${API_BASE}/pagos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/pagos/${id}/`),
};

export const recaudosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<RecaudoList>>(`${API_BASE}/recaudos/`, { params }),
  getById: (id: number) => apiClient.get<Recaudo>(`${API_BASE}/recaudos/${id}/`),
  create: (data: Partial<Recaudo>) => apiClient.post<Recaudo>(`${API_BASE}/recaudos/`, data),
  update: (id: number, data: Partial<Recaudo>) =>
    apiClient.patch<Recaudo>(`${API_BASE}/recaudos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/recaudos/${id}/`),
};
