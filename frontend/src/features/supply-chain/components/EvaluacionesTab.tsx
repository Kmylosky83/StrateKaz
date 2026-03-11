/**
 * Tab Evaluaciones - Lista de evaluaciones de proveedores con CRUD (Tipo A — CRUD)
 * SectionToolbar + Card+Table + BaseModal + ConfirmDialog
 */
import { useState } from 'react';
import { Plus, Edit, CheckCircle, XCircle, ClipboardCheck, Settings } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import { EvaluacionProveedorForm } from './EvaluacionProveedorForm';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useEvaluaciones,
  useAprobarEvaluacion,
  useRechazarEvaluacion,
  useCriterios,
  useCreateCriterio,
  useUpdateCriterio,
  useDeleteCriterio,
} from '../hooks/useEvaluaciones';
import type { EvaluacionProveedor, CriterioEvaluacion } from '../types';

// ==================== UTILIDADES ====================

const getEstadoBadgeVariant = (
  estado: string
): 'success' | 'warning' | 'danger' | 'gray' | 'info' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'gray' | 'info' | 'primary'> = {
    BORRADOR: 'gray',
    EN_PROCESO: 'info',
    COMPLETADA: 'primary',
    APROBADA: 'success',
  };
  return map[estado] || 'gray';
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// ==================== COMPONENTE ====================

