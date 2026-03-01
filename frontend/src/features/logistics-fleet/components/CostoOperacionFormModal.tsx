/**
 * Modal CRUD para Costos de Operación
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateCostoOperacion, useVehiculos } from '../hooks/useLogisticsFleet';
import { TipoCostoLabels } from '../types/logistics-fleet.types';
import type {
  CostoOperacion,
  CreateCostoOperacionDTO,
  TipoCostoOperacion,
} from '../types/logistics-fleet.types';

interface Props {
  item: CostoOperacion | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIPOS_COSTO: TipoCostoOperacion[] = [
  'COMBUSTIBLE',
  'PEAJE',
  'PARQUEADERO',
  'LAVADO',
  'LUBRICANTES',
  'NEUMATICOS',
  'MULTA',
  'OTRO',
];

const INITIAL_FORM: CreateCostoOperacionDTO = {
  vehiculo: 0,
  fecha: new Date().toISOString().split('T')[0],
  tipo_costo: 'COMBUSTIBLE',
  valor: 0,
  cantidad: 0,
  km_recorridos: 0,
  factura_numero: '',
  observaciones: '',
};

export default function CostoOperacionFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateCostoOperacionDTO>(INITIAL_FORM);
  const createMutation = useCreateCostoOperacion();
  const { data: vehiculosData } = useVehiculos({ is_active: true });
  const isLoading = createMutation.isPending;

  const vehiculos = Array.isArray(vehiculosData) ? vehiculosData : (vehiculosData?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        vehiculo: item.vehiculo,
        fecha: item.fecha,
        tipo_costo: item.tipo_costo,
        valor: item.valor,
        cantidad: item.cantidad || 0,
        km_recorridos: item.km_recorridos || 0,
        factura_numero: item.factura_numero || '',
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateCostoOperacionDTO, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.vehiculo) delete (payload as Record<string, unknown>).vehiculo;
    createMutation.mutate(payload as CreateCostoOperacionDTO, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Costo' : 'Nuevo Costo de Operación'}
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
            label="Tipo de Costo *"
            value={formData.tipo_costo}
            onChange={(e) => handleChange('tipo_costo', e.target.value)}
            required
          >
            {TIPOS_COSTO.map((t) => (
              <option key={t} value={t}>
                {TipoCostoLabels[t]}
              </option>
            ))}
          </Select>
          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Valor ($) *"
            type="number"
            value={formData.valor}
            onChange={(e) => handleChange('valor', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Cantidad (litros/unidades)"
            type="number"
            value={formData.cantidad || ''}
            onChange={(e) => handleChange('cantidad', Number(e.target.value))}
            min={0}
          />
          <Input
            label="Km Recorridos"
            type="number"
            value={formData.km_recorridos || ''}
            onChange={(e) => handleChange('km_recorridos', Number(e.target.value))}
            min={0}
          />
        </div>

        <Input
          label="N° Factura"
          value={formData.factura_numero || ''}
          onChange={(e) => handleChange('factura_numero', e.target.value)}
        />

        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={2}
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
            ) : (
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
