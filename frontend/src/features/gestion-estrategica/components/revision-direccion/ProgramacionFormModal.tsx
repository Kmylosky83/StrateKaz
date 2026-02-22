/**
 * Modal para crear/editar Programaciones de Revisión por la Dirección
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateProgramacion, useUpdateProgramacion } from '../../hooks/useRevisionDireccion';
import type {
  ProgramacionRevision,
  CreateProgramacionRevisionDTO,
  UpdateProgramacionRevisionDTO,
} from '../../types/revision-direccion.types';

interface ProgramacionFormModalProps {
  programacion: ProgramacionRevision | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  periodo: string;
  frecuencia: string;
  fecha_programada: string;
  hora_inicio: string;
  duracion_estimada_horas: number;
  lugar: string;
  modalidad: string;
  incluye_calidad: boolean;
  incluye_ambiental: boolean;
  incluye_sst: boolean;
  incluye_seguridad_info: boolean;
  incluye_pesv: boolean;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  periodo: '',
  frecuencia: 'semestral',
  fecha_programada: '',
  hora_inicio: '08:00',
  duracion_estimada_horas: 2,
  lugar: '',
  modalidad: 'presencial',
  incluye_calidad: true,
  incluye_ambiental: true,
  incluye_sst: true,
  incluye_seguridad_info: false,
  incluye_pesv: false,
  observaciones: '',
};

const FRECUENCIA_OPTIONS = [
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'cuatrimestral', label: 'Cuatrimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

const MODALIDAD_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrida', label: 'Híbrida' },
];

export const ProgramacionFormModal = ({
  programacion,
  isOpen,
  onClose,
}: ProgramacionFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const isEditing = !!programacion;

  const createMutation = useCreateProgramacion();
  const updateMutation = useUpdateProgramacion();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (programacion) {
      setForm({
        periodo: programacion.periodo || '',
        frecuencia: programacion.frecuencia || 'semestral',
        fecha_programada: programacion.fecha_programada || '',
        hora_inicio: programacion.hora_inicio || '08:00',
        duracion_estimada_horas: Number(programacion.duracion_estimada_horas) || 2,
        lugar: programacion.lugar || '',
        modalidad: programacion.modalidad || 'presencial',
        incluye_calidad: programacion.incluye_calidad ?? true,
        incluye_ambiental: programacion.incluye_ambiental ?? true,
        incluye_sst: programacion.incluye_sst ?? true,
        incluye_seguridad_info: programacion.incluye_seguridad_info ?? false,
        incluye_pesv: programacion.incluye_pesv ?? false,
        observaciones: programacion.observaciones || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [programacion]);

  const handleChange = (field: keyof FormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.periodo.trim() || !form.fecha_programada) return;

    const anio = new Date(form.fecha_programada).getFullYear();

    if (isEditing) {
      const payload: UpdateProgramacionRevisionDTO = {
        periodo: form.periodo.trim(),
        frecuencia: form.frecuencia as CreateProgramacionRevisionDTO['frecuencia'],
        fecha_programada: form.fecha_programada,
        hora_inicio: form.hora_inicio,
        duracion_estimada_horas: form.duracion_estimada_horas,
        lugar: form.lugar,
        modalidad: form.modalidad,
        incluye_calidad: form.incluye_calidad,
        incluye_ambiental: form.incluye_ambiental,
        incluye_sst: form.incluye_sst,
        incluye_seguridad_info: form.incluye_seguridad_info,
        incluye_pesv: form.incluye_pesv,
        observaciones: form.observaciones || undefined,
      };
      updateMutation.mutate({ id: programacion.id, data: payload }, { onSuccess: () => onClose() });
    } else {
      const payload: CreateProgramacionRevisionDTO = {
        anio,
        periodo: form.periodo.trim(),
        frecuencia: form.frecuencia as CreateProgramacionRevisionDTO['frecuencia'],
        fecha_programada: form.fecha_programada,
        hora_inicio: form.hora_inicio,
        duracion_estimada_horas: form.duracion_estimada_horas,
        lugar: form.lugar,
        modalidad: form.modalidad,
        incluye_calidad: form.incluye_calidad,
        incluye_ambiental: form.incluye_ambiental,
        incluye_sst: form.incluye_sst,
        incluye_seguridad_info: form.incluye_seguridad_info,
        incluye_pesv: form.incluye_pesv,
        observaciones: form.observaciones || undefined,
      };
      createMutation.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Programación' : 'Nueva Programación de Revisión'}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Período de la Revisión"
          value={form.periodo}
          onChange={(e) => handleChange('periodo', e.target.value)}
          placeholder="Ej: Revisión Primer Semestre 2026"
          required
        />

        <Textarea
          label="Observaciones"
          value={form.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Observaciones opcionales de la revisión"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Frecuencia"
            value={form.frecuencia}
            onChange={(e) => handleChange('frecuencia', e.target.value)}
            options={FRECUENCIA_OPTIONS}
          />
          <Select
            label="Modalidad"
            value={form.modalidad}
            onChange={(e) => handleChange('modalidad', e.target.value)}
            options={MODALIDAD_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha Programada"
            type="date"
            value={form.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />
          <Input
            label="Hora de Inicio"
            type="time"
            value={form.hora_inicio}
            onChange={(e) => handleChange('hora_inicio', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duración Estimada (horas)"
            type="number"
            value={String(form.duracion_estimada_horas)}
            onChange={(e) => handleChange('duracion_estimada_horas', Number(e.target.value))}
            min="0.5"
            step="0.5"
          />
          <Input
            label="Ubicación / Sala"
            value={form.lugar}
            onChange={(e) => handleChange('lugar', e.target.value)}
            placeholder="Sala de Juntas"
          />
        </div>

        {/* Sistemas de Gestión */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sistemas de Gestión a Revisar
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'incluye_calidad' as const, label: 'ISO 9001 (Calidad)' },
              { key: 'incluye_ambiental' as const, label: 'ISO 14001 (Ambiental)' },
              { key: 'incluye_sst' as const, label: 'ISO 45001 / SG-SST' },
              { key: 'incluye_seguridad_info' as const, label: 'ISO 27001 (Seguridad Info)' },
              { key: 'incluye_pesv' as const, label: 'PESV (Seguridad Vial)' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isPending || !form.periodo.trim() || !form.fecha_programada}
        >
          {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Programación'}
        </Button>
      </div>
    </BaseModal>
  );
};
