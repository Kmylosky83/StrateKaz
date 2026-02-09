/**
 * Modal para crear/editar Ficha Técnica de KPI
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useCreateFichaTecnica, useUpdateFichaTecnica } from '../hooks/useAnalytics';
import type { FichaTecnicaKPI, CatalogoKPI } from '../types';

interface FichaTecnicaFormModalProps {
  item: FichaTecnicaKPI | null;
  kpis: CatalogoKPI[];
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  kpi: string;
  formula: string;
  variables: string;
  fuente_datos: string;
  responsable_medicion: string;
  responsable_analisis: string;
  proceso_relacionado: string;
  objetivo_estrategico: string;
  interpretacion: string;
  limitaciones: string;
}

const INITIAL_FORM: FormData = {
  kpi: '',
  formula: '',
  variables: '',
  fuente_datos: '',
  responsable_medicion: '',
  responsable_analisis: '',
  proceso_relacionado: '',
  objetivo_estrategico: '',
  interpretacion: '',
  limitaciones: '',
};

export const FichaTecnicaFormModal = ({
  item,
  kpis,
  isOpen,
  onClose,
}: FichaTecnicaFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createFicha = useCreateFichaTecnica();
  const updateFicha = useUpdateFichaTecnica();

  const isEditing = !!item;

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        kpi: String(item.kpi),
        formula: item.formula,
        variables: item.variables,
        fuente_datos: item.fuente_datos,
        responsable_medicion: String(item.responsable_medicion),
        responsable_analisis: String(item.responsable_analisis),
        proceso_relacionado: item.proceso_relacionado || '',
        objetivo_estrategico: item.objetivo_estrategico || '',
        interpretacion: item.interpretacion,
        limitaciones: item.limitaciones || '',
      });
    } else if (isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.kpi || !form.formula || !form.fuente_datos) return;

    const payload = {
      kpi: parseInt(form.kpi),
      formula: form.formula,
      variables: form.variables,
      fuente_datos: form.fuente_datos,
      responsable_medicion: parseInt(form.responsable_medicion),
      responsable_analisis: parseInt(form.responsable_analisis),
      proceso_relacionado: form.proceso_relacionado || undefined,
      objetivo_estrategico: form.objetivo_estrategico || undefined,
      interpretacion: form.interpretacion,
      limitaciones: form.limitaciones || undefined,
    };

    if (isEditing) {
      updateFicha.mutate(
        { id: item.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createFicha.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const isPending = createFicha.isPending || updateFicha.isPending;
  const isValid = form.kpi && form.formula && form.fuente_datos;

  const kpiOptions = kpis.map((kpi) => ({
    value: String(kpi.id),
    label: `${kpi.codigo} - ${kpi.nombre}`,
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ficha Técnica' : 'Nueva Ficha Técnica'}
      size="lg"
    >
      <div className="space-y-4">
        <Select
          label="KPI"
          value={form.kpi}
          onChange={(e) => handleChange('kpi', e.target.value)}
          options={kpiOptions}
          required
          disabled={isEditing}
        />

        <Input
          label="Fórmula"
          value={form.formula}
          onChange={(e) => handleChange('formula', e.target.value)}
          placeholder="Ej: (Número de AT / Horas trabajadas) x 200,000"
          required
        />

        <Input
          label="Variables"
          value={form.variables}
          onChange={(e) => handleChange('variables', e.target.value)}
          placeholder="Ej: AT=Accidentes de Trabajo, HH=Horas Hombre"
        />

        <Input
          label="Fuente de Datos"
          value={form.fuente_datos}
          onChange={(e) => handleChange('fuente_datos', e.target.value)}
          placeholder="Ej: Sistema HSEQ - Módulo Accidentalidad"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ID Responsable Medición"
            type="number"
            value={form.responsable_medicion}
            onChange={(e) => handleChange('responsable_medicion', e.target.value)}
            placeholder="ID del usuario"
          />
          <Input
            label="ID Responsable Análisis"
            type="number"
            value={form.responsable_analisis}
            onChange={(e) => handleChange('responsable_analisis', e.target.value)}
            placeholder="ID del usuario"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Proceso Relacionado"
            value={form.proceso_relacionado}
            onChange={(e) => handleChange('proceso_relacionado', e.target.value)}
            placeholder="Ej: Gestión de SST"
          />
          <Input
            label="Objetivo Estratégico"
            value={form.objetivo_estrategico}
            onChange={(e) => handleChange('objetivo_estrategico', e.target.value)}
            placeholder="Ej: Reducir accidentalidad"
          />
        </div>

        <Textarea
          label="Interpretación"
          value={form.interpretacion}
          onChange={(e) => handleChange('interpretacion', e.target.value)}
          placeholder="Cómo se interpreta el indicador..."
          rows={3}
          required
        />

        <Textarea
          label="Limitaciones"
          value={form.limitaciones}
          onChange={(e) => handleChange('limitaciones', e.target.value)}
          placeholder="Limitaciones o consideraciones del indicador..."
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            isLoading={isPending}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Ficha Técnica
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
