/**
 * Hook para determinar si el usuario actual tiene un cargo externo.
 * Usado para filtrar secciones en Mi Portal, Mi Equipo, etc.
 */
import { useAuthStore } from '@/store/authStore';

export function useIsExterno() {
  const { user } = useAuthStore();

  const isExterno = user?.cargo?.is_externo ?? false;
  const isInterno = !isExterno;
  const isJefatura = user?.cargo?.is_jefatura ?? false;
  const cargoNivel = user?.cargo?.level_display ?? null;

  return { isExterno, isInterno, isJefatura, cargoNivel };
}
