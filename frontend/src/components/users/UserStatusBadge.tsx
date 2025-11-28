import { Badge } from '@/components/common/Badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface UserStatusBadgeProps {
  isActive: boolean;
}

export const UserStatusBadge = ({ isActive }: UserStatusBadgeProps) => {
  return (
    <Badge
      variant={isActive ? 'success' : 'gray'}
      className="inline-flex items-center gap-1"
    >
      {isActive ? (
        <>
          <CheckCircle className="w-3 h-3" />
          Activo
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          Inactivo
        </>
      )}
    </Badge>
  );
};
