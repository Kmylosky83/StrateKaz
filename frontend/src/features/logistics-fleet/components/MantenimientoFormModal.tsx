/**
 * Modal CRUD para Mantenimientos de Vehículos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateMantenimiento,
  useUpdateMantenimiento,
  useVehiculos,
} from '../hooks/useLogisticsFleet';
import { TipoMantenimientoLabels } from '../types/logistics-fleet.types';
import type {
  MantenimientoVehiculo,
  CreateMantenimientoDTO,
  TipoMantenimiento,
} from '../types/logistics-fleet.types';

interface Props {
  item: MantenimientoVehiculo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateMantenimientoDTO = {
  vehiculo: 0,
  tipo: 'PREVENTIVO',
  descripcion: '',
  fecha_programada: new Date().toISOString().split('T')[0],
  km_mantenimiento: 0,
  km_proximo_mantenimiento: 0,
  costo_mano_obra: 0,
  costo_repuestos: 0,
  proveedor_nombre: '',
};

const TIPOS: TipoMantenimiento[] = ['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO'];

export default function MantenimientoFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateMantenimientoDTO>(INITIAL_FORM);
  const createMutation = useCreateMantenimiento();
  const updateMutation = useUpdateMantenimiento();
  const { data: vehiculosData } = useVehiculos({ is_active: true });
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const vehiculos = Array.isArray(vehiculosData) ? vehiculosData : (vehiculosData?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        vehiculo: item.vehiculo,
        tipo: item.tipo,
        descripcion: item.descripcion,
        fecha_programada: item.fecha_programada,
        km_mantenimiento: item.km_mantenimiento,
        km_proximo_mantenimiento: item.km_proximo_mantenimiento || 0,
        costo_mano_obra: item.costo_mano_obra || 0,
        costo_repuestos: item.costo_repuestos || 0,
        proveedor_nombre: item.proveedor_nombre || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateMantenimientoDTO, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.vehiculo) delete (payload as Record<string, unknown>).vehiculo;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateMantenimientoDTO, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Vehículo *"
            value={formData.vehiculo || ''}
            onChange={(e) => handleChange('vehiculo', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar vehículo...</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} - {v.marca} {v.modelo}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            required
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TipoMantenimientoLabels[t]}
              </option>
            ))}
          </Select>
          <Input
            label="Fecha Programada *"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Descripción *"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          required
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Km Mantenimiento *"
            type="number"
            value={formData.km_mantenimiento}
            onChange={(e) => handleChange('km_mantenimiento', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Km Próximo Mantenimiento"
            type="number"
            value={formData.km_proximo_mantenimiento || ''}
            onChange={(e) => handleChange('km_proximo_mantenimiento', Number(e.target.value))}
            min={0}
          />
          <Input
            label="Proveedor"
            value={formData.proveedor_nombre || ''}
            onChange={(e) => handleChange('proveedor_nombre', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Costo Mano de Obra ($)"
            type="number"
            value={formData.costo_mano_obra || ''}
            onChange={(e) => handleChange('costo_mano_obra', Number(e.target.value))}
            min={0}
          />
          <Input
            label="Costo Repuestos ($)"
            type="number"
            value={formData.costo_repuestos || ''}
            onChange={(e) => handleChange('costo_repuestos', Number(e.target.value))}
            min={0}
          />
        </div>

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
