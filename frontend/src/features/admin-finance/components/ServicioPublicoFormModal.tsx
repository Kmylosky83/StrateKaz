/**
 * Modal CRUD para Servicios Públicos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import type { ServicioPublico } from '../types';

interface Props {
  item: ServicioPublico | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<ServicioPublico>) => void;
  isLoading: boolean;
}

const INITIAL: Partial<ServicioPublico> = {
  tipo_servicio: 'energia',
  proveedor_nombre: '',
  numero_cuenta: '',
  ubicacion: '',
  periodo_mes: new Date().getMonth() + 1,
  periodo_anio: new Date().getFullYear(),
  fecha_vencimiento: '',
  valor: '0',
  consumo: '',
  unidad_medida: 'kWh',
  observaciones: '',
};

export default function ServicioPublicoFormModal({
  item,
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: Props) {
  const [form, setForm] = useState<Partial<ServicioPublico>>(INITIAL);

  useEffect(() => {
    if (item) {
      setForm({
        tipo_servicio: item.tipo_servicio,
        proveedor_nombre: item.proveedor_nombre,
        numero_cuenta: item.numero_cuenta,
        ubicacion: item.ubicacion,
        periodo_mes: item.periodo_mes,
        periodo_anio: item.periodo_anio,
        fecha_vencimiento: item.fecha_vencimiento,
        valor: item.valor,
        consumo: item.consumo || '',
        unidad_medida: item.unidad_medida,
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
    onCreate(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Servicio Público' : 'Nuevo Servicio Público'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Servicio *"
            value={form.tipo_servicio || 'energia'}
            onChange={(e) => set('tipo_servicio', e.target.value)}
          >
            <option value="energia">Energía</option>
            <option value="agua">Agua</option>
            <option value="gas">Gas</option>
            <option value="telefonia">Telefonía</option>
            <option value="internet">Internet</option>
            <option value="alcantarillado">Alcantarillado</option>
            <option value="otro">Otro</option>
          </Select>
          <Input
            label="Proveedor *"
            value={form.proveedor_nombre || ''}
            onChange={(e) => set('proveedor_nombre', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="N° Cuenta"
            value={form.numero_cuenta || ''}
            onChange={(e) => set('numero_cuenta', e.target.value)}
          />
          <Input
            label="Ubicación"
            value={form.ubicacion || ''}
            onChange={(e) => set('ubicacion', e.target.value)}
          />
          <Input
            label="Fecha Vencimiento *"
            type="date"
            value={form.fecha_vencimiento || ''}
            onChange={(e) => set('fecha_vencimiento', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Mes"
            type="number"
            value={String(form.periodo_mes || '')}
            onChange={(e) => set('periodo_mes', Number(e.target.value))}
          />
          <Input
            label="Año"
            type="number"
            value={String(form.periodo_anio || '')}
            onChange={(e) => set('periodo_anio', Number(e.target.value))}
          />
          <Input
            label="Valor *"
            type="number"
            value={form.valor || '0'}
            onChange={(e) => set('valor', e.target.value)}
            required
          />
          <Input
            label="Consumo"
            value={form.consumo || ''}
            onChange={(e) => set('consumo', e.target.value)}
          />
        </div>

        <Textarea
          label="Observaciones"
          value={form.observaciones || ''}
          onChange={(e) => set('observaciones', e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
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
