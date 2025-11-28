/**
 * Modal para Cambiar/Asignar Precio de Materia Prima
 *
 * Permite al Gerente o Super Admin asignar o modificar el precio por kg
 * de cada código específico de materia prima que maneja un proveedor.
 *
 * IMPORTANTE: Usa los 18 códigos específicos de materia prima
 * Cada código tiene un precio independiente que el Gerente puede modificar.
 *
 * Características:
 * - Selector de tipo de materia prima basado en los que maneja el proveedor
 * - Muestra precio actual (si existe)
 * - Visualización de cambio con % de variación
 * - Registro de motivo obligatorio
 * - Auditoría completa en historial
 */
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { Proveedor, CambiarPrecioDTO } from '@/types/proveedores.types';
import { CODIGO_MATERIA_PRIMA_DICT, CODIGO_A_CATEGORIA, JERARQUIA_MATERIA_PRIMA } from '@/utils/constants';

const cambiarPrecioSchema = z.object({
  tipo_materia: z.string().min(1, 'Debe seleccionar un tipo de materia prima'),
  precio_nuevo: z
    .string()
    .min(1, 'El precio es requerido')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500),
});

type CambiarPrecioFormData = z.infer<typeof cambiarPrecioSchema>;

interface CambiarPrecioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CambiarPrecioDTO & { tipo_materia: string }) => void;
  proveedor: Proveedor | null;
  isLoading?: boolean;
}

