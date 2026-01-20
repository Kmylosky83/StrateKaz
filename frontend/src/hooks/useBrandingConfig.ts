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
  logo: '/logo-dark.png',
  logo_white: '/logo-light.png',
  favicon: '/logo-dark.png',
  login_background: null,
  primary_color: '#ec268f',
  secondary_color: '#000000',
  accent_color: '#f4ec25',
  app_version: '2.4.0',
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
  favicon: string;
  loginBackground: string | null;

  // Colores
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Versión de la app
  appVersion: string;

  // Función para obtener logo según tema
  getLogoForTheme: (theme: 'light' | 'dark') => string;
}

export const useBrandingConfig = (): UseBrandingConfigReturn => {
  const { data: branding, isLoading, isError } = useActiveBranding();

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
  const favicon =
    branding?.favicon && branding.favicon.trim() !== ''
      ? branding.favicon
      : DEFAULT_BRANDING.favicon!;

  // Imagen de fondo del login (puede ser null)
  const loginBackground =
    branding?.login_background && branding.login_background.trim() !== ''
      ? branding.login_background
      : null;

  // Colores
  const primaryColor = branding?.primary_color || DEFAULT_BRANDING.primary_color!;
  const secondaryColor = branding?.secondary_color || DEFAULT_BRANDING.secondary_color!;
  const accentColor = branding?.accent_color || DEFAULT_BRANDING.accent_color!;

  // Versión de la app
  const appVersion = branding?.app_version || DEFAULT_BRANDING.app_version!;

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
    logo,
    logoWhite,
    favicon,
    loginBackground,
    primaryColor,
    secondaryColor,
    accentColor,
    appVersion,
    getLogoForTheme,
  };
};

export default useBrandingConfig;
