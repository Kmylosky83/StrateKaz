/**
 * Modal CRUD para Presupuesto por Área
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useSelectAreas } from '@/hooks/useSelectLists';
import { useCentrosCosto, useRubros, useCreatePresupuesto } from '../hooks';
import type { PresupuestoPorArea, CentroCostoList, RubroList } from '../types';

interface Props {
  item: PresupuestoPorArea | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<PresupuestoPorArea> = {
  area: null,
  centro_costo: null,
  rubro: 0,
  anio: new Date().getFullYear(),
  monto_asignado: '0',
  estado: 'borrador',
  observaciones: '',
};

export default function PresupuestoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<PresupuestoPorArea>>(INITIAL);
  const createMut = useCreatePresupuesto();
  const loading = createMut.isPending;

  const { data: areas } = useSelectAreas();
  const { data: centrosData } = useCentrosCosto();
  const { data: rubrosData } = useRubros();

  const centros = (
    Array.isArray(centrosData) ? centrosData : (centrosData?.results ?? [])
  ) as CentroCostoList[];
  const rubros = (
    Array.isArray(rubrosData) ? rubrosData : (rubrosData?.results ?? [])
  ) as RubroList[];

  useEffect(() => {
    if (item) {
      setForm({
        area: item.area,
        centro_costo: item.centro_costo,
        rubro: item.rubro,
        anio: item.anio,
        monto_asignado: item.monto_asignado,
        estado: item.estado,
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
    if (!payload.area) delete (payload as Record<string, unknown>).area;
    if (!payload.centro_costo) delete (payload as Record<string, unknown>).centro_costo;
    if (!payload.rubro) delete (payload as Record<string, unknown>).rubro;
    createMut.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Presupuesto' : 'Nuevo Presupuesto'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Área"
            value={String(form.area || '')}
            onChange={(e) => set('area', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Seleccione...</option>
            {(areas ?? []).map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
          <Select
            label="Centro de Costo"
            value={String(form.centro_costo || '')}
            onChange={(e) => set('centro_costo', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Seleccione...</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Rubro *"
            value={String(form.rubro || '')}
            onChange={(e) => set('rubro', Number(e.target.value))}
          >
            <option value="">Seleccione...</option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} ({r.tipo_display})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Año *"
            type="number"
            value={String(form.anio || new Date().getFullYear())}
            onChange={(e) => set('anio', Number(e.target.value))}
            required
          />
          <Input
            label="Monto Asignado *"
            type="number"
            value={form.monto_asignado || '0'}
            onChange={(e) => set('monto_asignado', e.target.value)}
            required
          />
          <Select
            label="Estado"
            value={form.estado || 'borrador'}
            onChange={(e) => set('estado', e.target.value)}
          >
            <option value="borrador">Borrador</option>
            <option value="aprobado">Aprobado</option>
            <option value="en_ejecucion">En Ejecución</option>
            <option value="cerrado">Cerrado</option>
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
