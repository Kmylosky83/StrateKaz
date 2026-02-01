/**
 * DataSection - Contenedor de sección de datos
 * Sistema de Gestión StrateKaz
 *
 * Contenedor para agrupar múltiples DataCards con header opcional.
 *
 * @example
 * ```tsx
 * <DataSection
 *   title="Datos Fiscales y Legales"
 *   description="Información registrada de la empresa"
 *   icon={Building2}
 *   action={<Button variant="secondary" size="sm">Editar</Button>}
 * >
 *   <DataGrid columns={3}>
 *     <DataCard>...</DataCard>
 *     <DataCard>...</DataCard>
 *   </DataGrid>
 * </DataSection>
 * ```
 */
import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';
import type { DataCardVariant } from './DataCard';

// ============================================================================
// TIPOS
// ============================================================================

export interface DataSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Título de la sección */
  title?: string;
  /** Descripción opcional */
  description?: string;
  /** Icono del título */
  icon?: LucideIcon;
  /** Color del icono (preset) */
  iconVariant?: DataCardVariant;
  /** Clases CSS personalizadas para el contenedor del icono (override iconVariant) */
  iconBgClass?: string;
  /** Clases CSS personalizadas para el icono (override iconVariant) */
  iconClass?: string;
  /** Botón de acción (ej: Editar) */
  action?: ReactNode;
  /** Contenido (DataGrid o custom) */
  children: ReactNode;
  /** Mostrar divider inferior */
  divider?: boolean;
}

// ============================================================================
// ESTILOS
// ============================================================================

const iconVariantStyles: Record<DataCardVariant, { bg: string; text: string }> = {
  default: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-600 dark:text-gray-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-600 dark:text-gray-400' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export const DataSection = ({
  title,
  description,
  icon: Icon,
  iconVariant = 'purple',
  iconBgClass,
  iconClass,
  action,
  children,
  divider = false,
  className,
  ...props
}: DataSectionProps) => {
  const iconStyles = iconVariantStyles[iconVariant];

  // Usar clases personalizadas si se proporcionan, sino usar el preset
  const bgClass = iconBgClass || iconStyles.bg;
  const textClass = iconClass || iconStyles.text;

  return (
    <div
      className={cn(
        'space-y-5',
        divider && 'pb-6 border-b border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {/* Header */}
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={cn('p-2 rounded-lg', bgClass)}>
                  <Icon className={cn('h-5 w-5', textClass)} />
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
};

export default DataSection;
