import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageHeaderProps {
  /** Titulo principal de la pagina */
  title: string;
  /** Descripcion o subtitulo opcional */
  description?: string;
  /** Acciones principales (botones) */
  actions?: ReactNode;
  /** Controles adicionales como toggles de vista */
  controls?: ReactNode;
  /** Tabs de navegacion */
  tabs?: ReactNode;
  /** Clases adicionales */
  className?: string;
}

/**
 * PageHeader - Componente reutilizable para headers de pagina
 *
 * NOTA: Los badges fueron removidos porque son redundantes con StatsGrid.
 * Los KPIs y contadores deben mostrarse en el componente StatsGrid debajo del header.
 *
 * Estructura:
 * +-------------------------------------------------------------+
 * | [Titulo]                              [Controls] [Actions]  |
 * | Descripcion                                                 |
 * +-------------------------------------------------------------+
 * | [Tab 1] [Tab 2] [Tab 3]                                     |
 * +-------------------------------------------------------------+
 */
export function PageHeader({
  title,
  description,
  actions,
  controls,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Titulo y descripcion */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="font-body text-sm text-gray-600 dark:text-gray-400 mt-1">
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
