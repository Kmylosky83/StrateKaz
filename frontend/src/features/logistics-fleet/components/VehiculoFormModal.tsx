/**
 * Modal CRUD para Vehículos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateVehiculo,
  useUpdateVehiculo,
  useTiposVehiculo,
  useEstadosVehiculo,
} from '../hooks/useLogisticsFleet';
import type { Vehiculo, CreateVehiculoDTO } from '../types/logistics-fleet.types';

interface Props {
  item: Vehiculo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateVehiculoDTO = {
  placa: '',
  tipo_vehiculo: 0,
  estado: 0,
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  color: '',
  numero_motor: '',
  numero_chasis: '',
  vin: '',
  capacidad_kg: 0,
  km_actual: 0,
  fecha_matricula: '',
  fecha_soat: '',
  fecha_tecnomecanica: '',
  propietario_nombre: '',
  propietario_documento: '',
  es_propio: true,
  es_contratado: false,
  gps_instalado: false,
  numero_gps: '',
  observaciones: '',
};

export default function VehiculoFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateVehiculoDTO>(INITIAL_FORM);
  const createMutation = useCreateVehiculo();
  const updateMutation = useUpdateVehiculo();
  const { data: tiposData } = useTiposVehiculo();
  const { data: estadosData } = useEstadosVehiculo();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const tipos = Array.isArray(tiposData) ? tiposData : [];
  const estados = Array.isArray(estadosData) ? estadosData : [];

  useEffect(() => {
    if (item) {
      setFormData({
        placa: item.placa,
        tipo_vehiculo: item.tipo_vehiculo,
        estado: item.estado,
        marca: item.marca,
        modelo: item.modelo,
        anio: item.anio,
        color: item.color || '',
        numero_motor: item.numero_motor || '',
        numero_chasis: item.numero_chasis || '',
        vin: item.vin || '',
        capacidad_kg: item.capacidad_kg,
        km_actual: item.km_actual,
        fecha_matricula: item.fecha_matricula || '',
        fecha_soat: item.fecha_soat || '',
        fecha_tecnomecanica: item.fecha_tecnomecanica || '',
        propietario_nombre: item.propietario_nombre || '',
        propietario_documento: item.propietario_documento || '',
        es_propio: item.es_propio,
        es_contratado: item.es_contratado,
        gps_instalado: item.gps_instalado,
        numero_gps: item.numero_gps || '',
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateVehiculoDTO, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.tipo_vehiculo) delete (payload as Record<string, unknown>).tipo_vehiculo;
    if (!payload.estado) delete (payload as Record<string, unknown>).estado;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateVehiculoDTO, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Placa *"
            value={formData.placa}
            onChange={(e) => handleChange('placa', e.target.value)}
            required
            disabled={!!item}
          />
          <Select
            label="Tipo *"
            value={formData.tipo_vehiculo || ''}
            onChange={(e) => handleChange('tipo_vehiculo', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Estado *"
            value={formData.estado || ''}
            onChange={(e) => handleChange('estado', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
          <Input
            label="Color"
            value={formData.color || ''}
            onChange={(e) => handleChange('color', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Marca *"
            value={formData.marca}
            onChange={(e) => handleChange('marca', e.target.value)}
            required
          />
          <Input
            label="Modelo *"
            value={formData.modelo}
            onChange={(e) => handleChange('modelo', e.target.value)}
            required
          />
          <Input
            label="Año *"
            type="number"
            value={formData.anio}
            onChange={(e) => handleChange('anio', Number(e.target.value))}
            required
            min={1990}
            max={2030}
          />
          <Input
            label="Capacidad (kg) *"
            type="number"
            value={formData.capacidad_kg}
            onChange={(e) => handleChange('capacidad_kg', Number(e.target.value))}
            required
            min={0}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="N° Motor"
            value={formData.numero_motor || ''}
            onChange={(e) => handleChange('numero_motor', e.target.value)}
          />
          <Input
            label="N° Chasis"
            value={formData.numero_chasis || ''}
            onChange={(e) => handleChange('numero_chasis', e.target.value)}
          />
          <Input
            label="VIN"
            value={formData.vin || ''}
            onChange={(e) => handleChange('vin', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Km Actual *"
            type="number"
            value={formData.km_actual}
            onChange={(e) => handleChange('km_actual', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Fecha Matrícula"
            type="date"
            value={formData.fecha_matricula || ''}
            onChange={(e) => handleChange('fecha_matricula', e.target.value)}
          />
          <Input
            label="Vencimiento SOAT"
            type="date"
            value={formData.fecha_soat || ''}
            onChange={(e) => handleChange('fecha_soat', e.target.value)}
          />
          <Input
            label="Vencimiento Tecnomecánica"
            type="date"
            value={formData.fecha_tecnomecanica || ''}
            onChange={(e) => handleChange('fecha_tecnomecanica', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Propiedad"
            value={formData.es_propio ? 'propio' : 'contratado'}
            onChange={(e) => {
              handleChange('es_propio', e.target.value === 'propio');
              handleChange('es_contratado', e.target.value === 'contratado');
            }}
          >
            <option value="propio">Propio</option>
            <option value="contratado">Contratado</option>
          </Select>
          <Select
            label="GPS Instalado"
            value={formData.gps_instalado ? 'true' : 'false'}
            onChange={(e) => handleChange('gps_instalado', e.target.value === 'true')}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </Select>
          {formData.gps_instalado && (
            <Input
              label="N° GPS"
              value={formData.numero_gps || ''}
              onChange={(e) => handleChange('numero_gps', e.target.value)}
            />
          )}
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
