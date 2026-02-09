/**
 * Modal para crear/editar Meta de KPI
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useCreateMetaKPI, useUpdateMetaKPI } from '../hooks/useAnalytics';
import type { MetaKPI, CatalogoKPI } from '../types';

interface MetaKPIFormModalProps {
  item: MetaKPI | null;
  kpis: CatalogoKPI[];
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  kpi: string;
  periodo: string;
  meta_minima: string;
  meta_esperada: string;
  meta_optima: string;
  valor_base: string;
  justificacion: string;
}

const INITIAL_FORM: FormData = {
  kpi: '',
  periodo: new Date().toISOString().slice(0, 7),
  meta_minima: '',
  meta_esperada: '',
  meta_optima: '',
  valor_base: '',
  justificacion: '',
};

export const MetaKPIFormModal = ({
  item,
  kpis,
  isOpen,
  onClose,
}: MetaKPIFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createMeta = useCreateMetaKPI();
  const updateMeta = useUpdateMetaKPI();

  const isEditing = !!item;

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        kpi: String(item.kpi),
        periodo: item.periodo,
        meta_minima: String(item.meta_minima),
        meta_esperada: String(item.meta_esperada),
        meta_optima: String(item.meta_optima),
        valor_base: item.valor_base ? String(item.valor_base) : '',
        justificacion: item.justificacion || '',
      });
    } else if (isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.kpi || !form.periodo || !form.meta_minima || !form.meta_esperada || !form.meta_optima) {
      return;
    }

    const payload = {
      kpi: parseInt(form.kpi),
      periodo: form.periodo,
      meta_minima: parseFloat(form.meta_minima),
      meta_esperada: parseFloat(form.meta_esperada),
      meta_optima: parseFloat(form.meta_optima),
      valor_base: form.valor_base ? parseFloat(form.valor_base) : undefined,
      justificacion: form.justificacion || undefined,
    };

    if (isEditing) {
      updateMeta.mutate(
        { id: item.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createMeta.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const isPending = createMeta.isPending || updateMeta.isPending;
  const isValid =
    form.kpi &&
    form.periodo &&
    form.meta_minima &&
    form.meta_esperada &&
    form.meta_optima;

  const kpiOptions = kpis.map((kpi) => ({
    value: String(kpi.id),
    label: `${kpi.codigo} - ${kpi.nombre}`,
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Meta KPI' : 'Nueva Meta KPI'}
      size="md"
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

        <Input
          label="Periodo"
          type="month"
          value={form.periodo}
          onChange={(e) => handleChange('periodo', e.target.value)}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Meta Mínima"
            type="number"
            step="any"
            value={form.meta_minima}
            onChange={(e) => handleChange('meta_minima', e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Meta Esperada"
            type="number"
            step="any"
            value={form.meta_esperada}
            onChange={(e) => handleChange('meta_esperada', e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Meta Óptima"
            type="number"
            step="any"
            value={form.meta_optima}
            onChange={(e) => handleChange('meta_optima', e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <Input
          label="Valor Base (Opcional)"
          type="number"
          step="any"
          value={form.valor_base}
          onChange={(e) => handleChange('valor_base', e.target.value)}
          placeholder="Valor inicial de referencia"
        />

        <Textarea
          label="Justificación"
          value={form.justificacion}
          onChange={(e) => handleChange('justificacion', e.target.value)}
          placeholder="Justificación de las metas establecidas..."
          rows={3}
        />

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
            {isEditing ? 'Actualizar' : 'Crear'} Meta
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
