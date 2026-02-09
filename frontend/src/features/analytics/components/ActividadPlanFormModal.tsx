/**
 * Modal para crear Actividad de Plan de Acción
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateActividadPlan } from '../hooks/useAnalytics';
import type { ActividadPlanKPI } from '../types';

interface ActividadPlanFormModalProps {
  item: ActividadPlanKPI | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  plan_accion: string;
  nombre: string;
  descripcion: string;
  responsable: string;
  fecha_inicio: string;
  fecha_fin: string;
  recursos_necesarios: string;
}

const INITIAL_FORM: FormData = {
  plan_accion: '',
  nombre: '',
  descripcion: '',
  responsable: '',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: '',
  recursos_necesarios: '',
};

export const ActividadPlanFormModal = ({ item, isOpen, onClose }: ActividadPlanFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createActividad = useCreateActividadPlan();

  useEffect(() => {
    if (isOpen && !item) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.plan_accion || !form.nombre || !form.responsable || !form.fecha_inicio || !form.fecha_fin) {
      return;
    }

    const payload = {
      plan_accion: parseInt(form.plan_accion),
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      responsable: parseInt(form.responsable),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      recursos_necesarios: form.recursos_necesarios || undefined,
    };

    createActividad.mutate(payload, { onSuccess: () => onClose() });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Actividad"
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

        <Input
          label="Nombre de la Actividad"
          type="text"
          value={form.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Ej: Capacitación en Prevención de Riesgos"
          required
        />

        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción de la actividad..."
          rows={3}
        />

        <Input
          label="Responsable ID"
          type="number"
          value={form.responsable}
          onChange={(e) => handleChange('responsable', e.target.value)}
          placeholder="ID del responsable"
          required
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
            label="Fecha Fin"
            type="date"
            value={form.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Recursos Necesarios"
          value={form.recursos_necesarios}
          onChange={(e) => handleChange('recursos_necesarios', e.target.value)}
          placeholder="Describa los recursos necesarios..."
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.plan_accion || !form.nombre || !form.responsable || !form.fecha_inicio || !form.fecha_fin || createActividad.isPending}
            isLoading={createActividad.isPending}
          >
            Crear Actividad
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
