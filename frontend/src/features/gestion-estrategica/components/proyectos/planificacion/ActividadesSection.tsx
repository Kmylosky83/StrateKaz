/**
 * Sección de Actividades/WBS del Proyecto
 * DS: SectionToolbar + DataTableCard + Badge + Button
 */
import { useState } from 'react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Badge, Button, EmptyState } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useActividades, useDeleteActividad } from '../../../hooks/useProyectos';
import { ActividadFormModal } from './ActividadFormModal';
import type { ActividadProyecto } from '../../../types/proyectos.types';
import type { ColumnDef } from '@tanstack/react-table';

interface ActividadesSectionProps {
  proyectoId: number;
}

const ESTADO_BADGE: Record<string, 'success' | 'warning' | 'gray' | 'danger' | 'info'> = {
  pendiente: 'gray',
  en_progreso: 'info',
  completada: 'success',
  bloqueada: 'danger',
  cancelada: 'warning',
};

export const ActividadesSection = ({ proyectoId }: ActividadesSectionProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.PLANIFICACION, 'create');
  const canEdit = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.PLANIFICACION, 'edit');
  const canDelete = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.PLANIFICACION, 'delete');

  const { data: actividadesData, isLoading } = useActividades({
    proyecto: proyectoId,
    is_active: true,
  });
  const deleteMutation = useDeleteActividad();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ActividadProyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActividadProyecto | null>(null);

  const actividades: ActividadProyecto[] =
    actividadesData?.results ?? (Array.isArray(actividadesData) ? actividadesData : []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<ActividadProyecto>[] = [
    {
      accessorKey: 'codigo_wbs',
      header: 'WBS',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-500">{row.original.codigo_wbs || '-'}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'nombre',
      header: 'Actividad',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.nombre}</p>
          {row.original.fase_nombre && (
            <p className="text-xs text-gray-500">{row.original.fase_nombre}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={ESTADO_BADGE[row.original.estado] || 'gray'} size="sm">
          {row.original.estado_display || row.original.estado}
        </Badge>
      ),
      size: 120,
    },
    {
      accessorKey: 'responsable_nombre',
      header: 'Responsable',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {row.original.responsable_nombre || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'fecha_inicio_plan',
      header: 'Inicio',
      cell: ({ row }) =>
        row.original.fecha_inicio_plan
          ? new Date(row.original.fecha_inicio_plan).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
            })
          : '-',
      size: 90,
    },
    {
      accessorKey: 'fecha_fin_plan',
      header: 'Fin',
      cell: ({ row }) =>
        row.original.fecha_fin_plan
          ? new Date(row.original.fecha_fin_plan).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
            })
          : '-',
      size: 90,
    },
    {
      accessorKey: 'porcentaje_avance',
      header: 'Avance',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                row.original.porcentaje_avance === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${row.original.porcentaje_avance}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8">{row.original.porcentaje_avance}%</span>
        </div>
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
          title="Actividades / WBS"
          count={actividades.length}
          primaryAction={
            canCreate
              ? {
                  label: 'Nueva Actividad',
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

        {actividades.length > 0 ? (
          <DataTableCard columns={columns} data={actividades} isLoading={isLoading} />
        ) : (
          <EmptyState
            icon={<ListChecks className="h-12 w-12" />}
            title="Sin actividades registradas"
            description="Crea actividades para desglosar el trabajo del proyecto (WBS)"
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
                  Crear Primera Actividad
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      <ActividadFormModal
        actividad={editItem}
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
        title="Eliminar Actividad"
        message={`¿Está seguro de eliminar la actividad "${deleteTarget?.nombre}"?`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
