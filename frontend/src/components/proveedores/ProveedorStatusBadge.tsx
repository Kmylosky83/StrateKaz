import { Badge } from '@/components/common/Badge';

interface ProveedorStatusBadgeProps {
  isActive: boolean;
}

export const ProveedorStatusBadge = ({ isActive }: ProveedorStatusBadgeProps) => {
  return isActive ? (
    <Badge variant="success">Activo</Badge>
  ) : (
    <Badge variant="gray">Inactivo</Badge>
  );
};
