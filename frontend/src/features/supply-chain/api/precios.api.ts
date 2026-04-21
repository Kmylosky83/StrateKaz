/**
 * API Client: Precios MP + Historial + Modalidades Logísticas.
 * Backend: /api/supply-chain/{precios-mp,historial-precios,modalidades-logistica}/
 */
import axiosInstance from '@/api/axios-config';
import { createApiClient } from '@/lib/api-factory';
import type {
  PrecioMP,
  CreatePrecioMPDTO,
  UpdatePrecioMPDTO,
  HistorialPrecio,
  ModalidadLogistica,
  PrecioMPPorProveedorRow,
  BatchPorProveedorPayload,
  BatchPorProveedorResponse,
} from '../types/precio.types';

const BASE_URL = '/supply-chain';

export const precioMPApi = createApiClient<PrecioMP, CreatePrecioMPDTO, UpdatePrecioMPDTO>(
  BASE_URL,
  'precios-mp'
);

export const historialPrecioApi = createApiClient<HistorialPrecio>(BASE_URL, 'historial-precios');

export const modalidadLogisticaApi = createApiClient<ModalidadLogistica>(
  BASE_URL,
  'modalidades-logistica'
);

/** Lista de precios+pendientes de un proveedor específico. */
export const getPreciosPorProveedor = async (
  proveedorId: number
): Promise<PrecioMPPorProveedorRow[]> => {
  const { data } = await axiosInstance.get<PrecioMPPorProveedorRow[]>(
    `${BASE_URL}/precios-mp/por-proveedor/${proveedorId}/`
  );
  return data;
};

/** Upsert masivo de precios por proveedor (acción batch). */
export const guardarPreciosPorProveedor = async (
  payload: BatchPorProveedorPayload
): Promise<BatchPorProveedorResponse> => {
  const { data } = await axiosInstance.post<BatchPorProveedorResponse>(
    `${BASE_URL}/precios-mp/batch-por-proveedor/`,
    payload
  );
  return data;
};
