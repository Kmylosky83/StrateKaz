/**
 * Modal para cancelar una recepción
 * Requiere motivo y advierte sobre las consecuencias
 */
import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Badge } from '@/components/common/Badge';
import { AlertTriangle, XCircle, Package, RotateCcw } from 'lucide-react';
import { useCancelarRecepcion } from '../api/useRecepciones';
import { formatWeight, formatCurrency } from '@/utils/formatters';
import type { RecepcionDetallada, CancelarRecepcionDTO } from '../types/recepcion.types';

interface CancelarRecepcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recepcion: RecepcionDetallada | null;
  onSuccess?: () => void;
}

export const CancelarRecepcionModal = ({
  isOpen,
  onClose,
  recepcion,
  onSuccess,
}: CancelarRecepcionModalProps) => {
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [error, setError] = useState('');

  const cancelarMutation = useCancelarRecepcion();

  // Reset form cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setMotivoCancelacion('');
      setError('');
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    if (!motivoCancelacion.trim()) {
      setError('El motivo de cancelación es requerido');
      return false;
    }
    if (motivoCancelacion.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!recepcion || !validateForm()) return;

    const data: CancelarRecepcionDTO = {
      motivo_cancelacion: motivoCancelacion.trim(),
    };

    try {
      await cancelarMutation.mutateAsync({ id: recepcion.id, data });
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  if (!recepcion) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancelar Recepción"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Advertencia principal */}
        <div className="flex items-start gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 border-2 border-danger-300 dark:border-danger-700 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-danger-600 dark:text-danger-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold text-danger-900 dark:text-danger-200 mb-2">
              Advertencia: Esta acción no se puede deshacer
            </h4>
            <p className="text-sm text-danger-800 dark:text-danger-300">
              Al cancelar esta recepción, todas las recolecciones asociadas quedarán
              disponibles nuevamente para ser incluidas en otra recepción.
            </p>
          </div>
        </div>

        {/* Información de la recepción a cancelar */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h5 className="font-medium text-gray-900 dark:text-gray-100">
              Recepción a Cancelar
            </h5>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Código</p>
                <Badge variant="primary" size="lg">
                  {recepcion.codigo_recepcion}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                <Badge
                  variant={recepcion.estado === 'PESADA' ? 'warning' : 'info'}
                  size="lg"
                >
                  {recepcion.estado_display}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recolector</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {recepcion.recolector_nombre}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recolecciones
                </p>
                <p className="text-xl font-bold text-primary-700 dark:text-primary-400">
                  {recepcion.cantidad_recolecciones}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Peso Esperado
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatWeight(recepcion.peso_esperado_kg)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Valor Esperado
                </p>
                <p className="text-xl font-bold text-success-700 dark:text-success-400">
                  {formatCurrency(recepcion.valor_esperado_total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campo de motivo de cancelación */}
        <div>
          <Input
            label="Motivo de Cancelación *"
            placeholder="Explique detalladamente el motivo de la cancelación..."
            value={motivoCancelacion}
            onChange={(e) => {
              setMotivoCancelacion(e.target.value);
              if (error) setError('');
            }}
            error={error}
            helperText="Mínimo 10 caracteres. Este motivo quedará registrado en el historial."
          />
        </div>

        {/* Consecuencias de la cancelación */}
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <RotateCcw className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h5 className="font-medium text-warning-900 dark:text-warning-200 mb-2">
                Consecuencias de la Cancelación
              </h5>
              <ul className="text-sm text-warning-800 dark:text-warning-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-warning-600 dark:text-warning-400 mt-0.5">•</span>
                  <span>
                    Las <strong>{recepcion.cantidad_recolecciones} recolecciones</strong>{' '}
                    quedarán disponibles nuevamente
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning-600 dark:text-warning-400 mt-0.5">•</span>
                  <span>
                    El registro de recepción se marcará como CANCELADA pero permanecerá
                    en el historial
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning-600 dark:text-warning-400 mt-0.5">•</span>
                  <span>
                    Se revertirán todos los cambios de estado de las recolecciones
                    asociadas
                  </span>
                </li>
                {recepcion.estado === 'PESADA' && (
                  <li className="flex items-start gap-2">
                    <span className="text-warning-600 dark:text-warning-400 mt-0.5">•</span>
                    <span>
                      Los datos de pesaje registrados se perderán y deberán ingresarse
                      nuevamente
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-warning-600 dark:text-warning-400 mt-0.5">•</span>
                  <span>
                    El motivo de cancelación quedará registrado con fecha y usuario
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lista de recolecciones que se liberarán */}
        {recepcion.detalles && recepcion.detalles.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Recolecciones que se liberarán:
            </h5>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {recepcion.detalles.map((detalle) => (
                <div
                  key={detalle.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <Badge variant="info" size="sm">
                      {detalle.recoleccion_codigo}
                    </Badge>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {detalle.ecoaliado_nombre}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatWeight(detalle.peso_esperado_kg)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatCurrency(detalle.valor_esperado)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmación final */}
        <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
          <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Esta acción es <strong>irreversible</strong>. Asegúrese de que realmente
            desea cancelar esta recepción.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={cancelarMutation.isPending}
          >
            No, Mantener Recepción
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={!motivoCancelacion.trim() || cancelarMutation.isPending}
            isLoading={cancelarMutation.isPending}
            leftIcon={<XCircle className="h-4 w-4" />}
          >
            Sí, Cancelar Recepción
          </Button>
        </div>
      </div>
    </Modal>
  );
};
