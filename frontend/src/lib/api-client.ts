/**
 * API Client wrapper para uso en features
 * Re-exporta el cliente axios configurado
 * @module lib/api-client
 */
import axiosInstance from '@/api/axios-config';

// Exportar como apiClient para uso consistente en features
export const apiClient = axiosInstance;

// Alias para compatibilidad con código existente
export const api = axiosInstance;

// También exportar como default para compatibilidad
export default axiosInstance;
