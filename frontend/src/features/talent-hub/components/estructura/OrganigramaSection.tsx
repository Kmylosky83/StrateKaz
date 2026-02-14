/**
 * OrganigramaSection - Organigrama de Cargos en Talento Humano
 *
 * Muestra solo los modos 'cargos' y 'compact' del OrganigramaCanvas.
 * El modo 'areas' (Mapa de Procesos) se muestra en Organizacion (GE).
 */
import { OrganigramaView } from '@/features/gestion-estrategica/components/OrganigramaView';

export const OrganigramaSection = () => (
  <OrganigramaView allowedModes={['cargos', 'compact']} defaultMode="cargos" showToolbar={false} />
);
