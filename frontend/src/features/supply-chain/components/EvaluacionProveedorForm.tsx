/**
 * Componente: Formulario de Evaluación de Proveedor
 *
 * Características:
 * - Evaluación por criterios configurables
 * - Cálculo automático de calificación ponderada
 * - Calificación automática según puntaje
 */
import { useState, useEffect, useMemo } from 'react';
import { Save } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import { useCriterios } from '../hooks/useEvaluaciones';
import { useCreateEvaluacion, useUpdateEvaluacion } from '../hooks/useEvaluaciones';
import { useProveedores } from '../hooks/useProveedores';
import type { EvaluacionProveedor, CriterioEvaluacion } from '../types';

// ==================== TIPOS ====================

interface EvaluacionProveedorFormProps {
  evaluacion?: EvaluacionProveedor;
  proveedorId?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface DetalleFormData {
  criterio: number;
  calificacion: number;
  observaciones?: string;
}

// ==================== UTILIDADES ====================

const calcularCalificacionLabel = (
  puntaje: number
): 'EXCELENTE' | 'BUENO' | 'ACEPTABLE' | 'DEFICIENTE' | 'RECHAZADO' => {
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
    proveedor: propProveedorId || 0,
    periodo: '',
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    observaciones: '',
    estado: 'BORRADOR' as 'BORRADOR' | 'EN_PROCESO' | 'COMPLETADA',
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
      const initialDetalles: DetalleFormData[] = criterios.map((criterio) => ({
        criterio: criterio.id,
        calificacion: 0,
        observaciones: '',
      }));
      setDetalles(initialDetalles);
    }
  }, [criterios, detalles.length]);

  useEffect(() => {
    if (evaluacion) {
      setFormData({
        proveedor: evaluacion.proveedor,
        periodo: evaluacion.periodo,
        fecha_evaluacion: evaluacion.fecha_evaluacion,
        observaciones: evaluacion.observaciones || '',
        estado: evaluacion.estado as 'BORRADOR' | 'EN_PROCESO' | 'COMPLETADA',
      });

      if (evaluacion.detalles) {
        setDetalles(
          evaluacion.detalles.map((det) => ({
            criterio: det.criterio,
            calificacion: det.calificacion,
            observaciones: det.observaciones || '',
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
      };
    }

    let puntajePonderado = 0;
    let pesoTotal = 0;

    criterios.forEach((criterio) => {
      const detalle = detalles.find((d) => d.criterio === criterio.id);
      if (!detalle) return;

      const peso = criterio.peso || 0;
      puntajePonderado += (detalle.calificacion * peso) / 100;
      pesoTotal += peso;
    });

    // Normalizar si peso total != 100
    const puntajeFinal = pesoTotal > 0 ? (puntajePonderado / pesoTotal) * 100 : 0;

    return {
      puntajeTotal: Math.round(puntajeFinal * 100) / 100,
      calificacion: calcularCalificacionLabel(puntajeFinal),
    };
  }, [criterios, detalles]);

  // ==================== HANDLERS ====================

  const handleDetalleChange = (
    criterioId: number,
    field: keyof DetalleFormData,
    value: string | number
  ) => {
    setDetalles((prev) =>
      prev.map((det) => (det.criterio === criterioId ? { ...det, [field]: value } : det))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
    };

    try {
      if (isEdit && evaluacion) {
        await updateMutation.mutateAsync({
          id: evaluacion.id,
          data: {
            periodo: formData.periodo,
            fecha_evaluacion: formData.fecha_evaluacion,
            observaciones: formData.observaciones,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Proveedor *"
              required
              value={formData.proveedor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, proveedor: Number(e.target.value) }))
              }
              disabled={isEdit}
            >
              <option value="">Seleccionar...</option>
              {(proveedores as Record<string, unknown>)?.results &&
                (
                  (proveedores as Record<string, unknown>).results as Array<{
                    id: number;
                    razon_social: string;
                  }>
                ).map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.razon_social}
                  </option>
                ))}
            </Select>

            <Input
              label="Periodo *"
              type="text"
              required
              placeholder="Ej: 2024-Q1, Enero 2024"
              value={formData.periodo}
              onChange={(e) => setFormData((prev) => ({ ...prev, periodo: e.target.value }))}
            />

            <Input
              label="Fecha de Evaluación *"
              type="date"
              required
              value={formData.fecha_evaluacion}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fecha_evaluacion: e.target.value }))
              }
            />

            <Select
              label="Estado"
              value={formData.estado}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estado: e.target.value as 'BORRADOR' | 'EN_PROCESO' | 'COMPLETADA',
                }))
              }
            >
              <option value="BORRADOR">Borrador</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADA">Completada</option>
            </Select>
          </div>
        </Card>

        {/* Resultados de la Evaluación */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Resultado</h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Calificación Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {resultadosEvaluacion.puntajeTotal}/100
                </p>
              </div>
              <Badge variant={getCalificacionColor(resultadosEvaluacion.calificacion)} size="lg">
                {resultadosEvaluacion.calificacion}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Evaluación por Criterios */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Evaluación por Criterios
          </h3>
          <div className="space-y-4">
            {Array.isArray(criterios) &&
              criterios.map((criterio: CriterioEvaluacion) => {
                const detalle = detalles.find((d) => d.criterio === criterio.id);
                if (!detalle) return null;

                const puntajePonderado = (detalle.calificacion * (criterio.peso || 0)) / 100;

                return (
                  <div
                    key={criterio.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {criterio.nombre}
                        </h4>
                        {criterio.descripcion && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {criterio.descripcion}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Peso: {criterio.peso} | Ponderado: {puntajePonderado.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Calificación (0-100) *"
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={detalle.calificacion}
                        onChange={(e) =>
                          handleDetalleChange(criterio.id, 'calificacion', Number(e.target.value))
                        }
                      />

                      <div className="sm:col-span-2">
                        <Input
                          label="Observaciones"
                          type="text"
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

        {/* Observaciones Generales */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Observaciones Generales
          </h3>
          <Textarea
            label="Observaciones"
            rows={3}
            value={formData.observaciones}
            onChange={(e) => setFormData((prev) => ({ ...prev, observaciones: e.target.value }))}
          />
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
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : 'Guardar Evaluación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
