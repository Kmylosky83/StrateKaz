/**
 * Modal para crear/editar Plan de Acción KPI
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreatePlanAccionKPI, useUpdatePlanAccionKPI } from '../hooks/useAnalytics';
import type { PlanAccionKPI, PrioridadPlan } from '../types';

interface PlanAccionFormModalProps {
  item: PlanAccionKPI | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  kpi: string;
  titulo: string;
  descripcion: string;
  justificacion: string;
  prioridad: PrioridadPlan;
  fecha_inicio: string;
  fecha_fin_prevista: string;
  responsable: string;
  presupuesto_estimado: string;
  resultado_esperado: string;
}

const INITIAL_FORM: FormData = {
  kpi: '',
  titulo: '',
  descripcion: '',
  justificacion: '',
  prioridad: 'media',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin_prevista: '',
  responsable: '',
  presupuesto_estimado: '',
  resultado_esperado: '',
};

export const PlanAccionFormModal = ({ item, isOpen, onClose }: PlanAccionFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createPlan = useCreatePlanAccionKPI();
  const updatePlan = useUpdatePlanAccionKPI();

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        kpi: item.kpi.toString(),
        titulo: item.titulo,
        descripcion: item.descripcion,
        justificacion: item.justificacion || '',
        prioridad: item.prioridad,
        fecha_inicio: item.fecha_inicio,
        fecha_fin_prevista: item.fecha_fin_prevista,
        responsable: item.responsable.toString(),
        presupuesto_estimado: item.presupuesto_estimado?.toString() || '',
        resultado_esperado: item.resultado_esperado,
      });
    } else if (isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.kpi || !form.titulo || !form.descripcion || !form.responsable || !form.resultado_esperado) {
      return;
    }

    const payload = {
      kpi: parseInt(form.kpi),
      titulo: form.titulo,
      descripcion: form.descripcion,
      justificacion: form.justificacion || undefined,
      prioridad: form.prioridad,
      fecha_inicio: form.fecha_inicio,
      fecha_fin_prevista: form.fecha_fin_prevista,
      responsable: parseInt(form.responsable),
      presupuesto_estimado: form.presupuesto_estimado ? parseFloat(form.presupuesto_estimado) : undefined,
      resultado_esperado: form.resultado_esperado,
    };

    if (item) {
      updatePlan.mutate(
        { id: item.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createPlan.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const isLoading = createPlan.isPending || updatePlan.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Plan de Acción' : 'Nuevo Plan de Acción'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="KPI ID"
            type="number"
            value={form.kpi}
            onChange={(e) => handleChange('kpi', e.target.value)}
            placeholder="ID del KPI"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prioridad <span className="text-red-500">*</span>
            </label>
            <select
              value={form.prioridad}
              onChange={(e) => handleChange('prioridad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>

        <Input
          label="Título del Plan"
          type="text"
          value={form.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Ej: Reducir Accidentalidad en Área de Producción"
          required
        />

        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción detallada del plan de acción..."
          rows={3}
          required
        />

        <Textarea
          label="Justificación"
          value={form.justificacion}
          onChange={(e) => handleChange('justificacion', e.target.value)}
          placeholder="Justificación del plan de acción..."
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />
          <Input
            label="Fecha Fin Prevista"
            type="date"
            value={form.fecha_fin_prevista}
            onChange={(e) => handleChange('fecha_fin_prevista', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Responsable ID"
            type="number"
            value={form.responsable}
            onChange={(e) => handleChange('responsable', e.target.value)}
            placeholder="ID del responsable"
            required
          />
          <Input
            label="Presupuesto Estimado"
            type="number"
            step="0.01"
            value={form.presupuesto_estimado}
            onChange={(e) => handleChange('presupuesto_estimado', e.target.value)}
            placeholder="Ej: 15000000"
          />
        </div>

        <Textarea
          label="Resultado Esperado"
          value={form.resultado_esperado}
          onChange={(e) => handleChange('resultado_esperado', e.target.value)}
          placeholder="Describa el resultado esperado del plan..."
          rows={3}
          required
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.kpi || !form.titulo || !form.descripcion || !form.responsable || !form.resultado_esperado || isLoading}
            isLoading={isLoading}
          >
            {item ? 'Actualizar Plan' : 'Crear Plan'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
