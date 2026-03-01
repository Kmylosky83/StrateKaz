/**
 * Modal CRUD para Cuentas Bancarias
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateBanco, useUpdateBanco } from '../hooks';
import type { Banco } from '../types';

interface Props {
  item: Banco | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<Banco> = {
  entidad_bancaria: '',
  tipo_cuenta: 'ahorros',
  numero_cuenta: '',
  nombre_cuenta: '',
  saldo_actual: '0',
  saldo_disponible: '0',
  saldo_comprometido: '0',
  estado: 'activa',
  sucursal: '',
  observaciones: '',
};

export default function BancoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<Banco>>(INITIAL);
  const createMut = useCreateBanco();
  const updateMut = useUpdateBanco();
  const loading = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (item) {
      setForm({
        entidad_bancaria: item.entidad_bancaria,
        tipo_cuenta: item.tipo_cuenta,
        numero_cuenta: item.numero_cuenta,
        nombre_cuenta: item.nombre_cuenta,
        saldo_actual: item.saldo_actual,
        saldo_disponible: item.saldo_disponible,
        saldo_comprometido: item.saldo_comprometido,
        estado: item.estado,
        sucursal: item.sucursal,
        observaciones: item.observaciones,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateMut.mutate({ id: item.id, data: form }, { onSuccess: onClose });
    } else {
      createMut.mutate(form, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Entidad Bancaria *"
            value={form.entidad_bancaria || ''}
            onChange={(e) => set('entidad_bancaria', e.target.value)}
            required
          />
          <Input
            label="Nombre de la Cuenta *"
            value={form.nombre_cuenta || ''}
            onChange={(e) => set('nombre_cuenta', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo de Cuenta *"
            value={form.tipo_cuenta || 'ahorros'}
            onChange={(e) => set('tipo_cuenta', e.target.value)}
          >
            <option value="ahorros">Ahorros</option>
            <option value="corriente">Corriente</option>
          </Select>
          <Input
            label="Número de Cuenta *"
            value={form.numero_cuenta || ''}
            onChange={(e) => set('numero_cuenta', e.target.value)}
            required
          />
          <Input
            label="Sucursal"
            value={form.sucursal || ''}
            onChange={(e) => set('sucursal', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Saldo Actual"
            type="number"
            value={form.saldo_actual || '0'}
            onChange={(e) => set('saldo_actual', e.target.value)}
          />
          <Input
            label="Saldo Disponible"
            type="number"
            value={form.saldo_disponible || '0'}
            onChange={(e) => set('saldo_disponible', e.target.value)}
          />
          <Select
            label="Estado"
            value={form.estado || 'activa'}
            onChange={(e) => set('estado', e.target.value)}
          >
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
            <option value="bloqueada">Bloqueada</option>
          </Select>
        </div>

        <Textarea
          label="Observaciones"
          value={form.observaciones || ''}
          onChange={(e) => set('observaciones', e.target.value)}
          rows={3}
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
