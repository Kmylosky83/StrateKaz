import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateComite, useUpdateComite, useTiposComiteActivos } from '../hooks/useComites';
import type { ComiteList, CreateComiteDTO } from '../types/comites.types';

interface ComiteFormModalProps {
  item: ComiteList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateComiteDTO = {
  tipo_comite: 0,
  codigo_comite: '',
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  periodo_descripcion: '',
  observaciones: '',
};

export default function ComiteFormModal({ item, isOpen, onClose }: ComiteFormModalProps) {
  const [formData, setFormData] = useState<CreateComiteDTO>(INITIAL_FORM);

  const createMutation = useCreateComite();
  const updateMutation = useUpdateComite();
  const { data: tiposComite } = useTiposComiteActivos();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const tipos = Array.isArray(tiposComite)
    ? tiposComite
    : ((tiposComite as { results?: typeof tiposComite })?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_comite: item.tipo_comite ?? 0,
        codigo_comite: item.codigo_comite || '',
        nombre: item.nombre || '',
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        periodo_descripcion: item.periodo_descripcion || '',
        observaciones: '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    if (!payload.tipo_comite) delete (payload as Partial<CreateComiteDTO>).tipo_comite;
    if (!payload.observaciones) delete payload.observaciones;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateComiteDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Comité' : 'Nuevo Comité'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Tipo de Comité | Código */}
          <Select
            label="Tipo de Comité *"
            value={formData.tipo_comite}
            onChange={(e) => handleChange('tipo_comite', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar tipo...</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Código *"
            value={formData.codigo_comite}
            onChange={(e) => handleChange('codigo_comite', e.target.value)}
            placeholder="Ej: COPASST-2024-01"
            required
          />

          {/* Fila 2: Nombre (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre completo del comité"
              required
            />
          </div>

          {/* Fila 3: Fecha Inicio | Fecha Fin */}
          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          <Input
            label="Fecha de Fin *"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            required
          />

          {/* Fila 4: Descripción del Período (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Descripción del Período *"
              value={formData.periodo_descripcion}
              onChange={(e) => handleChange('periodo_descripcion', e.target.value)}
              placeholder="Ej: Período 2024 - 2025"
              required
            />
          </div>

          {/* Fila 5: Observaciones (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones ?? ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales sobre el comité..."
              rows={3}
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
              <>{item ? 'Actualizar' : 'Crear'} Comité</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
