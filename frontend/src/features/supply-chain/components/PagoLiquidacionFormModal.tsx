/**
 * PagoLiquidacionFormModal — H-SC-12
 *
 * Modal para registrar un pago contra una liquidación APROBADA.
 * El monto está pre-llenado y read-only (debe coincidir con total).
 * Al crear el pago, el BE cambia el estado de la liquidación a PAGADA.
 */
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { FormModal } from '@/components/modals/FormModal';

import { useLiquidacion } from '../hooks/useLiquidaciones';
import { useCreatePago } from '../hooks/usePagosLiquidacion';
import type { MetodoPago } from '../types/liquidaciones.types';

const METODO_OPTIONS: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'PSE', label: 'PSE' },
  { value: 'OTRO', label: 'Otro' },
];

const pagoSchema = z.object({
  fecha_pago: z.string().min(1, 'La fecha de pago es obligatoria'),
  metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'PSE', 'OTRO']),
  referencia: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  monto_pagado: z.coerce.number().positive('El monto debe ser mayor a cero'),
  observaciones: z.string().optional().or(z.literal('')),
});

type PagoFormValues = z.infer<typeof pagoSchema>;

const toNumber = (v: number | string | undefined | null) => {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};

const formatCOP = (value?: string | number | null) => {
  const n = toNumber(value);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

interface PagoLiquidacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacionId: number | null;
}

export default function PagoLiquidacionFormModal({
  isOpen,
  onClose,
  liquidacionId,
}: PagoLiquidacionFormModalProps) {
  const { data: liquidacion, isLoading } = useLiquidacion(liquidacionId);
  const createPago = useCreatePago();

  const form = useForm<PagoFormValues>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      fecha_pago: todayISO(),
      metodo: 'TRANSFERENCIA',
      referencia: '',
      monto_pagado: 0,
      observaciones: '',
    },
  });

  // Pre-llenar monto al cargar la liquidación
  useEffect(() => {
    if (liquidacion && isOpen) {
      form.reset({
        fecha_pago: todayISO(),
        metodo: 'TRANSFERENCIA',
        referencia: '',
        monto_pagado: toNumber(liquidacion.total),
        observaciones: '',
      });
    }
  }, [liquidacion, isOpen, form]);

  const onSubmit = async (values: PagoFormValues) => {
    if (!liquidacion) return;
    await createPago.mutateAsync({
      liquidacion: liquidacion.id,
      fecha_pago: values.fecha_pago,
      metodo: values.metodo,
      referencia: values.referencia || undefined,
      monto_pagado: values.monto_pagado,
      observaciones: values.observaciones || undefined,
    });
    onClose();
  };

  return (
    <FormModal<PagoFormValues>
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Registrar pago de liquidación"
      subtitle={
        liquidacion
          ? `${liquidacion.codigo} · ${liquidacion.voucher_proveedor_nombre ?? `Voucher #${liquidacion.voucher}`}`
          : undefined
      }
      size="lg"
      form={form}
      isLoading={createPago.isPending}
      submitLabel="Registrar pago"
      warnUnsavedChanges={false}
    >
      {isLoading || !liquidacion ? (
        <div className="py-6 text-center text-sm text-slate-500">Cargando liquidación…</div>
      ) : (
        <div className="space-y-4">
          {/* Info read-only de la liquidación */}
          <Card variant="bordered" padding="md">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-primary-500 mt-0.5" />
              <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Código</div>
                  <div className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {liquidacion.codigo}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Proveedor</div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {liquidacion.voucher_proveedor_nombre ?? '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500">Total a pagar</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCOP(liquidacion.total)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Campos del pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="fecha_pago"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label="Fecha de pago"
                  type="date"
                  required
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="metodo"
              render={({ field, fieldState }) => (
                <Select
                  {...field}
                  label="Método de pago"
                  required
                  error={fieldState.error?.message}
                >
                  {METODO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="referencia"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label="Referencia"
                placeholder="N° comprobante, autorización, etc."
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="monto_pagado"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label="Monto (debe coincidir con el total)"
                type="number"
                step="0.01"
                readOnly
                error={fieldState.error?.message}
                helperText="Este valor se pre-llena desde la liquidación."
              />
            )}
          />

          <Controller
            control={form.control}
            name="observaciones"
            render={({ field, fieldState }) => (
              <Textarea
                {...field}
                label="Observaciones"
                rows={3}
                placeholder="Notas adicionales del pago"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      )}
    </FormModal>
  );
}
