/**
 * Componente: Formulario de Prueba de Acidez
 *
 * Características:
 * - Registro de pruebas de acidez
 * - Simulación de clasificación automática
 * - Validación de campos
 */
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FlaskConical, Calculator, Save, X } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

import { useCreatePruebaAcidez, useUpdatePruebaAcidez, useSimularPruebaAcidez } from '../hooks/usePruebasAcidez';
import { useProveedores } from '../hooks/useProveedores';
import { useTiposMateriaPrima } from '../hooks/useCatalogos';
import type { PruebaAcidez, CreatePruebaAcidezDTO, SimularPruebaAcidezResponse } from '../types';

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

export function PruebaAcidezForm({ prueba, proveedorId, onSuccess, onCancel }: PruebaAcidezFormProps) {
  const [simulacion, setSimulacion] = useState<SimularPruebaAcidezResponse | null>(null);

  const isEditing = !!prueba;

  // Mutations
  const createMutation = useCreatePruebaAcidez();
  const updateMutation = useUpdatePruebaAcidez();
  const simularMutation = useSimularPruebaAcidez();

  // Queries
  const { data: proveedoresData } = useProveedores({ estado: 'ACTIVO' });
  const { data: tiposMateriaPrimaData } = useTiposMateriaPrima({ is_active: true });

  const proveedores = Array.isArray(proveedoresData) ? proveedoresData : proveedoresData?.results || [];
  const tiposMateriaPrima = Array.isArray(tiposMateriaPrimaData) ? tiposMateriaPrimaData : tiposMateriaPrimaData?.results || [];

  // Form
  const {
    register,
    handleSubmit,
    control,
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
    } catch (error) {
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
        {/* Código */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Código *
          </label>
          <input
            type="text"
            {...register('codigo', { required: 'El código es requerido' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="PA-XXXXXX"
          />
          {errors.codigo && (
            <p className="text-sm text-danger-500 mt-1">{errors.codigo.message}</p>
          )}
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha de Prueba *
          </label>
          <input
            type="date"
            {...register('fecha_prueba', { required: 'La fecha es requerida' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          {errors.fecha_prueba && (
            <p className="text-sm text-danger-500 mt-1">{errors.fecha_prueba.message}</p>
          )}
        </div>

        {/* Hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hora de Prueba
          </label>
          <input
            type="time"
            {...register('hora_prueba')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Proveedor */}
        {!proveedorId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor *
            </label>
            <select
              {...register('proveedor', { required: 'El proveedor es requerido' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Seleccione...</option>
              {proveedores.map((prov: any) => (
                <option key={prov.id} value={prov.id}>
                  {prov.razon_social}
                </option>
              ))}
            </select>
            {errors.proveedor && (
              <p className="text-sm text-danger-500 mt-1">{errors.proveedor.message}</p>
            )}
          </div>
        )}

        {/* Lote Recepción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Lote de Recepción
          </label>
          <input
            type="text"
            {...register('lote_recepcion')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ej: LOTE-001"
          />
        </div>

        {/* Tipo Materia Prima Original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo Materia Prima Original *
          </label>
          <select
            {...register('tipo_materia_prima_original', { required: 'El tipo de materia prima es requerido' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Seleccione...</option>
            {tiposMateriaPrima.map((tipo: any) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre} ({tipo.codigo})
              </option>
            ))}
          </select>
          {errors.tipo_materia_prima_original && (
            <p className="text-sm text-danger-500 mt-1">{errors.tipo_materia_prima_original.message}</p>
          )}
        </div>
      </div>

      {/* Resultados de la prueba */}
      <Card variant="bordered" padding="md">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Resultados de la Prueba</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valor de Acidez */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor de Acidez (%) *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('valor_acidez', {
                  required: 'El valor de acidez es requerido',
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                  max: { value: 100, message: 'Debe ser menor o igual a 100' },
                })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0.00"
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
            {errors.valor_acidez && (
              <p className="text-sm text-danger-500 mt-1">{errors.valor_acidez.message}</p>
            )}
          </div>

          {/* Método de Prueba */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Método de Prueba
            </label>
            <input
              type="text"
              {...register('metodo_prueba')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ej: Titulación"
            />
          </div>

          {/* Temperatura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temperatura Muestra (°C)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('temperatura_muestra')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="25"
            />
          </div>
        </div>

        {/* Resultado de simulación */}
        {simulacion && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Resultado de Clasificación</h5>
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
        {/* Acción Tomada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Acción Tomada
          </label>
          <select
            {...register('accion_tomada')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {ACCIONES_TOMADA.map((accion) => (
              <option key={accion.value} value={accion.value}>
                {accion.label}
              </option>
            ))}
          </select>
        </div>

        {/* Motivo Rechazo */}
        {(accionTomada === 'RECHAZADO' || accionTomada === 'DEVOLUCION') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo de Rechazo/Devolución
            </label>
            <input
              type="text"
              {...register('motivo_rechazo')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Especifique el motivo..."
            />
          </div>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observaciones
        </label>
        <textarea
          {...register('observaciones')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Observaciones adicionales..."
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} leftIcon={<X className="w-4 h-4" />}>
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
