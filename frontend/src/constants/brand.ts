/**
 * Constantes de Marca StrateKaz
 *
 * SINGLE SOURCE OF TRUTH para toda la identidad de marca del software.
 * Estos valores son FIJOS y NO provienen de la BD del cliente.
 *
 * La versión se inyecta desde package.json en build time via Vite.
 *
 * Uso:
 * ```tsx
 * import { BRAND, APP_VERSION } from '@/constants/brand';
 *
 * <p>Powered by {BRAND.name}</p>
 * <p>Version {APP_VERSION}</p>
 * ```
 */

/**
 * Versión de la aplicación
 * Se inyecta desde package.json en build time via Vite define
 * Fallback a '0.0.0' solo en caso de error de configuración
 */
export const APP_VERSION: string =
  (import.meta.env.VITE_APP_VERSION as string) ||
  (import.meta.env.PACKAGE_VERSION as string) ||
  '3.5.2';

/**
 * Constantes de identidad de marca StrateKaz
 * Estos valores son FIJOS y representan la marca del software
 */
export const BRAND = {
  /** Nombre completo del software */
  name: 'StrateKaz',

  /** Nombre corto para espacios reducidos */
  shortName: 'StrateKaz',

  /** Slogan del software */
  slogan: 'Sistema de Gestión Integral',

  /** Descripción para SEO y PWA */
  description:
    'Sistema integral de gestión empresarial para empresas colombianas con cumplimiento normativo (SG-SST, PESV, ISO 9001/14001/45001).',

  /** Sitio web oficial */
  website: 'https://www.stratekaz.com',

  /** Propietario/Copyright */
  copyright: 'Kmylosky',

  /** Email de soporte */
  supportEmail: 'soporte@stratekaz.com',

  /** Logos (rutas relativas desde public/) */
  logos: {
    /** Logo para tema claro */
    light: '/logo-dark.png',
    /** Logo para tema oscuro */
    dark: '/logo-light.png',
    /** Favicon */
    favicon: '/favicon.ico',
    /** Logo para PWA (192x192) */
    pwa192: '/pwa-192x192.png',
    /** Logo para PWA (512x512) */
    pwa512: '/pwa-512x512.png',
    /** Logo para Apple Touch */
    appleTouchIcon: '/apple-touch-icon-180x180.png',
  },

  /** Colores de marca StrateKaz (Design System) */
  colors: {
    /** Color primario - Rosa StrateKaz (usado en botones principales, acciones primarias) */
    primary: '#ec268f',
    /** Color secundario - Gris neutro (usado en textos, bordes, elementos secundarios) */
    secondary: '#6b7280',
    /** Color de acento - Amarillo/Ámbar (usado en destacados, estados warning) */
    accent: '#f59e0b',
    /** Color terciario - Gris oscuro (usado en fondos, bordes) */
    tertiary: '#374151',
    /** Color de fondo del tema */
    background: '#ffffff',
    /** Color del tema para PWA (usa primary rosa) */
    theme: '#ec268f',
  },
} as const;

/**
 * Valores por defecto para nuevos Tenants
 * Usado en Admin Global al crear empresas
 */
export const TENANT_DEFAULTS = {
  /** Color primario por defecto para nuevos tenants (Rosa StrateKaz) */
  primaryColor: '#ec268f',
  /** Días de trial por defecto */
  trialDays: 14,
  /** Usuarios máximos por defecto */
  maxUsers: 5,
  /** Storage máximo por defecto (GB) */
  maxStorageGb: 5,
  /** Módulos habilitados por defecto */
  enabledModules: [
    'gestion_estrategica',
    'sst',
    'pesv',
    'ambiental',
    'calidad',
  ],
} as const;

/**
 * Configuración PWA
 * Valores por defecto para el manifest cuando no hay branding dinámico
 */
export const PWA_DEFAULTS = {
  name: BRAND.name,
  shortName: BRAND.shortName,
  description: BRAND.description,
  themeColor: BRAND.colors.theme,
  backgroundColor: BRAND.colors.background,
  display: 'standalone' as const,
  orientation: 'portrait' as const,
  scope: '/',
  startUrl: '/',
} as const;

// Type exports para uso en otros archivos
export type Brand = typeof BRAND;
export type PWADefaults = typeof PWA_DEFAULTS;
