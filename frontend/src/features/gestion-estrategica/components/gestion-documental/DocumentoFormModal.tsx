/**
 * DocumentoFormModal - Modal principal para crear/editar Documentos.
 *
 * Cuando la plantilla seleccionada es tipo FORMULARIO:
 * - Oculta textarea de contenido
 * - Muestra DynamicFormRenderer con los campos de la plantilla
 * - Guarda los valores en datos_formulario
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { DynamicFormRenderer, validateDynamicForm } from '@/components/common/DynamicFormRenderer';
import {
  useCreateDocumento,
  useUpdateDocumento,
  useDocumento,
  useTiposDocumento,
  usePlantillasDocumento,
  usePlantillaDocumento,
  useCamposFormulario,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';
import { camposToDynamicFields } from '@/features/gestion-estrategica/utils/campoMapper';
import { useAuthStore } from '@/store/authStore';
import type {
  CreateDocumentoDTO,
  ClasificacionDocumento,
  CampoFormulario,
} from '@/features/gestion-estrategica/types/gestion-documental.types';

interface DocumentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId?: number | null;
}

const CLASIFICACION_OPTIONS: { value: ClasificacionDocumento; label: string }[] = [
  { value: 'PUBLICO', label: 'Publico' },
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

  // Form values for dynamic form
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

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
      // Load existing form data
      if (existing.datos_formulario) {
        const parsed =
          typeof existing.datos_formulario === 'string'
            ? JSON.parse(existing.datos_formulario)
            : existing.datos_formulario;
        setFormValues(parsed);
      }
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
      setFormValues({});
    }
  }, [isEdit, existing, reset, user?.id]);

  // Auto-load plantilla content when selected
  const selectedPlantillaId = watch('plantilla');
  const { data: plantillaDetail } = usePlantillaDocumento(
    selectedPlantillaId ? Number(selectedPlantillaId) : 0
  );

  // Detect FORMULARIO plantilla
  const isFormulario = plantillaDetail?.tipo_plantilla === 'FORMULARIO';

  // Load campos for FORMULARIO plantilla
  const { data: camposRaw } = useCamposFormulario(
    isFormulario && plantillaDetail?.id ? plantillaDetail.id : 0
  );
  const dynamicFields = useMemo(
    () => (camposRaw ? camposToDynamicFields(camposRaw as CampoFormulario[]) : []),
    [camposRaw]
  );

  // Auto-load plantilla content for non-FORMULARIO
  useEffect(() => {
    if (plantillaDetail?.contenido_plantilla && !isEdit && !isFormulario) {
      setValue('contenido', plantillaDetail.contenido_plantilla);
    }
  }, [plantillaDetail, setValue, isEdit, isFormulario]);

  // Reset form values when switching away from FORMULARIO
  useEffect(() => {
    if (!isFormulario) {
      setFormValues({});
    }
  }, [isFormulario]);

  const handleFormValueChange = useCallback((fieldName: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  // Validate dynamic form
  const dynamicErrors = useMemo(() => {
    if (!isFormulario || dynamicFields.length === 0) return {};
    return validateDynamicForm(dynamicFields, formValues);
  }, [isFormulario, dynamicFields, formValues]);

  const onSubmit = async (data: CreateDocumentoDTO) => {
    // Validate dynamic form before submit
    if (isFormulario && dynamicFields.length > 0) {
      const validationErrors = validateDynamicForm(dynamicFields, formValues);
      if (Object.keys(validationErrors).length > 0) {
        return; // Show validation errors in the form
      }
    }

    const payload: CreateDocumentoDTO = {
      ...data,
      tipo_documento: Number(data.tipo_documento),
      elaborado_por: user?.id || 0,
    };

    // For FORMULARIO, save form data and clear contenido
    if (isFormulario) {
      payload.datos_formulario = formValues;
      if (!payload.contenido) {
        payload.contenido = '';
      }
    }

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
    (plantillas as {
      id: number;
      nombre: string;
      tipo_documento?: { id: number } | number;
      tipo_plantilla?: string;
    }[]) || []
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
      size={isFormulario ? '5xl' : '3xl'}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        <Input
          label="Titulo *"
          {...register('titulo', { required: 'Titulo es requerido' })}
          placeholder="Procedimiento de Control de Documentos"
          error={errors.titulo?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Select
              label="Tipo de Documento *"
              {...register('tipo_documento', {
                required: 'Tipo requerido',
                validate: (v) => Number(v) > 0 || 'Seleccione un tipo',
              })}
              error={errors.tipo_documento?.message}
            >
              <option value={0}>Seleccionar...</option>
              {((tipos as { id: number; nombre: string; codigo: string }[]) || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} - {t.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Plantilla"
              {...register('plantilla')}
            >
              <option value="">Sin plantilla</option>
              {filteredPlantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.tipo_plantilla === 'FORMULARIO' ? ' (Formulario)' : ''}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Clasificacion"
            {...register('clasificacion')}
            options={CLASIFICACION_OPTIONS}
          />
        </div>

        <Textarea
          label="Resumen"
          {...register('resumen')}
          rows={2}
          placeholder="Resumen ejecutivo del documento..."
        />

        {/* Content: DynamicFormRenderer for FORMULARIO, Textarea otherwise */}
        {isFormulario && dynamicFields.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formulario
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
              <DynamicFormRenderer
                fields={dynamicFields}
                values={formValues}
                onChange={handleFormValueChange}
                errors={dynamicErrors}
                useGridLayout
              />
            </div>
          </div>
        ) : (
          <Textarea
            label={`Contenido ${!isFormulario ? '*' : ''}`}
            {...register('contenido', {
              required: !isFormulario ? 'Contenido es requerido' : false,
            })}
            rows={10}
            className="font-mono"
            placeholder="Contenido del documento en formato HTML o Markdown..."
            error={errors.contenido?.message}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha de Vigencia"
            type="date"
            {...register('fecha_vigencia')}
          />

          <Input
            label="Revision Programada"
            type="date"
            {...register('fecha_revision_programada')}
          />
        </div>

        <Textarea
          label="Observaciones"
          {...register('observaciones')}
          rows={2}
        />

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
