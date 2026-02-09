/**
 * Modal para registrar un nuevo valor de KPI
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateValorKPI } from '../hooks/useAnalytics';
import type { CatalogoKPI } from '../types';

interface ValorKPIFormModalProps {
  kpi: CatalogoKPI | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  fecha_medicion: string;
  periodo: string;
  valor_numerico: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  fecha_medicion: new Date().toISOString().split('T')[0],
  periodo: new Date().toISOString().slice(0, 7),
  valor_numerico: '',
  observaciones: '',
};

export const ValorKPIFormModal = ({ kpi, isOpen, onClose }: ValorKPIFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createValor = useCreateValorKPI();

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!kpi || !form.valor_numerico) return;

    createValor.mutate(
      {
        kpi: kpi.id,
        fecha_medicion: form.fecha_medicion,
        periodo: form.periodo,
        valor_numerico: parseFloat(form.valor_numerico),
        observaciones: form.observaciones || undefined,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  if (!kpi) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Valor - ${kpi.nombre}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{kpi.codigo}</span> - {kpi.nombre}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Unidad: {kpi.unidad_medida} | Frecuencia: {kpi.frecuencia_medicion}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Medición"
            type="date"
            value={form.fecha_medicion}
            onChange={(e) => handleChange('fecha_medicion', e.target.value)}
            required
          />
          <Input
            label="Periodo"
            type="month"
            value={form.periodo}
            onChange={(e) => handleChange('periodo', e.target.value)}
            required
          />
        </div>

        <Input
          label={`Valor (${kpi.unidad_medida})`}
          type="number"
          step="any"
          value={form.valor_numerico}
          onChange={(e) => handleChange('valor_numerico', e.target.value)}
          placeholder={`Ej: 85.5`}
          required
        />

        <Textarea
          label="Observaciones"
          value={form.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Notas sobre la medición..."
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.valor_numerico || createValor.isPending}
            isLoading={createValor.isPending}
          >
            Registrar Valor
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
