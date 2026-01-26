/**
 * Tabla de Requisitos Legales con TanStack Table
 *
 * Características:
 * - Paginación del servidor
 * - Colores por estado (verde=vigente, amarillo=próximo, rojo=vencido)
 * - Indicador de días para vencer
 * - Badges de sistemas aplicables
 * - Acciones CRUD
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
import { Edit, Trash2, FileText, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import type { EmpresaRequisito } from '../../types/requisitosLegales';

interface RequisitosTableProps {
  data: EmpresaRequisito[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (requisito: EmpresaRequisito) => void;
  onDelete: (requisito: EmpresaRequisito) => void;
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<EmpresaRequisito>();

/**
 * Obtiene el badge de estado según días para vencer
 */
const EstadoBadge = ({ requisito }: { requisito: EmpresaRequisito }) => {
  const { estado, dias_para_vencer } = requisito;

  const getVariantAndIcon = () => {
    switch (estado) {
      case 'vencido':
        return {
          variant: 'danger' as const,
          icon: <XCircle className="h-3 w-3 mr-1" />,
          label: 'Vencido',
        };
      case 'proximo_vencer':
        return {
          variant: 'warning' as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: 'Próximo a Vencer',
        };
      case 'vigente':
        return {
          variant: 'success' as const,
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          label: 'Vigente',
        };
      case 'en_tramite':
        return {
          variant: 'info' as const,
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'En Trámite',
        };
      case 'renovando':
        return {
          variant: 'warning' as const,
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Renovando',
        };
      case 'no_aplica':
        return {
          variant: 'gray' as const,
          icon: null,
          label: 'No Aplica',
        };
      default:
        return {
          variant: 'gray' as const,
          icon: null,
          label: estado,
        };
    }
  };

  const { variant, icon, label } = getVariantAndIcon();

  return (
    <Badge variant={variant} size="sm">
      {icon}
      {label}
    </Badge>
  );
};

/**
 * Componente de días para vencer con color
 */
const DiasVencerBadge = ({ dias, estado }: { dias: number | null; estado: string }) => {
  if (estado === 'no_aplica' || dias === null) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  const getColor = () => {
    if (dias < 0) return 'text-danger-600 dark:text-danger-400 font-semibold';
    if (dias <= 7) return 'text-danger-600 dark:text-danger-400 font-semibold';
    if (dias <= 30) return 'text-warning-600 dark:text-warning-400 font-medium';
    return 'text-success-600 dark:text-success-400';
  };

  const getText = () => {
    if (dias < 0) return `Vencido (${Math.abs(dias)}d)`;
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Mañana';
    return `${dias} días`;
  };

  return (
    <span className={cn('text-sm', getColor())}>
      {getText()}
    </span>
  );
};

export const RequisitosTable = ({
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
}: RequisitosTableProps) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('requisito_nombre', {
        header: 'Requisito Legal',
        cell: (info) => (
          <div className="max-w-md">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {info.getValue()}
            </p>
            {info.row.original.numero_documento && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Nro: {info.row.original.numero_documento}
              </p>
            )}
          </div>
        ),
        size: 250,
      }),

      columnHelper.display({
        id: 'sistemas',
        header: 'Sistemas',
        cell: (info) => {
          const requisito = info.row.original;
          // Los sistemas vienen del RequisitoLegal, no del EmpresaRequisito
          // Para esto necesitaríamos expandir la data, por ahora mostramos placeholder
          return (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-400">Ver detalle</span>
            </div>
          );
        },
        size: 120,
      }),

      columnHelper.accessor('fecha_expedicion', {
        header: 'Expedición',
        cell: (info) => {
          const fecha = info.getValue();
          if (!fecha) return <span className="text-xs text-gray-400">-</span>;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(fecha).toLocaleDateString('es-CO')}
            </span>
          );
        },
        size: 110,
      }),

      columnHelper.accessor('fecha_vencimiento', {
        header: 'Vencimiento',
        cell: (info) => {
          const fecha = info.getValue();
          if (!fecha) return <span className="text-xs text-gray-400">-</span>;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(fecha).toLocaleDateString('es-CO')}
            </span>
          );
        },
        size: 110,
      }),

      columnHelper.accessor('dias_para_vencer', {
        header: 'Días para Vencer',
        cell: (info) => (
          <DiasVencerBadge
            dias={info.getValue()}
            estado={info.row.original.estado}
          />
        ),
        size: 130,
      }),

      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: (info) => <EstadoBadge requisito={info.row.original} />,
        size: 140,
      }),

      columnHelper.accessor('responsable_nombre', {
        header: 'Responsable',
        cell: (info) => {
          const nombre = info.getValue();
          if (!nombre) return <span className="text-xs text-gray-400">-</span>;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {nombre}
            </span>
          );
        },
        size: 150,
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Acciones',
        cell: (info) => {
          const requisito = info.row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(requisito)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(requisito)}
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
          icon={<FileText className="h-12 w-12" />}
          title="No se encontraron requisitos"
          description="No hay requisitos que coincidan con los filtros aplicados. Intenta con otros criterios de búsqueda."
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
