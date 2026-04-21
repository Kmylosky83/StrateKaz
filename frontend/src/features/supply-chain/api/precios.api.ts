/**
 * API Client: Precios MP + Historial + Modalidades Logísticas.
 * Backend: /api/supply-chain/{precios-mp,historial-precios,modalidades-logistica}/
 */
import { createApiClient } from '@/lib/api-factory';
import type {
  PrecioMP,
  CreatePrecioMPDTO,
  UpdatePrecioMPDTO,
  HistorialPrecio,
  ModalidadLogistica,
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
