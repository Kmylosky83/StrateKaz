import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateAnalisisVulnerabilidad,
  useUpdateAnalisisVulnerabilidad,
} from '../hooks/useEmergencias';
import type { AnalisisVulnerabilidad } from '../types/emergencias.types';

interface AnalisisVulnerabilidadFormModalProps {
  item: AnalisisVulnerabilidad | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  tipo_amenaza: string;
  fecha_analisis: string;
  descripcion: string;
  metodologia_utilizada: string;
  nivel_vulnerabilidad: string;
  puntuacion_vulnerabilidad: number;
  hallazgos: string;
  recomendaciones: string;
  responsable_analisis: string;
  proxima_revision: string;
}

const INITIAL_FORM: FormData = {
  codigo: '',
  nombre: '',
  tipo_amenaza: 'NATURAL',
  fecha_analisis: '',
  descripcion: '',
  metodologia_utilizada: '',
  nivel_vulnerabilidad: 'BAJO',
  puntuacion_vulnerabilidad: 0,
  hallazgos: '',
  recomendaciones: '',
  responsable_analisis: '',
  proxima_revision: '',
};

const TIPO_AMENAZA_OPTIONS = [
  { value: 'NATURAL', label: 'Natural' },
  { value: 'TECNOLOGICA', label: 'Tecnológica' },
  { value: 'SOCIAL', label: 'Social' },
];

const NIVEL_VULNERABILIDAD_OPTIONS = [
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'CRITICO', label: 'Crítico' },
];

export default function AnalisisVulnerabilidadFormModal({
  item,
  isOpen,
  onClose,
}: AnalisisVulnerabilidadFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateAnalisisVulnerabilidad();
  const updateMutation = useUpdateAnalisisVulnerabilidad();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo ?? '',
        nombre: item.nombre ?? '',
        tipo_amenaza: item.tipo_amenaza ?? 'NATURAL',
        fecha_analisis: item.fecha_analisis ?? '',
        descripcion: item.descripcion ?? '',
        metodologia_utilizada: item.metodologia_utilizada ?? '',
        nivel_vulnerabilidad: item.nivel_vulnerabilidad ?? 'BAJO',
        puntuacion_vulnerabilidad: parseFloat(item.puntuacion_vulnerabilidad) || 0,
        hallazgos: item.hallazgos ?? '',
        recomendaciones: item.recomendaciones ?? '',
        responsable_analisis: item.responsable_analisis ?? '',
        proxima_revision: item.proxima_revision ?? '',
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
      title={item ? 'Editar Análisis de Vulnerabilidad' : 'Nuevo Análisis de Vulnerabilidad'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Código | Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            placeholder="Nombre del análisis..."
            required
          />
        </div>

        {/* Fila 2: Tipo Amenaza | Nivel Vulnerabilidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Amenaza *"
            value={formData.tipo_amenaza}
            onChange={(e) => handleChange('tipo_amenaza', e.target.value)}
            required
          >
            {TIPO_AMENAZA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Nivel de Vulnerabilidad *"
            value={formData.nivel_vulnerabilidad}
            onChange={(e) => handleChange('nivel_vulnerabilidad', e.target.value)}
            required
          >
            {NIVEL_VULNERABILIDAD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 3: Fecha | Puntuación | Responsable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha de Análisis *"
            type="date"
            value={formData.fecha_analisis}
            onChange={(e) => handleChange('fecha_analisis', e.target.value)}
            required
          />
          <Input
            label="Puntuación"
            type="number"
            value={formData.puntuacion_vulnerabilidad}
            onChange={(e) =>
              handleChange('puntuacion_vulnerabilidad', parseFloat(e.target.value) || 0)
            }
          />
          <Input
            label="Próxima Revisión"
            type="date"
            value={formData.proxima_revision}
            onChange={(e) => handleChange('proxima_revision', e.target.value)}
          />
        </div>

        {/* Fila 4: Responsable | Metodología */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Responsable del Análisis *"
            value={formData.responsable_analisis}
            onChange={(e) => handleChange('responsable_analisis', e.target.value)}
            placeholder="Nombre del responsable..."
            required
          />
          <Input
            label="Metodología Utilizada *"
            value={formData.metodologia_utilizada}
            onChange={(e) => handleChange('metodologia_utilizada', e.target.value)}
            placeholder="Ej: Diamante de riesgo"
            required
          />
        </div>

        {/* Fila 5: Descripción */}
        <Textarea
          label="Descripción *"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del análisis..."
          rows={2}
          required
        />

        {/* Fila 6: Hallazgos */}
        <Textarea
          label="Hallazgos"
          value={formData.hallazgos}
          onChange={(e) => handleChange('hallazgos', e.target.value)}
          placeholder="Hallazgos identificados..."
          rows={2}
        />

        {/* Fila 7: Recomendaciones */}
        <Textarea
          label="Recomendaciones"
          value={formData.recomendaciones}
          onChange={(e) => handleChange('recomendaciones', e.target.value)}
          placeholder="Recomendaciones del análisis..."
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
              <>{item ? 'Actualizar' : 'Crear'} Análisis</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
