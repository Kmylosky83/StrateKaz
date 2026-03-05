/**
 * ObjetivoSistemaFormModal — Modal para crear/editar Objetivo del Sistema (BSC)
 * Planificación del Sistema - Gestión Estratégica
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common';
import { Input, Textarea, Select } from '@/components/forms';
import { useSelectUsers } from '@/hooks/useSelectLists';
import {
  useCreateObjetivoSistema,
  useUpdateObjetivoSistema,
  usePlanesTrabajoQuery,
} from '../../hooks/usePlanificacionSistema';
import type {
  ObjetivoSistema,
  CreateObjetivoSistemaDTO,
  PerspectivaBSC,
  TipoObjetivo,
  AreaAplicacion,
} from '../../types/planificacion-sistema.types';

interface ObjetivoSistemaFormModalProps {
  item: ObjetivoSistema | null;
  isOpen: boolean;
  onClose: () => void;
  defaultPlanId?: number;
}

interface FormData {
  plan_trabajo: number | '';
  codigo: string;
  nombre: string;
  descripcion: string;
  perspectiva_bsc: PerspectivaBSC | '';
  objetivo_bsc_id: string;
  tipo_objetivo: TipoObjetivo | '';
  area_aplicacion: AreaAplicacion | '';
  responsable: number | '';
  meta_descripcion: string;
  meta_cuantitativa: string;
  unidad_medida: string;
  indicador_nombre: string;
  formula_calculo: string;
  fecha_inicio: string;
  fecha_meta: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  plan_trabajo: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  perspectiva_bsc: '',
  objetivo_bsc_id: '',
  tipo_objetivo: '',
  area_aplicacion: '',
  responsable: '',
  meta_descripcion: '',
  meta_cuantitativa: '',
  unidad_medida: '',
  indicador_nombre: '',
  formula_calculo: '',
  fecha_inicio: '',
  fecha_meta: '',
  observaciones: '',
};

const PERSPECTIVA_OPTIONS: { value: PerspectivaBSC; label: string }[] = [
  { value: 'FINANCIERA', label: 'Financiera' },
  { value: 'CLIENTES', label: 'Clientes' },
  { value: 'PROCESOS', label: 'Procesos Internos' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje y Crecimiento' },
];

const TIPO_OBJETIVO_OPTIONS: { value: TipoObjetivo; label: string }[] = [
  { value: 'ESTRATEGICO', label: 'Estratégico' },
  { value: 'TACTICO', label: 'Táctico' },
  { value: 'OPERATIVO', label: 'Operativo' },
];

const AREA_APLICACION_OPTIONS: { value: AreaAplicacion; label: string }[] = [
  { value: 'SST', label: 'SST (Seguridad y Salud en el Trabajo)' },
  { value: 'CALIDAD', label: 'Calidad' },
  { value: 'AMBIENTAL', label: 'Ambiental' },
  { value: 'INTEGRAL', label: 'Integral (Todos los sistemas)' },
];

export function ObjetivoSistemaFormModal({
  item,
  isOpen,
  onClose,
  defaultPlanId,
}: ObjetivoSistemaFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: planesData } = usePlanesTrabajoQuery({ page_size: 100 });
  const { data: users = [], isLoading: loadingUsers } = useSelectUsers(isOpen);
  const createMutation = useCreateObjetivoSistema();
  const updateMutation = useUpdateObjetivoSistema();

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
        perspectiva_bsc: item.perspectiva_bsc ?? '',
        objetivo_bsc_id: item.objetivo_bsc_id ?? '',
        tipo_objetivo: item.tipo_objetivo ?? '',
        area_aplicacion: item.area_aplicacion ?? '',
        responsable: item.responsable ?? '',
        meta_descripcion: item.meta_descripcion ?? '',
        meta_cuantitativa: item.meta_cuantitativa ?? '',
        unidad_medida: item.unidad_medida ?? '',
        indicador_nombre: item.indicador_nombre ?? '',
        formula_calculo: item.formula_calculo ?? '',
        fecha_inicio: item.fecha_inicio ?? '',
        fecha_meta: item.fecha_meta ?? '',
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
    if (!formData.perspectiva_bsc) newErrors.perspectiva_bsc = 'La perspectiva BSC es requerida';
    if (!formData.tipo_objetivo) newErrors.tipo_objetivo = 'El tipo de objetivo es requerido';
    if (!formData.area_aplicacion) newErrors.area_aplicacion = 'El área de aplicación es requerida';
    if (!formData.responsable) newErrors.responsable = 'El responsable es requerido';
    if (!formData.meta_descripcion.trim()) newErrors.meta_descripcion = 'La meta es requerida';
    if (!formData.indicador_nombre.trim()) newErrors.indicador_nombre = 'El indicador es requerido';
    if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    if (!formData.fecha_meta) newErrors.fecha_meta = 'La fecha meta es requerida';
    if (
      formData.fecha_inicio &&
      formData.fecha_meta &&
      formData.fecha_meta <= formData.fecha_inicio
    ) {
      newErrors.fecha_meta = 'La fecha meta debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateObjetivoSistemaDTO = {
      plan_trabajo: Number(formData.plan_trabajo),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      perspectiva_bsc: formData.perspectiva_bsc as PerspectivaBSC,
      tipo_objetivo: formData.tipo_objetivo as TipoObjetivo,
      area_aplicacion: formData.area_aplicacion as AreaAplicacion,
      responsable: Number(formData.responsable),
      meta_descripcion: formData.meta_descripcion,
      indicador_nombre: formData.indicador_nombre,
      fecha_inicio: formData.fecha_inicio,
      fecha_meta: formData.fecha_meta,
      objetivo_bsc_id: formData.objetivo_bsc_id || undefined,
      meta_cuantitativa: formData.meta_cuantitativa
        ? Number(formData.meta_cuantitativa)
        : undefined,
      unidad_medida: formData.unidad_medida || undefined,
      formula_calculo: formData.formula_calculo || undefined,
      observaciones: formData.observaciones || undefined,
    };

    if (formData.codigo) {
      (payload as CreateObjetivoSistemaDTO & { codigo?: string }).codigo = formData.codigo;
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
        {item ? 'Actualizar' : 'Crear'} Objetivo
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Objetivo del Sistema' : 'Nuevo Objetivo del Sistema'}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan y clasificación */}
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

          <Input
            label="ID Objetivo BSC"
            value={formData.objetivo_bsc_id}
            onChange={(e) => handleChange('objetivo_bsc_id', e.target.value)}
            placeholder="OBJ-F-01"
            helperText="Opcional: referencia en el mapa estratégico"
          />

          <div className="md:col-span-2">
            <Input
              label="Nombre del Objetivo *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Aumentar satisfacción del cliente en un 15%"
              error={errors.nombre}
              required
            />
          </div>

          <Select
            label="Perspectiva BSC *"
            value={formData.perspectiva_bsc}
            onChange={(e) => handleChange('perspectiva_bsc', e.target.value as PerspectivaBSC | '')}
            options={PERSPECTIVA_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Seleccionar perspectiva"
            error={errors.perspectiva_bsc}
            required
          />

          <Select
            label="Tipo de Objetivo *"
            value={formData.tipo_objetivo}
            onChange={(e) => handleChange('tipo_objetivo', e.target.value as TipoObjetivo | '')}
            options={TIPO_OBJETIVO_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Seleccionar tipo"
            error={errors.tipo_objetivo}
            required
          />

          <Select
            label="Área de Aplicación *"
            value={formData.area_aplicacion}
            onChange={(e) => handleChange('area_aplicacion', e.target.value as AreaAplicacion | '')}
            options={AREA_APLICACION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Seleccionar área"
            error={errors.area_aplicacion}
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

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción detallada del objetivo..."
              rows={2}
            />
          </div>

          {/* Sección de meta e indicador */}
          <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Meta e Indicador
            </h4>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Descripción de la Meta *"
              value={formData.meta_descripcion}
              onChange={(e) => handleChange('meta_descripcion', e.target.value)}
              placeholder="Alcanzar un índice de satisfacción superior al 90%..."
              rows={2}
              error={errors.meta_descripcion}
            />
          </div>

          <Input
            label="Meta Cuantitativa"
            type="number"
            value={formData.meta_cuantitativa}
            onChange={(e) => handleChange('meta_cuantitativa', e.target.value)}
            placeholder="90"
          />

          <Input
            label="Unidad de Medida"
            value={formData.unidad_medida}
            onChange={(e) => handleChange('unidad_medida', e.target.value)}
            placeholder="%, puntaje, número..."
          />

          <Input
            label="Nombre del Indicador *"
            value={formData.indicador_nombre}
            onChange={(e) => handleChange('indicador_nombre', e.target.value)}
            placeholder="Índice de Satisfacción del Cliente"
            error={errors.indicador_nombre}
            required
          />

          <Input
            label="Fórmula de Cálculo"
            value={formData.formula_calculo}
            onChange={(e) => handleChange('formula_calculo', e.target.value)}
            placeholder="(Clientes satisfechos / Total clientes) × 100"
          />

          {/* Fechas */}
          <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Fechas</h4>
          </div>

          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            error={errors.fecha_inicio}
            required
          />

          <Input
            label="Fecha Meta *"
            type="date"
            value={formData.fecha_meta}
            onChange={(e) => handleChange('fecha_meta', e.target.value)}
            error={errors.fecha_meta}
            required
          />

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

export default ObjetivoSistemaFormModal;
