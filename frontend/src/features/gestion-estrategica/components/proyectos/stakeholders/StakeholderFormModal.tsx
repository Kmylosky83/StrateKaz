/**
 * Modal para crear/editar Interesado del Proyecto
 * DS: BaseModal + Input + Textarea + Select + Checkbox + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Checkbox } from '@/components/forms/Checkbox';
import { useCreateInteresado, useUpdateInteresado } from '../../../hooks/useProyectos';
import type {
  InteresadoProyecto,
  CreateInteresadoDTO,
  UpdateInteresadoDTO,
  NivelInteres,
  NivelInfluencia,
} from '../../../types/proyectos.types';

interface StakeholderFormModalProps {
  interesado: InteresadoProyecto | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const NIVEL_INTERES_OPTIONS = [
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Medio' },
  { value: 'bajo', label: 'Bajo' },
];

const NIVEL_INFLUENCIA_OPTIONS = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

export const StakeholderFormModal = ({
  interesado,
  proyectoId,
  isOpen,
  onClose,
}: StakeholderFormModalProps) => {
  const isEditing = interesado !== null;

  const [formData, setFormData] = useState<CreateInteresadoDTO>({
    proyecto: proyectoId,
    nombre: '',
    cargo_rol: '',
    organizacion: '',
    contacto: '',
    nivel_interes: 'medio',
    nivel_influencia: 'media',
    requisitos: '',
    estrategia_gestion: '',
    is_internal: true,
  });

  const createMutation = useCreateInteresado();
  const updateMutation = useUpdateInteresado();

  useEffect(() => {
    if (interesado) {
      setFormData({
        proyecto: interesado.proyecto,
        nombre: interesado.nombre,
        cargo_rol: interesado.cargo_rol || '',
        organizacion: interesado.organizacion || '',
        contacto: interesado.contacto || '',
        nivel_interes: interesado.nivel_interes,
        nivel_influencia: interesado.nivel_influencia,
        requisitos: interesado.requisitos || '',
        estrategia_gestion: interesado.estrategia_gestion || '',
        is_internal: interesado.is_internal,
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        nombre: '',
        cargo_rol: '',
        organizacion: '',
        contacto: '',
        nivel_interes: 'medio',
        nivel_influencia: 'media',
        requisitos: '',
        estrategia_gestion: '',
        is_internal: true,
      });
    }
  }, [interesado, proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && interesado) {
      const updateData: UpdateInteresadoDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: interesado.id, data: updateData });
    } else {
      await createMutation.mutateAsync(formData);
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
        disabled={isLoading || !formData.nombre}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Agregar Interesado'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Interesado' : 'Nuevo Interesado'}
      subtitle="Stakeholder del Proyecto"
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre del interesado"
            required
          />
          <Input
            label="Cargo / Rol"
            value={formData.cargo_rol || ''}
            onChange={(e) => setFormData({ ...formData, cargo_rol: e.target.value })}
            placeholder="Cargo o rol"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Organización"
            value={formData.organizacion || ''}
            onChange={(e) => setFormData({ ...formData, organizacion: e.target.value })}
            placeholder="Organización"
          />
          <Input
            label="Contacto"
            value={formData.contacto || ''}
            onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
            placeholder="Email, teléfono..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Nivel de Interés"
            value={formData.nivel_interes}
            onChange={(e) =>
              setFormData({
                ...formData,
                nivel_interes: e.target.value as NivelInteres,
              })
            }
            options={NIVEL_INTERES_OPTIONS}
          />
          <Select
            label="Nivel de Influencia"
            value={formData.nivel_influencia}
            onChange={(e) =>
              setFormData({
                ...formData,
                nivel_influencia: e.target.value as NivelInfluencia,
              })
            }
            options={NIVEL_INFLUENCIA_OPTIONS}
          />
        </div>

        <Textarea
          label="Requisitos / Expectativas"
          value={formData.requisitos || ''}
          onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
          placeholder="Requisitos o expectativas principales..."
          rows={2}
        />

        <Textarea
          label="Estrategia de Gestión"
          value={formData.estrategia_gestion || ''}
          onChange={(e) => setFormData({ ...formData, estrategia_gestion: e.target.value })}
          placeholder="Estrategia para gestionar este interesado..."
          rows={2}
        />

        <Checkbox
          label="Interesado interno"
          checked={formData.is_internal ?? true}
          onChange={(e) => setFormData({ ...formData, is_internal: e.target.checked })}
        />
      </form>
    </BaseModal>
  );
};
