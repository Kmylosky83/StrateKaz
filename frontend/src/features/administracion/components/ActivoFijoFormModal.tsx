/**
 * Modal CRUD para Activos Fijos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateActivoFijo, useUpdateActivoFijo, useCategoriasActivos } from '../hooks';
import { useSelectAreas } from '@/hooks/useSelectLists';
import type { ActivoFijo, CategoriaActivoList } from '../types';

interface Props {
  item: ActivoFijo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: Partial<ActivoFijo> = {
  categoria: 0,
  nombre: '',
  descripcion: '',
  numero_serie: '',
  marca: '',
  modelo: '',
  fecha_adquisicion: new Date().toISOString().split('T')[0],
  valor_adquisicion: '0',
  valor_residual: '0',
  ubicacion: '',
  area: null,
  estado: 'activo',
  observaciones: '',
};

export default function ActivoFijoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState<Partial<ActivoFijo>>(INITIAL);
  const createMut = useCreateActivoFijo();
  const updateMut = useUpdateActivoFijo();
  const loading = createMut.isPending || updateMut.isPending;

  const { data: categoriasData } = useCategoriasActivos();
  const { data: areas } = useSelectAreas();

  const categorias = (
    Array.isArray(categoriasData) ? categoriasData : (categoriasData?.results ?? [])
  ) as CategoriaActivoList[];

  useEffect(() => {
    if (item) {
      setForm({
        categoria: item.categoria,
        nombre: item.nombre,
        descripcion: item.descripcion,
        numero_serie: item.numero_serie,
        marca: item.marca,
        modelo: item.modelo,
        fecha_adquisicion: item.fecha_adquisicion,
        valor_adquisicion: item.valor_adquisicion,
        valor_residual: item.valor_residual,
        ubicacion: item.ubicacion,
        area: item.area,
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
    if (!payload.categoria) delete (payload as Record<string, unknown>).categoria;
    if (!payload.area) delete (payload as Record<string, unknown>).area;
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
      title={item ? 'Editar Activo Fijo' : 'Nuevo Activo Fijo'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            value={form.nombre || ''}
            onChange={(e) => set('nombre', e.target.value)}
            required
          />
          <Select
            label="Categoría *"
            value={String(form.categoria || '')}
            onChange={(e) => set('categoria', Number(e.target.value))}
          >
            <option value="">Seleccione...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Marca"
            value={form.marca || ''}
            onChange={(e) => set('marca', e.target.value)}
          />
          <Input
            label="Modelo"
            value={form.modelo || ''}
            onChange={(e) => set('modelo', e.target.value)}
          />
          <Input
            label="N° Serie"
            value={form.numero_serie || ''}
            onChange={(e) => set('numero_serie', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Adquisición *"
            type="date"
            value={form.fecha_adquisicion || ''}
            onChange={(e) => set('fecha_adquisicion', e.target.value)}
            required
          />
          <Input
            label="Valor Adquisición *"
            type="number"
            value={form.valor_adquisicion || '0'}
            onChange={(e) => set('valor_adquisicion', e.target.value)}
            required
          />
          <Input
            label="Valor Residual"
            type="number"
            value={form.valor_residual || '0'}
            onChange={(e) => set('valor_residual', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ubicación"
            value={form.ubicacion || ''}
            onChange={(e) => set('ubicacion', e.target.value)}
          />
          <Select
            label="Área"
            value={String(form.area || '')}
            onChange={(e) => set('area', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Sin área</option>
            {(areas ?? []).map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={form.estado || 'activo'}
            onChange={(e) => set('estado', e.target.value)}
          >
            <option value="activo">Activo</option>
            <option value="en_mantenimiento">En Mantenimiento</option>
            <option value="dado_de_baja">Dado de Baja</option>
            <option value="vendido">Vendido</option>
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
