import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateCasoVigilancia,
  useUpdateCasoVigilancia,
  useProgramasVigilancia,
} from '../hooks/useMedicinaLaboral';
import type { CasoVigilancia } from '../hooks/useMedicinaLaboral';
import { useSelectColaboradores } from '@/hooks/useSelectLists';
import { SEVERIDAD_CASO_OPTIONS } from '../types/medicina-laboral.types';

interface CasoVigilanciaFormModalProps {
  item: CasoVigilancia | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  programa: number;
  colaborador_id: number;
  fecha_apertura: string;
  descripcion_caso: string;
  severidad: string;
  factores_riesgo_identificados: string;
  exposicion_laboral: string;
  plan_intervencion: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  programa: 0,
  colaborador_id: 0,
  fecha_apertura: '',
  descripcion_caso: '',
  severidad: 'LEVE',
  factores_riesgo_identificados: '',
  exposicion_laboral: '',
  plan_intervencion: '',
  observaciones: '',
};

export default function CasoVigilanciaFormModal({
  item,
  isOpen,
  onClose,
}: CasoVigilanciaFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateCasoVigilancia();
  const updateMutation = useUpdateCasoVigilancia();
  const { data: programasData } = useProgramasVigilancia();
  const { data: colaboradores } = useSelectColaboradores();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const programas = Array.isArray(programasData)
    ? programasData
    : ((programasData as unknown as { results?: unknown[] })?.results ?? []);
  const colaboradoresArray = Array.isArray(colaboradores) ? colaboradores : [];

  useEffect(() => {
    if (item) {
      setFormData({
        programa: item.programa,
        colaborador_id: item.colaborador_id,
        fecha_apertura: item.fecha_apertura ?? '',
        descripcion_caso: item.descripcion_caso ?? '',
        severidad: item.severidad ?? 'LEVE',
        factores_riesgo_identificados: item.factores_riesgo_identificados ?? '',
        exposicion_laboral: item.exposicion_laboral ?? '',
        plan_intervencion: item.plan_intervencion ?? '',
        observaciones: item.observaciones ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.programa) delete payload.programa;
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
      title={item ? 'Editar Caso de Vigilancia' : 'Nuevo Caso de Vigilancia'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Programa | Colaborador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Programa de Vigilancia *"
            value={formData.programa}
            onChange={(e) => handleChange('programa', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar programa...</option>
            {(programas as Array<{ id: number; nombre: string; codigo: string }>).map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.codigo} - {prog.nombre}
              </option>
            ))}
          </Select>

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
        </div>

        {/* Fila 2: Fecha | Severidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Apertura *"
            type="date"
            value={formData.fecha_apertura}
            onChange={(e) => handleChange('fecha_apertura', e.target.value)}
            required
          />
          <Select
            label="Severidad *"
            value={formData.severidad}
            onChange={(e) => handleChange('severidad', e.target.value)}
            required
          >
            {SEVERIDAD_CASO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 3: Descripción del caso */}
        <Textarea
          label="Descripción del Caso *"
          value={formData.descripcion_caso}
          onChange={(e) => handleChange('descripcion_caso', e.target.value)}
          placeholder="Descripción detallada del caso de vigilancia..."
          rows={3}
          required
        />

        {/* Fila 4: Factores de riesgo */}
        <Textarea
          label="Factores de Riesgo Identificados"
          value={formData.factores_riesgo_identificados}
          onChange={(e) => handleChange('factores_riesgo_identificados', e.target.value)}
          placeholder="Factores de riesgo asociados..."
          rows={2}
        />

        {/* Fila 5: Exposición laboral */}
        <Textarea
          label="Exposición Laboral"
          value={formData.exposicion_laboral}
          onChange={(e) => handleChange('exposicion_laboral', e.target.value)}
          placeholder="Descripción de la exposición laboral..."
          rows={2}
        />

        {/* Fila 6: Plan de intervención */}
        <Textarea
          label="Plan de Intervención"
          value={formData.plan_intervencion}
          onChange={(e) => handleChange('plan_intervencion', e.target.value)}
          placeholder="Acciones planificadas para el caso..."
          rows={2}
        />

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
              <>{item ? 'Actualizar' : 'Crear'} Caso</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
