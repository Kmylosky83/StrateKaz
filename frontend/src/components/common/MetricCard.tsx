/**
 * MetricCard - Componente para mostrar métricas con delta y trend
 * Design System StrateKaz
 */
import { Card } from './Card';
import { DynamicIcon } from './DynamicIcon';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MetricCardProps {
  value: string | number;
  label: string;
  delta?: number;
  deltaType?: 'increase' | 'decrease' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
  color?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  sparkline?: number[];
  icon?: string;
  onClick?: () => void;
  className?: string;
}

const COLOR_CONFIG = {
  success: {
    border: 'border-l-success-500',
    bg: 'bg-success-50 dark:bg-success-900/10',
    icon: 'text-success-600 dark:text-success-400',
    text: 'text-success-700 dark:text-success-300',
  },
  warning: {
    border: 'border-l-warning-500',
    bg: 'bg-warning-50 dark:bg-warning-900/10',
    icon: 'text-warning-600 dark:text-warning-400',
    text: 'text-warning-700 dark:text-warning-300',
  },
  danger: {
    border: 'border-l-danger-500',
    bg: 'bg-danger-50 dark:bg-danger-900/10',
    icon: 'text-danger-600 dark:text-danger-400',
    text: 'text-danger-700 dark:text-danger-300',
  },
  info: {
    border: 'border-l-info-500',
    bg: 'bg-info-50 dark:bg-info-900/10',
    icon: 'text-info-600 dark:text-info-400',
    text: 'text-info-700 dark:text-info-300',
  },
  primary: {
    border: 'border-l-primary-500',
    bg: 'bg-primary-50 dark:bg-primary-900/10',
    icon: 'text-primary-600 dark:text-primary-400',
    text: 'text-primary-700 dark:text-primary-300',
  },
};

const DELTA_CONFIG = {
  increase: {
    icon: TrendingUp,
    color: 'text-success-600 dark:text-success-400',
  },
  decrease: {
    icon: TrendingDown,
    color: 'text-danger-600 dark:text-danger-400',
  },
  neutral: {
    icon: Minus,
    color: 'text-gray-600 dark:text-gray-400',
  },
};

export function MetricCard({
  value,
  label,
  delta,
  deltaType = 'neutral',
  color = 'primary',
  sparkline,
  icon,
  onClick,
  className,
}: MetricCardProps) {
  const colorScheme = COLOR_CONFIG[color];
  const deltaScheme = DELTA_CONFIG[deltaType];
  const DeltaIcon = deltaScheme.icon;

  return (
    <Card
      className={cn(
        'border-l-4 transition-all duration-200',
        colorScheme.border,
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className={cn('p-4', colorScheme.bg)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              {delta !== undefined && (
                <div className={cn('flex items-center text-sm font-medium', deltaScheme.color)}>
                  <DeltaIcon className="h-4 w-4 mr-1" />
                  <span>{Math.abs(delta).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
          {icon && (
            <div className={cn('p-2 rounded-lg', colorScheme.bg)}>
              <DynamicIcon name={icon} className={cn('h-6 w-6', colorScheme.icon)} />
            </div>
          )}
        </div>

        {sparkline && sparkline.length > 0 && (
          <div className="mt-3">
            <MiniSparkline data={sparkline} color={color} />
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// MINI SPARKLINE
// =============================================================================

interface MiniSparklineProps {
  data: number[];
  color: MetricCardProps['color'];
}

function MiniSparkline({ data, color = 'primary' }: MiniSparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const colorMap = {
    success: 'stroke-success-500',
    warning: 'stroke-warning-500',
    danger: 'stroke-danger-500',
    info: 'stroke-info-500',
    primary: 'stroke-primary-500',
  };

  return (
    <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        className={cn(colorMap[color], 'transition-all duration-200')}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}
