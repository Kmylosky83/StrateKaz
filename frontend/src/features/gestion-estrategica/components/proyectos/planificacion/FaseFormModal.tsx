/**
 * Modal para crear/editar Fase del Proyecto
 * DS: BaseModal + Input + Textarea + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateFase, useUpdateFase } from '../../../hooks/useProyectos';
import type { FaseProyecto, CreateFaseDTO, UpdateFaseDTO } from '../../../types/proyectos.types';

interface FaseFormModalProps {
  fase: FaseProyecto | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const FaseFormModal = ({ fase, proyectoId, isOpen, onClose }: FaseFormModalProps) => {
  const isEditing = fase !== null;

  const [formData, setFormData] = useState<CreateFaseDTO>({
    proyecto: proyectoId,
    nombre: '',
    descripcion: '',
    orden: 1,
    fecha_inicio_plan: '',
    fecha_fin_plan: '',
    entregables: '',
  });

  const createMutation = useCreateFase();
  const updateMutation = useUpdateFase();

  useEffect(() => {
    if (fase) {
      setFormData({
        proyecto: fase.proyecto,
        nombre: fase.nombre,
        descripcion: fase.descripcion || '',
        orden: fase.orden,
        fecha_inicio_plan: fase.fecha_inicio_plan || '',
        fecha_fin_plan: fase.fecha_fin_plan || '',
        entregables: fase.entregables || '',
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        nombre: '',
        descripcion: '',
        orden: 1,
        fecha_inicio_plan: '',
        fecha_fin_plan: '',
        entregables: '',
      });
    }
  }, [fase, proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && fase) {
      const updateData: UpdateFaseDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: fase.id, data: updateData });
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
        {isEditing ? 'Guardar Cambios' : 'Crear Fase'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Fase' : 'Nueva Fase'}
      subtitle="Fase del proyecto (WBS nivel 1)"
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre de la fase"
            required
          />
          <Input
            label="Orden"
            type="number"
            value={String(formData.orden ?? 1)}
            onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
            min="1"
          />
        </div>

        <Textarea
          label="Descripción"
          value={formData.descripcion || ''}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripción de la fase..."
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio Plan"
            type="date"
            value={formData.fecha_inicio_plan || ''}
            onChange={(e) => setFormData({ ...formData, fecha_inicio_plan: e.target.value })}
          />
          <Input
            label="Fecha Fin Plan"
            type="date"
            value={formData.fecha_fin_plan || ''}
            onChange={(e) => setFormData({ ...formData, fecha_fin_plan: e.target.value })}
          />
        </div>

        <Textarea
          label="Entregables"
          value={formData.entregables || ''}
          onChange={(e) => setFormData({ ...formData, entregables: e.target.value })}
          placeholder="Entregables de la fase (uno por línea)..."
          rows={3}
        />
      </form>
    </BaseModal>
  );
};
