/**
 * PagoFormModal - Formulario para registrar pagos de nómina
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreatePagoNomina, useLiquidacionesNomina } from '../../hooks/useNomina';
import type { PagoNominaFormData } from '../../types';
import { metodoPagoOptions } from '../../types';

interface PagoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PagoFormModal = ({ isOpen, onClose }: PagoFormModalProps) => {
  const createMutation = useCreatePagoNomina();
  const { data: liquidaciones } = useLiquidacionesNomina({ estado: 'aprobado' });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PagoNominaFormData>();

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      reset({
        fecha_pago: today,
      });
    }
  }, [isOpen, reset]);

  const metodoPago = watch('metodo_pago');
  const showBankFields = metodoPago === 'transferencia' || metodoPago === 'cheque';

  const onSubmit = async (data: PagoNominaFormData) => {
    try {
      await createMutation.mutateAsync(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error creating pago:', error);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const liquidacionesOptions =
    liquidaciones?.map((liq) => ({
      value: liq.id.toString(),
      label: `${liq.colaborador_nombre} - ${liq.periodo_nombre} - ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(liq.neto_pagar)}`,
    })) || [];

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Registrar Pago de Nómina" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Liquidación */}
        <div>
          <Select
            label="Liquidación"
            {...register('liquidacion', { required: 'La liquidación es requerida' })}
            options={liquidacionesOptions}
            error={errors.liquidacion?.message}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Solo se muestran liquidaciones aprobadas pendientes de pago
          </p>
        </div>

        {/* Fecha y Método */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Pago"
            type="date"
            {...register('fecha_pago', { required: 'La fecha de pago es requerida' })}
            error={errors.fecha_pago?.message}
          />
          <Select
            label="Método de Pago"
            {...register('metodo_pago', { required: 'El método de pago es requerido' })}
            options={metodoPagoOptions}
            error={errors.metodo_pago?.message}
          />
        </div>

        {/* Información Bancaria (condicional) */}
        {showBankFields && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Información Bancaria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Banco"
                {...register('banco')}
                error={errors.banco?.message}
                placeholder="Nombre del banco"
              />
              <Input
                label="Número de Cuenta"
                {...register('numero_cuenta')}
                error={errors.numero_cuenta?.message}
                placeholder="Cuenta de destino"
              />
            </div>
          </div>
        )}

        {/* Referencia y Valor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Referencia/Comprobante"
            {...register('referencia_pago')}
            error={errors.referencia_pago?.message}
            placeholder="Número de comprobante"
          />
          <Input
            label="Valor Pagado"
            type="number"
            step="1"
            {...register('valor_pagado', { required: 'El valor pagado es requerido', min: 0 })}
            error={errors.valor_pagado?.message}
            placeholder="0"
          />
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          {...register('observaciones')}
          rows={3}
          placeholder="Observaciones del pago..."
        />

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Al registrar este pago, la liquidación se marcará como pagada automáticamente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Registrando...' : 'Registrar Pago'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
