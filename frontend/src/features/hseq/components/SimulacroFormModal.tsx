import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateSimulacro,
  useUpdateSimulacro,
  usePlanesEmergencia,
} from '../hooks/useEmergencias';
import type { Simulacro } from '../types/emergencias.types';

interface SimulacroFormModalProps {
  item: Simulacro | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  plan_emergencia: number;
  nombre: string;
  tipo_simulacro: string;
  alcance: string;
  fecha_programada: string;
  duracion_programada: number;
  objetivo_general: string;
  objetivos_especificos: string;
  descripcion_escenario: string;
  ubicacion: string;
  areas_involucradas: string;
  coordinador: string;
  numero_participantes_esperados: number;
  tipo_simulacro_anunciado: boolean;
  notificar_participantes: boolean;
}

const INITIAL_FORM: FormData = {
  plan_emergencia: 0,
  nombre: '',
  tipo_simulacro: 'EVACUACION',
  alcance: 'TOTAL',
  fecha_programada: '',
  duracion_programada: 30,
  objetivo_general: '',
  objetivos_especificos: '',
  descripcion_escenario: '',
  ubicacion: '',
  areas_involucradas: '',
  coordinador: '',
  numero_participantes_esperados: 0,
  tipo_simulacro_anunciado: true,
  notificar_participantes: true,
};

const TIPO_SIMULACRO_OPTIONS = [
  { value: 'EVACUACION', label: 'Evacuación' },
  { value: 'INCENDIO', label: 'Incendio' },
  { value: 'SISMO', label: 'Sismo' },
  { value: 'PRIMEROS_AUXILIOS', label: 'Primeros Auxilios' },
  { value: 'FUGA_QUIMICA', label: 'Fuga Química' },
  { value: 'AMENAZA_BOMBA', label: 'Amenaza de Bomba' },
  { value: 'INTEGRAL', label: 'Integral' },
  { value: 'OTRO', label: 'Otro' },
];

const ALCANCE_OPTIONS = [
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'TOTAL', label: 'Total' },
  { value: 'POR_AREAS', label: 'Por Áreas' },
];

export default function SimulacroFormModal({ item, isOpen, onClose }: SimulacroFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateSimulacro();
  const updateMutation = useUpdateSimulacro();
  const { data: planesData } = usePlanesEmergencia();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const planes = Array.isArray(planesData)
    ? planesData
    : ((planesData as unknown as { results?: { id: number; codigo: string; nombre: string }[] })
        ?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        plan_emergencia: item.plan_emergencia,
        nombre: item.nombre ?? '',
        tipo_simulacro: item.tipo_simulacro ?? 'EVACUACION',
        alcance: item.alcance ?? 'TOTAL',
        fecha_programada: item.fecha_programada ?? '',
        duracion_programada: item.duracion_programada ?? 30,
        objetivo_general: item.objetivo_general ?? '',
        objetivos_especificos: item.objetivos_especificos ?? '',
        descripcion_escenario: item.descripcion_escenario ?? '',
        ubicacion: item.ubicacion ?? '',
        areas_involucradas: item.areas_involucradas ?? '',
        coordinador: item.coordinador ?? '',
        numero_participantes_esperados: item.numero_participantes_esperados ?? 0,
        tipo_simulacro_anunciado: item.tipo_simulacro_anunciado ?? true,
        notificar_participantes: item.notificar_participantes ?? true,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.plan_emergencia) delete payload.plan_emergencia;

    if (item) {
      updateMutation.mutate(
        { id: item.id, datos: payload as Partial<FormData> },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload as FormData, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Simulacro' : 'Nuevo Simulacro'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Plan | Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Plan de Emergencia *"
            value={formData.plan_emergencia}
            onChange={(e) => handleChange('plan_emergencia', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar plan...</option>
            {(planes as Array<{ id: number; codigo: string; nombre: string }>).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.codigo} - {plan.nombre}
              </option>
            ))}
          </Select>
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del simulacro..."
            required
          />
        </div>

        {/* Fila 2: Tipo | Alcance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Simulacro *"
            value={formData.tipo_simulacro}
            onChange={(e) => handleChange('tipo_simulacro', e.target.value)}
            required
          >
            {TIPO_SIMULACRO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Alcance *"
            value={formData.alcance}
            onChange={(e) => handleChange('alcance', e.target.value)}
            required
          >
            {ALCANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 3: Fecha | Duración | Participantes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Programada *"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />
          <Input
            label="Duración (minutos) *"
            type="number"
            value={formData.duracion_programada}
            onChange={(e) => handleChange('duracion_programada', parseInt(e.target.value) || 30)}
            required
          />
          <Input
            label="Participantes Esperados"
            type="number"
            value={formData.numero_participantes_esperados}
            onChange={(e) =>
              handleChange('numero_participantes_esperados', parseInt(e.target.value) || 0)
            }
          />
        </div>

        {/* Fila 4: Coordinador | Ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Coordinador *"
            value={formData.coordinador}
            onChange={(e) => handleChange('coordinador', e.target.value)}
            placeholder="Nombre del coordinador..."
            required
          />
          <Input
            label="Ubicación *"
            value={formData.ubicacion}
            onChange={(e) => handleChange('ubicacion', e.target.value)}
            placeholder="Lugar del simulacro..."
            required
          />
        </div>

        {/* Fila 5: Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="¿Simulacro Anunciado?"
            value={formData.tipo_simulacro_anunciado ? 'true' : 'false'}
            onChange={(e) => handleChange('tipo_simulacro_anunciado', e.target.value === 'true')}
          >
            <option value="true">Sí - Anunciado</option>
            <option value="false">No - Sorpresa</option>
          </Select>
          <Select
            label="¿Notificar Participantes?"
            value={formData.notificar_participantes ? 'true' : 'false'}
            onChange={(e) => handleChange('notificar_participantes', e.target.value === 'true')}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </Select>
        </div>

        {/* Fila 6: Objetivo General */}
        <Textarea
          label="Objetivo General *"
          value={formData.objetivo_general}
          onChange={(e) => handleChange('objetivo_general', e.target.value)}
          placeholder="Objetivo principal del simulacro..."
          rows={2}
          required
        />

        {/* Fila 7: Objetivos Específicos */}
        <Textarea
          label="Objetivos Específicos"
          value={formData.objetivos_especificos}
          onChange={(e) => handleChange('objetivos_especificos', e.target.value)}
          placeholder="Objetivos específicos del simulacro..."
          rows={2}
        />

        {/* Fila 8: Descripción Escenario */}
        <Textarea
          label="Descripción del Escenario *"
          value={formData.descripcion_escenario}
          onChange={(e) => handleChange('descripcion_escenario', e.target.value)}
          placeholder="Descripción detallada del escenario de emergencia..."
          rows={2}
          required
        />

        {/* Fila 9: Áreas */}
        <Textarea
          label="Áreas Involucradas *"
          value={formData.areas_involucradas}
          onChange={(e) => handleChange('areas_involucradas', e.target.value)}
          placeholder="Áreas que participarán en el simulacro..."
          rows={2}
          required
        />

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
              <>{item ? 'Actualizar' : 'Programar'} Simulacro</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
