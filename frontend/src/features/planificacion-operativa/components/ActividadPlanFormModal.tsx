/**
 * ActividadPlanFormModal — Modal para crear/editar Actividad del Plan de Trabajo
 * Planificación del Sistema - Gestión Estratégica
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common';
import { Input, Textarea, Select } from '@/components/forms';
import { useSelectUsers } from '@/hooks/useSelectLists';
import {
  useCreateActividadPlan,
  useUpdateActividadPlan,
  usePlanesTrabajoQuery,
} from '../hooks/usePlanificacionSistema';
import type {
  ActividadPlan,
  CreateActividadPlanDTO,
  TipoActividad,
} from '../types/planificacion-sistema.types';

interface ActividadPlanFormModalProps {
  item: ActividadPlan | null;
  isOpen: boolean;
  onClose: () => void;
  /** Preseleccionar un plan cuando se abre desde la vista de planes */
  defaultPlanId?: number;
}

interface FormData {
  plan_trabajo: number | '';
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_actividad: TipoActividad | '';
  area_responsable: string;
  fecha_programada_inicio: string;
  fecha_programada_fin: string;
  responsable: number | '';
  recursos_necesarios: string;
  presupuesto_estimado: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  plan_trabajo: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_actividad: '',
  area_responsable: '',
  fecha_programada_inicio: '',
  fecha_programada_fin: '',
  responsable: '',
  recursos_necesarios: '',
  presupuesto_estimado: '',
  observaciones: '',
};

const TIPO_ACTIVIDAD_OPTIONS: { value: TipoActividad; label: string }[] = [
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'INSPECCION', label: 'Inspección' },
  { value: 'AUDITORIA', label: 'Auditoría' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'SIMULACRO', label: 'Simulacro' },
  { value: 'REVISION', label: 'Revisión' },
  { value: 'EVALUACION', label: 'Evaluación' },
  { value: 'ACTUALIZACION', label: 'Actualización' },
  { value: 'MEJORA', label: 'Mejora' },
  { value: 'OTRA', label: 'Otra' },
];

export function ActividadPlanFormModal({
  item,
  isOpen,
  onClose,
  defaultPlanId,
}: ActividadPlanFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: planesData } = usePlanesTrabajoQuery({ page_size: 100 });
  const { data: users = [], isLoading: loadingUsers } = useSelectUsers(isOpen);
  const createMutation = useCreateActividadPlan();
  const updateMutation = useUpdateActividadPlan();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const planes = planesData?.results ?? [];
  const planOptions = planes.map((p) => ({
    value: String(p.id),
    label: `${p.codigo} — ${p.nombre} (${p.periodo})`,
  }));
  const userOptions = users.map((u) => ({ value: String(u.id), label: u.label }));

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      setFormData({
        plan_trabajo: item.plan_trabajo ?? '',
        codigo: item.codigo ?? '',
        nombre: item.nombre ?? '',
        descripcion: item.descripcion ?? '',
        tipo_actividad: item.tipo_actividad ?? '',
        area_responsable: item.area_responsable ?? '',
        fecha_programada_inicio: item.fecha_programada_inicio ?? '',
        fecha_programada_fin: item.fecha_programada_fin ?? '',
        responsable: item.responsable ?? '',
        recursos_necesarios: item.recursos_necesarios ?? '',
        presupuesto_estimado: item.presupuesto_estimado ?? '',
        observaciones: item.observaciones ?? '',
      });
    } else {
      setFormData({
        ...INITIAL_FORM,
        plan_trabajo: defaultPlanId ?? '',
      });
    }
    setErrors({});
  }, [item, isOpen, defaultPlanId]);

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.plan_trabajo) newErrors.plan_trabajo = 'El plan de trabajo es requerido';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.tipo_actividad) newErrors.tipo_actividad = 'El tipo de actividad es requerido';
    if (!formData.area_responsable.trim()) newErrors.area_responsable = 'El área es requerida';
    if (!formData.fecha_programada_inicio)
      newErrors.fecha_programada_inicio = 'La fecha de inicio es requerida';
    if (!formData.fecha_programada_fin)
      newErrors.fecha_programada_fin = 'La fecha de fin es requerida';
    if (
      formData.fecha_programada_inicio &&
      formData.fecha_programada_fin &&
      formData.fecha_programada_fin <= formData.fecha_programada_inicio
    ) {
      newErrors.fecha_programada_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    if (!formData.responsable) newErrors.responsable = 'El responsable es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateActividadPlanDTO = {
      plan_trabajo: Number(formData.plan_trabajo),
      nombre: formData.nombre,
      tipo_actividad: formData.tipo_actividad as TipoActividad,
      area_responsable: formData.area_responsable,
      fecha_programada_inicio: formData.fecha_programada_inicio,
      fecha_programada_fin: formData.fecha_programada_fin,
      responsable: Number(formData.responsable),
      descripcion: formData.descripcion || undefined,
      recursos_necesarios: formData.recursos_necesarios || undefined,
      presupuesto_estimado: formData.presupuesto_estimado
        ? Number(formData.presupuesto_estimado)
        : undefined,
      observaciones: formData.observaciones || undefined,
    };

    if (formData.codigo) {
      (payload as CreateActividadPlanDTO & { codigo?: string }).codigo = formData.codigo;
    }

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

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
        {item ? 'Actualizar' : 'Crear'} Actividad
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Actividad del Plan' : 'Nueva Actividad del Plan'}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Select
              label="Plan de Trabajo *"
              value={formData.plan_trabajo !== '' ? String(formData.plan_trabajo) : ''}
              onChange={(e) =>
                handleChange('plan_trabajo', e.target.value ? Number(e.target.value) : '')
              }
              options={planOptions}
              placeholder="Seleccionar plan de trabajo"
              error={errors.plan_trabajo}
              required
            />
          </div>

          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente"
          />

          <Select
            label="Tipo de Actividad *"
            value={formData.tipo_actividad}
            onChange={(e) => handleChange('tipo_actividad', e.target.value as TipoActividad | '')}
            options={TIPO_ACTIVIDAD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Seleccionar tipo"
            error={errors.tipo_actividad}
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Nombre de la Actividad *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Capacitación en norma ISO 45001"
              error={errors.nombre}
              required
            />
          </div>

          <Input
            label="Área Responsable *"
            value={formData.area_responsable}
            onChange={(e) => handleChange('area_responsable', e.target.value)}
            placeholder="HSEQ, Producción, Calidad..."
            error={errors.area_responsable}
            required
          />

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

          <Input
            label="Fecha Programada Inicio *"
            type="date"
            value={formData.fecha_programada_inicio}
            onChange={(e) => handleChange('fecha_programada_inicio', e.target.value)}
            error={errors.fecha_programada_inicio}
            required
          />

          <Input
            label="Fecha Programada Fin *"
            type="date"
            value={formData.fecha_programada_fin}
            onChange={(e) => handleChange('fecha_programada_fin', e.target.value)}
            error={errors.fecha_programada_fin}
            required
          />

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describa el objetivo y alcance de la actividad..."
              rows={3}
            />
          </div>

          <Input
            label="Presupuesto Estimado (COP)"
            type="number"
            value={formData.presupuesto_estimado}
            onChange={(e) => handleChange('presupuesto_estimado', e.target.value)}
            placeholder="0"
            min={0}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Recursos Necesarios"
              value={formData.recursos_necesarios}
              onChange={(e) => handleChange('recursos_necesarios', e.target.value)}
              placeholder="Personal, equipos, materiales requeridos..."
              rows={2}
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
      </form>
    </BaseModal>
  );
}

export default ActividadPlanFormModal;
