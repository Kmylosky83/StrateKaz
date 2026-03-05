/**
 * TipoDocumentoFormModal - Modal CRUD para Tipos de Documento.
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Spinner } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input, Select, Textarea, Switch } from '@/components/forms';
import {
  useCreateTipoDocumento,
  useUpdateTipoDocumento,
  useTipoDocumento,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';
import type {
  TipoDocumento,
  CreateTipoDocumentoDTO,
  NivelDocumento,
} from '@/features/gestion-estrategica/types/gestion-documental.types';

interface TipoDocumentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoId?: number | null;
}

const NIVEL_OPTIONS: { value: NivelDocumento; label: string }[] = [
  { value: 'ESTRATEGICO', label: 'Estratégico' },
  { value: 'TACTICO', label: 'Táctico' },
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'SOPORTE', label: 'Soporte' },
];

export function TipoDocumentoFormModal({ isOpen, onClose, tipoId }: TipoDocumentoFormModalProps) {
  const isEdit = !!tipoId;
  const { data: existing, isLoading: isLoadingExisting } = useTipoDocumento(tipoId!);
  const createMutation = useCreateTipoDocumento();
  const updateMutation = useUpdateTipoDocumento();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateTipoDocumentoDTO>({
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      nivel_documento: 'OPERATIVO',
      prefijo_codigo: '',
      requiere_aprobacion: true,
      requiere_firma: true,
      tiempo_retencion_anos: 5,
      color_identificacion: '#3498db',
    },
  });

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        codigo: existing.codigo,
        nombre: existing.nombre,
        descripcion: existing.descripcion || '',
        nivel_documento: existing.nivel_documento,
        prefijo_codigo: existing.prefijo_codigo,
        requiere_aprobacion: existing.requiere_aprobacion,
        requiere_firma: existing.requiere_firma,
        tiempo_retencion_anos: existing.tiempo_retencion_años,
        color_identificacion: existing.color_identificacion,
      });
    } else if (!isEdit) {
      reset({
        codigo: '',
        nombre: '',
        descripcion: '',
        nivel_documento: 'OPERATIVO',
        prefijo_codigo: '',
        requiere_aprobacion: true,
        requiere_firma: true,
        tiempo_retencion_anos: 5,
        color_identificacion: '#3498db',
      });
    }
  }, [isEdit, existing, reset]);

  const onSubmit = async (data: CreateTipoDocumentoDTO) => {
    if (isEdit && tipoId) {
      await updateMutation.mutateAsync({ id: tipoId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const colorValue = watch('color_identificacion');

  if (isEdit && isLoadingExisting) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Cargando...">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSubmit(onSubmit)}>
            {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Código"
            {...register('codigo')}
            placeholder="Se genera automáticamente"
            disabled={isEdit}
            error={errors.codigo?.message}
          />

          <Input
            label="Nombre *"
            {...register('nombre', { required: 'Nombre es requerido' })}
            placeholder="Procedimiento"
            error={errors.nombre?.message}
          />
        </div>

        <Textarea
          label="Descripción"
          {...register('descripcion')}
          rows={2}
          placeholder="Descripción del tipo de documento..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Nivel" {...register('nivel_documento')} options={NIVEL_OPTIONS} />

          <Input
            label="Prefijo Código"
            {...register('prefijo_codigo', { required: 'Prefijo requerido' })}
            placeholder="PR-"
            error={errors.prefijo_codigo?.message}
          />

          <Input
            label="Retención (años)"
            type="number"
            {...register('tiempo_retencion_anos', { min: 1 })}
            min={1}
            error={errors.tiempo_retencion_anos?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <input
              type="color"
              {...register('color_identificacion')}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <span className="text-xs text-gray-500">{colorValue}</span>
          </div>

          <Controller
            name="requiere_aprobacion"
            control={control}
            render={({ field }) => (
              <Switch
                label="Requiere aprobación"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            )}
          />

          <Controller
            name="requiere_firma"
            control={control}
            render={({ field }) => (
              <Switch
                label="Requiere firma digital"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            )}
          />
        </div>
      </form>
    </BaseModal>
  );
}
