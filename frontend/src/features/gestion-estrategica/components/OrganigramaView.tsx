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
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { EmptyState } from '@/components/common/EmptyState';
import { Lock } from 'lucide-react';

export const OrganigramaView = () => {
  const { canDo } = usePermissions();
  const canView = canDo(Modules.GESTION_ESTRATEGICA, Sections.ORGANIGRAMA, 'view');

  if (!canView) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<Lock className="w-12 h-12 text-gray-400" />}
          title="Acceso Restringido"
          description="No tiene permisos para visualizar el organigrama."
        />
      </div>
    );
  }

  return <OrganigramaCanvas />;
};

export default OrganigramaView;
