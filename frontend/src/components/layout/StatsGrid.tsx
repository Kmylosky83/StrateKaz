import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';
import { useMacroprocessColor, macroprocessColors, type MacroprocessColor } from '@/hooks/useMacroprocessColor';

export interface StatItem {
  /** Etiqueta de la estadística */
  label: string;
  /** Valor a mostrar */
  value: string | number;
  /** Icono de Lucide */
  icon?: LucideIcon;
  /** Color del icono */
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  /** Cambio porcentual (ej: "+12%" o "-5%") */
  change?: string;
  /** Si el cambio es positivo (verde) o negativo (rojo) */
  changeType?: 'positive' | 'negative' | 'neutral';
  /** Descripción adicional */
  description?: string;
}

export interface StatsGridProps {
  /** Array de estadísticas a mostrar */
  stats: StatItem[];
  /** Número de columnas en pantallas grandes */
  columns?: 2 | 3 | 4 | 5;
  /** Clases adicionales */
  className?: string;
  /** Variante de estilo */
  variant?: 'default' | 'compact';
  /** Color del macroproceso (si no se pasa, se detecta automáticamente) */
  macroprocessColor?: MacroprocessColor;
}

const iconColors = {
  primary: 'text-primary-500 dark:text-primary-400',
  success: 'text-green-500 dark:text-green-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  danger: 'text-red-500 dark:text-red-400',
  info: 'text-blue-500 dark:text-blue-400',
  gray: 'text-gray-400 dark:text-gray-500',
};

const changeColors = {
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-600 dark:text-gray-400',
};

/**
 * StatsGrid - Grid de cards de estadísticas/métricas
 *
 * Estructura de cada card:
 * ┌─────────────────────────────────────────┐
 * │ Label                           [Icon] │
 * │ Value                                   │
 * │ +12% vs anterior                        │
 * └─────────────────────────────────────────┘
 *
 * El hover de las cards usa el color del macroproceso actual
 * (detectado automáticamente según la ruta o pasado como prop)
 */
export function StatsGrid({
  stats,
  columns = 4,
  className,
  variant = 'default',
  macroprocessColor: propColor,
}: StatsGridProps) {
  // Detectar color del macroproceso automáticamente si no se pasa como prop
  const detectedColor = useMacroprocessColor();
  const colorKey = propColor || detectedColor || 'blue';

  const colsClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        colsClass[columns],
        className
      )}
    >
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} variant={variant} colorKey={colorKey} />
      ))}
    </div>
  );
}

interface StatCardProps {
  stat: StatItem;
  variant: 'default' | 'compact';
  colorKey: MacroprocessColor;
}

function StatCard({ stat, variant, colorKey }: StatCardProps) {
  const Icon = stat.icon;
  const colors = macroprocessColors[colorKey];

  // Clases base con hover del color del macroproceso
  const cardClasses = cn(
    'shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-default border-gray-200/60 dark:border-gray-700/60',
    colors.hoverShadow,
    colors.hoverBorder,
    'hover:shadow-md'
  );

  if (variant === 'compact') {
    return (
      <Card className={cn('p-4', cardClasses)}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn('p-2 rounded-lg bg-gray-100 dark:bg-gray-700', iconColors[stat.iconColor || 'gray'])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5', cardClasses)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {stat.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stat.value}
          </p>
          {(stat.change || stat.description) && (
            <div className="mt-2 flex items-center gap-2">
              {stat.change && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    changeColors[stat.changeType || 'neutral']
                  )}
                >
                  {stat.change}
                </span>
              )}
              {stat.description && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.description}
                </span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-3 rounded-xl bg-gray-100 dark:bg-gray-700',
              iconColors[stat.iconColor || 'gray']
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * StatCardSkeleton - Skeleton para carga de estadísticas
 */
export function StatCardSkeleton() {
  return (
    <Card className="p-5 shadow-sm border-gray-200/60 dark:border-gray-700/60">
      <div className="flex items-start justify-between animate-pulse">
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="mt-3 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </Card>
  );
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
