/**
 * Modal de Formulario de Programación de Abastecimiento
 *
 * Crear y editar programaciones de abastecimiento.
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateProgramacion,
  useUpdateProgramacion,
  useTiposOperacion,
} from '../hooks/useProgramacion';
import { useSelectProveedores, useSelectUsers } from '@/hooks/useSelectLists';
import type { Programacion, CreateProgramacionDTO } from '../types';

// ==================== TIPOS ====================

interface ProgramacionFormModalProps {
  item: Programacion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  fecha_programada: string;
  tipo_operacion: number;
  proveedor: number;
  sede: number;
  responsable: number;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  fecha_programada: '',
  tipo_operacion: 0,
  proveedor: 0,
  sede: 1,
  responsable: 0,
  observaciones: '',
};

// ==================== COMPONENTE ====================

export default function ProgramacionFormModal({
  item,
  isOpen,
  onClose,
}: ProgramacionFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const createMutation = useCreateProgramacion();
  const updateMutation = useUpdateProgramacion();
  const { data: tiposOperacionData } = useTiposOperacion({ is_active: true });
  const { data: proveedoresData } = useSelectProveedores();
  const { data: usersData } = useSelectUsers();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const tiposOperacion = Array.isArray(tiposOperacionData) ? tiposOperacionData : [];
  const proveedores = Array.isArray(proveedoresData) ? proveedoresData : [];
  const users = Array.isArray(usersData) ? usersData : [];

  useEffect(() => {
    if (item) {
      setFormData({
        fecha_programada: item.fecha_programada || '',
        tipo_operacion: item.tipo_operacion || 0,
        proveedor: item.proveedor || 0,
        sede: item.sede || 1,
        responsable: item.responsable || 0,
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

    const payload: Partial<CreateProgramacionDTO> = {
      fecha_programada: formData.fecha_programada,
      tipo_operacion: formData.tipo_operacion,
      proveedor: formData.proveedor,
      sede: formData.sede,
      responsable: formData.responsable,
      observaciones: formData.observaciones || undefined,
    };

    // Clean FK fields with value 0
    if (!payload.tipo_operacion) delete payload.tipo_operacion;
    if (!payload.proveedor) delete payload.proveedor;
    if (!payload.responsable) delete payload.responsable;
    if (!payload.sede) delete payload.sede;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateProgramacionDTO, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Programación' : 'Nueva Programación'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Programada *"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />

          <Select
            label="Tipo de Operación *"
            value={formData.tipo_operacion}
            onChange={(e) => handleChange('tipo_operacion', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {tiposOperacion.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Proveedor *"
            value={formData.proveedor}
            onChange={(e) => handleChange('proveedor', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {proveedores.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>

          <Select
            label="Responsable *"
            value={formData.responsable}
            onChange={(e) => handleChange('responsable', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar...</option>
            {users.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </Select>

          <Input
            label="Sede"
            type="number"
            value={formData.sede}
            onChange={(e) => handleChange('sede', Number(e.target.value))}
            min={1}
          />
        </div>

        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={3}
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
