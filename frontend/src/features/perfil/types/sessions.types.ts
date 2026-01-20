/**
 * MS-002-A: Tipos para sesiones de usuario
 */

/**
 * Sesión de usuario activa
 */
export interface UserSession {
  id: number;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  device_os: string;
  device_browser: string;
  device_name: string;
  device_display: string;
  ip_address: string;
  country: string;
  city: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  is_current: boolean;
  time_remaining: string;
  time_elapsed: string;
}

/**
 * Respuesta de lista de sesiones
 */
export interface SessionsListResponse {
  count: number;
  sessions: UserSession[];
  current_session_id: number | null;
}

/**
 * DTO para renombrar dispositivo
 */
export interface UpdateDeviceNameDTO {
  device_name: string;
}

/**
 * Respuesta de operaciones de sesión
 */
export interface SessionOperationResponse {
  detail: string;
  closed_count?: number;
}
