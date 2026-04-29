/**
 * API Client: Proveedores (CT-layer).
 * Backend: /api/catalogo-productos/{proveedores,tipos-proveedor}/
 */
import { createApiClient } from '@/lib/api-factory';
import type {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  TipoProveedor,
  CreateTipoProveedorDTO,
  UpdateTipoProveedorDTO,
} from '../types/proveedor.types';

const BASE_URL = '/catalogo-productos';

export const proveedorApi = createApiClient<Proveedor, CreateProveedorDTO, UpdateProveedorDTO>(
  BASE_URL,
  'proveedores'
);

export const tipoProveedorApi = createApiClient<
  TipoProveedor,
  CreateTipoProveedorDTO,
  UpdateTipoProveedorDTO
>(BASE_URL, 'tipos-proveedor');
