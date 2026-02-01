/**
 * Breadcrumbs Component
 *
 * Navegación de migas de pan con soporte para:
 * - Links de react-router
 * - Separadores personalizables
 * - Iconos
 * - Truncamiento automático
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation path (optional - last item typically has no href) */
  href?: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator */
  separator?: React.ReactNode;
  /** Show home icon on first item */
  showHomeIcon?: boolean;
  /** Custom className */
  className?: string;
  /** Max items to show before collapsing (0 = no collapse) */
  maxItems?: number;
}

export function Breadcrumbs({
  items,
  separator,
  showHomeIcon = true,
  className,
  maxItems = 0,
}: BreadcrumbsProps) {
  const defaultSeparator = (
    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
  );

  // Handle collapsing for long breadcrumbs
  const getDisplayItems = (): (BreadcrumbItem | 'collapsed')[] => {
    if (maxItems === 0 || items.length <= maxItems) {
      return items;
    }

    // Show first, ellipsis, and last (maxItems - 1) items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));

    return [firstItem, 'collapsed', ...lastItems];
  };

  const displayItems = getDisplayItems();

  if (items.length === 0) return null;

  return (
    <nav
      className={cn('flex items-center', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isFirst = index === 0;

          if (item === 'collapsed') {
            return (
              <li key="collapsed" className="flex items-center">
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  ...
                </span>
                <span className="mx-2">{separator || defaultSeparator}</span>
              </li>
            );
          }

          return (
            <li key={item.label} className="flex items-center">
              {/* Separator (except for first item) */}
              {!isFirst && (
                <span className="mr-2">{separator || defaultSeparator}</span>
              )}

              {/* Breadcrumb item */}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center text-sm font-medium',
                    'text-gray-500 hover:text-gray-700',
                    'dark:text-gray-400 dark:hover:text-gray-200',
                    'transition-colors'
                  )}
                >
                  {isFirst && showHomeIcon && !item.icon ? (
                    <Home className="h-4 w-4 mr-1" />
                  ) : item.icon ? (
                    <span className="mr-1">{item.icon}</span>
                  ) : null}
                  <span className="max-w-[150px] truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center text-sm font-medium',
                    isLast
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && showHomeIcon && !item.icon ? (
                    <Home className="h-4 w-4 mr-1" />
                  ) : item.icon ? (
                    <span className="mr-1">{item.icon}</span>
                  ) : null}
                  <span className="max-w-[200px] truncate">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
