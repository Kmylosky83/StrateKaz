/**
 * Modal para Gestionar Precios de Materia Prima
 *
 * Permite al Gerente o Super Admin gestionar los precios de todas las
 * materias primas que maneja un proveedor en una sola pantalla.
 *
 * Características:
 * - Tabla editable con todas las materias del proveedor
 * - Visualización de precio actual vs nuevo
 * - Cálculo automático de variación porcentual
 * - Motivo único para todos los cambios
 * - Solo guarda las filas modificadas
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Minus,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Proveedor, CambiarPrecioDTO } from '@/types/proveedores.types';
import {
  CODIGO_A_CATEGORIA,
  JERARQUIA_MATERIA_PRIMA,
  CODIGO_MATERIA_PRIMA_OPTIONS,
  getCodigosMateriaPorTipo,
} from '@/utils/constants';

// Valores legacy conocidos que deben expandirse
const LEGACY_VALUES = ['SEBO', 'HUESO', 'CABEZAS', 'ACU'];

interface PrecioFila {
  codigo: string;
  label: string;
  categoria: string;
  precioActual: number | null;
  precioNuevo: string;
  modificadoFecha?: string;
  modificadoPor?: string;
}

interface CambiarPrecioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CambiarPrecioDTO & { tipo_materia: string }) => Promise<void>;
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
  const [precios, setPrecios] = useState<PrecioFila[]>([]);
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });

  // Generar filas de precios basadas en las materias del proveedor
  const generarFilasPrecios = useCallback(() => {
    if (!proveedor?.subtipo_materia) return [];

    const filas: PrecioFila[] = [];

    proveedor.subtipo_materia.forEach((tipo) => {
      if (LEGACY_VALUES.includes(tipo)) {
        // Es legacy: expandir a códigos específicos
        const codigosEspecificos = getCodigosMateriaPorTipo(tipo);
        codigosEspecificos.forEach((codigo) => {
          const precioExistente = proveedor.precios_materia_prima?.find(
            (p) => p.tipo_materia === codigo.value
          );
          const categoria = CODIGO_A_CATEGORIA[codigo.value];
          const catInfo = categoria
            ? JERARQUIA_MATERIA_PRIMA[categoria as keyof typeof JERARQUIA_MATERIA_PRIMA]
            : null;

          filas.push({
            codigo: codigo.value,
            label: codigo.label,
            categoria: catInfo?.nombre || categoria || '',
            precioActual: precioExistente ? parseFloat(precioExistente.precio_kg) : null,
            precioNuevo: '',
            modificadoFecha: precioExistente?.modificado_fecha,
            modificadoPor: precioExistente?.modificado_por_nombre,
          });
        });
      } else {
        // Ya es código específico
        const precioExistente = proveedor.precios_materia_prima?.find(
          (p) => p.tipo_materia === tipo
        );
        const codigoInfo = CODIGO_MATERIA_PRIMA_OPTIONS.find((c) => c.value === tipo);
        const categoria = CODIGO_A_CATEGORIA[tipo];
        const catInfo = categoria
          ? JERARQUIA_MATERIA_PRIMA[categoria as keyof typeof JERARQUIA_MATERIA_PRIMA]
          : null;

        filas.push({
          codigo: tipo,
          label: codigoInfo?.label || tipo,
          categoria: catInfo?.nombre || categoria || '',
          precioActual: precioExistente ? parseFloat(precioExistente.precio_kg) : null,
          precioNuevo: '',
          modificadoFecha: precioExistente?.modificado_fecha,
          modificadoPor: precioExistente?.modificado_por_nombre,
        });
      }
    });

    // Eliminar duplicados
    return filas.filter(
      (fila, index, self) => index === self.findIndex((f) => f.codigo === fila.codigo)
    );
  }, [proveedor]);

  // Inicializar cuando se abre el modal
  useEffect(() => {
    if (isOpen && proveedor) {
      const filasGeneradas = generarFilasPrecios();
      setPrecios(filasGeneradas);
      setMotivo('');
      setErrores({});
      setProgreso({ actual: 0, total: 0 });
    }
  }, [isOpen, proveedor, generarFilasPrecios]);

  // Actualizar precio de una fila
  const handlePrecioChange = (codigo: string, valor: string) => {
    setPrecios((prev) =>
      prev.map((fila) => (fila.codigo === codigo ? { ...fila, precioNuevo: valor } : fila))
    );
    // Limpiar error si existe
    if (errores[codigo]) {
      setErrores((prev) => {
        const newErrors = { ...prev };
        delete newErrors[codigo];
        return newErrors;
      });
    }
  };

  // Calcular cambios pendientes
  const cambiosPendientes = useMemo(() => {
    return precios.filter((fila) => {
      if (!fila.precioNuevo) return false;
      const precioNuevo = parseFloat(fila.precioNuevo);
      if (isNaN(precioNuevo) || precioNuevo < 0) return false;
      // Solo si es diferente al actual (o es nuevo)
      return fila.precioActual === null || precioNuevo !== fila.precioActual;
    });
  }, [precios]);

  // Estadísticas
  const stats = useMemo(() => {
    const conPrecio = precios.filter((f) => f.precioActual !== null).length;
    const sinPrecio = precios.filter((f) => f.precioActual === null).length;
    const modificados = cambiosPendientes.length;
    return { conPrecio, sinPrecio, modificados, total: precios.length };
  }, [precios, cambiosPendientes]);

  // Validar antes de guardar
  const validar = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (cambiosPendientes.length === 0) {
      nuevosErrores['general'] = 'Debe modificar al menos un precio';
    }

    if (!motivo.trim() || motivo.trim().length < 10) {
      nuevosErrores['motivo'] = 'El motivo debe tener al menos 10 caracteres';
    }

    cambiosPendientes.forEach((fila) => {
      const precio = parseFloat(fila.precioNuevo);
      if (isNaN(precio)) {
        nuevosErrores[fila.codigo] = 'Precio inválido';
      } else if (precio < 0) {
        nuevosErrores[fila.codigo] = 'El precio no puede ser negativo';
      }
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Guardar cambios secuencialmente
  const handleGuardar = async () => {
    if (!validar()) return;

    setGuardando(true);
    setProgreso({ actual: 0, total: cambiosPendientes.length });

    try {
      for (let i = 0; i < cambiosPendientes.length; i++) {
        const fila = cambiosPendientes[i];
        setProgreso({ actual: i + 1, total: cambiosPendientes.length });

        await onSubmit({
          tipo_materia: fila.codigo,
          precio_nuevo: fila.precioNuevo,
          motivo: motivo.trim(),
        });
      }

      // Éxito: cerrar modal
      onClose();
    } catch (error) {
      // El error se maneja en el padre, pero podemos mostrar feedback
      console.error('Error guardando precios:', error);
    } finally {
      setGuardando(false);
      setProgreso({ actual: 0, total: 0 });
    }
  };

  // Calcular variación
  const calcularVariacion = (actual: number | null, nuevo: string) => {
    if (!nuevo) return null;
    const precioNuevo = parseFloat(nuevo);
    if (isNaN(precioNuevo)) return null;

    if (actual === null) {
      return { tipo: 'nuevo' as const, valor: precioNuevo, porcentaje: null };
    }

    const diferencia = precioNuevo - actual;
    if (diferencia === 0) return null;

    const porcentaje = actual > 0 ? (diferencia / actual) * 100 : 0;
    return {
      tipo: diferencia > 0 ? ('aumento' as const) : ('reduccion' as const),
      valor: diferencia,
      porcentaje,
    };
  };

  if (!proveedor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Precios de Compra"
      size="2xl"
    >
      <div className="space-y-6">
        {/* INFO DEL PROVEEDOR */}
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {proveedor.nombre_comercial}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {proveedor.tipo_proveedor_display} - {proveedor.ciudad}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={stats.conPrecio > 0 ? 'success' : 'gray'} size="sm">
                {stats.conPrecio} con precio
              </Badge>
              {stats.sinPrecio > 0 && (
                <Badge variant="warning" size="sm">
                  {stats.sinPrecio} sin precio
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* TABLA DE PRECIOS */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Materia Prima
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio Actual
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                  Nuevo Precio
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Variación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {precios.map((fila) => {
                const variacion = calcularVariacion(fila.precioActual, fila.precioNuevo);
                const tieneError = !!errores[fila.codigo];

                return (
                  <tr
                    key={fila.codigo}
                    className={cn(
                      'transition-colors',
                      variacion && 'bg-primary-50/50 dark:bg-primary-900/10'
                    )}
                  >
                    {/* MATERIA PRIMA */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {fila.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {fila.categoria}
                        </div>
                      </div>
                    </td>

                    {/* PRECIO ACTUAL */}
                    <td className="px-4 py-3 text-right">
                      {fila.precioActual !== null ? (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ${fila.precioActual.toLocaleString('es-CO')}
                          </div>
                          <div className="text-xs text-gray-400">/ kg</div>
                        </div>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Sin precio
                        </Badge>
                      )}
                    </td>

                    {/* NUEVO PRECIO (INPUT) */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={fila.precioNuevo}
                          onChange={(e) => handlePrecioChange(fila.codigo, e.target.value)}
                          placeholder={fila.precioActual?.toString() || '0'}
                          className={cn(
                            'block w-full rounded-lg border bg-white pl-7 pr-3 py-2 text-sm text-right',
                            'text-gray-900 placeholder-gray-400',
                            'focus:outline-none focus:ring-2',
                            'dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
                            tieneError
                              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600'
                          )}
                        />
                        {tieneError && (
                          <p className="text-xs text-danger-600 mt-1">{errores[fila.codigo]}</p>
                        )}
                      </div>
                    </td>

                    {/* VARIACIÓN */}
                    <td className="px-4 py-3 text-right">
                      {variacion ? (
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1',
                            variacion.tipo === 'nuevo' && 'text-info-600 dark:text-info-400',
                            variacion.tipo === 'aumento' && 'text-danger-600 dark:text-danger-400',
                            variacion.tipo === 'reduccion' && 'text-success-600 dark:text-success-400'
                          )}
                        >
                          {variacion.tipo === 'nuevo' && (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm font-medium">Nuevo</span>
                            </>
                          )}
                          {variacion.tipo === 'aumento' && (
                            <>
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                +{variacion.porcentaje?.toFixed(1)}%
                              </span>
                            </>
                          )}
                          {variacion.tipo === 'reduccion' && (
                            <>
                              <TrendingDown className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {variacion.porcentaje?.toFixed(1)}%
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <Minus className="h-4 w-4 text-gray-300 dark:text-gray-600 ml-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RESUMEN DE CAMBIOS */}
        {cambiosPendientes.length > 0 && (
          <Card variant="bordered" padding="sm" className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  {cambiosPendientes.length} precio{cambiosPendientes.length > 1 ? 's' : ''} por
                  actualizar
                </p>
                <ul className="mt-2 space-y-1">
                  {cambiosPendientes.map((fila) => {
                    const variacion = calcularVariacion(fila.precioActual, fila.precioNuevo);
                    return (
                      <li key={fila.codigo} className="text-sm text-primary-700 dark:text-primary-300">
                        <span className="font-medium">{fila.label}:</span>{' '}
                        {fila.precioActual !== null ? (
                          <>
                            ${fila.precioActual.toLocaleString('es-CO')} →{' '}
                            ${parseFloat(fila.precioNuevo).toLocaleString('es-CO')}
                            {variacion?.porcentaje && (
                              <span
                                className={cn(
                                  'ml-1',
                                  variacion.tipo === 'aumento' ? 'text-danger-600' : 'text-success-600'
                                )}
                              >
                                ({variacion.tipo === 'aumento' ? '+' : ''}
                                {variacion.porcentaje.toFixed(1)}%)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-info-600">
                            Precio inicial: ${parseFloat(fila.precioNuevo).toLocaleString('es-CO')}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* MOTIVO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Motivo del cambio *
          </label>
          <textarea
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (errores['motivo']) {
                setErrores((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors['motivo'];
                  return newErrors;
                });
              }
            }}
            rows={3}
            placeholder="Explique el motivo del cambio de precios (mínimo 10 caracteres)..."
            className={cn(
              'w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2',
              'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
              errores['motivo']
                ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600'
            )}
          />
          {errores['motivo'] && (
            <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errores['motivo']}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Este motivo se aplicará a todos los cambios realizados
          </p>
        </div>

        {/* ERROR GENERAL */}
        {errores['general'] && (
          <Card variant="bordered" padding="sm" className="bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
              <p className="text-sm text-danger-700 dark:text-danger-300">{errores['general']}</p>
            </div>
          </Card>
        )}

        {/* PROGRESO DE GUARDADO */}
        {guardando && progreso.total > 0 && (
          <Card variant="bordered" padding="sm" className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-info-900 dark:text-info-100">
                  Guardando cambios...
                </span>
                <span className="text-sm text-info-700 dark:text-info-300">
                  {progreso.actual} de {progreso.total}
                </span>
              </div>
              <div className="w-full bg-info-200 dark:bg-info-800 rounded-full h-2">
                <div
                  className="bg-info-600 dark:bg-info-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* ADVERTENCIA */}
        <Card variant="bordered" padding="sm" className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5" />
            <p className="text-sm text-warning-800 dark:text-warning-200">
              Los cambios quedarán registrados en el historial de precios con tu nombre de usuario y
              la fecha actual.
            </p>
          </div>
        </Card>

        {/* BOTONES */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleGuardar}
            disabled={guardando || cambiosPendientes.length === 0}
          >
            {guardando ? (
              <>Guardando...</>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Guardar {cambiosPendientes.length > 0 ? `(${cambiosPendientes.length})` : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
