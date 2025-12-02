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

export interface DataTableCardProps {
  /** Contenido de la tabla (componente de tabla específico) */
  children: ReactNode;
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
 */
export function DataTableCard({
  children,
  pagination,
  title,
  headerActions,
  isLoading,
  emptyMessage = 'No hay datos para mostrar',
  isEmpty,
  className,
}: DataTableCardProps) {
  const showPagination =
    pagination && pagination.totalItems > pagination.pageSize;

  // Calcular rango de items mostrados
  const startItem = pagination
    ? (pagination.currentPage - 1) * pagination.pageSize + 1
    : 0;
  const endItem = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)
    : 0;

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
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Contenido de la tabla */}
      <div className="p-6">
        {isEmpty && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
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
    <div className="animate-pulse">
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
