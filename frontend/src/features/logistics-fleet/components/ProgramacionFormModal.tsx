/**
 * Modal CRUD para Programación de Rutas
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateProgramacion,
  useUpdateProgramacion,
  useRutas,
  useVehiculos,
  useConductores,
} from '../hooks/useLogisticsFleet';
import type { ProgramacionRuta, CreateProgramacionDTO } from '../types/logistics-fleet.types';

interface Props {
  item: ProgramacionRuta | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateProgramacionDTO = {
  ruta: 0,
  vehiculo: 0,
  conductor: 0,
  fecha_programada: new Date().toISOString().split('T')[0],
  hora_salida_programada: '',
  hora_llegada_estimada: '',
  observaciones: '',
};

export default function ProgramacionFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateProgramacionDTO>(INITIAL_FORM);
  const createMutation = useCreateProgramacion();
  const updateMutation = useUpdateProgramacion();
  const { data: rutasData } = useRutas({ is_active: true });
  const { data: vehiculosData } = useVehiculos({ is_active: true });
  const { data: conductoresData } = useConductores({ is_active: true });
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const rutas = Array.isArray(rutasData) ? rutasData : (rutasData?.results ?? []);
  const vehiculos = Array.isArray(vehiculosData) ? vehiculosData : (vehiculosData?.results ?? []);
  const conductores = Array.isArray(conductoresData)
    ? conductoresData
    : (conductoresData?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        ruta: item.ruta,
        vehiculo: item.vehiculo,
        conductor: item.conductor,
        fecha_programada: item.fecha_programada,
        hora_salida_programada: item.hora_salida_programada,
        hora_llegada_estimada: item.hora_llegada_estimada,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateProgramacionDTO, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.ruta) delete (payload as Record<string, unknown>).ruta;
    if (!payload.vehiculo) delete (payload as Record<string, unknown>).vehiculo;
    if (!payload.conductor) delete (payload as Record<string, unknown>).conductor;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateProgramacionDTO, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Programación' : 'Nueva Programación'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          label="Ruta *"
          value={formData.ruta || ''}
          onChange={(e) => handleChange('ruta', Number(e.target.value))}
          required
        >
          <option value="">Seleccionar ruta...</option>
          {rutas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.codigo} - {r.nombre}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            label="Conductor *"
            value={formData.conductor || ''}
            onChange={(e) => handleChange('conductor', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar conductor...</option>
            {conductores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo} ({c.categoria_licencia})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />
          <Input
            label="Hora Salida *"
            type="time"
            value={formData.hora_salida_programada}
            onChange={(e) => handleChange('hora_salida_programada', e.target.value)}
            required
          />
          <Input
            label="Hora Llegada Estimada *"
            type="time"
            value={formData.hora_llegada_estimada}
            onChange={(e) => handleChange('hora_llegada_estimada', e.target.value)}
            required
          />
        </div>

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
