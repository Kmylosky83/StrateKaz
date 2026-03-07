/**
 * Sección de Lecciones Aprendidas del Proyecto
 * DS: SectionToolbar + DataTableCard + Badge + Button
 */
import { useState } from 'react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Badge, Button, EmptyState } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useLecciones, useDeleteLeccion } from '../../../hooks/useProyectos';
import { LeccionFormModal } from './LeccionFormModal';
import type { LeccionAprendida } from '../../../types/proyectos.types';
import type { ColumnDef } from '@tanstack/react-table';

interface LeccionesSectionProps {
  proyectoId: number;
}

const TIPO_BADGE: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  exito: 'success',
  problema: 'danger',
  mejora: 'warning',
  buena_practica: 'info',
};

export const LeccionesSection = ({ proyectoId }: LeccionesSectionProps) => {
  const { data: leccionesData, isLoading } = useLecciones({
    proyecto: proyectoId,
    is_active: true,
  });
  const deleteMutation = useDeleteLeccion();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<LeccionAprendida | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeccionAprendida | null>(null);

  const lecciones: LeccionAprendida[] =
    leccionesData?.results ?? (Array.isArray(leccionesData) ? leccionesData : []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<LeccionAprendida>[] = [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={TIPO_BADGE[row.original.tipo] || 'gray'} size="sm">
          {row.original.tipo_display || row.original.tipo}
        </Badge>
      ),
      size: 120,
    },
    {
      accessorKey: 'titulo',
      header: 'Título',
      cell: ({ row }) => (
        <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.titulo}</p>
      ),
    },
    {
      accessorKey: 'situacion',
      header: 'Situación',
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {row.original.situacion}
        </p>
      ),
    },
    {
      accessorKey: 'recomendacion',
      header: 'Recomendación',
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {row.original.recomendacion}
        </p>
      ),
    },
    {
      accessorKey: 'area_conocimiento',
      header: 'Área',
      cell: ({ row }) => row.original.area_conocimiento || '-',
      size: 120,
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
          title="Lecciones Aprendidas"
          count={lecciones.length}
          primaryAction={{
            label: 'Nueva Lección',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => {
              setEditItem(null);
              setShowForm(true);
            },
            variant: 'primary',
          }}
        />

        {lecciones.length > 0 ? (
          <DataTableCard columns={columns} data={lecciones} isLoading={isLoading} />
        ) : (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="Sin lecciones registradas"
            description="Documenta las lecciones aprendidas del proyecto para beneficio futuro"
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
                Registrar Primera Lección
              </Button>
            }
          />
        )}
      </div>

      <LeccionFormModal
        leccion={editItem}
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
        title="Eliminar Lección"
        message={`¿Está seguro de eliminar la lección "${deleteTarget?.titulo}"?`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
