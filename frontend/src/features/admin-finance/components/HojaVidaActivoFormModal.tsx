/**
 * Modal CRUD para Hojas de Vida de Activos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateHojaVida, useActivosFijos } from '../hooks';
import type { HojaVidaActivo, ActivoFijoList } from '../types';

interface Props {
  item: HojaVidaActivo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<HojaVidaActivo> = {
  activo: 0,
  tipo_evento: 'mantenimiento',
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
  costo: '0',
  realizado_por: null,
};

export default function HojaVidaActivoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<HojaVidaActivo>>(INITIAL);
  const createMut = useCreateHojaVida();
  const loading = createMut.isPending;

  const { data: activosData } = useActivosFijos();
  const activos = (
    Array.isArray(activosData) ? activosData : (activosData?.results ?? [])
  ) as ActivoFijoList[];

  useEffect(() => {
    if (item) {
      setForm({
        activo: item.activo,
        tipo_evento: item.tipo_evento,
        fecha: item.fecha,
        descripcion: item.descripcion,
        costo: item.costo,
        realizado_por: item.realizado_por,
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
    if (!payload.activo) delete (payload as Record<string, unknown>).activo;
    if (!payload.realizado_por) delete (payload as Record<string, unknown>).realizado_por;
    createMut.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Evento' : 'Nuevo Evento en Hoja de Vida'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Activo *"
            value={String(form.activo || '')}
            onChange={(e) => set('activo', Number(e.target.value))}
          >
            <option value="">Seleccione...</option>
            {activos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo} - {a.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo de Evento *"
            value={form.tipo_evento || 'mantenimiento'}
            onChange={(e) => set('tipo_evento', e.target.value)}
          >
            <option value="mantenimiento">Mantenimiento</option>
            <option value="reparacion">Reparación</option>
            <option value="mejora">Mejora</option>
            <option value="traslado">Traslado</option>
            <option value="otro">Otro</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha *"
            type="date"
            value={form.fecha || ''}
            onChange={(e) => set('fecha', e.target.value)}
            required
          />
          <Input
            label="Costo"
            type="number"
            value={form.costo || '0'}
            onChange={(e) => set('costo', e.target.value)}
          />
        </div>

        <Textarea
          label="Descripción *"
          value={form.descripcion || ''}
          onChange={(e) => set('descripcion', e.target.value)}
          rows={3}
          required
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
