/**
 * Modal CRUD para Centros de Costo Contable
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateCentroCosto, useUpdateCentroCosto, useCentrosCostoContable } from '../hooks';
import type { CentroCostoContable, CentroCostoContableList } from '../types';

interface Props {
  item: CentroCostoContable | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL = {
  codigo: '',
  nombre: '',
  tipo_centro: 'administrativo',
  centro_padre: null as number | null,
  presupuesto_anual: '0',
  descripcion: '',
};

export default function CentroCostoContableFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState(INITIAL);
  const createMut = useCreateCentroCosto();
  const updateMut = useUpdateCentroCosto();
  const loading = createMut.isPending || updateMut.isPending;

  const { data: centrosData } = useCentrosCostoContable();
  const centros = (
    Array.isArray(centrosData)
      ? centrosData
      : ((centrosData as { results?: CentroCostoContableList[] })?.results ?? [])
  ) as CentroCostoContableList[];

  useEffect(() => {
    if (item) {
      setForm({
        codigo: item.codigo,
        nombre: item.nombre,
        tipo_centro: item.tipo_centro,
        centro_padre: item.centro_padre,
        presupuesto_anual: item.presupuesto_anual,
        descripcion: item.descripcion,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (!payload.centro_padre) delete payload.centro_padre;
    if (item) {
      updateMut.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMut.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código *"
            value={form.codigo}
            onChange={(e) => set('codigo', e.target.value)}
            required
          />
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo *"
            value={form.tipo_centro}
            onChange={(e) => set('tipo_centro', e.target.value)}
          >
            <option value="produccion">Producción</option>
            <option value="servicio">Servicio</option>
            <option value="administrativo">Administrativo</option>
            <option value="ventas">Ventas</option>
          </Select>
          <Select
            label="Centro Padre"
            value={String(form.centro_padre || '')}
            onChange={(e) => set('centro_padre', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Sin centro padre (raíz)</option>
            {centros
              .filter((c) => c.id !== item?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.nombre}
                </option>
              ))}
          </Select>
        </div>

        <Input
          label="Presupuesto Anual"
          type="number"
          value={form.presupuesto_anual}
          onChange={(e) => set('presupuesto_anual', e.target.value)}
        />

        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
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
