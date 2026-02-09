/**
 * Modal para registrar Seguimiento de Plan de Acción
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateSeguimientoPlan } from '../hooks/useAnalytics';
import type { SeguimientoPlanKPI } from '../types';

interface SeguimientoFormModalProps {
  item: SeguimientoPlanKPI | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  plan_accion: string;
  porcentaje_avance_general: string;
  avances_logrados: string;
  dificultades_encontradas: string;
  acciones_correctivas: string;
  valor_kpi_actual: string;
  cumple_cronograma: boolean;
  proximas_acciones: string;
}

const INITIAL_FORM: FormData = {
  plan_accion: '',
  porcentaje_avance_general: '0',
  avances_logrados: '',
  dificultades_encontradas: '',
  acciones_correctivas: '',
  valor_kpi_actual: '',
  cumple_cronograma: true,
  proximas_acciones: '',
};

export const SeguimientoFormModal = ({ item, isOpen, onClose }: SeguimientoFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createSeguimiento = useCreateSeguimientoPlan();

  useEffect(() => {
    if (isOpen && !item) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.plan_accion || !form.avances_logrados) {
      return;
    }

    const payload = {
      plan_accion: parseInt(form.plan_accion),
      porcentaje_avance_general: parseFloat(form.porcentaje_avance_general),
      avances_logrados: form.avances_logrados,
      dificultades_encontradas: form.dificultades_encontradas || undefined,
      acciones_correctivas: form.acciones_correctivas || undefined,
      valor_kpi_actual: form.valor_kpi_actual ? parseFloat(form.valor_kpi_actual) : undefined,
      cumple_cronograma: form.cumple_cronograma,
      proximas_acciones: form.proximas_acciones || undefined,
    };

    createSeguimiento.mutate(payload, { onSuccess: () => onClose() });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Seguimiento"
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Plan de Acción ID"
          type="number"
          value={form.plan_accion}
          onChange={(e) => handleChange('plan_accion', e.target.value)}
          placeholder="ID del plan de acción"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Porcentaje de Avance General (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={form.porcentaje_avance_general}
            onChange={(e) => handleChange('porcentaje_avance_general', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="text-lg font-bold text-primary-600">{form.porcentaje_avance_general}%</span>
            <span>100%</span>
          </div>
        </div>

        <Textarea
          label="Avances Logrados"
          value={form.avances_logrados}
          onChange={(e) => handleChange('avances_logrados', e.target.value)}
          placeholder="Describa los avances logrados..."
          rows={3}
          required
        />

        <Textarea
          label="Dificultades Encontradas"
          value={form.dificultades_encontradas}
          onChange={(e) => handleChange('dificultades_encontradas', e.target.value)}
          placeholder="Describa las dificultades encontradas..."
          rows={2}
        />

        <Textarea
          label="Acciones Correctivas"
          value={form.acciones_correctivas}
          onChange={(e) => handleChange('acciones_correctivas', e.target.value)}
          placeholder="Describa las acciones correctivas aplicadas..."
          rows={2}
        />

        <Input
          label="Valor KPI Actual"
          type="number"
          step="any"
          value={form.valor_kpi_actual}
          onChange={(e) => handleChange('valor_kpi_actual', e.target.value)}
          placeholder="Ej: 2.6"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="cumple_cronograma"
            checked={form.cumple_cronograma}
            onChange={(e) => handleChange('cumple_cronograma', e.target.checked)}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="cumple_cronograma" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Cumple Cronograma
          </label>
        </div>

        <Textarea
          label="Próximas Acciones"
          value={form.proximas_acciones}
          onChange={(e) => handleChange('proximas_acciones', e.target.value)}
          placeholder="Describa las próximas acciones a realizar..."
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.plan_accion || !form.avances_logrados || createSeguimiento.isPending}
            isLoading={createSeguimiento.isPending}
          >
            Registrar Seguimiento
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
