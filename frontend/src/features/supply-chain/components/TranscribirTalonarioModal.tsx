/**
 * TranscribirTalonarioModal — Transcripción de talonario manual desde planta.
 *
 * H-SC-TALONARIO: el operador de planta abre este modal desde el detalle
 * del VoucherRecepcion y captura las paradas que el conductor anotó en el
 * talonario en papel durante la ruta. El backend crea N VoucherRecoleccion
 * (estado COMPLETADO) y los asocia al VoucherRecepcion vía M2M.
 *
 * Se muestra solo cuando:
 *   - voucher.modalidad_entrega === 'RECOLECCION'
 *   - voucher.ruta_recoleccion (ruta asignada)
 *   - voucher.estado === 'PENDIENTE_QC'
 *   - voucher.vouchers_recoleccion_info?.length === 0 (no transcrito aún)
 */
import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save, ClipboardList } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { DatePicker } from '@/components/forms/DatePicker';

import { useRutaParadasByRuta } from '../hooks/useRutaParadas';
import { useProductos } from '@/features/catalogo-productos/hooks/useProductos';
import { useTranscribirTalonario } from '../hooks/useTranscribirTalonario';

interface TranscribirTalonarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherRecepcionId: number;
  rutaId: number;
}

// ─── Schema Zod ─────────────────────────────────────────────────────

const paradaSchema = z.object({
  proveedor_id: z.coerce.number().int().min(1, 'Selecciona un proveedor'),
  producto_id: z.coerce.number().int().min(1, 'Selecciona un producto'),
  cantidad_kg: z
    .string()
    .min(1, 'Ingresa los kilos')
    .refine((v) => Number(v) > 0, 'Los kilos deben ser mayores a cero'),
  numero_talonario: z.string().optional(),
  notas: z.string().optional(),
});

const formSchema = z.object({
  fecha_recoleccion: z.string().min(1, 'La fecha es obligatoria'),
  paradas: z.array(paradaSchema).min(1, 'Agrega al menos una parada'),
});

type FormValues = z.infer<typeof formSchema>;

const PARADA_VACIA = {
  proveedor_id: 0,
  producto_id: 0,
  cantidad_kg: '',
  numero_talonario: '',
  notas: '',
};

// ─── Componente ────────────────────────────────────────────────────

