import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateAccidenteTrabajo, useUpdateAccidenteTrabajo } from '../hooks/useAccidentalidad';
import type { AccidenteTrabajo, CreateAccidenteTrabajoDTO } from '../types/accidentalidad.types';
import { useSelectColaboradores } from '@/hooks/useSelectLists';

interface AccidenteTrabajoFormModalProps {
  item: AccidenteTrabajo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateAccidenteTrabajoDTO = {
  fecha_evento: '',
  hora_evento: '',
  lugar_evento: '',
  descripcion_evento: '',
  tipo_evento: 'CAIDA_MISMO_NIVEL',
  trabajador_id: 0,
  cargo_trabajador: '',
  tipo_lesion: 'CONTUSION',
  parte_cuerpo: 'CABEZA',
  descripcion_lesion: '',
  gravedad: 'LEVE',
  dias_incapacidad: 0,
  mortal: false,
  centro_atencion: '',
  diagnostico_medico: '',
  testigos: '',
  requiere_investigacion: false,
};

const TIPO_EVENTO_OPTIONS = [
  { value: 'CAIDA_MISMO_NIVEL', label: 'Caída Mismo Nivel' },
  { value: 'CAIDA_DIFERENTE_NIVEL', label: 'Caída Diferente Nivel' },
  { value: 'GOLPE_OBJETO', label: 'Golpe con Objeto' },
  { value: 'ATRAPAMIENTO', label: 'Atrapamiento' },
  { value: 'CORTE', label: 'Corte' },
  { value: 'QUEMADURA', label: 'Quemadura' },
  { value: 'CONTACTO_ELECTRICO', label: 'Contacto Eléctrico' },
  { value: 'SOBREESFUERZO', label: 'Sobreesfuerzo' },
  { value: 'EXPOSICION_SUSTANCIA', label: 'Exposición a Sustancia' },
  { value: 'ACCIDENTE_TRANSITO', label: 'Accidente de Tránsito' },
  { value: 'OTRO', label: 'Otro' },
];

const TIPO_LESION_OPTIONS = [
  { value: 'CONTUSION', label: 'Contusión' },
  { value: 'HERIDA', label: 'Herida' },
  { value: 'FRACTURA', label: 'Fractura' },
  { value: 'ESGUINCE', label: 'Esguince' },
  { value: 'LUXACION', label: 'Luxación' },
  { value: 'QUEMADURA', label: 'Quemadura' },
  { value: 'AMPUTACION', label: 'Amputación' },
  { value: 'INTOXICACION', label: 'Intoxicación' },
  { value: 'ASFIXIA', label: 'Asfixia' },
  { value: 'ELECTROCUCION', label: 'Electrocución' },
  { value: 'TRAUMATISMO', label: 'Traumatismo' },
  { value: 'OTRO', label: 'Otro' },
];

const PARTE_CUERPO_OPTIONS = [
  { value: 'CABEZA', label: 'Cabeza' },
  { value: 'CUELLO', label: 'Cuello' },
  { value: 'HOMBRO_DERECHO', label: 'Hombro Derecho' },
  { value: 'HOMBRO_IZQUIERDO', label: 'Hombro Izquierdo' },
  { value: 'BRAZO_DERECHO', label: 'Brazo Derecho' },
  { value: 'BRAZO_IZQUIERDO', label: 'Brazo Izquierdo' },
  { value: 'ANTEBRAZO_DERECHO', label: 'Antebrazo Derecho' },
  { value: 'ANTEBRAZO_IZQUIERDO', label: 'Antebrazo Izquierdo' },
  { value: 'MANO_DERECHA', label: 'Mano Derecha' },
  { value: 'MANO_IZQUIERDA', label: 'Mano Izquierda' },
  { value: 'DEDO_MANO', label: 'Dedo de la Mano' },
  { value: 'TORAX', label: 'Tórax' },
  { value: 'ESPALDA', label: 'Espalda' },
  { value: 'COLUMNA', label: 'Columna' },
  { value: 'CADERA', label: 'Cadera' },
  { value: 'PIERNA_DERECHA', label: 'Pierna Derecha' },
  { value: 'PIERNA_IZQUIERDA', label: 'Pierna Izquierda' },
  { value: 'RODILLA_DERECHA', label: 'Rodilla Derecha' },
  { value: 'RODILLA_IZQUIERDA', label: 'Rodilla Izquierda' },
  { value: 'PIE_DERECHO', label: 'Pie Derecho' },
  { value: 'PIE_IZQUIERDO', label: 'Pie Izquierdo' },
  { value: 'DEDO_PIE', label: 'Dedo del Pie' },
  { value: 'OJOS', label: 'Ojos' },
  { value: 'OIDOS', label: 'Oídos' },
  { value: 'ORGANOS_INTERNOS', label: 'Órganos Internos' },
  { value: 'MULTIPLES', label: 'Múltiples' },
  { value: 'OTRO', label: 'Otro' },
];

const GRAVEDAD_OPTIONS = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'GRAVE', label: 'Grave' },
  { value: 'MORTAL', label: 'Mortal' },
];

