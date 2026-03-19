/**
 * Query Keys para Mi Equipo
 *
 * Re-exporta thKeys de talent-hub como punto único de acoplamiento.
 * Cuando Mi Equipo tenga API propia, reemplazar las re-exportaciones
 * por query keys independientes.
 */
export { thKeys } from '@/features/talent-hub/api/queryKeys';
