/**
 * FeatureToggleCard Component - Design System
 *
 * Tarjeta para activar/desactivar modulos y features del sistema.
 * Soporta multiples colores con clases estaticas de Tailwind para
 * garantizar que no sean purgadas en produccion.
 *
 * Variantes de layout:
 * - card: Para grids de modulos (icono, titulo, descripcion, switch)
 * - row: Para configuraciones en lista (horizontal, compacto)
 *
 * Uso:
 * ```tsx
 * <FeatureToggleCard
 *   icon={ShieldCheck}
 *   title="SST"
 *   description="Sistema de Gestion de Seguridad"
 *   checked={isEnabled}
 *   onChange={(checked) => handleToggle(checked)}
 *   color="orange"
 *   disabled={isPending}
 * />
 * ```
 */
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Switch } from '@/components/forms';

// ============================================================================
// TYPES
// ============================================================================

export type FeatureToggleColor = 'purple' | 'blue' | 'green' | 'orange' | 'gray';
export type FeatureToggleLayout = 'card' | 'row';

export interface FeatureToggleCardProps {
  /** Icono de Lucide */
  icon: LucideIcon;
  /** Titulo del feature/modulo */
  title: string;
  /** Descripcion del feature/modulo */
  description?: string;
  /** Estado actual del toggle */
  checked: boolean;
  /** Callback cuando cambia el estado */
  onChange: (checked: boolean) => void;
  /** Color del tema cuando esta activo */
  color?: FeatureToggleColor;
  /** Deshabilitar el toggle */
  disabled?: boolean;
  /** Layout de la tarjeta */
  layout?: FeatureToggleLayout;
  /** Clases adicionales */
  className?: string;
  /** Contenido adicional (badges, etc) */
  children?: ReactNode;
}

// ============================================================================
// COLOR CONFIGURATIONS (Static classes for Tailwind purge safety)
// ============================================================================

const colorConfig: Record<FeatureToggleColor, {
  // Card enabled state
  cardEnabled: string;
  // Icon container enabled
  iconBgEnabled: string;
  // Icon color enabled
  iconEnabled: string;
}> = {
  purple: {
    cardEnabled: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
    iconBgEnabled: 'bg-purple-100 dark:bg-purple-900/30',
    iconEnabled: 'text-purple-600 dark:text-purple-400',
  },
  blue: {
    cardEnabled: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    iconBgEnabled: 'bg-blue-100 dark:bg-blue-900/30',
    iconEnabled: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    cardEnabled: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    iconBgEnabled: 'bg-green-100 dark:bg-green-900/30',
    iconEnabled: 'text-green-600 dark:text-green-400',
  },
  orange: {
    cardEnabled: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
    iconBgEnabled: 'bg-orange-100 dark:bg-orange-900/30',
    iconEnabled: 'text-orange-600 dark:text-orange-400',
  },
  gray: {
    cardEnabled: 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800/50',
    iconBgEnabled: 'bg-gray-200 dark:bg-gray-700',
    iconEnabled: 'text-gray-600 dark:text-gray-400',
  },
};

// Disabled state (same for all colors)
const disabledStyles = {
  card: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-60',
  iconBg: 'bg-gray-200 dark:bg-gray-700',
  icon: 'text-gray-400',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FeatureToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  color = 'green',
  disabled = false,
  layout = 'card',
  className,
  children,
}: FeatureToggleCardProps) {
  // Validación defensiva: si el color no existe en colorConfig, usar 'green' como fallback
  const safeColor = colorConfig[color] ? color : 'green';
  const colors = colorConfig[safeColor];

  // Card layout (for module grids)
  if (layout === 'card') {
    return (
      <div
        className={cn(
          'p-4 rounded-lg border transition-all',
          checked ? colors.cardEnabled : disabledStyles.card,
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  checked ? colors.iconBgEnabled : disabledStyles.iconBg
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    checked ? colors.iconEnabled : disabledStyles.icon
                  )}
                />
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {title}
              </span>
              {children}
            </div>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <Switch
            checked={checked}
            onChange={() => onChange(!checked)}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  // Row layout (for settings lists)
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-colors',
        'border-gray-200 dark:border-gray-700',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            'h-5 w-5 transition-colors',
            checked ? colors.iconEnabled : 'text-gray-500 dark:text-gray-400'
          )}
        />
        <div>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </span>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
      <Switch
        checked={checked}
        onChange={() => onChange(!checked)}
        disabled={disabled}
      />
    </div>
  );
}

// ============================================================================
// GRID COMPONENT FOR FEATURE CARDS
// ============================================================================

export interface FeatureToggleGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FeatureToggleGrid({
  children,
  columns = 3,
  className,
}: FeatureToggleGridProps) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4', gridColumns[columns], className)}>
      {children}
    </div>
  );
}

export default FeatureToggleCard;
