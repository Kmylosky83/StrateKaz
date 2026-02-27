/**
 * PlantillaFormModal - Modal CRUD para Plantillas de Documento.
 *
 * Cuando tipo_plantilla === 'FORMULARIO': muestra FormBuilder en vez de textarea.
 * Los campos se guardan via API de CampoFormulario al submit.
 */
import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Modal, Button, Badge, Spinner } from '@/components/common';
import { FormBuilder } from '@/components/common/FormBuilder';
import type { CampoFormulario } from '@/components/common/FormBuilder/types';
import {
  useCreatePlantillaDocumento,
  useUpdatePlantillaDocumento,
  usePlantillaDocumento,
  useTiposDocumento,
  useCamposFormulario,
  useCreateCampoFormulario,
  useUpdateCampoFormulario,
  useDeleteCampoFormulario,
  useReorderCampos,
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
  { value: 'FORMULARIO', label: 'Formulario Dinamico' },
];

export function PlantillaFormModal({ isOpen, onClose, plantillaId }: PlantillaFormModalProps) {
  const isEdit = !!plantillaId;
  const { data: existing, isLoading: isLoadingExisting } = usePlantillaDocumento(plantillaId!);
  const { data: tipos } = useTiposDocumento({ is_active: true });
  const createMutation = useCreatePlantillaDocumento();
  const updateMutation = useUpdatePlantillaDocumento();

  // FormBuilder state
  const [localCampos, setLocalCampos] = useState<Partial<CampoFormulario>[]>([]);
  const { data: existingCampos } = useCamposFormulario(
    isEdit && existing?.tipo_plantilla === 'FORMULARIO' ? plantillaId! : 0
  );
  const createCampo = useCreateCampoFormulario();
  const updateCampo = useUpdateCampoFormulario();
  const deleteCampo = useDeleteCampoFormulario();
  const reorderCampos = useReorderCampos();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
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

  const tipoPlantilla = watch('tipo_plantilla');
  const isFormulario = tipoPlantilla === 'FORMULARIO';

  // Load existing data
  useEffect(() => {
    if (isEdit && existing) {
      reset({
        codigo: existing.codigo,
        nombre: existing.nombre,
        descripcion: existing.descripcion || '',
        tipo_documento:
          existing.tipo_documento?.id ||
          (existing as { tipo_documento_id?: number }).tipo_documento_id ||
          0,
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
      setLocalCampos([]);
    }
  }, [isEdit, existing, reset]);

  // Load existing campos for FORMULARIO edit
  useEffect(() => {
    if (existingCampos && existingCampos.length > 0) {
      setLocalCampos(existingCampos);
    }
  }, [existingCampos]);

  // Save campos after plantilla is saved
  const saveCampos = useCallback(
    async (savedPlantillaId: number) => {
      const existingIds = new Set((existingCampos || []).map((c: CampoFormulario) => c.id));
      const currentIds = new Set(localCampos.filter((c) => c.id).map((c) => c.id!));

      // Delete removed campos
      const deletedIds = [...existingIds].filter((id) => !currentIds.has(id));
      for (const id of deletedIds) {
        await deleteCampo.mutateAsync({ id, plantillaId: savedPlantillaId });
      }

      // Create/update campos
      for (let i = 0; i < localCampos.length; i++) {
        const campo = { ...localCampos[i], orden: i, plantilla: savedPlantillaId };
        if (campo.id && existingIds.has(campo.id)) {
          // Update existing
          const { id, created_at, updated_at, created_by, created_by_detail, empresa_id, ...data } =
            campo as CampoFormulario;
          await updateCampo.mutateAsync({ id, data });
        } else {
          // Create new
          const { id, created_at, updated_at, created_by, created_by_detail, empresa_id, ...data } =
            campo as CampoFormulario;
          await createCampo.mutateAsync(data);
        }
      }

      // Reorder if there are persisted campos
      const persistedCampos = localCampos
        .map((c, i) => ({ id: c.id, orden: i }))
        .filter((c): c is { id: number; orden: number } => !!c.id);
      if (persistedCampos.length > 0) {
        await reorderCampos.mutateAsync({ plantillaId: savedPlantillaId, data: persistedCampos });
      }
    },
    [localCampos, existingCampos, createCampo, updateCampo, deleteCampo, reorderCampos]
  );

  const onSubmit = async (data: CreatePlantillaDocumentoDTO) => {
    try {
      // For FORMULARIO, contenido_plantilla is not required
      if (isFormulario && !data.contenido_plantilla) {
        data.contenido_plantilla = '';
      }

      let savedId: number;
      if (isEdit && plantillaId) {
        await updateMutation.mutateAsync({ id: plantillaId, data });
        savedId = plantillaId;
      } else {
        const result = await createMutation.mutateAsync(data);
        savedId = (result as { id: number }).id;
      }

      // Save campos if FORMULARIO
      if (isFormulario && localCampos.length > 0) {
        await saveCampos(savedId);
      }

      onClose();
    } catch {
      // Errors are handled by mutation onError callbacks
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    createCampo.isPending ||
    updateCampo.isPending ||
    deleteCampo.isPending;

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
      title={isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}
      size={isFormulario ? '6xl' : '2xl'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código
            </label>
            <input
              {...register('codigo')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Se genera automáticamente"
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
            Descripcion
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
              Tipo de Plantilla
            </label>
            <Controller
              name="tipo_plantilla"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIPO_PLANTILLA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Version
            </label>
            <input
              {...register('version')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1.0"
            />
          </div>
        </div>

        {/* Content area: textarea for HTML/MARKDOWN, FormBuilder for FORMULARIO */}
        {isFormulario ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Campos del Formulario
            </label>
            <FormBuilder campos={localCampos} onCamposChange={setLocalCampos} />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contenido de la Plantilla *
            </label>
            <textarea
              {...register('contenido_plantilla', {
                required: !isFormulario ? 'Contenido es requerido' : false,
              })}
              rows={8}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="<h1>{{titulo}}</h1>\n<p>{{contenido}}</p>"
            />
            {errors.contenido_plantilla && (
              <p className="text-xs text-red-500 mt-1">{errors.contenido_plantilla.message}</p>
            )}
          </div>
        )}

        {isEdit && existing && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
            <Badge
              variant={
                existing.estado === 'ACTIVA'
                  ? 'success'
                  : existing.estado === 'BORRADOR'
                    ? 'warning'
                    : 'secondary'
              }
            >
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
