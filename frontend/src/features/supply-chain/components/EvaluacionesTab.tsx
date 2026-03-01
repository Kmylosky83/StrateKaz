/**
 * Tab Evaluaciones - Lista de evaluaciones de proveedores con CRUD
 *
 * Usa EvaluacionProveedorForm (modal existente) para crear/editar.
 * Tabla con filtros, badges de estado, y acciones rápidas.
 */
import { useState } from 'react';
import { Plus, Edit, CheckCircle, XCircle, ClipboardCheck, Settings } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import { EvaluacionProveedorForm } from './EvaluacionProveedorForm';
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
    COMPLETADA: 'info',
    APROBADA: 'success',
    RECHAZADA: 'danger',
  };
  return map[estado] || 'gray';
};

const getCalificacionBadgeVariant = (
  calificacion: string
): 'success' | 'warning' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
    EXCELENTE: 'success',
    BUENO: 'primary',
    ACEPTABLE: 'warning',
    DEFICIENTE: 'danger',
    RECHAZADO: 'danger',
  };
  return map[calificacion] || 'primary';
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// ==================== COMPONENTE ====================

export function EvaluacionesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editEvaluacion, setEditEvaluacion] = useState<EvaluacionProveedor | undefined>(undefined);
  const [showCriterios, setShowCriterios] = useState(false);
  const [editCriterio, setEditCriterio] = useState<CriterioEvaluacion | null>(null);
  const [showCriterioForm, setShowCriterioForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  // Queries
  const { data: evaluacionesData, isLoading } = useEvaluaciones(
    filtroEstado ? { estado: filtroEstado } : undefined
  );
  const evaluaciones: EvaluacionProveedor[] = Array.isArray(evaluacionesData)
    ? evaluacionesData
    : (evaluacionesData as any)?.results || [];

  const { data: criteriosData, isLoading: isLoadingCriterios } = useCriterios();
  const criterios: CriterioEvaluacion[] = Array.isArray(criteriosData)
    ? criteriosData
    : (criteriosData as any)?.results || [];

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

  const handleAprobar = async (id: number) => {
    if (window.confirm('¿Aprobar esta evaluación?')) {
      await aprobarMutation.mutateAsync({ id });
    }
  };

  const handleRechazar = async (id: number) => {
    const motivo = window.prompt('Motivo del rechazo:');
    if (motivo) {
      await rechazarMutation.mutateAsync({ id, motivo });
    }
  };

  const handleSaveCriterio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      codigo: String(fd.get('codigo')),
      nombre: String(fd.get('nombre')),
      descripcion: String(fd.get('descripcion') || ''),
      categoria: String(fd.get('categoria')) as any,
      peso_porcentaje: Number(fd.get('peso_porcentaje')),
      es_eliminatorio: fd.get('es_eliminatorio') === 'true',
      puntaje_minimo_aceptable: fd.get('puntaje_minimo')
        ? Number(fd.get('puntaje_minimo'))
        : undefined,
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

  const handleDeleteCriterio = async (id: number) => {
    if (window.confirm('¿Eliminar este criterio de evaluación?')) {
      await deleteCriterioMutation.mutateAsync(id);
    }
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
      {/* Header con acciones */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Evaluaciones de Proveedores ({evaluaciones.length})
        </h3>
        <div className="flex items-center gap-2">
          {/* Filtro estado */}
          <Select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="COMPLETADA">Completada</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </Select>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Settings className="w-4 h-4" />}
            onClick={() => setShowCriterios(true)}
          >
            Criterios
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleNew}
          >
            Nueva Evaluación
          </Button>
        </div>
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
                    Código
                  </th>
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
                    Puntaje
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
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {ev.codigo}
                    </td>
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
                        {Number(ev.puntaje_total).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={getCalificacionBadgeVariant(ev.calificacion)} size="sm">
                        {ev.calificacion}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={getEstadoBadgeVariant(ev.estado)} size="sm">
                        {ev.estado}
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
                              onClick={() => handleAprobar(ev.id)}
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4 text-success-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRechazar(ev.id)}
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

      {/* Modal Gestionar Criterios */}
      <Modal
        isOpen={showCriterios}
        onClose={() => setShowCriterios(false)}
        title="Criterios de Evaluación"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure los criterios y su peso porcentual para evaluar proveedores
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoría
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Peso (%)
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Eliminatorio
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
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {c.categoria}
                      </td>
                      <td className="px-4 py-2 text-sm text-center font-medium">
                        {c.peso_porcentaje}%
                      </td>
                      <td className="px-4 py-2 text-center">
                        {c.es_eliminatorio ? (
                          <Badge variant="danger" size="sm">
                            Sí
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No</span>
                        )}
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
                            onClick={() => handleDeleteCriterio(c.id)}
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
      </Modal>

      {/* Modal Form Criterio */}
      <Modal
        isOpen={showCriterioForm}
        onClose={() => {
          setShowCriterioForm(false);
          setEditCriterio(null);
        }}
        title={editCriterio ? 'Editar Criterio' : 'Nuevo Criterio'}
        size="md"
      >
        <form onSubmit={handleSaveCriterio} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código *"
              type="text"
              name="codigo"
              required
              defaultValue={editCriterio?.codigo || ''}
            />
            <Select
              label="Categoría *"
              name="categoria"
              required
              defaultValue={editCriterio?.categoria || ''}
            >
              <option value="">Seleccione...</option>
              <option value="CALIDAD">Calidad</option>
              <option value="ENTREGA">Entrega</option>
              <option value="SERVICIO">Servicio</option>
              <option value="PRECIO">Precio</option>
              <option value="DOCUMENTACION">Documentación</option>
              <option value="OTRO">Otro</option>
            </Select>
          </div>

          <Input
            label="Nombre *"
            type="text"
            name="nombre"
            required
            defaultValue={editCriterio?.nombre || ''}
          />

          <Textarea
            label="Descripción"
            name="descripcion"
            rows={2}
            defaultValue={editCriterio?.descripcion || ''}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Peso (%) *"
              type="number"
              name="peso_porcentaje"
              min="1"
              max="100"
              required
              defaultValue={editCriterio?.peso_porcentaje || ''}
            />
            <Select
              label="Eliminatorio"
              name="es_eliminatorio"
              defaultValue={editCriterio?.es_eliminatorio ? 'true' : 'false'}
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </Select>
            <Input
              label="Puntaje Mínimo"
              type="number"
              name="puntaje_minimo"
              min="0"
              max="100"
              defaultValue={editCriterio?.puntaje_minimo_aceptable || ''}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCriterioForm(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createCriterioMutation.isPending || updateCriterioMutation.isPending}
            >
              {createCriterioMutation.isPending || updateCriterioMutation.isPending
                ? 'Guardando...'
                : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
