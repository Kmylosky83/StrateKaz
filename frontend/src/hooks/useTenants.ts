/**
 * useTenants - Hook para gestión de tenants del usuario
 *
 * Obtiene la lista de empresas a las que el usuario tiene acceso
 * y permite seleccionar una para redirigir al subdominio correspondiente.
 */
import { useState, useCallback } from 'react';
import { tenantAPI } from '@/api/tenant.api';
import { useAuthStore } from '@/store/authStore';
import type { TenantUserAccess, UserTenantsResponse } from '@/types/tenant.types';

interface UseTenantState {
  tenants: TenantUserAccess[];
  lastTenantId: number | null;
  isLoading: boolean;
  error: string | null;
}

interface UseTenantActions {
  fetchTenants: () => Promise<UserTenantsResponse | null>;
  selectTenant: (tenantId: number) => Promise<string | null>;
  reset: () => void;
}

export const useTenants = (): UseTenantState & UseTenantActions => {
  const [state, setState] = useState<UseTenantState>({
    tenants: [],
    lastTenantId: null,
    isLoading: false,
    error: null,
  });

  /**
   * Obtiene los tenants del usuario autenticado
   */
  const fetchTenants = useCallback(async (): Promise<UserTenantsResponse | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await tenantAPI.getUserTenants();
      setState({
        tenants: response.tenants,
        lastTenantId: response.last_tenant_id,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error: unknown) {
      const errorMessage =
        error.response?.data?.detail || 'Error al obtener empresas';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  /**
   * Selecciona un tenant y obtiene la URL de redirección
   */
  const selectTenant = useCallback(
    async (tenantId: number): Promise<string | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await tenantAPI.selectTenant({ tenant_id: tenantId });
        // Actualizar el contexto del tenant en el store global
        useAuthStore.getState().setCurrentTenantId(tenantId);
        setState((prev) => ({ ...prev, isLoading: false }));
        return response.redirect_url;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.detail || 'Error al seleccionar empresa';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    []
  );

  /**
   * Reinicia el estado
   */
  const reset = useCallback(() => {
    setState({
      tenants: [],
      lastTenantId: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetchTenants,
    selectTenant,
    reset,
  };
};
