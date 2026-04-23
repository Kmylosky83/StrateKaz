/**
 * PreciosProveedorModal — Modal amplio con tabla de MPs editables de un proveedor.
 *
 * Post refactor 2026-04-21:
 *   Reemplaza la vista inline de PreciosTab por un modal escalable.
 *   Pensado para tenants con muchos proveedores (1000+) donde un selector
 *   unico seria confuso.
 *
 * Trazabilidad:
 *   - Cambios de precio_kg → HistorialPrecioProveedor append-only (BE)
 */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

// Fase 1 modalidad: la modalidad ahora es atributo del proveedor, no del
// precio. Se conservan los campos modalidad_logistica en el payload batch
// como no-op para compatibilidad con el endpoint actual — enviados como
// null. La modalidad se muestra como contexto en PreciosTab.
import { getPreciosPorProveedor, guardarPreciosPorProveedor } from '../api/precios.api';
import type { PrecioMPPorProveedorRow, BatchPrecioItem } from '../types/precio.types';
import { getApiErrorMessage } from '@/utils/errorUtils';
import HistorialPrecioDialog from './HistorialPrecioDialog';

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
};

interface RowState {
  precio_kg: string;
  modalidad_logistica: number | null;
  dirty: boolean;
}

interface PreciosProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedorId: number | null;
  proveedorNombre?: string;
  canEdit: boolean;
}

export default function PreciosProveedorModal({
  isOpen,
  onClose,
  proveedorId,
  proveedorNombre,
  canEdit,
}: PreciosProveedorModalProps) {
  const queryClient = useQueryClient();
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});
  const [historialFor, setHistorialFor] = useState<{
    productoId: number;
    productoNombre: string;
  } | null>(null);

  const { data, isLoading, refetch } = useQuery<PrecioMPPorProveedorRow[]>({
    queryKey: ['sc-precios-por-proveedor', proveedorId],
    queryFn: () => getPreciosPorProveedor(proveedorId!),
    enabled: !!proveedorId && isOpen,
  });

  const filas = data ?? [];

  useEffect(() => {
    if (!data) return;
    const next: Record<number, RowState> = {};
    for (const f of data) {
      next[f.producto] = {
        precio_kg: f.precio_kg ?? '',
        modalidad_logistica: f.modalidad_logistica,
        dirty: false,
      };
    }
    setRowStates(next);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: guardarPreciosPorProveedor,
    onSuccess: (resp) => {
      const total = resp.creados.length + resp.actualizados.length;
      if (resp.errores.length > 0) {
        toast.warning(`${total} precio(s) guardado(s), ${resp.errores.length} error(es).`);
      } else {
        toast.success(`${total} precio(s) guardado(s).`);
      }
      queryClient.invalidateQueries({ queryKey: ['sc-precios-mp'] });
      queryClient.invalidateQueries({ queryKey: ['sc-precios-por-proveedor'] });
      queryClient.invalidateQueries({ queryKey: ['sc-precios-resumen-por-proveedor'] });
      queryClient.invalidateQueries({ queryKey: ['sc-historial-precios'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al guardar precios'));
    },
  });

  const updateRow = (productoId: number, patch: Partial<RowState>) => {
    setRowStates((prev) => ({
      ...prev,
      [productoId]: {
        precio_kg: prev[productoId]?.precio_kg ?? '',
        modalidad_logistica: prev[productoId]?.modalidad_logistica ?? null,
        ...patch,
        dirty: true,
      },
    }));
  };

  const dirtyCount = Object.values(rowStates).filter((r) => r.dirty).length;

  const handleSave = async () => {
    if (!proveedorId) return;
    const items: BatchPrecioItem[] = Object.entries(rowStates)
      .filter(([, r]) => r.dirty)
      .map(([productoId, r]) => ({
        producto: Number(productoId),
        precio_kg: r.precio_kg === '' ? null : r.precio_kg,
        modalidad_logistica: r.modalidad_logistica,
      }));
    if (items.length === 0) {
      toast.info('No hay cambios para guardar.');
      return;
    }
    await saveMutation.mutateAsync({ proveedor: proveedorId, precios: items });
  };

  const handleClose = () => {
    if (dirtyCount > 0) {
      if (!window.confirm(`Hay ${dirtyCount} cambio(s) sin guardar. ¿Descartar?`)) return;
    }
    onClose();
  };

  const statsConPrecio = filas.filter((f) => !f.es_pendiente).length;
  const statsPendientes = filas.filter((f) => f.es_pendiente).length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Precios de ${proveedorNombre ?? 'Proveedor'}`}
      size="2xl"
      footer={
        <div className="flex justify-between items-center w-full gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {dirtyCount > 0 ? (
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                {dirtyCount} fila(s) sin guardar
              </span>
            ) : (
              `${statsConPrecio} con precio · ${statsPendientes} pendiente(s)`
            )}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <History className="w-4 h-4 mr-1" /> Recargar
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={dirtyCount === 0 || saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                {saveMutation.isPending
                  ? 'Guardando...'
                  : `Guardar ${dirtyCount > 0 ? `(${dirtyCount})` : ''}`}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : filas.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          title="El proveedor no tiene materias primas asignadas"
          description="Asigne MPs desde Catálogo de Productos → Proveedores (editar el proveedor y marcar las MPs)."
        />
      ) : (
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Materia Prima
                </th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Estado
                </th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300 w-40">
                  Precio/kg (COP)
                </th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300 w-24">
                  Historial
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filas.map((fila) => {
                const row = rowStates[fila.producto] ?? {
                  precio_kg: '',
                  modalidad_logistica: null,
                  dirty: false,
                };
                return (
                  <tr
                    key={fila.producto}
                    className={
                      row.dirty
                        ? 'bg-yellow-50 dark:bg-yellow-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {fila.producto_nombre}
                      <div className="text-xs text-gray-500 font-mono">{fila.producto_codigo}</div>
                    </td>
                    <td className="px-3 py-2">
                      {fila.es_pendiente ? (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3 mr-1 inline" />
                          Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="success">{formatCurrency(fila.precio_kg ?? 0)}</Badge>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0"
                        disabled={!canEdit}
                        value={row.precio_kg}
                        onChange={(e) => updateRow(fila.producto, { precio_kg: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <div className="text-xs text-gray-500 mt-0.5">
                        por {fila.unidad_medida || 'kg'}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      {!fila.es_pendiente && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setHistorialFor({
                              productoId: fila.producto,
                              productoNombre: fila.producto_nombre,
                            })
                          }
                          title="Ver historial de cambios de precio"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-modal: historial del precio seleccionado */}
      <HistorialPrecioDialog
        isOpen={!!historialFor}
        onClose={() => setHistorialFor(null)}
        proveedorId={proveedorId}
        productoId={historialFor?.productoId ?? null}
        productoNombre={historialFor?.productoNombre}
      />
    </BaseModal>
  );
}
