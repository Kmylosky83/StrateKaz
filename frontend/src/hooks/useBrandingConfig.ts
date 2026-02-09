/**
 * Hook global para acceder a la configuración de branding activa
 *
 * Proporciona acceso fácil a:
 * - Nombre de la empresa (company_name, company_short_name)
 * - Logos (logo, logo_white, favicon, login_background)
 * - Colores (primary_color, secondary_color, accent_color)
 * - Eslogan (company_slogan)
 * - Versión de la app (app_version)
 *
 * Uso:
 * ```tsx
 * const { branding, isLoading, logo, logoWhite, companyName, appVersion } = useBrandingConfig();
 * ```
 */
import { useActiveBranding } from '@/features/gestion-estrategica/hooks/useStrategic';
import type { BrandingConfig } from '@/features/gestion-estrategica/types/strategic.types';

// Valores por defecto cuando no hay branding configurado
const DEFAULT_BRANDING: Partial<BrandingConfig> = {
  company_name: 'StrateKaz | Consultoría 4.0',
  company_short_name: 'StrateKaz',
  company_slogan: 'Sistema Integrado de Gestión',

  // Logos
  logo: '/logo-dark.png',
  logo_white: '/logo-light.png',
  logo_dark: null,
  favicon: '/logo-dark.png',
  login_background: null,

  // Colores principales
  primary_color: '#ec268f',
  secondary_color: '#000000',
  accent_color: '#f4ec25',

  // Colores de interfaz (consolidados)
  sidebar_color: '#1E293B',
  background_color: '#F5F5F5',
  showcase_background: '#1F2937',

  // Gradientes para presentaciones
  gradient_mission: 'from-blue-500 to-purple-600',
  gradient_vision: 'from-green-500 to-teal-600',
  gradient_policy: 'from-amber-500 to-orange-600',
  gradient_values: [],

  app_version: '2.4.0',

  // PWA defaults - se usan favicon como fallback para iconos PWA
  pwa_name: 'StrateKaz',
  pwa_short_name: 'StrateKaz',
  pwa_description: 'Sistema Integrado de Gestión',
  pwa_theme_color: '#ec268f',
  pwa_background_color: '#ffffff',
  pwa_icon_192: null,
  pwa_icon_512: null,
  pwa_icon_maskable: null,
};

export interface UseBrandingConfigReturn {
  // Data completa
  branding: BrandingConfig | null;
  isLoading: boolean;
  isError: boolean;

  // Helpers para acceso rápido
  companyName: string;
  companyShortName: string;
  companySlogan: string;

  // Logos con fallback a defaults
  logo: string;
  logoWhite: string;
  logoDark: string | null;
  favicon: string;
  loginBackground: string | null;

  // Colores principales
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Colores de interfaz (consolidados)
  sidebarColor: string;
  backgroundColor: string;
  showcaseBackground: string;

  // Gradientes para presentaciones
  gradientMission: string;
  gradientVision: string;
  gradientPolicy: string;
  gradientValues: string[];

  // Versión de la app
  appVersion: string;

  // PWA (Progressive Web App)
  pwaName: string;
  pwaShortName: string;
  pwaDescription: string;
  pwaThemeColor: string;
  pwaBackgroundColor: string;
  pwaIcon192: string | null;
  pwaIcon512: string | null;
  pwaIconMaskable: string | null;

  // Función para obtener logo según tema
  getLogoForTheme: (theme: 'light' | 'dark') => string;
}

