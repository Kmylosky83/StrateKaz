/**
 * Modal para crear/editar Relación Causa-Efecto en el Mapa Estratégico
 *
 * Formulario para establecer relaciones entre objetivos estratégicos:
 * - Selección de objetivo origen y destino
 * - Descripción de la relación
 * - Peso de la relación (1-100)
 * - Vista previa visual de la conexión
 *
 * Usa Design System sin colores hardcoded
 */
import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Trash2, AlertTriangle } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import {
  useCreateRelacion,
  useUpdateRelacion,
  useDeleteRelacion,
} from '../../hooks/useMapaEstrategico';
import type {
  CausaEfecto,
  MapaObjetivo,
  CreateCausaEfectoDTO,
  UpdateCausaEfectoDTO,
} from '../../types/mapa-estrategico.types';
import { BSC_PERSPECTIVE_CONFIG } from '../../types/mapa-estrategico.types';
import { useConfirm } from '@/components/modals';

// =============================================================================
// INTERFACES
// =============================================================================

interface CausaEfectoFormModalProps {
  relacion: CausaEfecto | null; // null = crear, objeto = editar
  mapaId: number;
  objetivos: MapaObjetivo[];
  sourceObjectiveId?: number; // Pre-selección del origen (si viene de handle)
  targetObjectiveId?: number; // Pre-selección del destino (si viene de handle)
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  source_objective: number;
  target_objective: number;
  description: string;
  weight: number;
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Obtiene el color del peso según el nivel
 */
const getWeightColor = (weight: number): { bg: string; text: string; label: string } => {
  if (weight >= 67) {
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      label: 'Alta',
    };
  }
  if (weight >= 34) {
    return {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      label: 'Media',
    };
  }
  return {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    label: 'Baja',
  };
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const CausaEfectoFormModal = ({
  relacion,
  mapaId,
  objetivos,
  sourceObjectiveId,
  targetObjectiveId,
  isOpen,
  onClose,
}: CausaEfectoFormModalProps) => {
  const isEditing = relacion !== null;
  const { confirm } = useConfirm();

  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    source_objective: sourceObjectiveId || 0,
    target_objective: targetObjectiveId || 0,
    description: '',
    weight: 50,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Mutations
  const createMutation = useCreateRelacion();
  const updateMutation = useUpdateRelacion();
  const deleteMutation = useDeleteRelacion();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && relacion) {
      setFormData({
        source_objective: relacion.source_objective,
        target_objective: relacion.target_objective,
        description: relacion.description || '',
        weight: relacion.weight,
      });
    } else if (!isEditing) {
      setFormData({
        source_objective: sourceObjectiveId || 0,
        target_objective: targetObjectiveId || 0,
        description: '',
        weight: 50,
      });
    }
    setErrors({});
  }, [relacion, isEditing, sourceObjectiveId, targetObjectiveId, isOpen]);

  // =============================================================================
  // OPCIONES DE SELECT
  // =============================================================================

  // Agrupar objetivos por perspectiva BSC
  const objetivosPorPerspectiva = useMemo(() => {
    const groups: Record<string, MapaObjetivo[]> = {};

    objetivos.forEach((obj) => {
      if (!groups[obj.bsc_perspective]) {
        groups[obj.bsc_perspective] = [];
      }
      groups[obj.bsc_perspective].push(obj);
    });

    return groups;
  }, [objetivos]);

  // Opciones para select de origen
  const sourceOptions = useMemo(() => {
    const options: { value: string | number; label: string }[] = [
      { value: '', label: '-- Seleccionar objetivo origen --' },
    ];

    // Agrupar por perspectiva (simulando optgroup con prefijos)
    Object.entries(objetivosPorPerspectiva)
      .sort(([a], [b]) => BSC_PERSPECTIVE_CONFIG[a as keyof typeof BSC_PERSPECTIVE_CONFIG].order - BSC_PERSPECTIVE_CONFIG[b as keyof typeof BSC_PERSPECTIVE_CONFIG].order)
      .forEach(([perspectiva, objs]) => {
        const config = BSC_PERSPECTIVE_CONFIG[perspectiva as keyof typeof BSC_PERSPECTIVE_CONFIG];
        // Añadir header de grupo (disabled)
        options.push({
          value: `group-${perspectiva}`,
          label: `──── ${config.shortLabel} ────`,
        });
        // Añadir objetivos
        objs.forEach((obj) => {
          options.push({
            value: obj.id,
            label: `  ${obj.code} - ${obj.name}`,
          });
        });
      });

    return options;
  }, [objetivosPorPerspectiva]);

  // Opciones para select de destino (filtrar origen seleccionado)
  const targetOptions = useMemo(() => {
    const options: { value: string | number; label: string }[] = [
      { value: '', label: '-- Seleccionar objetivo destino --' },
    ];

    Object.entries(objetivosPorPerspectiva)
      .sort(([a], [b]) => BSC_PERSPECTIVE_CONFIG[a as keyof typeof BSC_PERSPECTIVE_CONFIG].order - BSC_PERSPECTIVE_CONFIG[b as keyof typeof BSC_PERSPECTIVE_CONFIG].order)
      .forEach(([perspectiva, objs]) => {
        const config = BSC_PERSPECTIVE_CONFIG[perspectiva as keyof typeof BSC_PERSPECTIVE_CONFIG];
        // Filtrar el objetivo origen
        const filteredObjs = objs.filter((obj) => obj.id !== formData.source_objective);

        if (filteredObjs.length > 0) {
          options.push({
            value: `group-${perspectiva}`,
            label: `──── ${config.shortLabel} ────`,
          });
          filteredObjs.forEach((obj) => {
            options.push({
              value: obj.id,
              label: `  ${obj.code} - ${obj.name}`,
            });
          });
        }
      });

    return options;
  }, [objetivosPorPerspectiva, formData.source_objective]);

  // =============================================================================
  // OBJETIVOS SELECCIONADOS
  // =============================================================================

  const selectedSource = useMemo(
    () => objetivos.find((obj) => obj.id === formData.source_objective),
    [objetivos, formData.source_objective]
  );

  const selectedTarget = useMemo(
    () => objetivos.find((obj) => obj.id === formData.target_objective),
    [objetivos, formData.target_objective]
  );

  // =============================================================================
  // VALIDACIÓN
  // =============================================================================

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.source_objective || formData.source_objective === 0) {
      newErrors.source_objective = 'Selecciona el objetivo origen';
    }

    if (!formData.target_objective || formData.target_objective === 0) {
      newErrors.target_objective = 'Selecciona el objetivo destino';
    }

    if (formData.source_objective === formData.target_objective && formData.source_objective !== 0) {
      newErrors.target_objective = 'El objetivo destino debe ser diferente al origen';
    }

    if (formData.weight < 1 || formData.weight > 100) {
      newErrors.weight = 'El peso debe estar entre 1 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (isEditing && relacion) {
      const updateData: UpdateCausaEfectoDTO = {
        description: formData.description || undefined,
        weight: formData.weight,
      };
      await updateMutation.mutateAsync({ id: relacion.id, data: updateData });
    } else {
      const createData: CreateCausaEfectoDTO = {
        mapa: mapaId,
        source_objective: formData.source_objective,
        target_objective: formData.target_objective,
        description: formData.description || undefined,
        weight: formData.weight,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!relacion) return;

    const confirmed = await confirm({
      title: 'Eliminar Relación',
      message: '¿Estás seguro de eliminar esta relación causa-efecto?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      await deleteMutation.mutateAsync({ id: relacion.id, mapaId: relacion.mapa });
      onClose();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const weightColor = getWeightColor(formData.weight);

  // =============================================================================
  // FOOTER
  // =============================================================================

  const footer = (
    <>
      {isEditing && (
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={isLoading}
          isLoading={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      )}
      <div className="flex-1" />
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Relación'}
      </Button>
    </>
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Relación Causa-Efecto' : 'Nueva Relación Causa-Efecto'}
      subtitle="Define cómo un objetivo contribuye al logro de otro"
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de objetivos */}
        <div className="grid grid-cols-1 gap-4">
          {/* Objetivo Origen */}
          <Select
            label="Objetivo Origen (Causa) *"
            value={formData.source_objective}
            onChange={(e) => {
              const value = e.target.value;
              // Filtrar opciones de grupo (disabled)
              if (!value.toString().startsWith('group-')) {
                setFormData({
                  ...formData,
                  source_objective: value ? parseInt(value.toString()) : 0,
                });
                setErrors({ ...errors, source_objective: undefined });
              }
            }}
            options={sourceOptions}
            disabled={isEditing || !!sourceObjectiveId}
            error={errors.source_objective}
            helperText={
              sourceObjectiveId
                ? 'Preseleccionado desde el mapa'
                : 'El objetivo que causa o influye en otro'
            }
          />

          {/* Objetivo Destino */}
          <Select
            label="Objetivo Destino (Efecto) *"
            value={formData.target_objective}
            onChange={(e) => {
              const value = e.target.value;
              if (!value.toString().startsWith('group-')) {
                setFormData({
                  ...formData,
                  target_objective: value ? parseInt(value.toString()) : 0,
                });
                setErrors({ ...errors, target_objective: undefined });
              }
            }}
            options={targetOptions}
            disabled={isEditing || !!targetObjectiveId}
            error={errors.target_objective}
            helperText={
              targetObjectiveId
                ? 'Preseleccionado desde el mapa'
                : 'El objetivo que se ve afectado o beneficiado'
            }
          />
        </div>

        {/* Vista previa de la relación */}
        {selectedSource && selectedTarget && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Vista Previa de la Relación
            </h4>

            <div className="flex items-center gap-3">
              {/* Origen */}
              <div className="flex-1 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={BSC_PERSPECTIVE_CONFIG[selectedSource.bsc_perspective].textColor}
                  >
                    {BSC_PERSPECTIVE_CONFIG[selectedSource.bsc_perspective].shortLabel}
                  </Badge>
                  <span className="text-xs font-mono text-gray-500">{selectedSource.code}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {selectedSource.name}
                </p>
              </div>

              {/* Flecha */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="h-6 w-6 text-primary-500" />
                <span className="text-xs text-gray-500">contribuye a</span>
              </div>

              {/* Destino */}
              <div className="flex-1 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={BSC_PERSPECTIVE_CONFIG[selectedTarget.bsc_perspective].textColor}
                  >
                    {BSC_PERSPECTIVE_CONFIG[selectedTarget.bsc_perspective].shortLabel}
                  </Badge>
                  <span className="text-xs font-mono text-gray-500">{selectedTarget.code}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {selectedTarget.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Advertencia si son de la misma perspectiva */}
        {selectedSource &&
          selectedTarget &&
          selectedSource.bsc_perspective === selectedTarget.bsc_perspective && (
            <Alert
              variant="warning"
              message="Ambos objetivos pertenecen a la misma perspectiva BSC. Verifica que esta relación sea correcta."
              icon={AlertTriangle}
            />
          )}

        {/* Descripción */}
        <Textarea
          label="Descripción de la Relación"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe cómo el objetivo origen contribuye al logro del objetivo destino..."
          rows={3}
          helperText={`${formData.description.length}/500 caracteres`}
        />

        {/* Peso de la relación */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Peso de la Relación (%)
          </label>

          <div className="flex items-center gap-4">
            {/* Slider */}
            <input
              type="range"
              min="1"
              max="100"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
            />

            {/* Valor con badge */}
            <div
              className={`px-3 py-1.5 rounded-lg font-semibold min-w-[100px] text-center ${weightColor.bg} ${weightColor.text}`}
            >
              {formData.weight}% - {weightColor.label}
            </div>
          </div>

          {/* Barra de progreso visual */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                formData.weight >= 67
                  ? 'bg-green-500'
                  : formData.weight >= 34
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${formData.weight}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Indica qué tan importante es esta relación: Baja (1-33), Media (34-66), Alta (67-100)
          </p>

          {errors.weight && (
            <p className="text-sm text-danger-600 dark:text-danger-400">{errors.weight}</p>
          )}
        </div>
      </form>
    </BaseModal>
  );
};

export default CausaEfectoFormModal;
