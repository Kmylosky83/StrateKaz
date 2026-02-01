/**
 * TimeElapsedDisplay - Componente para mostrar tiempo transcurrido
 *
 * @description
 * Componente reutilizable que muestra el tiempo transcurrido desde una fecha inicial
 * con soporte para diferentes formatos, animaciones y dark mode.
 *
 * @example
 * ```tsx
 * <TimeElapsedDisplay
 *   startDate={new Date('2020-01-15')}
 *   label="Operando desde"
 *   variant="card"
 *   format="long"
 *   showIcon
 * />
 * ```
 */

import { HTMLAttributes, ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTimeElapsed, TimeElapsedConfig } from '@/hooks/useTimeElapsed';
import { Card } from './Card';
import { Badge } from './Badge';

// ============================================
// TYPES
// ============================================

export type TimeElapsedVariant = 'inline' | 'card' | 'badge' | 'hero';
export type TimeElapsedSize = 'sm' | 'md' | 'lg' | 'xl';

export interface TimeElapsedDisplayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Configuración del hook useTimeElapsed
   */
  startDate: Date | string;
  updateInterval?: number;
  granularities?: TimeElapsedConfig['granularities'];
  format?: TimeElapsedConfig['format'];
  showZeros?: boolean;
  separator?: string;

  /**
   * Props específicas del componente
   */
  variant?: TimeElapsedVariant;
  size?: TimeElapsedSize;
  label?: string;
  showIcon?: boolean;
  icon?: ReactNode;
  animate?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  tooltip?: string;

  /**
   * Callbacks
   */
  onUpdate?: (elapsed: ReturnType<typeof useTimeElapsed>['elapsed']) => void;
}

// ============================================
// STYLE VARIANTS
// ============================================

const sizeClasses: Record<TimeElapsedSize, { text: string; icon: string; label: string }> = {
  sm: {
    text: 'text-sm',
    icon: 'w-3 h-3',
    label: 'text-xs',
  },
  md: {
    text: 'text-base',
    icon: 'w-4 h-4',
    label: 'text-sm',
  },
  lg: {
    text: 'text-lg',
    icon: 'w-5 h-5',
    label: 'text-base',
  },
  xl: {
    text: 'text-2xl',
    icon: 'w-6 h-6',
    label: 'text-lg',
  },
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface AnimatedNumberProps {
  value: string;
  animate?: boolean;
  className?: string;
}

const AnimatedNumber = ({ value, animate = true, className }: AnimatedNumberProps) => {
  if (!animate) {
    return <span className={className}>{value}</span>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={className}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
};

// ============================================
// VARIANT RENDERERS
// ============================================

interface VariantRendererProps {
  formatted: string;
  label?: string;
  showIcon?: boolean;
  icon?: ReactNode;
  size: TimeElapsedSize;
  animate?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

const InlineVariant = ({
  formatted,
  label,
  showIcon,
  icon,
  size,
  animate,
  className,
}: VariantRendererProps) => {
  const DefaultIcon = Clock;
  const sizes = sizeClasses[size];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showIcon && (
        <span className="text-primary-500 dark:text-primary-400">
          {icon || <DefaultIcon className={sizes.icon} />}
        </span>
      )}
      {label && (
        <span className={cn('text-gray-600 dark:text-gray-400 font-medium', sizes.label)}>
          {label}:
        </span>
      )}
      <AnimatedNumber
        value={formatted}
        animate={animate}
        className={cn('font-semibold text-gray-900 dark:text-gray-100', sizes.text)}
      />
    </div>
  );
};

const CardVariant = ({
  formatted,
  label,
  showIcon,
  icon,
  size,
  animate,
  showBadge,
  badgeText,
  className,
}: VariantRendererProps) => {
  const DefaultIcon = Calendar;
  const sizes = sizeClasses[size];

  return (
    <Card variant="default" padding="md" className={cn('relative', className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showIcon && (
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <span className="text-primary-600 dark:text-primary-400">
                  {icon || <DefaultIcon className={sizes.icon} />}
                </span>
              </div>
            )}
            {label && (
              <span className={cn('text-gray-600 dark:text-gray-400 font-medium', sizes.label)}>
                {label}
              </span>
            )}
          </div>
          {showBadge && badgeText && (
            <Badge variant="success" size="sm">
              {badgeText}
            </Badge>
          )}
        </div>
        <AnimatedNumber
          value={formatted}
          animate={animate}
          className={cn('font-bold text-gray-900 dark:text-gray-100', sizes.text)}
        />
      </div>
    </Card>
  );
};

const BadgeVariant = ({ formatted, animate, className }: VariantRendererProps) => {
  return (
    <Badge variant="primary" size="md" className={className}>
      <AnimatedNumber value={formatted} animate={animate} />
    </Badge>
  );
};

const HeroVariant = ({
  formatted,
  label,
  showIcon,
  icon,
  animate,
  showBadge,
  badgeText,
  className,
}: VariantRendererProps) => {
  const DefaultIcon = TrendingUp;

  return (
    <div className={cn('text-center space-y-4', className)}>
      {showIcon && (
        <div className="inline-flex p-4 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl shadow-lg">
          <span className="text-white">
            {icon || <DefaultIcon className="w-8 h-8" />}
          </span>
        </div>
      )}
      {label && (
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </h3>
      )}
      <AnimatedNumber
        value={formatted}
        animate={animate}
        className="block text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent"
      />
      {showBadge && badgeText && (
        <Badge variant="success" size="lg">
          {badgeText}
        </Badge>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Componente para mostrar tiempo transcurrido con múltiples variantes
 */
export const TimeElapsedDisplay = ({
  startDate,
  updateInterval,
  granularities,
  format = 'long',
  showZeros = false,
  separator,
  variant = 'inline',
  size = 'md',
  label,
  showIcon = false,
  icon,
  animate = true,
  showBadge = false,
  badgeText = 'Activo',
  tooltip,
  className,
  onUpdate,
  ...props
}: TimeElapsedDisplayProps) => {
  // Hook de tiempo transcurrido
  const timeElapsed = useTimeElapsed({
    startDate,
    updateInterval,
    granularities,
    format,
    showZeros,
    separator,
  });

  const { formatted, elapsed } = timeElapsed;

  // Callback de actualización
  useMemo(() => {
    if (onUpdate) {
      onUpdate(elapsed);
    }
  }, [elapsed, onUpdate]);

  // Props comunes para todos los variants
  const commonProps: VariantRendererProps = {
    formatted,
    label,
    showIcon,
    icon,
    size,
    animate,
    showBadge,
    badgeText,
    className,
  };

  // Renderizar según variante
  const renderVariant = () => {
    switch (variant) {
      case 'inline':
        return <InlineVariant {...commonProps} />;
      case 'card':
        return <CardVariant {...commonProps} />;
      case 'badge':
        return <BadgeVariant {...commonProps} />;
      case 'hero':
        return <HeroVariant {...commonProps} />;
      default:
        return <InlineVariant {...commonProps} />;
    }
  };

  return (
    <div
      className={cn('time-elapsed-display', className)}
      title={tooltip}
      {...props}
    >
      {renderVariant()}
    </div>
  );
};

// ============================================
// DISPLAY NAME
// ============================================

TimeElapsedDisplay.displayName = 'TimeElapsedDisplay';
