/**
 * Modal para crear/editar KPI
 * Sistema de Gestión StrateKaz - Sprint 4
 */
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Alert, Card, Badge } from '@/components/common';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useCreateKPI, useUpdateKPI } from '../../hooks/useKPIs';
import type { KPIObjetivo } from '../../types/kpi.types';
import {
  FREQUENCY_CONFIG,
  TREND_TYPE_CONFIG,
  UNIT_OPTIONS,
  SEMAFORO_CONFIG,
} from '../../types/kpi.types';
import { TrendingUp, AlertTriangle, XCircle } from 'lucide-react';

interface KPIFormModalProps {
  kpi: KPIObjetivo | null;
  objectiveId: number;
  isOpen: boolean;
  onClose: () => void;
}

// Schema de validación
const kpiSchema = z
  .object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    formula: z.string().min(1, 'La fórmula es requerida'),
    unit: z.string().min(1, 'La unidad es requerida'),
    frequency: z.string().min(1, 'La frecuencia es requerida'),
    trend_type: z.string().min(1, 'El tipo de tendencia es requerido'),
    target_value: z.number().positive('Debe ser mayor a 0'),
    warning_threshold: z.number(),
    critical_threshold: z.number(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
  })
  .refine(
    (data) => {
      // Validar umbrales según tipo de tendencia
      if (data.trend_type === 'MAYOR_MEJOR') {
        return (
          data.warning_threshold < data.target_value &&
          data.critical_threshold < data.warning_threshold
        );
      } else if (data.trend_type === 'MENOR_MEJOR') {
        return (
          data.warning_threshold > data.target_value &&
          data.critical_threshold > data.warning_threshold
        );
      }
      return true;
    },
    {
      message: 'Los umbrales no son válidos para el tipo de tendencia seleccionado',
      path: ['warning_threshold'],
    }
  );

export function KPIFormModal({ kpi, objectiveId, isOpen, onClose }: KPIFormModalProps) {
  const isEditing = kpi !== null;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formula: '',
    unit: '%',
    frequency: 'MENSUAL',
    trend_type: 'MAYOR_MEJOR',
    target_value: 100,
    warning_threshold: 80,
    critical_threshold: 60,
    min_value: undefined as number | undefined,
    max_value: undefined as number | undefined,
    data_source: '',
    responsible: undefined as number | undefined,
    responsible_cargo: undefined as number | undefined,
  });

  const createMutation = useCreateKPI();
  const updateMutation = useUpdateKPI();

  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name,
        description: kpi.description || '',
        formula: kpi.formula,
        unit: kpi.unit,
        frequency: kpi.frequency,
        trend_type: kpi.trend_type,
        target_value: kpi.target_value,
        warning_threshold: kpi.warning_threshold,
        critical_threshold: kpi.critical_threshold,
        min_value: kpi.min_value || undefined,
        max_value: kpi.max_value || undefined,
        data_source: kpi.data_source || '',
        responsible: kpi.responsible || undefined,
        responsible_cargo: kpi.responsible_cargo || undefined,
      });
    }
    setErrors({});
  }, [kpi, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validar con Zod
      kpiSchema.parse(formData);

      const dataToSubmit = {
        ...formData,
        objective: objectiveId,
        description: formData.description || undefined,
        data_source: formData.data_source || undefined,
      };

      if (isEditing && kpi) {
        await updateMutation.mutateAsync({ id: kpi.id, data: dataToSubmit });
      } else {
        await createMutation.mutateAsync(dataToSubmit);
      }

      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const isEnRango = formData.trend_type === 'EN_RANGO';
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isEditing ? 'Actualizar KPI' : 'Crear KPI'}
      </Button>
    </>
  );

  // Preview de semáforo simulado
  const previewValue = formData.target_value * 0.85; // 85% de la meta
  const previewStatus =
    previewValue >= formData.warning_threshold
      ? 'VERDE'
      : previewValue >= formData.critical_threshold
        ? 'AMARILLO'
        : 'ROJO';
  const previewConfig = SEMAFORO_CONFIG[previewStatus];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar KPI' : 'Nuevo KPI'}
      size="xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Información General
          </h3>

          <Input
            label="Nombre del KPI *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="Ej: Índice de Satisfacción del Cliente"
          />

          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Descripción breve del KPI"
          />

          <Textarea
            label="Fórmula *"
            value={formData.formula}
            onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
            error={errors.formula}
            rows={2}
            placeholder="Ej: (Clientes Satisfechos / Total Clientes) * 100"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Unidad *"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              error={errors.unit}
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              label="Frecuencia *"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              error={errors.frequency}
            >
              {Object.entries(FREQUENCY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Configuración de Tendencia */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Tipo de Medición
          </h3>

          <Select
            label="Tipo de Tendencia *"
            value={formData.trend_type}
            onChange={(e) => setFormData({ ...formData, trend_type: e.target.value })}
            error={errors.trend_type}
          >
            {Object.entries(TREND_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label} - {config.description}
              </option>
            ))}
          </Select>

          {errors.warning_threshold && <Alert variant="error" message={errors.warning_threshold} />}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Valor Meta *"
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
              error={errors.target_value}
            />

            <Input
              type="number"
              label="Umbral de Alerta *"
              value={formData.warning_threshold}
              onChange={(e) =>
                setFormData({ ...formData, warning_threshold: Number(e.target.value) })
              }
            />

            <Input
              type="number"
              label="Umbral Crítico *"
              value={formData.critical_threshold}
              onChange={(e) =>
                setFormData({ ...formData, critical_threshold: Number(e.target.value) })
              }
            />
          </div>

          {isEnRango && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Valor Mínimo"
                value={formData.min_value || ''}
                onChange={(e) =>
                  setFormData({ ...formData, min_value: Number(e.target.value) || undefined })
                }
              />

              <Input
                type="number"
                label="Valor Máximo"
                value={formData.max_value || ''}
                onChange={(e) =>
                  setFormData({ ...formData, max_value: Number(e.target.value) || undefined })
                }
              />
            </div>
          )}

          <Input
            label="Fuente de Datos"
            value={formData.data_source}
            onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
            placeholder="Ej: Sistema CRM, Encuestas trimestrales"
          />
        </div>

        {/* Preview del Semáforo */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Vista Previa del Semáforo
          </h3>

          <Card className={`p-4 border-l-4 ${previewConfig.color}`}>
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${previewConfig.bgColor}`}>
                {previewStatus === 'VERDE' && <TrendingUp className="h-6 w-6 text-white" />}
                {previewStatus === 'AMARILLO' && <AlertTriangle className="h-6 w-6 text-white" />}
                {previewStatus === 'ROJO' && <XCircle className="h-6 w-6 text-white" />}
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">
                  {previewValue.toFixed(2)} {formData.unit}
                </div>
                <div className="text-sm text-muted-foreground">
                  Meta: {formData.target_value} {formData.unit}
                </div>
              </div>
              <Badge variant="secondary" className={previewConfig.textColor}>
                {previewConfig.label}
              </Badge>
            </div>
          </Card>
        </div>
      </form>
    </BaseModal>
  );
}