export function EvaluacionesTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.EVALUACIONES_PROV, 'create');

  const [showForm, setShowForm] = useState(false);
  const [editEvaluacion, setEditEvaluacion] = useState<EvaluacionProveedor | undefined>(undefined);
  const [showCriterios, setShowCriterios] = useState(false);
  const [editCriterio, setEditCriterio] = useState<CriterioEvaluacion | null>(null);
  const [showCriterioForm, setShowCriterioForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  // Confirm/Reject states (reemplazan window.confirm / window.prompt)
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [deleteCriterioId, setDeleteCriterioId] = useState<number | null>(null);

  // Queries
  const { data: evaluacionesData, isLoading } = useEvaluaciones(
    filtroEstado ? { estado: filtroEstado } : undefined
  );
  const evaluaciones: EvaluacionProveedor[] = Array.isArray(evaluacionesData)
    ? evaluacionesData
    : ((evaluacionesData as Record<string, unknown>)?.results as EvaluacionProveedor[]) || [];

  const { data: criteriosData, isLoading: isLoadingCriterios } = useCriterios();
  const criterios: CriterioEvaluacion[] = Array.isArray(criteriosData)
    ? criteriosData
    : ((criteriosData as Record<string, unknown>)?.results as CriterioEvaluacion[]) || [];

  // Mutations
  const aprobarMutation = useAprobarEvaluacion();
  const rechazarMutation = useRechazarEvaluacion();
  const createCriterioMutation = useCreateCriterio();
  const updateCriterioMutation = useUpdateCriterio();
  const deleteCriterioMutation = useDeleteCriterio();

  // ==================== HANDLERS ====================

  const handleNew = () => {
    setEditEvaluacion(undefined);
    setShowForm(true);
  };

  const handleEdit = (evaluacion: EvaluacionProveedor) => {
    setEditEvaluacion(evaluacion);
    setShowForm(true);
  };

  const handleConfirmAprobar = async () => {
    if (!approveId) return;
    await aprobarMutation.mutateAsync({ id: approveId });
    setApproveId(null);
  };

  const handleConfirmRechazar = async () => {
    if (!rejectId || !rejectMotivo.trim()) return;
    await rechazarMutation.mutateAsync({ id: rejectId, motivo: rejectMotivo });
    setRejectId(null);
    setRejectMotivo('');
  };

  const handleSaveCriterio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      codigo: String(fd.get('codigo')),
      nombre: String(fd.get('nombre')),
      descripcion: String(fd.get('descripcion') || ''),
      peso: Number(fd.get('peso')),
      orden: fd.get('orden') ? Number(fd.get('orden')) : undefined,
      is_active: true,
    };

    if (editCriterio) {
      await updateCriterioMutation.mutateAsync({ id: editCriterio.id, data });
    } else {
      await createCriterioMutation.mutateAsync(data);
    }
    setShowCriterioForm(false);
    setEditCriterio(null);
  };

  const handleConfirmDeleteCriterio = async () => {
    if (!deleteCriterioId) return;
    await deleteCriterioMutation.mutateAsync(deleteCriterioId);
    setDeleteCriterioId(null);
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Evaluaciones de Proveedores"
        count={evaluaciones.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Evaluación',
                onClick: handleNew,
              }
            : undefined
        }
        extraActions={[
          {
            label: 'Criterios',
            onClick: () => setShowCriterios(true),
            variant: 'outline',
          },
        ]}
      />

      {/* Filtro de estado */}
      <div className="flex items-center gap-3">
        <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="COMPLETADA">Completada</option>
          <option value="APROBADA">Aprobada</option>
        </Select>
      </div>

      {/* Tabla o Empty State */}
      {evaluaciones.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="w-16 h-16" />}
          title="No hay evaluaciones registradas"
          description="Comience creando una evaluación de proveedor basada en los criterios configurados"
          action={{
            label: 'Nueva Evaluación',
            onClick: handleNew,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Periodo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Calificación
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {evaluaciones.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {ev.proveedor_nombre || `#${ev.proveedor}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {ev.periodo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(ev.fecha_evaluacion)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {ev.calificacion_total != null
                          ? Number(ev.calificacion_total).toFixed(1)
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={getEstadoBadgeVariant(ev.estado)} size="sm">
                        {ev.estado_display || ev.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(ev)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {ev.estado === 'COMPLETADA' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setApproveId(ev.id)}
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4 text-success-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRejectId(ev.id)}
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4 text-danger-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Crear/Editar Evaluación */}
      <EvaluacionProveedorForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditEvaluacion(undefined);
        }}
        evaluacion={editEvaluacion}
      />

      {/* Confirmar Aprobación */}
      <ConfirmDialog
        isOpen={!!approveId}
        title="Aprobar Evaluación"
        message="¿Está seguro de aprobar esta evaluación de proveedor?"
        variant="info"
        confirmText="Aprobar"
        onConfirm={handleConfirmAprobar}
        onClose={() => setApproveId(null)}
        isLoading={aprobarMutation.isPending}
      />

      {/* Modal Rechazar (con motivo) */}
      <BaseModal
        isOpen={!!rejectId}
        onClose={() => {
          setRejectId(null);
          setRejectMotivo('');
        }}
        title="Rechazar Evaluación"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectId(null);
                setRejectMotivo('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!rejectMotivo.trim() || rechazarMutation.isPending}
              onClick={handleConfirmRechazar}
            >
              {rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar'}
            </Button>
          </div>
        }
      >
        <Textarea
          label="Motivo del Rechazo *"
          value={rejectMotivo}
          onChange={(e) => setRejectMotivo(e.target.value)}
          rows={3}
          placeholder="Indique el motivo del rechazo..."
        />
      </BaseModal>

      {/* Modal Gestionar Criterios */}
      <BaseModal
        isOpen={showCriterios}
        onClose={() => setShowCriterios(false)}
        title="Criterios de Evaluación"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure los criterios y su peso para evaluar proveedores
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditCriterio(null);
                setShowCriterioForm(true);
              }}
            >
              Nuevo Criterio
            </Button>
          </div>

          {isLoadingCriterios ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : criterios.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay criterios configurados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Criterio
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Peso
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Orden
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {criterios.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2 text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">{c.nombre}</p>
                        {c.descripcion && <p className="text-xs text-gray-500">{c.descripcion}</p>}
                      </td>
                      <td className="px-4 py-2 text-sm text-center font-medium">{c.peso}</td>
                      <td className="px-4 py-2 text-sm text-center text-gray-500">{c.orden}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant={c.is_active ? 'success' : 'gray'} size="sm">
                          {c.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditCriterio(c);
                              setShowCriterioForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCriterioId(c.id)}
                          >
                            <XCircle className="w-4 h-4 text-danger-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </BaseModal>

      {/* Confirmar Eliminar Criterio */}
      <ConfirmDialog
        isOpen={!!deleteCriterioId}
        title="Eliminar Criterio"
        message="¿Está seguro de eliminar este criterio de evaluación? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDeleteCriterio}
        onClose={() => setDeleteCriterioId(null)}
        isLoading={deleteCriterioMutation.isPending}
      />

      {/* Modal Form Criterio */}
      <BaseModal
        isOpen={showCriterioForm}
        onClose={() => {
          setShowCriterioForm(false);
          setEditCriterio(null);
        }}
        title={editCriterio ? 'Editar Criterio' : 'Nuevo Criterio'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowCriterioForm(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createCriterioMutation.isPending || updateCriterioMutation.isPending}
              onClick={() => {
                const form = document.getElementById('criterio-form') as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {createCriterioMutation.isPending || updateCriterioMutation.isPending
                ? 'Guardando...'
                : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="criterio-form" onSubmit={handleSaveCriterio} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código *"
              type="text"
              name="codigo"
              required
              defaultValue={editCriterio?.codigo || ''}
            />
            <Input
              label="Nombre *"
              type="text"
              name="nombre"
              required
              defaultValue={editCriterio?.nombre || ''}
            />
          </div>

          <Textarea
            label="Descripción"
            name="descripcion"
            rows={2}
            defaultValue={editCriterio?.descripcion || ''}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Peso *"
              type="number"
              name="peso"
              min="1"
              max="100"
              required
              defaultValue={editCriterio?.peso || ''}
            />
            <Input
              label="Orden"
              type="number"
              name="orden"
              min="0"
              defaultValue={editCriterio?.orden || ''}
            />
          </div>
        </form>
      </BaseModal>
    </div>
  );
}
