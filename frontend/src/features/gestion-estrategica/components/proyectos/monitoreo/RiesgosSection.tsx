/**
 * Sección de Riesgos del Proyecto — Lista + Matriz
 * DS: SectionToolbar + StatsGrid + DataTableCard + Badge + ViewToggle
 */
import { useState } from 'react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Badge, Button, EmptyState, ViewToggle } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ShieldAlert, Plus, Trash2, List, Grid3X3, AlertTriangle } from 'lucide-react';
import { useRiesgosProyecto, useDeleteRiesgo } from '../../../hooks/useProyectos';
import { RiesgoFormModal } from './RiesgoFormModal';
import { MatrizRiesgos as MatrizRiesgosView } from './MatrizRiesgos';
import type { RiesgoProyecto } from '../../../types/proyectos.types';
import type { ColumnDef } from '@tanstack/react-table';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

interface RiesgosSectionProps {
  proyectoId: number;
}

type ViewMode = 'lista' | 'matriz';

const VIEW_OPTIONS = [
  { value: 'lista' as const, label: 'Lista', icon: List },
  { value: 'matriz' as const, label: 'Matriz', icon: Grid3X3 },
];

const TIPO_BADGE: Record<string, 'danger' | 'success'> = {
  amenaza: 'danger',
  oportunidad: 'success',
};

export const RiesgosSection = ({ proyectoId }: RiesgosSectionProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.EJECUCION_MONITOREO, 'create');

  const { data: riesgosData, isLoading } = useRiesgosProyecto({
    proyecto: proyectoId,
    is_active: true,
  });
  const deleteMutation = useDeleteRiesgo();

  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<RiesgoProyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RiesgoProyecto | null>(null);

  const riesgos: RiesgoProyecto[] =
    riesgosData?.results ?? (Array.isArray(riesgosData) ? riesgosData : []);

  const altoNivel = riesgos.filter((r) => (r.nivel_riesgo ?? 0) >= 15).length;
  const materializados = riesgos.filter((r) => r.is_materializado).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<RiesgoProyecto>[] = [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
          {row.original.codigo}
        </span>
      ),
      size: 80,
    },
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
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
          {row.original.descripcion}
        </p>
      ),
    },
    {
      accessorKey: 'probabilidad',
      header: 'Prob.',
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.probabilidad_display || row.original.probabilidad}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'impacto',
      header: 'Imp.',
      cell: ({ row }) => (
        <span className="text-xs">{row.original.impacto_display || row.original.impacto}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'nivel_riesgo',
      header: 'Nivel',
      cell: ({ row }) => {
        const nivel = row.original.nivel_riesgo ?? 0;
        const variant = nivel >= 15 ? 'danger' : nivel >= 8 ? 'warning' : 'success';
        return (
          <Badge variant={variant} size="sm">
            {nivel}
          </Badge>
        );
      },
      size: 70,
    },
    {
      accessorKey: 'responsable_nombre',
      header: 'Responsable',
      cell: ({ row }) => row.original.responsable_nombre || '-',
    },
    {
      accessorKey: 'is_materializado',
      header: 'Mat.',
      cell: ({ row }) =>
        row.original.is_materializado ? (
          <Badge variant="danger" size="sm">
            Sí
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">No</span>
        ),
      size: 60,
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SectionToolbar
            title="Riesgos del Proyecto"
            count={riesgos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nuevo Riesgo',
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
          <ViewToggle value={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
        </div>

        {riesgos.length > 0 && (
          <StatsGrid
            columns={3}
            variant="compact"
            stats={[
              {
                label: 'Total Riesgos',
                value: riesgos.length,
                icon: ShieldAlert,
                iconColor: 'primary',
              },
              {
                label: 'Nivel Alto',
                value: altoNivel,
                icon: AlertTriangle,
                iconColor: 'danger',
              },
              {
                label: 'Materializados',
                value: materializados,
                icon: ShieldAlert,
                iconColor: 'warning',
              },
            ]}
          />
        )}

        {riesgos.length > 0 ? (
          viewMode === 'lista' ? (
            <DataTableCard columns={columns} data={riesgos} isLoading={isLoading} />
          ) : (
            <MatrizRiesgosView proyectoId={proyectoId} />
          )
        ) : (
          <EmptyState
            icon={<ShieldAlert className="h-12 w-12" />}
            title="Sin riesgos registrados"
            description="Identifica y registra los riesgos del proyecto"
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
                Registrar Primer Riesgo
              </Button>
            }
          />
        )}
      </div>

      <RiesgoFormModal
        riesgo={editItem}
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
        title="Eliminar Riesgo"
        message={`¿Está seguro de eliminar el riesgo "${deleteTarget?.codigo}"?`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
