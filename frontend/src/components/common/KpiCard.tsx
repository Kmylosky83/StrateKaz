/**
 * KpiCard - Tarjeta de indicador reutilizable
 *
 * Reemplaza 110+ tarjetas KPI inline duplicadas en:
 * - HSEQ (AccidentalidadPage, CalidadPage, EmergenciasPage, etc.)
 * - Motor de Cumplimiento (CumplimientoPage)
 * - Motor de Riesgos (ResumenIPEVRCards)
 * - Talent Hub (TalentHubPage)
 *
 * Uso:
 * ```tsx
 * <KpiCardGrid>
 *   <KpiCard label="Total AT" value={stats.total} icon={<AlertTriangle />} color="danger" />
 *   <KpiCard label="Graves" value={stats.graves} icon={<AlertCircle />} color="warning" description="Requieren investigación" />
 * </KpiCardGrid>
 * ```
 */
import React from 'react';
import { cn } from '@/utils/cn';

// =============================================================================
// TYPES
// =============================================================================

export type KpiCardColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'purple'
  | 'yellow'
  | 'gray';

export interface KpiCardProps {
  /** Etiqueta descriptiva del KPI */
  label: string;
  /** Valor del indicador */
  value: string | number;
  /** Icono (elemento React, ej: <AlertTriangle className="w-5 h-5" />) */
  icon?: React.ReactNode;
  /** Color del icono y fondo */
  color?: KpiCardColor;
  /** Texto secundario debajo del valor */
  description?: string;
  /** Color del valor (para resaltar danger/warning) */
  valueColor?: string;
  /** Click handler */
  onClick?: () => void;
  /** Clases adicionales */
  className?: string;
}

export interface KpiCardGridProps {
  children: React.ReactNode;
  /** Número de columnas en desktop (default: auto basado en children count) */
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export interface KpiCardSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

// =============================================================================
// COLOR MAP
// =============================================================================

const COLOR_MAP: Record<KpiCardColor, { bg: string; icon: string }> = {
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    icon: 'text-primary-600 dark:text-primary-400',
  },
  success: {
    bg: 'bg-success-100 dark:bg-success-900/30',
    icon: 'text-success-600 dark:text-success-400',
  },
  warning: {
    bg: 'bg-warning-100 dark:bg-warning-900/30',
    icon: 'text-warning-600 dark:text-warning-400',
  },
  danger: {
    bg: 'bg-danger-100 dark:bg-danger-900/30',
    icon: 'text-danger-600 dark:text-danger-400',
  },
  info: {
    bg: 'bg-info-100 dark:bg-info-900/30',
    icon: 'text-info-600 dark:text-info-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    icon: 'text-gray-600 dark:text-gray-400',
  },
};

// =============================================================================
// GRID COLUMNS MAP
// =============================================================================

const GRID_COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
  5: 'md:grid-cols-3 lg:grid-cols-5',
  6: 'md:grid-cols-3 lg:grid-cols-6',
};

// =============================================================================
// KPI CARD
// =============================================================================

export function KpiCard({
  label,
  value,
  icon,
  color = 'primary',
  description,
  valueColor,
  onClick,
  className,
}: KpiCardProps) {
  const colorScheme = COLOR_MAP[color];

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4',
        'hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p
            className={cn(
              'text-2xl font-bold mt-1',
              valueColor || 'text-gray-900 dark:text-white'
            )}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2 rounded-lg shrink-0 ml-3', colorScheme.bg)}>
            <span className={colorScheme.icon}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// KPI CARD GRID
// =============================================================================

export function KpiCardGrid({ children, columns, className }: KpiCardGridProps) {
  const childCount = React.Children.count(children);
  const cols = columns || Math.min(childCount, 4) as 2 | 3 | 4 | 5 | 6;

  return (
    <div className={cn('grid grid-cols-1 gap-4', GRID_COLS[cols], className)}>
      {children}
    </div>
  );
}

// =============================================================================
// KPI CARD SKELETON (loading state)
// =============================================================================

export function KpiCardSkeleton({ count = 4, columns, className }: KpiCardSkeletonProps) {
  const cols = columns || (Math.min(count, 4) as 2 | 3 | 4 | 5 | 6);

  return (
    <div className={cn('grid grid-cols-1 gap-4', GRID_COLS[cols], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0 ml-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
