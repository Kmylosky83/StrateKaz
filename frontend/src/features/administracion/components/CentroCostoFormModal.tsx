/**
 * Modal CRUD para Centros de Costo
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useSelectAreas } from '@/hooks/useSelectLists';
import type { CentroCosto } from '../types';

interface Props {
  item: CentroCosto | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<CentroCosto>) => void;
  isLoading: boolean;
}

const INITIAL: Partial<CentroCosto> = {
  nombre: '',
  descripcion: '',
  area: null,
  estado: 'activo',
};

export default function CentroCostoFormModal({
  item,
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: Props) {
  const [form, setForm] = useState<Partial<CentroCosto>>(INITIAL);
  const { data: areas } = useSelectAreas();

  useEffect(() => {
    if (item) {
      setForm({
        nombre: item.nombre,
        descripcion: item.descripcion,
        area: item.area,
        estado: item.estado,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.area) delete (payload as Record<string, unknown>).area;
    onCreate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre *"
          value={form.nombre || ''}
          onChange={(e) => set('nombre', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Área"
            value={String(form.area || '')}
            onChange={(e) => set('area', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Sin área</option>
            {(areas ?? []).map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={form.estado || 'activo'}
            onChange={(e) => set('estado', e.target.value)}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </Select>
        </div>

        <Textarea
          label="Descripción"
          value={form.descripcion || ''}
          onChange={(e) => set('descripcion', e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Guardando...
              </>
            ) : item ? (
              'Actualizar'
            ) : (
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
