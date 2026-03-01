/**
 * ProgramaGestionFormModal — Modal para crear/editar Programa de Gestión
 * Planificación del Sistema - Gestión Estratégica
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Textarea, Select } from '@/components/forms';
import { useSelectUsers } from '@/hooks/useSelectLists';
import {
  useCreateProgramaGestion,
  useUpdateProgramaGestion,
  usePlanesTrabajoQuery,
} from '../../hooks/usePlanificacionSistema';
import type {
  ProgramaGestion,
  CreateProgramaGestionDTO,
  TipoPrograma,
} from '../../types/planificacion-sistema.types';

interface ProgramaGestionFormModalProps {
  item: ProgramaGestion | null;
  isOpen: boolean;
  onClose: () => void;
  defaultPlanId?: number;
}

interface FormData {
  plan_trabajo: number | '';
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoPrograma | '';
  alcance: string;
  objetivos: string;
  responsable: number | '';
  fecha_inicio: string;
  fecha_fin: string;
  recursos_asignados: string;
  presupuesto: string;
  indicadores_medicion: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  plan_trabajo: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_programa: '',
  alcance: '',
  objetivos: '',
  responsable: '',
  fecha_inicio: '',
  fecha_fin: '',
  recursos_asignados: '',
  presupuesto: '',
  indicadores_medicion: '',
  observaciones: '',
};

const TIPO_PROGRAMA_OPTIONS: { value: TipoPrograma; label: string }[] = [
  { value: 'PVE', label: 'Programa de Vigilancia Epidemiológica (PVE)' },
  { value: 'CAPACITACION', label: 'Capacitación y Formación' },
  { value: 'INSPECCIONES', label: 'Inspecciones de Seguridad' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento Preventivo' },
  { value: 'AMBIENTAL', label: 'Gestión Ambiental' },
  { value: 'RESIDUOS', label: 'Gestión de Residuos' },
  { value: 'EMERGENCIAS', label: 'Gestión de Emergencias' },
  { value: 'MEDICINA', label: 'Medicina del Trabajo' },
  { value: 'HIGIENE', label: 'Higiene Industrial' },
  { value: 'SEGURIDAD', label: 'Seguridad Industrial' },
  { value: 'OTRO', label: 'Otro' },
];

export function ProgramaGestionFormModal({
  item,
  isOpen,
  onClose,
  defaultPlanId,
}: ProgramaGestionFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: planesData } = usePlanesTrabajoQuery({ page_size: 100 });
  const { data: users = [], isLoading: loadingUsers } = useSelectUsers(isOpen);
  const createMutation = useCreateProgramaGestion();
  const updateMutation = useUpdateProgramaGestion();

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
        tipo_programa: item.tipo_programa ?? '',
        alcance: item.alcance ?? '',
        objetivos: item.objetivos ?? '',
        responsable: item.responsable ?? '',
        fecha_inicio: item.fecha_inicio ?? '',
        fecha_fin: item.fecha_fin ?? '',
        recursos_asignados: item.recursos_asignados ?? '',
        presupuesto: item.presupuesto ?? '',
        indicadores_medicion: item.indicadores_medicion ?? '',
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
    if (!formData.tipo_programa) newErrors.tipo_programa = 'El tipo de programa es requerido';
    if (!formData.alcance.trim()) newErrors.alcance = 'El alcance es requerido';
    if (!formData.objetivos.trim()) newErrors.objetivos = 'Los objetivos son requeridos';
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

    const payload: CreateProgramaGestionDTO = {
      plan_trabajo: Number(formData.plan_trabajo),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      tipo_programa: formData.tipo_programa as TipoPrograma,
      alcance: formData.alcance,
      objetivos: formData.objetivos,
      responsable: Number(formData.responsable),
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      recursos_asignados: formData.recursos_asignados || undefined,
      presupuesto: formData.presupuesto ? Number(formData.presupuesto) : undefined,
      indicadores_medicion: formData.indicadores_medicion || undefined,
      observaciones: formData.observaciones || undefined,
    };

    if (formData.codigo) {
      (payload as CreateProgramaGestionDTO & { codigo?: string }).codigo = formData.codigo;
    }

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Programa de Gestión' : 'Nuevo Programa de Gestión'}
      size="large"
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
            label="Tipo de Programa *"
            value={formData.tipo_programa}
            onChange={(e) => handleChange('tipo_programa', e.target.value as TipoPrograma | '')}
            options={TIPO_PROGRAMA_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Seleccionar tipo"
            error={errors.tipo_programa}
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Nombre del Programa *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Programa de Prevención de Riesgos Ergonómicos 2026"
              error={errors.nombre}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción general del programa..."
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Alcance *"
              value={formData.alcance}
              onChange={(e) => handleChange('alcance', e.target.value)}
              placeholder="Aplica a todos los trabajadores en cargos con exposición a carga física..."
              rows={2}
              error={errors.alcance}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Objetivos del Programa *"
              value={formData.objetivos}
              onChange={(e) => handleChange('objetivos', e.target.value)}
              placeholder="Reducir la incidencia de desórdenes musculoesqueléticos en un 20%..."
              rows={3}
              error={errors.objetivos}
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

          <Input
            label="Presupuesto (COP)"
            type="number"
            value={formData.presupuesto}
            onChange={(e) => handleChange('presupuesto', e.target.value)}
            placeholder="0"
            min={0}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Recursos Asignados"
              value={formData.recursos_asignados}
              onChange={(e) => handleChange('recursos_asignados', e.target.value)}
              placeholder="Personal, equipos, instalaciones, materiales..."
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Indicadores de Medición"
              value={formData.indicadores_medicion}
              onChange={(e) => handleChange('indicadores_medicion', e.target.value)}
              placeholder="% cumplimiento actividades, tasa de incidencia, número de casos..."
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
              <>{item ? 'Actualizar' : 'Crear'} Programa</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProgramaGestionFormModal;