export default function TranscribirTalonarioModal({
  isOpen,
  onClose,
  voucherRecepcionId,
  rutaId,
}: TranscribirTalonarioModalProps) {
  const { data: paradasRuta = [], isLoading: paradasLoading } = useRutaParadasByRuta(
    rutaId || null
  );
  const { data: productosRaw } = useProductos();
  const transcribirMut = useTranscribirTalonario();

  const productos = useMemo(() => {
    const list = Array.isArray(productosRaw)
      ? productosRaw
      : ((productosRaw as { results?: unknown[] })?.results ?? []);
    return (list as Array<{ id: number; codigo: string; nombre: string; tipo: string }>).filter(
      (p) => p.tipo === 'MATERIA_PRIMA'
    );
  }, [productosRaw]);

  const proveedorOptions = useMemo(
    () => [
      { value: 0, label: 'Seleccionar parada...' },
      ...paradasRuta
        .filter((p) => p.is_active)
        .sort((a, b) => a.orden - b.orden)
        .map((p) => ({
          value: p.proveedor,
          label: `${p.orden + 1}. ${p.proveedor_nombre ?? '—'}${
            p.proveedor_documento ? ` (${p.proveedor_documento})` : ''
          }`,
        })),
    ],
    [paradasRuta]
  );

  const productoOptions = useMemo(
    () => [
      { value: 0, label: 'Seleccionar producto...' },
      ...productos.map((p) => ({
        value: p.id,
        label: `${p.codigo ?? ''} ${p.nombre}`.trim(),
      })),
    ],
    [productos]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha_recoleccion: new Date().toISOString().slice(0, 10),
      paradas: [{ ...PARADA_VACIA }],
    },
  });

  const { control, register, handleSubmit, reset, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'paradas' });

  // Reset al cerrar/abrir
  useEffect(() => {
    if (isOpen) {
      reset({
        fecha_recoleccion: new Date().toISOString().slice(0, 10),
        paradas: [{ ...PARADA_VACIA }],
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await transcribirMut.mutateAsync({
        voucherRecepcionId,
        data: {
          fecha_recoleccion: values.fecha_recoleccion,
          paradas: values.paradas.map((p) => ({
            proveedor_id: p.proveedor_id,
            producto_id: p.producto_id,
            cantidad_kg: p.cantidad_kg,
            numero_talonario: p.numero_talonario || undefined,
            notas: p.notas || undefined,
          })),
        },
      });
      onClose();
    } catch {
      /* toast ya disparado en hook */
    }
  };

  const isLoading = transcribirMut.isPending;
  const sinParadas = !paradasLoading && paradasRuta.filter((p) => p.is_active).length === 0;

  const footer = (
    <div className="flex items-center justify-end gap-2 w-full">
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading || sinParadas}
        isLoading={isLoading}
      >
        <Save className="w-4 h-4 mr-1" />
        Guardar talonario
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Transcribir talonario manual"
      subtitle="Captura las paradas anotadas en papel por el conductor durante la ruta"
      size="3xl"
      footer={footer}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Encabezado */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Datos del talonario
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Controller
              name="fecha_recoleccion"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Fecha de recolección *"
                  value={field.value}
                  onChange={field.onChange}
                  error={formState.errors.fecha_recoleccion?.message}
                  required
                />
              )}
            />
          </div>
        </Card>

        {/* Paradas */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Paradas ({fields.length})
              </h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...PARADA_VACIA })}
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar parada
            </Button>
          </div>

          {sinParadas ? (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
              Esta ruta no tiene paradas activas. Configúralas en Supply Chain → Rutas de
              Recolección antes de transcribir el talonario.
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((f, idx) => {
                const errs = formState.errors.paradas?.[idx];
                return (
                  <div
                    key={f.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Parada #{idx + 1}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          disabled={isLoading}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                          aria-label={`Eliminar parada ${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-7">
                        <Controller
                          name={`paradas.${idx}.proveedor_id` as const}
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="Proveedor (parada) *"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              options={proveedorOptions}
                              disabled={isLoading}
                              error={errs?.proveedor_id?.message}
                              required
                            />
                          )}
                        />
                      </div>
                      <div className="md:col-span-5">
                        <Input
                          label="N° talonario"
                          type="text"
                          {...register(`paradas.${idx}.numero_talonario` as const)}
                          placeholder="Opcional"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="md:col-span-7">
                        <Controller
                          name={`paradas.${idx}.producto_id` as const}
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="Producto (MP) *"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              options={productoOptions}
                              disabled={isLoading}
                              error={errs?.producto_id?.message}
                              required
                            />
                          )}
                        />
                      </div>
                      <div className="md:col-span-5">
                        <Input
                          label="Kilos *"
                          type="number"
                          step="0.001"
                          min="0"
                          {...register(`paradas.${idx}.cantidad_kg` as const)}
                          placeholder="0.000"
                          disabled={isLoading}
                          error={errs?.cantidad_kg?.message}
                          required
                        />
                      </div>

                      <div className="md:col-span-12">
                        <Textarea
                          label="Notas (opcional)"
                          rows={2}
                          {...register(`paradas.${idx}.notas` as const)}
                          placeholder="Observaciones de la parada"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {formState.errors.paradas?.message && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {formState.errors.paradas.message}
            </p>
          )}
        </Card>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Al guardar se crearán los vouchers de recolección en estado <strong>COMPLETADO</strong> y
          se asociarán automáticamente a esta recepción.
        </p>
      </form>
    </BaseModal>
  );
}
