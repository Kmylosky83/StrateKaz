/**
 * Modal para crear/editar Project Charter (Acta de Constitución)
 * DS: BaseModal + Input + Textarea + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateCharter, useUpdateCharter } from '../../../hooks/useProyectos';
import type {
  ProjectCharter,
  CreateCharterDTO,
  UpdateCharterDTO,
} from '../../../types/proyectos.types';

interface CharterFormModalProps {
  charter: ProjectCharter | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateCharterDTO = {
  proyecto: 0,
  proposito: '',
  objetivos_medibles: '',
  requisitos_alto_nivel: '',
  descripcion_alto_nivel: '',
  supuestos: '',
  restricciones: '',
  hitos_clave: '',
  riesgos_alto_nivel: '',
  resumen_presupuesto: '',
  resumen_cronograma: '',
  criterios_exito: '',
};

export const CharterFormModal = ({
  charter,
  proyectoId,
  isOpen,
  onClose,
}: CharterFormModalProps) => {
  const isEditing = charter !== null;
  const [formData, setFormData] = useState<CreateCharterDTO>({ ...INITIAL_FORM });

  const createMutation = useCreateCharter();
  const updateMutation = useUpdateCharter();

  useEffect(() => {
    if (charter) {
      setFormData({
        proyecto: charter.proyecto,
        proposito: charter.proposito,
        objetivos_medibles: charter.objetivos_medibles,
        requisitos_alto_nivel: charter.requisitos_alto_nivel || '',
        descripcion_alto_nivel: charter.descripcion_alto_nivel || '',
        supuestos: charter.supuestos || '',
        restricciones: charter.restricciones || '',
        hitos_clave: charter.hitos_clave || '',
        riesgos_alto_nivel: charter.riesgos_alto_nivel || '',
        resumen_presupuesto: charter.resumen_presupuesto || '',
        resumen_cronograma: charter.resumen_cronograma || '',
        criterios_exito: charter.criterios_exito || '',
      });
    } else {
      setFormData({ ...INITIAL_FORM, proyecto: proyectoId });
    }
  }, [charter, proyectoId]);

  const handleChange = (field: keyof CreateCharterDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && charter) {
      const updateData: UpdateCharterDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: charter.id, data: updateData });
    } else {
      await createMutation.mutateAsync({ ...formData, proyecto: proyectoId });
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
        disabled={isLoading || !formData.proposito || !formData.objetivos_medibles}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Charter'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Project Charter' : 'Nuevo Project Charter'}
      subtitle="Acta de Constitución del Proyecto"
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campos obligatorios */}
        <Textarea
          label="Propósito del Proyecto *"
          value={formData.proposito}
          onChange={(e) => handleChange('proposito', e.target.value)}
          placeholder="Justificación y propósito del proyecto..."
          rows={3}
          required
        />

        <Textarea
          label="Objetivos Medibles *"
          value={formData.objetivos_medibles}
          onChange={(e) => handleChange('objetivos_medibles', e.target.value)}
          placeholder="Objetivos SMART del proyecto..."
          rows={3}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Requisitos de Alto Nivel"
            value={formData.requisitos_alto_nivel || ''}
            onChange={(e) => handleChange('requisitos_alto_nivel', e.target.value)}
            placeholder="Requisitos principales..."
            rows={3}
          />
          <Textarea
            label="Descripción de Alto Nivel"
            value={formData.descripcion_alto_nivel || ''}
            onChange={(e) => handleChange('descripcion_alto_nivel', e.target.value)}
            placeholder="Descripción general del alcance..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Supuestos"
            value={formData.supuestos || ''}
            onChange={(e) => handleChange('supuestos', e.target.value)}
            placeholder="Supuestos del proyecto..."
            rows={3}
          />
          <Textarea
            label="Restricciones"
            value={formData.restricciones || ''}
            onChange={(e) => handleChange('restricciones', e.target.value)}
            placeholder="Restricciones del proyecto..."
            rows={3}
          />
        </div>

        <Textarea
          label="Hitos Clave"
          value={formData.hitos_clave || ''}
          onChange={(e) => handleChange('hitos_clave', e.target.value)}
          placeholder="Hitos principales del proyecto..."
          rows={2}
        />

        <Textarea
          label="Riesgos de Alto Nivel"
          value={formData.riesgos_alto_nivel || ''}
          onChange={(e) => handleChange('riesgos_alto_nivel', e.target.value)}
          placeholder="Riesgos principales identificados..."
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Resumen de Presupuesto"
            value={formData.resumen_presupuesto || ''}
            onChange={(e) => handleChange('resumen_presupuesto', e.target.value)}
            placeholder="Estimación de costos..."
            rows={2}
          />
          <Textarea
            label="Resumen de Cronograma"
            value={formData.resumen_cronograma || ''}
            onChange={(e) => handleChange('resumen_cronograma', e.target.value)}
            placeholder="Cronograma estimado..."
            rows={2}
          />
        </div>

        <Textarea
          label="Criterios de Éxito"
          value={formData.criterios_exito || ''}
          onChange={(e) => handleChange('criterios_exito', e.target.value)}
          placeholder="Criterios para determinar el éxito del proyecto..."
          rows={2}
        />
      </form>
    </BaseModal>
  );
};
