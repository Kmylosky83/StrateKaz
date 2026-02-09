/**
 * QueryClient singleton para React Query
 *
 * Exportado por separado para permitir:
 * - Acceso desde stores (Zustand) para invalidar cache al cambiar tenant
 * - Consistencia en toda la aplicación
 *
 * IMPORTANTE: Cuando cambia el tenant, se debe llamar invalidateAllQueries()
 * para limpiar los datos del tenant anterior.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

/**
 * Invalida TODAS las queries - usar al cambiar de tenant
 * Esto fuerza que todas las queries se re-ejecuten con el nuevo X-Tenant-ID
 */
export const invalidateAllQueries = () => {
  queryClient.invalidateQueries();
};

/**
 * Limpia todo el cache - usar al hacer logout
 */
export const clearAllQueries = () => {
  queryClient.clear();
};

/**
 * Invalida queries específicas relacionadas con branding
 */
export const invalidateBrandingQueries = () => {
  queryClient.invalidateQueries({ queryKey: ['branding'] });
  queryClient.invalidateQueries({ queryKey: ['brandings'] });
};

export default queryClient;
