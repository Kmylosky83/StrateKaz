import { Badge } from '@/components/common/Badge';
import type { SubtipoMateria } from '@/types/proveedores.types';

interface SubtipoMateriaBadgeProps {
  subtipo: SubtipoMateria;
}

export const SubtipoMateriaBadge = ({ subtipo }: SubtipoMateriaBadgeProps) => {
  const getConfig = () => {
    switch (subtipo) {
      case 'SEBO':
        return { variant: 'danger' as const, label: 'Sebo' };
      case 'HUESO':
        return { variant: 'gray' as const, label: 'Hueso' };
      case 'ACU':
        return { variant: 'warning' as const, label: 'ACU' };
      default:
        return { variant: 'info' as const, label: subtipo };
    }
  };

  const config = getConfig();

  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
};
