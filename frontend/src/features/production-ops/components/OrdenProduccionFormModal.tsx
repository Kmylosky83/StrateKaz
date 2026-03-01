/**
 * Modal de formulario para Órdenes de Producción
 * Production Ops - StrateKaz SGI
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateOrdenProduccion,
  useUpdateOrdenProduccion,
  useTiposProcesoActivos,
  useEstadosProcesoActivos,
  useLineasProduccion,
} from '../hooks/useProductionOps';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type { OrdenProduccion, CreateOrdenProduccionDTO } from '../types/production-ops.types';
import { useAuthStore } from '@/store/authStore';

interface OrdenProduccionFormModalProps {
  item: OrdenProduccion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface OrdenFormData {
  tipo_proceso: number;
  linea_produccion: number;
  estado: number;
  fecha_programada: string;
  prioridad: number;
  cantidad_programada: string;
  responsable: number;
  observaciones: string;
}

const INITIAL_FORM: OrdenFormData = {
  tipo_proceso: 0,
  linea_produccion: 0,
  estado: 0,
  fecha_programada: new Date().toISOString().split('T')[0],
  prioridad: 3,
  cantidad_programada: '',
  responsable: 0,
  observaciones: '',
};

const PRIORIDAD_OPTIONS = [
  { value: '1', label: 'Muy Baja' },
  { value: '2', label: 'Baja' },
  { value: '3', label: 'Media' },
  { value: '4', label: 'Alta' },
  { value: '5', label: 'Urgente' },
];

export default function OrdenProduccionFormModal({
  item,
  isOpen,
  onClose,
}: OrdenProduccionFormModalProps) {
  const [formData, setFormData] = useState<OrdenFormData>(INITIAL_FORM);
  const user = useAuthStore((s) => s.user);

  const createMutation = useCreateOrdenProduccion();
  const updateMutation = useUpdateOrdenProduccion();

  const { data: tiposProceso = [] } = useTiposProcesoActivos();
  const { data: estadosProceso = [] } = useEstadosProcesoActivos();
  const { data: lineasData } = useLineasProduccion({ is_active: true });
  const { data: usuarios = [] } = useSelectUsers();

  const lineasProduccion = useMemo(() => {
    const raw = lineasData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [lineasData]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_proceso: item.tipo_proceso || 0,
        linea_produccion: item.linea_produccion || 0,
        estado: item.estado || 0,
        fecha_programada: item.fecha_programada || '',
        prioridad: item.prioridad || 3,
        cantidad_programada: item.cantidad_programada || '',
        responsable: item.responsable || 0,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData({
        ...INITIAL_FORM,
        responsable: user?.id || 0,
      });
    }
  }, [item, isOpen, user?.id]);

  const handleChange = (field: keyof OrdenFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateOrdenProduccionDTO = {
      tipo_proceso: formData.tipo_proceso,
      linea_produccion: formData.linea_produccion,
      estado: formData.estado,
      fecha_programada: formData.fecha_programada,
      cantidad_programada: formData.cantidad_programada,
      prioridad: formData.prioridad,
      responsable: formData.responsable,
    };

    if (formData.observaciones) payload.observaciones = formData.observaciones;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Orden de Producción' : 'Nueva Orden de Producción'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Proceso */}
          <Select
            label="Tipo de Proceso *"
            value={String(formData.tipo_proceso || '')}
            onChange={(e) => handleChange('tipo_proceso', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un tipo...</option>
            {tiposProceso.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </Select>

          {/* Línea de Producción */}
          <Select
            label="Línea de Producción *"
            value={String(formData.linea_produccion || '')}
            onChange={(e) => handleChange('linea_produccion', Number(e.target.value))}
            required
          >
            <option value="">Seleccione una línea...</option>
            {lineasProduccion.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.nombre}
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
            {estadosProceso.map((ep) => (
              <option key={ep.id} value={String(ep.id)}>
                {ep.nombre}
              </option>
            ))}
          </Select>

          {/* Fecha Programada */}
          <Input
            label="Fecha Programada *"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />

          {/* Prioridad */}
          <Select
            label="Prioridad *"
            value={String(formData.prioridad)}
            onChange={(e) => handleChange('prioridad', Number(e.target.value))}
            required
          >
            {PRIORIDAD_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Cantidad Programada */}
          <Input
            label="Cantidad Programada (Kg) *"
            type="number"
            value={formData.cantidad_programada}
            onChange={(e) => handleChange('cantidad_programada', e.target.value)}
            placeholder="0.00"
            required
          />

          {/* Responsable */}
          <Select
            label="Responsable *"
            value={String(formData.responsable || '')}
            onChange={(e) => handleChange('responsable', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un responsable...</option>
            {usuarios.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={3}
          placeholder="Instrucciones especiales, notas..."
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
              <>{item ? 'Actualizar' : 'Crear'} Orden</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
