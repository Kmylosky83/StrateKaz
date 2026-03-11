/**
 * Sección de Recursos del Proyecto + resumen presupuestal
 * DS: SectionToolbar + StatsGrid + DataTableCard + Badge + Button
 */
import { useState, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Badge, Button, EmptyState } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Wallet, Plus, Trash2, Users, Package } from 'lucide-react';
import { useRecursos, useDeleteRecurso } from '../../../hooks/useProyectos';
import { RecursoFormModal } from './RecursoFormModal';
import type { RecursoProyecto } from '../../../types/proyectos.types';
import type { ColumnDef } from '@tanstack/react-table';

interface RecursosSectionProps {
  proyectoId: number;
}

const TIPO_BADGE: Record<string, 'info' | 'warning' | 'success' | 'gray'> = {
  humano: 'info',
  material: 'warning',
  equipo: 'success',
  servicio: 'gray',
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

export const RecursosSection = ({ proyectoId }: RecursosSectionProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.PLANIFICACION, 'create');
  const canEdit = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.PLANIFICACION, 'edit');
  const canDelete = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.PLANIFICACION, 'delete');
  const { data: recursosData, isLoading } = useRecursos({
    proyecto: proyectoId,
    is_active: true,
  });
  const deleteMutation = useDeleteRecurso();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<RecursoProyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecursoProyecto | null>(null);

  const recursos: RecursoProyecto[] =
    recursosData?.results ?? (Array.isArray(recursosData) ? recursosData : []);

  const stats = useMemo(() => {
    const totalPresupuesto = recursos.reduce((sum, r) => sum + parseFloat(r.costo_total || '0'), 0);
    const humanos = recursos.filter((r) => r.tipo === 'humano').length;
    const otros = recursos.filter((r) => r.tipo !== 'humano').length;
    return { totalPresupuesto, humanos, otros };
  }, [recursos]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<RecursoProyecto>[] = [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={TIPO_BADGE[row.original.tipo] || 'gray'} size="sm">
          {row.original.tipo_display || row.original.tipo}
        </Badge>
      ),
      size: 100,
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.nombre}</p>
          {row.original.rol_proyecto && (
            <p className="text-xs text-gray-500">{row.original.rol_proyecto}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'usuario_nombre',
      header: 'Usuario',
      cell: ({ row }) => row.original.usuario_nombre || '-',
    },
    {
      accessorKey: 'dedicacion_porcentaje',
      header: 'Dedicación',
      cell: ({ row }) => `${row.original.dedicacion_porcentaje}%`,
      size: 90,
    },
    {
      accessorKey: 'costo_unitario',
      header: 'Costo Unit.',
      cell: ({ row }) => formatCurrency(row.original.costo_unitario),
      size: 120,
    },
    {
      accessorKey: 'cantidad',
      header: 'Cant.',
      cell: ({ row }) => row.original.cantidad,
      size: 60,
    },
    {
      accessorKey: 'costo_total',
      header: 'Costo Total',
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.costo_total)}</span>
      ),
      size: 120,
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {canEdit && (
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
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
      size: 120,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <SectionToolbar
          title="Recursos del Proyecto"
          count={recursos.length}
          primaryAction={
            canCreate
              ? {
                  label: 'Agregar Recurso',
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

        {recursos.length > 0 && (
          <StatsGrid
            columns={3}
            variant="compact"
            stats={[
              {
                label: 'Presupuesto Total',
                value: formatCurrency(stats.totalPresupuesto),
                icon: Wallet,
                iconColor: 'primary',
              },
              {
                label: 'Recursos Humanos',
                value: stats.humanos,
                icon: Users,
                iconColor: 'info',
              },
              {
                label: 'Otros Recursos',
                value: stats.otros,
                icon: Package,
                iconColor: 'warning',
              },
            ]}
          />
        )}

        {recursos.length > 0 ? (
          <DataTableCard columns={columns} data={recursos} isLoading={isLoading} />
        ) : (
          <EmptyState
            icon={<Wallet className="h-12 w-12" />}
            title="Sin recursos asignados"
            description="Agrega recursos humanos, materiales, equipos o servicios al proyecto"
            action={
              canCreate ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditItem(null);
                    setShowForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Primer Recurso
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      <RecursoFormModal
        recurso={editItem}
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
        title="Eliminar Recurso"
        message={`¿Está seguro de eliminar el recurso "${deleteTarget?.nombre}"?`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
