import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { useCreateEnfermedadLaboral, useUpdateEnfermedadLaboral } from '../hooks/useAccidentalidad';
import type { EnfermedadLaboral, CreateEnfermedadLaboralDTO } from '../types/accidentalidad.types';
import { useSelectColaboradores } from '@/hooks/useSelectLists';

interface EnfermedadLaboralFormModalProps {
  item: EnfermedadLaboral | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateEnfermedadLaboralDTO = {
  trabajador_id: 0,
  cargo_trabajador: '',
  fecha_diagnostico: '',
  tipo_enfermedad: 'MUSCULOESQUELETICA',
  diagnostico_cie10: '',
  diagnostico_descripcion: '',
  factor_riesgo: '',
  tiempo_exposicion: '',
  descripcion_exposicion: '',
  requiere_investigacion: false,
};

const TIPO_ENFERMEDAD_OPTIONS = [
  { value: 'MUSCULOESQUELETICA', label: 'Musculoesquelética' },
  { value: 'RESPIRATORIA', label: 'Respiratoria' },
  { value: 'DERMATOLOGICA', label: 'Dermatológica' },
  { value: 'AUDITIVA', label: 'Auditiva' },
  { value: 'MENTAL', label: 'Mental' },
  { value: 'CARDIOVASCULAR', label: 'Cardiovascular' },
  { value: 'CANCER_OCUPACIONAL', label: 'Cáncer Ocupacional' },
  { value: 'INTOXICACION', label: 'Intoxicación' },
  { value: 'OTRA', label: 'Otra' },
];

export default function EnfermedadLaboralFormModal({
  item,
  isOpen,
  onClose,
}: EnfermedadLaboralFormModalProps) {
  const [formData, setFormData] = useState<CreateEnfermedadLaboralDTO>(INITIAL_FORM);

  const createMutation = useCreateEnfermedadLaboral();
  const updateMutation = useUpdateEnfermedadLaboral();
  const { data: colaboradores = [] } = useSelectColaboradores();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        trabajador_id: item.trabajador_id ?? 0,
        cargo_trabajador: item.cargo_trabajador || '',
        fecha_diagnostico: item.fecha_diagnostico || '',
        tipo_enfermedad: item.tipo_enfermedad || 'MUSCULOESQUELETICA',
        diagnostico_cie10: item.diagnostico_cie10 || '',
        diagnostico_descripcion: item.diagnostico_descripcion || '',
        factor_riesgo: item.factor_riesgo || '',
        tiempo_exposicion: item.tiempo_exposicion || '',
        descripcion_exposicion: item.descripcion_exposicion || '',
        requiere_investigacion: item.requiere_investigacion ?? false,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    if (!payload.trabajador_id)
      delete (payload as Partial<CreateEnfermedadLaboralDTO>).trabajador_id;
    if (!payload.diagnostico_cie10) delete payload.diagnostico_cie10;

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateEnfermedadLaboralDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Enfermedad Laboral' : 'Nueva Enfermedad Laboral'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Trabajador | Cargo */}
          <Select
            label="Trabajador *"
            value={String(formData.trabajador_id || '')}
            onChange={(e) => handleChange('trabajador_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar trabajador...</option>
            {colaboradores.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </Select>

          <Input
            label="Cargo del Trabajador *"
            value={formData.cargo_trabajador}
            onChange={(e) => handleChange('cargo_trabajador', e.target.value)}
            placeholder="Cargo al momento del diagnóstico"
            required
          />

          {/* Fila 2: Fecha de Diagnóstico | Tipo de Enfermedad */}
          <Input
            label="Fecha de Diagnóstico *"
            type="date"
            value={formData.fecha_diagnostico}
            onChange={(e) => handleChange('fecha_diagnostico', e.target.value)}
            required
          />

          <Select
            label="Tipo de Enfermedad *"
            value={formData.tipo_enfermedad}
            onChange={(e) => handleChange('tipo_enfermedad', e.target.value)}
            required
          >
            {TIPO_ENFERMEDAD_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila 3: Diagnóstico CIE-10 (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Código CIE-10"
              value={formData.diagnostico_cie10 || ''}
              onChange={(e) => handleChange('diagnostico_cie10', e.target.value)}
              placeholder="Ej: M54.5, J45, H83.3"
            />
          </div>

          {/* Fila 4: Descripción del Diagnóstico (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción del Diagnóstico *"
              value={formData.diagnostico_descripcion}
              onChange={(e) => handleChange('diagnostico_descripcion', e.target.value)}
              placeholder="Describa el diagnóstico médico de la enfermedad laboral..."
              rows={3}
              required
            />
          </div>

          {/* Fila 5: Factor de Riesgo | Tiempo de Exposición */}
          <Input
            label="Factor de Riesgo *"
            value={formData.factor_riesgo}
            onChange={(e) => handleChange('factor_riesgo', e.target.value)}
            placeholder="Ej: Ruido, posturas forzadas, químicos"
            required
          />

          <Input
            label="Tiempo de Exposición *"
            value={formData.tiempo_exposicion}
            onChange={(e) => handleChange('tiempo_exposicion', e.target.value)}
            placeholder="Ej: 5 años, 18 meses"
            required
          />

          {/* Fila 6: Descripción de la Exposición (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción de la Exposición *"
              value={formData.descripcion_exposicion}
              onChange={(e) => handleChange('descripcion_exposicion', e.target.value)}
              placeholder="Describa las condiciones de exposición al factor de riesgo..."
              rows={3}
              required
            />
          </div>

          {/* Fila 7: Checkbox */}
          <Checkbox
            checked={formData.requiere_investigacion ?? false}
            onChange={(e) => handleChange('requiere_investigacion', e.target.checked)}
            label="Requiere Investigación"
          />
        </div>

        {/* Fila de botones */}
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
              <>{item ? 'Actualizar' : 'Reportar'} Enfermedad Laboral</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
