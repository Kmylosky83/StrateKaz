/**
 * Modal de Formulario de Requisición de Compra
 *
 * Crear y editar requisiciones con validación completa.
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateRequisicion,
  useUpdateRequisicion,
  usePrioridadesRequisicion,
} from '../hooks/useCompras';
import type { Requisicion, CreateRequisicionDTO } from '../types';

// ==================== TIPOS ====================

interface RequisicionFormModalProps {
  item: Requisicion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  area_solicitante: string;
  fecha_requerida: string;
  justificacion: string;
  prioridad: number;
  sede: number;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  area_solicitante: '',
  fecha_requerida: '',
  justificacion: '',
  prioridad: 0,
  sede: 1,
  observaciones: '',
};

const PRIORIDADES_FALLBACK = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

// ==================== COMPONENTE ====================

export default function RequisicionFormModal({ item, isOpen, onClose }: RequisicionFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const createMutation = useCreateRequisicion();
  const updateMutation = useUpdateRequisicion();
  const { data: prioridadesCatalogo } = usePrioridadesRequisicion();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const prioridades =
    Array.isArray(prioridadesCatalogo) && prioridadesCatalogo.length > 0
      ? prioridadesCatalogo
      : null;

  useEffect(() => {
    if (item) {
      setFormData({
        area_solicitante: item.area_solicitante || '',
        fecha_requerida: item.fecha_requerida || '',
        justificacion: item.justificacion || '',
        prioridad: item.prioridad || 0,
        sede: item.sede || 1,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<CreateRequisicionDTO> = {
      area_solicitante: formData.area_solicitante,
      fecha_requerida: formData.fecha_requerida,
      justificacion: formData.justificacion,
      prioridad: formData.prioridad,
      sede: formData.sede,
      observaciones: formData.observaciones || undefined,
    };

    // Clean FK fields with value 0
    if (!payload.prioridad) delete payload.prioridad;
    if (!payload.sede) delete payload.sede;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateRequisicionDTO, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Requisición' : 'Nueva Requisición'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Area Solicitante *"
            value={formData.area_solicitante}
            onChange={(e) => handleChange('area_solicitante', e.target.value)}
            required
            placeholder="Ej: Producción, Administración..."
          />

          <Input
            label="Fecha Requerida *"
            type="date"
            value={formData.fecha_requerida}
            onChange={(e) => handleChange('fecha_requerida', e.target.value)}
            required
          />

          {prioridades ? (
            <Select
              label="Prioridad *"
              value={formData.prioridad}
              onChange={(e) => handleChange('prioridad', Number(e.target.value))}
              required
            >
              <option value="">Seleccionar...</option>
              {prioridades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              label="Prioridad *"
              value={formData.prioridad || ''}
              onChange={(e) => handleChange('prioridad', e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {PRIORIDADES_FALLBACK.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Sede"
            type="number"
            value={formData.sede}
            onChange={(e) => handleChange('sede', Number(e.target.value))}
            min={1}
          />
        </div>

        <Textarea
          label="Justificación *"
          value={formData.justificacion}
          onChange={(e) => handleChange('justificacion', e.target.value)}
          required
          rows={3}
          placeholder="Describa la justificación de la requisición..."
        />

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
                Guardando...
              </>
            ) : (
              <>{item ? 'Actualizar' : 'Crear'}</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
