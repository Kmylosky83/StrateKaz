import { Badge } from '@/components/common/Badge';
import type { Cargo } from '@/types/users.types';

interface CargoLevelBadgeProps {
  cargo: Cargo | null;
}

const getLevelVariant = (level: number): 'primary' | 'success' | 'warning' | 'danger' => {
  switch (level) {
    case 3:
      return 'danger'; // Rojo - Gerencia (superadmin, gerente, admin)
    case 2:
      return 'warning'; // Naranja - Coordinación (líderes)
    case 1:
      return 'success'; // Verde - Supervisión (supervisor, jefe planta)
    case 0:
      return 'primary'; // Azul - Operativo (comercial, recolector)
    default:
      return 'primary';
  }
};

export const CargoLevelBadge = ({ cargo }: CargoLevelBadgeProps) => {
  if (!cargo) {
    return (
      <Badge variant="gray" size="sm">
        Sin cargo
      </Badge>
    );
  }

  return (
    <Badge variant={getLevelVariant(cargo.level)} size="sm">
      {cargo.name}
    </Badge>
  );
};
