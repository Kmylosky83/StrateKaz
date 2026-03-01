/**
 * Modal CRUD para Parámetros de Integración Contable
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateParametro, useUpdateParametro, useCuentasContables } from '../hooks';
import type { ParametrosIntegracion, CuentaContableList } from '../types';

interface Props {
  item: ParametrosIntegracion | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL = {
  modulo: 'tesoreria' as string,
  clave: '',
  descripcion: '',
  cuenta_contable: 0,
};

export default function ParametroIntegracionFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState(INITIAL);
  const createMut = useCreateParametro();
  const updateMut = useUpdateParametro();
  const loading = createMut.isPending || updateMut.isPending;

  const { data: cuentasData } = useCuentasContables({ acepta_movimientos: true, is_active: true });
  const cuentas = (
    Array.isArray(cuentasData)
      ? cuentasData
      : ((cuentasData as { results?: CuentaContableList[] })?.results ?? [])
  ) as CuentaContableList[];

  useEffect(() => {
    if (item) {
      setForm({
        modulo: item.modulo,
        clave: item.clave,
        descripcion: item.descripcion,
        cuenta_contable: item.cuenta_contable,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (!payload.cuenta_contable) delete payload.cuenta_contable;
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
      title={item ? 'Editar Parámetro' : 'Nuevo Parámetro de Integración'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Módulo *"
            value={form.modulo}
            onChange={(e) => set('modulo', e.target.value)}
          >
            <option value="tesoreria">Tesorería</option>
            <option value="nomina">Nómina</option>
            <option value="inventarios">Inventarios</option>
            <option value="activos_fijos">Activos Fijos</option>
            <option value="ventas">Ventas</option>
            <option value="compras">Compras</option>
          </Select>
          <Input
            label="Clave *"
            value={form.clave}
            onChange={(e) => set('clave', e.target.value)}
            placeholder="Ej: cuenta_caja_general"
            required
          />
        </div>

        <Select
          label="Cuenta Contable *"
          value={String(form.cuenta_contable || '')}
          onChange={(e) => set('cuenta_contable', Number(e.target.value))}
        >
          <option value="">Seleccione cuenta...</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} - {c.nombre}
            </option>
          ))}
        </Select>

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
