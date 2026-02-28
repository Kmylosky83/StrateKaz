import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateObjetivo, useUpdateObjetivo } from '../hooks/usePlanificacion';
import type { ObjetivoSistema, CreateObjetivoSistemaDTO } from '../hooks/usePlanificacion';

interface ObjetivoSistemaFormModalProps {
  item: ObjetivoSistema | null;
  planId: number;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateObjetivoSistemaDTO = {
  plan_trabajo: 0,
  descripcion: '',
  categoria: 'SST',
  tipo_objetivo: 'ESTRATEGICO',
  responsable: 0,
  fecha_inicio: '',
  fecha_fin: '',
  indicador_medicion: '',
  formula_calculo: '',
  meta_numerica: undefined,
  unidad_medida: '',
  valor_linea_base: undefined,
  frecuencia_medicion: 'MENSUAL',
};

const CATEGORIA_OPTIONS = [
  { value: 'SST', label: 'Seguridad y Salud en el Trabajo' },
  { value: 'AMBIENTAL', label: 'Gestión Ambiental' },
  { value: 'CALIDAD', label: 'Gestión de Calidad' },
  { value: 'SEGURIDAD_INFO', label: 'Seguridad de la Información' },
  { value: 'ESTRATEGICO', label: 'Estratégico' },
];

const TIPO_OBJETIVO_OPTIONS = [
  { value: 'ESTRATEGICO', label: 'Estratégico' },
  { value: 'TACTICO', label: 'Táctico' },
  { value: 'OPERATIVO', label: 'Operativo' },
];

const FRECUENCIA_OPTIONS = [
  { value: 'DIARIA', label: 'Diaria' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

export default function ObjetivoSistemaFormModal({
  item,
  planId,
  isOpen,
  onClose,
}: ObjetivoSistemaFormModalProps) {
  const [formData, setFormData] = useState<CreateObjetivoSistemaDTO>(INITIAL_FORM);

  const createMutation = useCreateObjetivo();
  const updateMutation = useUpdateObjetivo();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        plan_trabajo: item.plan_trabajo ?? planId,
        descripcion: item.descripcion || '',
        categoria: item.categoria || 'SST',
        tipo_objetivo: item.tipo_objetivo || 'ESTRATEGICO',
        responsable: item.responsable ?? 0,
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        indicador_medicion: item.indicador_medicion || '',
        formula_calculo: item.formula_calculo || '',
        meta_numerica: item.meta_numerica ?? undefined,
        unidad_medida: item.unidad_medida || '',
        valor_linea_base: item.valor_linea_base ?? undefined,
        frecuencia_medicion: item.frecuencia_medicion || 'MENSUAL',
      });
    } else {
      setFormData({ ...INITIAL_FORM, plan_trabajo: planId });
    }
  }, [item, isOpen, planId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };
    payload.plan_trabajo = planId;

    // Clean FK fields with value 0
    if (!payload.responsable) {
      delete (payload as Partial<CreateObjetivoSistemaDTO>).responsable;
    }

    // Clean optional numeric fields
    if (!payload.meta_numerica) delete payload.meta_numerica;
    if (!payload.valor_linea_base) delete payload.valor_linea_base;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateObjetivoSistemaDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Objetivo del Sistema' : 'Nuevo Objetivo del Sistema'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Categoría | Tipo de Objetivo */}
          <Select
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            required
          >
            {CATEGORIA_OPTIONS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          <Select
            label="Tipo de Objetivo *"
            value={formData.tipo_objetivo}
            onChange={(e) => handleChange('tipo_objetivo', e.target.value)}
            required
          >
            {TIPO_OBJETIVO_OPTIONS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          {/* Fila 2: Descripción del Objetivo (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción del Objetivo *"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describa el objetivo del sistema..."
              rows={3}
              required
            />
          </div>

          {/* Fila 3: Fecha Inicio | Fecha Meta */}
          <Input
            label="Fecha Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          <Input
            label="Fecha Meta *"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            required
          />

          {/* Fila 4: Indicador de Medición (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Indicador de Medición *"
              value={formData.indicador_medicion}
              onChange={(e) => handleChange('indicador_medicion', e.target.value)}
              placeholder="Ej: Tasa de accidentalidad, % cumplimiento..."
              required
            />
          </div>

          {/* Fila 5: Fórmula de Cálculo | Frecuencia de Medición */}
          <Input
            label="Fórmula de Cálculo"
            value={formData.formula_calculo}
            onChange={(e) => handleChange('formula_calculo', e.target.value)}
            placeholder="Ej: (N° accidentes / HHT) x 1.000.000"
          />

          <Select
            label="Frecuencia de Medición"
            value={formData.frecuencia_medicion}
            onChange={(e) => handleChange('frecuencia_medicion', e.target.value)}
          >
            {FRECUENCIA_OPTIONS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          {/* Fila 6: Meta Numérica | Unidad de Medida */}
          <Input
            label="Meta Numérica"
            type="number"
            value={formData.meta_numerica !== undefined ? String(formData.meta_numerica) : ''}
            onChange={(e) =>
              handleChange(
                'meta_numerica',
                e.target.value !== '' ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
          />

          <Input
            label="Unidad de Medida"
            value={formData.unidad_medida}
            onChange={(e) => handleChange('unidad_medida', e.target.value)}
            placeholder="Ej: %, eventos, horas"
          />

          {/* Fila 7: Valor Línea Base */}
          <Input
            label="Valor Línea Base"
            type="number"
            value={formData.valor_linea_base !== undefined ? String(formData.valor_linea_base) : ''}
            onChange={(e) =>
              handleChange(
                'valor_linea_base',
                e.target.value !== '' ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
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
              <>{item ? 'Actualizar' : 'Crear'} Objetivo</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
