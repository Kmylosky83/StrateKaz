/**
 * PlanTrabajoFormModal — Modal para crear/editar Plan de Trabajo Anual
 * Planificación del Sistema - Gestión Estratégica
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Textarea, Select } from '@/components/forms';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { useCreatePlanTrabajo, useUpdatePlanTrabajo } from '../../hooks/usePlanificacionSistema';
import type {
  PlanTrabajoAnual,
  CreatePlanTrabajoAnualDTO,
} from '../../types/planificacion-sistema.types';

interface PlanTrabajoFormModalProps {
  item: PlanTrabajoAnual | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  periodo: number;
  responsable: number | '';
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  codigo: '',
  nombre: '',
  periodo: new Date().getFullYear(),
  responsable: '',
  fecha_inicio: '',
  fecha_fin: '',
  descripcion: '',
  observaciones: '',
};

export function PlanTrabajoFormModal({ item, isOpen, onClose }: PlanTrabajoFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: users = [], isLoading: loadingUsers } = useSelectUsers(isOpen);
  const createMutation = useCreatePlanTrabajo();
  const updateMutation = useUpdatePlanTrabajo();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      setFormData({
        codigo: item.codigo ?? '',
        nombre: item.nombre ?? '',
        periodo: item.periodo ?? new Date().getFullYear(),
        responsable: item.responsable ?? '',
        fecha_inicio: item.fecha_inicio ?? '',
        fecha_fin: item.fecha_fin ?? '',
        descripcion: item.descripcion ?? '',
        observaciones: item.observaciones ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setErrors({});
  }, [item, isOpen]);

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.periodo || formData.periodo < 2020 || formData.periodo > 2050) {
      newErrors.periodo = 'El período debe estar entre 2020 y 2050';
    }
    if (!formData.responsable) newErrors.responsable = 'El responsable es requerido';
    if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    if (!formData.fecha_fin) newErrors.fecha_fin = 'La fecha de fin es requerida';
    if (
      formData.fecha_inicio &&
      formData.fecha_fin &&
      formData.fecha_fin <= formData.fecha_inicio
    ) {
      newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreatePlanTrabajoAnualDTO = {
      codigo: formData.codigo || undefined!,
      nombre: formData.nombre,
      periodo: Number(formData.periodo),
      responsable: Number(formData.responsable),
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      descripcion: formData.descripcion || undefined,
      observaciones: formData.observaciones || undefined,
    };

    if (!payload.codigo) {
      delete (payload as Partial<CreatePlanTrabajoAnualDTO>).codigo;
    }

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const userOptions = users.map((u) => ({ value: String(u.id), label: u.label }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Plan de Trabajo' : 'Nuevo Plan de Trabajo Anual'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente"
            helperText="Opcional: se asigna automáticamente si se deja vacío"
          />

          <Input
            label="Período (Año) *"
            type="number"
            value={formData.periodo}
            onChange={(e) =>
              handleChange('periodo', parseInt(e.target.value) || new Date().getFullYear())
            }
            min={2020}
            max={2050}
            error={errors.periodo}
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Nombre del Plan *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Plan de Trabajo Anual 2026"
              error={errors.nombre}
              required
            />
          </div>

          <Select
            label="Responsable *"
            value={formData.responsable !== '' ? String(formData.responsable) : ''}
            onChange={(e) =>
              handleChange('responsable', e.target.value ? Number(e.target.value) : '')
            }
            options={userOptions}
            placeholder={loadingUsers ? 'Cargando usuarios...' : 'Seleccionar responsable'}
            error={errors.responsable}
            required
          />

          <div />

          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            error={errors.fecha_inicio}
            required
          />

          <Input
            label="Fecha de Fin *"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            error={errors.fecha_fin}
            required
          />

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describa el propósito y alcance del plan de trabajo..."
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{item ? 'Actualizar' : 'Crear'} Plan</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PlanTrabajoFormModal;
