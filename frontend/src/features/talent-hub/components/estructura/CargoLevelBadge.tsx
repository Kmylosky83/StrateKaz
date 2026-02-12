/**
 * Badge que muestra el nivel jerarquico de un cargo con colores consistentes
 */
import { Badge } from '@/components/common/Badge';
import { NivelJerarquico, NivelJerarquicoLabels } from '@/features/configuracion/types/rbac.types';

interface CargoLevelBadgeProps {
  level: NivelJerarquico;
  showLabel?: boolean;
  className?: string;
}

// Mapear nivel jerarquico a variant del Badge
const levelToVariant: Record<
  NivelJerarquico,
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
> = {
  ESTRATEGICO: 'primary', // purple -> primary
  TACTICO: 'info', // blue -> info
  OPERATIVO: 'success', // green -> success
  APOYO: 'gray', // gray -> gray
  EXTERNO: 'warning', // orange/yellow -> contratistas, consultores
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
