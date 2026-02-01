import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { proveedoresAPI } from '@/api/proveedores.api';
import type {
  Proveedor,
  SimularPruebaAcidezResponse,
  CalidadSebo,
} from '@/types/proveedores.types';

// Schema de validación
const pruebaAcidezSchema = z.object({
  proveedor: z.number({ required_error: 'Seleccione un proveedor' }),
  fecha_prueba: z.string().min(1, 'La fecha es requerida'),
  valor_acidez: z
    .number({ required_error: 'El valor de acidez es requerido' })
    .min(0, 'El valor debe ser mayor o igual a 0')
    .max(100, 'El valor no puede ser mayor a 100%'),
  cantidad_kg: z
    .number({ required_error: 'La cantidad es requerida' })
    .positive('La cantidad debe ser mayor a 0'),
  observaciones: z.string().optional(),
  lote_numero: z.string().optional(),
});

type PruebaAcidezFormData = z.infer<typeof pruebaAcidezSchema>;

// Colores por calidad
const CALIDAD_COLORS: Record<CalidadSebo, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  B: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  B1: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-700' },
  B2: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700' },
  B4: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700' },
  C: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-700' },
};

interface PruebaAcidezFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedores: Proveedor[];
  proveedorPreseleccionado?: number;
}

export const PruebaAcidezForm = ({
  isOpen,
  onClose,
  onSuccess,
  proveedores,
  proveedorPreseleccionado,
}: PruebaAcidezFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulacion, setSimulacion] = useState<SimularPruebaAcidezResponse | null>(null);
  const [isSimulando, setIsSimulando] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PruebaAcidezFormData>({
    resolver: zodResolver(pruebaAcidezSchema),
    defaultValues: {
      fecha_prueba: new Date().toISOString().split('T')[0],
      proveedor: proveedorPreseleccionado,
    },
  });

  const watchedProveedor = watch('proveedor');
  const watchedAcidez = watch('valor_acidez');
  const watchedCantidad = watch('cantidad_kg');

  // Filtrar solo proveedores de sebo
  const proveedoresSebo = proveedores.filter(
    (p) =>
      p.es_proveedor_materia_prima &&
      p.subtipo_materia?.includes('SEBO') &&
      p.is_active
  );

  // Preseleccionar proveedor si viene como prop
  useEffect(() => {
    if (proveedorPreseleccionado && isOpen) {
      setValue('proveedor', proveedorPreseleccionado);
    }
  }, [proveedorPreseleccionado, isOpen, setValue]);

  // Simular resultado cuando cambia acidez o proveedor
  useEffect(() => {
    const simular = async () => {
      if (!watchedProveedor || watchedAcidez === undefined || watchedAcidez === null) {
        setSimulacion(null);
        return;
      }

      setIsSimulando(true);
      try {
        const result = await proveedoresAPI.simularPruebaAcidez({
          proveedor_id: watchedProveedor,
          valor_acidez: watchedAcidez,
          cantidad_kg: watchedCantidad || undefined,
        });
        setSimulacion(result);
      } catch (error) {
        console.error('Error simulando prueba:', error);
        setSimulacion(null);
      } finally {
        setIsSimulando(false);
      }
    };

    // Debounce de 500ms
    const timer = setTimeout(simular, 500);
    return () => clearTimeout(timer);
  }, [watchedProveedor, watchedAcidez, watchedCantidad]);

  // Manejar selección de foto
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setFotoError('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFotoError('La imagen no puede superar 5MB');
      return;
    }

    setFotoError(null);
    setFotoFile(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Manejar envío del formulario
  const handleFormSubmit = async (data: PruebaAcidezFormData) => {
    if (!fotoFile) {
      setFotoError('La foto de la prueba es obligatoria');
      return;
    }

    setIsSubmitting(true);
    try {
      await proveedoresAPI.createPruebaAcidez({
        proveedor: data.proveedor,
        fecha_prueba: data.fecha_prueba,
        valor_acidez: data.valor_acidez,
        cantidad_kg: data.cantidad_kg,
        foto_prueba: fotoFile,
        observaciones: data.observaciones,
        lote_numero: data.lote_numero,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creando prueba de acidez:', error);
      alert(error.response?.data?.detail || 'Error al registrar la prueba de acidez');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpiar estado al cerrar
  const handleClose = () => {
    reset();
    setFotoFile(null);
    setFotoPreview(null);
    setFotoError(null);
    setSimulacion(null);
    onClose();
  };

  // Opciones de proveedores
  const proveedorOptions = [
    { value: '', label: 'Seleccione un proveedor de sebo' },
    ...proveedoresSebo.map((p) => ({
      value: String(p.id),
      label: `${p.nombre_comercial} (${p.numero_documento})`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Prueba de Acidez"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Información del proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Proveedor de Sebo *"
            {...register('proveedor', { valueAsNumber: true })}
            options={proveedorOptions}
            error={errors.proveedor?.message}
            disabled={!!proveedorPreseleccionado}
          />

          <Input
            label="Fecha de Prueba *"
            type="date"
            {...register('fecha_prueba')}
            error={errors.fecha_prueba?.message}
          />
        </div>

        {/* Datos de la prueba */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Valor de Acidez (%) *"
            type="number"
            step="0.01"
            {...register('valor_acidez', { valueAsNumber: true })}
            error={errors.valor_acidez?.message}
            placeholder="Ej: 4.5"
          />

          <Input
            label="Cantidad (kg) *"
            type="number"
            step="0.01"
            {...register('cantidad_kg', { valueAsNumber: true })}
            error={errors.cantidad_kg?.message}
            placeholder="Ej: 500"
          />
        </div>

        {/* Preview de resultado */}
        {isSimulando && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
            <span className="text-gray-600 dark:text-gray-400">Calculando resultado...</span>
          </div>
        )}

        {simulacion && !isSimulando && (
          <div
            className={`p-4 rounded-lg border-2 ${
              CALIDAD_COLORS[simulacion.calidad_resultante].bg
            } ${CALIDAD_COLORS[simulacion.calidad_resultante].border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Calidad Resultante:
                </span>
                <span
                  className={`ml-2 text-xl font-bold ${
                    CALIDAD_COLORS[simulacion.calidad_resultante].text
                  }`}
                >
                  {simulacion.calidad_resultante_display}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Código:
                </span>
                <span className={`ml-2 font-mono font-bold ${CALIDAD_COLORS[simulacion.calidad_resultante].text}`}>
                  {simulacion.codigo_materia}
                </span>
              </div>
            </div>

            {simulacion.precio_existe && simulacion.precio_kg && (
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Precio/kg:</span>
                  <span className="ml-2 font-bold text-gray-900 dark:text-gray-100">
                    ${simulacion.precio_kg.toLocaleString('es-CO')}
                  </span>
                </div>
                {simulacion.valor_total && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Valor Total:</span>
                    <span className="ml-2 font-bold text-green-700 dark:text-green-400">
                      ${simulacion.valor_total.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!simulacion.precio_existe && (
              <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Este proveedor no tiene precio configurado para {simulacion.codigo_materia}
              </div>
            )}
          </div>
        )}

        {/* Foto de la prueba */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Foto de la Prueba *
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
              ${fotoPreview ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}
              hover:border-primary-500 dark:hover:border-primary-400
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="hidden"
            />

            {fotoPreview ? (
              <div className="flex items-center gap-4">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {fotoFile?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {((fotoFile?.size || 0) / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFotoFile(null);
                      setFotoPreview(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-800 mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Haz clic para subir la foto de la prueba
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG hasta 5MB
                </p>
              </div>
            )}
          </div>

          {fotoError && (
            <p className="mt-1 text-sm text-red-600">{fotoError}</p>
          )}
        </div>

        {/* Campos opcionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Número de Lote"
            {...register('lote_numero')}
            error={errors.lote_numero?.message}
            placeholder="Ej: LOTE-2024-001"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observaciones
            </label>
            <textarea
              {...register('observaciones')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !fotoFile}>
            {isSubmitting ? 'Registrando...' : 'Registrar Prueba'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
