import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateDiagnostico, useUpdateDiagnostico } from '../hooks/useMedicinaLaboral';
import type { DiagnosticoOcupacional } from '../hooks/useMedicinaLaboral';
import { ORIGEN_DIAGNOSTICO_OPTIONS } from '../types/medicina-laboral.types';

interface DiagnosticoOcupacionalFormModalProps {
  item: DiagnosticoOcupacional | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo_cie10: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  origen: string;
  riesgos_relacionados: string;
  requiere_vigilancia: boolean;
  programa_vigilancia_sugerido: string;
  requiere_reporte_arl: boolean;
  requiere_reporte_secretaria: boolean;
}

const INITIAL_FORM: FormData = {
  codigo_cie10: '',
  nombre: '',
  descripcion: '',
  categoria: '',
  origen: 'OCUPACIONAL',
  riesgos_relacionados: '',
  requiere_vigilancia: false,
  programa_vigilancia_sugerido: '',
  requiere_reporte_arl: false,
  requiere_reporte_secretaria: false,
};

export default function DiagnosticoOcupacionalFormModal({
  item,
  isOpen,
  onClose,
}: DiagnosticoOcupacionalFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateDiagnostico();
  const updateMutation = useUpdateDiagnostico();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo_cie10: item.codigo_cie10 ?? '',
        nombre: item.nombre ?? '',
        descripcion: item.descripcion ?? '',
        categoria: item.categoria ?? '',
        origen: item.origen ?? 'OCUPACIONAL',
        riesgos_relacionados: item.riesgos_relacionados ?? '',
        requiere_vigilancia: item.requiere_vigilancia ?? false,
        programa_vigilancia_sugerido: item.programa_vigilancia_sugerido ?? '',
        requiere_reporte_arl: item.requiere_reporte_arl ?? false,
        requiere_reporte_secretaria: item.requiere_reporte_secretaria ?? false,
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
      title={item ? 'Editar Diagnóstico Ocupacional' : 'Nuevo Diagnóstico Ocupacional'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Código CIE-10 | Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código CIE-10 *"
            value={formData.codigo_cie10}
            onChange={(e) => handleChange('codigo_cie10', e.target.value)}
            placeholder="Ej: M54.5"
            required
          />
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del diagnóstico..."
            required
          />
        </div>

        {/* Fila 2: Categoría | Origen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            placeholder="Ej: Musculoesquelético, Respiratorio..."
            required
          />
          <Select
            label="Origen *"
            value={formData.origen}
            onChange={(e) => handleChange('origen', e.target.value)}
            required
          >
            {ORIGEN_DIAGNOSTICO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 3: Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del diagnóstico..."
          rows={2}
        />

        {/* Fila 4: Riesgos relacionados */}
        <Textarea
          label="Riesgos Relacionados"
          value={formData.riesgos_relacionados}
          onChange={(e) => handleChange('riesgos_relacionados', e.target.value)}
          placeholder="Factores de riesgo asociados a este diagnóstico..."
          rows={2}
        />

        {/* Fila 5: Configuración de vigilancia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="¿Requiere Vigilancia?"
            value={formData.requiere_vigilancia ? 'true' : 'false'}
            onChange={(e) => handleChange('requiere_vigilancia', e.target.value === 'true')}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </Select>
          <Input
            label="Programa PVE Sugerido"
            value={formData.programa_vigilancia_sugerido}
            onChange={(e) => handleChange('programa_vigilancia_sugerido', e.target.value)}
            placeholder="Ej: PVE Osteomuscular"
          />
        </div>

        {/* Fila 6: Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="¿Requiere Reporte ARL?"
            value={formData.requiere_reporte_arl ? 'true' : 'false'}
            onChange={(e) => handleChange('requiere_reporte_arl', e.target.value === 'true')}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </Select>
          <Select
            label="¿Requiere Reporte Secretaría?"
            value={formData.requiere_reporte_secretaria ? 'true' : 'false'}
            onChange={(e) => handleChange('requiere_reporte_secretaria', e.target.value === 'true')}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </Select>
        </div>

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
              <>{item ? 'Actualizar' : 'Crear'} Diagnóstico</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
