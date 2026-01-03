/**
 * DataCard - Card para mostrar grupos de datos
 * Sistema de Gestión StrateKaz
 *
 * Card con header destacado, icono y campos de información.
 * Diseñado para mostrar datos de empresa, configuraciones y detalles.
 *
 * @example
 * ```tsx
 * <DataCard
 *   title="Identificación Fiscal"
 *   icon={FileText}
 *   variant="purple"
 *   elevated
 * >
 *   <DataField label="NIT" value="900123456-7" valueVariant="bold" />
 *   <DataField label="Razón Social" value="Mi Empresa SAS" />
 * </DataCard>
 * ```
 */
import { HTMLAttributes, ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export type DataCardVariant = 'default' | 'purple' | 'blue' | 'green' | 'orange' | 'teal' | 'gray' | 'red' | 'yellow' | 'pink' | 'indigo';

export interface DataCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Título de la sección */
  title: string;
  /** Icono de lucide-react */
  icon?: LucideIcon;
  /** Color del icono y borde hover */
  variant?: DataCardVariant;
  /** Contenido (DataField components) */
  children: ReactNode;
  /** Mostrar como destacado */
  elevated?: boolean;
  /** Mostrar borde superior de color */
  accentBorder?: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE ESTILOS
// ============================================================================

const variantStyles: Record<DataCardVariant, {
  icon: string;
  iconBg: string;
  border: string;
  shadow: string;
  accent: string;
}> = {
  default: {
    icon: 'text-gray-600 dark:text-gray-400',
    iconBg: 'bg-gray-100 dark:bg-gray-700/50',
    border: 'hover:border-gray-300 dark:hover:border-gray-600',
    shadow: 'hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30',
    accent: 'before:bg-gray-400',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'hover:border-purple-300 dark:hover:border-purple-700',
    shadow: 'hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30',
    accent: 'before:bg-purple-500',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'hover:border-blue-300 dark:hover:border-blue-700',
    shadow: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
    accent: 'before:bg-blue-500',
  },
  green: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    shadow: 'hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30',
    accent: 'before:bg-emerald-500',
  },
  orange: {
    icon: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'hover:border-orange-300 dark:hover:border-orange-700',
    shadow: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
    accent: 'before:bg-orange-500',
  },
  teal: {
    icon: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'hover:border-teal-300 dark:hover:border-teal-700',
    shadow: 'hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30',
    accent: 'before:bg-teal-500',
  },
  gray: {
    icon: 'text-gray-600 dark:text-gray-400',
    iconBg: 'bg-gray-100 dark:bg-gray-700/50',
    border: 'hover:border-gray-300 dark:hover:border-gray-600',
    shadow: 'hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30',
    accent: 'before:bg-gray-500',
  },
  red: {
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    border: 'hover:border-red-300 dark:hover:border-red-700',
    shadow: 'hover:shadow-red-200/50 dark:hover:shadow-red-900/30',
    accent: 'before:bg-red-500',
  },
  yellow: {
    icon: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'hover:border-yellow-300 dark:hover:border-yellow-700',
    shadow: 'hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/30',
    accent: 'before:bg-yellow-500',
  },
  pink: {
    icon: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'hover:border-pink-300 dark:hover:border-pink-700',
    shadow: 'hover:shadow-pink-200/50 dark:hover:shadow-pink-900/30',
    accent: 'before:bg-pink-500',
  },
  indigo: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    shadow: 'hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30',
    accent: 'before:bg-indigo-500',
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export const DataCard = ({
  title,
  icon: Icon,
  variant = 'purple',
  children,
  elevated = false,
  accentBorder = false,
  className,
  ...props
}: DataCardProps) => {
  const styles = variantStyles[variant];

  return (
    <Card
      variant={elevated ? 'elevated' : 'default'}
      className={cn(
        'group relative overflow-hidden',
        'border-2 border-gray-200/60 dark:border-gray-700/60',
        'transition-all duration-300',
        styles.border,
        styles.shadow,
        'hover:-translate-y-0.5',
        // Accent border (línea superior de color)
        accentBorder && [
          'before:absolute before:top-0 before:left-0 before:right-0 before:h-1',
          styles.accent,
        ],
        className
      )}
      padding="none"
      {...props}
    >
      {/* Header con icono y título */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        {Icon && (
          <div
            className={cn(
              'p-2.5 rounded-lg transition-transform duration-300 group-hover:scale-110',
              styles.iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', styles.icon)} />
          </div>
        )}
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
          {title}
        </h4>
      </div>

      {/* Contenido */}
      <div className="px-5 py-4 space-y-3.5">
        {children}
      </div>
    </Card>
  );
};

export default DataCard;
