/**
 * Modal para crear/editar Lección Aprendida
 * DS: BaseModal + Input + Textarea + Select + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useCreateLeccion, useUpdateLeccion } from '../../../hooks/useProyectos';
import type {
  LeccionAprendida,
  CreateLeccionDTO,
  UpdateLeccionDTO,
  TipoLeccion,
} from '../../../types/proyectos.types';

interface LeccionFormModalProps {
  leccion: LeccionAprendida | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const TIPO_OPTIONS = [
  { value: 'exito', label: 'Éxito' },
  { value: 'problema', label: 'Problema' },
  { value: 'mejora', label: 'Mejora' },
  { value: 'buena_practica', label: 'Buena Práctica' },
];

export const LeccionFormModal = ({
  leccion,
  proyectoId,
  isOpen,
  onClose,
}: LeccionFormModalProps) => {
  const isEditing = leccion !== null;

  const [formData, setFormData] = useState<CreateLeccionDTO>({
    proyecto: proyectoId,
    tipo: 'mejora',
    titulo: '',
    situacion: '',
    accion_tomada: '',
    resultado: '',
    recomendacion: '',
    area_conocimiento: '',
    tags: '',
  });

  const createMutation = useCreateLeccion();
  const updateMutation = useUpdateLeccion();

  useEffect(() => {
    if (leccion) {
      setFormData({
        proyecto: leccion.proyecto,
        tipo: leccion.tipo,
        titulo: leccion.titulo,
        situacion: leccion.situacion,
        accion_tomada: leccion.accion_tomada || '',
        resultado: leccion.resultado || '',
        recomendacion: leccion.recomendacion,
        area_conocimiento: leccion.area_conocimiento || '',
        tags: leccion.tags || '',
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        tipo: 'mejora',
        titulo: '',
        situacion: '',
        accion_tomada: '',
        resultado: '',
        recomendacion: '',
        area_conocimiento: '',
        tags: '',
      });
    }
  }, [leccion, proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && leccion) {
      const updateData: UpdateLeccionDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: leccion.id, data: updateData });
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
        disabled={isLoading || !formData.titulo || !formData.situacion || !formData.recomendacion}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Registrar Lección'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Lección' : 'Nueva Lección Aprendida'}
      subtitle="Documentar experiencia del proyecto"
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoLeccion })}
            options={TIPO_OPTIONS}
          />
          <Input
            label="Área de Conocimiento"
            value={formData.area_conocimiento || ''}
            onChange={(e) => setFormData({ ...formData, area_conocimiento: e.target.value })}
            placeholder="Ej: Gestión de Riesgos"
          />
        </div>

        <Input
          label="Título *"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Título descriptivo de la lección"
          required
        />

        <Textarea
          label="Situación *"
          value={formData.situacion}
          onChange={(e) => setFormData({ ...formData, situacion: e.target.value })}
          placeholder="¿Qué ocurrió? Contexto y circunstancias..."
          rows={3}
          required
        />

        <Textarea
          label="Acción Tomada"
          value={formData.accion_tomada || ''}
          onChange={(e) => setFormData({ ...formData, accion_tomada: e.target.value })}
          placeholder="¿Qué se hizo al respecto?"
          rows={2}
        />

        <Textarea
          label="Resultado"
          value={formData.resultado || ''}
          onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
          placeholder="¿Cuál fue el resultado de la acción?"
          rows={2}
        />

        <Textarea
          label="Recomendación *"
          value={formData.recomendacion}
          onChange={(e) => setFormData({ ...formData, recomendacion: e.target.value })}
          placeholder="¿Qué se recomienda para proyectos futuros?"
          rows={2}
          required
        />

        <Input
          label="Tags"
          value={formData.tags || ''}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="Separados por coma: riesgos, comunicación, equipo"
        />
      </form>
    </BaseModal>
  );
};
