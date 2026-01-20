/**
 * Hook para aplicar colores dinámicos del branding al tema
 *
 * Inyecta CSS variables en :root basándose en la configuración de branding
 * Permite que los colores cambien en tiempo real sin recompilar Tailwind
 *
 * NOTA: Este hook solo aplica colores cuando el usuario está autenticado.
 * Antes del login, se usan los colores por defecto definidos en tailwind.config.js
 */
import { useEffect } from 'react';
import { useBrandingConfig } from './useBrandingConfig';

/**
 * Convierte un color HEX a valores RGB separados
 * @param hex - Color en formato #RRGGBB
 * @returns string con "R G B" separados por espacio
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '236 38 143'; // Default rosa StrateKaz #ec268f
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

/**
 * Genera variantes de color (más claras y más oscuras)
 * @param hex - Color base en formato HEX
 * @returns Objeto con variantes del color o null si el color no es válido
 */
function generateColorVariants(
  hex: string
): Record<number, { r: number; g: number; b: number }> | null {
  // Validar que hex sea un string válido
  if (!hex || typeof hex !== 'string') {
    console.warn('[useDynamicTheme] Color inválido recibido:', hex);
    return null;
  }

  // Normalizar: agregar # si no lo tiene
  const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;

  // Validar formato HEX completo (#RRGGBB)
  const hexRegex = /^#([A-Fa-f0-9]{6})$/;
  if (!hexRegex.test(normalizedHex)) {
    console.warn('[useDynamicTheme] Formato de color inválido:', hex);
    return null;
  }

  const r = parseInt(normalizedHex.slice(1, 3), 16);
  const g = parseInt(normalizedHex.slice(3, 5), 16);
  const b = parseInt(normalizedHex.slice(5, 7), 16);

  // Función para ajustar luminosidad
  const adjustBrightness = (r: number, g: number, b: number, factor: number) => {
    const adjust = (c: number) => Math.min(255, Math.max(0, Math.round(c + (255 - c) * factor)));
    if (factor > 0) {
      return { r: adjust(r), g: adjust(g), b: adjust(b) };
    } else {
      const darken = (c: number) => Math.min(255, Math.max(0, Math.round(c * (1 + factor))));
      return { r: darken(r), g: darken(g), b: darken(b) };
    }
  };

  return {
    50: adjustBrightness(r, g, b, 0.95),
    100: adjustBrightness(r, g, b, 0.9),
    200: adjustBrightness(r, g, b, 0.75),
    300: adjustBrightness(r, g, b, 0.5),
    400: adjustBrightness(r, g, b, 0.25),
    500: { r, g, b }, // Color base
    600: adjustBrightness(r, g, b, -0.15),
    700: adjustBrightness(r, g, b, -0.3),
    800: adjustBrightness(r, g, b, -0.45),
    900: adjustBrightness(r, g, b, -0.6),
    950: adjustBrightness(r, g, b, -0.75),
  };
}

/**
 * Hook que aplica la configuración dinámica del branding:
 * - Colores como CSS variables
 * - Favicon dinámico
 * - Título de la página
 *
 * Debe usarse en el componente raíz de la aplicación
 */
