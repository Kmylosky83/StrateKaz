/**
 * Hook para determinar si el usuario actual tiene un proveedor vinculado.
 * Usado para habilitar queries del portal de proveedores.
 */
import { useAuthStore } from '@/store/authStore';
import { isPortalOnlyUser } from '@/utils/portalUtils';

export function useHasProveedor() {
  const user = useAuthStore((s) => s.user);
  return Boolean(user?.proveedor) || isPortalOnlyUser(user);
}
