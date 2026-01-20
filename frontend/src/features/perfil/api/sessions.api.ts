/**
 * MS-002-A: API para gestión de sesiones de usuario
 *
 * Endpoints:
 * - GET /api/core/sessions/ - Lista sesiones activas
 * - GET /api/core/sessions/current/ - Sesión actual
 * - DELETE /api/core/sessions/{id}/ - Cerrar sesión específica
 * - DELETE /api/core/sessions/close-others/ - Cerrar otras sesiones
 * - PATCH /api/core/sessions/{id}/rename/ - Renombrar dispositivo
 */
import apiClient from '@/api/axios-config';
import type {
  UserSession,
  SessionsListResponse,
  UpdateDeviceNameDTO,
  SessionOperationResponse,
} from '../types/sessions.types';

const SESSIONS_BASE_URL = '/core/sessions';

/**
 * Obtiene lista de sesiones activas del usuario
 */
export const getSessions = async (): Promise<SessionsListResponse> => {
  const response = await apiClient.get<SessionsListResponse>(`${SESSIONS_BASE_URL}/`);
  return response.data;
};

/**
 * Obtiene la sesión actual
 */
export const getCurrentSession = async (): Promise<UserSession> => {
  const response = await apiClient.get<UserSession>(`${SESSIONS_BASE_URL}/current/`);
  return response.data;
};

/**
 * Obtiene detalle de una sesión específica
 */
export const getSessionById = async (id: number): Promise<UserSession> => {
  const response = await apiClient.get<UserSession>(`${SESSIONS_BASE_URL}/${id}/`);
  return response.data;
};

/**
 * Cierra una sesión específica
 */
export const closeSession = async (id: number): Promise<SessionOperationResponse> => {
  const response = await apiClient.delete<SessionOperationResponse>(`${SESSIONS_BASE_URL}/${id}/`);
  return response.data;
};

/**
 * Cierra todas las sesiones excepto la actual
 */
export const closeOtherSessions = async (): Promise<SessionOperationResponse> => {
  const response = await apiClient.delete<SessionOperationResponse>(
    `${SESSIONS_BASE_URL}/close-others/`
  );
  return response.data;
};

/**
 * Renombra el dispositivo de una sesión
 */
export const renameSessionDevice = async (
  id: number,
  data: UpdateDeviceNameDTO
): Promise<UserSession> => {
  const response = await apiClient.patch<UserSession>(`${SESSIONS_BASE_URL}/${id}/rename/`, data);
  return response.data;
};