export function useDynamicTheme() {
  const {
    primaryColor,
    secondaryColor,
    accentColor,
    favicon,
    companyName,
    isLoading,
    isError,
    branding,
  } = useBrandingConfig();

  // Efecto para aplicar favicon, título y meta tags PWA dinámicos
  // MB-001: Todo se carga desde BD para multi-instancia
  useEffect(() => {
    if (isLoading) return;

    // Aplicar favicon - usa 'favicon' del hook que ya incluye fallback
    if (favicon && favicon.trim() !== '') {
      const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
      if (faviconLink) {
        // Agregar timestamp para evitar cache del navegador
        const faviconWithCache = favicon.includes('?')
          ? `${favicon}&_t=${Date.now()}`
          : `${favicon}?_t=${Date.now()}`;
        faviconLink.href = faviconWithCache;

        // Actualizar el type según la extensión del archivo
        if (favicon.endsWith('.png')) {
          faviconLink.type = 'image/png';
        } else if (favicon.endsWith('.svg')) {
          faviconLink.type = 'image/svg+xml';
        } else {
          faviconLink.type = 'image/x-icon';
        }
      }

      // Actualizar apple-touch-icon
      const appleTouchIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement;
      if (appleTouchIcon) {
        appleTouchIcon.href = favicon;
      }
    }

    // Aplicar título - usa 'companyName' del hook que ya incluye fallback
    if (companyName && companyName.trim() !== '') {
      document.title = companyName;

      // Actualizar meta tag de apple-mobile-web-app-title
      const appTitleMeta = document.getElementById('meta-app-title') as HTMLMetaElement;
      if (appTitleMeta) {
        appTitleMeta.content = companyName;
      }

      // Actualizar Open Graph title
      const ogTitle = document.getElementById('og-title') as HTMLMetaElement;
      if (ogTitle) {
        ogTitle.content = companyName;
      }
    }

    // Actualizar theme-color con el color primario
    if (primaryColor && primaryColor.trim() !== '') {
      const themeColorMeta = document.getElementById('meta-theme-color') as HTMLMetaElement;
      if (themeColorMeta) {
        themeColorMeta.content = primaryColor;
      }
    }

    // Actualizar description y OG description si hay slogan
    if (branding?.company_slogan) {
      const description = `${branding.company_slogan} - Sistema Integrado de Gestión`;

      const descMeta = document.getElementById('meta-description') as HTMLMetaElement;
      if (descMeta) {
        descMeta.content = description;
      }

      const ogDesc = document.getElementById('og-description') as HTMLMetaElement;
      if (ogDesc) {
        ogDesc.content = description;
      }
    }

    // Actualizar OG image si hay logo
    if (branding?.logo) {
      const ogImage = document.getElementById('og-image') as HTMLMetaElement;
      if (ogImage) {
        ogImage.content = branding.logo;
      }
    }
  }, [favicon, companyName, primaryColor, branding, isLoading]);

  // Efecto para aplicar colores
  useEffect(() => {
    // No hacer nada si está cargando
    if (isLoading) return;

    // Si hay error o no hay branding (no autenticado), usar defaults
    // Los valores por defecto ya vienen de useBrandingConfig
    if (isError || !branding) {
      // Los colores default ya están aplicados vía CSS/Tailwind
      return;
    }

    // Validar que los colores existan (doble verificación)
    if (!primaryColor || !secondaryColor || !accentColor) return;

    const root = document.documentElement;

    // Generar y aplicar variantes del color primario (solo si es válido)
    const primaryVariants = generateColorVariants(primaryColor);
    if (primaryVariants) {
      Object.entries(primaryVariants).forEach(([shade, { r, g, b }]) => {
        root.style.setProperty(`--color-primary-${shade}`, `${r} ${g} ${b}`);
      });
      root.style.setProperty('--color-primary', hexToRgb(primaryColor));
    }

    // Generar y aplicar variantes del color secundario (solo si es válido)
    const secondaryVariants = generateColorVariants(secondaryColor);
    if (secondaryVariants) {
      Object.entries(secondaryVariants).forEach(([shade, { r, g, b }]) => {
        root.style.setProperty(`--color-secondary-${shade}`, `${r} ${g} ${b}`);
      });
      root.style.setProperty('--color-secondary', hexToRgb(secondaryColor));
    }

    // Generar y aplicar variantes del color de acento (solo si es válido)
    const accentVariants = generateColorVariants(accentColor);
    if (accentVariants) {
      Object.entries(accentVariants).forEach(([shade, { r, g, b }]) => {
        root.style.setProperty(`--color-accent-${shade}`, `${r} ${g} ${b}`);
      });
      root.style.setProperty('--color-accent', hexToRgb(accentColor));
    }
  }, [primaryColor, secondaryColor, accentColor, isLoading, isError, branding]);
}

export default useDynamicTheme;
