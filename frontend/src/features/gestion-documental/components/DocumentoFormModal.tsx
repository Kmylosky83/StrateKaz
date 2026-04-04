/**
 * DocumentoFormModal - Modal principal para crear/editar Documentos.
 *
 * CREACIÓN: Wizard de 3 pasos
 *   Paso 1 — Identificación: título, tipo, proceso, clasificación
 *   Paso 2 — Contenido: plantilla, editor (o formulario dinámico)
 *   Paso 3 — Revisión: preview código + fechas + crear borrador
 *
 * EDICIÓN: Form plano (preserva comportamiento original).
 */
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { CheckCircle, FileText, Edit3, ClipboardList } from 'lucide-react';
import type { RichTextEditorRef } from '@/components/forms';
import { Button, Spinner, Badge } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input, Select, Textarea, RichTextEditor } from '@/components/forms';
import { FileSearch } from 'lucide-react';
import { DynamicFormRenderer, validateDynamicForm } from '@/components/common/DynamicFormRenderer';
import {
  useCreateDocumento,
  useUpdateDocumento,
  useDocumento,
  useTiposDocumento,
  usePlantillasDocumento,
  usePlantillaDocumento,
  useCamposFormulario,
} from '../hooks/useGestionDocumental';
import { useAreas } from '@/features/gestion-estrategica/hooks/useAreas';
import { camposToDynamicFields } from '../utils/campoMapper';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import type {
  CreateDocumentoDTO,
  ClasificacionDocumento,
  CampoFormulario,
} from '../types/gestion-documental.types';

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

const WIZARD_STEPS = [
  { id: 1, label: 'Identificación', icon: FileText },
  { id: 2, label: 'Contenido', icon: Edit3 },
  { id: 3, label: 'Revisión', icon: ClipboardList },
];

