/**
 * Modal CRUD para Ejecuciones Presupuestales
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Textarea } from '@/components/forms';
import { useCreateEjecucion } from '../hooks';
import type { Ejecucion } from '../types';

interface Props {
  item: Ejecucion | null;
  isOpen: boolean;
  onClose: () => void;
  presupuestoId?: number;
}

const INITIAL: Partial<Ejecucion> = {
  presupuesto: 0,
  fecha: new Date().toISOString().split('T')[0],
  monto: '0',
  concepto: '',
  numero_documento: '',
  observaciones: '',
};

export default function EjecucionFormModal({ item, isOpen, onClose, presupuestoId }: Props) {
  const [form, setForm] = useState<Partial<Ejecucion>>(INITIAL);
  const createMut = useCreateEjecucion();
  const loading = createMut.isPending;

  useEffect(() => {
    if (item) {
      setForm({
        presupuesto: item.presupuesto,
        fecha: item.fecha,
        monto: item.monto,
        concepto: item.concepto,
        numero_documento: item.numero_documento,
        observaciones: item.observaciones,
      });
    } else {
      setForm({ ...INITIAL, presupuesto: presupuestoId || 0 });
    }
  }, [item, isOpen, presupuestoId]);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.presupuesto) delete (payload as Record<string, unknown>).presupuesto;
    createMut.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Ejecución' : 'Nueva Ejecución'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha *"
            type="date"
            value={form.fecha || ''}
            onChange={(e) => set('fecha', e.target.value)}
            required
          />
          <Input
            label="Monto *"
            type="number"
            value={form.monto || '0'}
            onChange={(e) => set('monto', e.target.value)}
            required
          />
        </div>

        <Input
          label="Concepto *"
          value={form.concepto || ''}
          onChange={(e) => set('concepto', e.target.value)}
          required
        />

        <Input
          label="N° Documento Soporte"
          value={form.numero_documento || ''}
          onChange={(e) => set('numero_documento', e.target.value)}
        />

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
                'Registrar'
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
