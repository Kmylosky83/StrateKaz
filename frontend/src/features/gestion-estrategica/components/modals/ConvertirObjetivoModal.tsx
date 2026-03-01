/**
 * ConvertirObjetivoModal - Modal para convertir Estrategia TOWS → Objetivo BSC
 * Sistema de Gestión StrateKaz
 *
 * 🎯 PIEZA CLAVE del flujo Contexto → Formulación Estratégica
 *
 * Flujo:
 * 1. Análisis DOFA → Factores
 * 2. Matriz TOWS → Estrategias
 * 3. ⭐ Convertir Estrategia → Objetivo BSC (ESTE COMPONENTE)
 * 4. Objetivo BSC → KPIs, Iniciativas, Proyectos
 *
 * Características:
 * - Formulario con React Hook Form + Zod
 * - Validación de código único en tiempo real
 * - Select perspectiva BSC con iconos y colores
 * - Preview del objetivo a crear
 * - Auto-sugerencia de código basado en tipo TOWS
 * - Botón deshabilitado si la estrategia ya fue convertida
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import {
  Target,
  TrendingUp,
  Users,
  Cog,
  GraduationCap,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useConvertirEstrategiaObjetivo } from '../../hooks/useContexto';
import {
  TIPO_ESTRATEGIA_TOWS_CONFIG,
  type EstrategiaTOWS,
  type ConvertirObjetivoRequest,
} from '../../types/contexto.types';
import { cn } from '@/utils/cn';

// ============================================================================
// ZOD SCHEMA
// ============================================================================

const convertirObjetivoSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones'),
  name: z
    .string()
    .min(10, 'El nombre debe tener al menos 10 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  bsc_perspective: z.enum(['FINANCIERA', 'CLIENTES', 'PROCESOS', 'APRENDIZAJE']),
  target_value: z
    .number()
    .min(0, 'El valor meta debe ser positivo')
    .optional(),
  unit: z.string().max(20).optional(),
});

type ConvertirObjetivoFormData = z.infer<typeof convertirObjetivoSchema>;

// ============================================================================
// CONFIGURACIÓN BSC
// ============================================================================

const BSC_PERSPECTIVES = [
  {
    value: 'FINANCIERA',
    label: 'Perspectiva Financiera',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Resultados financieros y rentabilidad',
  },
  {
    value: 'CLIENTES',
    label: 'Perspectiva de Clientes',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Satisfacción y retención de clientes',
  },
  {
    value: 'PROCESOS',
    label: 'Perspectiva de Procesos Internos',
    icon: Cog,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Eficiencia operativa y calidad',
  },
  {
    value: 'APRENDIZAJE',
    label: 'Perspectiva de Aprendizaje y Crecimiento',
    icon: GraduationCap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Desarrollo de capacidades y cultura',
  },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Genera sugerencia de código basado en el tipo TOWS
 */
const generarCodigoSugerido = (tipo: string): string => {
  const prefijos = {
    fo: 'OE-FO', // Ofensiva
    fa: 'OE-FA', // Defensiva
    do: 'OE-DO', // Adaptativa
    da: 'OE-DA', // Supervivencia
  };
  const prefijo = prefijos[tipo as keyof typeof prefijos] || 'OE';
  const timestamp = Date.now().toString().slice(-4);
  return `${prefijo}-${timestamp}`;
};

// ============================================================================
// PROPS
// ============================================================================

interface ConvertirObjetivoModalProps {
  estrategia: EstrategiaTOWS | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ConvertirObjetivoModal = ({
  estrategia,
  isOpen,
  onClose,
  onSuccess,
}: ConvertirObjetivoModalProps) => {
  const convertirMutation = useConvertirEstrategiaObjetivo();
  const [codigoSugerido, setCodigoSugerido] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<ConvertirObjetivoFormData>({
    resolver: zodResolver(convertirObjetivoSchema),
    mode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
      bsc_perspective: 'PROCESOS',
      target_value: undefined,
      unit: '%',
    },
  });

  const selectedPerspective = watch('bsc_perspective');
  const currentCode = watch('code');
  const currentName = watch('name');

  // Efecto: Generar código sugerido y pre-llenar nombre
  useEffect(() => {
    if (estrategia && isOpen) {
      const codigo = generarCodigoSugerido(estrategia.tipo);
      setCodigoSugerido(codigo);
      setValue('code', codigo);
      setValue('name', estrategia.descripcion || '');
    }
  }, [estrategia, isOpen, setValue]);

