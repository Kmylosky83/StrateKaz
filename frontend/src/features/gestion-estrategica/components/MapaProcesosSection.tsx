/**
 * MapaProcesosSection - Mapa de Procesos visual en Organizacion
 *
 * Muestra solo el modo 'areas' del OrganigramaCanvas para visualizar
 * la estructura de procesos/areas de la empresa.
 * Los modos 'cargos' y 'compact' se muestran en TH > Estructura de Cargos.
 */
import { OrganigramaView } from './OrganigramaView';

export const MapaProcesosSection = () => (
  <OrganigramaView allowedModes={['areas']} defaultMode="areas" />
);
