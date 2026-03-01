/**
 * Modal de Formulario de Movimiento de Inventario
 *
 * Registra movimientos de inventario (entradas, salidas, transferencias).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateMovimientoInventario,
  useTiposMovimiento,
  useUnidadesMedidaAlmacenamiento,
} from '../hooks/useAlmacenamiento';
import type { CreateMovimientoInventarioDTO } from '../types';

// ==================== TIPOS ====================

interface MovimientoInventarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  tipo_movimiento: number;
  almacen_origen: number;
  almacen_destino: number;
  producto_codigo: string;
  producto_nombre: string;
  lote: string;
  cantidad: number;
  unidad_medida: number;
  costo_unitario: number;
  documento_referencia: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  tipo_movimiento: 0,
  almacen_origen: 0,
  almacen_destino: 0,
  producto_codigo: '',
  producto_nombre: '',
  lote: '',
  cantidad: 0,
  unidad_medida: 0,
  costo_unitario: 0,
  documento_referencia: '',
  observaciones: '',
};

// ==================== COMPONENTE ====================

export default function MovimientoInventarioFormModal({
  isOpen,
  onClose,
}: MovimientoInventarioFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const createMutation = useCreateMovimientoInventario();
  const { data: tiposMovimientoData } = useTiposMovimiento();
  const { data: unidadesMedidaData } = useUnidadesMedidaAlmacenamiento();
  const isLoading = createMutation.isPending;

  const tiposMovimiento = Array.isArray(tiposMovimientoData) ? tiposMovimientoData : [];
  const unidadesMedida = Array.isArray(unidadesMedidaData) ? unidadesMedidaData : [];

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM);
    }
  }, [isOpen]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<CreateMovimientoInventarioDTO> = {
      tipo_movimiento: formData.tipo_movimiento,
      producto_codigo: formData.producto_codigo,
      producto_nombre: formData.producto_nombre,
      cantidad: formData.cantidad,
      unidad_medida: formData.unidad_medida,
      costo_unitario: formData.costo_unitario,
      lote: formData.lote || undefined,
      documento_referencia: formData.documento_referencia || undefined,
      observaciones: formData.observaciones || undefined,
    };

    // Clean FK fields with value 0
    if (!payload.tipo_movimiento) delete payload.tipo_movimiento;
    if (!payload.unidad_medida) delete payload.unidad_medida;

    // Only add almacen fields if provided
    if (formData.almacen_origen) {
      payload.almacen_origen = formData.almacen_origen;
    }
    if (formData.almacen_destino) {
      payload.almacen_destino = formData.almacen_destino;
    }

    createMutation.mutate(payload as CreateMovimientoInventarioDTO, { onSuccess: onClose });
  };

  // Determine which fields are needed based on tipo_movimiento
  const tipoSeleccionado = tiposMovimiento.find((t) => t.id === formData.tipo_movimiento);
  const requiereOrigen = tipoSeleccionado?.requiere_origen ?? false;
  const requiereDestino = tipoSeleccionado?.requiere_destino ?? true;
  const requiereDocumento = tipoSeleccionado?.requiere_documento ?? false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Movimiento de Inventario" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Movimiento *"
            value={formData.tipo_movimiento}
            onChange={(e) => handleChange('tipo_movimiento', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {tiposMovimiento.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Producto - Código *"
            value={formData.producto_codigo}
            onChange={(e) => handleChange('producto_codigo', e.target.value)}
            required
            placeholder="Código del producto"
          />

          <div className="md:col-span-2">
            <Input
              label="Producto - Nombre *"
              value={formData.producto_nombre}
              onChange={(e) => handleChange('producto_nombre', e.target.value)}
              required
              placeholder="Nombre del producto"
            />
          </div>

          {requiereOrigen && (
            <Input
              label="Almacén Origen *"
              type="number"
              value={formData.almacen_origen || ''}
              onChange={(e) => handleChange('almacen_origen', Number(e.target.value))}
              required={requiereOrigen}
              placeholder="ID del almacén origen"
            />
          )}

          {requiereDestino && (
            <Input
              label={`Almacén Destino${requiereDestino ? ' *' : ''}`}
              type="number"
              value={formData.almacen_destino || ''}
              onChange={(e) => handleChange('almacen_destino', Number(e.target.value))}
              required={requiereDestino}
              placeholder="ID del almacén destino"
            />
          )}

          <Input
            label="Lote"
            value={formData.lote}
            onChange={(e) => handleChange('lote', e.target.value)}
            placeholder="Número de lote"
          />

          <Input
            label="Cantidad *"
            type="number"
            value={formData.cantidad || ''}
            onChange={(e) => handleChange('cantidad', Number(e.target.value))}
            required
            min={0.01}
            step={0.01}
          />

          <Select
            label="Unidad de Medida *"
            value={formData.unidad_medida}
            onChange={(e) => handleChange('unidad_medida', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {unidadesMedida.map((um) => (
              <option key={um.id} value={um.id}>
                {um.nombre} ({um.abreviatura})
              </option>
            ))}
          </Select>

          <Input
            label="Costo Unitario *"
            type="number"
            value={formData.costo_unitario || ''}
            onChange={(e) => handleChange('costo_unitario', Number(e.target.value))}
            required
            min={0}
            step={0.01}
          />

          <Input
            label={`Documento de Referencia${requiereDocumento ? ' *' : ''}`}
            value={formData.documento_referencia}
            onChange={(e) => handleChange('documento_referencia', e.target.value)}
            required={requiereDocumento}
            placeholder="Factura, remisión, etc."
          />
        </div>

        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={2}
          placeholder="Observaciones adicionales..."
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Registrando...
              </>
            ) : (
              'Registrar Movimiento'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
