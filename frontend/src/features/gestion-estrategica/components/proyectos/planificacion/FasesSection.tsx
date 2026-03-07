/**
 * Sección de Fases del Proyecto (WBS nivel 1)
 * DS: SectionToolbar + Card + Badge + Button + ConfirmDialog
 */
import { useState } from 'react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Layers, Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { useFases, useDeleteFase } from '../../../hooks/useProyectos';
import { FaseFormModal } from './FaseFormModal';
import type { FaseProyecto } from '../../../types/proyectos.types';

interface FasesSectionProps {
  proyectoId: number;
}

export const FasesSection = ({ proyectoId }: FasesSectionProps) => {
  const { data: fasesData, isLoading } = useFases({ proyecto: proyectoId, is_active: true });
  const deleteMutation = useDeleteFase();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<FaseProyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FaseProyecto | null>(null);

  const fases: FaseProyecto[] = fasesData?.results ?? (Array.isArray(fasesData) ? fasesData : []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <SectionToolbar
          title="Fases del Proyecto"
          count={fases.length}
          primaryAction={{
            label: 'Nueva Fase',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => {
              setEditItem(null);
              setShowForm(true);
            },
            variant: 'primary',
          }}
        />

        {fases.length > 0 ? (
          <div className="space-y-3">
            {fases.map((fase) => (
              <Card key={fase.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info" size="sm">
                          Fase {fase.orden}
                        </Badge>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {fase.nombre}
                        </h4>
                      </div>
                      {fase.descripcion && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {fase.descripcion}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {fase.fecha_inicio_plan && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(fase.fecha_inicio_plan).toLocaleDateString('es-CO')}
                            {fase.fecha_fin_plan &&
                              ` - ${new Date(fase.fecha_fin_plan).toLocaleDateString('es-CO')}`}
                          </span>
                        )}
                        <Badge
                          variant={
                            fase.porcentaje_avance === 100
                              ? 'success'
                              : fase.porcentaje_avance > 0
                                ? 'warning'
                                : 'gray'
                          }
                          size="sm"
                        >
                          {fase.porcentaje_avance}%
                        </Badge>
                      </div>
                      {fase.entregables && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          Entregables: {fase.entregables}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditItem(fase);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(fase)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {fase.porcentaje_avance > 0 && (
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          fase.porcentaje_avance === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${fase.porcentaje_avance}%` }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Layers className="h-12 w-12" />}
            title="Sin fases definidas"
            description="Define las fases del proyecto para organizar las actividades (WBS nivel 1)"
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
                Crear Primera Fase
              </Button>
            }
          />
        )}
      </div>

      <FaseFormModal
        fase={editItem}
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
        title="Eliminar Fase"
        message={`¿Está seguro de eliminar la fase "${deleteTarget?.nombre}"? Las actividades asociadas quedarán sin fase.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
