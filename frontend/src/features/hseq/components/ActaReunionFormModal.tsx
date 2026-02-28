import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateActaReunion, useReuniones } from '../hooks/useComites';
import type { ActaReunionList, CreateActaReunionDTO } from '../types/comites.types';

interface ActaReunionFormModalProps {
  item: ActaReunionList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateActaReunionDTO = {
  reunion: 0,
  numero_acta: '',
  desarrollo: '',
  conclusiones: '',
  decisiones: '',
  proxima_reunion_fecha: '',
  proxima_reunion_agenda: '',
};

export default function ActaReunionFormModal({ item, isOpen, onClose }: ActaReunionFormModalProps) {
  const [formData, setFormData] = useState<CreateActaReunionDTO>(INITIAL_FORM);

  const createMutation = useCreateActaReunion();
  const { data: reunionesData } = useReuniones();

  const isLoading = createMutation.isPending;
  const reuniones = Array.isArray(reunionesData)
    ? reunionesData
    : ((
        reunionesData as {
          results?: { id: number; numero_reunion?: string; comite_nombre?: string }[];
        }
      )?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        reunion: item.reunion ?? 0,
        numero_acta: item.numero_acta || '',
        desarrollo: '',
        conclusiones: '',
        decisiones: '',
        proxima_reunion_fecha: '',
        proxima_reunion_agenda: '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    if (!payload.reunion) delete (payload as Partial<CreateActaReunionDTO>).reunion;
    if (!payload.conclusiones) delete payload.conclusiones;
    if (!payload.decisiones) delete payload.decisiones;
    if (!payload.proxima_reunion_fecha) delete payload.proxima_reunion_fecha;
    if (!payload.proxima_reunion_agenda) delete payload.proxima_reunion_agenda;

    createMutation.mutate(payload, { onSuccess: onClose });
  };

  const handleChange = (field: keyof CreateActaReunionDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Acta de Reunión" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Reunión | Número de Acta */}
          <Select
            label="Reunión *"
            value={formData.reunion}
            onChange={(e) => handleChange('reunion', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar reunión...</option>
            {reuniones.map((r) => (
              <option key={r.id} value={r.id}>
                {r.numero_reunion} - {r.comite_nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Número de Acta *"
            value={formData.numero_acta}
            onChange={(e) => handleChange('numero_acta', e.target.value)}
            placeholder="Ej: ACTA-2024-001"
            required
          />

          {/* Fila 2: Desarrollo (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Desarrollo *"
              value={formData.desarrollo}
              onChange={(e) => handleChange('desarrollo', e.target.value)}
              placeholder="Describa el desarrollo de la reunión, temas tratados y participación..."
              rows={4}
              required
            />
          </div>

          {/* Fila 3: Conclusiones (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Conclusiones"
              value={formData.conclusiones ?? ''}
              onChange={(e) => handleChange('conclusiones', e.target.value)}
              placeholder="Conclusiones generales de la reunión..."
              rows={3}
            />
          </div>

          {/* Fila 4: Decisiones (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Decisiones"
              value={formData.decisiones ?? ''}
              onChange={(e) => handleChange('decisiones', e.target.value)}
              placeholder="Decisiones tomadas durante la reunión..."
              rows={3}
            />
          </div>

          {/* Fila 5: Fecha Próxima Reunión | Agenda Próxima */}
          <Input
            label="Fecha Próxima Reunión"
            type="date"
            value={formData.proxima_reunion_fecha ?? ''}
            onChange={(e) => handleChange('proxima_reunion_fecha', e.target.value)}
          />

          <Input
            label="Agenda Próxima Reunión"
            value={formData.proxima_reunion_agenda ?? ''}
            onChange={(e) => handleChange('proxima_reunion_agenda', e.target.value)}
            placeholder="Temas a tratar en la próxima reunión"
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
              <>Crear Acta</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
