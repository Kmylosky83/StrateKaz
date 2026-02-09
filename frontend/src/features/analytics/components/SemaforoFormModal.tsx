/**
 * Modal para crear/editar Configuración de Semáforo
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useCreateSemaforo, useUpdateSemaforo } from '../hooks/useAnalytics';
import type { ConfiguracionSemaforo, CatalogoKPI } from '../types';

interface SemaforoFormModalProps {
  item: ConfiguracionSemaforo | null;
  kpis: CatalogoKPI[];
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  kpi: string;
  umbral_rojo_min: string;
  umbral_rojo_max: string;
  umbral_amarillo_min: string;
  umbral_amarillo_max: string;
  umbral_verde_min: string;
  umbral_verde_max: string;
  logica_inversa: boolean;
  descripcion_rojo: string;
  descripcion_amarillo: string;
  descripcion_verde: string;
}

const INITIAL_FORM: FormData = {
  kpi: '',
  umbral_rojo_min: '',
  umbral_rojo_max: '',
  umbral_amarillo_min: '',
  umbral_amarillo_max: '',
  umbral_verde_min: '',
  umbral_verde_max: '',
  logica_inversa: false,
  descripcion_rojo: '',
  descripcion_amarillo: '',
  descripcion_verde: '',
};

export const SemaforoFormModal = ({
  item,
  kpis,
  isOpen,
  onClose,
}: SemaforoFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createSemaforo = useCreateSemaforo();
  const updateSemaforo = useUpdateSemaforo();

  const isEditing = !!item;

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        kpi: String(item.kpi),
        umbral_rojo_min: item.umbral_rojo_min ? String(item.umbral_rojo_min) : '',
        umbral_rojo_max: item.umbral_rojo_max ? String(item.umbral_rojo_max) : '',
        umbral_amarillo_min: item.umbral_amarillo_min ? String(item.umbral_amarillo_min) : '',
        umbral_amarillo_max: item.umbral_amarillo_max ? String(item.umbral_amarillo_max) : '',
        umbral_verde_min: item.umbral_verde_min ? String(item.umbral_verde_min) : '',
        umbral_verde_max: item.umbral_verde_max ? String(item.umbral_verde_max) : '',
        logica_inversa: item.logica_inversa,
        descripcion_rojo: item.descripcion_rojo || '',
        descripcion_amarillo: item.descripcion_amarillo || '',
        descripcion_verde: item.descripcion_verde || '',
      });
    } else if (isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.kpi) return;

    const payload = {
      kpi: parseInt(form.kpi),
      umbral_rojo_min: form.umbral_rojo_min ? parseFloat(form.umbral_rojo_min) : undefined,
      umbral_rojo_max: form.umbral_rojo_max ? parseFloat(form.umbral_rojo_max) : undefined,
      umbral_amarillo_min: form.umbral_amarillo_min ? parseFloat(form.umbral_amarillo_min) : undefined,
      umbral_amarillo_max: form.umbral_amarillo_max ? parseFloat(form.umbral_amarillo_max) : undefined,
      umbral_verde_min: form.umbral_verde_min ? parseFloat(form.umbral_verde_min) : undefined,
      umbral_verde_max: form.umbral_verde_max ? parseFloat(form.umbral_verde_max) : undefined,
      logica_inversa: form.logica_inversa,
      descripcion_rojo: form.descripcion_rojo || undefined,
      descripcion_amarillo: form.descripcion_amarillo || undefined,
      descripcion_verde: form.descripcion_verde || undefined,
    };

    if (isEditing) {
      updateSemaforo.mutate(
        { id: item.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createSemaforo.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const isPending = createSemaforo.isPending || updateSemaforo.isPending;
  const isValid = form.kpi;

  const kpiOptions = kpis.map((kpi) => ({
    value: String(kpi.id),
    label: `${kpi.codigo} - ${kpi.nombre}`,
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Semáforo' : 'Nuevo Semáforo'}
      size="lg"
    >
      <div className="space-y-4">
        <Select
          label="KPI"
          value={form.kpi}
          onChange={(e) => handleChange('kpi', e.target.value)}
          options={kpiOptions}
          required
          disabled={isEditing}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.logica_inversa}
            onChange={(e) => handleChange('logica_inversa', e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Lógica Inversa (menor es mejor)
          </span>
        </label>

        {/* Verde */}
        <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h4 className="font-medium text-gray-900 dark:text-white">Verde - Óptimo</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mínimo"
              type="number"
              step="any"
              value={form.umbral_verde_min}
              onChange={(e) => handleChange('umbral_verde_min', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Máximo"
              type="number"
              step="any"
              value={form.umbral_verde_max}
              onChange={(e) => handleChange('umbral_verde_max', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Input
            label="Descripción"
            value={form.descripcion_verde}
            onChange={(e) => handleChange('descripcion_verde', e.target.value)}
            placeholder="Ej: Meta cumplida"
          />
        </div>

        {/* Amarillo */}
        <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <h4 className="font-medium text-gray-900 dark:text-white">Amarillo - Alerta</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mínimo"
              type="number"
              step="any"
              value={form.umbral_amarillo_min}
              onChange={(e) => handleChange('umbral_amarillo_min', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Máximo"
              type="number"
              step="any"
              value={form.umbral_amarillo_max}
              onChange={(e) => handleChange('umbral_amarillo_max', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Input
            label="Descripción"
            value={form.descripcion_amarillo}
            onChange={(e) => handleChange('descripcion_amarillo', e.target.value)}
            placeholder="Ej: Requiere atención"
          />
        </div>

        {/* Rojo */}
        <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <h4 className="font-medium text-gray-900 dark:text-white">Rojo - Crítico</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mínimo"
              type="number"
              step="any"
              value={form.umbral_rojo_min}
              onChange={(e) => handleChange('umbral_rojo_min', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Máximo"
              type="number"
              step="any"
              value={form.umbral_rojo_max}
              onChange={(e) => handleChange('umbral_rojo_max', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Input
            label="Descripción"
            value={form.descripcion_rojo}
            onChange={(e) => handleChange('descripcion_rojo', e.target.value)}
            placeholder="Ej: Acción inmediata requerida"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            isLoading={isPending}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Semáforo
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
