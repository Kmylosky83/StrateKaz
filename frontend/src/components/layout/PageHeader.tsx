import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageHeaderBadge {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface PageHeaderProps {
  /** Título principal de la página */
  title: string;
  /** Descripción o subtítulo opcional */
  description?: string;
  /** Badges informativos junto al título */
  badges?: PageHeaderBadge[];
  /** Acciones principales (botones) */
  actions?: ReactNode;
  /** Controles adicionales como toggles de vista */
  controls?: ReactNode;
  /** Tabs de navegación */
  tabs?: ReactNode;
  /** Clases adicionales */
  className?: string;
}

const badgeVariants = {
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
  secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

/**
 * PageHeader - Componente reutilizable para headers de página
 *
 * Estructura:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Título] [Badge] [Badge]              [Controls] [Actions] │
 * │ Descripción                                                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [Tab 1] [Tab 2] [Tab 3]                                     │
 * └─────────────────────────────────────────────────────────────┘
 */
export function PageHeader({
  title,
  description,
  badges,
  actions,
  controls,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Título y descripción */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {badges && badges.length > 0 && (
              <div className="flex items-center gap-2">
                {badges.map((badge, index) => (
                  <span
                    key={index}
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      badgeVariants[badge.variant || 'primary']
                    )}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Controles y acciones */}
        {(controls || actions) && (
          <div className="flex items-center gap-3">
            {controls}
            {actions}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          {tabs}
        </div>
      )}
    </div>
  );
}
