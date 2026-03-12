/**
 * IntegracionStatusBadge - Badge de estado de salud de integración
 *
 * Estados:
 * - Verde: Saludable (última conexión < 24h, sin errores)
 * - Amarillo: Advertencia (última conexión 24h-7d)
 * - Rojo: Error (> 7 días o errores recientes)
 * - Gris: Inactivo
 */
import { Badge } from '@/components/common/Badge';
import { Activity, AlertTriangle, XCircle, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export type IntegracionHealthStatus = 'healthy' | 'warning' | 'error' | 'inactive';

export interface IntegracionStatusBadgeProps {
  status: IntegracionHealthStatus;
  lastConnection?: string;
  errorCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  IntegracionHealthStatus,
  {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'gray';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  healthy: {
    label: 'Saludable',
    variant: 'success',
    icon: Activity,
    color: 'text-success-600 dark:text-success-400',
  },
  warning: {
    label: 'Advertencia',
    variant: 'warning',
    icon: AlertTriangle,
    color: 'text-warning-600 dark:text-warning-400',
  },
  error: {
    label: 'Error',
    variant: 'danger',
    icon: XCircle,
    color: 'text-danger-600 dark:text-danger-400',
  },
  inactive: {
    label: 'Inactivo',
    variant: 'gray',
    icon: Minus,
    color: 'text-gray-500 dark:text-gray-400',
  },
};

export const IntegracionStatusBadge = ({
  status,
  _lastConnection,
  errorCount = 0,
  size = 'md',
  showIcon = true,
  className,
}: IntegracionStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant={config.variant} size={size}>
        {showIcon && <Icon className="h-3 w-3 mr-1 inline-block" />}
        {config.label}
        {errorCount > 0 && status === 'error' && <span className="ml-1">({errorCount})</span>}
      </Badge>
    </div>
  );
};

/**
 * Helper para calcular el estado de salud basado en última conexión
 */
// eslint-disable-next-line react-refresh/only-export-components
export const calculateHealthStatus = (
  lastConnection: string | null,
  isActive: boolean,
  recentErrors: number
): IntegracionHealthStatus => {
  if (!isActive) return 'inactive';
  if (recentErrors > 0) return 'error';
  if (!lastConnection) return 'warning';

  const lastConnDate = new Date(lastConnection);
  const now = new Date();
  const hoursSince = (now.getTime() - lastConnDate.getTime()) / (1000 * 60 * 60);

  if (hoursSince < 24) return 'healthy';
  if (hoursSince < 168) return 'warning'; // 7 días
  return 'error';
};
