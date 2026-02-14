/**
 * OrganigramaSection - Organigrama en Talento Humano
 *
 * Re-exporta el OrganigramaView desde gestion-estrategica.
 * El organigrama visualiza la jerarquía de cargos y áreas,
 * por lo que tiene más sentido junto a Estructura de Cargos.
 *
 * El backend endpoint sigue en /api/organizacion/organigrama/ (read-only, compartido).
 */
export { OrganigramaView as OrganigramaSection } from '@/features/gestion-estrategica/components/OrganigramaView';
