/**
 * Modal CRUD para Contratos de Servicio
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateContratoServicio } from '../hooks';
import type { ContratoServicio } from '../types';

interface Props {
  item: ContratoServicio | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<ContratoServicio> = {
  proveedor_nombre: '',
  tipo_servicio: '',
  objeto: '',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: '',
  valor_mensual: '0',
  valor_total: '0',
  frecuencia_pago: 'mensual',
  observaciones: '',
};

export default function ContratoServicioFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<ContratoServicio>>(INITIAL);
  const createMut = useCreateContratoServicio();
  const loading = createMut.isPending;

  useEffect(() => {
    if (item) {
      setForm({
        proveedor: item.proveedor,
        proveedor_nombre: item.proveedor_nombre || '',
        tipo_servicio: item.tipo_servicio,
        objeto: item.objeto,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin || '',
        valor_mensual: item.valor_mensual,
        valor_total: item.valor_total,
        frecuencia_pago: item.frecuencia_pago,
        observaciones: item.observaciones,
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
    if (!payload.proveedor) delete (payload as Record<string, unknown>).proveedor;
    if (!payload.fecha_fin) delete (payload as Record<string, unknown>).fecha_fin;
    createMut.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Contrato' : 'Nuevo Contrato de Servicio'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tipo de Servicio *"
            value={form.tipo_servicio || ''}
            onChange={(e) => set('tipo_servicio', e.target.value)}
            required
          />
          <Select
            label="Frecuencia de Pago"
            value={form.frecuencia_pago || 'mensual'}
            onChange={(e) => set('frecuencia_pago', e.target.value)}
          >
            <option value="mensual">Mensual</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </Select>
        </div>

        <Textarea
          label="Objeto del Contrato *"
          value={form.objeto || ''}
          onChange={(e) => set('objeto', e.target.value)}
          rows={3}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio *"
            type="date"
            value={form.fecha_inicio || ''}
            onChange={(e) => set('fecha_inicio', e.target.value)}
            required
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={form.fecha_fin || ''}
            onChange={(e) => set('fecha_fin', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Valor Mensual *"
            type="number"
            value={form.valor_mensual || '0'}
            onChange={(e) => set('valor_mensual', e.target.value)}
            required
          />
          <Input
            label="Valor Total"
            type="number"
            value={form.valor_total || '0'}
            onChange={(e) => set('valor_total', e.target.value)}
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
