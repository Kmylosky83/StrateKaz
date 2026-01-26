/**
 * Modal Unificado de Políticas
 * Sistema de Gestión StrateKaz v4.0
 *
 * Un solo modal para crear/editar cualquier política.
 * Las políticas se agrupan por Norma/Sistema de Gestión.
 *
 * Campos principales:
 * - norma_iso: Norma o Sistema de Gestión (obligatorio)
 * - title: Título de la política
 * - content: Contenido en HTML (RichText)
 * - is_integral_policy: Si es política integral del sistema
 */
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Shield, Calendar, Tag, AlertCircle } from 'lucide-react';

// Design System
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { RichTextEditor } from '@/components/forms/RichTextEditor';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import {
  useNormasISOActivas,
  useCreatePolitica,
  useUpdatePolitica,
} from '../../hooks/usePoliticas';
import { useAreas } from '../../hooks/useAreas';

// Types
import type { Politica, CreatePoliticaDTO, NormaISO } from '../../types/policies.types';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const politicaSchema = z.object({
  norma_iso: z.number({ required_error: 'Seleccione una norma o sistema de gestión' }),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  content: z.string().min(10, 'El contenido es requerido'),
  effective_date: z.string().optional(),
  review_date: z.string().optional(),
  area_id: z.number().optional().nullable(),
  responsible_cargo_id: z.number().optional().nullable(),
  is_integral_policy: z.boolean().default(false),
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
  /** ID de la norma preseleccionada (cuando se crea desde el grupo) */
  defaultNormaId?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UnifiedPolicyModal({
  isOpen,
  onClose,
  identityId,
  politica,
  defaultNormaId,
}: UnifiedPolicyModalProps) {
  const { primaryColor } = useBrandingConfig();
  const isEditing = !!politica;

  // Data queries
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
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(politicaSchema),
    defaultValues: {
      norma_iso: defaultNormaId || politica?.norma_iso || undefined,
      title: politica?.title || '',
      content: politica?.content || '',
      effective_date: politica?.effective_date || '',
      review_date: politica?.review_date || '',
      area_id: politica?.area_id || null,
      responsible_cargo_id: politica?.responsible_cargo_id || null,
      is_integral_policy: politica?.is_integral_policy || false,
    },
  });

  const selectedNormaId = watch('norma_iso');
  const isIntegral = watch('is_integral_policy');

  const selectedNorma = useMemo(
    () => normasISO.find(n => n.id === selectedNormaId),
    [normasISO, selectedNormaId]
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        norma_iso: defaultNormaId || politica?.norma_iso || undefined,
        title: politica?.title || '',
        content: politica?.content || '',
        effective_date: politica?.effective_date || '',
        review_date: politica?.review_date || '',
        area_id: politica?.area_id || null,
        responsible_cargo_id: politica?.responsible_cargo_id || null,
        is_integral_policy: politica?.is_integral_policy || false,
      });
    }
  }, [isOpen, politica, defaultNormaId, reset]);

  const onSubmit = async (data: FormData) => {
    const dto: CreatePoliticaDTO = {
      identity: identityId,
      norma_iso: data.norma_iso,
      title: data.title,
      content: data.content,
      effective_date: data.effective_date || undefined,
      review_date: data.review_date || undefined,
      area_id: data.area_id || undefined,
      responsible_cargo_id: data.responsible_cargo_id || undefined,
      is_integral_policy: data.is_integral_policy,
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
                style={{ backgroundColor: `${selectedNorma?.color || primaryColor}20` }}
              >
                <DynamicIcon
                  name={selectedNorma?.icon || 'FileText'}
                  className="w-6 h-6"
                  color={selectedNorma?.color || primaryColor}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Política' : 'Nueva Política'}
                </h2>
                {selectedNorma && (
                  <Badge
                    className="mt-1"
                    style={{
                      backgroundColor: `${selectedNorma.color || primaryColor}20`,
                      color: selectedNorma.color || primaryColor,
                      borderColor: selectedNorma.color || primaryColor,
                    }}
                  >
                    {selectedNorma.short_name || selectedNorma.name}
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
              {/* Norma / Sistema de Gestión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Norma / Sistema de Gestión <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="norma_iso"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {loadingNormas ? (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          Cargando normas...
                        </div>
                      ) : normasISO.length === 0 ? (
                        <div className="col-span-full p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                              No hay normas configuradas
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-500">
                              Configure las normas en Gestión Estratégica → Configuración → Normas ISO
                            </p>
                          </div>
                        </div>
                      ) : (
                        normasISO.map((norma: NormaISO) => (
                          <button
                            key={norma.id}
                            type="button"
                            onClick={() => field.onChange(norma.id)}
                            className={`
                              p-4 rounded-xl border-2 transition-all text-left
                              ${field.value === norma.id
                                ? 'border-current shadow-lg scale-[1.02]'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }
                            `}
                            style={field.value === norma.id ? { borderColor: norma.color || primaryColor } : {}}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="p-1.5 rounded-lg"
                                style={{ backgroundColor: `${norma.color || primaryColor}20` }}
                              >
                                <DynamicIcon
                                  name={norma.icon || 'FileText'}
                                  className="w-4 h-4"
                                  color={norma.color || primaryColor}
                                />
                              </div>
                              <span
                                className="text-sm font-semibold"
                                style={field.value === norma.id ? { color: norma.color || primaryColor } : {}}
                              >
                                {norma.short_name || norma.code}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {norma.name}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                />
                {errors.norma_iso && (
                  <p className="mt-1 text-sm text-red-500">{errors.norma_iso.message}</p>
                )}
              </div>

              {/* Es Política Integral */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Controller
                  name="is_integral_policy"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Política Integral del Sistema
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Marcar si esta es la política integral que engloba todos los sistemas de gestión
                        </p>
                      </div>
                    </label>
                  )}
                />
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder={`Ej: Política de ${selectedNorma?.short_name || 'Gestión'}`}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contenido <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Escriba el contenido de la política..."
                      minHeight={200}
                    />
                  )}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha de Vigencia
                  </label>
                  <Controller
                    name="effective_date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Próxima Revisión
                  </label>
                  <Controller
                    name="review_date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Área (opcional) */}
              {!isIntegral && areasData?.results && areasData.results.length > 0 && (
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Seleccionar área (opcional)</option>
                        {areasData.results.map((area: { id: number; name: string }) => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    )}
                  />
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
                disabled={isSubmitting || loadingNormas}
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Política'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
