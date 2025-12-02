import { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  /** Identificador único del tab */
  id: string;
  /** Etiqueta del tab */
  label: string;
  /** Icono opcional */
  icon?: LucideIcon;
  /** Badge/contador opcional */
  badge?: string | number;
}

export interface PageTabsProps {
  /** Array de tabs */
  tabs: TabItem[];
  /** Tab activo */
  activeTab: string;
  /** Callback cuando cambia el tab */
  onTabChange: (tabId: string) => void;
  /** Clases adicionales */
  className?: string;
}

/**
 * PageTabs - Componente de tabs para navegación dentro de una página
 *
 * Estructura:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [🏭 Tab 1]  [🚛 Tab 2]  [📦 Tab 3]                         │
 * └─────────────────────────────────────────────────────────────┘
 */
export function PageTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: PageTabsProps) {
  return (
    <nav className={cn('-mb-px flex space-x-8', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
              isActive
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  isActive
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
