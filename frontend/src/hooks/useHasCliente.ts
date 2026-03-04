/**
 * Hook para determinar si el usuario actual tiene un cliente vinculado.
 * Usado para habilitar queries del portal de clientes.
 */
import { useAuthStore } from '@/store/authStore';
import { isClientePortalUser } from '@/utils/portalUtils';

export function useHasCliente() {
  const user = useAuthStore((s) => s.user);
  return Boolean(user?.cliente) || isClientePortalUser(user);
}
