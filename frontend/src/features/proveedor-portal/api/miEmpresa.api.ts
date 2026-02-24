/**
 * API para el Portal Proveedor — Mi Empresa
 * Endpoints de solo lectura para usuarios externos vinculados a un Proveedor
 */
import { api } from '@/api/axios-config';
import type { MiEmpresaData, ContratoProveedor, EvaluacionProveedor } from '../types';

const BASE_URL = '/supply-chain/proveedores';

/** Obtiene el proveedor vinculado al usuario autenticado */
export async function fetchMiEmpresa(): Promise<MiEmpresaData> {
  const response = await api.get<MiEmpresaData>(`${BASE_URL}/mi-empresa/`);
  return response.data;
}

/** Obtiene las condiciones comerciales del proveedor vinculado */
export async function fetchMisContratos(): Promise<ContratoProveedor[]> {
  const response = await api.get<ContratoProveedor[]>(`${BASE_URL}/mi-empresa/contratos/`);
  return Array.isArray(response.data) ? response.data : [];
}

/** Obtiene las evaluaciones del proveedor vinculado */
export async function fetchMisEvaluaciones(): Promise<EvaluacionProveedor[]> {
  const response = await api.get<EvaluacionProveedor[]>(`${BASE_URL}/mi-empresa/evaluaciones/`);
  return Array.isArray(response.data) ? response.data : [];
}
