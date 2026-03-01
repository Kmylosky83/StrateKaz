/**
 * Modal CRUD para Recaudos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateRecaudo, useBancos, useCuentasPorCobrar } from '../hooks';
import type { Recaudo, BancoList, CuentaPorCobrarList } from '../types';

interface Props {
  item: Recaudo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<Recaudo> = {
  cuenta_por_cobrar: 0,
  banco: 0,
  fecha_recaudo: new Date().toISOString().split('T')[0],
  monto: '0',
  metodo_pago: 'transferencia',
  referencia: '',
  observaciones: '',
};

export default function RecaudoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<Recaudo>>(INITIAL);
  const createMut = useCreateRecaudo();
  const loading = createMut.isPending;

  const { data: bancosData } = useBancos();
  const { data: cxcData } = useCuentasPorCobrar();

  const bancos = (
    Array.isArray(bancosData) ? bancosData : (bancosData?.results ?? [])
  ) as BancoList[];
  const cxc = (
    Array.isArray(cxcData) ? cxcData : (cxcData?.results ?? [])
  ) as CuentaPorCobrarList[];

  useEffect(() => {
    if (item) {
      setForm({
        cuenta_por_cobrar: item.cuenta_por_cobrar,
        banco: item.banco,
        fecha_recaudo: item.fecha_recaudo,
        monto: item.monto,
        metodo_pago: item.metodo_pago,
        referencia: item.referencia,
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
    const payload = { ...form };
    if (!payload.cuenta_por_cobrar) delete (payload as Record<string, unknown>).cuenta_por_cobrar;
    if (!payload.banco) delete (payload as Record<string, unknown>).banco;
    createMut.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Recaudo' : 'Registrar Recaudo'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Cuenta por Cobrar *"
            value={String(form.cuenta_por_cobrar || '')}
            onChange={(e) => set('cuenta_por_cobrar', Number(e.target.value))}
          >
            <option value="">Seleccione...</option>
            {cxc
              .filter((c) => c.estado === 'pendiente' || c.estado === 'parcial')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.concepto}
                </option>
              ))}
          </Select>
          <Select
            label="Banco *"
            value={String(form.banco || '')}
            onChange={(e) => set('banco', Number(e.target.value))}
          >
            <option value="">Seleccione...</option>
            {bancos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.entidad_bancaria} - {b.numero_cuenta}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha de Recaudo *"
            type="date"
            value={form.fecha_recaudo || ''}
            onChange={(e) => set('fecha_recaudo', e.target.value)}
            required
          />
          <Input
            label="Monto *"
            type="number"
            value={form.monto || '0'}
            onChange={(e) => set('monto', e.target.value)}
            required
          />
          <Select
            label="Método de Pago *"
            value={form.metodo_pago || 'transferencia'}
            onChange={(e) => set('metodo_pago', e.target.value)}
          >
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
            <option value="efectivo">Efectivo</option>
            <option value="pse">PSE</option>
          </Select>
        </div>

        <Input
          label="Referencia"
          value={form.referencia || ''}
          onChange={(e) => set('referencia', e.target.value)}
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
                'Registrar Recaudo'
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
