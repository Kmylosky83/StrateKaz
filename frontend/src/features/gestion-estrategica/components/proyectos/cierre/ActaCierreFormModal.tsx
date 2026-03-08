/**
 * Modal para crear/editar Acta de Cierre del Proyecto
 * DS: BaseModal + Input + Textarea + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateActaCierre, useUpdateActaCierre } from '../../../hooks/useProyectos';
import type {
  ActaCierre,
  CreateActaCierreDTO,
  UpdateActaCierreDTO,
} from '../../../types/proyectos.types';

interface ActaCierreFormModalProps {
  acta: ActaCierre | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ActaCierreFormModal = ({
  acta,
  proyectoId,
  isOpen,
  onClose,
}: ActaCierreFormModalProps) => {
  const isEditing = acta !== null;

  const [formData, setFormData] = useState<CreateActaCierreDTO>({
    proyecto: proyectoId,
    fecha_cierre: new Date().toISOString().split('T')[0],
    objetivos_cumplidos: '',
    objetivos_no_cumplidos: '',
    entregables_completados: '',
    entregables_pendientes: '',
    presupuesto_final: '0',
    costo_final: '0',
    duracion_planificada_dias: 0,
    duracion_real_dias: 0,
    evaluacion_general: '',
    recomendaciones_futuras: '',
  });

  const createMutation = useCreateActaCierre();
  const updateMutation = useUpdateActaCierre();

  useEffect(() => {
    if (acta) {
      setFormData({
        proyecto: acta.proyecto,
        fecha_cierre: acta.fecha_cierre,
        objetivos_cumplidos: acta.objetivos_cumplidos,
        objetivos_no_cumplidos: acta.objetivos_no_cumplidos || '',
        entregables_completados: acta.entregables_completados,
        entregables_pendientes: acta.entregables_pendientes || '',
        presupuesto_final: acta.presupuesto_final || '0',
        costo_final: acta.costo_final || '0',
        duracion_planificada_dias: acta.duracion_planificada_dias,
        duracion_real_dias: acta.duracion_real_dias,
        evaluacion_general: acta.evaluacion_general || '',
        recomendaciones_futuras: acta.recomendaciones_futuras || '',
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        fecha_cierre: new Date().toISOString().split('T')[0],
        objetivos_cumplidos: '',
        objetivos_no_cumplidos: '',
        entregables_completados: '',
        entregables_pendientes: '',
        presupuesto_final: '0',
        costo_final: '0',
        duracion_planificada_dias: 0,
        duracion_real_dias: 0,
        evaluacion_general: '',
        recomendaciones_futuras: '',
      });
    }
  }, [acta, proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && acta) {
      const updateData: UpdateActaCierreDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: acta.id, data: updateData });
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
        disabled={isLoading || !formData.objetivos_cumplidos || !formData.entregables_completados}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Generar Acta de Cierre'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Acta de Cierre' : 'Generar Acta de Cierre'}
      subtitle="Formalización del cierre del proyecto"
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Fecha de Cierre *"
          type="date"
          value={formData.fecha_cierre}
          onChange={(e) => setFormData({ ...formData, fecha_cierre: e.target.value })}
          required
        />

        <Textarea
          label="Objetivos Cumplidos *"
          value={formData.objetivos_cumplidos}
          onChange={(e) => setFormData({ ...formData, objetivos_cumplidos: e.target.value })}
          placeholder="Listar los objetivos alcanzados..."
          rows={3}
          required
        />

        <Textarea
          label="Objetivos No Cumplidos"
          value={formData.objetivos_no_cumplidos || ''}
          onChange={(e) => setFormData({ ...formData, objetivos_no_cumplidos: e.target.value })}
          placeholder="Objetivos que no se lograron y justificación..."
          rows={2}
        />

        <Textarea
          label="Entregables Completados *"
          value={formData.entregables_completados}
          onChange={(e) => setFormData({ ...formData, entregables_completados: e.target.value })}
          placeholder="Lista de entregables finalizados..."
          rows={3}
          required
        />

        <Textarea
          label="Entregables Pendientes"
          value={formData.entregables_pendientes || ''}
          onChange={(e) => setFormData({ ...formData, entregables_pendientes: e.target.value })}
          placeholder="Entregables no completados y plan de acción..."
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Presupuesto Final"
            type="number"
            value={formData.presupuesto_final}
            onChange={(e) => setFormData({ ...formData, presupuesto_final: e.target.value })}
            min="0"
            step="0.01"
          />
          <Input
            label="Costo Final"
            type="number"
            value={formData.costo_final}
            onChange={(e) => setFormData({ ...formData, costo_final: e.target.value })}
            min="0"
            step="0.01"
          />
        </div>

        {/* Variación presupuestal live preview */}
        {(() => {
          const pf = Number(formData.presupuesto_final ?? 0);
          const cf = Number(formData.costo_final ?? 0);
          if (pf <= 0) return null;
          const variacion = ((cf - pf) / pf) * 100;
          const isOver = variacion > 0;
          return (
            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${
                isOver
                  ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                  : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
              }`}
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Variación Presupuestal
              </span>
              <span
                className={`text-base font-bold ${
                  isOver ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {isOver ? '+' : ''}
                {variacion.toFixed(1)}%{' '}
                <span className="text-xs font-normal">
                  ({isOver ? 'sobre presupuesto' : 'bajo presupuesto'})
                </span>
              </span>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Duración Planificada (días)"
            type="number"
            value={String(formData.duracion_planificada_dias)}
            onChange={(e) =>
              setFormData({ ...formData, duracion_planificada_dias: Number(e.target.value) })
            }
            min="0"
          />
          <Input
            label="Duración Real (días)"
            type="number"
            value={String(formData.duracion_real_dias)}
            onChange={(e) =>
              setFormData({ ...formData, duracion_real_dias: Number(e.target.value) })
            }
            min="0"
          />
        </div>

        <Textarea
          label="Evaluación General"
          value={formData.evaluacion_general || ''}
          onChange={(e) => setFormData({ ...formData, evaluacion_general: e.target.value })}
          placeholder="Evaluación general del desempeño del proyecto..."
          rows={3}
        />

        <Textarea
          label="Recomendaciones Futuras"
          value={formData.recomendaciones_futuras || ''}
          onChange={(e) => setFormData({ ...formData, recomendaciones_futuras: e.target.value })}
          placeholder="Recomendaciones para proyectos similares..."
          rows={2}
        />
      </form>
    </BaseModal>
  );
};
