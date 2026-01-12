/**
 * Modal Unificado de Políticas
 * Sistema de Gestión StrateKaz v3.0
 *
 * Un solo modal para crear/editar cualquier tipo de política.
 * El tipo de política determina los campos y comportamiento.
 */
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Shield, PenTool, Calendar, Tag } from 'lucide-react';

// Design System
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { RichTextEditor } from '@/components/forms/RichTextEditor';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import {
  useTiposPolitica,
  useNormasISOActivas,
  useCreatePolitica,
  useUpdatePolitica,
} from '../../hooks/usePoliticas';
import { useAreas } from '../../hooks/useAreas';

// Types
import type { Politica, CreatePoliticaDTO } from '../../types/policies.types';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const politicaSchema = z.object({
  tipo_id: z.number({ required_error: 'Seleccione un tipo de política' }),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  content: z.string().min(10, 'El contenido es requerido'),
  // version: manejada automáticamente por el backend (1.0 inicial, incrementa al crear nueva versión)
  effective_date: z.string().optional(),
  review_date: z.string().optional(),
  normas_aplicables_ids: z.array(z.number()).default([]),
  area_id: z.number().optional().nullable(),
  responsible_cargo_id: z.number().optional().nullable(),
});

type FormData = z.infer<typeof politicaSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface UnifiedPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  identityId: number;
  politica?: Politica | null;
  defaultTipoId?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UnifiedPolicyModal({
  isOpen,
  onClose,
  identityId,
  politica,
  defaultTipoId,
}: UnifiedPolicyModalProps) {
  const { primaryColor } = useBrandingConfig();
  const isEditing = !!politica;

  // Data queries
  const { data: tiposPolitica = [], isLoading: loadingTipos } = useTiposPolitica();
  const { data: normasISO = [], isLoading: loadingNormas } = useNormasISOActivas();
  const { data: areasData } = useAreas();

  // Mutations
  const createMutation = useCreatePolitica();
  const updateMutation = useUpdatePolitica();

  // Form
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(politicaSchema),
    defaultValues: {
      tipo_id: defaultTipoId || politica?.tipo_id,
      title: politica?.title || '',
      content: politica?.content || '',
      effective_date: politica?.effective_date || '',
      review_date: politica?.review_date || '',
      normas_aplicables_ids: politica?.normas_aplicables?.map(n => n.id) || [],
      area_id: politica?.area_id || null,
      responsible_cargo_id: politica?.responsible_cargo_id || null,
    },
  });

  const selectedTipoId = watch('tipo_id');

  const selectedTipo = useMemo(
    () => tiposPolitica.find(t => t.id === selectedTipoId),
    [tiposPolitica, selectedTipoId]
  );

  // Auto-set default normas when tipo changes
  useEffect(() => {
    if (selectedTipo?.normas_iso_default && !isEditing && selectedTipo.normas_iso_default.length > 0) {
      setValue('normas_aplicables_ids', selectedTipo.normas_iso_default);
    }
  }, [selectedTipo, setValue, isEditing]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        tipo_id: defaultTipoId || politica?.tipo_id,
        title: politica?.title || '',
        content: politica?.content || '',
        effective_date: politica?.effective_date || '',
        review_date: politica?.review_date || '',
        normas_aplicables_ids: politica?.normas_aplicables?.map(n => n.id) || [],
        area_id: politica?.area_id || null,
        responsible_cargo_id: politica?.responsible_cargo_id || null,
      });
    }
  }, [isOpen, politica, defaultTipoId, reset]);

  const onSubmit = async (data: FormData) => {
    const dto: CreatePoliticaDTO = {
      identity: identityId,
      tipo_id: data.tipo_id,
      title: data.title,
      content: data.content,
      // version: manejada automáticamente por el backend
      effective_date: data.effective_date || undefined,
      review_date: data.review_date || undefined,
      normas_aplicables_ids: data.normas_aplicables_ids,
      area_id: data.area_id || undefined,
      responsible_cargo_id: data.responsible_cargo_id || undefined,
    };

    if (isEditing && politica) {
      await updateMutation.mutateAsync({ id: politica.id, data: dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    onClose();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Determine if we need to show responsable fields
  const showResponsableFields = selectedTipo && !selectedTipo.code.includes('INTEGRAL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${selectedTipo?.color || primaryColor}20` }}
              >
                <DynamicIcon
                  name={selectedTipo?.icon || 'FileText'}
                  className="w-6 h-6"
                  color={selectedTipo?.color || primaryColor}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Política' : 'Nueva Política'}
                </h2>
                {selectedTipo && (
                  <Badge
                    className="mt-1"
                    style={{
                      backgroundColor: `${selectedTipo.color}20`,
                      color: selectedTipo.color,
                      borderColor: selectedTipo.color,
                    }}
                  >
                    {selectedTipo.name}
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Tipo de Política */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Política <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="tipo_id"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {loadingTipos ? (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          Cargando tipos...
                        </div>
                      ) : (
                        tiposPolitica.map((tipo) => (
                          <button
                            key={tipo.id}
                            type="button"
                            onClick={() => field.onChange(tipo.id)}
                            className={`
                              p-4 rounded-xl border-2 transition-all text-left
                              ${field.value === tipo.id
                                ? 'border-current shadow-lg scale-[1.02]'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }
                            `}
                            style={field.value === tipo.id ? {
                              borderColor: tipo.color,
                              backgroundColor: `${tipo.color}10`,
                            } : undefined}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${tipo.color}20` }}
                              >
                                <DynamicIcon
                                  name={tipo.icon}
                                  className="w-5 h-5"
                                  color={tipo.color}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {tipo.name}
                                </p>
                                {tipo.requiere_firma && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                    <PenTool className="w-3 h-3" />
                                    Requiere firma
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                />
                {errors.tipo_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.tipo_id.message}</p>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título de la Política <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ej: Política de Seguridad y Salud en el Trabajo"
                      className={`
                        w-full px-4 py-3 rounded-xl border transition-colors
                        bg-white dark:bg-gray-800
                        ${errors.title
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                        }
                        focus:outline-none focus:ring-2 focus:ring-opacity-50
                      `}
                    />
                  )}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Normas ISO Aplicables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Normas Aplicables
                  </div>
                </label>
                <Controller
                  name="normas_aplicables_ids"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {loadingNormas ? (
                        <span className="text-gray-500">Cargando normas...</span>
                      ) : (
                        normasISO.map((norma) => {
                          const isSelected = field.value.includes(norma.id);
                          return (
                            <button
                              key={norma.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  field.onChange(field.value.filter(id => id !== norma.id));
                                } else {
                                  field.onChange([...field.value, norma.id]);
                                }
                              }}
                              className={`
                                px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2
                                ${isSelected
                                  ? 'border-current shadow-sm'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }
                              `}
                              style={isSelected ? {
                                borderColor: norma.color || primaryColor,
                                backgroundColor: `${norma.color || primaryColor}10`,
                                color: norma.color || primaryColor,
                              } : undefined}
                            >
                              <DynamicIcon
                                name={norma.icon || 'Award'}
                                className="w-4 h-4"
                                color={isSelected ? (norma.color || primaryColor) : undefined}
                              />
                              <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-700 dark:text-gray-300'}`}>
                                {norma.code}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Fechas - Versión es automática (1.0 inicial, incrementa en nuevas versiones) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fecha de Vigencia
                    </div>
                  </label>
                  <Controller
                    name="effective_date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Próxima Revisión
                    </div>
                  </label>
                  <Controller
                    name="review_date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Responsables (solo para específicas) */}
              {showResponsableFields && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Responsables
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Área Responsable
                      </label>
                      <Controller
                        name="area_id"
                        control={control}
                        render={({ field }) => (
                          <select
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                          >
                            <option value="">Seleccionar área...</option>
                            {areasData?.results?.map((area) => (
                              <option key={area.id} value={area.id}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido - RichTextEditor reutilizable */}
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    label="Contenido de la Política"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Escriba el contenido completo de la política..."
                    error={errors.content?.message}
                    minHeight="250px"
                  />
                )}
              />

              {/* Indicador de Workflow */}
              {selectedTipo?.requiere_firma && (
                <div
                  className="p-4 rounded-xl border-l-4 flex items-start gap-3"
                  style={{
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}10`,
                  }}
                >
                  <PenTool className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Workflow de Firmas Requerido
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Esta política requerirá aprobación mediante firma digital antes de publicarse.
                      {selectedTipo.flujo_firma_default && (
                        <span className="block mt-1 font-medium">
                          Flujo: {selectedTipo.flujo_firma_default.nombre}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[140px]"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  isEditing ? 'Guardar Cambios' : 'Crear Política'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
