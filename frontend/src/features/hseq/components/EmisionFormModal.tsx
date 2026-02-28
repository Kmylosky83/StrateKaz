/**
 * Modal de creación: Medición de Emisiones Atmosféricas (Gestión Ambiental - HSEQ)
 * Solo soporta modo creación (sin update aún).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateEmision, useFuentesEmision } from '../hooks/useGestionAmbiental';
import type { CreateRegistroEmisionDTO } from '../types/gestion-ambiental.types';

interface EmisionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = Omit<CreateRegistroEmisionDTO, 'empresa_id'>;

const INITIAL_FORM: FormState = {
  fecha_medicion: '',
  fuente_emision: 0,
  material_particulado_mg_m3: undefined,
  pm10_ug_m3: undefined,
  pm25_ug_m3: undefined,
  so2_ppm: undefined,
  nox_ppm: undefined,
  co_ppm: undefined,
  co2_ppm: undefined,
  cov_mg_m3: undefined,
  cumple_normativa: undefined,
  norma_referencia: '',
  laboratorio_medicion: '',
  numero_informe: '',
  observaciones: '',
};

export default function EmisionFormModal({ isOpen, onClose }: EmisionFormModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const createMutation = useCreateEmision();
  const { data: fuentesData } = useFuentesEmision();

  const fuentes = fuentesData?.results ?? [];

  const isLoading = createMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM);
    }
  }, [isOpen]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData } as Partial<FormState>;

    // Limpiar FK obligatoria si es 0
    if (!payload.fuente_emision || payload.fuente_emision === 0) delete payload.fuente_emision;

    // Limpiar métricas numéricas opcionales
    if (payload.material_particulado_mg_m3 === undefined) delete payload.material_particulado_mg_m3;
    if (payload.pm10_ug_m3 === undefined) delete payload.pm10_ug_m3;
    if (payload.pm25_ug_m3 === undefined) delete payload.pm25_ug_m3;
    if (payload.so2_ppm === undefined) delete payload.so2_ppm;
    if (payload.nox_ppm === undefined) delete payload.nox_ppm;
    if (payload.co_ppm === undefined) delete payload.co_ppm;
    if (payload.co2_ppm === undefined) delete payload.co2_ppm;
    if (payload.cov_mg_m3 === undefined) delete payload.cov_mg_m3;
    if (payload.cumple_normativa === undefined) delete payload.cumple_normativa;

    // Limpiar cadenas opcionales vacías
    if (!payload.norma_referencia) delete payload.norma_referencia;
    if (!payload.laboratorio_medicion) delete payload.laboratorio_medicion;
    if (!payload.numero_informe) delete payload.numero_informe;
    if (!payload.observaciones) delete payload.observaciones;

    createMutation.mutate(payload as CreateRegistroEmisionDTO, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Medición de Emisiones" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Fecha Medición | Fuente de Emisión */}
          <Input
            label="Fecha de Medición *"
            type="date"
            value={formData.fecha_medicion}
            onChange={(e) => handleChange('fecha_medicion', e.target.value)}
            required
          />

          <Select
            label="Fuente de Emisión *"
            value={formData.fuente_emision}
            onChange={(e) => handleChange('fuente_emision', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar fuente de emisión</option>
            {fuentes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.codigo} - {f.nombre}
              </option>
            ))}
          </Select>

          {/* Fila 2: Material Particulado | PM₁₀ */}
          <Input
            label="Material Particulado (mg/m³)"
            type="number"
            step="0.001"
            value={
              formData.material_particulado_mg_m3 !== undefined
                ? String(formData.material_particulado_mg_m3)
                : ''
            }
            onChange={(e) =>
              handleChange(
                'material_particulado_mg_m3',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 50.000"
          />

          <Input
            label="PM₁₀ (μg/m³)"
            type="number"
            step="0.001"
            value={formData.pm10_ug_m3 !== undefined ? String(formData.pm10_ug_m3) : ''}
            onChange={(e) =>
              handleChange(
                'pm10_ug_m3',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 40.000"
          />

          {/* Fila 3: PM₂.₅ | SO₂ */}
          <Input
            label="PM₂.₅ (μg/m³)"
            type="number"
            step="0.001"
            value={formData.pm25_ug_m3 !== undefined ? String(formData.pm25_ug_m3) : ''}
            onChange={(e) =>
              handleChange(
                'pm25_ug_m3',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 25.000"
          />

          <Input
            label="SO₂ (ppm)"
            type="number"
            step="0.001"
            value={formData.so2_ppm !== undefined ? String(formData.so2_ppm) : ''}
            onChange={(e) =>
              handleChange(
                'so2_ppm',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 0.500"
          />

          {/* Fila 4: NOx | CO */}
          <Input
            label="NOx (ppm)"
            type="number"
            step="0.001"
            value={formData.nox_ppm !== undefined ? String(formData.nox_ppm) : ''}
            onChange={(e) =>
              handleChange(
                'nox_ppm',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 1.200"
          />

          <Input
            label="CO (ppm)"
            type="number"
            step="0.001"
            value={formData.co_ppm !== undefined ? String(formData.co_ppm) : ''}
            onChange={(e) =>
              handleChange(
                'co_ppm',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 5.000"
          />

          {/* Fila 5: CO₂ | COV */}
          <Input
            label="CO₂ (ppm)"
            type="number"
            step="0.001"
            value={formData.co2_ppm !== undefined ? String(formData.co2_ppm) : ''}
            onChange={(e) =>
              handleChange(
                'co2_ppm',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 400.000"
          />

          <Input
            label="COV (mg/m³)"
            type="number"
            step="0.001"
            value={formData.cov_mg_m3 !== undefined ? String(formData.cov_mg_m3) : ''}
            onChange={(e) =>
              handleChange(
                'cov_mg_m3',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 10.000"
          />

          {/* Fila 6: Norma Referencia | Laboratorio */}
          <Input
            label="Norma de Referencia"
            value={formData.norma_referencia || ''}
            onChange={(e) => handleChange('norma_referencia', e.target.value)}
            placeholder="Ej: Resolución 909/2008, Decreto 948/1995"
          />

          <Input
            label="Laboratorio de Medición"
            value={formData.laboratorio_medicion || ''}
            onChange={(e) => handleChange('laboratorio_medicion', e.target.value)}
            placeholder="Nombre del laboratorio acreditado"
          />

          {/* Fila 7: Número Informe */}
          <Input
            label="Número de Informe"
            value={formData.numero_informe || ''}
            onChange={(e) => handleChange('numero_informe', e.target.value)}
            placeholder="Ej: INF-EMI-2024-001"
          />

          {/* Fila 8: Observaciones (col-span-2) */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales sobre la medición de emisiones..."
            />
          </div>
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
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
