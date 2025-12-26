/**
 * Tabla de Partes Interesadas con TanStack Table
 *
 * Características:
 * - Paginación del servidor
 * - Ordenamiento por columnas
 * - Acciones CRUD
 * - Badges de niveles de influencia/interés
 * - Indicadores de sistemas relacionados
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
import { Edit, Trash2, User, Building2, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import type { ParteInteresada } from '../../types';

interface PartesTableProps {
  data: ParteInteresada[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (parte: ParteInteresada) => void;
  onDelete: (parte: ParteInteresada) => void;
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<ParteInteresada>();

export const PartesTable = ({
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
}: PartesTableProps) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('tipo_nombre', {
        header: 'Tipo',
        cell: (info) => {
          const tipo = info.getValue();
          const isInterna = tipo.toLowerCase().includes('intern');

          return (
            <Badge variant={isInterna ? 'info' : 'success'} size="sm">
              {isInterna ? (
                <Building2 className="h-3 w-3 mr-1" />
              ) : (
                <User className="h-3 w-3 mr-1" />
              )}
              {tipo}
            </Badge>
          );
        },
        size: 150,
      }),

      columnHelper.accessor('nombre', {
        header: 'Nombre',
        cell: (info) => (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {info.getValue()}
            </p>
            {info.row.original.descripcion && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                {info.row.original.descripcion}
              </p>
            )}
          </div>
        ),
        size: 200,
      }),

      columnHelper.accessor('representante', {
        header: 'Representante',
        cell: (info) => {
          const nombre = info.getValue();
          const cargo = info.row.original.cargo_representante;

          if (!nombre && !cargo) {
            return <span className="text-xs text-gray-400">-</span>;
          }

          return (
            <div className="text-sm">
              {nombre && (
                <p className="text-gray-900 dark:text-gray-100">{nombre}</p>
              )}
              {cargo && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{cargo}</p>
              )}
            </div>
          );
        },
        size: 180,
      }),

      columnHelper.accessor('nivel_influencia_display', {
        header: 'Influencia',
        cell: (info) => {
          const nivel = info.row.original.nivel_influencia;
          const variantMap = {
            alta: 'danger',
            media: 'warning',
            baja: 'gray',
          };

          return (
            <Badge variant={variantMap[nivel] as any} size="sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              {info.getValue()}
            </Badge>
          );
        },
        size: 120,
      }),

      columnHelper.accessor('nivel_interes_display', {
        header: 'Interés',
        cell: (info) => {
          const nivel = info.row.original.nivel_interes;
          const variantMap = {
            alto: 'danger',
            medio: 'warning',
            bajo: 'gray',
          };

          return (
            <Badge variant={variantMap[nivel] as any} size="sm">
              <Target className="h-3 w-3 mr-1" />
              {info.getValue()}
            </Badge>
          );
        },
        size: 120,
      }),

      columnHelper.display({
        id: 'sistemas',
        header: 'Sistemas',
        cell: (info) => {
          const parte = info.row.original;
          const sistemas = [];

          if (parte.relacionado_sst) sistemas.push({ label: 'SST', variant: 'warning' });
          if (parte.relacionado_ambiental) sistemas.push({ label: 'Amb', variant: 'success' });
          if (parte.relacionado_calidad) sistemas.push({ label: 'Cal', variant: 'info' });
          if (parte.relacionado_pesv) sistemas.push({ label: 'PESV', variant: 'primary' });

          return (
            <div className="flex flex-wrap gap-1">
              {sistemas.map((sistema, idx) => (
                <Badge key={idx} variant={sistema.variant as any} size="sm">
                  {sistema.label}
                </Badge>
              ))}
              {sistemas.length === 0 && (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          );
        },
        size: 150,
      }),

      columnHelper.display({
        id: 'contacto',
        header: 'Contacto',
        cell: (info) => {
          const parte = info.row.original;
          const hasContacto = parte.email || parte.telefono;

          if (!hasContacto) {
            return <span className="text-xs text-gray-400">-</span>;
          }

          return (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {parte.email && (
                <p className="truncate max-w-[150px]" title={parte.email}>
                  {parte.email}
                </p>
              )}
              {parte.telefono && <p>{parte.telefono}</p>}
            </div>
          );
        },
        size: 150,
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Acciones',
        cell: (info) => {
          const parte = info.row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(parte)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(parte)}
                className="h-8 w-8 p-0 text-danger-600 hover:text-danger-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        size: 100,
      }),
    ],
    [onEdit, onDelete]
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
        <div className="p-6 animate-pulse space-y-3">
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
          icon={<User className="h-12 w-12" />}
          title="No se encontraron partes interesadas"
          description="No hay partes interesadas registradas. Agrega una nueva para comenzar."
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

          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} por página
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};
