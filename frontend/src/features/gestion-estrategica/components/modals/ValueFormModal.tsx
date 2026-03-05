/**
 * Modal para crear/editar Valores Corporativos
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Textarea para formulario
 * - Select para iconos
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useCreateValue, useUpdateValue } from '../../hooks/useStrategic';
import type {
  CorporateValue,
  CreateCorporateValueDTO,
  UpdateCorporateValueDTO,
} from '../../types/strategic.types';

interface ValueFormModalProps {
  value: CorporateValue | null;
  identityId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ICON_OPTIONS = [
  { value: '', label: 'Sin icono' },
  { value: 'Heart', label: 'Corazón' },
  { value: 'Star', label: 'Estrella' },
  { value: 'Shield', label: 'Escudo' },
  { value: 'Users', label: 'Usuarios' },
  { value: 'Target', label: 'Objetivo' },
  { value: 'Lightbulb', label: 'Idea' },
  { value: 'Handshake', label: 'Apretón' },
  { value: 'Award', label: 'Premio' },
  { value: 'Leaf', label: 'Hoja' },
  { value: 'Zap', label: 'Rayo' },
];

export const ValueFormModal = ({ value, identityId, isOpen, onClose }: ValueFormModalProps) => {
  const isEditing = value !== null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    order: 0,
  });

  const createMutation = useCreateValue();
  const updateMutation = useUpdateValue();

  useEffect(() => {
    if (value) {
      setFormData({
        name: value.name,
        description: value.description,
        icon: value.icon || '',
        order: value.order,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '',
        order: 0,
      });
    }
  }, [value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && value) {
      const updateData: UpdateCorporateValueDTO = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon || undefined,
        order: formData.order,
      };
      await updateMutation.mutateAsync({ id: value.id, data: updateData });
    } else {
      const createData: CreateCorporateValueDTO & { identity: number } = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon || undefined,
        order: formData.order,
        identity: identityId,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.name || !formData.description}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Valor'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Valor Corporativo' : 'Nuevo Valor Corporativo'}
      subtitle="Define un valor que guía el comportamiento organizacional"
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del Valor *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Integridad, Compromiso, Excelencia..."
          required
        />

        <Textarea
          label="Descripción *"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describa qué significa este valor para la organización..."
          rows={4}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Icono"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            options={ICON_OPTIONS}
          />
          <Input
            label="Orden"
            type="number"
            value={formData.order.toString()}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            min={0}
          />
        </div>
      </form>
    </BaseModal>
  );
};
