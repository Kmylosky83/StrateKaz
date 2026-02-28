import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreatePrograma, useUpdatePrograma } from '../hooks/usePlanificacion';
import type { ProgramaGestion, CreateProgramaGestionDTO } from '../hooks/usePlanificacion';

interface ProgramaGestionFormModalProps {
  item: ProgramaGestion | null;
  planId: number;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateProgramaGestionDTO = {
  plan_trabajo: 0,
  nombre: '',
  descripcion: '',
  tipo_programa: 'CAPACITACION',
  objetivo_principal: '',
  alcance: '',
  responsable: 0,
  fecha_inicio: '',
  fecha_fin: '',
  presupuesto: undefined,
};

const TIPO_PROGRAMA_OPTIONS = [
  { value: 'CAPACITACION', label: 'Capacitaci\u00f3n' },
  { value: 'PREVENCION_RIESGOS', label: 'Prevenci\u00f3n de Riesgos' },
  { value: 'VIGILANCIA_SALUD', label: 'Vigilancia de la Salud' },
  { value: 'GESTION_AMBIENTAL', label: 'Gesti\u00f3n Ambiental' },
  { value: 'MEJORA_CONTINUA', label: 'Mejora Continua' },
  { value: 'OTRO', label: 'Otro' },
];

export default function ProgramaGestionFormModal({
  item,
  planId,
  isOpen,
  onClose,
}: ProgramaGestionFormModalProps) {
  const [formData, setFormData] = useState<CreateProgramaGestionDTO>(INITIAL_FORM);

  const createMutation = useCreatePrograma();
  const updateMutation = useUpdatePrograma();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        plan_trabajo: item.plan_trabajo,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        tipo_programa: item.tipo_programa,
        objetivo_principal: item.objetivo_principal || '',
        alcance: item.alcance || '',
        responsable: item.responsable || 0,
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        presupuesto: item.presupuesto,
      });
    } else {
      setFormData({ ...INITIAL_FORM, plan_trabajo: planId });
    }
  }, [item, isOpen, planId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData, plan_trabajo: planId };

    // Clean FK fields with value 0
    if (!payload.responsable) delete (payload as any).responsable;

    // Clean optional fields
    if (!payload.presupuesto) delete (payload as any).presupuesto;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateProgramaGestionDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Programa de Gesti\u00f3n' : 'Nuevo Programa de Gesti\u00f3n'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Programa *"
            value={formData.tipo_programa}
            onChange={(e) => handleChange('tipo_programa', e.target.value)}
            options={TIPO_PROGRAMA_OPTIONS}
            required
          />

          <Input
            label="Presupuesto"
            type="number"
            value={formData.presupuesto ?? ''}
            onChange={(e) =>
              handleChange('presupuesto', e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="Presupuesto asignado"
          />

          <div className="md:col-span-2">
            <Input
              label="Nombre del Programa *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre del programa de gesti\u00f3n"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Descripci\u00f3n"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describa el programa..."
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Objetivo Principal *"
              value={formData.objetivo_principal}
              onChange={(e) => handleChange('objetivo_principal', e.target.value)}
              placeholder="Objetivo principal del programa..."
              rows={2}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Alcance *"
              value={formData.alcance}
              onChange={(e) => handleChange('alcance', e.target.value)}
              placeholder="Alcance y cobertura del programa..."
              rows={2}
              required
            />
          </div>

          <Input
            label="Fecha Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          <Input
            label="Fecha Fin *"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            required
          />
        </div>

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
              <>{item ? 'Actualizar' : 'Crear'} Programa</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
