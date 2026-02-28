import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateProgramaVigilancia,
  useUpdateProgramaVigilancia,
} from '../hooks/useMedicinaLaboral';
import type { ProgramaVigilancia } from '../hooks/useMedicinaLaboral';
import { TIPO_PROGRAMA_VIGILANCIA_OPTIONS } from '../types/medicina-laboral.types';

interface ProgramaVigilanciaFormModalProps {
  item: ProgramaVigilancia | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  tipo: string;
  descripcion: string;
  objetivo: string;
  alcance: string;
  frecuencia_evaluacion_meses: number;
  fecha_inicio: string;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  nombre: '',
  tipo: 'OSTEOMUSCULAR',
  descripcion: '',
  objetivo: '',
  alcance: '',
  frecuencia_evaluacion_meses: 12,
  fecha_inicio: '',
  observaciones: '',
};

export default function ProgramaVigilanciaFormModal({
  item,
  isOpen,
  onClose,
}: ProgramaVigilanciaFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateProgramaVigilancia();
  const updateMutation = useUpdateProgramaVigilancia();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        nombre: item.nombre ?? '',
        tipo: item.tipo ?? 'OSTEOMUSCULAR',
        descripcion: item.descripcion ?? '',
        objetivo: item.objetivo ?? '',
        alcance: item.alcance ?? '',
        frecuencia_evaluacion_meses: item.frecuencia_evaluacion_meses ?? 12,
        fecha_inicio: item.fecha_inicio ?? '',
        observaciones: item.observaciones ?? '',
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
      title={item ? 'Editar Programa de Vigilancia' : 'Nuevo Programa de Vigilancia'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Nombre | Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Programa *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: PVE Osteomuscular"
            required
          />
          <Select
            label="Tipo de Programa *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            required
          >
            {TIPO_PROGRAMA_VIGILANCIA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 2: Objetivo */}
        <Textarea
          label="Objetivo *"
          value={formData.objetivo}
          onChange={(e) => handleChange('objetivo', e.target.value)}
          placeholder="Objetivo del programa de vigilancia..."
          rows={2}
          required
        />

        {/* Fila 3: Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del programa..."
          rows={2}
        />

        {/* Fila 4: Alcance */}
        <Textarea
          label="Alcance"
          value={formData.alcance}
          onChange={(e) => handleChange('alcance', e.target.value)}
          placeholder="Población y áreas cubiertas..."
          rows={2}
        />

        {/* Fila 5: Frecuencia | Fecha inicio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Frecuencia Evaluación (meses) *"
            type="number"
            value={formData.frecuencia_evaluacion_meses}
            onChange={(e) =>
              handleChange('frecuencia_evaluacion_meses', parseInt(e.target.value) || 12)
            }
            required
          />
          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />
        </div>

        {/* Fila 6: Observaciones */}
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
              <>{item ? 'Actualizar' : 'Crear'} Programa</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
