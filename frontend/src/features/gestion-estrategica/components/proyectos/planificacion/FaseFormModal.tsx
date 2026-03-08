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
    fecha_inicio_real: '',
    fecha_fin_real: '',
    porcentaje_avance: 0,
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
        fecha_inicio_real: fase.fecha_inicio_real || '',
        fecha_fin_real: fase.fecha_fin_real || '',
        porcentaje_avance: fase.porcentaje_avance ?? 0,
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
        fecha_inicio_real: '',
        fecha_fin_real: '',
        porcentaje_avance: 0,
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

        {/* Progreso y Ejecución Real */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Progreso y Ejecución Real
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Avance (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.porcentaje_avance ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, porcentaje_avance: Number(e.target.value) })
                }
                className="flex-1 accent-primary-600"
              />
              <span className="text-sm font-bold w-12 text-right text-primary-600 dark:text-primary-400">
                {formData.porcentaje_avance ?? 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${formData.porcentaje_avance ?? 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio Real"
              type="date"
              value={formData.fecha_inicio_real || ''}
              onChange={(e) => setFormData({ ...formData, fecha_inicio_real: e.target.value })}
            />
            <Input
              label="Fecha Fin Real"
              type="date"
              value={formData.fecha_fin_real || ''}
              onChange={(e) => setFormData({ ...formData, fecha_fin_real: e.target.value })}
            />
          </div>
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
