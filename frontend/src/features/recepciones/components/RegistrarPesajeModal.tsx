/**
 * Modal para registrar el pesaje en báscula de una recepción
 * Calcula automáticamente la merma y valida el peso ingresado
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Badge } from '@/components/common/Badge';
import { Scale, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { useRegistrarPesaje } from '../api/useRecepciones';
import { formatCurrency, formatWeight, formatPercentage } from '@/utils/formatters';
import type { RecepcionDetallada, RegistrarPesajeDTO } from '../types/recepcion.types';

interface RegistrarPesajeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recepcion: RecepcionDetallada | null;
  onSuccess?: () => void;
}

export const RegistrarPesajeModal = ({
  isOpen,
  onClose,
  recepcion,
  onSuccess,
}: RegistrarPesajeModalProps) => {
  const [pesoReal, setPesoReal] = useState('');
  const [ticketBascula, setTicketBascula] = useState('');
  const [observacionesMerma, setObservacionesMerma] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registrarMutation = useRegistrarPesaje();

  // Reset form cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setPesoReal('');
      setTicketBascula('');
      setObservacionesMerma('');
      setErrors({});
    }
  }, [isOpen]);

  // Calcular merma en tiempo real
  const calculoMerma = useMemo(() => {
    if (!recepcion || !pesoReal) {
      return null;
    }

    const pesoRealNum = parseFloat(pesoReal);
    if (isNaN(pesoRealNum) || pesoRealNum <= 0) {
      return null;
    }

    const mermaKg = recepcion.peso_esperado_kg - pesoRealNum;
    const porcentajeMerma = (mermaKg / recepcion.peso_esperado_kg) * 100;

    return {
      pesoEsperado: recepcion.peso_esperado_kg,
      pesoReal: pesoRealNum,
      mermaKg,
      porcentajeMerma,
      excedeLimite: porcentajeMerma > 10,
      esAlta: porcentajeMerma > 5 && porcentajeMerma <= 10,
    };
  }, [recepcion, pesoReal]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!pesoReal) {
      newErrors.pesoReal = 'El peso real es requerido';
    } else {
      const pesoRealNum = parseFloat(pesoReal);
      if (isNaN(pesoRealNum) || pesoRealNum <= 0) {
        newErrors.pesoReal = 'Ingrese un peso válido mayor a 0';
      } else if (recepcion && calculoMerma?.excedeLimite) {
        newErrors.pesoReal = 'El peso real no puede ser menor al 90% del peso esperado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!recepcion || !validateForm()) return;

    const data: RegistrarPesajeDTO = {
      peso_real_kg: parseFloat(pesoReal),
      numero_ticket_bascula: ticketBascula || undefined,
      observaciones_merma: observacionesMerma || undefined,
    };

    try {
      await registrarMutation.mutateAsync({ id: recepcion.id, data });
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
      title="Registrar Pesaje en Báscula"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Información de la recepción */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Información de la Recepción
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Código</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                <Badge variant="primary">{recepcion.codigo_recepcion}</Badge>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recolector</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {recepcion.recolector_nombre}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recolecciones</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {recepcion.cantidad_recolecciones}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Peso Esperado
              </p>
              <p className="text-lg font-bold text-primary-700 dark:text-primary-400">
                {formatWeight(recepcion.peso_esperado_kg)}
              </p>
            </div>
          </div>
        </div>

        {/* Campos de pesaje */}
        <div className="space-y-4">
          <Input
            label="Peso Real en Báscula (kg) *"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={pesoReal}
            onChange={(e) => {
              setPesoReal(e.target.value);
              if (errors.pesoReal) {
                setErrors({ ...errors, pesoReal: '' });
              }
            }}
            error={errors.pesoReal}
            leftIcon={<Scale className="h-5 w-5" />}
            helperText="Ingrese el peso medido en la báscula"
          />

          <Input
            label="Número de Ticket de Báscula (Opcional)"
            type="text"
            placeholder="Ej: BAS-2025-001"
            value={ticketBascula}
            onChange={(e) => setTicketBascula(e.target.value)}
            helperText="Número de identificación del ticket de pesaje"
          />
        </div>

        {/* Cálculo de merma en tiempo real */}
        {calculoMerma && (
          <div
            className={`rounded-lg p-4 border ${
              calculoMerma.excedeLimite
                ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                : calculoMerma.esAlta
                ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                : 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {calculoMerma.excedeLimite ? (
                  <AlertTriangle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                ) : calculoMerma.esAlta ? (
                  <TrendingDown className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                ) : (
                  <Info className="h-5 w-5 text-success-600 dark:text-success-400" />
                )}
              </div>

              <div className="flex-1">
                <h5
                  className={`font-medium mb-2 ${
                    calculoMerma.excedeLimite
                      ? 'text-danger-900 dark:text-danger-200'
                      : calculoMerma.esAlta
                      ? 'text-warning-900 dark:text-warning-200'
                      : 'text-success-900 dark:text-success-200'
                  }`}
                >
                  {calculoMerma.excedeLimite
                    ? 'Merma Excesiva - Peso Inválido'
                    : calculoMerma.esAlta
                    ? 'Merma Alta Detectada'
                    : 'Cálculo de Merma'}
                </h5>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p
                      className={`text-sm ${
                        calculoMerma.excedeLimite || calculoMerma.esAlta
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-success-700 dark:text-success-300'
                      }`}
                    >
                      Peso Esperado
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatWeight(calculoMerma.pesoEsperado)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        calculoMerma.excedeLimite || calculoMerma.esAlta
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-success-700 dark:text-success-300'
                      }`}
                    >
                      Merma
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        calculoMerma.excedeLimite
                          ? 'text-danger-700 dark:text-danger-400'
                          : calculoMerma.esAlta
                          ? 'text-warning-700 dark:text-warning-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {formatWeight(calculoMerma.mermaKg)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        calculoMerma.excedeLimite || calculoMerma.esAlta
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-success-700 dark:text-success-300'
                      }`}
                    >
                      Porcentaje
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        calculoMerma.excedeLimite
                          ? 'text-danger-700 dark:text-danger-400'
                          : calculoMerma.esAlta
                          ? 'text-warning-700 dark:text-warning-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {formatPercentage(calculoMerma.porcentajeMerma)}
                    </p>
                  </div>
                </div>

                {calculoMerma.excedeLimite && (
                  <p className="mt-3 text-sm text-danger-800 dark:text-danger-300">
                    El peso real no puede exceder una merma del 10% respecto al peso
                    esperado. Verifique el peso ingresado.
                  </p>
                )}

                {calculoMerma.esAlta && (
                  <p className="mt-3 text-sm text-warning-800 dark:text-warning-300">
                    La merma supera el 5%. Se recomienda documentar el motivo en las
                    observaciones.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Observaciones de merma */}
        {calculoMerma && (calculoMerma.esAlta || calculoMerma.excedeLimite) && (
          <div>
            <Input
              label="Observaciones de Merma"
              placeholder="Explique el motivo de la merma..."
              value={observacionesMerma}
              onChange={(e) => setObservacionesMerma(e.target.value)}
              helperText={
                calculoMerma.esAlta
                  ? 'Recomendado: Documente el motivo de la merma alta'
                  : 'Requerido: Explique el motivo de la merma excesiva'
              }
            />
          </div>
        )}

        {/* Información adicional */}
        <div className="flex items-start gap-3 p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
          <Info className="h-5 w-5 text-info-600 dark:text-info-400 mt-0.5" />
          <div className="text-sm text-info-800 dark:text-info-300">
            <p className="font-medium mb-1">Validación de Peso</p>
            <ul className="list-disc list-inside space-y-1">
              <li>El peso real debe ser mayor a 0 kg</li>
              <li>La merma no puede exceder el 10% del peso esperado</li>
              <li>
                Se recomienda documentar mermas superiores al 5%
              </li>
            </ul>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={registrarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!pesoReal || registrarMutation.isPending}
            isLoading={registrarMutation.isPending}
            leftIcon={<Scale className="h-4 w-4" />}
          >
            Registrar Pesaje
          </Button>
        </div>
      </div>
    </Modal>
  );
};
