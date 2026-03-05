/**
 * Modal para agregar medición a un KPI
 * Sistema de Gestión StrateKaz - Sprint 4
 */
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Card, Badge, Alert } from '@/components/common';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateMeasurement } from '../../hooks/useKPIs';
import type { KPIObjetivo } from '../../types/kpi.types';
import { SEMAFORO_CONFIG, getProgressColor } from '../../types/kpi.types';
import { TrendingUp, AlertTriangle, XCircle, HelpCircle, Upload } from 'lucide-react';

interface KPIMeasurementFormModalProps {
  kpi: KPIObjetivo;
  isOpen: boolean;
  onClose: () => void;
}

const measurementSchema = z.object({
  period: z.string().min(1, 'La fecha es requerida'),
  value: z.number({ invalid_type_error: 'El valor debe ser un número' }),
  notes: z.string().optional(),
});

export function KPIMeasurementFormModal({ kpi, isOpen, onClose }: KPIMeasurementFormModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    period: new Date().toISOString().split('T')[0],
    value: 0,
    notes: '',
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const createMutation = useCreateMeasurement();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        period: new Date().toISOString().split('T')[0],
        value: kpi.last_value || 0,
        notes: '',
      });
      setEvidenceFile(null);
      setErrors({});
    }
  }, [isOpen, kpi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      measurementSchema.parse(formData);

      await createMutation.mutateAsync({
        kpi: kpi.id,
        period: formData.period,
        value: formData.value,
        notes: formData.notes || undefined,
        evidence_file: evidenceFile || undefined,
      });

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

  // Calcular el semáforo resultante según el valor ingresado
  const calculateStatus = (value: number): 'VERDE' | 'AMARILLO' | 'ROJO' | 'SIN_DATOS' => {
    if (kpi.trend_type === 'MAYOR_MEJOR') {
      if (value >= kpi.target_value) return 'VERDE';
      if (value >= kpi.warning_threshold) return 'AMARILLO';
      return 'ROJO';
    } else if (kpi.trend_type === 'MENOR_MEJOR') {
      if (value <= kpi.target_value) return 'VERDE';
      if (value <= kpi.warning_threshold) return 'AMARILLO';
      return 'ROJO';
    } else {
      // EN_RANGO
      const min = kpi.min_value || 0;
      const max = kpi.max_value || 100;
      if (value >= min && value <= max) return 'VERDE';
      if (value >= kpi.critical_threshold && value <= kpi.warning_threshold) return 'AMARILLO';
      return 'ROJO';
    }
  };

  const previewStatus = calculateStatus(formData.value);
  const previewConfig = SEMAFORO_CONFIG[previewStatus];
  const progressColor = getProgressColor(previewStatus);

  const SemaforoIcon =
    previewStatus === 'VERDE'
      ? TrendingUp
      : previewStatus === 'AMARILLO'
        ? AlertTriangle
        : previewStatus === 'ROJO'
          ? XCircle
          : HelpCircle;

  const isLoading = createMutation.isPending;

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
        Guardar Medición
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nueva Medición - ${kpi.name}`}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del KPI */}
        <Alert variant="info">
          <div className="text-sm">
            <p>
              <strong>Meta:</strong> {kpi.target_value} {kpi.unit}
            </p>
            <p>
              <strong>Fórmula:</strong> {kpi.formula}
            </p>
          </div>
        </Alert>

        {/* Formulario */}
        <div className="space-y-4">
          <Input
            type="date"
            label="Período *"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            error={errors.period}
          />

          <Input
            type="number"
            step="0.01"
            label={`Valor (${kpi.unit}) *`}
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            error={errors.value}
          />

          <Textarea
            label="Notas"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Observaciones sobre esta medición..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evidencia (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Seleccionar archivo</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                />
              </label>
              {evidenceFile && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {evidenceFile.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preview del Resultado */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Vista Previa del Resultado
          </h3>

          <Card className={`p-4 border-l-4 ${previewConfig.color}`}>
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${previewConfig.bgColor}`}>
                <SemaforoIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">
                  {formData.value.toFixed(2)} {kpi.unit}
                </div>
                <div className="text-sm text-muted-foreground">
                  Meta: {kpi.target_value} {kpi.unit}
                </div>
              </div>
              <Badge variant="secondary" className={previewConfig.textColor}>
                {previewConfig.label}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-300`}
                  style={{
                    width: `${Math.min((formData.value / kpi.target_value) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {previewStatus === 'ROJO' && (
            <Alert variant="danger">
              Esta medición está en estado crítico. Se recomienda tomar acciones correctivas.
            </Alert>
          )}

          {previewStatus === 'AMARILLO' && (
            <Alert variant="warning">
              Esta medición requiere atención. Está por debajo del umbral de alerta.
            </Alert>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
