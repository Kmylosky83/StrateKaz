/**
 * Modal CRUD para Manifiestos de Carga RNDC
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateManifiesto, useProgramaciones } from '../hooks/useLogisticsFleet';
import type { Manifiesto, CreateManifiestoDTO } from '../types/logistics-fleet.types';

interface Props {
  item: Manifiesto | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateManifiestoDTO = {
  programacion_ruta: 0,
  remitente_nombre: '',
  remitente_nit: '',
  remitente_direccion: '',
  destinatario_nombre: '',
  destinatario_nit: '',
  destinatario_direccion: '',
  origen_ciudad: '',
  destino_ciudad: '',
  descripcion_carga: '',
  peso_kg: 0,
  unidades: 0,
  valor_flete: 0,
  valor_declarado: 0,
  vehiculo_placa: '',
  vehiculo_tipo: '',
  conductor_nombre: '',
  conductor_documento: '',
  observaciones: '',
};

export default function ManifiestoFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateManifiestoDTO>(INITIAL_FORM);
  const createMutation = useCreateManifiesto();
  const { data: programacionesData } = useProgramaciones({});
  const isLoading = createMutation.isPending;

  const programaciones = Array.isArray(programacionesData)
    ? programacionesData
    : (programacionesData?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        programacion_ruta: item.programacion_ruta,
        remitente_nombre: item.remitente_nombre,
        remitente_nit: item.remitente_nit,
        remitente_direccion: item.remitente_direccion,
        destinatario_nombre: item.destinatario_nombre,
        destinatario_nit: item.destinatario_nit,
        destinatario_direccion: item.destinatario_direccion,
        origen_ciudad: item.origen_ciudad,
        destino_ciudad: item.destino_ciudad,
        descripcion_carga: item.descripcion_carga,
        peso_kg: item.peso_kg,
        unidades: item.unidades,
        valor_flete: item.valor_flete,
        valor_declarado: item.valor_declarado,
        vehiculo_placa: item.vehiculo_placa,
        vehiculo_tipo: item.vehiculo_tipo,
        conductor_nombre: item.conductor_nombre,
        conductor_documento: item.conductor_documento,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateManifiestoDTO, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.programacion_ruta) delete (payload as Record<string, unknown>).programacion_ruta;
    createMutation.mutate(payload as CreateManifiestoDTO, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Manifiesto' : 'Nuevo Manifiesto'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          label="Programación de Ruta *"
          value={formData.programacion_ruta || ''}
          onChange={(e) => handleChange('programacion_ruta', Number(e.target.value))}
          required
        >
          <option value="">Seleccionar programación...</option>
          {programaciones.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} - {p.ruta_nombre}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Remitente *"
            value={formData.remitente_nombre}
            onChange={(e) => handleChange('remitente_nombre', e.target.value)}
            required
          />
          <Input
            label="NIT Remitente *"
            value={formData.remitente_nit}
            onChange={(e) => handleChange('remitente_nit', e.target.value)}
            required
          />
          <Input
            label="Dirección Remitente *"
            value={formData.remitente_direccion}
            onChange={(e) => handleChange('remitente_direccion', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Destinatario *"
            value={formData.destinatario_nombre}
            onChange={(e) => handleChange('destinatario_nombre', e.target.value)}
            required
          />
          <Input
            label="NIT Destinatario *"
            value={formData.destinatario_nit}
            onChange={(e) => handleChange('destinatario_nit', e.target.value)}
            required
          />
          <Input
            label="Dirección Destinatario *"
            value={formData.destinatario_direccion}
            onChange={(e) => handleChange('destinatario_direccion', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ciudad Origen *"
            value={formData.origen_ciudad}
            onChange={(e) => handleChange('origen_ciudad', e.target.value)}
            required
          />
          <Input
            label="Ciudad Destino *"
            value={formData.destino_ciudad}
            onChange={(e) => handleChange('destino_ciudad', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Descripción Carga *"
            value={formData.descripcion_carga}
            onChange={(e) => handleChange('descripcion_carga', e.target.value)}
            required
          />
          <Input
            label="Peso (kg) *"
            type="number"
            value={formData.peso_kg}
            onChange={(e) => handleChange('peso_kg', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Unidades *"
            type="number"
            value={formData.unidades}
            onChange={(e) => handleChange('unidades', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Valor Flete ($) *"
            type="number"
            value={formData.valor_flete}
            onChange={(e) => handleChange('valor_flete', Number(e.target.value))}
            required
            min={0}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Valor Declarado ($) *"
            type="number"
            value={formData.valor_declarado}
            onChange={(e) => handleChange('valor_declarado', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Placa Vehículo *"
            value={formData.vehiculo_placa}
            onChange={(e) => handleChange('vehiculo_placa', e.target.value)}
            required
          />
          <Input
            label="Conductor *"
            value={formData.conductor_nombre}
            onChange={(e) => handleChange('conductor_nombre', e.target.value)}
            required
          />
          <Input
            label="Doc. Conductor *"
            value={formData.conductor_documento}
            onChange={(e) => handleChange('conductor_documento', e.target.value)}
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
            ) : (
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
