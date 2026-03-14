/**
 * ResponsiveTable - Tabla adaptativa para móvil
 *
 * Estrategia responsive:
 * - Desktop (>= 1024px): Tabla completa
 * - Tablet (768-1023px): Tabla con scroll horizontal
 * - Mobile (< 768px): Card list vertical
 *
 * Mejores prácticas:
 * - Priorización de columnas (priority field)
 * - Card view en móvil con metadata visible
 * - Touch-friendly interactions
 * - Accesibilidad WCAG 2.1
 *
 * Referencias:
 * - https://www.nngroup.com/articles/mobile-tables/
 * - https://www.uxmatters.com/mt/archives/2020/07/designing-mobile-tables.php
 */

import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { MobileCardList, MobileCardListItem } from './MobileCardList';
import { cn } from '@/utils/cn';

/**
 * Definición de columna extendida con priorización
 */
export interface ResponsiveTableColumn<T = Record<string, unknown>> {
  /** Key única de la columna */
  key: string;
  /** Header text */
  header: string;
  /** Render function */
  render: (item: T, index: number) => ReactNode;
  /** Alineación */
  align?: 'left' | 'center' | 'right';
  /** Prioridad para móvil: 1 (siempre visible) a 5 (ocultar primero) */
  priority?: 1 | 2 | 3 | 4 | 5;
  /** Ocultar en tablet */
  hideOnTablet?: boolean;
  /** Clases de columna */
  className?: string;
  /** Ancho fijo */
  width?: string | number;
}

export interface ResponsiveTableProps<T> {
  /** Datos a mostrar */
  data: T[];
  /** Definición de columnas */
  columns: ResponsiveTableColumn<T>[];
  /** Key extractor */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Título para card view en móvil */
  mobileCardTitle?: (item: T) => ReactNode;
  /** Subtítulo para card view en móvil */
  mobileCardSubtitle?: (item: T) => ReactNode;
  /** Avatar/Icon para card view en móvil */
  mobileCardAvatar?: (item: T) => ReactNode;
  /** Acciones personalizadas para cada fila/card */
  renderActions?: (item: T, index: number) => ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Clases adicionales */
  className?: string;
  /** Habilitar hover en filas */
  hoverable?: boolean;
  /** Habilitar striped rows */
  striped?: boolean;
  /** Tamaño denso */
  dense?: boolean;
  /** Callback al hacer click en fila */
  onRowClick?: (item: T, index: number) => void;
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor = (_item: T, index: number) =>
    ((_item as Record<string, unknown>).id as number) ?? index,
  mobileCardTitle,
  mobileCardSubtitle,
  mobileCardAvatar,
  renderActions,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar',
  className,
  hoverable = true,
  striped = false,
  dense = false,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useResponsive();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile: Card view
  if (isMobile) {
    return (
      <MobileCardList
        data={data}
        keyExtractor={keyExtractor}
        className={className}
        renderCard={(item, index) => {
          // Columnas priority 1-2 se muestran como metadata
          const priorityColumns = columns
            .filter((col) => col.priority && col.priority <= 2)
            .map((col) => ({
              label: col.header,
              value: col.render(item, index),
            }));

          return (
            <div
              onClick={() => onRowClick?.(item, index)}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              <MobileCardListItem
                title={mobileCardTitle?.(item) || 'Sin título'}
                subtitle={mobileCardSubtitle?.(item)}
                avatar={mobileCardAvatar?.(item)}
                metadata={priorityColumns}
                actions={renderActions?.(item, index)}
              />
            </div>
          );
        }}
      />
    );
  }

  // Desktop/Tablet: Table view
  const cellPadding = dense ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width }}
                className={cn(
                  headerPadding,
                  'text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.hideOnTablet && 'hidden lg:table-cell',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
            {renderActions && (
              <th
                scope="col"
                className={cn(
                  headerPadding,
                  'text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'
                )}
              >
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {data.map((item, rowIndex) => (
            <tr
              key={keyExtractor(item, rowIndex)}
              onClick={() => onRowClick?.(item, rowIndex)}
              className={cn(
                striped && rowIndex % 2 === 1 && 'bg-gray-50 dark:bg-gray-800/50',
                hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800',
                onRowClick && 'cursor-pointer',
                'transition-colors'
              )}
            >
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column.key}`}
                  className={cn(
                    cellPadding,
                    'text-sm text-gray-900 dark:text-gray-100',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.hideOnTablet && 'hidden lg:table-cell',
                    column.className
                  )}
                >
                  {column.render(item, rowIndex)}
                </td>
              ))}
              {renderActions && (
                <td className={cn(cellPadding, 'text-right text-sm')}>
                  <div className="flex items-center justify-end gap-2">
                    {renderActions(item, rowIndex)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
