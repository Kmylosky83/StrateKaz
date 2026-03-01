import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { useCreateVotacion, useComites } from '../hooks/useComites';
import type { VotacionList, CreateVotacionDTO } from '../types/comites.types';

interface VotacionFormModalProps {
  item: VotacionList | null;
  isOpen: boolean;
  onClose: () => void;
}

type VotacionFormData = Omit<CreateVotacionDTO, 'opciones'>;

const INITIAL_FORM: VotacionFormData = {
  comite: 0,
  numero_votacion: '',
  titulo: '',
  descripcion: '',
  tipo: 'ELECCION',
  fecha_inicio: '',
  fecha_fin: '',
  es_secreta: false,
  requiere_mayoria_simple: true,
  permite_abstencion: true,
};

const TIPO_VOTACION_OPTIONS = [
  { value: 'ELECCION', label: 'Elección' },
  { value: 'DECISION', label: 'Decisión' },
  { value: 'APROBACION', label: 'Aprobación' },
  { value: 'OTRO', label: 'Otro' },
];

export default function VotacionFormModal({ item, isOpen, onClose }: VotacionFormModalProps) {
  const [formData, setFormData] = useState<VotacionFormData>(INITIAL_FORM);

  const createMutation = useCreateVotacion();
  const { data: comitesData } = useComites();

  const isLoading = createMutation.isPending;
  const comites = Array.isArray(comitesData)
    ? comitesData
    : ((comitesData as { results?: { id: number; nombre?: string }[] })?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        comite: item.comite ?? 0,
        numero_votacion: item.numero_votacion || '',
        titulo: item.titulo || '',
        descripcion: '',
        tipo: item.tipo || 'ELECCION',
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        es_secreta: false,
        requiere_mayoria_simple: true,
        permite_abstencion: true,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateVotacionDTO = { ...formData, opciones: [] };

    if (!payload.comite) delete (payload as Partial<CreateVotacionDTO>).comite;
    if (!payload.descripcion) delete payload.descripcion;

    createMutation.mutate(payload, { onSuccess: onClose });
  };

  const handleChange = (field: keyof VotacionFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Votación" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Comité | Número Votación */}
          <Select
            label="Comité *"
            value={formData.comite}
            onChange={(e) => handleChange('comite', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar comité...</option>
            {comites.map((comite) => (
              <option key={comite.id} value={comite.id}>
                {comite.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Número de Votación *"
            value={formData.numero_votacion}
            onChange={(e) => handleChange('numero_votacion', e.target.value)}
            placeholder="Ej: VOT-2024-001"
            required
          />

          {/* Fila 2: Título (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Título *"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Título descriptivo de la votación"
              required
            />
          </div>

          {/* Fila 3: Descripción (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.descripcion ?? ''}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción detallada del motivo y alcance de la votación..."
              rows={3}
            />
          </div>

          {/* Fila 4: Tipo | Fecha Inicio */}
          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            required
          >
            {TIPO_VOTACION_OPTIONS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          {/* Fila 5: Fecha Fin */}
          <Input
            label="Fecha de Fin *"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            required
          />

          <div />

          {/* Fila 6: Checkboxes de configuración */}
          <div className="md:col-span-2 flex flex-wrap gap-6">
            <Checkbox
              id="es_secreta"
              label="Es Secreta"
              checked={formData.es_secreta ?? false}
              onChange={(e) => handleChange('es_secreta', e.target.checked)}
            />

            <Checkbox
              id="requiere_mayoria_simple"
              label="Requiere Mayoría Simple"
              checked={formData.requiere_mayoria_simple ?? false}
              onChange={(e) => handleChange('requiere_mayoria_simple', e.target.checked)}
            />

            <Checkbox
              id="permite_abstencion"
              label="Permite Abstención"
              checked={formData.permite_abstencion ?? false}
              onChange={(e) => handleChange('permite_abstencion', e.target.checked)}
            />
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
              <>Crear Votación</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
