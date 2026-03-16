/**
 * Modal CRUD para Programas de Mantenimiento de Activos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateProgramaMantenimiento, useActivosFijos } from '../hooks';
import type { ProgramaMantenimiento, ActivoFijoList } from '../types';

interface Props {
  item: ProgramaMantenimiento | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<ProgramaMantenimiento> = {
  activo: 0,
  tipo: 'preventivo',
  descripcion: '',
  frecuencia_dias: 30,
  proxima_fecha: '',
  observaciones: '',
};

export default function ProgramaMantenimientoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<ProgramaMantenimiento>>(INITIAL);
  const createMut = useCreateProgramaMantenimiento();
  const loading = createMut.isPending;

  const { data: activosData } = useActivosFijos();
  const activos = (
    Array.isArray(activosData) ? activosData : (activosData?.results ?? [])
  ) as ActivoFijoList[];

  useEffect(() => {
    if (item) {
      setForm({
        activo: item.activo,
        tipo: item.tipo,
        descripcion: item.descripcion,
        frecuencia_dias: item.frecuencia_dias,
        proxima_fecha: item.proxima_fecha,
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
    if (!payload.activo) delete (payload as Record<string, unknown>).activo;
    createMut.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Programa' : 'Programar Mantenimiento'}
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
            label="Tipo *"
            value={form.tipo || 'preventivo'}
            onChange={(e) => set('tipo', e.target.value)}
          >
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
            <option value="predictivo">Predictivo</option>
          </Select>
        </div>

        <Textarea
          label="Descripción *"
          value={form.descripcion || ''}
          onChange={(e) => set('descripcion', e.target.value)}
          rows={3}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Frecuencia (días) *"
            type="number"
            value={String(form.frecuencia_dias || 30)}
            onChange={(e) => set('frecuencia_dias', Number(e.target.value))}
            required
          />
          <Input
            label="Próxima Fecha *"
            type="date"
            value={form.proxima_fecha || ''}
            onChange={(e) => set('proxima_fecha', e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Observaciones"
          value={form.observaciones || ''}
          onChange={(e) => set('observaciones', e.target.value)}
          rows={2}
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
                'Programar'
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
