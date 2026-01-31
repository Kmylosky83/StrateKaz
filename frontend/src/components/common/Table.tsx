/**
 * Table Component - Wrapper sobre TanStack Table
 *
 * Proporciona una API simplificada para crear tablas con:
 * - Sorting
 * - Pagination
 * - Row selection
 * - Loading states
 * - Empty states
 */
import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
  RowSelectionState,
  OnChangeFn,
} from '@tanstack/react-table';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Spinner } from './Spinner';

export interface TableProps<T> {
  /** Data array to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T, unknown>[];
  /** Enable sorting */
  sorting?: boolean;
  /** Enable pagination */
  pagination?: boolean;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** Enable row selection */
  selection?: boolean;
  /** Selected rows state (controlled) */
  rowSelection?: RowSelectionState;
  /** On selection change (controlled) */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Table container className */
  className?: string;
  /** Dense mode (smaller padding) */
  dense?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Get row ID for selection */
  getRowId?: (row: T) => string;
}

export function Table<T>({
  data,
  columns,
  sorting = true,
  pagination = false,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  selection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  emptyComponent,
  className,
  dense = false,
  striped = false,
  hoverable = true,
  getRowId,
}: TableProps<T>) {
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});

  const rowSelectionState = controlledRowSelection ?? internalRowSelection;
  const setRowSelection = onRowSelectionChange ?? setInternalRowSelection;

  // Add selection column if enabled
  const tableColumns = useMemo(() => {
    if (!selection) return columns;

    const selectionColumn: ColumnDef<T, unknown> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      size: 40,
    };

    return [selectionColumn, ...columns];
  }, [columns, selection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting: sortingState,
      rowSelection: rowSelectionState,
    },
    onSortingChange: setSortingState,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: selection,
    getRowId,
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  const cellPadding = dense ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      headerPadding,
                      'text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sorting && header.column.getCanSort() && (
                        <span className="ml-1">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {loading ? (
              <tr>
                <td colSpan={tableColumns.length} className="py-12 text-center">
                  <Spinner size="lg" className="mx-auto" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} className="py-12 text-center">
                  {emptyComponent || (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    striped && index % 2 === 1 && 'bg-gray-50 dark:bg-gray-800/50',
                    hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800',
                    row.getIsSelected() && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        cellPadding,
                        'text-sm text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && !loading && data.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mostrar
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              de {table.getFilteredRowModel().rows.length} registros
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {table.getState().pagination.pageIndex + 1} de{' '}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
