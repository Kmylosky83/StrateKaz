/**
 * FactorPestelFormModal - Formulario para crear/editar Factor PESTEL individual
 * Sistema de Gestión StrateKaz - Sprint 2
 *
 * Características:
 * - Formulario standalone para factores PESTEL
 * - Select de tipo con iconos y badges
 * - Preview visual de impacto/probabilidad
 * - Indicadores de tendencia con iconos
 * - Pre-selección de tipo desde cuadrante clickeado
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import {
  Landmark,
  DollarSign,
  Users,
  Cpu,
  Leaf,
  Scale,
  TrendingUp,
  Minus,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { useCreateFactorPestel, useUpdateFactorPestel } from '../../hooks/useContexto';
import type {
  FactorPESTEL,
  CreateFactorPESTELDTO,
  UpdateFactorPESTELDTO,
  TipoFactorPESTEL,
  NivelImpacto,
  TendenciaFactor,
} from '../../types/contexto.types';
import {
  TIPO_FACTOR_PESTEL_CONFIG,
  NIVEL_IMPACTO_CONFIG,
  TENDENCIA_FACTOR_CONFIG,
} from '../../types/contexto.types';
import { cn } from '@/utils/cn';

// ============================================================================
// ZOD SCHEMA
// ============================================================================

const factorPestelSchema = z.object({
  analisis: z.number().min(1, 'Debe seleccionar un análisis'),
  tipo: z.enum(['politico', 'economico', 'social', 'tecnologico', 'ecologico', 'legal']),
  descripcion: z
    .string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  tendencia: z.enum(['mejorando', 'estable', 'empeorando']),
  impacto: z.enum(['alto', 'medio', 'bajo']),
  probabilidad: z.enum(['alta', 'media', 'baja']),
  implicaciones: z
    .string()
    .max(1000, 'Las implicaciones no pueden exceder 1000 caracteres')
    .optional(),
  fuentes: z.string().max(500, 'Las fuentes no pueden exceder 500 caracteres').optional(),
});

type FactorPestelFormData = z.infer<typeof factorPestelSchema>;

// ============================================================================
// CONSTANTES
// ============================================================================

const TIPO_FACTOR_OPTIONS: {
  value: TipoFactorPESTEL;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'politico', label: 'Político', icon: Landmark },
  { value: 'economico', label: 'Económico', icon: DollarSign },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'tecnologico', label: 'Tecnológico', icon: Cpu },
  { value: 'ecologico', label: 'Ecológico', icon: Leaf },
  { value: 'legal', label: 'Legal', icon: Scale },
];

const getTendenciaIcon = (tendencia: TendenciaFactor) => {
  switch (tendencia) {
    case 'mejorando':
      return TrendingUp;
    case 'empeorando':
      return TrendingDown;
    default:
      return Minus;
  }
};

// ============================================================================
// PROPS
// ============================================================================

export interface FactorPestelFormModalProps {
  factor: FactorPESTEL | null;
  analisisId?: number;
  tipoInicial?: TipoFactorPESTEL;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const FactorPestelFormModal = ({
  factor,
  analisisId,
  tipoInicial,
  isOpen,
  onClose,
}: FactorPestelFormModalProps) => {
  const isEditing = factor !== null;

  // Mutations
  const createMutation = useCreateFactorPestel();
  const updateMutation = useUpdateFactorPestel();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<FactorPestelFormData>({
    resolver: zodResolver(factorPestelSchema),
    mode: 'onChange',
    defaultValues: {
      analisis: analisisId || 0,
      tipo: tipoInicial || 'politico',
      descripcion: '',
      tendencia: 'estable',
      impacto: 'medio',
      probabilidad: 'media',
      implicaciones: '',
      fuentes: '',
    },
  });

  const selectedTipo = watch('tipo');
  const selectedTendencia = watch('tendencia');
  const selectedImpacto = watch('impacto');
  const selectedProbabilidad = watch('probabilidad');

  // Efecto: Cargar datos al editar
  useEffect(() => {
    if (isEditing && factor && isOpen) {
      reset({
        analisis: factor.analisis,
        tipo: factor.tipo,
        descripcion: factor.descripcion,
        tendencia: factor.tendencia,
        impacto: factor.impacto,
        probabilidad: factor.probabilidad,
        implicaciones: factor.implicaciones || '',
        fuentes: factor.fuentes || '',
      });
    } else if (!isEditing && isOpen) {
      reset({
        analisis: analisisId || 0,
        tipo: tipoInicial || 'politico',
        descripcion: '',
        tendencia: 'estable',
        impacto: 'medio',
        probabilidad: 'media',
        implicaciones: '',
        fuentes: '',
      });
    }
  }, [factor, analisisId, tipoInicial, isEditing, isOpen, reset]);

  // Efecto: Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Submit handler
  const onSubmit = async (data: FactorPestelFormData) => {
    try {
      if (isEditing && factor) {
        const updateData: UpdateFactorPESTELDTO = {
          tipo: data.tipo,
          descripcion: data.descripcion,
          tendencia: data.tendencia,
          impacto: data.impacto,
          probabilidad: data.probabilidad as NivelImpacto,
          implicaciones: data.implicaciones || undefined,
          fuentes: data.fuentes || undefined,
        };

        await updateMutation.mutateAsync({ id: factor.id, data: updateData });
      } else {
        const createData: CreateFactorPESTELDTO = {
          analisis: data.analisis,
          tipo: data.tipo,
          descripcion: data.descripcion,
          tendencia: data.tendencia,
          impacto: data.impacto,
          probabilidad: data.probabilidad as NivelImpacto,
          implicaciones: data.implicaciones || undefined,
          fuentes: data.fuentes || undefined,
        };

        await createMutation.mutateAsync(createData);
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar factor PESTEL:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const tipoConfig = TIPO_FACTOR_PESTEL_CONFIG[selectedTipo];
  const TipoIcon = TIPO_FACTOR_OPTIONS.find((t) => t.value === selectedTipo)?.icon || AlertCircle;
  const TendenciaIcon = getTendenciaIcon(selectedTendencia);
  const tendenciaConfig = TENDENCIA_FACTOR_CONFIG[selectedTendencia];
  const impactoConfig = NIVEL_IMPACTO_CONFIG[selectedImpacto];
  const probabilidadConfig = NIVEL_IMPACTO_CONFIG[selectedProbabilidad as NivelImpacto];

  // Footer
  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit(onSubmit)}
        disabled={!isValid || isLoading}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Factor'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Factor PESTEL' : 'Nuevo Factor PESTEL'}
      subtitle={tipoConfig ? `Factor ${tipoConfig.label}` : 'Análisis del entorno externo'}
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ID del Análisis (hidden si ya viene pre-seteado) */}
        {!analisisId && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Debe seleccionar un análisis PESTEL primero
            </p>
          </div>
        )}

        {/* Tipo de Factor */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Tipo de Factor PESTEL *
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIPO_FACTOR_OPTIONS.map(({ value, label, icon: Icon }) => {
              const config = TIPO_FACTOR_PESTEL_CONFIG[value];
              const isSelected = selectedTipo === value;

              return (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue('tipo', value, { shouldValidate: true })}
                  className={cn(
                    '!p-3 !min-h-0 rounded-lg border-2 !flex !flex-col !items-center transition-all w-full',
                    isSelected
                      ? `${config.bgClass} border-current`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg mx-auto w-fit mb-2',
                      isSelected ? config.bgClass : 'bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    <Icon
                      className={cn('h-5 w-5', isSelected ? config.textClass : 'text-gray-500')}
                    />
                  </div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? config.textClass : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {label}
                  </p>
                  <Badge variant={isSelected ? 'primary' : 'secondary'} size="sm" className="mt-1">
                    {config.shortLabel}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Descripción del Factor *
          </h4>

          <Textarea
            label="Descripción"
            placeholder="Describa el factor externo identificado en el análisis PESTEL..."
            {...register('descripcion')}
            error={errors.descripcion?.message}
            rows={3}
            helperText={`${watch('descripcion')?.length || 0}/500 caracteres`}
          />
        </div>

        {/* Tendencia, Impacto y Probabilidad */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Evaluación del Factor
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tendencia */}
            <div>
              <Select
                label="Tendencia *"
                {...register('tendencia')}
                options={[
                  { value: 'mejorando', label: 'Mejorando' },
                  { value: 'estable', label: 'Estable' },
                  { value: 'empeorando', label: 'Empeorando' },
                ]}
                error={errors.tendencia?.message}
              />
              <div className="mt-2 flex items-center gap-2">
                <TendenciaIcon className={cn('h-4 w-4', `text-${tendenciaConfig.color}-600`)} />
                <span className="text-xs text-gray-500">{tendenciaConfig.label}</span>
              </div>
            </div>

            {/* Impacto */}
            <div>
              <Select
                label="Impacto *"
                {...register('impacto')}
                options={[
                  { value: 'alto', label: 'Alto' },
                  { value: 'medio', label: 'Medio' },
                  { value: 'bajo', label: 'Bajo' },
                ]}
                error={errors.impacto?.message}
              />
              <div className="mt-2">
                <Badge variant={impactoConfig.color} size="sm">
                  {impactoConfig.label}
                </Badge>
              </div>
            </div>

            {/* Probabilidad */}
            <div>
              <Select
                label="Probabilidad *"
                {...register('probabilidad')}
                options={[
                  { value: 'alta', label: 'Alta' },
                  { value: 'media', label: 'Media' },
                  { value: 'baja', label: 'Baja' },
                ]}
                error={errors.probabilidad?.message}
              />
              <div className="mt-2">
                <Badge variant={probabilidadConfig.color} size="sm">
                  {probabilidadConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Implicaciones */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Implicaciones y Fuentes
          </h4>

          <Textarea
            label="Implicaciones para la Organización"
            placeholder="¿Qué implica este factor para la organización? ¿Cómo puede afectarla?"
            {...register('implicaciones')}
            error={errors.implicaciones?.message}
            rows={3}
            helperText={`${watch('implicaciones')?.length || 0}/1000 caracteres`}
          />

          <Textarea
            label="Fuentes de Información"
            placeholder="Referencias, estudios, reportes consultados..."
            {...register('fuentes')}
            error={errors.fuentes?.message}
            rows={2}
            helperText={`${watch('fuentes')?.length || 0}/500 caracteres`}
          />
        </div>

        {/* Preview del Factor */}
        {watch('descripcion') && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg', tipoConfig.bgClass)}>
                <TipoIcon className={cn('h-5 w-5', tipoConfig.textClass)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary" size="sm">
                    {tipoConfig.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <TendenciaIcon className="h-3 w-3" />
                    <span>{tendenciaConfig.label}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{watch('descripcion')}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Impacto:</span>
                  <Badge variant={impactoConfig.color} size="sm">
                    {impactoConfig.label}
                  </Badge>
                  <span className="text-xs text-gray-500 ml-2">Probabilidad:</span>
                  <Badge variant={probabilidadConfig.color} size="sm">
                    {probabilidadConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default FactorPestelFormModal;
