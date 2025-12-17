/**
 * Hook global para acceder a la configuración de branding activa
 *
 * Proporciona acceso fácil a:
 * - Nombre de la empresa (company_name, company_short_name)
 * - Logos (logo, logo_white, favicon)
 * - Colores (primary_color, secondary_color, accent_color)
 * - Eslogan (company_slogan)
 *
 * Uso:
 * ```tsx
 * const { branding, isLoading, logo, logoWhite, companyName } = useBrandingConfig();
 * ```
 */
import { useActiveBranding } from '@/features/gestion-estrategica/hooks/useStrategic';
import type { BrandingConfig } from '@/features/gestion-estrategica/types/strategic.types';

// Valores por defecto cuando no hay branding configurado
const DEFAULT_BRANDING: Partial<BrandingConfig> = {
  company_name: 'Sistema de Gestión',
  company_short_name: 'SGI',
  company_slogan: '',
  logo: '/logo-dark.png',
  logo_white: '/logo-ligth.png',
  favicon: '/vite.svg', // Temporal hasta que se suba favicon.ico
  primary_color: '#16A34A',
  secondary_color: '#059669',
  accent_color: '#10B981',
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

  // Colores
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Función para obtener logo según tema
  getLogoForTheme: (theme: 'light' | 'dark') => string;
}

export const useBrandingConfig = (): UseBrandingConfigReturn => {
  const { data: branding, isLoading, isError } = useActiveBranding();

  // Helpers con fallback a defaults
  const companyName = branding?.company_name || DEFAULT_BRANDING.company_name!;
  const companyShortName = branding?.company_short_name || DEFAULT_BRANDING.company_short_name!;
  const companySlogan = branding?.company_slogan || DEFAULT_BRANDING.company_slogan!;

  // Logos con fallback - verificar que no sean null/undefined/empty
  const logo = branding?.logo || DEFAULT_BRANDING.logo!;
  const logoWhite = branding?.logo_white || DEFAULT_BRANDING.logo_white!;
  const favicon = branding?.favicon || DEFAULT_BRANDING.favicon!;

  // Colores
  const primaryColor = branding?.primary_color || DEFAULT_BRANDING.primary_color!;
  const secondaryColor = branding?.secondary_color || DEFAULT_BRANDING.secondary_color!;
  const accentColor = branding?.accent_color || DEFAULT_BRANDING.accent_color!;

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
    primaryColor,
    secondaryColor,
    accentColor,
    getLogoForTheme,
  };
};

export default useBrandingConfig;
