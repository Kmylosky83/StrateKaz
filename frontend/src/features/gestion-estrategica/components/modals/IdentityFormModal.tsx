/**
 * Modal para crear/editar Identidad Corporativa
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Textarea para formulario
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateIdentity, useUpdateIdentity } from '../../hooks/useStrategic';
import type { CorporateIdentity, CreateCorporateIdentityDTO, UpdateCorporateIdentityDTO } from '../../types/strategic.types';

interface IdentityFormModalProps {
  identity: CorporateIdentity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IdentityFormModal = ({ identity, isOpen, onClose }: IdentityFormModalProps) => {
  const isEditing = identity !== null;

  const [formData, setFormData] = useState({
    mission: '',
    vision: '',
    integral_policy: '',
    effective_date: '',
    version: '1.0',
  });

  const createMutation = useCreateIdentity();
  const updateMutation = useUpdateIdentity();

  useEffect(() => {
    if (identity) {
      setFormData({
        mission: identity.mission,
        vision: identity.vision,
        integral_policy: identity.integral_policy,
        effective_date: identity.effective_date,
        version: identity.version,
      });
    } else {
      setFormData({
        mission: '',
        vision: '',
        integral_policy: '',
        effective_date: new Date().toISOString().split('T')[0],
        version: '1.0',
      });
    }
  }, [identity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && identity) {
      const updateData: UpdateCorporateIdentityDTO = {
        mission: formData.mission,
        vision: formData.vision,
        integral_policy: formData.integral_policy,
        effective_date: formData.effective_date,
        version: formData.version,
      };
      await updateMutation.mutateAsync({ id: identity.id, data: updateData });
    } else {
      const createData: CreateCorporateIdentityDTO = {
        mission: formData.mission,
        vision: formData.vision,
        integral_policy: formData.integral_policy,
        effective_date: formData.effective_date,
        version: formData.version,
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
        disabled={isLoading || !formData.mission || !formData.vision || !formData.integral_policy}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Identidad'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Identidad Corporativa' : 'Nueva Identidad Corporativa'}
      subtitle="Define la misión, visión y política integral de la organización"
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Vigencia *"
            type="date"
            value={formData.effective_date}
            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            required
          />
          <Input
            label="Versión"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="1.0"
          />
        </div>

        <Textarea
          label="Misión *"
          value={formData.mission}
          onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
          placeholder="Describa la misión de la organización..."
          rows={4}
          required
        />

        <Textarea
          label="Visión *"
          value={formData.vision}
          onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
          placeholder="Describa la visión de la organización..."
          rows={4}
          required
        />

        <Textarea
          label="Política Integral *"
          value={formData.integral_policy}
          onChange={(e) => setFormData({ ...formData, integral_policy: e.target.value })}
          placeholder="Describa la política integral (calidad, SST, ambiente, seguridad vial)..."
          rows={6}
          required
        />
      </form>
    </BaseModal>
  );
};
