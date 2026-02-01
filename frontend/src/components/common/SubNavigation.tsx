/**
 * SubNavigation Component - Design System
 *
 * Navegacion de segundo nivel para usar dentro de tabs.
 * Ubicacion: PageHeader → Tabs → StatsGrid → SubNavigation → Contenido
 *
 * Estilo: Modern Elevated Pills
 * - Botones elevados con micro-animaciones suaves
 * - Hover: elevacion con shadow + scale(1.02)
 * - Active: color primario con fondo y borde
 * - Accesibilidad AAA (contraste > 7:1)
 *
 * Uso:
 * ```tsx
 * <SubNavigation
 *   items={[
 *     { id: 'branding', label: 'Branding', icon: <Palette /> },
 *     { id: 'modulos', label: 'Modulos', icon: <Settings /> },
 *   ]}
 *   activeItem="branding"
 *   onChange={(id) => setActiveItem(id)}
 * />
 * ```
 */
import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface SubNavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface SubNavigationProps {
  items: SubNavigationItem[];
  activeItem: string;
  onChange: (itemId: string) => void;
  className?: string;
  /** Fondo contenedor visible (default: true) */
  showBackground?: boolean;
  /** Sticky al hacer scroll */
  sticky?: boolean;
}

export const SubNavigation = ({
  items,
  activeItem,
  onChange,
  className,
  showBackground = true,
  sticky = false,
}: SubNavigationProps) => {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        showBackground && 'bg-gray-50 dark:bg-gray-800/50 p-2 border border-gray-100 dark:border-gray-700/50',
        sticky && 'sticky top-0 z-10 backdrop-blur-sm',
        className
      )}
    >
      <nav className="flex flex-wrap gap-1.5" aria-label="Sub navigation">
        {items.map((item) => {
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onChange(item.id)}
              disabled={item.disabled}
              className={cn(
                // Base styles
                'relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg',
                'border transition-all duration-200 ease-out',
                // Focus visible (accesibilidad)
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                // Default state
                !isActive && [
                  'text-gray-700 dark:text-gray-300',
                  'bg-transparent border-transparent',
                  // Hover state
                  'hover:text-gray-900 dark:hover:text-gray-100',
                  'hover:bg-white dark:hover:bg-gray-700',
                  'hover:border-gray-200 dark:hover:border-gray-600',
                  'hover:shadow-sm hover:scale-[1.02]',
                ],
                // Active state
                isActive && [
                  'text-primary-700 dark:text-primary-300',
                  'bg-primary-50 dark:bg-primary-900/20',
                  'border-primary-200 dark:border-primary-800',
                  'shadow-sm font-semibold',
                ],
                // Disabled state
                item.disabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none'
              )}
            >
              {/* Icon con animacion sutil en active */}
              {item.icon && (
                <span
                  className={cn(
                    'flex-shrink-0 w-4 h-4 transition-transform duration-200',
                    isActive && 'text-primary-600 dark:text-primary-400'
                  )}
                >
                  {item.icon}
                </span>
              )}

              {/* Label */}
              <span>{item.label}</span>

              {/* Badge opcional */}
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1.5 px-2 py-0.5 text-xs rounded-full font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SubNavigation;
