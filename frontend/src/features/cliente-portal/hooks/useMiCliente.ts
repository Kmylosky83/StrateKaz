/**
 * Hooks React Query para el Portal de Clientes — Mi Cliente
 */
import { useQuery } from '@tanstack/react-query';
import { useHasCliente } from '@/hooks/useHasCliente';
import { fetchMiCliente, fetchMisContactos, fetchMiScoring } from '../api/miCliente.api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const miClienteKeys = {
  all: ['mi-cliente'] as const,
  info: () => [...miClienteKeys.all, 'info'] as const,
  contactos: () => [...miClienteKeys.all, 'contactos'] as const,
  scoring: () => [...miClienteKeys.all, 'scoring'] as const,
};

// ============================================================================
// HOOKS — QUERIES
// ============================================================================

/** Datos del cliente vinculado al usuario */
export function useMiCliente() {
  const hasCliente = useHasCliente();

  return useQuery({
    queryKey: miClienteKeys.info(),
    queryFn: fetchMiCliente,
    enabled: hasCliente,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/** Contactos del cliente vinculado */
export function useMisContactos() {
  const hasCliente = useHasCliente();

  return useQuery({
    queryKey: miClienteKeys.contactos(),
    queryFn: fetchMisContactos,
    enabled: hasCliente,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/** Scoring del cliente vinculado */
export function useMiScoring() {
  const hasCliente = useHasCliente();

  return useQuery({
    queryKey: miClienteKeys.scoring(),
    queryFn: fetchMiScoring,
    enabled: hasCliente,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