  // Efecto: Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset();
      setCodigoSugerido('');
    }
  }, [isOpen, reset]);

  if (!estrategia) return null;

  const towsConfig = TIPO_ESTRATEGIA_TOWS_CONFIG[estrategia.tipo];
  const perspectiveConfig = BSC_PERSPECTIVES.find((p) => p.value === selectedPerspective);
  const PerspectiveIcon = perspectiveConfig?.icon || Target;

  const yaConvertida = !!estrategia.objetivo_estrategico;

  const onSubmit = (data: ConvertirObjetivoFormData) => {
    convertirMutation.mutate(
      {
        id: estrategia.id,
        data: data as ConvertirObjetivoRequest,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Convertir Estrategia en Objetivo Estratégico"
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Ya convertida - Alert */}
        {yaConvertida && (
          <Alert variant="info" icon={CheckCircle2}>
            <div>
              <p className="font-semibold">Esta estrategia ya fue convertida</p>
              <p className="text-sm mt-1">
                Objetivo: <span className="font-mono">{estrategia.objetivo_estrategico_code}</span> - {estrategia.objetivo_estrategico_name}
              </p>
            </div>
          </Alert>
        )}

        {/* Estrategia Origen */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Estrategia TOWS Origen
          </h3>
          <div className={cn('p-4 rounded-lg border-2', towsConfig.bgClass, towsConfig.borderClass)}>
            <div className="flex items-start justify-between mb-2">
              <Badge variant={towsConfig.color as any} size="lg">
                {towsConfig.label}
              </Badge>
              {estrategia.prioridad && (
                <Badge variant={estrategia.prioridad === 'alta' ? 'danger' : 'secondary'}>
                  {estrategia.prioridad_display}
                </Badge>
              )}
            </div>
            <p className={cn('font-medium mb-2', towsConfig.textClass)}>
              {estrategia.descripcion}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Objetivo esperado:</span> {estrategia.objetivo}
            </p>
            {estrategia.area_responsable && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-semibold">Área responsable:</span> {estrategia.area_responsable.nombre}
              </p>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Datos del Objetivo Estratégico BSC
          </h3>

          {/* Código */}
          <Input
            label="Código del Objetivo"
            placeholder="OE-FO-001"
            {...register('code')}
            error={errors.code?.message}
            disabled={yaConvertida}
            hint={codigoSugerido ? `Sugerido: ${codigoSugerido}` : undefined}
          />

          {/* Nombre */}
          <Textarea
            label="Nombre del Objetivo"
            placeholder="Descripción clara y concisa del objetivo estratégico..."
            {...register('name')}
            error={errors.name?.message}
            disabled={yaConvertida}
            rows={3}
          />

          {/* Perspectiva BSC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Perspectiva del Balanced Scorecard
            </label>
            <div className="grid grid-cols-2 gap-3">
              {BSC_PERSPECTIVES.map((perspective) => {
                const Icon = perspective.icon;
                const isSelected = selectedPerspective === perspective.value;
                return (
                  <Button
                    key={perspective.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue('bsc_perspective', perspective.value, { shouldValidate: true })}
                    disabled={yaConvertida}
                    className={cn(
                      '!p-3 !min-h-0 rounded-lg border-2 !justify-start text-left transition-all w-full',
                      isSelected
                        ? `${perspective.bgColor} ${perspective.color} border-current`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn('w-5 h-5 mt-0.5', isSelected ? perspective.color : 'text-gray-400')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-semibold text-sm', isSelected ? perspective.color : 'text-gray-700 dark:text-gray-300')}>
                          {perspective.label.replace('Perspectiva de ', '')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {perspective.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Valores Meta (Opcionales) */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor Meta (Opcional)"
              type="number"
              placeholder="100"
              {...register('target_value', { valueAsNumber: true })}
              error={errors.target_value?.message}
              disabled={yaConvertida}
            />
            <Input
              label="Unidad"
              placeholder="%"
              {...register('unit')}
              error={errors.unit?.message}
              disabled={yaConvertida}
            />
          </div>
        </div>

        {/* Preview del Objetivo */}
        {currentCode && currentName && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Vista Previa del Objetivo
            </h3>
            <div className={cn('p-4 rounded-lg border-2', perspectiveConfig?.bgClass, 'border-current')}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PerspectiveIcon className={cn('w-5 h-5', perspectiveConfig?.color)} />
                  <span className={cn('font-mono text-sm font-semibold', perspectiveConfig?.color)}>
                    {currentCode}
                  </span>
                </div>
                <Badge variant="secondary">{perspectiveConfig?.label}</Badge>
              </div>
              <p className={cn('font-medium', perspectiveConfig?.color)}>
                {currentName}
              </p>
              {watch('target_value') && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Meta: <span className="font-semibold">{watch('target_value')}{watch('unit')}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={convertirMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isValid || yaConvertida || convertirMutation.isPending}
            isLoading={convertirMutation.isPending}
          >
            <Target className="w-4 h-4 mr-2" />
            Convertir a Objetivo BSC
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
