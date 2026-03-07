/**
 * Modal para crear/editar Recurso del Proyecto
 * DS: BaseModal + Input + Textarea + Select + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { useCreateRecurso, useUpdateRecurso } from '../../../hooks/useProyectos';
import type {
  RecursoProyecto,
  CreateRecursoDTO,
  UpdateRecursoDTO,
  TipoRecurso,
} from '../../../types/proyectos.types';

interface RecursoFormModalProps {
  recurso: RecursoProyecto | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const TIPO_OPTIONS = [
  { value: 'humano', label: 'Humano' },
  { value: 'material', label: 'Material' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'servicio', label: 'Servicio' },
];

export const RecursoFormModal = ({
  recurso,
  proyectoId,
  isOpen,
  onClose,
}: RecursoFormModalProps) => {
  const isEditing = recurso !== null;
  const { data: users = [] } = useSelectUsers();

  const [formData, setFormData] = useState<CreateRecursoDTO>({
    proyecto: proyectoId,
    tipo: 'humano',
    nombre: '',
    descripcion: '',
    usuario: undefined,
    rol_proyecto: '',
    dedicacion_porcentaje: 100,
    costo_unitario: '0',
    cantidad: '1',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const createMutation = useCreateRecurso();
  const updateMutation = useUpdateRecurso();

  useEffect(() => {
    if (recurso) {
      setFormData({
        proyecto: recurso.proyecto,
        tipo: recurso.tipo,
        nombre: recurso.nombre,
        descripcion: recurso.descripcion || '',
        usuario: recurso.usuario || undefined,
        rol_proyecto: recurso.rol_proyecto || '',
        dedicacion_porcentaje: recurso.dedicacion_porcentaje,
        costo_unitario: recurso.costo_unitario || '0',
        cantidad: recurso.cantidad || '1',
        fecha_inicio: recurso.fecha_inicio || '',
        fecha_fin: recurso.fecha_fin || '',
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        tipo: 'humano',
        nombre: '',
        descripcion: '',
        usuario: undefined,
        rol_proyecto: '',
        dedicacion_porcentaje: 100,
        costo_unitario: '0',
        cantidad: '1',
        fecha_inicio: '',
        fecha_fin: '',
      });
    }
  }, [recurso, proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && recurso) {
      const updateData: UpdateRecursoDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: recurso.id, data: updateData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const userOptions = [
    { value: '', label: 'No aplica' },
    ...users.map((u) => ({ value: String(u.id), label: u.label })),
  ];

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
        {isEditing ? 'Guardar Cambios' : 'Agregar Recurso'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Recurso' : 'Nuevo Recurso'}
      subtitle="Recurso del proyecto"
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoRecurso })}
            options={TIPO_OPTIONS}
          />
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre del recurso"
            required
          />
        </div>

        <Textarea
          label="Descripción"
          value={formData.descripcion || ''}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripción del recurso..."
          rows={2}
        />

        {formData.tipo === 'humano' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Usuario"
              value={formData.usuario ? String(formData.usuario) : ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  usuario: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              options={userOptions}
            />
            <Input
              label="Rol en el Proyecto"
              value={formData.rol_proyecto || ''}
              onChange={(e) => setFormData({ ...formData, rol_proyecto: e.target.value })}
              placeholder="Rol del recurso"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Dedicación %"
            type="number"
            value={String(formData.dedicacion_porcentaje ?? 100)}
            onChange={(e) =>
              setFormData({ ...formData, dedicacion_porcentaje: Number(e.target.value) })
            }
            min="0"
            max="100"
          />
          <Input
            label="Costo Unitario"
            type="number"
            value={formData.costo_unitario || '0'}
            onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })}
            min="0"
            step="0.01"
          />
          <Input
            label="Cantidad"
            type="number"
            value={formData.cantidad || '1'}
            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
            min="0"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio"
            type="date"
            value={formData.fecha_inicio || ''}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={formData.fecha_fin || ''}
            onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
          />
        </div>
      </form>
    </BaseModal>
  );
};
