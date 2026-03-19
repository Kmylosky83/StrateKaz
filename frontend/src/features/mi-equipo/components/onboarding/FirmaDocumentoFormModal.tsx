/**
 * FirmaDocumentoFormModal - Registrar documento para firma
 */
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateFirmaDocumento } from '../../hooks/useOnboardingInduccion';
import { useColaboradores } from '../../hooks/useColaboradores';
import { useHistorialContratos } from '../../hooks/useSeleccionContratacion';
import type { FirmaDocumentoFormData } from '../../types';

const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'contrato', label: 'Contrato de Trabajo' },
  { value: 'reglamento_interno', label: 'Reglamento Interno de Trabajo' },
  { value: 'politica_datos', label: 'Política de Tratamiento de Datos' },
  { value: 'politica_sst', label: 'Política SST' },
  { value: 'acuerdo_confidencialidad', label: 'Acuerdo de Confidencialidad' },
  { value: 'autorizacion_descuento', label: 'Autorización de Descuentos' },
  { value: 'compromiso_cumplimiento', label: 'Compromiso de Cumplimiento' },
  { value: 'otro', label: 'Otro Documento' },
];

const METODO_FIRMA_OPTIONS = [
  { value: 'fisico', label: 'Firma Física' },
  { value: 'digital', label: 'Firma Digital' },
  { value: 'electronica', label: 'Firma Electrónica' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FirmaDocumentoFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateFirmaDocumento();
  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });
  const { data: contratosData } = useHistorialContratos({ page_size: 100 });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FirmaDocumentoFormData>({
    defaultValues: {
      metodo_firma: 'fisico',
      fecha_firma: new Date().toISOString().split('T')[0],
    },
  });

  const tipoDocumento = useWatch({ control, name: 'tipo_documento' });
  const esContrato = tipoDocumento === 'contrato';

  useEffect(() => {
    if (isOpen) {
      reset({
        colaborador: 0,
        tipo_documento: 'contrato',
        nombre_documento: '',
        version: '',
        fecha_firma: new Date().toISOString().split('T')[0],
        metodo_firma: 'fisico',
        historial_contrato: null,
        observaciones: '',
      });
    }
  }, [isOpen, reset]);

  const colaboradorOptions = [
    { value: '', label: 'Selecciona...' },
    ...(colaboradoresData?.results || []).map(
      (c: {
        id: number;
        nombre_completo?: string;
        primer_nombre?: string;
        primer_apellido?: string;
      }) => ({
        value: String(c.id),
        label: c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`,
      })
    ),
  ];

  const contratosResults = Array.isArray(contratosData)
    ? contratosData
    : (contratosData?.results ?? []);

  const contratoOptions = [
    { value: '', label: 'Sin vincular...' },
    ...contratosResults.map(
      (c: { id: number; numero_contrato: string; colaborador_nombre?: string }) => ({
        value: String(c.id),
        label: `${c.numero_contrato}${c.colaborador_nombre ? ` — ${c.colaborador_nombre}` : ''}`,
      })
    ),
  ];

  const onSubmit = async (data: FirmaDocumentoFormData) => {
    const payload: FirmaDocumentoFormData = {
      ...data,
      colaborador: Number(data.colaborador),
      historial_contrato: data.historial_contrato ? Number(data.historial_contrato) : null,
    };
    if (!payload.historial_contrato) delete payload.historial_contrato;
    await createMutation.mutateAsync(payload);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Documento"
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Registrando...' : 'Registrar Documento'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Select
          label="Colaborador"
          options={colaboradorOptions}
          error={errors.colaborador?.message}
          {...register('colaborador', {
            required: 'Selecciona un colaborador',
            validate: (v) => Number(v) > 0 || 'Selecciona un colaborador',
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de Documento"
            options={TIPO_DOCUMENTO_OPTIONS}
            {...register('tipo_documento', { required: 'Selecciona el tipo' })}
          />
          <Input
            label="Nombre del Documento"
            placeholder="Nombre del documento..."
            error={errors.nombre_documento?.message}
            {...register('nombre_documento', { required: 'El nombre es obligatorio' })}
          />
        </div>

        {esContrato && (
          <Select
            label="Contrato Laboral Asociado (opcional)"
            options={contratoOptions}
            {...register('historial_contrato')}
          />
        )}

        <div className="grid grid-cols-3 gap-4">
          <Input label="Versión" placeholder="1.0" {...register('version')} />
          <Input
            label="Fecha de Firma"
            type="date"
            {...register('fecha_firma', { required: 'La fecha es obligatoria' })}
          />
          <Select
            label="Método de Firma"
            options={METODO_FIRMA_OPTIONS}
            {...register('metodo_firma')}
          />
        </div>

        <Textarea
          label="Observaciones"
          rows={2}
          placeholder="Observaciones adicionales..."
          {...register('observaciones')}
        />
      </form>
    </BaseModal>
  );
};
