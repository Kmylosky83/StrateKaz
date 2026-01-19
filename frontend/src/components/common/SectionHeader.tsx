/**
 * SectionHeader - Encabezado de sección con título y acciones contextuales
 *
 * Componente reutilizable para encabezados de sección que incluye:
 * - Título de la sección
 * - Descripción opcional
 * - Acciones contextuales (botones, filtros, etc.)
 * - Soporte para breadcrumb opcional
 *
 * Uso:
 * ```tsx
 * <SectionHeader
 *   title="Módulos"
 *   description="Gestión de módulos del sistema"
 *   actions={<Button>Crear Módulo</Button>}
 * />
 * ```
 */
import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface SectionHeaderProps {
  /** Título de la sección */
  title: string;
  /** Descripción opcional */
  description?: string;
  /** Acciones contextuales (botones, filtros, etc.) */
  actions?: ReactNode;
  /** Icono opcional al lado del título */
  icon?: ReactNode;
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Variante del header */
  variant?: 'default' | 'compact' | 'large';
  /** Si se debe mostrar el borde inferior */
  bordered?: boolean;
}

export const SectionHeader = ({
  title,
  description,
  actions,
  icon,
  className,
  variant = 'default',
  bordered = false,
}: SectionHeaderProps) => {
  const variantStyles = {
    default: {
      container: 'py-4',
      title: 'text-xl font-semibold',
      description: 'text-sm',
    },
    compact: {
      container: 'py-2',
      title: 'text-lg font-medium',
      description: 'text-xs',
    },
    large: {
      container: 'py-6',
      title: 'text-2xl font-bold',
      description: 'text-base',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
        styles.container,
        bordered && 'border-b border-gray-200 dark:border-gray-700 pb-4',
        className
      )}
    >
      {/* Título y descripción */}
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">{icon}</div>}
        <div className="min-w-0">
          <h2 className={cn('text-gray-900 dark:text-white leading-tight', styles.title)}>
            {title}
          </h2>
          {description && (
            <p className={cn('text-gray-500 dark:text-gray-400 mt-0.5', styles.description)}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
};

export default SectionHeader;
