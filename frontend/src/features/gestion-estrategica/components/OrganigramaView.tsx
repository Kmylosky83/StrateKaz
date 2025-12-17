/**
 * Vista del Organigrama - Visualización de estructura organizacional
 *
 * Componente principal que muestra el organigrama interactivo de la empresa
 * usando React Flow para visualización y dagre para layout automático.
 *
 * Modos de vista:
 * - Por Áreas: Muestra áreas con sus cargos agrupados
 * - Por Cargos: Muestra jerarquía de cargos (por nivel jerárquico)
 * - Compacto: Vista resumida para impresión
 *
 * Funcionalidades:
 * - Zoom y pan interactivo
 * - Búsqueda de áreas y cargos
 * - Filtros por nivel jerárquico
 * - Exportación a PNG y PDF
 * - Layout automático vertical/horizontal
 */

import { OrganigramaCanvas } from './organigrama';

export const OrganigramaView = () => {
  return <OrganigramaCanvas />;
};

export default OrganigramaView;
