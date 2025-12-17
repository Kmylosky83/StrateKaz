/**
 * Hook para persistencia de última ruta visitada
 * y landing inteligente según rol del usuario
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CargoCodes } from '@/constants/permissions';

const LAST_ROUTE_KEY = 'last_route';

// Rutas que no deben guardarse como "última ruta"
const EXCLUDED_ROUTES = ['/login', '/logout', '/404', '/unauthorized'];

// Landing pages por rol (cuando no hay última ruta)
const ROLE_LANDING_PAGES: Record<string, string> = {
  superadmin: '/gestion-estrategica/configuracion',
  [CargoCodes.GERENTE]: '/gestion-estrategica/configuracion',
  [CargoCodes.ADMIN]: '/gestion-estrategica/configuracion',
  // Roles de EcoNorte
  [CargoCodes.LIDER_COMERCIAL_ECONORTE]: '/econorte/ecoaliados',
  [CargoCodes.COMERCIAL_ECONORTE]: '/econorte/ecoaliados',
  [CargoCodes.LIDER_LOGISTICA_ECONORTE]: '/econorte/ecoaliados',
  [CargoCodes.RECOLECTOR_ECONORTE]: '/econorte/ecoaliados',
  // Roles de Compras/Comercial
  [CargoCodes.LIDER_COMERCIAL]: '/proveedores/materia-prima',
  [CargoCodes.LIDER_COMPRAS]: '/proveedores/materia-prima',
  // Roles de Planta
  [CargoCodes.JEFE_PLANTA]: '/planta/recepciones',
  [CargoCodes.SUPERVISOR_PLANTA]: '/planta/recepciones',
  [CargoCodes.OPERADOR_BASCULA]: '/planta/recepciones',
  // Roles de SST/Calidad
  [CargoCodes.LIDER_SST]: '/gestion-integral/sst',
  [CargoCodes.PROFESIONAL_SST]: '/gestion-integral/sst',
  [CargoCodes.LIDER_CALIDAD]: '/gestion-integral/calidad',
  [CargoCodes.PROFESIONAL_CALIDAD]: '/gestion-integral/calidad',
  [CargoCodes.PROFESIONAL_AMBIENTAL]: '/gestion-integral/ambiental',
  // Roles de Apoyo
  [CargoCodes.LIDER_TALENTO_HUMANO]: '/procesos-apoyo/talento-humano',
};

// Landing por defecto si el rol no está mapeado
const DEFAULT_LANDING = '/gestion-estrategica/configuracion';

/**
 * Guarda la ruta actual en localStorage
 */
export const saveLastRoute = (path: string): void => {
  if (!EXCLUDED_ROUTES.some((excluded) => path.startsWith(excluded))) {
    try {
      localStorage.setItem(LAST_ROUTE_KEY, path);
    } catch {
      // Ignorar errores de localStorage
    }
  }
};

/**
 * Obtiene la última ruta guardada
 */
export const getLastRoute = (): string | null => {
  try {
    return localStorage.getItem(LAST_ROUTE_KEY);
  } catch {
    return null;
  }
};

/**
 * Limpia la última ruta (útil al cerrar sesión)
 */
export const clearLastRoute = (): void => {
  try {
    localStorage.removeItem(LAST_ROUTE_KEY);
  } catch {
    // Ignorar errores
  }
};

/**
 * Obtiene la landing page según el rol del usuario
 */
export const getLandingByRole = (cargoCode?: string): string => {
  if (!cargoCode) return DEFAULT_LANDING;
  return ROLE_LANDING_PAGES[cargoCode] || DEFAULT_LANDING;
};

/**
 * Hook que guarda automáticamente la ruta actual
 */
export const useRouteTracker = (): void => {
  const location = useLocation();

  useEffect(() => {
    saveLastRoute(location.pathname);
  }, [location.pathname]);
};

/**
 * Hook para redirigir al usuario a su landing apropiada
 * Usa última ruta si existe, sino landing por rol
 */
export const useSmartRedirect = (): void => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  useEffect(() => {
    // Solo actuar en la raíz o rutas de redirect
    if (location.pathname !== '/' && location.pathname !== '/redirect') {
      return;
    }

    const lastRoute = getLastRoute();
    const landingByRole = getLandingByRole(user?.cargo_code);

    // Prioridad: última ruta > landing por rol
    const targetRoute = lastRoute || landingByRole;

    navigate(targetRoute, { replace: true });
  }, [location.pathname, user?.cargo_code, navigate]);
};
