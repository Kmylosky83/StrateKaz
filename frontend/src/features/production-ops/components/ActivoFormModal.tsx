/**
 * Modal de formulario para Activos de Producción (Equipos)
 * Production Ops - StrateKaz SGI
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateActivoProduccion,
  useUpdateActivoProduccion,
  useTiposActivoActivos,
} from '../hooks/useProductionOps';
import type {
  ActivoProduccion,
  CreateActivoProduccionDTO,
  EstadoActivo,
} from '../types/production-ops.types';

interface ActivoFormModalProps {
  item: ActivoProduccion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ActivoFormData {
  codigo: string;
  nombre: string;
  tipo_activo: number;
  marca: string;
  modelo: string;
  numero_serie: string;
  fecha_adquisicion: string;
  valor_adquisicion: string;
  ubicacion: string;
  estado: EstadoActivo;
  fecha_proximo_mantenimiento: string;
  descripcion: string;
}

const INITIAL_FORM: ActivoFormData = {
  codigo: '',
  nombre: '',
  tipo_activo: 0,
  marca: '',
  modelo: '',
  numero_serie: '',
  fecha_adquisicion: '',
  valor_adquisicion: '',
  ubicacion: '',
  estado: 'OPERATIVO',
  fecha_proximo_mantenimiento: '',
  descripcion: '',
};

const ESTADO_OPTIONS = [
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento' },
  { value: 'FUERA_SERVICIO', label: 'Fuera de Servicio' },
  { value: 'DADO_DE_BAJA', label: 'Dado de Baja' },
];

export default function ActivoFormModal({ item, isOpen, onClose }: ActivoFormModalProps) {
  const [formData, setFormData] = useState<ActivoFormData>(INITIAL_FORM);

  const createMutation = useCreateActivoProduccion();
  const updateMutation = useUpdateActivoProduccion();

  const { data: tiposActivo = [] } = useTiposActivoActivos();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        tipo_activo: item.tipo_activo || 0,
        marca: item.marca || '',
        modelo: item.modelo || '',
        numero_serie: item.numero_serie || '',
        fecha_adquisicion: item.fecha_adquisicion || '',
        valor_adquisicion: item.valor_adquisicion || '',
        ubicacion: item.ubicacion || '',
        estado: item.estado || 'OPERATIVO',
        fecha_proximo_mantenimiento: item.fecha_proximo_mantenimiento || '',
        descripcion: item.descripcion || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof ActivoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateActivoProduccionDTO = {
      nombre: formData.nombre,
      tipo_activo: formData.tipo_activo,
      fecha_adquisicion: formData.fecha_adquisicion,
      valor_adquisicion: formData.valor_adquisicion,
    };

    if (formData.marca) payload.marca = formData.marca;
    if (formData.modelo) payload.modelo = formData.modelo;
    if (formData.numero_serie) payload.numero_serie = formData.numero_serie;
    if (formData.ubicacion) payload.ubicacion = formData.ubicacion;
    if (formData.descripcion) payload.descripcion = formData.descripcion;

    if (item) {
      const updatePayload = {
        ...payload,
        estado: formData.estado,
        ...(formData.fecha_proximo_mantenimiento
          ? { fecha_proximo_mantenimiento: formData.fecha_proximo_mantenimiento }
          : {}),
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
      title={item ? 'Editar Activo' : 'Nuevo Activo de Producción'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código */}
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente"
            disabled={!!item}
          />

          {/* Nombre */}
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del equipo"
            required
          />

          {/* Tipo de Activo */}
          <Select
            label="Tipo de Activo *"
            value={String(formData.tipo_activo || '')}
            onChange={(e) => handleChange('tipo_activo', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un tipo...</option>
            {tiposActivo.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </Select>

          {/* Estado (solo en edición) */}
          {item && (
            <Select
              label="Estado"
              value={formData.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
            >
              {ESTADO_OPTIONS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
          )}

          {/* Marca */}
          <Input
            label="Marca"
            value={formData.marca}
            onChange={(e) => handleChange('marca', e.target.value)}
            placeholder="Fabricante del equipo"
          />

          {/* Modelo */}
          <Input
            label="Modelo"
            value={formData.modelo}
            onChange={(e) => handleChange('modelo', e.target.value)}
            placeholder="Modelo del equipo"
          />

          {/* Número de Serie */}
          <Input
            label="Número de Serie"
            value={formData.numero_serie}
            onChange={(e) => handleChange('numero_serie', e.target.value)}
            placeholder="S/N del equipo"
          />

          {/* Fecha de Adquisición */}
          <Input
            label="Fecha de Adquisición *"
            type="date"
            value={formData.fecha_adquisicion}
            onChange={(e) => handleChange('fecha_adquisicion', e.target.value)}
            required
          />

          {/* Costo de Adquisición */}
          <Input
            label="Valor de Adquisición (COP) *"
            type="number"
            value={formData.valor_adquisicion}
            onChange={(e) => handleChange('valor_adquisicion', e.target.value)}
            placeholder="0"
            required
          />

          {/* Ubicación */}
          <Input
            label="Ubicación"
            value={formData.ubicacion}
            onChange={(e) => handleChange('ubicacion', e.target.value)}
            placeholder="Planta, bodega, línea..."
          />

          {/* Próximo Mantenimiento (solo edición) */}
          {item && (
            <Input
              label="Próximo Mantenimiento"
              type="date"
              value={formData.fecha_proximo_mantenimiento}
              onChange={(e) => handleChange('fecha_proximo_mantenimiento', e.target.value)}
            />
          )}
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          rows={3}
          placeholder="Descripción del equipo, características especiales..."
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
              <>{item ? 'Actualizar' : 'Crear'} Activo</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
