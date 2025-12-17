/**
 * Modal para confirmar recepción y ver el prorrateo de merma
 * Muestra resumen detallado antes de confirmar
 * Al confirmar, muestra el voucher de recepción para impresión
 */
import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Badge } from '@/components/common/Badge';
import {
  CheckCircle,
  AlertTriangle,
  Package,
  TrendingDown,
  Scale,
  Printer,
} from 'lucide-react';
import { useConfirmarRecepcion } from '../api/useRecepciones';
import {
  formatCurrency,
  formatWeight,
  formatPercentage,
} from '@/utils/formatters';
import { VoucherRecepcion } from './VoucherRecepcion';
import type {
  RecepcionDetallada,
  ConfirmarRecepcionDTO,
} from '../types/recepcion.types';

interface ConfirmarRecepcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recepcion: RecepcionDetallada | null;
  onSuccess?: () => void;
}

export const ConfirmarRecepcionModal = ({
  isOpen,
  onClose,
  recepcion,
  onSuccess,
}: ConfirmarRecepcionModalProps) => {
  const [tanqueDestino, setTanqueDestino] = useState('');
  const [showVoucher, setShowVoucher] = useState(false);
  const [confirmedRecepcion, setConfirmedRecepcion] = useState<RecepcionDetallada | null>(null);
  const voucherRef = useRef<HTMLDivElement>(null);

  const confirmarMutation = useConfirmarRecepcion();

  const handlePrint = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Recepcion-${confirmedRecepcion?.codigo_recepcion || 'voucher'}`,
    pageStyle: `
      @page {
        size: 58mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `,
  });

  // Reset form cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setTanqueDestino('');
      setShowVoucher(false);
      setConfirmedRecepcion(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!recepcion) return;

    const data: ConfirmarRecepcionDTO = {
      tanque_destino: tanqueDestino || undefined,
    };

    try {
      const result = await confirmarMutation.mutateAsync({ id: recepcion.id, data });
      // Mostrar voucher con los datos actualizados
      setConfirmedRecepcion(result.recepcion);
      setShowVoucher(true);
      onSuccess?.();
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  const handleCloseVoucher = () => {
    setShowVoucher(false);
    setConfirmedRecepcion(null);
    onClose();
  };

  if (!recepcion) return null;

  const mermaAlta = recepcion.porcentaje_merma > 5;

  // Mostrar voucher después de confirmar
  if (showVoucher && confirmedRecepcion) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleCloseVoucher}
        title="Recepción Confirmada - Voucher"
        size="sm"
      >
        <div className="flex flex-col items-center">
          {/* Mensaje de éxito */}
          <div className="w-full mb-4 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg text-center">
            <CheckCircle className="h-8 w-8 text-success-600 dark:text-success-400 mx-auto mb-2" />
            <p className="font-semibold text-success-900 dark:text-success-100">
              Recepción confirmada exitosamente
            </p>
            <p className="text-sm text-success-700 dark:text-success-300">
              {confirmedRecepcion.codigo_recepcion}
            </p>
          </div>

          {/* Preview del voucher */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-auto max-h-[50vh]">
            <VoucherRecepcion ref={voucherRef} recepcion={confirmedRecepcion} />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleCloseVoucher}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => handlePrint()}
              className="flex-1"
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Imprimir Voucher
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Recepción"
      size="3xl"
    >
      <div className="space-y-6">
        {/* Resumen general de la recepción */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Resumen de Recepción
              </h4>
              <Badge variant="primary" size="lg">
                {recepcion.codigo_recepcion}
              </Badge>
            </div>
            <Package className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Recolector
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {recepcion.recolector_nombre}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Recolecciones
              </p>
              <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                {recepcion.cantidad_recolecciones}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Peso Esperado
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatWeight(recepcion.peso_esperado_kg)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Valor Esperado
              </p>
              <p className="text-lg font-bold text-success-700 dark:text-success-400">
                {formatCurrency(recepcion.valor_esperado_total)}
              </p>
            </div>
          </div>
        </div>

        {/* Datos de pesaje */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h5 className="font-medium text-gray-900 dark:text-gray-100">
              Datos de Pesaje
            </h5>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Peso Real
              </p>
              <p className="text-xl font-bold text-primary-700 dark:text-primary-400">
                {recepcion.peso_real_kg
                  ? formatWeight(recepcion.peso_real_kg)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Merma</p>
              <p className="text-xl font-bold text-warning-700 dark:text-warning-400">
                {formatWeight(recepcion.merma_kg)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                % Merma
              </p>
              <p
                className={`text-xl font-bold ${
                  mermaAlta
                    ? 'text-danger-700 dark:text-danger-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {formatPercentage(recepcion.porcentaje_merma)}
              </p>
            </div>
          </div>

          {recepcion.numero_ticket_bascula && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ticket Báscula
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {recepcion.numero_ticket_bascula}
              </p>
            </div>
          )}
        </div>

        {/* Advertencia de merma alta */}
        {mermaAlta && (
          <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-warning-900 dark:text-warning-200 mb-1">
                Merma Superior al 5%
              </p>
              <p className="text-sm text-warning-800 dark:text-warning-300">
                La merma detectada es del {formatPercentage(recepcion.porcentaje_merma)}
                . Esta merma será prorrateada entre todas las recolecciones de forma
                proporcional.
              </p>
              {recepcion.observaciones_merma && (
                <div className="mt-2 p-2 bg-warning-100 dark:bg-warning-900/40 rounded">
                  <p className="text-xs text-warning-700 dark:text-warning-300">
                    <strong>Observaciones:</strong> {recepcion.observaciones_merma}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla de prorrateo de merma */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h5 className="font-medium text-gray-900 dark:text-gray-100">
              Prorrateo de Merma por Recolección
            </h5>
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ecoaliado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Peso Esperado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Merma
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Peso Real
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    % Proporción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {recepcion.detalles.map((detalle) => (
                  <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="info" size="sm">
                        {detalle.recoleccion_codigo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {detalle.ecoaliado_nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatWeight(detalle.peso_esperado_kg)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-warning-700 dark:text-warning-400">
                      {formatWeight(detalle.merma_kg)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-primary-700 dark:text-primary-400">
                      {detalle.peso_real_kg
                        ? formatWeight(detalle.peso_real_kg)
                        : formatWeight(
                            detalle.peso_esperado_kg - detalle.merma_kg
                          )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {formatPercentage(detalle.proporcion_lote * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100"
                  >
                    TOTALES
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                    {formatWeight(recepcion.peso_esperado_kg)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-warning-700 dark:text-warning-400">
                    {formatWeight(recepcion.merma_kg)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-primary-700 dark:text-primary-400">
                    {recepcion.peso_real_kg
                      ? formatWeight(recepcion.peso_real_kg)
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Tanque destino (opcional) */}
        <div>
          <Input
            label="Tanque Destino (Opcional)"
            type="text"
            placeholder="Ej: TANQUE-01, TANQUE-A"
            value={tanqueDestino}
            onChange={(e) => setTanqueDestino(e.target.value)}
            helperText="Tanque donde se almacenará la materia prima recibida"
          />
        </div>

        {/* Información importante */}
        <div className="flex items-start gap-3 p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
          <CheckCircle className="h-5 w-5 text-info-600 dark:text-info-400 mt-0.5" />
          <div className="text-sm text-info-800 dark:text-info-300">
            <p className="font-medium mb-1">Al confirmar la recepción:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Se aplicará el prorrateo de merma a todas las recolecciones de forma
                proporcional
              </li>
              <li>
                Los pesos y valores reales quedarán registrados en cada recolección
              </li>
              <li>
                La recepción no podrá ser modificada una vez confirmada
              </li>
              <li>
                Se actualizarán los inventarios y registros contables
              </li>
            </ul>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={confirmarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={confirmarMutation.isPending}
            leftIcon={<CheckCircle className="h-4 w-4" />}
          >
            Confirmar Recepción
          </Button>
        </div>
      </div>
    </Modal>
  );
};