export const CambiarPrecioModal = ({
  isOpen,
  onClose,
  onSubmit,
  proveedor,
  isLoading,
}: CambiarPrecioModalProps) => {
  const [selectedCodigoMateria, setSelectedCodigoMateria] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CambiarPrecioFormData>({
    resolver: zodResolver(cambiarPrecioSchema),
  });

  const precioNuevo = watch('precio_nuevo');
  const tipoMateriaWatch = watch('tipo_materia');

  // Actualizar el estado cuando cambia el tipo de materia en el formulario
  useEffect(() => {
    if (tipoMateriaWatch) {
      setSelectedCodigoMateria(tipoMateriaWatch);
    }
  }, [tipoMateriaWatch]);

  useEffect(() => {
    if (isOpen && proveedor) {
      // Si solo tiene un tipo de materia, pre-seleccionarlo
      if (proveedor.subtipo_materia && proveedor.subtipo_materia.length === 1) {
        const codigo = proveedor.subtipo_materia[0];
        setValue('tipo_materia', codigo);
        setSelectedCodigoMateria(codigo);
      } else {
        reset();
        setSelectedCodigoMateria('');
      }
    }
  }, [isOpen, proveedor, setValue, reset]);

  // Opciones de materias primas basadas en los códigos que maneja el proveedor
  // Agrupadas por categoría para mejor visualización
  const materiasOptions = useMemo(() => {
    if (!proveedor?.subtipo_materia) return [];

    // Agrupar por categoría
    const porCategoria: Record<string, Array<{ value: string; label: string }>> = {};

    proveedor.subtipo_materia.forEach((codigo) => {
      const categoria = CODIGO_A_CATEGORIA[codigo] || 'OTROS';
      if (!porCategoria[categoria]) {
        porCategoria[categoria] = [];
      }
      porCategoria[categoria].push({
        value: codigo,
        label: CODIGO_MATERIA_PRIMA_DICT[codigo] || codigo,
      });
    });

    // Convertir a opciones con grupos
    const opciones: Array<{ value: string; label: string }> = [];

    // Orden de categorías
    const ordenCategorias = ['HUESO', 'SEBO_CRUDO', 'SEBO_PROCESADO', 'OTROS'];

    ordenCategorias.forEach((cat) => {
      if (porCategoria[cat]) {
        const catInfo = JERARQUIA_MATERIA_PRIMA[cat as keyof typeof JERARQUIA_MATERIA_PRIMA];
        // Agregar cada opción
        porCategoria[cat].forEach((opt) => {
          opciones.push({
            value: opt.value,
            label: `${catInfo?.nombre || cat} - ${opt.label}`,
          });
        });
      }
    });

    return opciones;
  }, [proveedor?.subtipo_materia]);

  const handleFormSubmit = (data: CambiarPrecioFormData) => {
    const precioActualObj = proveedor?.precios_materia_prima?.find(
      (p) => p.tipo_materia === data.tipo_materia
    );
    const precioActual = precioActualObj ? parseFloat(precioActualObj.precio_kg) : 0;
    const nuevoPrecio = parseFloat(data.precio_nuevo);

    // Si existe precio actual, validar que sea diferente
    if (precioActualObj && precioActual === nuevoPrecio) {
      alert('El nuevo precio debe ser diferente al precio actual');
      return;
    }

    onSubmit({
      tipo_materia: data.tipo_materia,
      precio_nuevo: data.precio_nuevo,
      motivo: data.motivo,
    });
  };

  if (!proveedor) return null;

  // Obtener precio actual del código seleccionado
  const precioActualObj = selectedCodigoMateria
    ? proveedor.precios_materia_prima?.find((p) => p.tipo_materia === selectedCodigoMateria)
    : null;
  const precioActual = precioActualObj ? parseFloat(precioActualObj.precio_kg) : 0;
  const tienePrecioActual = !!precioActualObj;

  // Calcular diferencia y cambio porcentual
  const nuevoPrecio = precioNuevo ? parseFloat(precioNuevo) : null;
  const diferencia = nuevoPrecio !== null && tienePrecioActual ? nuevoPrecio - precioActual : null;
  const porcentajeCambio =
    diferencia !== null && precioActual > 0
      ? ((diferencia / precioActual) * 100).toFixed(2)
      : null;

  const esAumento = diferencia !== null && diferencia > 0;
  const esReduccion = diferencia !== null && diferencia < 0;
  const esNuevoPrecio = !tienePrecioActual && nuevoPrecio !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tienePrecioActual ? 'Cambiar Precio de Compra' : 'Asignar Precio de Compra'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* INFO DEL PROVEEDOR */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{proveedor.nombre_comercial}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Tipo:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{proveedor.tipo_proveedor_display}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Ciudad:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{proveedor.ciudad}</span>
            </div>
          </div>
          {proveedor.subtipo_materia && proveedor.subtipo_materia.length > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Materias que maneja:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {proveedor.subtipo_materia_display?.join(', ') || proveedor.subtipo_materia.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* SELECTOR DE MATERIA PRIMA */}
        <div>
          <Select
            label="Materia Prima *"
            {...register('tipo_materia')}
            options={materiasOptions}
            error={errors.tipo_materia?.message}
            placeholder="Seleccione el tipo de materia prima"
            disabled={materiasOptions.length === 1}
          />
          {materiasOptions.length === 1 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este proveedor solo maneja un tipo de materia prima
            </p>
          )}
          {materiasOptions.length > 1 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este proveedor maneja {materiasOptions.length} tipos de materia prima
            </p>
          )}
        </div>

        {/* PRECIO ACTUAL (si existe) */}
        {selectedCodigoMateria && tienePrecioActual && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Precio Actual</span>
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              ${precioActual.toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kg
            </div>
            {precioActualObj && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Última modificación:{' '}
                {new Date(precioActualObj.modificado_fecha).toLocaleDateString('es-CO')}
                {precioActualObj.modificado_por_nombre &&
                  ` por ${precioActualObj.modificado_por_nombre}`}
              </p>
            )}
          </div>
        )}

        {/* ALERTA SI NO TIENE PRECIO */}
        {selectedCodigoMateria && !tienePrecioActual && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Este código de materia prima no tiene precio asignado
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Está a punto de asignar el precio inicial
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NUEVO PRECIO */}
        <div>
          <Input
            label="Nuevo Precio ($/kg) *"
            type="number"
            step="0.01"
            min="0"
            {...register('precio_nuevo')}
            error={errors.precio_nuevo?.message}
            placeholder="Ingrese el nuevo precio"
          />
        </div>

        {/* VISUALIZACIÓN DE CAMBIO */}
        {esNuevoPrecio && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Precio Inicial</span>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${nuevoPrecio?.toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kg
            </div>
          </div>
        )}

        {diferencia !== null && diferencia !== 0 && (
          <div
            className={`p-4 rounded-lg border ${
              esAumento
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : esReduccion
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {esAumento ? (
                <>
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">Aumento de Precio</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Reducción de Precio</span>
                </>
              )}
            </div>
            <div className={`text-2xl font-bold ${esAumento ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
              {esAumento ? '+' : ''}${diferencia.toLocaleString('es-CO', { minimumFractionDigits: 2 })}{' '}
              / kg
            </div>
            {porcentajeCambio && (
              <p className={`text-sm mt-1 ${esAumento ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                {esAumento ? '+' : ''}{porcentajeCambio}% respecto al precio actual
              </p>
            )}
          </div>
        )}

        {/* MOTIVO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Motivo del {tienePrecioActual ? 'Cambio' : 'Precio Inicial'} *
          </label>
          <textarea
            {...register('motivo')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={
              tienePrecioActual
                ? 'Explique el motivo del cambio de precio (mínimo 10 caracteres)...'
                : 'Explique el motivo del precio inicial (mínimo 10 caracteres)...'
            }
          />
          {errors.motivo && (
            <p className="mt-1 text-sm text-red-600">{errors.motivo.message}</p>
          )}
        </div>

        {/* ADVERTENCIA */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Advertencia:</strong> Este cambio quedará registrado en el historial de precios
            con tu nombre de usuario y la fecha actual. Asegúrate de que el precio y el motivo sean
            correctos antes de confirmar.
          </p>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={esAumento ? 'danger' : 'primary'}
            disabled={isLoading || (tienePrecioActual && diferencia === 0) || !selectedCodigoMateria}
          >
            {isLoading ? 'Guardando...' : tienePrecioActual ? 'Confirmar Cambio' : 'Asignar Precio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
