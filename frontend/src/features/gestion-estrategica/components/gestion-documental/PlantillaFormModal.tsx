/**
 * PlantillaFormModal - Modal CRUD para Plantillas de Documento.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button, Badge, Spinner } from '@/components/common';
import {
  useCreatePlantillaDocumento,
  useUpdatePlantillaDocumento,
  usePlantillaDocumento,
  useTiposDocumento,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';
import type {
  CreatePlantillaDocumentoDTO,
  TipoPlantilla,
} from '@/features/gestion-estrategica/types/gestion-documental.types';

interface PlantillaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantillaId?: number | null;
}

const TIPO_PLANTILLA_OPTIONS: { value: TipoPlantilla; label: string }[] = [
  { value: 'HTML', label: 'HTML' },
  { value: 'MARKDOWN', label: 'Markdown' },
  { value: 'FORMULARIO', label: 'Formulario Dinámico' },
];

export function PlantillaFormModal({ isOpen, onClose, plantillaId }: PlantillaFormModalProps) {
  const isEdit = !!plantillaId;
  const { data: existing, isLoading: isLoadingExisting } = usePlantillaDocumento(plantillaId!);
  const { data: tipos } = useTiposDocumento({ is_active: true });
  const createMutation = useCreatePlantillaDocumento();
  const updateMutation = useUpdatePlantillaDocumento();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlantillaDocumentoDTO>({
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_documento: 0,
      tipo_plantilla: 'HTML',
      contenido_plantilla: '',
      variables_disponibles: [],
      version: '1.0',
    },
  });

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        codigo: existing.codigo,
        nombre: existing.nombre,
        descripcion: existing.descripcion || '',
        tipo_documento: existing.tipo_documento?.id || (existing as { tipo_documento_id?: number }).tipo_documento_id || 0,
        tipo_plantilla: existing.tipo_plantilla,
        contenido_plantilla: existing.contenido_plantilla,
        variables_disponibles: existing.variables_disponibles || [],
        version: existing.version,
      });
    } else if (!isEdit) {
      reset({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo_documento: 0,
        tipo_plantilla: 'HTML',
        contenido_plantilla: '',
        variables_disponibles: [],
        version: '1.0',
      });
    }
  }, [isEdit, existing, reset]);

  const onSubmit = async (data: CreatePlantillaDocumentoDTO) => {
    if (isEdit && plantillaId) {
      await updateMutation.mutateAsync({ id: plantillaId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingExisting) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando...">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'} size="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código *
            </label>
            <input
              {...register('codigo', { required: 'Código es requerido' })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PLT-PR-001"
              disabled={isEdit}
            />
            {errors.codigo && <p className="text-xs text-red-500 mt-1">{errors.codigo.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              {...register('nombre', { required: 'Nombre es requerido' })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Plantilla de Procedimiento"
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            {...register('descripcion')}
            rows={2}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Documento *
            </label>
            <select
              {...register('tipo_documento', {
                required: 'Tipo requerido',
                validate: (v) => v > 0 || 'Seleccione un tipo',
              })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Seleccionar...</option>
              {(tipos as { id: number; nombre: string; codigo: string }[] || []).map((t) => (
                <option key={t.id} value={t.id}>{t.codigo} - {t.nombre}</option>
              ))}
            </select>
            {errors.tipo_documento && <p className="text-xs text-red-500 mt-1">{errors.tipo_documento.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Plantilla
            </label>
            <select
              {...register('tipo_plantilla')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIPO_PLANTILLA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Versión
            </label>
            <input
              {...register('version')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1.0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contenido de la Plantilla *
          </label>
          <textarea
            {...register('contenido_plantilla', { required: 'Contenido es requerido' })}
            rows={8}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="<h1>{{titulo}}</h1>\n<p>{{contenido}}</p>"
          />
          {errors.contenido_plantilla && <p className="text-xs text-red-500 mt-1">{errors.contenido_plantilla.message}</p>}
        </div>

        {isEdit && existing && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
            <Badge variant={existing.estado === 'ACTIVA' ? 'success' : existing.estado === 'BORRADOR' ? 'warning' : 'secondary'}>
              {existing.estado}
            </Badge>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
