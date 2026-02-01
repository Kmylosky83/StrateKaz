import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'underline',
}: TabsProps) => {
  if (variant === 'pills') {
    return (
      <div
        className={cn(
          // Mobile: scroll horizontal
          'flex md:inline-flex gap-1 p-1',
          'bg-gray-100 dark:bg-gray-800 rounded-lg',
          'overflow-x-auto md:overflow-visible scrollbar-none',
          'snap-x snap-mandatory md:snap-none',
          '-mx-3 px-3 md:mx-0 md:px-1',
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'snap-start flex-shrink-0 whitespace-nowrap', // Mobile scroll support
                isActive
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-700',
        // Mobile: scroll horizontal
        'overflow-x-auto scrollbar-none',
        '-mx-3 px-3 md:mx-0 md:px-0',
        className
      )}
    >
      <nav
        className={cn(
          '-mb-px flex gap-4 md:gap-6',
          'snap-x snap-mandatory md:snap-none'
        )}
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'snap-start flex-shrink-0 whitespace-nowrap', // Mobile scroll support
                isActive
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
