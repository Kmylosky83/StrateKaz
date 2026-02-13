/**
 * EntrevistaFormModal - Programar entrevista sincrona
 * Formulario para agendar entrevistas presenciales, virtuales, telefonicas
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Modal } from '@/components/common/Modal';
import { Calendar } from 'lucide-react';
import {
  useCreateEntrevista,
  useCandidatos,
  useVacantesActivasAbiertas,
} from '../../hooks/useSeleccionContratacion';
import { useUsers } from '@/features/users/hooks/useUsers';
import { TIPO_ENTREVISTA_OPTIONS } from '../../types';
import type { EntrevistaFormData, TipoEntrevistaType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EntrevistaFormModal = ({ isOpen, onClose }: Props) => {
  const [formData, setFormData] = useState<EntrevistaFormData>({
    candidato: 0,
    tipo_entrevista: 'virtual',
    fecha_programada: '',
    duracion_estimada_minutos: 60,
    ubicacion: '',
    entrevistador_principal: 0,
    observaciones: '',
  });

  const [vacanteFilter, setVacanteFilter] = useState<string>('');

  const createMutation = useCreateEntrevista();
  const { data: candidatosData } = useCandidatos({
    ...(vacanteFilter ? { vacante: vacanteFilter } : {}),
  });
  const { data: vacantes } = useVacantesActivasAbiertas();
  const { data: usersData } = useUsers();

  const candidatos = candidatosData?.results || [];
  const users = usersData?.results || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidato || !formData.entrevistador_principal || !formData.fecha_programada) {
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleChange = (field: keyof EntrevistaFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programar Entrevista" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Filtro por vacante */}
        <Select
          label="Filtrar por vacante"
          value={vacanteFilter}
          onChange={(e) => {
            setVacanteFilter(e.target.value);
            setFormData((prev) => ({ ...prev, candidato: 0 }));
          }}
        >
          <option value="">Todas las vacantes</option>
          {(vacantes || []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.codigo_vacante} - {v.titulo}
            </option>
          ))}
        </Select>

        {/* Candidato */}
        <Select
          label="Candidato *"
          value={formData.candidato || ''}
          onChange={(e) => handleChange('candidato', Number(e.target.value))}
          required
        >
          <option value="">Seleccionar candidato</option>
          {candidatos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre_completo}
            </option>
          ))}
        </Select>

        {/* Tipo y duracion */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de entrevista *"
            value={formData.tipo_entrevista}
            onChange={(e) => handleChange('tipo_entrevista', e.target.value as TipoEntrevistaType)}
            required
          >
            {TIPO_ENTREVISTA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Input
            label="Duracion estimada (min)"
            type="number"
            value={formData.duracion_estimada_minutos || 60}
            onChange={(e) => handleChange('duracion_estimada_minutos', Number(e.target.value))}
            min={15}
            max={480}
          />
        </div>

        {/* Fecha y ubicacion */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha y hora *"
            type="datetime-local"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />

          <Input
            label="Ubicacion / Enlace"
            value={formData.ubicacion || ''}
            onChange={(e) => handleChange('ubicacion', e.target.value)}
            placeholder="Direccion o link de videollamada"
          />
        </div>

        {/* Entrevistador */}
        <Select
          label="Entrevistador principal *"
          value={formData.entrevistador_principal || ''}
          onChange={(e) => handleChange('entrevistador_principal', Number(e.target.value))}
          required
        >
          <option value="">Seleccionar entrevistador</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name} ({u.email})
            </option>
          ))}
        </Select>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Notas adicionales para la entrevista..."
          rows={3}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            <Calendar size={16} className="mr-1" />
            Programar Entrevista
          </Button>
        </div>
      </form>
    </Modal>
  );
};
