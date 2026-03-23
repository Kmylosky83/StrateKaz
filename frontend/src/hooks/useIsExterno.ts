/**
 * Hook para determinar si el usuario actual tiene un cargo externo.
 * Usado para filtrar secciones en Mi Portal, Mi Equipo, etc.
 *
 * Detección granular:
 * - isExterno: cargo marcado como externo (contratista, consultor, auditor)
 * - isProveedor: usuario vinculado a un proveedor (user.proveedor)
 * - isCliente: usuario vinculado a un cliente (user.cliente)
 * - isInterno: no es externo
 * - isJefatura: cargo con rol de jefatura
 */
import { useAuthStore } from '@/store/authStore';

export function useIsExterno() {
  const { user } = useAuthStore();

  const isExterno = user?.cargo?.is_externo ?? false;
  const isInterno = !isExterno;
  const isJefatura = user?.cargo?.is_jefatura ?? false;
  const cargoNivel = user?.cargo?.level_display ?? null;

  // Detección granular de tipo de entidad externa vinculada
  const isProveedor = !!user?.proveedor;
  const isCliente = !!user?.cliente;

  return { isExterno, isInterno, isJefatura, cargoNivel, isProveedor, isCliente };
}
