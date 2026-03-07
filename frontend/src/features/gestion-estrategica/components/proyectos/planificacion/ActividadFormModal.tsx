/**
 * Modal para crear/editar Actividad del Proyecto
 * DS: BaseModal + Input + Textarea + Select + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useSelectUsers } from '@/hooks/useSelectLists';
import {
  useCreateActividad,
  useUpdateActividad,
  useFases,
  useActividades,
} from '../../../hooks/useProyectos';
import type {
  ActividadProyecto,
  CreateActividadDTO,
  UpdateActividadDTO,
} from '../../../types/proyectos.types';

interface ActividadFormModalProps {
  actividad: ActividadProyecto | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
  defaultKanbanColumn?: string;
}

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'bloqueada', label: 'Bloqueada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const KANBAN_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Por Hacer' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'review', label: 'Revisión' },
  { value: 'done', label: 'Completado' },
];

export const ActividadFormModal = ({
  actividad,
  proyectoId,
  isOpen,
  onClose,
  defaultKanbanColumn,
}: ActividadFormModalProps) => {
  const isEditing = actividad !== null;

  const { data: users = [] } = useSelectUsers();
  const { data: fasesData } = useFases({ proyecto: proyectoId, is_active: true });
  const { data: actividadesData } = useActividades({ proyecto: proyectoId, is_active: true });

  const fases = fasesData?.results ?? (Array.isArray(fasesData) ? fasesData : []);
  const actividades =
    actividadesData?.results ?? (Array.isArray(actividadesData) ? actividadesData : []);

  const [formData, setFormData] = useState<CreateActividadDTO>({
    proyecto: proyectoId,
    nombre: '',
    codigo_wbs: '',
    descripcion: '',
    estado: 'pendiente',
    fase: undefined,
    fecha_inicio_plan: '',
    fecha_fin_plan: '',
    duracion_estimada_dias: 1,
    esfuerzo_estimado_horas: '',
    responsable: undefined,
    predecesoras: [],
    prioridad: 5,
    notas: '',
    kanban_column: (defaultKanbanColumn as CreateActividadDTO['kanban_column']) || 'backlog',
  });

  const createMutation = useCreateActividad();
  const updateMutation = useUpdateActividad();

  useEffect(() => {
    if (actividad) {
      setFormData({
        proyecto: actividad.proyecto,
        nombre: actividad.nombre,
        codigo_wbs: actividad.codigo_wbs || '',
        descripcion: actividad.descripcion || '',
        estado: actividad.estado,
        fase: actividad.fase || undefined,
        fecha_inicio_plan: actividad.fecha_inicio_plan || '',
        fecha_fin_plan: actividad.fecha_fin_plan || '',
        duracion_estimada_dias: actividad.duracion_estimada_dias || 1,
        esfuerzo_estimado_horas: actividad.esfuerzo_estimado_horas || '',
        responsable: actividad.responsable || undefined,
        predecesoras: actividad.predecesoras || [],
        prioridad: actividad.prioridad,
        notas: actividad.notas || '',
        kanban_column: actividad.kanban_column,
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        nombre: '',
        codigo_wbs: '',
        descripcion: '',
        estado: 'pendiente',
        fase: undefined,
        fecha_inicio_plan: '',
        fecha_fin_plan: '',
        duracion_estimada_dias: 1,
        esfuerzo_estimado_horas: '',
        responsable: undefined,
        predecesoras: [],
        prioridad: 5,
        notas: '',
        kanban_column: (defaultKanbanColumn as CreateActividadDTO['kanban_column']) || 'backlog',
      });
    }
  }, [actividad, proyectoId, defaultKanbanColumn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && actividad) {
      const updateData: UpdateActividadDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: actividad.id, data: updateData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const userOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map((u) => ({ value: String(u.value), label: u.label })),
  ];

  const faseOptions = [
    { value: '', label: 'Sin fase' },
    ...fases.map((f) => ({ value: String(f.id), label: `${f.orden}. ${f.nombre}` })),
  ];

  // Exclude current activity from predecessors list
  const predecessorOptions = actividades
    .filter((a) => a.id !== actividad?.id)
    .map((a) => ({ value: String(a.id), label: `${a.codigo_wbs || ''} ${a.nombre}`.trim() }));

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
        {isEditing ? 'Guardar Cambios' : 'Crear Actividad'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
      subtitle="Actividad del proyecto"
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la actividad"
              required
            />
          </div>
          <Input
            label="Código WBS"
            value={formData.codigo_wbs || ''}
            onChange={(e) => setFormData({ ...formData, codigo_wbs: e.target.value })}
            placeholder="1.1.1"
          />
        </div>

        <Textarea
          label="Descripción"
          value={formData.descripcion || ''}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripción de la actividad..."
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Fase"
            value={formData.fase ? String(formData.fase) : ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                fase: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            options={faseOptions}
          />
          <Select
            label="Estado"
            value={formData.estado || 'pendiente'}
            onChange={(e) =>
              setFormData({
                ...formData,
                estado: e.target.value as CreateActividadDTO['estado'],
              })
            }
            options={ESTADO_OPTIONS}
          />
          <Select
            label="Columna Kanban"
            value={formData.kanban_column || 'backlog'}
            onChange={(e) =>
              setFormData({
                ...formData,
                kanban_column: e.target.value as CreateActividadDTO['kanban_column'],
              })
            }
            options={KANBAN_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Responsable"
            value={formData.responsable ? String(formData.responsable) : ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                responsable: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            options={userOptions}
          />
          <Input
            label="Prioridad (1-10)"
            type="number"
            value={String(formData.prioridad ?? 5)}
            onChange={(e) => setFormData({ ...formData, prioridad: Number(e.target.value) })}
            min="1"
            max="10"
          />
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Duración Estimada (días)"
            type="number"
            value={String(formData.duracion_estimada_dias ?? 1)}
            onChange={(e) =>
              setFormData({ ...formData, duracion_estimada_dias: Number(e.target.value) })
            }
            min="1"
          />
          <Input
            label="Esfuerzo Estimado (horas)"
            type="number"
            value={formData.esfuerzo_estimado_horas || ''}
            onChange={(e) => setFormData({ ...formData, esfuerzo_estimado_horas: e.target.value })}
            min="0"
            step="0.5"
          />
        </div>

        {predecessorOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Predecesoras
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-32 overflow-y-auto p-2 space-y-1">
              {predecessorOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.predecesoras?.includes(Number(opt.value)) || false}
                    onChange={(e) => {
                      const id = Number(opt.value);
                      setFormData((prev) => ({
                        ...prev,
                        predecesoras: e.target.checked
                          ? [...(prev.predecesoras || []), id]
                          : (prev.predecesoras || []).filter((p) => p !== id),
                      }));
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Textarea
          label="Notas"
          value={formData.notas || ''}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          placeholder="Notas adicionales..."
          rows={2}
        />
      </form>
    </BaseModal>
  );
};
