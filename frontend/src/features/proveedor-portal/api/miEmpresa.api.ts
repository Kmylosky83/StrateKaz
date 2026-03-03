/**
 * API para el Portal Proveedor — Mi Empresa
 * Endpoints de solo lectura para usuarios externos vinculados a un Proveedor
 */
import apiClient from '@/api/axios-config';
import type {
  MiEmpresaData,
  ContratoProveedor,
  EvaluacionProveedor,
  PrecioMateriaPrimaPortal,
  ProfesionalProveedor,
} from '../types';

const BASE_URL = '/supply-chain/proveedores';

/** Obtiene el proveedor vinculado al usuario autenticado */
export async function fetchMiEmpresa(): Promise<MiEmpresaData> {
  const response = await apiClient.get<MiEmpresaData>(`${BASE_URL}/mi-empresa/`);
  return response.data;
}

/** Obtiene las condiciones comerciales del proveedor vinculado */
export async function fetchMisContratos(): Promise<ContratoProveedor[]> {
  const response = await apiClient.get<ContratoProveedor[]>(`${BASE_URL}/mi-empresa/contratos/`);
  return Array.isArray(response.data) ? response.data : [];
}

/** Obtiene las evaluaciones del proveedor vinculado */
export async function fetchMisEvaluaciones(): Promise<EvaluacionProveedor[]> {
  const response = await apiClient.get<EvaluacionProveedor[]>(
    `${BASE_URL}/mi-empresa/evaluaciones/`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/** Obtiene los precios de materia prima del proveedor vinculado */
export async function fetchMisPrecios(): Promise<PrecioMateriaPrimaPortal[]> {
  const response = await apiClient.get<PrecioMateriaPrimaPortal[]>(
    `${BASE_URL}/mi-empresa/precios/`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/** Obtiene los profesionales vinculados al mismo proveedor (solo CONSULTOR) */
export async function fetchMisProfesionales(): Promise<ProfesionalProveedor[]> {
  const response = await apiClient.get<ProfesionalProveedor[]>(
    `${BASE_URL}/mi-empresa/profesionales/`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/** Toggle activo/inactivo de un profesional vinculado */
export async function toggleEstadoProfesional(
  userId: number
): Promise<{ detail: string; is_active: boolean }> {
  const response = await apiClient.patch<{ detail: string; is_active: boolean }>(
    `${BASE_URL}/mi-empresa/profesionales/${userId}/toggle-estado/`
  );
  return response.data;
}
