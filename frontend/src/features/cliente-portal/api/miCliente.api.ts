/**
 * API para el Portal de Clientes — Mi Cliente
 * Endpoints de solo lectura para usuarios vinculados a un Cliente
 */
import apiClient from '@/api/axios-config';
import type { MiClienteData, ContactoCliente, ScoringCliente } from '../types';

const BASE_URL = '/sales-crm/clientes';

/** Obtiene el cliente vinculado al usuario autenticado */
export async function fetchMiCliente(): Promise<MiClienteData> {
  const response = await apiClient.get<MiClienteData>(`${BASE_URL}/mi-cliente/`);
  return response.data;
}

/** Obtiene los contactos del cliente vinculado */
export async function fetchMisContactos(): Promise<ContactoCliente[]> {
  const response = await apiClient.get<ContactoCliente[]>(`${BASE_URL}/mi-cliente/contactos/`);
  return Array.isArray(response.data) ? response.data : [];
}

/** Obtiene el scoring del cliente vinculado */
export async function fetchMiScoring(): Promise<ScoringCliente> {
  const response = await apiClient.get<ScoringCliente>(`${BASE_URL}/mi-cliente/scoring/`);
  return response.data;
}
