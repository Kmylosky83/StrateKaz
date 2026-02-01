/**
 * Pagination Component
 *
 * Componente de paginación reutilizable con soporte para:
 * - Navegación básica (anterior/siguiente)
 * - Números de página con elipsis
 * - Personalización de siblings
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of sibling pages to show */
  siblingCount?: number;
  /** Show first/last page buttons */
  showFirstLast?: boolean;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className,
  size = 'md',
  disabled = false,
}: PaginationProps) {
  // Generate page numbers array
  const generatePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const leftSibling = Math.max(2, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);

    // Add left ellipsis if needed
    if (leftSibling > 2) {
      pages.push('ellipsis');
    }

    // Add pages in range
    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Add right ellipsis if needed
    if (rightSibling < totalPages - 1) {
      pages.push('ellipsis');
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  const sizeClasses = {
    sm: 'h-7 min-w-7 text-xs',
    md: 'h-9 min-w-9 text-sm',
    lg: 'h-11 min-w-11 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const baseButtonClass = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    sizeClasses[size]
  );

  const pageButtonClass = cn(
    baseButtonClass,
    'border border-gray-300 bg-white hover:bg-gray-50',
    'dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700',
    'text-gray-700 dark:text-gray-300'
  );

  const activePageClass = cn(
    baseButtonClass,
    'border border-primary-500 bg-primary-500 text-white',
    'hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700'
  );

  const navButtonClass = cn(
    baseButtonClass,
    'border border-gray-300 bg-white hover:bg-gray-50',
    'dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700',
    'text-gray-700 dark:text-gray-300',
    'px-2'
  );

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className={navButtonClass}
        aria-label="Página anterior"
      >
        <ChevronLeft className={iconSizes[size]} />
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className={cn(
              'inline-flex items-center justify-center',
              sizeClasses[size],
              'text-gray-400 dark:text-gray-500'
            )}
          >
            <MoreHorizontal className={iconSizes[size]} />
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={disabled}
            className={page === currentPage ? activePageClass : pageButtonClass}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className={navButtonClass}
        aria-label="Página siguiente"
      >
        <ChevronRight className={iconSizes[size]} />
      </button>
    </nav>
  );
}

export default Pagination;
