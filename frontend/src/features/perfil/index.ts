/**
 * Perfil Feature - Gestión del perfil de usuario
 *
 * Páginas:
 * - PerfilPage: Información personal del usuario
 * - SeguridadPage: Configuración de seguridad (contraseña, sesiones, 2FA)
 * - PreferenciasPage: Preferencias de la aplicación (idioma, zona horaria, formato fecha)
 * - MisNotificacionesPage: Bandeja personal + preferencias de notificación
 *
 * MS-002-A: Añadidos hooks y API para sesiones de usuario
 */

// Pages
export { PerfilPage } from './pages/PerfilPage';
export { SeguridadPage } from './pages/SeguridadPage';
export { PreferenciasPage } from './pages/PreferenciasPage';
export { MisNotificacionesPage } from './pages/MisNotificacionesPage';

// Components
export { ActiveSessionsCard } from './components/ActiveSessionsCard';
export { EditIdentidadModal } from './components/EditIdentidadModal';
export { EditContactoModal } from './components/EditContactoModal';
export { EditEmergenciaModal } from './components/EditEmergenciaModal';
export { ChangePasswordModal } from './components/ChangePasswordModal';

// Hooks (MS-002-A)
export {
  useSessions,
  useCurrentSession,
  useCloseSession,
  useCloseOtherSessions,
  useRenameSession,
  SESSION_QUERY_KEYS,
} from './hooks/useSessions';
export { useUpdateProfile } from './hooks/useUpdateProfile';

// Types
export type {
  UserSession,
  SessionsListResponse,
  UpdateDeviceNameDTO,
  SessionOperationResponse,
} from './types/sessions.types';
