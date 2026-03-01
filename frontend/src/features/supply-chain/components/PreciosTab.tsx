/**
 * Tab Precios - Gestión de precios de materias primas por proveedor
 *
 * Muestra tabla de proveedores con sus precios actuales.
 * Permite cambiar precios y ver historial de cambios.
 */
import { useState } from 'react';
import { DollarSign, History, TrendingUp, TrendingDown, Minus, Edit } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';

import { useProveedores, useCambiarPrecio, useHistorialPrecios } from '../hooks/useProveedores';
import type { PrecioMateriaPrima, HistorialPrecioProveedor } from '../types';

// ==================== UTILIDADES ====================

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// ==================== COMPONENTE ====================

export function PreciosTab() {
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(null);
  const [selectedProveedorNombre, setSelectedProveedorNombre] = useState('');
  const [showCambiarPrecio, setShowCambiarPrecio] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [precioSeleccionado, setPrecioSeleccionado] = useState<PrecioMateriaPrima | null>(null);

  // Query proveedores activos (includes precios_materia_prima nested)
  const { data: proveedoresData, isLoading } = useProveedores({ is_active: true });
  const proveedores = Array.isArray(proveedoresData)
    ? proveedoresData
    : proveedoresData?.results || [];

  // Filtrar solo proveedores que tienen precios
  const proveedoresConPrecios = proveedores.filter(
    (p: any) => p.precios_materia_prima && p.precios_materia_prima.length > 0
  );

  // Mutations
  const cambiarPrecioMutation = useCambiarPrecio();

  // Historial
  const { data: historialData, isLoading: isLoadingHistorial } = useHistorialPrecios(
    selectedProveedorId || 0
  );
  const historial: HistorialPrecioProveedor[] = Array.isArray(historialData)
    ? historialData
    : (historialData as any)?.results || [];

  // ==================== HANDLERS ====================

  const handleCambiarPrecio = (
    proveedorId: number,
    proveedorNombre: string,
    precio: PrecioMateriaPrima
  ) => {
    setSelectedProveedorId(proveedorId);
    setSelectedProveedorNombre(proveedorNombre);
    setPrecioSeleccionado(precio);
    setShowCambiarPrecio(true);
  };

  const handleVerHistorial = (proveedorId: number, proveedorNombre: string) => {
    setSelectedProveedorId(proveedorId);
    setSelectedProveedorNombre(proveedorNombre);
    setShowHistorial(true);
  };

  const handleSubmitCambio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProveedorId || !precioSeleccionado) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    await cambiarPrecioMutation.mutateAsync({
      id: selectedProveedorId,
      data: {
        tipo_materia_prima: precioSeleccionado.tipo_materia_prima,
        precio_nuevo: Number(formData.get('precio_nuevo')),
        motivo_cambio: String(formData.get('motivo_cambio') || ''),
      },
    });
    setShowCambiarPrecio(false);
    setPrecioSeleccionado(null);
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (proveedoresConPrecios.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign className="w-16 h-16" />}
        title="No hay precios registrados"
        description="Los precios se crean al registrar un proveedor de materia prima con precios por tipo"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Precios por Proveedor ({proveedoresConPrecios.length} proveedores)
        </h3>
      </div>

      {/* Tabla de precios */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo Materia Prima
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio/Kg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {proveedoresConPrecios.map((prov: any) =>
                prov.precios_materia_prima.map((precio: PrecioMateriaPrima, idx: number) => (
                  <tr
                    key={`${prov.id}-${precio.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {idx === 0 && (
                      <td
                        className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
                        rowSpan={prov.precios_materia_prima.length}
                      >
                        <div>
                          <p>{prov.razon_social || prov.nombre_comercial}</p>
                          <p className="text-xs text-gray-500">{prov.numero_documento}</p>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {precio.tipo_materia_prima_nombre || `MP #${precio.tipo_materia_prima}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(precio.precio_unitario)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {precio.fecha_vigencia ? formatDate(precio.fecha_vigencia) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCambiarPrecio(prov.id, prov.razon_social, precio)}
                          title="Cambiar precio"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {idx === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerHistorial(prov.id, prov.razon_social)}
                            title="Ver historial de precios"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Cambiar Precio */}
      <Modal
        isOpen={showCambiarPrecio}
        onClose={() => {
          setShowCambiarPrecio(false);
          setPrecioSeleccionado(null);
        }}
        title="Cambiar Precio"
        size="md"
      >
        <form onSubmit={handleSubmitCambio} className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>
              Proveedor: <strong>{selectedProveedorNombre}</strong>
            </p>
            <p>
              Materia prima: <strong>{precioSeleccionado?.tipo_materia_prima_nombre}</strong>
            </p>
            <p>
              Precio actual:{' '}
              <strong>
                {precioSeleccionado ? formatCurrency(precioSeleccionado.precio_unitario) : '-'}
              </strong>
            </p>
          </div>

          <Input
            label="Nuevo Precio (COP/Kg) *"
            type="number"
            name="precio_nuevo"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
          />

          <Textarea
            label="Motivo del Cambio"
            name="motivo_cambio"
            rows={2}
            placeholder="Ej: Ajuste por inflación, nuevo contrato..."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCambiarPrecio(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={cambiarPrecioMutation.isPending}>
              {cambiarPrecioMutation.isPending ? 'Guardando...' : 'Cambiar Precio'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Historial de Precios */}
      <Modal
        isOpen={showHistorial}
        onClose={() => setShowHistorial(false)}
        title={`Historial de Precios \u2014 ${selectedProveedorNombre}`}
        size="lg"
      >
        {isLoadingHistorial ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : historial.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay historial de cambios de precio</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Materia Prima
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Anterior
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Nuevo
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Variación
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {historial.map((h) => {
                  const variacion = Number(h.porcentaje_variacion);
                  return (
                    <tr key={h.id}>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(h.fecha_cambio)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {h.tipo_materia_prima_nombre}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-300">
                        {formatCurrency(h.precio_anterior)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(h.precio_nuevo)}
                      </td>
                      <td className="px-4 py-2 text-sm text-center">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            variacion > 0
                              ? 'text-danger-600'
                              : variacion < 0
                                ? 'text-success-600'
                                : 'text-gray-500'
                          }`}
                        >
                          {variacion > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : variacion < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          {variacion > 0 ? '+' : ''}
                          {variacion.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {h.motivo_cambio || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
