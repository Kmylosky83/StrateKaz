/**
 * Sección de Interesados/Stakeholders del proyecto
 * DS: SectionToolbar + DataTableCard + Badge + Button
 */
import { useState } from 'react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Badge, Button, EmptyState } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Users, Download, Plus, Trash2 } from 'lucide-react';
import { useInteresados, useDeleteInteresado } from '../../../hooks/useProyectos';
import { StakeholderFormModal } from './StakeholderFormModal';
import { ImportarStakeholdersModal } from './ImportarStakeholdersModal';
import type { InteresadoProyecto } from '../../../types/proyectos.types';
import type { ColumnDef } from '@tanstack/react-table';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

interface StakeholdersSectionProps {
  proyectoId: number;
}

const NIVEL_BADGE: Record<string, 'success' | 'warning' | 'gray'> = {
  alto: 'success',
  alta: 'success',
  medio: 'warning',
  media: 'warning',
  bajo: 'gray',
  baja: 'gray',
};

export const StakeholdersSection = ({ proyectoId }: StakeholdersSectionProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.INICIACION, 'create');

  const { data: interesadosData, isLoading } = useInteresados({
    proyecto: proyectoId,
    is_active: true,
  });
  const deleteMutation = useDeleteInteresado();

  const [showForm, setShowForm] = useState(false);
  const [showImportar, setShowImportar] = useState(false);
  const [editItem, setEditItem] = useState<InteresadoProyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InteresadoProyecto | null>(null);

  const interesados: InteresadoProyecto[] =
    interesadosData?.results ?? (Array.isArray(interesadosData) ? interesadosData : []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<InteresadoProyecto>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.nombre}</p>
          {row.original.cargo_rol && (
            <p className="text-xs text-gray-500">{row.original.cargo_rol}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'organizacion',
      header: 'Organización',
    },
    {
      accessorKey: 'nivel_interes',
      header: 'Interés',
      cell: ({ row }) => (
        <Badge variant={NIVEL_BADGE[row.original.nivel_interes] || 'gray'} size="sm">
          {row.original.nivel_interes_display || row.original.nivel_interes}
        </Badge>
      ),
    },
    {
      accessorKey: 'nivel_influencia',
      header: 'Influencia',
      cell: ({ row }) => (
        <Badge variant={NIVEL_BADGE[row.original.nivel_influencia] || 'gray'} size="sm">
          {row.original.nivel_influencia_display || row.original.nivel_influencia}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_internal',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={row.original.is_internal ? 'info' : 'gray'} size="sm">
          {row.original.is_internal ? 'Interno' : 'Externo'}
        </Badge>
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
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <SectionToolbar
          title="Interesados del Proyecto"
          count={interesados.length}
          primaryAction={
            canCreate
              ? {
                  label: 'Agregar',
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => {
                    setEditItem(null);
                    setShowForm(true);
                  },
                  variant: 'primary',
                }
              : undefined
          }
          extraActions={[
            {
              label: 'Importar desde Contexto',
              icon: <Download className="h-4 w-4" />,
              onClick: () => setShowImportar(true),
              variant: 'secondary',
            },
          ]}
        />

        {interesados.length > 0 ? (
          <DataTableCard columns={columns} data={interesados} isLoading={isLoading} />
        ) : (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Sin interesados registrados"
            description="Agrega interesados manualmente o importa desde la matriz de Contexto Organizacional (ISO 9001 §4.2)"
            action={
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditItem(null);
                    setShowForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Manual
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowImportar(true)}>
                  <Download className="h-4 w-4 mr-1" />
                  Importar desde Contexto
                </Button>
              </div>
            }
          />
        )}
      </div>

      <StakeholderFormModal
        interesado={editItem}
        proyectoId={proyectoId}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
      />

      <ImportarStakeholdersModal
        proyectoId={proyectoId}
        isOpen={showImportar}
        onClose={() => setShowImportar(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Interesado"
        message={`¿Está seguro de eliminar a "${deleteTarget?.nombre}" del proyecto?`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
