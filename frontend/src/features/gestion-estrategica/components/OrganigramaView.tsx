/**
 * Vista del Organigrama - Visualización de estructura organizacional
 *
 * Componente principal que muestra el organigrama interactivo de la empresa
 * usando React Flow para visualización y dagre para layout automático.
 *
 * Props opcionales permiten filtrar modos de vista:
 * - allowedModes: ['areas'] para Mapa de Procesos
 * - allowedModes: ['cargos', 'compact'] para Organigrama de Cargos
 * - Sin props: muestra todos los modos (areas, cargos, compact)
 */

import { OrganigramaCanvas } from './organigrama';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { EmptyState } from '@/components/common/EmptyState';
import { Lock } from 'lucide-react';
import type { ViewMode } from '../types/organigrama.types';

interface OrganigramaViewProps {
  /** Modos de vista permitidos */
  allowedModes?: ViewMode[];
  /** Modo de vista inicial */
  defaultMode?: ViewMode;
  /** Mostrar toolbar completo (true) o mini-toolbar con solo export + fit (false) */
  showToolbar?: boolean;
}

export const OrganigramaView = ({
  allowedModes,
  defaultMode,
  showToolbar,
}: OrganigramaViewProps) => {
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

  return (
    <OrganigramaCanvas
      allowedModes={allowedModes}
      defaultMode={defaultMode}
      showToolbar={showToolbar}
    />
  );
};

export default OrganigramaView;
