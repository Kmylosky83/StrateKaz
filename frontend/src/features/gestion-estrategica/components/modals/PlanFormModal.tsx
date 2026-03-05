/**
 * Modal para crear/editar Plan Estratégico
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Textarea para formulario
 * - Select para período
 * - Switch para estado activo
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { useCreatePlan, useUpdatePlan, usePeriodTypes } from '../../hooks/useStrategic';
import type {
  StrategicPlan,
  CreateStrategicPlanDTO,
  UpdateStrategicPlanDTO,
} from '../../types/strategic.types';

interface PlanFormModalProps {
  plan: StrategicPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlanFormModal = ({ plan, isOpen, onClose }: PlanFormModalProps) => {
  const isEditing = plan !== null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    period_type: 'ANNUAL' as const,
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const { data: periodTypes } = usePeriodTypes();

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        period_type: plan.period_type,
        start_date: plan.start_date,
        end_date: plan.end_date,
        is_active: plan.is_active,
      });
    } else {
      const today = new Date();
      const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      setFormData({
        name: '',
        description: '',
        period_type: 'ANNUAL',
        start_date: today.toISOString().split('T')[0],
        end_date: nextYear.toISOString().split('T')[0],
        is_active: true,
      });
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && plan) {
      const updateData: UpdateStrategicPlanDTO = {
        name: formData.name,
        description: formData.description || undefined,
        period_type: formData.period_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
      };
      await updateMutation.mutateAsync({ id: plan.id, data: updateData });
    } else {
      const createData: CreateStrategicPlanDTO = {
        name: formData.name,
        description: formData.description || undefined,
        period_type: formData.period_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const periodOptions = periodTypes?.map((t) => ({ value: t.value, label: t.label })) || [
    { value: 'ANNUAL', label: 'Anual' },
    { value: 'BIENNIAL', label: 'Bienal (2 años)' },
    { value: 'TRIENNIAL', label: 'Trienal (3 años)' },
    { value: 'QUADRENNIAL', label: 'Cuatrienal (4 años)' },
    { value: 'QUINQUENNIAL', label: 'Quinquenal (5 años)' },
  ];

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.name || !formData.start_date || !formData.end_date}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Plan'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plan Estratégico' : 'Nuevo Plan Estratégico'}
      subtitle="Define el marco temporal y alcance del plan estratégico"
      size="xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del Plan *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Plan Estratégico 2024-2028"
          required
        />

        <Textarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describa los objetivos generales del plan..."
          rows={3}
        />

        <Select
          label="Tipo de Período *"
          value={formData.period_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              period_type: e.target.value as CreateStrategicPlanDTO['period_type'],
            })
          }
          options={periodOptions}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
          <Input
            label="Fecha de Fin *"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>

        {isEditing && (
          <Switch
            label="Plan Activo"
            checked={formData.is_active}
            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            description="Solo puede haber un plan activo a la vez"
          />
        )}
      </form>
    </BaseModal>
  );
};
