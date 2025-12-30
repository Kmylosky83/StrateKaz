/**
 * Componente: Formulario de Evaluación de Proveedor
 *
 * Características:
 * - Evaluación por criterios configurables
 * - Cálculo automático de puntaje ponderado
 * - Validación de criterios eliminatorios
 * - Calificación automática según puntaje
 */
import { useState, useEffect, useMemo } from 'react';
import { Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';

import { useCriterios } from '../hooks/useEvaluaciones';
import { useCreateEvaluacion, useUpdateEvaluacion } from '../hooks/useEvaluaciones';
import { useProveedores } from '../hooks/useProveedores';
import type { EvaluacionProveedor, CreateEvaluacionProveedorDTO, CriterioEvaluacion } from '../types';

// ==================== TIPOS ====================

interface EvaluacionProveedorFormProps {
  evaluacion?: EvaluacionProveedor;
  proveedorId?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface DetalleFormData {
  criterio: number;
  puntaje_obtenido: number;
  observaciones?: string;
  evidencias?: string;
}

// ==================== UTILIDADES ====================

const calcularCalificacion = (puntaje: number): 'EXCELENTE' | 'BUENO' | 'ACEPTABLE' | 'DEFICIENTE' | 'RECHAZADO' => {
  if (puntaje >= 90) return 'EXCELENTE';
  if (puntaje >= 75) return 'BUENO';
  if (puntaje >= 60) return 'ACEPTABLE';
  if (puntaje >= 40) return 'DEFICIENTE';
  return 'RECHAZADO';
};

const getCalificacionColor = (calificacion: string) => {
  const map: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
    EXCELENTE: 'success',
    BUENO: 'primary',
    ACEPTABLE: 'warning',
    DEFICIENTE: 'danger',
    RECHAZADO: 'danger',
  };
  return map[calificacion] || 'gray';
};

// ==================== COMPONENTE ====================

export function EvaluacionProveedorForm({
  evaluacion,
  proveedorId: propProveedorId,
  isOpen,
  onClose,
}: EvaluacionProveedorFormProps) {
  const isEdit = !!evaluacion;

  // ==================== ESTADO ====================

  const [formData, setFormData] = useState({
    codigo: '',
    proveedor: propProveedorId || 0,
    periodo: '',
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    observaciones: '',
    fortalezas: '',
    debilidades: '',
    plan_mejora: '',
    estado: 'BORRADOR' as 'BORRADOR' | 'COMPLETADA',
  });

  const [detalles, setDetalles] = useState<DetalleFormData[]>([]);

  // ==================== QUERIES ====================

  const { data: criterios, isLoading: isLoadingCriterios } = useCriterios({ is_active: true });
  const { data: proveedores } = useProveedores({ is_active: true });
  const createMutation = useCreateEvaluacion();
  const updateMutation = useUpdateEvaluacion();

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (Array.isArray(criterios) && criterios.length > 0 && detalles.length === 0) {
      // Inicializar detalles con todos los criterios activos
      const initialDetalles: DetalleFormData[] = criterios.map((criterio) => ({
        criterio: criterio.id,
        puntaje_obtenido: 0,
        observaciones: '',
        evidencias: '',
      }));
      setDetalles(initialDetalles);
    }
  }, [criterios, detalles.length]);

  useEffect(() => {
    if (evaluacion) {
      setFormData({
        codigo: evaluacion.codigo,
        proveedor: evaluacion.proveedor,
        periodo: evaluacion.periodo,
        fecha_evaluacion: evaluacion.fecha_evaluacion,
        observaciones: evaluacion.observaciones || '',
        fortalezas: evaluacion.fortalezas || '',
        debilidades: evaluacion.debilidades || '',
        plan_mejora: evaluacion.plan_mejora || '',
        estado: evaluacion.estado as 'BORRADOR' | 'COMPLETADA',
      });

      if (evaluacion.detalles) {
        setDetalles(
          evaluacion.detalles.map((det) => ({
            criterio: det.criterio,
            puntaje_obtenido: det.puntaje_obtenido,
            observaciones: det.observaciones || '',
            evidencias: det.evidencias || '',
          }))
        );
      }
    }
  }, [evaluacion]);

  // ==================== CÁLCULOS ====================

  const resultadosEvaluacion = useMemo(() => {
    if (!Array.isArray(criterios)) {
      return {
        puntajeTotal: 0,
        calificacion: 'RECHAZADO' as const,
        cumpleCriteriosEliminatorios: true,
        criteriosNoAprobados: [] as CriterioEvaluacion[],
      };
    }

    let puntajePonderado = 0;
    let cumpleCriteriosEliminatorios = true;
    const criteriosNoAprobados: CriterioEvaluacion[] = [];

    criterios.forEach((criterio) => {
      const detalle = detalles.find((d) => d.criterio === criterio.id);
      if (!detalle) return;

      const puntajeObtenido = detalle.puntaje_obtenido;
      const puntajePond = (puntajeObtenido * criterio.peso_porcentaje) / 100;
      puntajePonderado += puntajePond;

      // Verificar criterios eliminatorios
      if (criterio.es_eliminatorio && criterio.puntaje_minimo_aceptable) {
        if (puntajeObtenido < criterio.puntaje_minimo_aceptable) {
          cumpleCriteriosEliminatorios = false;
          criteriosNoAprobados.push(criterio);
        }
      }
    });

    return {
      puntajeTotal: Math.round(puntajePonderado * 100) / 100,
      calificacion: calcularCalificacion(puntajePonderado),
      cumpleCriteriosEliminatorios,
      criteriosNoAprobados,
    };
  }, [criterios, detalles]);

  // ==================== HANDLERS ====================

  const handleDetalleChange = (criterioId: number, field: keyof DetalleFormData, value: any) => {
    setDetalles((prev) =>
      prev.map((det) => (det.criterio === criterioId ? { ...det, [field]: value } : det))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateEvaluacionProveedorDTO = {
      ...formData,
      detalles: detalles.map((det) => ({
        criterio: det.criterio,
        puntaje_obtenido: det.puntaje_obtenido,
        observaciones: det.observaciones,
        evidencias: det.evidencias,
      })),
    };

    try {
      if (isEdit && evaluacion) {
        await updateMutation.mutateAsync({
          id: evaluacion.id,
          data: {
            periodo: formData.periodo,
            fecha_evaluacion: formData.fecha_evaluacion,
            observaciones: formData.observaciones,
            fortalezas: formData.fortalezas,
            debilidades: formData.debilidades,
            plan_mejora: formData.plan_mejora,
            estado: formData.estado,
          },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
    }
  };

  // ==================== RENDERIZADO ====================

  if (isLoadingCriterios) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando..." size="xl">
        <div className="flex justify-center py-8">Cargando criterios...</div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Evaluación' : 'Nueva Evaluación de Proveedor'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.codigo}
                onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.proveedor}
                onChange={(e) => setFormData((prev) => ({ ...prev, proveedor: Number(e.target.value) }))}
                disabled={isEdit}
              >
                <option value="">Seleccionar...</option>
                {proveedores?.results?.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.razon_social}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Periodo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 2024-Q1, Enero 2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.periodo}
                onChange={(e) => setFormData((prev) => ({ ...prev, periodo: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Evaluación *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.fecha_evaluacion}
                onChange={(e) => setFormData((prev) => ({ ...prev, fecha_evaluacion: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Resultados de la Evaluación */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Resultado</h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Puntaje Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {resultadosEvaluacion.puntajeTotal}/100
                </p>
              </div>
              <Badge variant={getCalificacionColor(resultadosEvaluacion.calificacion)} size="lg">
                {resultadosEvaluacion.calificacion}
              </Badge>
            </div>
          </div>

          {!resultadosEvaluacion.cumpleCriteriosEliminatorios && (
            <Alert variant="danger" className="mb-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">No cumple criterios eliminatorios</p>
                  <ul className="mt-1 text-sm list-disc list-inside">
                    {resultadosEvaluacion.criteriosNoAprobados.map((criterio) => (
                      <li key={criterio.id}>{criterio.nombre}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Alert>
          )}
        </Card>

        {/* Evaluación por Criterios */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Evaluación por Criterios</h3>
          <div className="space-y-4">
            {Array.isArray(criterios) &&
              criterios.map((criterio) => {
                const detalle = detalles.find((d) => d.criterio === criterio.id);
                if (!detalle) return null;

                const puntajePonderado =
                  (detalle.puntaje_obtenido * criterio.peso_porcentaje) / 100;

                return (
                  <div
                    key={criterio.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {criterio.nombre}
                          </h4>
                          {criterio.es_eliminatorio && (
                            <Badge variant="danger" size="sm">
                              Eliminatorio
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {criterio.descripcion}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Peso: {criterio.peso_porcentaje}% | Ponderado: {puntajePonderado.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Puntaje (0-100) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          value={detalle.puntaje_obtenido}
                          onChange={(e) =>
                            handleDetalleChange(criterio.id, 'puntaje_obtenido', Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observaciones
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          value={detalle.observaciones || ''}
                          onChange={(e) =>
                            handleDetalleChange(criterio.id, 'observaciones', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Análisis General */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Análisis General</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fortalezas
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.fortalezas}
                onChange={(e) => setFormData((prev) => ({ ...prev, fortalezas: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Debilidades
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.debilidades}
                onChange={(e) => setFormData((prev) => ({ ...prev, debilidades: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan de Mejora
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.plan_mejora}
                onChange={(e) => setFormData((prev) => ({ ...prev, plan_mejora: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones Generales
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.observaciones}
                onChange={(e) => setFormData((prev) => ({ ...prev, observaciones: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Evaluación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
