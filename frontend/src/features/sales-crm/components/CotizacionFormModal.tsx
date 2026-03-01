/**
 * CotizacionFormModal - Modal CRUD para cotizaciones (encabezado)
 * Sales CRM Module — StrateKaz SGI
 *
 * Nota: Los detalles (líneas de producto) se gestionan por separado.
 * Este modal crea/edita el encabezado de la cotización.
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateCotizacion, useUpdateCotizacion, useClientes, useOportunidades } from '../hooks';
import type { Cotizacion, CreateCotizacionDTO } from '../types';

interface CotizacionFormModalProps {
  item: Cotizacion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CotizacionHeaderDTO {
  cliente: number;
  oportunidad?: number;
  fecha_vencimiento: string;
  validez_dias: number;
  descuento_porcentaje: number;
  iva_porcentaje: number;
  observaciones: string;
  condiciones_pago: string;
  tiempo_entrega: string;
}

const INITIAL_FORM: CotizacionHeaderDTO = {
  cliente: 0,
  oportunidad: undefined,
  fecha_vencimiento: '',
  validez_dias: 30,
  descuento_porcentaje: 0,
  iva_porcentaje: 19,
  observaciones: '',
  condiciones_pago: '',
  tiempo_entrega: '',
};

export default function CotizacionFormModal({ item, isOpen, onClose }: CotizacionFormModalProps) {
  const [formData, setFormData] = useState<CotizacionHeaderDTO>(INITIAL_FORM);

  const createMutation = useCreateCotizacion();
  const updateMutation = useUpdateCotizacion();

  const { data: clientesData } = useClientes({ page_size: 200 });
  const { data: oportunidadesData } = useOportunidades({ page_size: 200 });

  const clientes = Array.isArray(clientesData) ? clientesData : (clientesData?.results ?? []);
  const oportunidades = Array.isArray(oportunidadesData)
    ? oportunidadesData
    : (oportunidadesData?.results ?? []);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        cliente: item.cliente,
        oportunidad: item.oportunidad || undefined,
        fecha_vencimiento: item.fecha_vencimiento || '',
        validez_dias: item.validez_dias ?? 30,
        descuento_porcentaje: item.descuento_porcentaje ?? 0,
        iva_porcentaje: item.iva_porcentaje ?? 19,
        observaciones: item.observaciones || '',
        condiciones_pago: item.condiciones_pago || '',
        tiempo_entrega: item.tiempo_entrega || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CotizacionHeaderDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construir el payload conforme al DTO del API
    const payload: CreateCotizacionDTO = {
      cliente: formData.cliente,
      oportunidad: formData.oportunidad || undefined,
      fecha_vencimiento: formData.fecha_vencimiento || undefined,
      validez_dias: formData.validez_dias,
      descuento_porcentaje: formData.descuento_porcentaje,
      iva_porcentaje: formData.iva_porcentaje,
      observaciones: formData.observaciones || undefined,
      condiciones_pago: formData.condiciones_pago || undefined,
      tiempo_entrega: formData.tiempo_entrega || undefined,
      detalles:
        item?.detalles?.map((d) => ({
          producto_id: d.producto_id,
          producto_nombre: d.producto_nombre,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          unidad_medida: d.unidad_medida,
          precio_unitario: d.precio_unitario,
          descuento_porcentaje: d.descuento_porcentaje,
          iva_porcentaje: d.iva_porcentaje,
        })) || [],
    };

    // Limpiar FK opcionales vacíos
    if (!payload.oportunidad) delete payload.oportunidad;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const clienteOptions = clientes.map((c) => ({
    value: String(c.id),
    label: c.nombre_comercial,
  }));

  const oportunidadOptions = oportunidades.map((o) => ({
    value: String(o.id),
    label: `${o.numero_oportunidad} - ${o.titulo}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Cotización' : 'Nueva Cotización'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <Select
            label="Cliente *"
            value={String(formData.cliente || '')}
            onChange={(e) => handleChange('cliente', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un cliente...</option>
            {clienteOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Oportunidad (opcional) */}
          <Select
            label="Oportunidad Asociada"
            value={String(formData.oportunidad || '')}
            onChange={(e) =>
              handleChange('oportunidad', e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Sin oportunidad asociada</option>
            {oportunidadOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fecha de Vencimiento */}
          <Input
            label="Fecha de Vencimiento"
            type="date"
            value={formData.fecha_vencimiento || ''}
            onChange={(e) => handleChange('fecha_vencimiento', e.target.value)}
          />

          {/* Días de Validez */}
          <Input
            label="Días de Validez"
            type="number"
            value={String(formData.validez_dias ?? 30)}
            onChange={(e) => handleChange('validez_dias', Number(e.target.value))}
            min={1}
            max={365}
          />

          {/* Descuento */}
          <Input
            label="Descuento (%)"
            type="number"
            value={String(formData.descuento_porcentaje ?? 0)}
            onChange={(e) => handleChange('descuento_porcentaje', Number(e.target.value))}
            min={0}
            max={100}
            step={0.5}
          />

          {/* IVA */}
          <Input
            label="IVA (%)"
            type="number"
            value={String(formData.iva_porcentaje ?? 19)}
            onChange={(e) => handleChange('iva_porcentaje', Number(e.target.value))}
            min={0}
            max={100}
          />

          {/* Tiempo de Entrega */}
          <Input
            label="Tiempo de Entrega"
            value={formData.tiempo_entrega || ''}
            onChange={(e) => handleChange('tiempo_entrega', e.target.value)}
            placeholder="Ej: 5 días hábiles"
          />
        </div>

        {/* Condiciones de Pago */}
        <Textarea
          label="Condiciones de Pago"
          value={formData.condiciones_pago || ''}
          onChange={(e) => handleChange('condiciones_pago', e.target.value)}
          placeholder="Ej: 50% anticipado, 50% contra entrega"
          rows={2}
        />

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Notas adicionales..."
          rows={2}
        />

        {!item && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Los productos/líneas de detalle se agregan después de crear la cotización.
          </p>
        )}

        {/* Botones */}
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
              <>{item ? 'Actualizar' : 'Crear'} Cotización</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
