/**
 * Modal para crear/editar Riesgo del Proyecto
 * DS: BaseModal + Input + Textarea + Select + Checkbox + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { useCreateRiesgo, useUpdateRiesgo } from '../../../hooks/useProyectos';
import type {
  RiesgoProyecto,
  CreateRiesgoDTO,
  UpdateRiesgoDTO,
  TipoRiesgoProyecto,
  ProbabilidadRiesgo,
  ImpactoRiesgo,
  EstrategiaRespuesta,
} from '../../../types/proyectos.types';

interface RiesgoFormModalProps {
  riesgo: RiesgoProyecto | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const TIPO_OPTIONS = [
  { value: 'amenaza', label: 'Amenaza' },
  { value: 'oportunidad', label: 'Oportunidad' },
];

const PROBABILIDAD_OPTIONS = [
  { value: 'muy_alta', label: 'Muy Alta' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
  { value: 'muy_baja', label: 'Muy Baja' },
];

const IMPACTO_OPTIONS = [
  { value: 'muy_alto', label: 'Muy Alto' },
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Medio' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'muy_bajo', label: 'Muy Bajo' },
];

const ESTRATEGIA_OPTIONS = [
  { value: '', label: 'Sin definir' },
  { value: 'evitar', label: 'Evitar' },
  { value: 'transferir', label: 'Transferir' },
  { value: 'mitigar', label: 'Mitigar' },
  { value: 'aceptar', label: 'Aceptar' },
  { value: 'explotar', label: 'Explotar' },
  { value: 'compartir', label: 'Compartir' },
  { value: 'mejorar', label: 'Mejorar' },
];

export const RiesgoFormModal = ({ riesgo, proyectoId, isOpen, onClose }: RiesgoFormModalProps) => {
  const isEditing = riesgo !== null;
  const { data: users = [] } = useSelectUsers();

  const [formData, setFormData] = useState<CreateRiesgoDTO>({
    proyecto: proyectoId,
    codigo: '',
    tipo: 'amenaza',
    descripcion: '',
    causa: '',
    efecto: '',
    probabilidad: 'media',
    impacto: 'medio',
    estrategia: undefined,
    plan_respuesta: '',
    responsable: undefined,
  });

  const createMutation = useCreateRiesgo();
  const updateMutation = useUpdateRiesgo();

  useEffect(() => {
    if (riesgo) {
      setFormData({
        proyecto: riesgo.proyecto,
        codigo: riesgo.codigo,
        tipo: riesgo.tipo,
        descripcion: riesgo.descripcion,
        causa: riesgo.causa || '',
        efecto: riesgo.efecto || '',
        probabilidad: riesgo.probabilidad,
        impacto: riesgo.impacto,
        estrategia: riesgo.estrategia || undefined,
        plan_respuesta: riesgo.plan_respuesta || '',
        responsable: riesgo.responsable || undefined,
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        codigo: '',
        tipo: 'amenaza',
        descripcion: '',
        causa: '',
        efecto: '',
        probabilidad: 'media',
        impacto: 'medio',
        estrategia: undefined,
        plan_respuesta: '',
        responsable: undefined,
      });
    }
  }, [riesgo, proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && riesgo) {
      const updateData: UpdateRiesgoDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: riesgo.id, data: updateData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const userOptions = [
    { value: '', label: 'Sin asignar' },
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
        disabled={isLoading || !formData.codigo || !formData.descripcion}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Registrar Riesgo'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Riesgo' : 'Nuevo Riesgo'}
      subtitle="Riesgo del proyecto"
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Código *"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            placeholder="R-001"
            required
          />
          <Select
            label="Tipo"
            value={formData.tipo || 'amenaza'}
            onChange={(e) =>
              setFormData({ ...formData, tipo: e.target.value as TipoRiesgoProyecto })
            }
            options={TIPO_OPTIONS}
          />
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
        </div>

        <Textarea
          label="Descripción *"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripción del riesgo..."
          rows={2}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Causa"
            value={formData.causa || ''}
            onChange={(e) => setFormData({ ...formData, causa: e.target.value })}
            placeholder="Causa raíz del riesgo..."
            rows={2}
          />
          <Textarea
            label="Efecto"
            value={formData.efecto || ''}
            onChange={(e) => setFormData({ ...formData, efecto: e.target.value })}
            placeholder="Efecto o consecuencia..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Probabilidad"
            value={formData.probabilidad || 'media'}
            onChange={(e) =>
              setFormData({ ...formData, probabilidad: e.target.value as ProbabilidadRiesgo })
            }
            options={PROBABILIDAD_OPTIONS}
          />
          <Select
            label="Impacto"
            value={formData.impacto || 'medio'}
            onChange={(e) => setFormData({ ...formData, impacto: e.target.value as ImpactoRiesgo })}
            options={IMPACTO_OPTIONS}
          />
          <Select
            label="Estrategia de Respuesta"
            value={formData.estrategia || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                estrategia: (e.target.value || undefined) as EstrategiaRespuesta | undefined,
              })
            }
            options={ESTRATEGIA_OPTIONS}
          />
        </div>

        <Textarea
          label="Plan de Respuesta"
          value={formData.plan_respuesta || ''}
          onChange={(e) => setFormData({ ...formData, plan_respuesta: e.target.value })}
          placeholder="Plan de acción ante el riesgo..."
          rows={2}
        />
      </form>
    </BaseModal>
  );
};
