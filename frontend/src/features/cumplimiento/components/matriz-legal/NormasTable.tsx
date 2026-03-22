/**
 * Tabla de Normas Legales con TanStack Table
 *
 * Características:
 * - Paginación del servidor
 * - Ordenamiento por columnas
 * - Acciones CRUD
 * - Badges de sistemas aplicables
 */
import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import { Edit, Trash2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/forms';
import type { NormaLegalList } from '../../types/matrizLegal';

interface NormasTableProps {
  data: NormaLegalList[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (norma: NormaLegalList) => void;
  onDelete: (norma: NormaLegalList) => void;
  isLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const columnHelper = createColumnHelper<NormaLegalList>();

export const NormasTable = ({
  data,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sorting = [],
  onSortingChange,
  onEdit,
  onDelete,
  isLoading = false,
  canEdit = true,
  canDelete = true,
}: NormasTableProps) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('tipo_norma_codigo', {
        header: 'Tipo',
        cell: (info) => {
          const codigo = info.getValue();
          const colorMap: Record<string, string> = {
            DEC: 'primary',
            LEY: 'success',
            RES: 'warning',
            CIR: 'info',
            NTC: 'gray',
          };
          const variant = colorMap[codigo] || 'gray';

          return (
            <Badge variant={variant as unknown} size="sm">
              {codigo}
            </Badge>
          );
        },
        size: 80,
      }),

      columnHelper.accessor('codigo_completo', {
        header: 'Código',
        cell: (info) => (
          <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
            {info.getValue()}
          </span>
        ),
        size: 120,
      }),

      columnHelper.accessor('titulo', {
        header: 'Título',
        cell: (info) => (
          <div className="max-w-md">
            <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
              {info.getValue()}
            </p>
          </div>
        ),
        size: 300,
      }),

      columnHelper.display({
        id: 'sistemas',
        header: 'Sistemas Aplicables',
        cell: (info) => {
          const norma = info.row.original;
          const sistemas = [];

          if (norma.aplica_sst) sistemas.push({ label: 'SST', variant: 'warning' });
          if (norma.aplica_ambiental) sistemas.push({ label: 'Ambiental', variant: 'success' });
          if (norma.aplica_calidad) sistemas.push({ label: 'Calidad', variant: 'info' });
          if (norma.aplica_pesv) sistemas.push({ label: 'PESV', variant: 'primary' });

          return (
            <div className="flex flex-wrap gap-1">
              {sistemas.map((sistema, idx) => (
                <Badge key={idx} variant={sistema.variant as unknown} size="sm">
                  {sistema.label}
                </Badge>
              ))}
              {sistemas.length === 0 && <span className="text-xs text-gray-400">-</span>}
            </div>
          );
        },
        size: 180,
      }),

      columnHelper.accessor('fecha_expedicion', {
        header: 'Fecha Expedición',
        cell: (info) => {
          const fecha = new Date(info.getValue());
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {fecha.toLocaleDateString('es-CO')}
            </span>
          );
        },
        size: 120,
      }),

      columnHelper.accessor('vigente', {
        header: 'Estado',
        cell: (info) => {
          const vigente = info.getValue();
          return vigente ? (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Vigente
            </Badge>
          ) : (
            <Badge variant="gray" size="sm">
              <XCircle className="h-3 w-3 mr-1" />
              Derogada
            </Badge>
          );
        },
        size: 100,
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Acciones',
        cell: (info) => {
          const norma = info.row.original;
          if (!canEdit && !canDelete) return null;
          return (
            <div className="flex items-center gap-1">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(norma)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(norma)}
                  className="h-8 w-8 p-0 text-danger-600 hover:text-danger-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
        size: 100,
      }),
    ],
    [onEdit, onDelete, canEdit, canDelete]
  );

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize,
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(pagination) : updater;
      onPageChange(newState.pageIndex + 1);
      onPageSizeChange(newState.pageSize);
    },
    onSortingChange,
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse-subtle space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ExternalLink className="h-12 w-12" />}
          title="No se encontraron normas"
          description="No hay normas que coincidan con los filtros aplicados. Intenta con otros criterios de búsqueda."
        />
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalCount)} de{' '}
            {totalCount} resultados
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page} de {table.getPageCount()}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>

          <div className="ml-2 w-auto">
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 text-sm"
              options={[10, 25, 50, 100].map((size) => ({
                value: size,
                label: `${size} por página`,
              }))}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
