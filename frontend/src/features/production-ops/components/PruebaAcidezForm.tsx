/**
 * Componente: Formulario de Prueba de Acidez
 * NOTA: Migrado de Supply Chain a Production Ops
 *
 * Características:
 * - Registro de pruebas de acidez
 * - Simulación de clasificación automática
 * - Validación de campos
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FlaskConical, Calculator, Save, X } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import {
  useCreatePruebaAcidez,
  useUpdatePruebaAcidez,
  useSimularPruebaAcidez,
} from '../hooks/usePruebasAcidez';
import { useSelectProveedores, useSelectTiposMateriaPrima } from '@/hooks/useSelectLists';
import type {
  PruebaAcidez,
  CreatePruebaAcidezDTO,
  SimularPruebaAcidezResponse,
} from '../types/prueba-acidez.types';

// ==================== TIPOS ====================

interface PruebaAcidezFormProps {
  prueba?: PruebaAcidez | null;
  proveedorId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type FormData = CreatePruebaAcidezDTO;

const ACCIONES_TOMADA = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'REPROCESO', label: 'Reproceso' },
  { value: 'DEVOLUCION', label: 'Devolución' },
];

// ==================== COMPONENTE ====================

export function PruebaAcidezForm({
  prueba,
  proveedorId,
  onSuccess,
  onCancel,
}: PruebaAcidezFormProps) {
  const [simulacion, setSimulacion] = useState<SimularPruebaAcidezResponse | null>(null);

  const isEditing = !!prueba;

  // Mutations
  const createMutation = useCreatePruebaAcidez();
  const updateMutation = useUpdatePruebaAcidez();
  const simularMutation = useSimularPruebaAcidez();

  // Queries — Select Lists compartidos (C0)
  const { data: proveedores = [] } = useSelectProveedores();
  const { data: tiposMateriaPrima = [] } = useSelectTiposMateriaPrima();

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      codigo: prueba?.codigo || '',
      proveedor: prueba?.proveedor || proveedorId || undefined,
      tipo_materia_prima_original: prueba?.tipo_materia_prima_original || undefined,
      fecha_prueba: prueba?.fecha_prueba || new Date().toISOString().split('T')[0],
      hora_prueba: prueba?.hora_prueba || new Date().toTimeString().slice(0, 5),
      lote_recepcion: prueba?.lote_recepcion || '',
      valor_acidez: prueba?.valor_acidez || 0,
      tipo_materia_prima_resultante: prueba?.tipo_materia_prima_resultante || undefined,
      clasificacion_automatica: prueba?.clasificacion_automatica ?? true,
      cumple_especificacion: prueba?.cumple_especificacion ?? true,
      observaciones: prueba?.observaciones || '',
      metodo_prueba: prueba?.metodo_prueba || 'Titulación',
      equipo_utilizado: prueba?.equipo_utilizado || '',
      temperatura_muestra: prueba?.temperatura_muestra || 25,
      accion_tomada: prueba?.accion_tomada || 'PENDIENTE',
      motivo_rechazo: prueba?.motivo_rechazo || '',
      is_active: prueba?.is_active ?? true,
    },
  });

  const tipoMateriaOriginal = watch('tipo_materia_prima_original');
  const valorAcidez = watch('valor_acidez');
  const accionTomada = watch('accion_tomada');

  // Simular clasificación cuando cambia tipo o acidez
  const handleSimular = async () => {
    if (tipoMateriaOriginal && valorAcidez) {
      try {
        const result = await simularMutation.mutateAsync({
          tipo_materia_prima_original: tipoMateriaOriginal,
          valor_acidez: valorAcidez,
        });
        setSimulacion(result);

        // Actualizar campos con resultado de simulación
        if (result.tipo_materia_prima_resultante) {
          setValue('tipo_materia_prima_resultante', result.tipo_materia_prima_resultante.id);
        }
        setValue('cumple_especificacion', result.cumple_especificacion);
        if (result.sugerencia_accion) {
          setValue('accion_tomada', result.sugerencia_accion);
        }
      } catch (error) {
        console.error('Error al simular:', error);
      }
    }
  };

  // Generar código automático
  useEffect(() => {
    if (!prueba && !watch('codigo')) {
      const now = new Date();
      const codigo = `PA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      setValue('codigo', codigo);
    }
  }, [prueba, setValue, watch]);

  // Submit
  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && prueba) {
        await updateMutation.mutateAsync({ id: prueba.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <FlaskConical className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Prueba de Acidez' : 'Nueva Prueba de Acidez'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registre los resultados de la prueba de acidez del sebo
          </p>
        </div>
      </div>

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Código *"
          type="text"
          {...register('codigo', { required: 'El código es requerido' })}
          placeholder="PA-XXXXXX"
          error={errors.codigo?.message}
        />

        <Input
          label="Fecha de Prueba *"
          type="date"
          {...register('fecha_prueba', { required: 'La fecha es requerida' })}
          error={errors.fecha_prueba?.message}
        />

        <Input label="Hora de Prueba" type="time" {...register('hora_prueba')} />

        {!proveedorId && (
          <Select
            label="Proveedor *"
            {...register('proveedor', { required: 'El proveedor es requerido' })}
            error={errors.proveedor?.message}
          >
            <option value="">Seleccione...</option>
            {proveedores.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.label}
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Lote de Recepción"
          type="text"
          {...register('lote_recepcion')}
          placeholder="Ej: LOTE-001"
        />

        <Select
          label="Tipo Materia Prima Original *"
          {...register('tipo_materia_prima_original', {
            required: 'El tipo de materia prima es requerido',
          })}
          error={errors.tipo_materia_prima_original?.message}
        >
          <option value="">Seleccione...</option>
          {tiposMateriaPrima.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Resultados de la prueba */}
      <Card variant="bordered" padding="md">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Resultados de la Prueba</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valor de Acidez */}
          <div>
            <div className="flex gap-2 items-end">
              <Input
                label="Valor de Acidez (%) *"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('valor_acidez', {
                  required: 'El valor de acidez es requerido',
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                  max: { value: 100, message: 'Debe ser menor o igual a 100' },
                })}
                placeholder="0.00"
                error={errors.valor_acidez?.message}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleSimular}
                disabled={!tipoMateriaOriginal || simularMutation.isPending}
                leftIcon={<Calculator className="w-4 h-4" />}
              >
                Simular
              </Button>
            </div>
          </div>

          <Input
            label="Método de Prueba"
            type="text"
            {...register('metodo_prueba')}
            placeholder="Ej: Titulación"
          />

          <Input
            label="Temperatura Muestra (°C)"
            type="number"
            step="0.1"
            {...register('temperatura_muestra')}
            placeholder="25"
          />
        </div>

        {/* Resultado de simulación */}
        {simulacion && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Resultado de Clasificación
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500">Clasificación Resultante:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {simulacion.tipo_materia_prima_resultante?.nombre || 'Sin clasificación'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Cumple Especificación:</span>
                <p>
                  <Badge variant={simulacion.cumple_especificacion ? 'success' : 'danger'}>
                    {simulacion.cumple_especificacion ? 'Sí' : 'No'}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Mensaje:</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{simulacion.mensaje}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Acción y observaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Acción Tomada" {...register('accion_tomada')}>
          {ACCIONES_TOMADA.map((accion) => (
            <option key={accion.value} value={accion.value}>
              {accion.label}
            </option>
          ))}
        </Select>

        {(accionTomada === 'RECHAZADO' || accionTomada === 'DEVOLUCION') && (
          <Input
            label="Motivo de Rechazo/Devolución"
            type="text"
            {...register('motivo_rechazo')}
            placeholder="Especifique el motivo..."
          />
        )}
      </div>

      <Textarea
        label="Observaciones"
        {...register('observaciones')}
        rows={3}
        placeholder="Observaciones adicionales..."
      />

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
