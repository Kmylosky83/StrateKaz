/**
 * Progress - Barra de progreso configurable
 *
 * Características:
 * - Colores personalizables (success, warning, danger, info, primary)
 * - Tamaños configurables (sm, md, lg)
 * - Animación opcional
 * - Label de porcentaje opcional
 * - Variante con rayas (striped)
 * - Dark mode support
 */

import { cn } from '@/utils/cn';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  /** Color usando tokens del Design System */
  color?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' | 'accent';
  /** Alias de color para compatibilidad */
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  striped?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * Clases de color usando tokens del Design System (tailwind.config.js)
 * Tokens disponibles: success, warning, danger, info, primary, secondary, accent
 */
const colorClasses = {
  success: 'bg-success-500 dark:bg-success-600',
  warning: 'bg-warning-500 dark:bg-warning-600',
  danger: 'bg-danger-500 dark:bg-danger-600',
  info: 'bg-info-500 dark:bg-info-600',
  primary: 'bg-primary-500 dark:bg-primary-600',
  secondary: 'bg-secondary-500 dark:bg-secondary-600',
  accent: 'bg-accent-500 dark:bg-accent-600',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const Progress = ({
  value,
  max = 100,
  color,
  variant,
  size = 'md',
  showLabel = false,
  striped = false,
  animated = false,
  className,
}: ProgressProps) => {
  // Usar variant como alias de color, con fallback a 'primary'
  const activeColor = color || variant || 'primary';
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            colorClasses[activeColor],
            {
              'bg-stripes': striped,
              'animate-stripes': animated && striped,
            }
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};
