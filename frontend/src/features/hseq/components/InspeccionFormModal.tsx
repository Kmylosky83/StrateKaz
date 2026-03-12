import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select } from '@/components/forms';
import {
  useCreateInspeccion,
  useUpdateInspeccion,
  useTiposInspeccion,
  usePlantillasInspeccion,
} from '../hooks/useSeguridadIndustrial';
import type { Inspeccion, CreateInspeccionDTO } from '../types/seguridad-industrial.types';
import { useSelectUsers } from '@/hooks/useSelectLists';

interface InspeccionFormModalProps {
  item: Inspeccion | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateInspeccionDTO = {
  tipo_inspeccion_id: 0,
  plantilla_id: 0,
  fecha_programada: '',
  ubicacion: '',
  area: '',
  inspector_id: 0,
  acompanante_id: undefined,
};

export default function InspeccionFormModal({ item, isOpen, onClose }: InspeccionFormModalProps) {
  const [formData, setFormData] = useState<CreateInspeccionDTO>(INITIAL_FORM);

  const createMutation = useCreateInspeccion();
  const updateMutation = useUpdateInspeccion();

  const { data: tiposInspeccion = [] } = useTiposInspeccion({ activo: true });
  const { data: plantillas = [] } = usePlantillasInspeccion(
    formData.tipo_inspeccion_id
      ? { tipo_inspeccion: formData.tipo_inspeccion_id, activo: true }
      : { activo: true }
  );
  const { data: usuarios = [] } = useSelectUsers();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_inspeccion_id: item.tipo_inspeccion_id ?? item.tipo_inspeccion?.id ?? 0,
        plantilla_id: item.plantilla_id ?? item.plantilla?.id ?? 0,
        fecha_programada: item.fecha_programada || '',
        ubicacion: item.ubicacion || '',
        area: item.area || '',
        inspector_id: item.inspector_id ?? item.inspector?.id ?? 0,
        acompanante_id: item.acompanante_id ?? item.acompanante?.id ?? undefined,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateInspeccionDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTipo = Number(e.target.value);
    setFormData((prev) => ({
      ...prev,
      tipo_inspeccion_id: newTipo,
      plantilla_id: 0, // Resetear plantilla al cambiar tipo
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    // Limpiar FK opcionales vacíos
    if (!payload.acompanante_id) delete payload.acompanante_id;
    if (!payload.area) delete payload.area;

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const tiposInspeccionOptions = tiposInspeccion.map((t) => ({
    value: String(t.id),
    label: t.nombre,
  }));

  const plantillasOptions = plantillas.map((p) => ({
    value: String(p.id),
    label: p.nombre,
  }));

  const usuariosOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Inspección' : 'Nueva Inspección'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Inspección */}
          <Select
            label="Tipo de Inspección *"
            value={String(formData.tipo_inspeccion_id || '')}
            onChange={handleTipoChange}
            required
          >
            <option value="">Seleccione un tipo...</option>
            {tiposInspeccionOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Plantilla */}
          <Select
            label="Plantilla *"
            value={String(formData.plantilla_id || '')}
            onChange={(e) => handleChange('plantilla_id', Number(e.target.value))}
            required
          >
            <option value="">
              {formData.tipo_inspeccion_id
                ? 'Seleccione una plantilla...'
                : 'Seleccione primero el tipo...'}
            </option>
            {plantillasOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fecha Programada */}
          <Input
            label="Fecha Programada *"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />

          {/* Ubicación */}
          <Input
            label="Ubicación *"
            value={formData.ubicacion}
            onChange={(e) => handleChange('ubicacion', e.target.value)}
            placeholder="Ej: Planta principal, Bodega 3"
            required
          />

          {/* Área (opcional) */}
          <Input
            label="Área"
            value={formData.area || ''}
            onChange={(e) => handleChange('area', e.target.value)}
            placeholder="Ej: Producción, Almacenamiento"
          />

          {/* Inspector */}
          <Select
            label="Inspector *"
            value={String(formData.inspector_id || '')}
            onChange={(e) => handleChange('inspector_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un usuario...</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Acompañante (opcional) */}
          <Select
            label="Acompañante"
            value={String(formData.acompanante_id || '')}
            onChange={(e) =>
              handleChange('acompanante_id', e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Sin acompañante</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>
        </div>

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
              <>{item ? 'Actualizar' : 'Crear'} Inspección</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
