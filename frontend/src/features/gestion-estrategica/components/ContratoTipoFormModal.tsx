/**
 * ContratoTipoFormModal - Modal para crear/editar Tipos de Contrato
 *
 * Usado en Fundacion Tab 4 "Mis Politicas y Reglamentos"
 * Consume backend: gestion_estrategica/configuracion (TipoContrato)
 */
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { BaseModal } from '@/components/modals';
import { Button } from '@/components/common/Button';
import { useCreateContratoTipo, useUpdateContratoTipo } from '../hooks/useContratos';
import type { TipoContratoDetail } from '../types/contratos.types';

// ==================== SCHEMA ====================

const contratoTipoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  tipo: z.enum(
    ['TERMINO_FIJO', 'INDEFINIDO', 'OBRA_LABOR', 'PRESTACION_SERVICIOS', 'APRENDIZAJE'],
    { required_error: 'El tipo es obligatorio' }
  ),
  descripcion: z.string().optional().default(''),
  clausulas_principales: z
    .array(z.object({ valor: z.string().min(1, 'La cl\u00e1usula no puede estar vac\u00eda') }))
    .optional()
    .default([]),
  duracion_default_dias: z.union([z.number().int().positive(), z.null()]).optional().default(null),
  periodo_prueba_dias: z.number().int().min(0).default(0),
  requiere_poliza: z.boolean().default(false),
  notas_legales: z.string().optional().default(''),
  is_active: z.boolean().default(true),
});

type ContratoTipoFormData = z.infer<typeof contratoTipoSchema>;

// ==================== PROPS ====================

interface ContratoTipoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato?: TipoContratoDetail | null;
}

// ==================== OPTIONS ====================

const tipoOptions = [
  { value: 'TERMINO_FIJO', label: 'Contrato a T\u00e9rmino Fijo' },
  { value: 'INDEFINIDO', label: 'Contrato a T\u00e9rmino Indefinido' },
  { value: 'OBRA_LABOR', label: 'Contrato por Obra o Labor' },
  { value: 'PRESTACION_SERVICIOS', label: 'Prestaci\u00f3n de Servicios' },
  { value: 'APRENDIZAJE', label: 'Contrato de Aprendizaje' },
];

// ==================== COMPONENT ====================

export function ContratoTipoFormModal({ isOpen, onClose, contrato }: ContratoTipoFormModalProps) {
  const isEditing = !!contrato;

  const createMutation = useCreateContratoTipo();
  const updateMutation = useUpdateContratoTipo();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContratoTipoFormData>({
    resolver: zodResolver(contratoTipoSchema),
    defaultValues: {
      nombre: '',
      tipo: 'TERMINO_FIJO',
      descripcion: '',
      clausulas_principales: [],
      duracion_default_dias: null,
      periodo_prueba_dias: 0,
      requiere_poliza: false,
      notas_legales: '',
      is_active: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'clausulas_principales',
  });

  // Reset form when modal opens/closes or contrato changes
  useEffect(() => {
    if (isOpen && contrato) {
      reset({
        nombre: contrato.nombre,
        tipo: contrato.tipo,
        descripcion: contrato.descripcion || '',
        clausulas_principales: (contrato.clausulas_principales || []).map((c) => ({ valor: c })),
        duracion_default_dias: contrato.duracion_default_dias,
        periodo_prueba_dias: contrato.periodo_prueba_dias,
        requiere_poliza: contrato.requiere_poliza,
        notas_legales: contrato.notas_legales || '',
        is_active: contrato.is_active,
      });
    } else if (isOpen) {
      reset({
        nombre: '',
        tipo: 'TERMINO_FIJO',
        descripcion: '',
        clausulas_principales: [],
        duracion_default_dias: null,
        periodo_prueba_dias: 0,
        requiere_poliza: false,
        notas_legales: '',
        is_active: true,
      });
    }
  }, [isOpen, contrato, reset]);

  const onSubmit = async (data: ContratoTipoFormData) => {
    try {
      const payload = {
        ...data,
        clausulas_principales: (data.clausulas_principales || []).map((c) => c.valor),
        duracion_default_dias: data.duracion_default_dias || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: contrato!.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Error handling via mutation onError (toast)
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  // CSS classes reutilizables
  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tipo de Contrato' : 'Nuevo Tipo de Contrato'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
            {isEditing ? 'Guardar cambios' : 'Crear tipo de contrato'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre y Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('nombre')}
              placeholder="Ej: Contrato T&eacute;rmino Fijo 1 a&ntilde;o"
              className={inputClass}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Tipo de contrato <span className="text-red-500">*</span>
            </label>
            <select {...register('tipo')} className={inputClass}>
              {tipoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipo.message}</p>
            )}
          </div>
        </div>

        {/* Descripcion */}
        <div>
          <label className={labelClass}>Descripci&oacute;n</label>
          <textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Descripci&oacute;n del tipo de contrato..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Duracion y Periodo de prueba */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Duraci&oacute;n por defecto (d&iacute;as)</label>
            <input
              type="number"
              {...register('duracion_default_dias', { valueAsNumber: true })}
              placeholder="Dejar vac&iacute;o para indefinido"
              min={1}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Per&iacute;odo de prueba (d&iacute;as)</label>
            <input
              type="number"
              {...register('periodo_prueba_dias', { valueAsNumber: true })}
              placeholder="0"
              min={0}
              max={60}
              className={inputClass}
            />
            {errors.periodo_prueba_dias && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.periodo_prueba_dias.message}
              </p>
            )}
          </div>
        </div>

        {/* Clausulas principales */}
        <div>
          <label className={labelClass}>Cl&aacute;usulas principales</label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  {...register(`clausulas_principales.${index}.valor`)}
                  placeholder={`Cl\u00e1usula ${index + 1}`}
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {errors.clausulas_principales && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Revise las cl&aacute;usulas ingresadas
              </p>
            )}
            <button
              type="button"
              onClick={() => append({ valor: '' })}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar cl&aacute;usula
            </button>
          </div>
        </div>

        {/* Requiere poliza y Estado */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              {...register('requiere_poliza')}
              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            Requiere p&oacute;liza de cumplimiento
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            Activo
          </label>
        </div>

        {/* Notas legales */}
        <div>
          <label className={labelClass}>Notas legales</label>
          <textarea
            {...register('notas_legales')}
            rows={2}
            placeholder="Referencias legales (CST, decretos, resoluciones)..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </form>
    </BaseModal>
  );
}
