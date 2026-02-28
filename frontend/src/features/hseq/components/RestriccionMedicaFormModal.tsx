import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateRestriccion, useUpdateRestriccion } from '../hooks/useMedicinaLaboral';
import type { RestriccionMedica } from '../hooks/useMedicinaLaboral';
import { useSelectColaboradores } from '@/hooks/useSelectLists';
import {
  TIPO_RESTRICCION_OPTIONS,
  CATEGORIA_RESTRICCION_OPTIONS,
} from '../types/medicina-laboral.types';

interface RestriccionMedicaFormModalProps {
  item: RestriccionMedica | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  colaborador_id: number;
  tipo_restriccion: string;
  categoria: string;
  descripcion: string;
  actividades_restringidas: string;
  fecha_inicio: string;
  fecha_fin: string;
  medico_ordena: string;
  licencia_medica: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  colaborador_id: 0,
  tipo_restriccion: 'TEMPORAL',
  categoria: 'CARGA',
  descripcion: '',
  actividades_restringidas: '',
  fecha_inicio: '',
  fecha_fin: '',
  medico_ordena: '',
  licencia_medica: '',
  observaciones: '',
};

export default function RestriccionMedicaFormModal({
  item,
  isOpen,
  onClose,
}: RestriccionMedicaFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateRestriccion();
  const updateMutation = useUpdateRestriccion();
  const { data: colaboradores } = useSelectColaboradores();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const colaboradoresArray = Array.isArray(colaboradores) ? colaboradores : [];

  useEffect(() => {
    if (item) {
      setFormData({
        colaborador_id: item.colaborador_id,
        tipo_restriccion: item.tipo_restriccion,
        categoria: item.categoria,
        descripcion: item.descripcion ?? '',
        actividades_restringidas: item.actividades_restringidas ?? '',
        fecha_inicio: item.fecha_inicio ?? '',
        fecha_fin: item.fecha_fin ?? '',
        medico_ordena: item.medico_ordena ?? '',
        licencia_medica: item.licencia_medica ?? '',
        observaciones: item.observaciones ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.colaborador_id) delete payload.colaborador_id;

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
      title={item ? 'Editar Restricción Médica' : 'Nueva Restricción Médica'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Colaborador */}
        <Select
          label="Colaborador *"
          value={formData.colaborador_id}
          onChange={(e) => handleChange('colaborador_id', parseInt(e.target.value))}
          required
        >
          <option value={0}>Seleccionar colaborador...</option>
          {colaboradoresArray.map((col) => (
            <option key={col.value} value={col.value}>
              {col.label}
            </option>
          ))}
        </Select>

        {/* Fila 2: Tipo | Categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Restricción *"
            value={formData.tipo_restriccion}
            onChange={(e) => handleChange('tipo_restriccion', e.target.value)}
            required
          >
            {TIPO_RESTRICCION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            required
          >
            {CATEGORIA_RESTRICCION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 3: Descripción */}
        <Textarea
          label="Descripción *"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción de la restricción médica..."
          rows={3}
          required
        />

        {/* Fila 4: Actividades restringidas */}
        <Textarea
          label="Actividades Restringidas *"
          value={formData.actividades_restringidas}
          onChange={(e) => handleChange('actividades_restringidas', e.target.value)}
          placeholder="Actividades que el colaborador no debe realizar..."
          rows={2}
          required
        />

        {/* Fila 5: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
          />
        </div>

        {/* Fila 6: Médico | Licencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Médico que Ordena *"
            value={formData.medico_ordena}
            onChange={(e) => handleChange('medico_ordena', e.target.value)}
            placeholder="Nombre del médico..."
            required
          />
          <Input
            label="Licencia Médica"
            value={formData.licencia_medica}
            onChange={(e) => handleChange('licencia_medica', e.target.value)}
            placeholder="Número de licencia..."
          />
        </div>

        {/* Fila 7: Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Observaciones adicionales..."
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
              <>{item ? 'Actualizar' : 'Crear'} Restricción</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
