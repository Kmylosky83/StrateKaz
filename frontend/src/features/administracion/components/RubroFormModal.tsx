/**
 * Modal CRUD para Rubros Presupuestales
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import type { Rubro } from '../types';

interface Props {
  item: Rubro | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Rubro>) => void;
  isLoading: boolean;
}

const INITIAL: Partial<Rubro> = {
  nombre: '',
  tipo: 'gasto',
  categoria: '',
  descripcion: '',
  rubro_padre: null,
};

export default function RubroFormModal({ item, isOpen, onClose, onCreate, isLoading }: Props) {
  const [form, setForm] = useState<Partial<Rubro>>(INITIAL);

  useEffect(() => {
    if (item) {
      setForm({
        nombre: item.nombre,
        tipo: item.tipo,
        categoria: item.categoria,
        descripcion: item.descripcion,
        rubro_padre: item.rubro_padre,
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
    if (!payload.rubro_padre) delete (payload as Record<string, unknown>).rubro_padre;
    onCreate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Rubro' : 'Nuevo Rubro'}
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
            label="Tipo *"
            value={form.tipo || 'gasto'}
            onChange={(e) => set('tipo', e.target.value)}
          >
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </Select>
          <Input
            label="Categoría"
            value={form.categoria || ''}
            onChange={(e) => set('categoria', e.target.value)}
          />
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