export const useBrandingConfig = (): UseBrandingConfigReturn => {
  const { data: rawBranding, isLoading, isError } = useActiveBranding();

  // Cuando hay error (ej: sin tenant en Admin Global), React Query puede
  // conservar datos stale del tenant anterior. Forzar null para usar defaults.
  // También limpiar cache localStorage para evitar flash con branding incorrecto
  if (isError) {
    try { localStorage.removeItem('last_branding'); } catch { /* ignore */ }
  }
  const branding = isError ? null : rawBranding;

  // Helpers con fallback a defaults
  const companyName = branding?.company_name || DEFAULT_BRANDING.company_name!;
  const companyShortName = branding?.company_short_name || DEFAULT_BRANDING.company_short_name!;
  const companySlogan = branding?.company_slogan || DEFAULT_BRANDING.company_slogan!;

  // Logos con fallback - verificar que no sean null/undefined/empty string
  const logo =
    branding?.logo && branding.logo.trim() !== '' ? branding.logo : DEFAULT_BRANDING.logo!;
  const logoWhite =
    branding?.logo_white && branding.logo_white.trim() !== ''
      ? branding.logo_white
      : DEFAULT_BRANDING.logo_white!;
  const logoDark =
    branding?.logo_dark && branding.logo_dark.trim() !== '' ? branding.logo_dark : null;
  const favicon =
    branding?.favicon && branding.favicon.trim() !== ''
      ? branding.favicon
      : DEFAULT_BRANDING.favicon!;

  // Imagen de fondo del login (puede ser null)
  const loginBackground =
    branding?.login_background && branding.login_background.trim() !== ''
      ? branding.login_background
      : null;

  // Colores principales
  const primaryColor = branding?.primary_color || DEFAULT_BRANDING.primary_color!;
  const secondaryColor = branding?.secondary_color || DEFAULT_BRANDING.secondary_color!;
  const accentColor = branding?.accent_color || DEFAULT_BRANDING.accent_color!;

  // Colores de interfaz (consolidados)
  const sidebarColor = branding?.sidebar_color || DEFAULT_BRANDING.sidebar_color!;
  const backgroundColor = branding?.background_color || DEFAULT_BRANDING.background_color!;
  const showcaseBackground = branding?.showcase_background || DEFAULT_BRANDING.showcase_background!;

  // Gradientes para presentaciones
  const gradientMission = branding?.gradient_mission || DEFAULT_BRANDING.gradient_mission!;
  const gradientVision = branding?.gradient_vision || DEFAULT_BRANDING.gradient_vision!;
  const gradientPolicy = branding?.gradient_policy || DEFAULT_BRANDING.gradient_policy!;
  const gradientValues = branding?.gradient_values || DEFAULT_BRANDING.gradient_values!;

  // Versión de la app
  const appVersion = branding?.app_version || DEFAULT_BRANDING.app_version!;

  // PWA (Progressive Web App) - con fallback a defaults o favicon
  const pwaName = branding?.pwa_name || branding?.company_name || DEFAULT_BRANDING.pwa_name!;
  const pwaShortName = branding?.pwa_short_name || branding?.company_short_name || DEFAULT_BRANDING.pwa_short_name!;
  const pwaDescription = branding?.pwa_description || branding?.company_slogan || DEFAULT_BRANDING.pwa_description!;
  const pwaThemeColor = branding?.pwa_theme_color || branding?.primary_color || DEFAULT_BRANDING.pwa_theme_color!;
  const pwaBackgroundColor = branding?.pwa_background_color || DEFAULT_BRANDING.pwa_background_color!;

  // Iconos PWA con fallback a favicon
  const pwaIcon192 = branding?.pwa_icon_192 && branding.pwa_icon_192.trim() !== ''
    ? branding.pwa_icon_192
    : (branding?.favicon && branding.favicon.trim() !== '' ? branding.favicon : null);
  const pwaIcon512 = branding?.pwa_icon_512 && branding.pwa_icon_512.trim() !== ''
    ? branding.pwa_icon_512
    : (branding?.favicon && branding.favicon.trim() !== '' ? branding.favicon : null);
  const pwaIconMaskable = branding?.pwa_icon_maskable && branding.pwa_icon_maskable.trim() !== ''
    ? branding.pwa_icon_maskable
    : null;

  // Función para obtener el logo correcto según el tema
  const getLogoForTheme = (theme: 'light' | 'dark'): string => {
    // En tema oscuro, usamos logo_white (logo claro para fondo oscuro)
    // En tema claro, usamos logo (logo oscuro para fondo claro)
    return theme === 'dark' ? logoWhite : logo;
  };

  return {
    branding: branding || null,
    isLoading,
    isError,
    companyName,
    companyShortName,
    companySlogan,
    // Logos
    logo,
    logoWhite,
    logoDark,
    favicon,
    loginBackground,
    // Colores principales
    primaryColor,
    secondaryColor,
    accentColor,
    // Colores de interfaz (consolidados)
    sidebarColor,
    backgroundColor,
    showcaseBackground,
    // Gradientes
    gradientMission,
    gradientVision,
    gradientPolicy,
    gradientValues,
    // Versión
    appVersion,
    // PWA
    pwaName,
    pwaShortName,
    pwaDescription,
    pwaThemeColor,
    pwaBackgroundColor,
    pwaIcon192,
    pwaIcon512,
    pwaIconMaskable,
    getLogoForTheme,
  };
};

export default useBrandingConfig;
