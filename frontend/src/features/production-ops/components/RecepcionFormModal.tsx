/**
 * Modal de formulario para Recepción de Materia Prima
 * Production Ops - StrateKaz SGI
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateRecepcion,
  useUpdateRecepcion,
  useTiposRecepcionActivos,
  useEstadosRecepcionActivos,
  usePuntosRecepcion,
} from '../hooks/useProductionOps';
import { useSelectProveedores } from '@/hooks/useSelectLists';
import type { Recepcion, CreateRecepcionDTO } from '../types/production-ops.types';
import { useAuthStore } from '@/store/authStore';

interface RecepcionFormModalProps {
  item: Recepcion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface RecepcionFormData {
  tipo_recepcion: number;
  estado: number;
  punto_recepcion: number;
  proveedor: number;
  fecha: string;
  hora_llegada: string;
  hora_salida: string;
  vehiculo_proveedor: string;
  conductor_proveedor: string;
  peso_bruto: string;
  peso_tara: string;
  temperatura_llegada: string;
  observaciones: string;
}

const INITIAL_FORM: RecepcionFormData = {
  tipo_recepcion: 0,
  estado: 0,
  punto_recepcion: 0,
  proveedor: 0,
  fecha: new Date().toISOString().split('T')[0],
  hora_llegada: '',
  hora_salida: '',
  vehiculo_proveedor: '',
  conductor_proveedor: '',
  peso_bruto: '',
  peso_tara: '',
  temperatura_llegada: '',
  observaciones: '',
};

export default function RecepcionFormModal({ item, isOpen, onClose }: RecepcionFormModalProps) {
  const [formData, setFormData] = useState<RecepcionFormData>(INITIAL_FORM);
  const user = useAuthStore((s) => s.user);

  const createMutation = useCreateRecepcion();
  const updateMutation = useUpdateRecepcion();

  const { data: tiposRecepcion = [] } = useTiposRecepcionActivos();
  const { data: estadosRecepcion = [] } = useEstadosRecepcionActivos();
  const { data: puntosRecepcionData } = usePuntosRecepcion({ is_active: true });
  const { data: proveedores = [] } = useSelectProveedores();

  const puntosRecepcion = useMemo(() => {
    const raw = puntosRecepcionData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [puntosRecepcionData]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const pesoNeto = useMemo(() => {
    const bruto = parseFloat(formData.peso_bruto) || 0;
    const tara = parseFloat(formData.peso_tara) || 0;
    if (bruto > 0 && tara > 0) {
      return (bruto - tara).toFixed(2);
    }
    return '';
  }, [formData.peso_bruto, formData.peso_tara]);

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_recepcion: item.tipo_recepcion || 0,
        estado: item.estado || 0,
        punto_recepcion: item.punto_recepcion || 0,
        proveedor: item.proveedor || 0,
        fecha: item.fecha || '',
        hora_llegada: item.hora_llegada || '',
        hora_salida: item.hora_salida || '',
        vehiculo_proveedor: item.vehiculo_proveedor || '',
        conductor_proveedor: item.conductor_proveedor || '',
        peso_bruto: item.peso_bruto || '',
        peso_tara: item.peso_tara || '',
        temperatura_llegada: item.temperatura_llegada || '',
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof RecepcionFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateRecepcionDTO = {
      tipo_recepcion: formData.tipo_recepcion,
      estado: formData.estado,
      punto_recepcion: formData.punto_recepcion,
      proveedor: formData.proveedor,
      fecha: formData.fecha,
      recibido_por: user?.id || 0,
    };

    if (formData.hora_llegada) payload.hora_llegada = formData.hora_llegada;
    if (formData.vehiculo_proveedor) payload.vehiculo_proveedor = formData.vehiculo_proveedor;
    if (formData.conductor_proveedor) payload.conductor_proveedor = formData.conductor_proveedor;
    if (formData.peso_bruto) payload.peso_bruto = formData.peso_bruto;
    if (formData.peso_tara) payload.peso_tara = formData.peso_tara;
    if (formData.temperatura_llegada) payload.temperatura_llegada = formData.temperatura_llegada;
    if (formData.observaciones) payload.observaciones = formData.observaciones;

    if (item) {
      const updatePayload = {
        ...payload,
        ...(formData.hora_salida ? { hora_salida: formData.hora_salida } : {}),
      };
      updateMutation.mutate({ id: item.id, data: updatePayload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Recepción' : 'Nueva Recepción'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Recepción */}
          <Select
            label="Tipo de Recepción *"
            value={String(formData.tipo_recepcion || '')}
            onChange={(e) => handleChange('tipo_recepcion', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un tipo...</option>
            {tiposRecepcion.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </Select>

          {/* Estado */}
          <Select
            label="Estado *"
            value={String(formData.estado || '')}
            onChange={(e) => handleChange('estado', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un estado...</option>
            {estadosRecepcion.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.nombre}
              </option>
            ))}
          </Select>

          {/* Punto de Recepción */}
          <Select
            label="Punto de Recepción *"
            value={String(formData.punto_recepcion || '')}
            onChange={(e) => handleChange('punto_recepcion', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un punto...</option>
            {puntosRecepcion.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.nombre}
              </option>
            ))}
          </Select>

          {/* Proveedor */}
          <Select
            label="Proveedor *"
            value={String(formData.proveedor || '')}
            onChange={(e) => handleChange('proveedor', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un proveedor...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.label}
              </option>
            ))}
          </Select>

          {/* Fecha */}
          <Input
            label="Fecha de Recepción *"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            required
          />

          {/* Hora llegada */}
          <Input
            label="Hora de Llegada"
            type="time"
            value={formData.hora_llegada}
            onChange={(e) => handleChange('hora_llegada', e.target.value)}
          />

          {/* Hora salida */}
          {item && (
            <Input
              label="Hora de Salida"
              type="time"
              value={formData.hora_salida}
              onChange={(e) => handleChange('hora_salida', e.target.value)}
            />
          )}

          {/* Vehículo */}
          <Input
            label="Vehículo del Proveedor"
            value={formData.vehiculo_proveedor}
            onChange={(e) => handleChange('vehiculo_proveedor', e.target.value)}
            placeholder="Placa del vehículo"
          />

          {/* Conductor */}
          <Input
            label="Conductor"
            value={formData.conductor_proveedor}
            onChange={(e) => handleChange('conductor_proveedor', e.target.value)}
            placeholder="Nombre del conductor"
          />

          {/* Peso Bruto */}
          <Input
            label="Peso Bruto (Kg)"
            type="number"
            value={formData.peso_bruto}
            onChange={(e) => handleChange('peso_bruto', e.target.value)}
            placeholder="0.00"
          />

          {/* Peso Tara */}
          <Input
            label="Peso Tara (Kg)"
            type="number"
            value={formData.peso_tara}
            onChange={(e) => handleChange('peso_tara', e.target.value)}
            placeholder="0.00"
          />

          {/* Peso Neto (calculado) */}
          <Input
            label="Peso Neto (Kg)"
            type="text"
            value={pesoNeto ? `${pesoNeto} Kg` : 'Se calcula automáticamente'}
            disabled
          />

          {/* Temperatura */}
          <Input
            label="Temperatura de Llegada (°C)"
            type="number"
            value={formData.temperatura_llegada}
            onChange={(e) => handleChange('temperatura_llegada', e.target.value)}
            placeholder="0.0"
          />
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={3}
          placeholder="Observaciones sobre la recepción..."
        />

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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
              <>{item ? 'Actualizar' : 'Crear'} Recepción</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
