/**
 * GaugeProgress - Componente de gauge simple con arco de progreso
 * Design System StrateKaz
 */
import { cn } from '@/lib/utils';

export interface GaugeProgressProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    container: 'w-20 h-20',
    stroke: 4,
    fontSize: 'text-xs',
    labelSize: 'text-xs',
  },
  md: {
    container: 'w-32 h-32',
    stroke: 6,
    fontSize: 'text-lg',
    labelSize: 'text-sm',
  },
  lg: {
    container: 'w-40 h-40',
    stroke: 8,
    fontSize: 'text-2xl',
    labelSize: 'text-base',
  },
  xl: {
    container: 'w-56 h-56',
    stroke: 10,
    fontSize: 'text-4xl',
    labelSize: 'text-lg',
  },
};

const COLOR_CONFIG = {
  success: {
    stroke: 'stroke-success-500',
    text: 'text-success-600 dark:text-success-400',
  },
  warning: {
    stroke: 'stroke-warning-500',
    text: 'text-warning-600 dark:text-warning-400',
  },
  danger: {
    stroke: 'stroke-danger-500',
    text: 'text-danger-600 dark:text-danger-400',
  },
  info: {
    stroke: 'stroke-info-500',
    text: 'text-info-600 dark:text-info-400',
  },
  primary: {
    stroke: 'stroke-primary-500',
    text: 'text-primary-600 dark:text-primary-400',
  },
};

export function GaugeProgress({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  label,
  showValue = true,
  className,
}: GaugeProgressProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const colorConfig = COLOR_CONFIG[color];

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('relative', sizeConfig.container)}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background Circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth={sizeConfig.stroke}
          />
          {/* Progress Circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className={cn(colorConfig.stroke, 'transition-all duration-500 ease-out')}
            strokeWidth={sizeConfig.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold', sizeConfig.fontSize, colorConfig.text)}>
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <p className={cn('text-center text-gray-600 dark:text-gray-400 font-medium', sizeConfig.labelSize)}>
          {label}
        </p>
      )}
    </div>
  );
}
