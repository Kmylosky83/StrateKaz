import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { useCreateIncidenteTrabajo, useUpdateIncidenteTrabajo } from '../hooks/useAccidentalidad';
import type { IncidenteTrabajo, CreateIncidenteTrabajoDTO } from '../types/accidentalidad.types';

interface IncidenteTrabajoFormModalProps {
  item: IncidenteTrabajo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateIncidenteTrabajoDTO = {
  fecha_evento: '',
  hora_evento: '',
  lugar_evento: '',
  tipo_incidente: 'CASI_ACCIDENTE',
  descripcion_evento: '',
  potencial_gravedad: 'BAJO',
  consecuencias_potenciales: '',
  personas_involucradas: '',
  hubo_danos_materiales: false,
  descripcion_danos: '',
  costo_estimado: undefined,
  requiere_investigacion: false,
};

const TIPO_INCIDENTE_OPTIONS = [
  { value: 'CASI_ACCIDENTE', label: 'Casi Accidente' },
  { value: 'CONDICION_INSEGURA', label: 'Condición Insegura' },
  { value: 'ACTO_INSEGURO', label: 'Acto Inseguro' },
  { value: 'EMERGENCIA_CONTROLADA', label: 'Emergencia Controlada' },
  { value: 'OTRO', label: 'Otro' },
];

const POTENCIAL_GRAVEDAD_OPTIONS = [
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'CRITICO', label: 'Crítico' },
];

export default function IncidenteTrabajoFormModal({
  item,
  isOpen,
  onClose,
}: IncidenteTrabajoFormModalProps) {
  const [formData, setFormData] = useState<CreateIncidenteTrabajoDTO>(INITIAL_FORM);

  const createMutation = useCreateIncidenteTrabajo();
  const updateMutation = useUpdateIncidenteTrabajo();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        fecha_evento: item.fecha_evento || '',
        hora_evento: item.hora_evento || '',
        lugar_evento: item.lugar_evento || '',
        tipo_incidente: item.tipo_incidente || 'CASI_ACCIDENTE',
        descripcion_evento: item.descripcion_evento || '',
        potencial_gravedad: item.potencial_gravedad || 'BAJO',
        consecuencias_potenciales: item.consecuencias_potenciales || '',
        personas_involucradas: item.personas_involucradas || '',
        hubo_danos_materiales: item.hubo_danos_materiales ?? false,
        descripcion_danos: item.descripcion_danos || '',
        costo_estimado: item.costo_estimado ?? undefined,
        requiere_investigacion: item.requiere_investigacion ?? false,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    if (!payload.hora_evento) delete payload.hora_evento;
    if (!payload.consecuencias_potenciales) delete payload.consecuencias_potenciales;
    if (!payload.personas_involucradas) delete payload.personas_involucradas;
    if (!payload.descripcion_danos) delete payload.descripcion_danos;
    if (!payload.costo_estimado) delete payload.costo_estimado;

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateIncidenteTrabajoDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Incidente' : 'Nuevo Incidente'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Fecha del Evento | Hora del Evento */}
          <Input
            label="Fecha del Evento *"
            type="date"
            value={formData.fecha_evento}
            onChange={(e) => handleChange('fecha_evento', e.target.value)}
            required
          />

          <Input
            label="Hora del Evento"
            type="time"
            value={formData.hora_evento || ''}
            onChange={(e) => handleChange('hora_evento', e.target.value)}
          />

          {/* Fila 2: Tipo de Incidente | Potencial de Gravedad */}
          <Select
            label="Tipo de Incidente *"
            value={formData.tipo_incidente}
            onChange={(e) => handleChange('tipo_incidente', e.target.value)}
            required
          >
            {TIPO_INCIDENTE_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          <Select
            label="Potencial de Gravedad *"
            value={formData.potencial_gravedad}
            onChange={(e) => handleChange('potencial_gravedad', e.target.value)}
            required
          >
            {POTENCIAL_GRAVEDAD_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila 3: Lugar del Evento (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Lugar del Evento *"
              value={formData.lugar_evento}
              onChange={(e) => handleChange('lugar_evento', e.target.value)}
              placeholder="Ej: Área de cargue, Bodega principal, Planta 1"
              required
            />
          </div>

          {/* Fila 4: Descripción del Evento (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción del Evento *"
              value={formData.descripcion_evento}
              onChange={(e) => handleChange('descripcion_evento', e.target.value)}
              placeholder="Describa detalladamente qué ocurrió, cómo y las circunstancias..."
              rows={3}
              required
            />
          </div>

          {/* Fila 5: Consecuencias Potenciales (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Consecuencias Potenciales"
              value={formData.consecuencias_potenciales || ''}
              onChange={(e) => handleChange('consecuencias_potenciales', e.target.value)}
              placeholder="¿Qué podría haber pasado si el incidente no se controla?"
              rows={2}
            />
          </div>

          {/* Fila 6: Personas Involucradas (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Personas Involucradas"
              value={formData.personas_involucradas || ''}
              onChange={(e) => handleChange('personas_involucradas', e.target.value)}
              placeholder="Nombres y roles de las personas involucradas en el incidente..."
              rows={2}
            />
          </div>

          {/* Fila 7: Checkbox Daños Materiales */}
          <div className="md:col-span-2">
            <Checkbox
              checked={formData.hubo_danos_materiales ?? false}
              onChange={(e) => handleChange('hubo_danos_materiales', e.target.checked)}
              label="Hubo Daños Materiales"
            />
          </div>

          {/* Fila 8: Descripción de Daños | Costo Estimado (condicional) */}
          {formData.hubo_danos_materiales && (
            <>
              <div className="md:col-span-2">
                <Textarea
                  label="Descripción de los Daños"
                  value={formData.descripcion_danos || ''}
                  onChange={(e) => handleChange('descripcion_danos', e.target.value)}
                  placeholder="Describa los daños materiales ocurridos..."
                  rows={2}
                />
              </div>

              <Input
                label="Costo Estimado (COP)"
                type="number"
                value={formData.costo_estimado !== undefined ? String(formData.costo_estimado) : ''}
                onChange={(e) =>
                  handleChange(
                    'costo_estimado',
                    e.target.value !== '' ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="0"
              />
            </>
          )}

          {/* Fila 9: Requiere Investigación */}
          <Checkbox
            checked={formData.requiere_investigacion ?? false}
            onChange={(e) => handleChange('requiere_investigacion', e.target.checked)}
            label="Requiere Investigación"
          />
        </div>

        {/* Fila de botones */}
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
              <>{item ? 'Actualizar' : 'Reportar'} Incidente</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
