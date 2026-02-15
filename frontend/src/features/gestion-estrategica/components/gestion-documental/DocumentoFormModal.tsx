/**
 * DocumentoFormModal - Modal principal para crear/editar Documentos.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button, Spinner } from '@/components/common';
import {
  useCreateDocumento,
  useUpdateDocumento,
  useDocumento,
  useTiposDocumento,
  usePlantillasDocumento,
  usePlantillaDocumento,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';
import { useAuthStore } from '@/store/authStore';
import type {
  CreateDocumentoDTO,
  ClasificacionDocumento,
} from '@/features/gestion-estrategica/types/gestion-documental.types';

interface DocumentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId?: number | null;
}

const CLASIFICACION_OPTIONS: { value: ClasificacionDocumento; label: string }[] = [
  { value: 'PUBLICO', label: 'Público' },
  { value: 'INTERNO', label: 'Interno' },
  { value: 'CONFIDENCIAL', label: 'Confidencial' },
  { value: 'RESTRINGIDO', label: 'Restringido' },
];

export function DocumentoFormModal({ isOpen, onClose, documentoId }: DocumentoFormModalProps) {
  const isEdit = !!documentoId;
  const { data: existing, isLoading: isLoadingExisting } = useDocumento(documentoId!);
  const { data: tipos } = useTiposDocumento({ is_active: true });
  const { data: plantillas } = usePlantillasDocumento({ estado: 'ACTIVA' });
  const createMutation = useCreateDocumento();
  const updateMutation = useUpdateDocumento();
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDocumentoDTO>({
    defaultValues: {
      titulo: '',
      tipo_documento: 0,
      contenido: '',
      resumen: '',
      clasificacion: 'INTERNO',
      palabras_clave: [],
      fecha_vigencia: '',
      fecha_revision_programada: '',
      areas_aplicacion: [],
      observaciones: '',
      elaborado_por: user?.id || 0,
    },
  });

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        titulo: existing.titulo,
        tipo_documento:
          existing.tipo_documento?.id ||
          (existing as { tipo_documento_id?: number }).tipo_documento_id ||
          0,
        plantilla: existing.plantilla?.id || undefined,
        contenido: existing.contenido || '',
        resumen: existing.resumen || '',
        clasificacion: existing.clasificacion,
        palabras_clave: existing.palabras_clave || [],
        fecha_vigencia: existing.fecha_vigencia || '',
        fecha_revision_programada: existing.fecha_revision_programada || '',
        areas_aplicacion: existing.areas_aplicacion || [],
        observaciones: existing.observaciones || '',
        elaborado_por: existing.elaborado_por?.id || user?.id || 0,
      });
    } else if (!isEdit) {
      reset({
        titulo: '',
        tipo_documento: 0,
        contenido: '',
        resumen: '',
        clasificacion: 'INTERNO',
        palabras_clave: [],
        fecha_vigencia: '',
        fecha_revision_programada: '',
        areas_aplicacion: [],
        observaciones: '',
        elaborado_por: user?.id || 0,
      });
    }
  }, [isEdit, existing, reset, user?.id]);

  // Auto-load plantilla content when selected
  const selectedPlantillaId = watch('plantilla');
  const { data: plantillaDetail } = usePlantillaDocumento(
    selectedPlantillaId ? Number(selectedPlantillaId) : 0
  );

  useEffect(() => {
    if (plantillaDetail?.contenido_plantilla && !isEdit) {
      setValue('contenido', plantillaDetail.contenido_plantilla);
    }
  }, [plantillaDetail, setValue, isEdit]);

  const onSubmit = async (data: CreateDocumentoDTO) => {
    const payload = {
      ...data,
      tipo_documento: Number(data.tipo_documento),
      elaborado_por: user?.id || 0,
    };

    if (isEdit && documentoId) {
      await updateMutation.mutateAsync({ id: documentoId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedTipo = watch('tipo_documento');

  // Filter plantillas by selected tipo
  const filteredPlantillas = (
    (plantillas as { id: number; nombre: string; tipo_documento?: { id: number } | number }[]) || []
  ).filter((p) => {
    const tipoId = typeof p.tipo_documento === 'object' ? p.tipo_documento?.id : p.tipo_documento;
    return !selectedTipo || tipoId === Number(selectedTipo);
  });

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Documento' : 'Crear Documento'}
      size="3xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título *
          </label>
          <input
            {...register('titulo', { required: 'Título es requerido' })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Procedimiento de Control de Documentos"
          />
          {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Documento *
            </label>
            <select
              {...register('tipo_documento', {
                required: 'Tipo requerido',
                validate: (v) => Number(v) > 0 || 'Seleccione un tipo',
              })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Seleccionar...</option>
              {((tipos as { id: number; nombre: string; codigo: string }[]) || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} - {t.nombre}
                </option>
              ))}
            </select>
            {errors.tipo_documento && (
              <p className="text-xs text-red-500 mt-1">{errors.tipo_documento.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plantilla
            </label>
            <select
              {...register('plantilla')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sin plantilla</option>
              {filteredPlantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Clasificación
            </label>
            <select
              {...register('clasificacion')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CLASIFICACION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Resumen
          </label>
          <textarea
            {...register('resumen')}
            rows={2}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Resumen ejecutivo del documento..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contenido *
          </label>
          <textarea
            {...register('contenido', { required: 'Contenido es requerido' })}
            rows={10}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contenido del documento en formato HTML o Markdown..."
          />
          {errors.contenido && (
            <p className="text-xs text-red-500 mt-1">{errors.contenido.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Vigencia
            </label>
            <input
              type="date"
              {...register('fecha_vigencia')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Revisión Programada
            </label>
            <input
              type="date"
              {...register('fecha_revision_programada')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observaciones
          </label>
          <textarea
            {...register('observaciones')}
            rows={2}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Borrador'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
