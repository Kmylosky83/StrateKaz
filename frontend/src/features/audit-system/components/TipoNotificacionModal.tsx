/**
 * TipoNotificacionModal - Modal para crear/editar tipos de notificación
 *
 * Permite gestionar los tipos de notificación del sistema con campos:
 * - Código y nombre
 * - Descripción
 * - Categoría (sistema, tarea, alerta, recordatorio, aprobación)
 * - Color e ícono
 * - Plantillas de título y mensaje
 * - Configuración de canales (email, push)
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import { Code, FileText, Settings, MessageSquare, Hash } from 'lucide-react';
import type { TipoNotificacion } from '../types/notificaciones.types';

const tipoNotificacionSchema = z.object({
  codigo: z
    .string()
    .max(50, 'Código no puede exceder 50 caracteres')
    .regex(/^[A-Z_]*$/, 'Código debe ser en mayúsculas y guiones bajos')
    .optional()
    .or(z.literal('')),
  nombre: z.string().min(3, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(255, 'Máximo 255 caracteres').optional(),
  categoria: z.enum(['sistema', 'tarea', 'alerta', 'recordatorio', 'aprobacion']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal (#RRGGBB)'),
  icono: z.string().max(50, 'Máximo 50 caracteres').optional(),
  plantilla_titulo: z.string().min(3, 'Plantilla de título requerida').max(200),
  plantilla_mensaje: z.string().min(3, 'Plantilla de mensaje requerida').max(500),
  url_template: z.string().url('URL inválida').optional().or(z.literal('')),
  es_email: z.boolean(),
  es_push: z.boolean(),
});

type TipoNotificacionFormData = z.infer<typeof tipoNotificacionSchema>;

interface TipoNotificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo?: TipoNotificacion | null;
  onSubmit: (data: TipoNotificacionFormData) => void;
  isLoading?: boolean;
}

export const TipoNotificacionModal = ({
  isOpen,
  onClose,
  tipo,
  onSubmit,
  isLoading = false,
}: TipoNotificacionModalProps) => {
  const isEditing = !!tipo;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<TipoNotificacionFormData>({
    resolver: zodResolver(tipoNotificacionSchema),
    defaultValues: tipo
      ? {
          codigo: tipo.codigo,
          nombre: tipo.nombre,
          descripcion: tipo.descripcion || '',
          categoria: tipo.categoria,
          color: tipo.color,
          icono: tipo.icono || '',
          plantilla_titulo: tipo.plantilla_titulo,
          plantilla_mensaje: tipo.plantilla_mensaje,
          url_template: tipo.url_template || '',
          es_email: tipo.es_email,
          es_push: tipo.es_push,
        }
      : {
          codigo: '',
          nombre: '',
          descripcion: '',
          categoria: 'sistema',
          color: '#3B82F6',
          icono: '',
          plantilla_titulo: '',
          plantilla_mensaje: '',
          url_template: '',
          es_email: true,
          es_push: false,
        },
  });

  const handleFormSubmit = (data: TipoNotificacionFormData) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Tipo de Notificación' : 'Nuevo Tipo de Notificación'}
      description={
        isEditing
          ? 'Modifica la configuración del tipo de notificación'
          : 'Crea un nuevo tipo de notificación para el sistema'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Código y Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código"
            placeholder="Se genera automáticamente"
            leftIcon={<Code className="h-5 w-5 text-gray-400" />}
            {...register('codigo')}
            error={errors.codigo?.message}
            disabled={isLoading || isEditing} // Código no editable
            helperText="Mayúsculas y guiones bajos. No editable después de crear."
          />
          <Input
            label="Nombre"
            placeholder="Nombre descriptivo"
            leftIcon={<FileText className="h-5 w-5 text-gray-400" />}
            {...register('nombre')}
            error={errors.nombre?.message}
            disabled={isLoading}
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            {...register('descripcion')}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={2}
            placeholder="Descripción breve del tipo de notificación"
            disabled={isLoading}
          />
          {errors.descripcion && (
            <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Categoría y Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <select
              {...register('categoria')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            >
              <option value="sistema">Sistema</option>
              <option value="tarea">Tarea</option>
              <option value="alerta">Alerta</option>
              <option value="recordatorio">Recordatorio</option>
              <option value="aprobacion">Aprobación</option>
            </select>
            {errors.categoria && (
              <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
            )}
          </div>

          <Input
            label="Color (Hexadecimal)"
            placeholder="#3B82F6"
            leftIcon={<Hash className="h-5 w-5 text-gray-400" />}
            {...register('color')}
            error={errors.color?.message}
            disabled={isLoading}
            helperText="Ej: #3B82F6 (azul)"
          />
        </div>

        {/* Ícono (opcional) */}
        <Input
          label="Ícono (opcional)"
          placeholder="bell, alert-circle, check-circle"
          leftIcon={<Settings className="h-5 w-5 text-gray-400" />}
          {...register('icono')}
          error={errors.icono?.message}
          disabled={isLoading}
          helperText="Nombre del ícono de Lucide React"
        />

        {/* Plantilla Título */}
        <Input
          label="Plantilla de Título"
          placeholder="Nueva tarea asignada: {tarea_nombre}"
          leftIcon={<MessageSquare className="h-5 w-5 text-gray-400" />}
          {...register('plantilla_titulo')}
          error={errors.plantilla_titulo?.message}
          disabled={isLoading}
          helperText="Usar {variable} para placeholders dinámicos"
        />

        {/* Plantilla Mensaje */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Plantilla de Mensaje
          </label>
          <textarea
            {...register('plantilla_mensaje')}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Se te ha asignado la tarea {tarea_nombre}. Fecha límite: {fecha_limite}"
            disabled={isLoading}
          />
          {errors.plantilla_mensaje && (
            <p className="mt-1 text-sm text-red-600">{errors.plantilla_mensaje.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Usar {'{variable}'} para placeholders dinámicos
          </p>
        </div>

        {/* URL Template (opcional) */}
        <Input
          label="URL Template (opcional)"
          placeholder="/tareas/{tarea_id}"
          {...register('url_template')}
          error={errors.url_template?.message}
          disabled={isLoading}
          helperText="URL relativa o absoluta con placeholders"
        />

        {/* Canales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Canales de Envío
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('es_email')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enviar por Email</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('es_push')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enviar Notificación Push
              </span>
            </label>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!isDirty || isLoading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Tipo'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
