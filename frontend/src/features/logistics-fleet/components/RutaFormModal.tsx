/**
 * Modal CRUD para Rutas
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateRuta, useUpdateRuta, useTiposRuta } from '../hooks/useLogisticsFleet';
import type { Ruta, CreateRutaDTO } from '../types/logistics-fleet.types';

interface Props {
  item: Ruta | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateRutaDTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_ruta: 0,
  origen_nombre: '',
  origen_direccion: '',
  origen_ciudad: '',
  destino_nombre: '',
  destino_direccion: '',
  destino_ciudad: '',
  distancia_km: 0,
  tiempo_estimado_minutos: 0,
  costo_estimado: 0,
  peajes_estimados: 0,
};

export default function RutaFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateRutaDTO>(INITIAL_FORM);
  const createMutation = useCreateRuta();
  const updateMutation = useUpdateRuta();
  const { data: tiposRuta } = useTiposRuta();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        tipo_ruta: item.tipo_ruta,
        origen_nombre: item.origen_nombre,
        origen_direccion: item.origen_direccion,
        origen_ciudad: item.origen_ciudad,
        destino_nombre: item.destino_nombre,
        destino_direccion: item.destino_direccion,
        destino_ciudad: item.destino_ciudad,
        distancia_km: item.distancia_km,
        tiempo_estimado_minutos: item.tiempo_estimado_minutos,
        costo_estimado: item.costo_estimado || 0,
        peajes_estimados: item.peajes_estimados || 0,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateRutaDTO, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.tipo_ruta) delete (payload as Record<string, unknown>).tipo_ruta;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const tiposArray = Array.isArray(tiposRuta) ? tiposRuta : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Ruta' : 'Nueva Ruta'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Código *"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            required
            disabled={!!item}
          />
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            required
          />
          <Select
            label="Tipo de Ruta *"
            value={formData.tipo_ruta || ''}
            onChange={(e) => handleChange('tipo_ruta', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {tiposArray.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Origen - Nombre *"
            value={formData.origen_nombre}
            onChange={(e) => handleChange('origen_nombre', e.target.value)}
            required
          />
          <Input
            label="Origen - Dirección *"
            value={formData.origen_direccion}
            onChange={(e) => handleChange('origen_direccion', e.target.value)}
            required
          />
          <Input
            label="Origen - Ciudad *"
            value={formData.origen_ciudad}
            onChange={(e) => handleChange('origen_ciudad', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Destino - Nombre *"
            value={formData.destino_nombre}
            onChange={(e) => handleChange('destino_nombre', e.target.value)}
            required
          />
          <Input
            label="Destino - Dirección *"
            value={formData.destino_direccion}
            onChange={(e) => handleChange('destino_direccion', e.target.value)}
            required
          />
          <Input
            label="Destino - Ciudad *"
            value={formData.destino_ciudad}
            onChange={(e) => handleChange('destino_ciudad', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Distancia (km) *"
            type="number"
            value={formData.distancia_km}
            onChange={(e) => handleChange('distancia_km', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Tiempo estimado (min) *"
            type="number"
            value={formData.tiempo_estimado_minutos}
            onChange={(e) => handleChange('tiempo_estimado_minutos', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Costo estimado ($)"
            type="number"
            value={formData.costo_estimado || ''}
            onChange={(e) => handleChange('costo_estimado', Number(e.target.value))}
            min={0}
          />
          <Input
            label="Peajes estimados ($)"
            type="number"
            value={formData.peajes_estimados || ''}
            onChange={(e) => handleChange('peajes_estimados', Number(e.target.value))}
            min={0}
          />
        </div>

        <Textarea
          label="Descripción"
          value={formData.descripcion || ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
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
