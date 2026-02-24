/**
 * UI Labels - Constantes de texto para la interfaz
 *
 * Centraliza todos los textos hardcoded del sistema para:
 * - Facilitar mantenimiento y traducciones futuras
 * - Consistencia en toda la aplicacion
 * - Eliminar hardcoding en componentes
 */

// ═══════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════
export const HEADER_LABELS = {
  /** Texto del atajo de busqueda */
  SEARCH_SHORTCUT: 'Buscar (Ctrl+K)',
  /** Aria label para abrir menu */
  OPEN_MENU: 'Abrir menu',
  /** Aria label para cerrar menu */
  CLOSE_MENU: 'Cerrar menu',
  /** Tooltip modo claro */
  LIGHT_MODE: 'Modo claro',
  /** Tooltip modo oscuro */
  DARK_MODE: 'Modo oscuro',
  /** Texto de notificaciones */
  NOTIFICATIONS: 'Notificaciones',
  /** Formato del saludo */
  GREETING: (name: string) => `Hola, ${name}`,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// USER MENU
// ═══════════════════════════════════════════════════════════════════════════
export const USER_MENU_LABELS = {
  /** Usuario por defecto */
  DEFAULT_USER: 'Usuario',
  /** Cargo por defecto */
  DEFAULT_CARGO: 'Sin cargo asignado',
  /** Mi Perfil */
  PROFILE: 'Mi Perfil',
  /** Notificaciones */
  NOTIFICATIONS: 'Notificaciones',
  /** Seguridad */
  SECURITY: 'Seguridad',
  /** Preferencias */
  PREFERENCES: 'Preferencias',
  /** Cerrar sesion */
  LOGOUT: 'Cerrar Sesion',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH MODAL
// ═══════════════════════════════════════════════════════════════════════════
export const SEARCH_MODAL_LABELS = {
  /** Placeholder por defecto */
  DEFAULT_PLACEHOLDER: 'Buscar...',
  /** Texto de escape */
  ESCAPE: 'ESC',
  /** Buscando... */
  SEARCHING: (query: string) => `Buscando "${query}"...`,
  /** Titulo acceso rapido */
  QUICK_ACCESS: 'Acceso rapido',
  /** Descripcion del atajo */
  SHORTCUT_DESCRIPTION: 'para abrir busqueda global',
  /** Seleccionar */
  SELECT: 'Seleccionar',
  /** Navegar */
  NAVIGATE: 'Navegar',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMMON
// ═══════════════════════════════════════════════════════════════════════════
export const COMMON_LABELS = {
  /** Cargando */
  LOADING: 'Cargando...',
  /** Error */
  ERROR: 'Error',
  /** Sin datos */
  NO_DATA: 'Sin datos',
  /** Guardar */
  SAVE: 'Guardar',
  /** Cancelar */
  CANCEL: 'Cancelar',
  /** Eliminar */
  DELETE: 'Eliminar',
  /** Editar */
  EDIT: 'Editar',
  /** Crear */
  CREATE: 'Crear',
  /** Ver */
  VIEW: 'Ver',
  /** Volver */
  BACK: 'Volver',
  /** Acciones */
  ACTIONS: 'Acciones',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════
export const ROUTES = {
  DASHBOARD: '/dashboard',
  PROFILE: '/perfil',
  PROFILE_SECURITY: '/perfil/seguridad',
  PROFILE_PREFERENCES: '/perfil/preferencias',
  NOTIFICATIONS: '/auditoria/notificaciones',
  PROVEEDOR_PORTAL: '/proveedor-portal',
} as const;
