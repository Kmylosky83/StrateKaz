import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';
import type { ModuleColor } from '@/hooks/useModules';

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
  /** Color del módulo para estilos de hover */
  moduleColor?: ModuleColor;
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

// Configuración de colores de hover por módulo - Sincronizado con los 6 niveles del sistema
const moduleHoverColors: Record<ModuleColor, { shadow: string; border: string }> = {
  purple: {
    shadow: 'hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30',
    border: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  blue: {
    shadow: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
    border: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  green: {
    shadow: 'hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30',
    border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  orange: {
    shadow: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
    border: 'hover:border-orange-300 dark:hover:border-orange-700',
  },
  teal: {
    shadow: 'hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30',
    border: 'hover:border-teal-300 dark:hover:border-teal-700',
  },
  gray: {
    shadow: 'hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30',
    border: 'hover:border-gray-300 dark:hover:border-gray-700',
  },
  red: {
    shadow: 'hover:shadow-red-200/50 dark:hover:shadow-red-900/30',
    border: 'hover:border-red-300 dark:hover:border-red-700',
  },
  yellow: {
    shadow: 'hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/30',
    border: 'hover:border-yellow-300 dark:hover:border-yellow-700',
  },
  pink: {
    shadow: 'hover:shadow-pink-200/50 dark:hover:shadow-pink-900/30',
    border: 'hover:border-pink-300 dark:hover:border-pink-700',
  },
  indigo: {
    shadow: 'hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30',
    border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
  },
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
 * El hover de las cards usa el color del módulo pasado como prop
 */
export function StatsGrid({
  stats,
  columns = 4,
  className,
  variant = 'default',
  moduleColor = 'blue',
}: StatsGridProps) {
  const colorKey = moduleColor;

  const colsClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={cn('grid grid-cols-1 gap-4', colsClass[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} variant={variant} colorKey={colorKey} />
      ))}
    </div>
  );
}

interface StatCardProps {
  stat: StatItem;
  variant: 'default' | 'compact';
  colorKey: ModuleColor;
}

function StatCard({ stat, variant, colorKey }: StatCardProps) {
  const Icon = stat.icon;
  const colors = moduleHoverColors[colorKey];

  // Clases base con hover del color del módulo
  const cardClasses = cn(
    'transition-all duration-200 hover:-translate-y-0.5 cursor-default',
    colors.shadow,
    colors.border,
    'hover:shadow-md'
  );

  if (variant === 'compact') {
    return (
      <Card className={cn('p-4', cardClasses)}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                'p-2 rounded-lg bg-gray-100 dark:bg-gray-700',
                iconColors[stat.iconColor || 'gray']
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5', cardClasses)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
          {(stat.change || stat.description) && (
            <div className="mt-2 flex items-center gap-2">
              {stat.change && (
                <span
                  className={cn('text-sm font-medium', changeColors[stat.changeType || 'neutral'])}
                >
                  {stat.change}
                </span>
              )}
              {stat.description && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{stat.description}</span>
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
 * Usa animate-pulse-subtle del design system para una animación más suave
 */
export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse-subtle" />
          <div className="mt-3 h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse-subtle" />
        </div>
        <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse-subtle" />
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