export default function AccidenteTrabajoFormModal({
  item,
  isOpen,
  onClose,
}: AccidenteTrabajoFormModalProps) {
  const [formData, setFormData] = useState<CreateAccidenteTrabajoDTO>(INITIAL_FORM);

  const createMutation = useCreateAccidenteTrabajo();
  const updateMutation = useUpdateAccidenteTrabajo();
  const { data: colaboradores = [] } = useSelectColaboradores();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        fecha_evento: item.fecha_evento || '',
        hora_evento: item.hora_evento || '',
        lugar_evento: item.lugar_evento || '',
        descripcion_evento: item.descripcion_evento || '',
        tipo_evento: item.tipo_evento || 'CAIDA_MISMO_NIVEL',
        trabajador_id: item.trabajador_id ?? 0,
        cargo_trabajador: item.cargo_trabajador || '',
        tipo_lesion: item.tipo_lesion || 'CONTUSION',
        parte_cuerpo: item.parte_cuerpo || 'CABEZA',
        descripcion_lesion: item.descripcion_lesion || '',
        gravedad: item.gravedad || 'LEVE',
        dias_incapacidad: item.dias_incapacidad ?? 0,
        mortal: item.mortal ?? false,
        centro_atencion: item.centro_atencion || '',
        diagnostico_medico: item.diagnostico_medico || '',
        testigos: item.testigos || '',
        requiere_investigacion: item.requiere_investigacion ?? false,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    if (!payload.trabajador_id)
      delete (payload as Partial<CreateAccidenteTrabajoDTO>).trabajador_id;
    if (!payload.hora_evento) delete payload.hora_evento;
    if (!payload.centro_atencion) delete payload.centro_atencion;
    if (!payload.diagnostico_medico) delete payload.diagnostico_medico;
    if (!payload.testigos) delete payload.testigos;
    if (payload.dias_incapacidad === undefined || payload.dias_incapacidad === null) {
      delete payload.dias_incapacidad;
    }

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateAccidenteTrabajoDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Accidente de Trabajo' : 'Nuevo Accidente de Trabajo'}
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

          {/* Fila 2: Tipo de Evento | Gravedad */}
          <Select
            label="Tipo de Evento *"
            value={formData.tipo_evento}
            onChange={(e) => handleChange('tipo_evento', e.target.value)}
            required
          >
            {TIPO_EVENTO_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          <Select
            label="Gravedad *"
            value={formData.gravedad}
            onChange={(e) => handleChange('gravedad', e.target.value)}
            required
          >
            {GRAVEDAD_OPTIONS.map((op) => (
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
              placeholder="Ej: Planta de producción, Área 3, Bodega 2"
              required
            />
          </div>

          {/* Fila 4: Descripción del Evento (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción del Evento *"
              value={formData.descripcion_evento}
              onChange={(e) => handleChange('descripcion_evento', e.target.value)}
              placeholder="Describa detalladamente cómo ocurrió el accidente..."
              rows={3}
              required
            />
          </div>

          {/* Fila 5: Trabajador | Cargo */}
          <Select
            label="Trabajador *"
            value={String(formData.trabajador_id || '')}
            onChange={(e) => handleChange('trabajador_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar trabajador...</option>
            {colaboradores.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </Select>

          <Input
            label="Cargo del Trabajador *"
            value={formData.cargo_trabajador}
            onChange={(e) => handleChange('cargo_trabajador', e.target.value)}
            placeholder="Cargo al momento del accidente"
            required
          />

          {/* Fila 6: Tipo de Lesión | Parte del Cuerpo */}
          <Select
            label="Tipo de Lesión *"
            value={formData.tipo_lesion}
            onChange={(e) => handleChange('tipo_lesion', e.target.value)}
            required
          >
            {TIPO_LESION_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          <Select
            label="Parte del Cuerpo *"
            value={formData.parte_cuerpo}
            onChange={(e) => handleChange('parte_cuerpo', e.target.value)}
            required
          >
            {PARTE_CUERPO_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila 7: Descripción de la Lesión (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción de la Lesión *"
              value={formData.descripcion_lesion}
              onChange={(e) => handleChange('descripcion_lesion', e.target.value)}
              placeholder="Describa la lesión sufrida por el trabajador..."
              rows={2}
              required
            />
          </div>

          {/* Fila 8: Días de Incapacidad | Centro de Atención */}
          <Input
            label="Días de Incapacidad"
            type="number"
            value={
              formData.dias_incapacidad !== undefined ? String(formData.dias_incapacidad) : '0'
            }
            onChange={(e) =>
              handleChange('dias_incapacidad', e.target.value !== '' ? parseInt(e.target.value) : 0)
            }
            placeholder="0"
          />

          <Input
            label="Centro de Atención Médica"
            value={formData.centro_atencion || ''}
            onChange={(e) => handleChange('centro_atencion', e.target.value)}
            placeholder="Ej: Clínica del Sur, Hospital General"
          />

          {/* Fila 9: Diagnóstico Médico (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Diagnóstico Médico"
              value={formData.diagnostico_medico || ''}
              onChange={(e) => handleChange('diagnostico_medico', e.target.value)}
              placeholder="Diagnóstico emitido por el médico tratante..."
              rows={2}
            />
          </div>

          {/* Fila 10: Testigos (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Testigos del Accidente"
              value={formData.testigos || ''}
              onChange={(e) => handleChange('testigos', e.target.value)}
              placeholder="Nombres y datos de contacto de los testigos presenciales..."
              rows={2}
            />
          </div>

          {/* Fila 11: Checkboxes */}
          <div className="flex items-center gap-3">
            <input
              id="mortal"
              type="checkbox"
              checked={formData.mortal ?? false}
              onChange={(e) => handleChange('mortal', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="mortal" className="text-sm font-medium text-gray-700">
              Accidente Mortal
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="requiere_investigacion"
              type="checkbox"
              checked={formData.requiere_investigacion ?? false}
              onChange={(e) => handleChange('requiere_investigacion', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="requiere_investigacion" className="text-sm font-medium text-gray-700">
              Requiere Investigación
            </label>
          </div>
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
              <>{item ? 'Actualizar' : 'Reportar'} Accidente</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
