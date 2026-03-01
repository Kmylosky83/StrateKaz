/**
 * Modal CRUD para Despachos
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateDespacho,
  useUpdateDespacho,
  useProgramaciones,
  useEstadosDespacho,
} from '../hooks/useLogisticsFleet';
import type { Despacho, CreateDespachoDTO } from '../types/logistics-fleet.types';

interface Props {
  item: Despacho | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateDespachoDTO = {
  programacion_ruta: 0,
  estado_despacho: 0,
  cliente_nombre: '',
  cliente_direccion: '',
  cliente_telefono: '',
  cliente_contacto: '',
  peso_total_kg: 0,
  volumen_total_m3: 0,
  valor_declarado: 0,
  requiere_cadena_frio: false,
  temperatura_requerida: '',
  observaciones_entrega: '',
  fecha_entrega_estimada: new Date().toISOString().split('T')[0],
};

export default function DespachoFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateDespachoDTO>(INITIAL_FORM);
  const createMutation = useCreateDespacho();
  const updateMutation = useUpdateDespacho();
  const { data: programacionesData } = useProgramaciones({});
  const { data: estadosData } = useEstadosDespacho();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const programaciones = Array.isArray(programacionesData)
    ? programacionesData
    : (programacionesData?.results ?? []);
  const estados = Array.isArray(estadosData) ? estadosData : [];

  useEffect(() => {
    if (item) {
      setFormData({
        programacion_ruta: item.programacion_ruta,
        estado_despacho: item.estado_despacho,
        cliente_nombre: item.cliente_nombre,
        cliente_direccion: item.cliente_direccion,
        cliente_telefono: item.cliente_telefono || '',
        cliente_contacto: item.cliente_contacto || '',
        peso_total_kg: item.peso_total_kg,
        volumen_total_m3: item.volumen_total_m3 || 0,
        valor_declarado: item.valor_declarado,
        requiere_cadena_frio: item.requiere_cadena_frio,
        temperatura_requerida: item.temperatura_requerida || '',
        observaciones_entrega: item.observaciones_entrega || '',
        fecha_entrega_estimada: item.fecha_entrega_estimada,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateDespachoDTO, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.programacion_ruta) delete (payload as Record<string, unknown>).programacion_ruta;
    if (!payload.estado_despacho) delete (payload as Record<string, unknown>).estado_despacho;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateDespachoDTO, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Despacho' : 'Nuevo Despacho'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Select
            label="Estado *"
            value={formData.estado_despacho || ''}
            onChange={(e) => handleChange('estado_despacho', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar estado...</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cliente *"
            value={formData.cliente_nombre}
            onChange={(e) => handleChange('cliente_nombre', e.target.value)}
            required
          />
          <Input
            label="Dirección *"
            value={formData.cliente_direccion}
            onChange={(e) => handleChange('cliente_direccion', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            value={formData.cliente_telefono || ''}
            onChange={(e) => handleChange('cliente_telefono', e.target.value)}
          />
          <Input
            label="Contacto"
            value={formData.cliente_contacto || ''}
            onChange={(e) => handleChange('cliente_contacto', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Peso Total (kg) *"
            type="number"
            value={formData.peso_total_kg}
            onChange={(e) => handleChange('peso_total_kg', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Volumen (m³)"
            type="number"
            value={formData.volumen_total_m3 || ''}
            onChange={(e) => handleChange('volumen_total_m3', Number(e.target.value))}
            min={0}
          />
          <Input
            label="Valor Declarado ($) *"
            type="number"
            value={formData.valor_declarado}
            onChange={(e) => handleChange('valor_declarado', Number(e.target.value))}
            required
            min={0}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Entrega Estimada *"
            type="date"
            value={formData.fecha_entrega_estimada}
            onChange={(e) => handleChange('fecha_entrega_estimada', e.target.value)}
            required
          />
          <Select
            label="Cadena de Frío"
            value={formData.requiere_cadena_frio ? 'true' : 'false'}
            onChange={(e) => handleChange('requiere_cadena_frio', e.target.value === 'true')}
          >
            <option value="false">No requiere</option>
            <option value="true">Sí requiere</option>
          </Select>
          {formData.requiere_cadena_frio && (
            <Input
              label="Temperatura Requerida"
              value={formData.temperatura_requerida || ''}
              onChange={(e) => handleChange('temperatura_requerida', e.target.value)}
              placeholder="Ej: 2°C - 8°C"
            />
          )}
        </div>

        <Textarea
          label="Observaciones de Entrega"
          value={formData.observaciones_entrega || ''}
          onChange={(e) => handleChange('observaciones_entrega', e.target.value)}
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