// ─── Stepper visual ───────────────────────────────────────────────────────────
function WizardStepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {WIZARD_STEPS.map((s, idx) => {
        const done = step > s.id;
        const active = step === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                  done && 'bg-indigo-600 border-indigo-600 text-white',
                  active && 'bg-white dark:bg-gray-900 border-indigo-600 text-indigo-600',
                  !done && !active && 'bg-white dark:bg-gray-900 border-gray-300 text-gray-400'
                )}
              >
                {done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-14px]',
                  done ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DocumentoFormModal({ isOpen, onClose, documentoId }: DocumentoFormModalProps) {
  const isEdit = !!documentoId;
  const { data: existing, isLoading: isLoadingExisting } = useDocumento(documentoId!);
  const { data: tipos = [] } = useTiposDocumento({ is_active: true });
  const { data: plantillas } = usePlantillasDocumento({ estado: 'ACTIVA' });
  const createMutation = useCreateDocumento();
  const updateMutation = useUpdateDocumento();
  const { data: procesosData } = useAreas({ is_active: true });
  const user = useAuthStore((s) => s.user);

  const editorRef = useRef<RichTextEditorRef>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [wizardStep, setWizardStep] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateDocumentoDTO>({
    defaultValues: {
      titulo: '',
      tipo_documento: 0,
      proceso: '',
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

  // Resetear wizard al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setWizardStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        titulo: existing.titulo,
        tipo_documento: (existing.tipo_documento_detail?.id ?? existing.tipo_documento) || 0,
        proceso: existing.proceso ? String(existing.proceso) : '',
        plantilla: existing.plantilla_detail?.id ?? existing.plantilla ?? undefined,
        contenido: existing.contenido || '',
        resumen: existing.resumen || '',
        clasificacion: existing.clasificacion,
        palabras_clave: existing.palabras_clave || [],
        fecha_vigencia: existing.fecha_vigencia || '',
        fecha_revision_programada: existing.fecha_revision_programada || '',
        areas_aplicacion: existing.areas_aplicacion || [],
        observaciones: existing.observaciones || '',
        elaborado_por: existing.elaborado_por_detail?.id ?? existing.elaborado_por ?? user?.id ?? 0,
      });
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
        proceso: '',
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

  const selectedPlantillaId = watch('plantilla');
  const { data: plantillaDetail } = usePlantillaDocumento(
    selectedPlantillaId ? Number(selectedPlantillaId) : 0
  );

  const isFormulario = plantillaDetail?.tipo_plantilla === 'FORMULARIO';
  const isExterno = isEdit && !!existing?.es_externo;

  useEffect(() => {
    register('contenido', {
      validate: (v) => {
        if (isFormulario || isExterno) return true;
        const text = (v || '').replace(/<[^>]*>/g, '').trim();
        return text.length > 0 || 'Contenido es requerido';
      },
    });
  }, [register, isFormulario, isExterno]);

  const { data: camposRaw } = useCamposFormulario(
    isFormulario && plantillaDetail?.id ? plantillaDetail.id : 0
  );
  const dynamicFields = useMemo(
    () => (camposRaw ? camposToDynamicFields(camposRaw as CampoFormulario[]) : []),
    [camposRaw]
  );

  useEffect(() => {
    if (plantillaDetail?.contenido_plantilla && !isEdit && !isFormulario) {
      setValue('contenido', plantillaDetail.contenido_plantilla);
    }
  }, [plantillaDetail, setValue, isEdit, isFormulario]);

  useEffect(() => {
    if (!isFormulario) setFormValues({});
  }, [isFormulario]);

  const handleFormValueChange = useCallback((fieldName: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const dynamicErrors = useMemo(() => {
    if (!isFormulario || dynamicFields.length === 0) return {};
    return validateDynamicForm(dynamicFields, formValues);
  }, [isFormulario, dynamicFields, formValues]);

  const filteredPlantillas = (
    (plantillas as {
      id: number;
      nombre: string;
      tipo_documento?: { id: number } | number;
      tipo_plantilla?: string;
    }[]) || []
  ).filter((p) => {
    const tipoId = typeof p.tipo_documento === 'object' ? p.tipo_documento?.id : p.tipo_documento;
    const selectedTipo = watch('tipo_documento');
    return !selectedTipo || tipoId === Number(selectedTipo);
  });

  const onSubmit = async (data: CreateDocumentoDTO) => {
    if (isFormulario && dynamicFields.length > 0) {
      const validationErrors = validateDynamicForm(dynamicFields, formValues);
      if (Object.keys(validationErrors).length > 0) return;
    }

    const payload: CreateDocumentoDTO = {
      ...data,
      tipo_documento: Number(data.tipo_documento),
      elaborado_por: user?.id || 0,
      fecha_vigencia: data.fecha_vigencia || undefined,
      fecha_revision_programada: data.fecha_revision_programada || undefined,
    };

    if (isFormulario) {
      payload.datos_formulario = formValues;
      if (!payload.contenido) payload.contenido = '';
    }

    try {
      if (isEdit && documentoId) {
        await updateMutation.mutateAsync({ id: documentoId, data: payload });
      } else {
        const response = await createMutation.mutateAsync(payload);
        const responseData = response as unknown as Record<string, unknown>;
        const autoAsignados = responseData?.firmantes_auto_asignados as number | undefined;
        const warnings = responseData?.firmantes_warnings as string[] | undefined;

        if (autoAsignados && autoAsignados > 0) {
          toast.success(
            `${autoAsignados} firmante${autoAsignados > 1 ? 's' : ''} asignado${autoAsignados > 1 ? 's' : ''} automáticamente`
          );
        }
        if (warnings?.length) warnings.forEach((w) => toast.warning(w));
      }
      onClose();
    } catch {
      // onError del mutation maneja el toast
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedTipo = watch('tipo_documento');
  const selectedProceso = watch('proceso');

  // Avanzar paso con validación
  const handleNext = async () => {
    if (wizardStep === 1) {
      const ok = await trigger(['titulo', 'tipo_documento']);
      if (ok) setWizardStep(2);
    } else if (wizardStep === 2) {
      const ok = await trigger(['contenido']);
      if (ok || isFormulario) setWizardStep(3);
    }
  };

  if (isEdit && isLoadingExisting) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Cargando...">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </BaseModal>
    );
  }

  // ─── FOOTER dinámico ──────────────────────────────────────────────────────
  const footerEdit = (
    <>
      <Button variant="outline" onClick={onClose} type="button">
        Cancelar
      </Button>
      <Button type="button" disabled={isPending} onClick={handleSubmit(onSubmit)}>
        {isPending ? 'Guardando...' : 'Actualizar'}
      </Button>
    </>
  );

  const footerCreate = (
    <>
      <Button variant="outline" onClick={onClose} type="button">
        Cancelar
      </Button>
      {wizardStep > 1 && (
        <Button variant="outline" type="button" onClick={() => setWizardStep((s) => s - 1)}>
          ← Anterior
        </Button>
      )}
      {wizardStep < 3 ? (
        <Button type="button" onClick={handleNext}>
          Siguiente →
        </Button>
      ) : (
        <Button type="button" disabled={isPending} onClick={handleSubmit(onSubmit)}>
          {isPending ? 'Creando...' : 'Crear Borrador'}
        </Button>
      )}
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Documento' : 'Nuevo Documento'}
      size={isFormulario ? 'full' : '3xl'}
      footer={isEdit ? footerEdit : footerCreate}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Wizard stepper — solo en creación */}
        {!isEdit && <WizardStepper step={wizardStep} />}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PASO 1 — Identificación (o edición: siempre visible) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {(isEdit || wizardStep === 1) && (
          <div className="space-y-4">
            <Input
              label="Título *"
              {...register('titulo', { required: 'Título es requerido' })}
              placeholder="Política de Calidad / Procedimiento de Control..."
              error={errors.titulo?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <Select label="Proceso" {...register('proceso')}>
                <option value="">Sin proceso asignado</option>
                {(procesosData?.results || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <Select
              label="Clasificación"
              {...register('clasificacion')}
              options={CLASIFICACION_OPTIONS}
            />

            {/* Preview código — feedback inmediato al usuario */}
            {selectedTipo && Number(selectedTipo) > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Código generado:{' '}
                <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  {(tipos as { id: number; codigo: string }[]).find(
                    (t) => t.id === Number(selectedTipo)
                  )?.codigo || '??'}
                  -
                  {selectedProceso
                    ? (procesosData?.results || []).find((p) => p.id === Number(selectedProceso))
                        ?.code || '??'
                    : 'PROC'}
                  -001
                </span>
              </p>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PASO 2 — Contenido */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {(isEdit || wizardStep === 2) && (
          <div className="space-y-4">
            {/* En edición: Proceso va aquí */}
            {isEdit && (
              <Select label="Proceso" {...register('proceso')}>
                <option value="">Sin proceso asignado</option>
                {(procesosData?.results || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Plantilla" {...register('plantilla')}>
                <option value="">Sin plantilla</option>
                {filteredPlantillas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                    {p.tipo_plantilla === 'FORMULARIO' ? ' (Formulario)' : ''}
                  </option>
                ))}
              </Select>

              {isEdit && (
                <Select
                  label="Clasificación"
                  {...register('clasificacion')}
                  options={CLASIFICACION_OPTIONS}
                />
              )}
            </div>

            {isFormulario && dynamicFields.length > 0 ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                <DynamicFormRenderer
                  fields={dynamicFields}
                  values={formValues}
                  onChange={handleFormValueChange}
                  errors={dynamicErrors}
                  useGridLayout
                />
              </div>
            ) : (
              <>
                <Textarea
                  label="Resumen"
                  {...register('resumen')}
                  rows={2}
                  placeholder="Resumen ejecutivo del documento..."
                />

                {isEdit && existing?.es_externo && existing?.texto_extraido && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <FileSearch className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Texto extraído por OCR disponible (
                        {existing.texto_extraido.length.toLocaleString()} caracteres)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const texto = existing.texto_extraido || '';
                        const htmlContent = texto
                          .split('\n\n')
                          .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
                          .join('');
                        setValue('contenido', htmlContent, { shouldValidate: true });
                        toast.success('Texto OCR cargado en el editor');
                      }}
                    >
                      Usar texto OCR
                    </Button>
                  </div>
                )}

                <RichTextEditor
                  ref={editorRef}
                  label="Contenido *"
                  value={watch('contenido')}
                  onChange={(value) => setValue('contenido', value, { shouldValidate: true })}
                  placeholder="Escriba el contenido del documento..."
                  minHeight="250px"
                  error={errors.contenido?.message}
                />
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PASO 3 — Revisión (solo creación) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!isEdit && wizardStep === 3 && (
          <div className="space-y-4">
            {/* Resumen del documento a crear */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                Resumen del documento a crear
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">
                    Título
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {watch('titulo') || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">
                    Código estimado
                  </span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {(tipos as { id: number; codigo: string }[]).find(
                      (t) => t.id === Number(selectedTipo)
                    )?.codigo || '??'}
                    -
                    {selectedProceso
                      ? (procesosData?.results || []).find((p) => p.id === Number(selectedProceso))
                          ?.code || '??'
                      : 'PROC'}
                    -001
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">
                    Tipo
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {(tipos as { id: number; nombre: string }[]).find(
                      (t) => t.id === Number(selectedTipo)
                    )?.nombre || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">
                    Clasificación
                  </span>
                  <Badge
                    variant={
                      {
                        PUBLICO: 'success',
                        INTERNO: 'info',
                        CONFIDENCIAL: 'warning',
                        RESTRINGIDO: 'danger',
                      }[watch('clasificacion')] as 'success' | 'info' | 'warning' | 'danger'
                    }
                    size="sm"
                  >
                    {watch('clasificacion')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Fechas opcionales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Fecha de Vigencia" type="date" {...register('fecha_vigencia')} />
              <Input
                label="Revisión Programada"
                type="date"
                {...register('fecha_revision_programada')}
              />
            </div>

            <Textarea label="Observaciones" {...register('observaciones')} rows={2} />

            <p className="text-xs text-gray-500 dark:text-gray-400">
              El documento se creará en estado <strong>BORRADOR</strong>. Luego podrá asignar
              firmantes y enviarlo a revisión.
            </p>
          </div>
        )}

        {/* Edición: fechas y observaciones siempre visibles */}
        {isEdit && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Fecha de Vigencia" type="date" {...register('fecha_vigencia')} />
              <Input
                label="Revisión Programada"
                type="date"
                {...register('fecha_revision_programada')}
              />
            </div>
            <Textarea label="Observaciones" {...register('observaciones')} rows={2} />
          </div>
        )}
      </form>
    </BaseModal>
  );
}
