/**
 * Modal de creación: Certificado Ambiental (Gestión Ambiental - HSEQ)
 * Solo soporta modo creación (sin update aún).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateCertificado, useGestores } from '../hooks/useGestionAmbiental';
import type {
  CreateCertificadoAmbientalDTO,
  TipoCertificado,
} from '../types/gestion-ambiental.types';

interface CertificadoAmbientalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = Omit<CreateCertificadoAmbientalDTO, 'empresa_id'>;

const INITIAL_FORM: FormState = {
  numero_certificado: '',
  tipo_certificado: 'DISPOSICION_RESIDUOS',
  emisor: '',
  gestor: undefined,
  fecha_emision: '',
  fecha_vencimiento: '',
  descripcion: '',
  cantidad_certificada: undefined,
  unidad_medida: '',
  observaciones: '',
};

const TIPO_CERTIFICADO_OPTIONS = [
  { value: 'DISPOSICION_RESIDUOS', label: 'Disposición de Residuos' },
  { value: 'APROVECHAMIENTO', label: 'Aprovechamiento' },
  { value: 'RECICLAJE', label: 'Reciclaje' },
  { value: 'VERTIMIENTO', label: 'Vertimiento' },
  { value: 'EMISION', label: 'Emisión' },
  { value: 'CUMPLIMIENTO_AMBIENTAL', label: 'Cumplimiento Ambiental' },
  { value: 'COMPENSACION_CO2', label: 'Compensación CO₂' },
  { value: 'ISO_14001', label: 'ISO 14001' },
  { value: 'OTRO', label: 'Otro' },
];

export default function CertificadoAmbientalFormModal({
  isOpen,
  onClose,
}: CertificadoAmbientalFormModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const createMutation = useCreateCertificado();
  const { data: gestoresData } = useGestores();

  const gestores = gestoresData?.results ?? [];

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

    // Limpiar FK opcional gestor si es 0 o undefined
    if (!payload.gestor || payload.gestor === 0) delete payload.gestor;

    // Limpiar numérico opcional
    if (payload.cantidad_certificada === undefined) delete payload.cantidad_certificada;

    // Limpiar cadenas opcionales vacías
    if (!payload.fecha_vencimiento) delete payload.fecha_vencimiento;
    if (!payload.unidad_medida) delete payload.unidad_medida;
    if (!payload.observaciones) delete payload.observaciones;

    createMutation.mutate(payload as CreateCertificadoAmbientalDTO, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Certificado Ambiental" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Número Certificado | Tipo Certificado */}
          <Input
            label="Número de Certificado *"
            value={formData.numero_certificado}
            onChange={(e) => handleChange('numero_certificado', e.target.value)}
            placeholder="Ej: CERT-AMB-2024-001"
            required
          />

          <Select
            label="Tipo de Certificado *"
            value={formData.tipo_certificado}
            onChange={(e) => handleChange('tipo_certificado', e.target.value as TipoCertificado)}
            required
          >
            {TIPO_CERTIFICADO_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila 2: Emisor | Gestor Ambiental */}
          <Input
            label="Emisor *"
            value={formData.emisor}
            onChange={(e) => handleChange('emisor', e.target.value)}
            placeholder="Ej: Empresa gestora, Autoridad ambiental"
            required
          />

          <Select
            label="Gestor Ambiental"
            value={formData.gestor ?? 0}
            onChange={(e) => handleChange('gestor', parseInt(e.target.value) || undefined)}
          >
            <option value={0}>Sin gestor asignado</option>
            {gestores.map((g) => (
              <option key={g.id} value={g.id}>
                {g.razon_social}
              </option>
            ))}
          </Select>

          {/* Fila 3: Fecha Emisión | Fecha Vencimiento */}
          <Input
            label="Fecha de Emisión *"
            type="date"
            value={formData.fecha_emision}
            onChange={(e) => handleChange('fecha_emision', e.target.value)}
            required
          />

          <Input
            label="Fecha de Vencimiento"
            type="date"
            value={formData.fecha_vencimiento || ''}
            onChange={(e) => handleChange('fecha_vencimiento', e.target.value)}
          />

          {/* Fila 4: Descripción (col-span-2) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción *"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              placeholder="Describa el alcance y contenido del certificado ambiental..."
              required
            />
          </div>

          {/* Fila 5: Cantidad Certificada | Unidad de Medida */}
          <Input
            label="Cantidad Certificada"
            type="number"
            step="0.001"
            value={
              formData.cantidad_certificada !== undefined
                ? String(formData.cantidad_certificada)
                : ''
            }
            onChange={(e) =>
              handleChange(
                'cantidad_certificada',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Ej: 1500.000"
          />

          <Input
            label="Unidad de Medida"
            value={formData.unidad_medida || ''}
            onChange={(e) => handleChange('unidad_medida', e.target.value)}
            placeholder="Ej: Kg, Ton, m³, tCO₂eq"
          />

          {/* Fila 6: Observaciones (col-span-2) */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales sobre el certificado ambiental..."
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
