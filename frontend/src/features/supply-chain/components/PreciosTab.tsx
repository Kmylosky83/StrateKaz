/**
 * Tab Precios — Vista MASIVA por proveedor.
 *
 * Post refactor 2026-04-21 (Opción A separación estricta):
 *   Esta vista es el único lugar para gestionar precios. Se separa de CT:
 *   el modal de Proveedor (CT) NO gestiona precios.
 *
 * Flujo:
 *   1. Selector de proveedor (combobox o dropdown)
 *   2. Tabla con TODAS las MPs que el proveedor suministra:
 *      - Filas con precio asignado → inputs pre-llenados
 *      - Filas pendientes (sin precio) → inputs vacíos con badge
 *   3. Usuario edita, agrega o limpia filas; al "Guardar" se envía batch al BE
 *   4. Backend audita en HistorialPrecioProveedor los cambios de precio_kg
 *
 * Query param `?proveedor=N` pre-selecciona el proveedor (útil cuando se
 * navega desde el modal de crear proveedor en CT).
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Save, History, AlertTriangle, Truck } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/forms';

import { useSectionPermissions } from '@/components/common/ProtectedAction';
import { Modules, Sections } from '@/constants/permissions';

import { useProveedores } from '@/features/catalogo-productos/hooks/useProveedores';
import { useModalidadesLogistica } from '../hooks/usePrecios';
import { getPreciosPorProveedor, guardarPreciosPorProveedor } from '../api/precios.api';
import type { PrecioMPPorProveedorRow, BatchPrecioItem } from '../types/precio.types';
import { getApiErrorMessage } from '@/utils/errorUtils';

// ─── Utilidades ────────────────────────────────────────────────────────────

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

// ─── Componente ────────────────────────────────────────────────────────────

export function PreciosTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // RBAC
  const { canEdit } = useSectionPermissions(Modules.SUPPLY_CHAIN, Sections.PRECIOS_MATERIA_PRIMA);

  // Proveedor seleccionado (inicial desde ?proveedor=N)
  const initialProveedor = Number(searchParams.get('proveedor') || 0) || null;
  const [proveedorId, setProveedorId] = useState<number | null>(initialProveedor);

  // Estado local de la tabla (edit-mode)
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});

  // ─── Queries ───
  const { data: proveedores = [] } = useProveedores();
  const { data: modalidades = [] } = useModalidadesLogistica();
  const proveedoresActivos = useMemo(
    () => (Array.isArray(proveedores) ? proveedores.filter((p) => p.is_active) : []),
    [proveedores]
  );

  const {
    data: filas = [],
    isLoading: isLoadingFilas,
    refetch: refetchFilas,
  } = useQuery<PrecioMPPorProveedorRow[]>({
    queryKey: ['sc-precios-por-proveedor', proveedorId],
    queryFn: () => getPreciosPorProveedor(proveedorId!),
    enabled: !!proveedorId,
  });

  // Inicializar estado local de cada fila cuando cambia la data
  useEffect(() => {
    const next: Record<number, RowState> = {};
    for (const f of filas) {
      next[f.producto] = {
        precio_kg: f.precio_kg ?? '',
        modalidad_logistica: f.modalidad_logistica,
        dirty: false,
      };
    }
    setRowStates(next);
  }, [filas]);

  // ─── Mutation batch ───
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
      queryClient.invalidateQueries({ queryKey: ['sc-precios-por-proveedor', proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['sc-historial-precios'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al guardar precios'));
    },
  });

  // ─── Handlers ───
  const handleProveedorChange = (id: number | null) => {
    setProveedorId(id);
    if (id) {
      setSearchParams({ proveedor: String(id) });
    } else {
      setSearchParams({});
    }
  };

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

  const handleSave = () => {
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

    saveMutation.mutate({ proveedor: proveedorId, precios: items });
  };

  // ─── Render ───
  const proveedorSeleccionado = proveedoresActivos.find((p) => p.id === proveedorId);

  return (
    <div className="space-y-4">
      {/* Selector de proveedor */}
      <Card variant="bordered" padding="md">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <Select
              label="Proveedor"
              value={proveedorId ?? ''}
              onChange={(e) =>
                handleProveedorChange(e.target.value ? Number(e.target.value) : null)
              }
              helperText="Seleccione un proveedor para ver y editar sus precios por MP."
            >
              <option value="">— Seleccionar proveedor —</option>
              {proveedoresActivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_comercial} ({p.codigo_interno})
                </option>
              ))}
            </Select>
          </div>
          {proveedorId && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetchFilas()} disabled={isLoadingFilas}>
                <History className="w-4 h-4 mr-1" />
                Recargar
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
          )}
        </div>
      </Card>

      {/* Tabla editable */}
      {!proveedorId ? (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            }
            title="Seleccione un proveedor"
            description="Los precios se gestionan por proveedor. Elija uno arriba para ver y editar sus MPs."
          />
        </Card>
      ) : isLoadingFilas ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : filas.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
            title="El proveedor no tiene materias primas asignadas"
            description="Asigne MPs desde Catálogo de Productos → Proveedores (editar proveedor y marcar las MPs)."
            action={
              <Button
                variant="outline"
                onClick={() => navigate(`/catalogo-productos/proveedores?edit=${proveedorId}`)}
              >
                Ir a editar proveedor
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              <strong>{proveedorSeleccionado?.nombre_comercial}</strong> · {filas.length} MP(s) ·{' '}
              {filas.filter((f) => !f.es_pendiente).length} con precio ·{' '}
              {filas.filter((f) => f.es_pendiente).length} pendiente(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                    Materia Prima
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300 w-48">
                    Precio/kg (COP)
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300 w-56">
                    Modalidad Logística
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        {fila.producto_nombre}
                        <div className="text-xs text-gray-500 font-mono">
                          {fila.producto_codigo}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {fila.es_pendiente ? (
                          <Badge variant="warning">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            Pendiente
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            Con precio: {formatCurrency(fila.precio_kg ?? 0)}
                          </Badge>
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
                        <div className="text-xs text-gray-500 mt-1">
                          por {fila.unidad_medida || 'kg'}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          disabled={!canEdit}
                          value={row.modalidad_logistica ?? ''}
                          onChange={(e) =>
                            updateRow(fila.producto, {
                              modalidad_logistica: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                        >
                          <option value="">
                            <Truck className="w-3 h-3" /> Sin modalidad
                          </option>
                          {modalidades.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
            Cambios de precio se registran automáticamente en el historial (audit log).
            {dirtyCount > 0 && (
              <span className="ml-2 font-medium text-amber-700 dark:text-amber-300">
                · {dirtyCount} fila(s) modificada(s) sin guardar
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
