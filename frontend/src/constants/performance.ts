/**
 * Constantes de performance y configuración.
 * Centraliza todos los "magic numbers" del proyecto.
 */

// ============================================
// CACHE & STALE TIME (TanStack Query)
// ============================================

export const CACHE_TIME = {
  /** 1 minuto - datos muy dinámicos */
  SHORT: 1 * 60 * 1000,
  /** 5 minutos - datos moderadamente dinámicos */
  MEDIUM: 5 * 60 * 1000,
  /** 30 minutos - datos estables */
  LONG: 30 * 60 * 1000,
  /** 1 hora - datos casi estáticos */
  EXTENDED: 60 * 60 * 1000,
  /** 1 día - datos estáticos (catálogos) */
  DAY: 24 * 60 * 60 * 1000,
} as const;

export const STALE_TIME = {
  /** Inmediatamente stale */
  NONE: 0,
  /** 30 segundos */
  VERY_SHORT: 30 * 1000,
  /** 1 minuto */
  SHORT: 1 * 60 * 1000,
  /** 5 minutos - default recomendado */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutos */
  LONG: 15 * 60 * 1000,
  /** 1 hora */
  EXTENDED: 60 * 60 * 1000,
} as const;

// ============================================
// TIMEOUTS
// ============================================

export const TIMEOUTS = {
  /** API request timeout (30 segundos) */
  API: 30000,
  /** Upload de archivos grandes (5 minutos) */
  UPLOAD: 5 * 60 * 1000,
  /** Debounce para búsquedas (300ms) */
  DEBOUNCE: 300,
  /** Debounce corto (150ms) */
  DEBOUNCE_SHORT: 150,
  /** Debounce largo (500ms) */
  DEBOUNCE_LONG: 500,
  /** Throttle para scroll/resize (100ms) */
  THROTTLE: 100,
  /** Splash screen mínimo (1.2 segundos) */
  SPLASH_MIN: 1200,
  /** Toast notification (5 segundos) */
  TOAST: 5000,
  /** Toast error (8 segundos) */
  TOAST_ERROR: 8000,
  /** Redirect delay (300ms) */
  REDIRECT: 300,
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  /** Items por página - default */
  DEFAULT_PAGE_SIZE: 10,
  /** Items por página - opciones */
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
  /** Máximo items por página */
  MAX_PAGE_SIZE: 100,
  /** Items para select/autocomplete */
  SELECT_PAGE_SIZE: 50,
} as const;

// ============================================
// RETRY LOGIC
// ============================================

export const RETRY = {
  /** Número de reintentos para queries */
  QUERY_COUNT: 3,
  /** Número de reintentos para mutations */
  MUTATION_COUNT: 1,
  /** Delay base entre reintentos (1 segundo) */
  BASE_DELAY: 1000,
  /** Delay máximo entre reintentos (30 segundos) */
  MAX_DELAY: 30000,
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================

export const ANIMATION = {
  /** Transición muy rápida (100ms) */
  FASTEST: 100,
  /** Transición rápida (150ms) */
  FAST: 150,
  /** Transición normal (200ms) */
  NORMAL: 200,
  /** Transición lenta (300ms) */
  SLOW: 300,
  /** Transición muy lenta (500ms) */
  SLOWEST: 500,
} as const;

// ============================================
// FILE UPLOAD
// ============================================

export const FILE_UPLOAD = {
  /** Tamaño máximo de archivo (10 MB) */
  MAX_SIZE: 10 * 1024 * 1024,
  /** Tamaño máximo de imagen (5 MB) */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  /** Tamaño máximo de documento (25 MB) */
  MAX_DOCUMENT_SIZE: 25 * 1024 * 1024,
  /** Extensiones de imagen permitidas */
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const,
  /** Extensiones de documento permitidas */
  DOCUMENT_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'] as const,
} as const;

// ============================================
// UI BREAKPOINTS (match Tailwind)
// ============================================

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// ============================================
// VALIDATION
// ============================================

export const VALIDATION = {
  /** Longitud mínima de contraseña */
  PASSWORD_MIN_LENGTH: 8,
  /** Longitud máxima de nombre */
  NAME_MAX_LENGTH: 100,
  /** Longitud máxima de descripción */
  DESCRIPTION_MAX_LENGTH: 500,
  /** Longitud máxima de comentario */
  COMMENT_MAX_LENGTH: 1000,
  /** Longitud NIT colombiano */
  NIT_LENGTH: 10,
} as const;

// ============================================
// PWA / SERVICE WORKER
// ============================================

export const PWA = {
  /** Cache de assets estáticos (1 día) */
  STATIC_CACHE_MAX_AGE: 24 * 60 * 60,
  /** Cache de API (5 minutos) */
  API_CACHE_MAX_AGE: 5 * 60,
  /** Número máximo de entries en cache */
  MAX_CACHE_ENTRIES: 100,
} as const;

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  CACHE_TIME,
  STALE_TIME,
  TIMEOUTS,
  PAGINATION,
  RETRY,
  ANIMATION,
  FILE_UPLOAD,
  BREAKPOINTS,
  VALIDATION,
  PWA,
} as const;
