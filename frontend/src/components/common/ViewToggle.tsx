/**
 * ViewToggle - Toggle para cambiar entre modos de vista
 *
 * Usado para alternar entre Dashboard/Kanban, Lista/Grid, etc.
 *
 * Uso:
 * ```tsx
 * <ViewToggle
 *   value={viewMode}
 *   onChange={setViewMode}
 *   options={[
 *     { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
 *     { value: 'kanban', label: 'Kanban', icon: KanbanSquare },
 *   ]}
 * />
 * ```
 */
import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

export interface ViewToggleOption<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface ViewToggleProps<T extends string = string> {
  /** Valor actual seleccionado */
  value: T;
  /** Callback cuando cambia la selección */
  onChange: (value: T) => void;
  /** Opciones disponibles */
  options: ViewToggleOption<T>[];
  /** Tamaño del toggle */
  size?: 'sm' | 'md';
  /** Color del módulo para el estado activo */
  moduleColor?: 'purple' | 'blue' | 'green' | 'orange' | 'gray';
  /** Clases adicionales */
  className?: string;
}

const colorStyles = {
  purple: {
    active: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
  },
  blue: {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  green: {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  orange: {
    active: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
  },
  gray: {
    active: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  },
};

export const ViewToggle = <T extends string = string>({
  value,
  onChange,
  options,
  size = 'sm',
  moduleColor = 'purple',
  className,
}: ViewToggleProps<T>) => {
  const colors = colorStyles[moduleColor];

  const sizeStyles = {
    sm: {
      container: 'p-1 gap-1',
      button: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4',
    },
    md: {
      container: 'p-1.5 gap-1',
      button: 'px-4 py-2 text-sm',
      icon: 'h-4 w-4',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'inline-flex rounded-lg bg-gray-100 dark:bg-gray-800',
        styles.container,
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center rounded-md font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500',
              styles.button,
              isActive
                ? cn(colors.active, 'shadow-sm')
                : cn('text-gray-600 dark:text-gray-400', colors.hover)
            )}
          >
            {Icon && <Icon className={cn(styles.icon, option.label && 'mr-2')} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
