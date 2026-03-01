/**
 * Modal CRUD para Mantenimientos Locativos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateMantenimientoLocativo } from '../hooks';
import type { MantenimientoLocativo } from '../types';

interface Props {
  item: MantenimientoLocativo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<MantenimientoLocativo> = {
  tipo: 'correctivo',
  ubicacion: '',
  descripcion_trabajo: '',
  fecha_solicitud: new Date().toISOString().split('T')[0],
  fecha_programada: '',
  costo_estimado: '0',
  observaciones: '',
};

export default function MantenimientoLocativoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<MantenimientoLocativo>>(INITIAL);
  const createMut = useCreateMantenimientoLocativo();
  const loading = createMut.isPending;

  useEffect(() => {
    if (item) {
      setForm({
        tipo: item.tipo,
        ubicacion: item.ubicacion,
        descripcion_trabajo: item.descripcion_trabajo,
        fecha_solicitud: item.fecha_solicitud,
        fecha_programada: item.fecha_programada || '',
        costo_estimado: item.costo_estimado,
        observaciones: item.observaciones,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.fecha_programada) delete (payload as Record<string, unknown>).fecha_programada;
    createMut.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Mantenimiento' : 'Nuevo Mantenimiento Locativo'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo *"
            value={form.tipo || 'correctivo'}
            onChange={(e) => set('tipo', e.target.value)}
          >
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
            <option value="mejora">Mejora</option>
          </Select>
          <Input
            label="Ubicación *"
            value={form.ubicacion || ''}
            onChange={(e) => set('ubicacion', e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Descripción del Trabajo *"
          value={form.descripcion_trabajo || ''}
          onChange={(e) => set('descripcion_trabajo', e.target.value)}
          rows={3}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Solicitud *"
            type="date"
            value={form.fecha_solicitud || ''}
            onChange={(e) => set('fecha_solicitud', e.target.value)}
            required
          />
          <Input
            label="Fecha Programada"
            type="date"
            value={form.fecha_programada || ''}
            onChange={(e) => set('fecha_programada', e.target.value)}
          />
          <Input
            label="Costo Estimado"
            type="number"
            value={form.costo_estimado || '0'}
            onChange={(e) => set('costo_estimado', e.target.value)}
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
