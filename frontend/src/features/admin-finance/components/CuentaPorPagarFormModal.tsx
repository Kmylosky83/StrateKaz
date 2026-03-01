/**
 * Modal CRUD para Cuentas por Pagar
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateCuentaPorPagar } from '../hooks';
import type { CuentaPorPagar } from '../types';

interface Props {
  item: CuentaPorPagar | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<CuentaPorPagar> = {
  concepto: '',
  proveedor_nombre: '',
  monto_total: '0',
  fecha_documento: new Date().toISOString().split('T')[0],
  fecha_vencimiento: '',
  observaciones: '',
};

export default function CuentaPorPagarFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<CuentaPorPagar>>(INITIAL);
  const createMut = useCreateCuentaPorPagar();
  const loading = createMut.isPending;

  useEffect(() => {
    if (item) {
      setForm({
        concepto: item.concepto,
        proveedor: item.proveedor,
        monto_total: item.monto_total,
        fecha_documento: item.fecha_documento,
        fecha_vencimiento: item.fecha_vencimiento,
        observaciones: item.observaciones,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Cuenta por Pagar' : 'Nueva Cuenta por Pagar'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Concepto *"
            value={form.concepto || ''}
            onChange={(e) => set('concepto', e.target.value)}
            required
          />
          <Input
            label="Monto Total *"
            type="number"
            value={form.monto_total || '0'}
            onChange={(e) => set('monto_total', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Documento *"
            type="date"
            value={form.fecha_documento || ''}
            onChange={(e) => set('fecha_documento', e.target.value)}
            required
          />
          <Input
            label="Fecha Vencimiento *"
            type="date"
            value={form.fecha_vencimiento || ''}
            onChange={(e) => set('fecha_vencimiento', e.target.value)}
            required
          />
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
          {!item && (
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  Guardando...
                </>
              ) : (
                'Crear'
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
