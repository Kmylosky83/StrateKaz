/**
 * Modal de creación: Registro de Vertimiento (Gestión Ambiental - HSEQ)
 * Solo soporta modo creación (sin update aún).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateVertimiento } from '../hooks/useGestionAmbiental';
import type {
  CreateVertimientoDTO,
  TipoVertimiento,
  CuerpoReceptor,
} from '../types/gestion-ambiental.types';

interface VertimientoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = Omit<CreateVertimientoDTO, 'empresa_id'>;

const INITIAL_FORM: FormState = {
  fecha_vertimiento: '',
  tipo_vertimiento: 'DOMESTICO',
  punto_vertimiento: '',
  cuerpo_receptor: 'ALCANTARILLADO',
  nombre_cuerpo_receptor: '',
  caudal_m3_dia: undefined,
  ph: undefined,
  temperatura_celsius: undefined,
  dbo5_mg_l: undefined,
  dqo_mg_l: undefined,
  sst_mg_l: undefined,
  grasas_aceites_mg_l: undefined,
  cumple_normativa: undefined,
  norma_referencia: '',
  tratamiento_previo: '',
  observaciones: '',
  laboratorio_analisis: '',
  numero_informe_laboratorio: '',
};

const TIPO_VERTIMIENTO_OPTIONS = [
  { value: 'DOMESTICO', label: 'Doméstico' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'PLUVIAL', label: 'Pluvial' },
  { value: 'MIXTO', label: 'Mixto' },
];

const CUERPO_RECEPTOR_OPTIONS = [
  { value: 'ALCANTARILLADO', label: 'Alcantarillado' },
  { value: 'RIO', label: 'Río' },
  { value: 'QUEBRADA', label: 'Quebrada' },
  { value: 'LAGO', label: 'Lago' },
  { value: 'MAR', label: 'Mar' },
  { value: 'SUELO', label: 'Suelo' },
  { value: 'PTAR', label: 'PTAR' },
];

export default function VertimientoFormModal({ isOpen, onClose }: VertimientoFormModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const createMutation = useCreateVertimiento();

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

    // Limpiar campos numéricos opcionales vacíos
    if (payload.caudal_m3_dia === undefined) delete payload.caudal_m3_dia;
    if (payload.ph === undefined) delete payload.ph;
    if (payload.temperatura_celsius === undefined) delete payload.temperatura_celsius;
    if (payload.dbo5_mg_l === undefined) delete payload.dbo5_mg_l;
    if (payload.dqo_mg_l === undefined) delete payload.dqo_mg_l;
    if (payload.sst_mg_l === undefined) delete payload.sst_mg_l;
    if (payload.grasas_aceites_mg_l === undefined) delete payload.grasas_aceites_mg_l;
    if (payload.cumple_normativa === undefined) delete payload.cumple_normativa;

    // Limpiar cadenas opcionales vacías
    if (!payload.nombre_cuerpo_receptor) delete payload.nombre_cuerpo_receptor;
    if (!payload.norma_referencia) delete payload.norma_referencia;
    if (!payload.tratamiento_previo) delete payload.tratamiento_previo;
    if (!payload.observaciones) delete payload.observaciones;
    if (!payload.laboratorio_analisis) delete payload.laboratorio_analisis;
    if (!payload.numero_informe_laboratorio) delete payload.numero_informe_laboratorio;

    createMutation.mutate(payload as CreateVertimientoDTO, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Registro de Vertimiento" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Fecha | Tipo Vertimiento */}
          <Input
            label="Fecha de Vertimiento *"
            type="date"
            value={formData.fecha_vertimiento}
            onChange={(e) => handleChange('fecha_vertimiento', e.target.value)}
            required
          />

          <Select
            label="Tipo de Vertimiento *"
            value={formData.tipo_vertimiento}
            onChange={(e) => handleChange('tipo_vertimiento', e.target.value as TipoVertimiento)}
            required
          >
            {TIPO_VERTIMIENTO_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila 2: Punto de Vertimiento | Cuerpo Receptor */}
          <Input
            label="Punto de Vertimiento *"
            value={formData.punto_vertimiento}
            onChange={(e) => handleChange('punto_vertimiento', e.target.value)}
            placeholder="Ej: Salida principal, Punto P-01"
            required
          />

          <Select
            label="Cuerpo Receptor *"
            value={formData.cuerpo_receptor}
            onChange={(e) => handleChange('cuerpo_receptor', e.target.value as CuerpoReceptor)}
            required
          >
            {CUERPO_RECEPTOR_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila 3: Nombre Cuerpo Receptor | Caudal */}
          <Input
            label="Nombre del Cuerpo Receptor"
            value={formData.nombre_cuerpo_receptor || ''}
            onChange={(e) => handleChange('nombre_cuerpo_receptor', e.target.value)}
            placeholder="Ej: Río Bogotá, Quebrada La Pava"
          />

          <Input
            label="Caudal (m³/día)"
            type="number"
            step="0.001"
            value={formData.caudal_m3_dia !== undefined ? String(formData.caudal_m3_dia) : ''}
            onChange={(e) =>
              handleChange(
                'caudal_m3_dia',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="0.000"
          />

          {/* Fila 4: pH | Temperatura */}
          <Input
            label="pH"
            type="number"
            step="0.1"
            value={formData.ph !== undefined ? String(formData.ph) : ''}
            onChange={(e) =>
              handleChange(
                'ph',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 7.2"
          />

          <Input
            label="Temperatura (°C)"
            type="number"
            step="0.1"
            value={
              formData.temperatura_celsius !== undefined ? String(formData.temperatura_celsius) : ''
            }
            onChange={(e) =>
              handleChange(
                'temperatura_celsius',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 22.5"
          />

          {/* Fila 5: DBO₅ | DQO */}
          <Input
            label="DBO₅ (mg/L)"
            type="number"
            step="0.01"
            value={formData.dbo5_mg_l !== undefined ? String(formData.dbo5_mg_l) : ''}
            onChange={(e) =>
              handleChange(
                'dbo5_mg_l',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 150.00"
          />

          <Input
            label="DQO (mg/L)"
            type="number"
            step="0.01"
            value={formData.dqo_mg_l !== undefined ? String(formData.dqo_mg_l) : ''}
            onChange={(e) =>
              handleChange(
                'dqo_mg_l',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 300.00"
          />

          {/* Fila 6: SST | Grasas y Aceites */}
          <Input
            label="SST (mg/L)"
            type="number"
            step="0.01"
            value={formData.sst_mg_l !== undefined ? String(formData.sst_mg_l) : ''}
            onChange={(e) =>
              handleChange(
                'sst_mg_l',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 80.00"
          />

          <Input
            label="Grasas y Aceites (mg/L)"
            type="number"
            step="0.01"
            value={
              formData.grasas_aceites_mg_l !== undefined ? String(formData.grasas_aceites_mg_l) : ''
            }
            onChange={(e) =>
              handleChange(
                'grasas_aceites_mg_l',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 20.00"
          />

          {/* Fila 7: Norma Referencia | Laboratorio Análisis */}
          <Input
            label="Norma de Referencia"
            value={formData.norma_referencia || ''}
            onChange={(e) => handleChange('norma_referencia', e.target.value)}
            placeholder="Ej: Decreto 1076/2015, Resolución 0631/2015"
          />

          <Input
            label="Laboratorio de Análisis"
            value={formData.laboratorio_analisis || ''}
            onChange={(e) => handleChange('laboratorio_analisis', e.target.value)}
            placeholder="Nombre del laboratorio"
          />

          {/* Fila 8: Tratamiento Previo | Número Informe */}
          <Input
            label="Tratamiento Previo"
            value={formData.tratamiento_previo || ''}
            onChange={(e) => handleChange('tratamiento_previo', e.target.value)}
            placeholder="Ej: PTAR interna, Trampa de grasas"
          />

          <Input
            label="Número de Informe"
            value={formData.numero_informe_laboratorio || ''}
            onChange={(e) => handleChange('numero_informe_laboratorio', e.target.value)}
            placeholder="Ej: INF-LAB-2024-001"
          />

          {/* Fila 9: Observaciones (col-span-2) */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales sobre el vertimiento..."
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
