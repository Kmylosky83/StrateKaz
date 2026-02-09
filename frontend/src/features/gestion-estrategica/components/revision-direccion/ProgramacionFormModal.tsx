/**
 * Modal para crear/editar Programaciones de Revision por la Direccion
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import {
  useCreateProgramacion,
  useUpdateProgramacion,
} from '../../hooks/useRevisionDireccion';
import type {
  ProgramacionRevision,
  CreateProgramacionRevisionDTO,
  FrecuenciaRevision,
} from '../../types/revision-direccion.types';

interface ProgramacionFormModalProps {
  programacion: ProgramacionRevision | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  frecuencia: FrecuenciaRevision;
  fecha_programada: string;
  hora_inicio: string;
  duracion_estimada_horas: number;
  ubicacion: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA';
  enlace_reunion: string;
  iso_9001: boolean;
  iso_14001: boolean;
  iso_45001: boolean;
  iso_27001: boolean;
  pesv: boolean;
  sg_sst: boolean;
  descripcion: string;
}

const INITIAL_FORM: FormData = {
  nombre: '',
  frecuencia: 'SEMESTRAL',
  fecha_programada: '',
  hora_inicio: '08:00',
  duracion_estimada_horas: 2,
  ubicacion: '',
  modalidad: 'PRESENCIAL',
  enlace_reunion: '',
  iso_9001: true,
  iso_14001: true,
  iso_45001: true,
  iso_27001: false,
  pesv: false,
  sg_sst: true,
  descripcion: '',
};

const FRECUENCIA_OPTIONS = [
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'CUATRIMESTRAL', label: 'Cuatrimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

const MODALIDAD_OPTIONS = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'HIBRIDA', label: 'Hibrida' },
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
        nombre: programacion.nombre || '',
        frecuencia: programacion.frecuencia,
        fecha_programada: programacion.fecha_programada,
        hora_inicio: programacion.hora_inicio || '08:00',
        duracion_estimada_horas: programacion.duracion_estimada_horas ?? 2,
        ubicacion: programacion.ubicacion ?? '',
        modalidad: programacion.modalidad,
        enlace_reunion: programacion.enlace_reunion ?? '',
        iso_9001: programacion.iso_9001,
        iso_14001: programacion.iso_14001,
        iso_45001: programacion.iso_45001,
        iso_27001: programacion.iso_27001,
        pesv: programacion.pesv,
        sg_sst: programacion.sg_sst,
        descripcion: programacion.descripcion ?? '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [programacion]);

  const handleChange = (field: keyof FormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.fecha_programada) return;

    const data: CreateProgramacionRevisionDTO = {
      nombre: form.nombre.trim(),
      frecuencia: form.frecuencia,
      fecha_programada: form.fecha_programada,
      hora_inicio: form.hora_inicio,
      duracion_estimada_horas: form.duracion_estimada_horas,
      ubicacion: form.ubicacion,
      modalidad: form.modalidad,
      enlace_reunion: form.enlace_reunion || undefined,
      iso_9001: form.iso_9001,
      iso_14001: form.iso_14001,
      iso_45001: form.iso_45001,
      iso_27001: form.iso_27001,
      pesv: form.pesv,
      sg_sst: form.sg_sst,
      descripcion: form.descripcion || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: programacion.id, data },
        { onSuccess: () => onClose() }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Programacion' : 'Nueva Programacion de Revision'}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Nombre de la Revision"
          value={form.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Ej: Revision Primer Semestre 2026"
          required
        />

        {form.descripcion !== undefined && (
          <Textarea
            label="Descripcion"
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Descripcion opcional de la revision"
            rows={2}
          />
        )}

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
            label="Duracion Estimada (horas)"
            type="number"
            value={String(form.duracion_estimada_horas)}
            onChange={(e) => handleChange('duracion_estimada_horas', Number(e.target.value))}
            min="0.5"
            step="0.5"
          />
          <Input
            label="Ubicacion / Sala"
            value={form.ubicacion}
            onChange={(e) => handleChange('ubicacion', e.target.value)}
            placeholder="Sala de Juntas"
          />
        </div>

        {form.modalidad !== 'PRESENCIAL' && (
          <Input
            label="Enlace de Reunion"
            value={form.enlace_reunion}
            onChange={(e) => handleChange('enlace_reunion', e.target.value)}
            placeholder="https://meet.google.com/..."
          />
        )}

        {/* Sistemas de Gestion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sistemas de Gestion a Revisar
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'iso_9001', label: 'ISO 9001 (Calidad)' },
              { key: 'iso_14001', label: 'ISO 14001 (Ambiental)' },
              { key: 'iso_45001', label: 'ISO 45001 (SST)' },
              { key: 'iso_27001', label: 'ISO 27001 (Seguridad Info)' },
              { key: 'pesv', label: 'PESV (Seguridad Vial)' },
              { key: 'sg_sst', label: 'SG-SST (Decreto 1072)' },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
          disabled={isPending || !form.nombre.trim() || !form.fecha_programada}
        >
          {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Programacion'}
        </Button>
      </div>
    </BaseModal>
  );
};
