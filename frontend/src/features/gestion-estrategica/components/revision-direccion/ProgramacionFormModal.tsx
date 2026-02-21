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
import type { ProgramacionRevision } from '../../types/revision-direccion.types';

interface ProgramacionFormModalProps {
  programacion: ProgramacionRevision | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Form state uses backend model field names */
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
      // Map API response to form — supports both old frontend names and backend names
      const p = programacion as any;
      setForm({
        periodo: p.periodo || p.nombre || '',
        frecuencia: (p.frecuencia || 'semestral').toLowerCase(),
        fecha_programada: p.fecha_programada || '',
        hora_inicio: p.hora_inicio || '08:00',
        duracion_estimada_horas: p.duracion_estimada_horas ?? 2,
        lugar: p.lugar || p.ubicacion || '',
        modalidad: (p.modalidad || 'presencial').toLowerCase(),
        incluye_calidad: p.incluye_calidad ?? p.iso_9001 ?? true,
        incluye_ambiental: p.incluye_ambiental ?? p.iso_14001 ?? true,
        incluye_sst: p.incluye_sst ?? p.iso_45001 ?? true,
        incluye_seguridad_info: p.incluye_seguridad_info ?? p.iso_27001 ?? false,
        incluye_pesv: p.incluye_pesv ?? p.pesv ?? false,
        observaciones: p.observaciones || p.descripcion || '',
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

    // Build payload matching backend ProgramaRevision model
    const anio = new Date(form.fecha_programada).getFullYear();
    const payload: Record<string, unknown> = {
      periodo: form.periodo.trim(),
      anio,
      frecuencia: form.frecuencia,
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

    if (isEditing) {
      updateMutation.mutate(
        { id: programacion.id, data: payload as any },
        { onSuccess: () => onClose() }
      );
    } else {
      createMutation.mutate(payload as any, { onSuccess: () => onClose() });
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
