/**
 * Tabla de Reglamentos Internos con TanStack Table
 *
 * Características:
 * - Paginación del servidor
 * - Colores por estado (gris=borrador, amarillo=en_revision, azul=aprobado, verde=vigente, rojo=obsoleto)
 * - Control de versiones (muestra versión actual)
 * - Badges de sistemas aplicables
 * - Acciones CRUD
 * - Indicador de fecha de próxima revisión
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
import {
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  FileCheck,
  XCircle,
  Download,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/forms';
import { cn } from '@/utils/cn';
import type { Reglamento } from '../../types/cumplimiento.types';

interface ReglamentosTableProps {
  data: Reglamento[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (reglamento: Reglamento) => void;
  onDelete: (reglamento: Reglamento) => void;
  isLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const columnHelper = createColumnHelper<Reglamento>();

/**
 * Badge de estado con colores según especificación
 */
const EstadoBadge = ({ estado }: { estado: Reglamento['estado'] }) => {
  const getVariantAndIcon = () => {
    switch (estado) {
      case 'borrador':
        return {
          variant: 'gray' as const,
          icon: <FileText className="h-3 w-3 mr-1" />,
          label: 'Borrador',
        };
      case 'en_revision':
        return {
          variant: 'warning' as const,
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'En Revisión',
        };
      case 'aprobado':
        return {
          variant: 'info' as const,
          icon: <FileCheck className="h-3 w-3 mr-1" />,
          label: 'Aprobado',
        };
      case 'vigente':
        return {
          variant: 'success' as const,
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          label: 'Vigente',
        };
      case 'obsoleto':
        return {
          variant: 'danger' as const,
          icon: <XCircle className="h-3 w-3 mr-1" />,
          label: 'Obsoleto',
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
 * Componente de sistemas aplicables
 */
const SistemasBadges = ({ reglamento }: { reglamento: Reglamento }) => {
  const sistemas = [];
  if (reglamento.aplica_sst) sistemas.push({ label: 'SST', color: 'warning' });
  if (reglamento.aplica_ambiental) sistemas.push({ label: 'Ambiental', color: 'success' });
  if (reglamento.aplica_calidad) sistemas.push({ label: 'Calidad', color: 'info' });
  if (reglamento.aplica_pesv) sistemas.push({ label: 'PESV', color: 'primary' });

  if (sistemas.length === 0) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {sistemas.map((sistema) => (
        <Badge key={sistema.label} variant={sistema.color as any} size="sm">
          {sistema.label}
        </Badge>
      ))}
    </div>
  );
};

/**
 * Indicador de próxima revisión con alertas
 */
const ProximaRevisionBadge = ({ fecha }: { fecha: string | null }) => {
  if (!fecha) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  const fechaRevision = new Date(fecha);
  const hoy = new Date();
  const diasRestantes = Math.ceil(
    (fechaRevision.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getColor = () => {
    if (diasRestantes < 0) return 'text-danger-600 dark:text-danger-400 font-semibold';
    if (diasRestantes <= 30) return 'text-warning-600 dark:text-warning-400 font-medium';
    if (diasRestantes <= 90) return 'text-info-600 dark:text-info-400';
    return 'text-success-600 dark:text-success-400';
  };

  return (
    <div className="flex flex-col">
      <span className={cn('text-sm', getColor())}>{fechaRevision.toLocaleDateString('es-CO')}</span>
      {diasRestantes < 30 && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {diasRestantes < 0 ? `Vencida (${Math.abs(diasRestantes)}d)` : `${diasRestantes} días`}
        </span>
      )}
    </div>
  );
};

export const ReglamentosTable = ({
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
}: ReglamentosTableProps) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('codigo', {
        header: 'Código',
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {info.getValue()}
          </span>
        ),
        size: 100,
      }),

      columnHelper.accessor('nombre', {
        header: 'Nombre del Reglamento',
        cell: (info) => (
          <div className="max-w-md">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {info.getValue()}
            </p>
            {info.row.original.tipo_detail && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tipo: {info.row.original.tipo_detail.nombre}
              </p>
            )}
          </div>
        ),
        size: 250,
      }),

      columnHelper.accessor('version_actual', {
        header: 'Versión',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
              v{info.getValue()}
            </span>
          </div>
        ),
        size: 80,
      }),

      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: (info) => <EstadoBadge estado={info.getValue()} />,
        size: 140,
      }),

      columnHelper.display({
        id: 'sistemas',
        header: 'Sistemas',
        cell: (info) => <SistemasBadges reglamento={info.row.original} />,
        size: 150,
      }),

      columnHelper.accessor('fecha_vigencia', {
        header: 'Fecha Vigencia',
        cell: (info) => {
          const fecha = info.getValue();
          if (!fecha) return <span className="text-xs text-gray-400">-</span>;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(fecha).toLocaleDateString('es-CO')}
            </span>
          );
        },
        size: 120,
      }),

      columnHelper.accessor('fecha_proxima_revision', {
        header: 'Próxima Revisión',
        cell: (info) => <ProximaRevisionBadge fecha={info.getValue()} />,
        size: 140,
      }),

      columnHelper.accessor('aprobado_por_detail', {
        header: 'Aprobado Por',
        cell: (info) => {
          const aprobador = info.getValue();
          if (!aprobador) return <span className="text-xs text-gray-400">-</span>;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {aprobador.first_name} {aprobador.last_name}
            </span>
          );
        },
        size: 150,
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Acciones',
        cell: (info) => {
          const reglamento = info.row.original;
          return (
            <div className="flex items-center gap-1">
              {reglamento.documento && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(reglamento.documento || '', '_blank')}
                  className="h-8 w-8 p-0"
                  title="Descargar documento"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(reglamento)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(reglamento)}
                  className="h-8 w-8 p-0 text-danger-600 hover:text-danger-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
        size: 120,
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
          icon={<FileText className="h-12 w-12" />}
          title="No se encontraron reglamentos"
          description="No hay reglamentos que coincidan con los filtros aplicados. Intenta con otros criterios de búsqueda."
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
