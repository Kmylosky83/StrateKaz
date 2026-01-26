import { ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';

export interface PaginationInfo {
  /** Página actual (1-indexed) */
  currentPage: number;
  /** Tamaño de página */
  pageSize: number;
  /** Total de items */
  totalItems: number;
  /** Si hay página anterior */
  hasPrevious?: boolean;
  /** Si hay página siguiente */
  hasNext?: boolean;
  /** Callback para cambiar de página */
  onPageChange: (page: number) => void;
}

/** Definición de columna para tabla integrada */
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/** Props base para DataTableCard */
interface DataTableCardBaseProps {
  /** Información de paginación */
  pagination?: PaginationInfo;
  /** Título opcional para la sección */
  title?: string;
  /** Acciones de header (ej: exportar) */
  headerActions?: ReactNode;
  /** Si está cargando */
  isLoading?: boolean;
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
  /** Si no hay datos */
  isEmpty?: boolean;
  /** Clases adicionales */
  className?: string;
}

/** Props cuando se usa con children */
interface DataTableCardWithChildren extends DataTableCardBaseProps {
  children: ReactNode;
  columns?: never;
  data?: never;
}

/** Props cuando se usa con columns y data */
interface DataTableCardWithColumns<T = Record<string, unknown>> extends DataTableCardBaseProps {
  children?: never;
  /** Definición de columnas */
  columns: TableColumn<T>[];
  /** Datos a mostrar */
  data: T[];
}

export type DataTableCardProps<T = Record<string, unknown>> =
  | DataTableCardWithChildren
  | DataTableCardWithColumns<T>;

/**
 * DataTableCard - Wrapper para tablas de datos con paginación integrada
 *
 * Estructura:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Título opcional]                         [Header Actions] │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │                        TABLA                                │
 * │                                                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │ Mostrando 1 - 10 de 100            [Anterior] [Siguiente]  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Soporta dos modos:
 * 1. Con children: Renderiza el contenido directamente
 * 2. Con columns y data: Renderiza una tabla automáticamente
 */
export function DataTableCard<T extends Record<string, unknown>>({
  children,
  columns,
  data,
  pagination,
  title,
  headerActions,
  isLoading,
  emptyMessage = 'No hay datos para mostrar',
  isEmpty,
  className,
}: DataTableCardProps<T>) {
  const showPagination =
    pagination && pagination.totalItems > pagination.pageSize;

  // Calcular rango de items mostrados
  const startItem = pagination
    ? (pagination.currentPage - 1) * pagination.pageSize + 1
    : 0;
  const endItem = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)
    : 0;

  // Determinar si está vacío
  const isDataEmpty = isEmpty || (columns && data && data.length === 0);

  // Renderizar tabla cuando se usan columns y data
  const renderTable = () => {
    if (!columns || !data) return null;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, rowIndex) => (
              <tr
                key={(item as { id?: number | string }).id ?? rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={`${rowIndex}-${col.key}`}
                    className={cn(
                      'px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item)
                      : (item[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card className={className}>
      {/* Header opcional */}
      {(title || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {headerActions && (
            <div className={cn('flex items-center gap-2', !title && 'ml-auto')}>
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Contenido de la tabla */}
      <div className="p-6">
        {isDataEmpty && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
        ) : columns && data ? (
          renderTable()
        ) : (
          children
        )}

        {/* Paginación */}
        {showPagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startItem} - {endItem} de {pagination.totalItems}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.hasPrevious === false || pagination.currentPage <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.hasNext === false}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * TableSkeleton - Skeleton para carga de tablas
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse-subtle">
      {/* Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4 py-3 border-t border-gray-100 dark:border-gray-800"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
