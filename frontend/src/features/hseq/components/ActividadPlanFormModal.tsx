import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateActividadPlan, useUpdateActividadPlan } from '../hooks/usePlanificacion';
import type { ActividadPlan, CreateActividadPlanDTO } from '../hooks/usePlanificacion';

interface ActividadPlanFormModalProps {
  item: ActividadPlan | null;
  planId: number;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateActividadPlanDTO = {
  plan_trabajo: 0,
  nombre: '',
  descripcion: '',
  tipo_actividad: 'CAPACITACION',
  fecha_inicio_programada: '',
  fecha_fin_programada: '',
  responsable: 0,
  costo_estimado: undefined,
  prioridad: 'MEDIA',
};

const TIPO_ACTIVIDAD_OPCIONES = [
  { value: 'CAPACITACION', label: 'Capacitaci\u00f3n' },
  { value: 'INSPECCION', label: 'Inspecci\u00f3n' },
  { value: 'MEDICION', label: 'Medici\u00f3n' },
  { value: 'AUDITORIA', label: 'Auditor\u00eda' },
  { value: 'SIMULACRO', label: 'Simulacro' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'EVALUACION', label: 'Evaluaci\u00f3n' },
  { value: 'OTRO', label: 'Otro' },
];

const PRIORIDAD_OPCIONES = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Cr\u00edtica' },
];

export default function ActividadPlanFormModal({
  item,
  planId,
  isOpen,
  onClose,
}: ActividadPlanFormModalProps) {
  const [formData, setFormData] = useState<CreateActividadPlanDTO>(INITIAL_FORM);

  const createMutation = useCreateActividadPlan();
  const updateMutation = useUpdateActividadPlan();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        plan_trabajo: planId,
        nombre: item.nombre,
        descripcion: item.descripcion ?? '',
        tipo_actividad: item.tipo_actividad,
        fecha_inicio_programada: item.fecha_inicio_programada ?? '',
        fecha_fin_programada: item.fecha_fin_programada ?? '',
        responsable: item.responsable_detail?.id ?? 0,
        costo_estimado: item.costo_estimado ?? undefined,
        prioridad: item.prioridad ?? 'MEDIA',
      });
    } else {
      setFormData({ ...INITIAL_FORM, plan_trabajo: planId });
    }
  }, [item, isOpen, planId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    payload.plan_trabajo = planId;
    if (!payload.responsable) delete (payload as Partial<CreateActividadPlanDTO>).responsable;
    if (!payload.costo_estimado) delete (payload as Partial<CreateActividadPlanDTO>).costo_estimado;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateActividadPlanDTO, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateActividadPlanDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Actividad del Plan' : 'Nueva Actividad del Plan'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Tipo de Actividad | Prioridad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Actividad *"
            value={formData.tipo_actividad}
            onChange={(e) => handleChange('tipo_actividad', e.target.value)}
            required
          >
            {TIPO_ACTIVIDAD_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          <Select
            label="Prioridad *"
            value={formData.prioridad}
            onChange={(e) => handleChange('prioridad', e.target.value)}
            required
          >
            {PRIORIDAD_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 2: Nombre */}
        <div>
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre de la actividad..."
            required
          />
        </div>

        {/* Fila 3: Descripci\u00f3n */}
        <div>
          <Textarea
            label="Descripci\u00f3n"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Descripci\u00f3n detallada de la actividad..."
            rows={3}
          />
        </div>

        {/* Fila 4: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio Programada *"
            type="date"
            value={formData.fecha_inicio_programada}
            onChange={(e) => handleChange('fecha_inicio_programada', e.target.value)}
            required
          />

          <Input
            label="Fecha Fin Programada *"
            type="date"
            value={formData.fecha_fin_programada}
            onChange={(e) => handleChange('fecha_fin_programada', e.target.value)}
            required
          />
        </div>

        {/* Fila 5: Costo Estimado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Costo Estimado"
            type="number"
            value={formData.costo_estimado ?? ''}
            onChange={(e) =>
              handleChange(
                'costo_estimado',
                e.target.value !== '' ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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
              <>{item ? 'Actualizar' : 'Crear'} Actividad</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
