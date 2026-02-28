import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Textarea } from '@/components/forms';
import { useCreatePlanEmergencia, useUpdatePlanEmergencia } from '../hooks/useEmergencias';
import type { PlanEmergencia } from '../types/emergencias.types';

interface PlanEmergenciaFormModalProps {
  item: PlanEmergencia | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  version: string;
  fecha_elaboracion: string;
  fecha_vigencia: string;
  fecha_revision: string;
  alcance: string;
  objetivos: string;
  director_emergencias: string;
  coordinador_emergencias: string;
  estructura_organizacional: string;
  descripcion_instalaciones: string;
  numero_personas: number;
  horarios_operacion: string;
}

const INITIAL_FORM: FormData = {
  codigo: '',
  nombre: '',
  version: '1.0',
  fecha_elaboracion: '',
  fecha_vigencia: '',
  fecha_revision: '',
  alcance: '',
  objetivos: '',
  director_emergencias: '',
  coordinador_emergencias: '',
  estructura_organizacional: '',
  descripcion_instalaciones: '',
  numero_personas: 0,
  horarios_operacion: '',
};

export default function PlanEmergenciaFormModal({
  item,
  isOpen,
  onClose,
}: PlanEmergenciaFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreatePlanEmergencia();
  const updateMutation = useUpdatePlanEmergencia();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo ?? '',
        nombre: item.nombre ?? '',
        version: item.version ?? '1.0',
        fecha_elaboracion: item.fecha_elaboracion ?? '',
        fecha_vigencia: item.fecha_vigencia ?? '',
        fecha_revision: item.fecha_revision ?? '',
        alcance: item.alcance ?? '',
        objetivos: item.objetivos ?? '',
        director_emergencias: item.director_emergencias ?? '',
        coordinador_emergencias: item.coordinador_emergencias ?? '',
        estructura_organizacional: item.estructura_organizacional ?? '',
        descripcion_instalaciones: item.descripcion_instalaciones ?? '',
        numero_personas: item.numero_personas ?? 0,
        horarios_operacion: item.horarios_operacion ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };

    if (item) {
      updateMutation.mutate(
        { id: item.id, datos: payload as Partial<FormData> },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload as FormData, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Plan de Emergencia' : 'Nuevo Plan de Emergencia'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Código | Nombre | Versión */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Auto-generado si vacío"
          />
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del plan..."
            required
          />
          <Input
            label="Versión *"
            value={formData.version}
            onChange={(e) => handleChange('version', e.target.value)}
            placeholder="1.0"
            required
          />
        </div>

        {/* Fila 2: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Elaboración *"
            type="date"
            value={formData.fecha_elaboracion}
            onChange={(e) => handleChange('fecha_elaboracion', e.target.value)}
            required
          />
          <Input
            label="Fecha Vigencia *"
            type="date"
            value={formData.fecha_vigencia}
            onChange={(e) => handleChange('fecha_vigencia', e.target.value)}
            required
          />
          <Input
            label="Fecha Revisión *"
            type="date"
            value={formData.fecha_revision}
            onChange={(e) => handleChange('fecha_revision', e.target.value)}
            required
          />
        </div>

        {/* Fila 3: Director | Coordinador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Director de Emergencias *"
            value={formData.director_emergencias}
            onChange={(e) => handleChange('director_emergencias', e.target.value)}
            placeholder="Nombre del director..."
            required
          />
          <Input
            label="Coordinador de Emergencias *"
            value={formData.coordinador_emergencias}
            onChange={(e) => handleChange('coordinador_emergencias', e.target.value)}
            placeholder="Nombre del coordinador..."
            required
          />
        </div>

        {/* Fila 4: Personas | Horarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Número de Personas"
            type="number"
            value={formData.numero_personas}
            onChange={(e) => handleChange('numero_personas', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Horarios de Operación"
            value={formData.horarios_operacion}
            onChange={(e) => handleChange('horarios_operacion', e.target.value)}
            placeholder="Ej: Lun-Vie 7:00-17:00"
          />
        </div>

        {/* Fila 5: Alcance */}
        <Textarea
          label="Alcance *"
          value={formData.alcance}
          onChange={(e) => handleChange('alcance', e.target.value)}
          placeholder="Alcance del plan de emergencia..."
          rows={2}
          required
        />

        {/* Fila 6: Objetivos */}
        <Textarea
          label="Objetivos *"
          value={formData.objetivos}
          onChange={(e) => handleChange('objetivos', e.target.value)}
          placeholder="Objetivos del plan..."
          rows={2}
          required
        />

        {/* Fila 7: Descripción Instalaciones */}
        <Textarea
          label="Descripción de Instalaciones"
          value={formData.descripcion_instalaciones}
          onChange={(e) => handleChange('descripcion_instalaciones', e.target.value)}
          placeholder="Descripción de las instalaciones cubiertas..."
          rows={2}
        />

        {/* Fila 8: Estructura Organizacional */}
        <Textarea
          label="Estructura Organizacional"
          value={formData.estructura_organizacional}
          onChange={(e) => handleChange('estructura_organizacional', e.target.value)}
          placeholder="Estructura organizacional para emergencias..."
          rows={2}
        />

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{item ? 'Actualizar' : 'Crear'} Plan</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
