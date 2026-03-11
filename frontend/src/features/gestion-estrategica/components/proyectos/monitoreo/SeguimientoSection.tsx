/**
 * Sección de Seguimiento EVM del Proyecto
 * DS: SectionToolbar + DataTableCard + Badge + StatsGrid
 */
import { useState } from 'react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Badge, Button, EmptyState } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import { useSeguimientos, useDeleteSeguimiento } from '../../../hooks/useProyectos';
import { SeguimientoFormModal } from './SeguimientoFormModal';
import { CurvaSChart } from './CurvaSChart';
import type { SeguimientoProyecto } from '../../../types/proyectos.types';
import type { ColumnDef } from '@tanstack/react-table';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

interface SeguimientoSectionProps {
  proyectoId: number;
}

const SEMAFORO: Record<string, 'success' | 'warning' | 'danger'> = {
  verde: 'success',
  amarillo: 'warning',
  rojo: 'danger',
};

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const SeguimientoSection = ({ proyectoId }: SeguimientoSectionProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.EJECUCION_MONITOREO, 'create');

  const { data: seguimientosData, isLoading } = useSeguimientos({ proyecto: proyectoId });
  const deleteMutation = useDeleteSeguimiento();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SeguimientoProyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeguimientoProyecto | null>(null);

  const seguimientos: SeguimientoProyecto[] =
    seguimientosData?.results ?? (Array.isArray(seguimientosData) ? seguimientosData : []);

  // KPIs from last seguimiento
  const last = seguimientos.length > 0 ? seguimientos[0] : null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<SeguimientoProyecto>[] = [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ row }) =>
        new Date(row.original.fecha).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      size: 120,
    },
    {
      accessorKey: 'porcentaje_avance',
      header: 'Avance',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500"
              style={{ width: `${row.original.porcentaje_avance}%` }}
            />
          </div>
          <span className="text-xs">{row.original.porcentaje_avance}%</span>
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: 'costo_acumulado',
      header: 'Costo Acum.',
      cell: ({ row }) => formatCurrency(row.original.costo_acumulado),
      size: 120,
    },
    {
      accessorKey: 'estado_general',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={SEMAFORO[row.original.estado_general] || 'gray'} size="sm">
          {row.original.estado_general}
        </Badge>
      ),
      size: 80,
    },
    {
      accessorKey: 'spi',
      header: 'SPI',
      cell: ({ row }) => {
        const spi = row.original.spi;
        if (spi == null) return '-';
        return (
          <span
            className={spi >= 1 ? 'text-green-600' : spi >= 0.9 ? 'text-amber-600' : 'text-red-600'}
          >
            {spi.toFixed(2)}
          </span>
        );
      },
      size: 70,
    },
    {
      accessorKey: 'cpi',
      header: 'CPI',
      cell: ({ row }) => {
        const cpi = row.original.cpi;
        if (cpi == null) return '-';
        return (
          <span
            className={cpi >= 1 ? 'text-green-600' : cpi >= 0.9 ? 'text-amber-600' : 'text-red-600'}
          >
            {cpi.toFixed(2)}
          </span>
        );
      },
      size: 70,
    },
    {
      accessorKey: 'logros_periodo',
      header: 'Logros',
      cell: ({ row }) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
          {row.original.logros_periodo || '-'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditItem(row.original);
              setShowForm(true);
            }}
          >
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
      size: 120,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <SectionToolbar
          title="Seguimiento EVM"
          count={seguimientos.length}
          primaryAction={
            canCreate
              ? {
                  label: 'Nuevo Seguimiento',
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => {
                    setEditItem(null);
                    setShowForm(true);
                  },
                  variant: 'primary',
                }
              : undefined
          }
        />

        {/* KPIs inline */}
        {last && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">SPI</p>
              <p
                className={`text-lg font-bold ${(last.spi ?? 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}
              >
                {last.spi?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">CPI</p>
              <p
                className={`text-lg font-bold ${(last.cpi ?? 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}
              >
                {last.cpi?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avance</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {last.porcentaje_avance}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
              <Badge variant={SEMAFORO[last.estado_general] || 'gray'} size="sm">
                {last.estado_general}
              </Badge>
            </div>
          </div>
        )}

        {/* Curva S */}
        {seguimientos.length >= 2 && <CurvaSChart proyectoId={proyectoId} />}

        {/* Data table */}
        {seguimientos.length > 0 ? (
          <DataTableCard columns={columns} data={seguimientos} isLoading={isLoading} />
        ) : (
          <EmptyState
            icon={<BarChart3 className="h-12 w-12" />}
            title="Sin registros de seguimiento"
            description="Registra el avance y métricas EVM del proyecto periódicamente"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditItem(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Primer Seguimiento
              </Button>
            }
          />
        )}
      </div>

      <SeguimientoFormModal
        seguimiento={editItem}
        proyectoId={proyectoId}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Seguimiento"
        message={`¿Está seguro de eliminar el seguimiento del ${deleteTarget?.fecha}?`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
