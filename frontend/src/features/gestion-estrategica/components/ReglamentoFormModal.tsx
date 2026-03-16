/**
 * ReglamentoFormModal - Modal para crear/editar Reglamentos Internos
 *
 * Usado en Fundacion Tab 4 "Mis Politicas y Reglamentos"
 * Consume backend: motor_cumplimiento/reglamentos_internos
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals';
import { Button } from '@/components/common/Button';
import {
  useTiposReglamento,
  useCreateReglamento,
  useUpdateReglamento,
} from '../hooks/useReglamentos';
import type { Reglamento } from '../types/reglamentos.types';

// ==================== SCHEMA ====================

const reglamentoSchema = z.object({
  tipo: z.number({ required_error: 'El tipo es obligatorio' }).min(1, 'Seleccione un tipo'),
  codigo: z.string().min(1, 'El codigo es obligatorio').max(50),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().optional().default(''),
  estado: z
    .enum(['borrador', 'en_revision', 'aprobado', 'vigente', 'obsoleto'])
    .default('borrador'),
  version_actual: z.string().optional().default('1.0'),
  fecha_aprobacion: z.string().nullable().optional(),
  fecha_vigencia: z.string().nullable().optional(),
  fecha_proxima_revision: z.string().nullable().optional(),
  aplica_sst: z.boolean().default(false),
  aplica_ambiental: z.boolean().default(false),
  aplica_calidad: z.boolean().default(false),
  aplica_pesv: z.boolean().default(false),
  observaciones: z.string().optional().default(''),
});

type ReglamentoFormData = z.infer<typeof reglamentoSchema>;

// ==================== PROPS ====================

interface ReglamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  reglamento?: Reglamento | null;
}

// ==================== COMPONENT ====================

export function ReglamentoFormModal({ isOpen, onClose, reglamento }: ReglamentoFormModalProps) {
  const isEditing = !!reglamento;

  const { data: tiposReglamento = [] } = useTiposReglamento();
  const createMutation = useCreateReglamento();
  const updateMutation = useUpdateReglamento();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReglamentoFormData>({
    resolver: zodResolver(reglamentoSchema),
    defaultValues: {
      tipo: 0,
      codigo: '',
      nombre: '',
      descripcion: '',
      estado: 'borrador',
      version_actual: '1.0',
      fecha_aprobacion: null,
      fecha_vigencia: null,
      fecha_proxima_revision: null,
      aplica_sst: false,
      aplica_ambiental: false,
      aplica_calidad: false,
      aplica_pesv: false,
      observaciones: '',
    },
  });

  // Reset form when modal opens/closes or reglamento changes
  useEffect(() => {
    if (isOpen && reglamento) {
      reset({
        tipo: reglamento.tipo,
        codigo: reglamento.codigo,
        nombre: reglamento.nombre,
        descripcion: reglamento.descripcion || '',
        estado: reglamento.estado,
        version_actual: reglamento.version_actual || '1.0',
        fecha_aprobacion: reglamento.fecha_aprobacion || null,
        fecha_vigencia: reglamento.fecha_vigencia || null,
        fecha_proxima_revision: reglamento.fecha_proxima_revision || null,
        aplica_sst: reglamento.aplica_sst,
        aplica_ambiental: reglamento.aplica_ambiental,
        aplica_calidad: reglamento.aplica_calidad,
        aplica_pesv: reglamento.aplica_pesv,
        observaciones: reglamento.observaciones || '',
      });
    } else if (isOpen) {
      reset({
        tipo: 0,
        codigo: '',
        nombre: '',
        descripcion: '',
        estado: 'borrador',
        version_actual: '1.0',
        fecha_aprobacion: null,
        fecha_vigencia: null,
        fecha_proxima_revision: null,
        aplica_sst: false,
        aplica_ambiental: false,
        aplica_calidad: false,
        aplica_pesv: false,
        observaciones: '',
      });
    }
  }, [isOpen, reglamento, reset]);

  const onSubmit = async (data: ReglamentoFormData) => {
    try {
      const payload = {
        ...data,
        fecha_aprobacion: data.fecha_aprobacion || null,
        fecha_vigencia: data.fecha_vigencia || null,
        fecha_proxima_revision: data.fecha_proxima_revision || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: reglamento!.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Error handling via mutation onError (toast)
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const estadoOptions = [
    { value: 'borrador', label: 'Borrador' },
    { value: 'en_revision', label: 'En revision' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'vigente', label: 'Vigente' },
    { value: 'obsoleto', label: 'Obsoleto' },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Reglamento' : 'Nuevo Reglamento'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
            {isEditing ? 'Guardar cambios' : 'Crear reglamento'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tipo de Reglamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de reglamento <span className="text-red-500">*</span>
          </label>
          <select
            {...register('tipo', { valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={0}>Seleccionar tipo...</option>
            {tiposReglamento.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
          {errors.tipo && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipo.message}</p>
          )}
        </div>

        {/* Codigo y Nombre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Codigo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('codigo')}
              placeholder="Ej: RIT-001"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.codigo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.codigo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('nombre')}
              placeholder="Nombre del reglamento"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre.message}</p>
            )}
          </div>
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripcion
          </label>
          <textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Descripcion del reglamento..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        {/* Estado y Version */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              {...register('estado')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {estadoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Version actual
            </label>
            <input
              type="text"
              {...register('version_actual')}
              placeholder="1.0"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de aprobacion
            </label>
            <input
              type="date"
              {...register('fecha_aprobacion')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de vigencia
            </label>
            <input
              type="date"
              {...register('fecha_vigencia')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proxima revision
            </label>
            <input
              type="date"
              {...register('fecha_proxima_revision')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Aplicabilidad (checkboxes) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aplicabilidad
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                {...register('aplica_sst')}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              SST
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                {...register('aplica_ambiental')}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              Ambiental
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                {...register('aplica_calidad')}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              Calidad
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                {...register('aplica_pesv')}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              PESV
            </label>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observaciones
          </label>
          <textarea
            {...register('observaciones')}
            rows={2}
            placeholder="Observaciones adicionales..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>
      </form>
    </BaseModal>
  );
}
