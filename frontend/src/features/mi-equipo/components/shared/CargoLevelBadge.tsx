/**
 * Badge que muestra el nivel jerárquico de un cargo con colores consistentes.
 * Copia local para mi-equipo — evita import directo de talent-hub.
 */
import { Badge } from '@/components/common/Badge';
import { NivelJerarquico, NivelJerarquicoLabels } from '@/features/configuracion/types/rbac.types';

interface CargoLevelBadgeProps {
  level: NivelJerarquico;
  showLabel?: boolean;
  className?: string;
}

const levelToVariant: Record<
  NivelJerarquico,
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
> = {
  ESTRATEGICO: 'primary',
  TACTICO: 'info',
  OPERATIVO: 'success',
  APOYO: 'gray',
  EXTERNO: 'warning',
};

export const CargoLevelBadge = ({ level, showLabel = true, className }: CargoLevelBadgeProps) => {
  const label = NivelJerarquicoLabels[level] || level;
  const variant = levelToVariant[level] || 'gray';

  return (
    <Badge variant={variant} size="sm" className={className}>
      {showLabel ? label : level.substring(0, 3)}
    </Badge>
  );
};
