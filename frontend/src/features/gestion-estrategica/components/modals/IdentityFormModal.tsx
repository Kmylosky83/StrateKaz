/**
 * Modal para crear/editar Identidad Corporativa
 *
 * v3.0 - Solo Misión y Visión
 * - La Política Integral se gestiona desde PoliticasManager (tab Políticas)
 * - Editor de texto enriquecido (TipTap) para misión y visión
 * - Soporte para formato rico (negrita, cursiva, listas, etc.)
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input para campos simples
 * - RichTextEditor para contenido formateado
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { Compass, Eye } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { RichTextEditor } from '@/components/forms/RichTextEditor';
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
        effective_date: identity.effective_date,
        version: identity.version,
      });
    } else {
      setFormData({
        mission: '',
        vision: '',
        effective_date: new Date().toISOString().split('T')[0],
        version: '1.0',
      });
    }
  }, [identity, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && identity) {
      const updateData: UpdateCorporateIdentityDTO = {
        mission: formData.mission,
        vision: formData.vision,
        effective_date: formData.effective_date,
        version: formData.version,
      };
      await updateMutation.mutateAsync({ id: identity.id, data: updateData });
    } else {
      const createData: CreateCorporateIdentityDTO = {
        mission: formData.mission,
        vision: formData.vision,
        effective_date: formData.effective_date,
        version: formData.version,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  // Validar contenido de editores (quitar tags HTML vacíos)
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const isValid =
    stripHtml(formData.mission).trim().length > 0 &&
    stripHtml(formData.vision).trim().length > 0;

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
        disabled={isLoading || !isValid}
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
      subtitle="Define la misión y visión de la organización"
      size="4xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Compass className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Misión *</span>
          </div>
          <RichTextEditor
            value={formData.mission}
            onChange={(value) => setFormData({ ...formData, mission: value })}
            placeholder="Describa la misión de la organización: razón de ser, propósito fundamental..."
            minHeight="150px"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Eye className="w-5 h-5 text-indigo-600" />
            <span className="font-medium">Visión *</span>
          </div>
          <RichTextEditor
            value={formData.vision}
            onChange={(value) => setFormData({ ...formData, vision: value })}
            placeholder="Describa la visión de la organización: hacia dónde se dirige, aspiración a futuro..."
            minHeight="150px"
          />
        </div>
      </form>
    </BaseModal>
  );
};
