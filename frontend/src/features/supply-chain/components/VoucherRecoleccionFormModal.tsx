/**
 * Modal para crear/editar Voucher de Recolección (H-SC-RUTA-02).
 *
 * Header: ruta + fecha + notas. Líneas: proveedor (de las paradas de la ruta)
 * + producto + cantidad. Atajo "+ Crear proveedor" inline cuando el productor
 * no está registrado.
 *
 * Sin precios ni firmas — solo cargo+nombre del operador (auto desde el JWT).
 */
import { useEffect, useMemo, useState } from 'react';
import { Plus, Truck, Trash2, UserPlus, Save } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';

import { useRutas } from '../hooks/useRutas';
import { useRutaParadasByRuta } from '../hooks/useRutaParadas';
import { useProductos } from '@/features/catalogo-productos/hooks/useProductos';
import {
  useCreateVoucherRecoleccion,
  useUpdateVoucherRecoleccion,
  useVoucherRecoleccion,
  useCreateLineaVoucherRecoleccion,
  useDeleteLineaVoucherRecoleccion,
  useCompletarVoucherRecoleccion,
} from '../hooks/useVoucherRecoleccion';

import ProveedorFormModal from '@/features/catalogo-productos/components/ProveedorFormModal';

import type { VoucherRecoleccion } from '../types/voucher-recoleccion.types';
import { EstadoVoucherRecoleccion } from '../types/voucher-recoleccion.types';

interface VoucherRecoleccionFormModalProps {
  voucherId: number | null; // null = crear, number = editar
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherRecoleccionFormModal({
  voucherId,
  isOpen,
  onClose,
}: VoucherRecoleccionFormModalProps) {
  const isEditing = voucherId !== null;

  // ── Header del voucher ────────────────────────────────────────────
  const [ruta, setRuta] = useState<number | ''>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState<string>('');

  // ── Estado de líneas (formulario "agregar línea") ─────────────────
  const [lineProveedor, setLineProveedor] = useState<number | ''>('');
  const [lineProducto, setLineProducto] = useState<number | ''>('');
  const [lineCantidad, setLineCantidad] = useState<string>('');

  // ── Crear-proveedor inline ────────────────────────────────────────
  const [showCrearProveedor, setShowCrearProveedor] = useState(false);

  // ── Catálogos / hooks ─────────────────────────────────────────────
  const { data: rutas = [] } = useRutas();
  const { data: paradas = [] } = useRutaParadasByRuta(ruta || null);
  const { data: productos = [] } = useProductos();
  const { data: voucherDetail } = useVoucherRecoleccion(voucherId);

  const createVoucherMut = useCreateVoucherRecoleccion();
  const updateVoucherMut = useUpdateVoucherRecoleccion();
  const createLineaMut = useCreateLineaVoucherRecoleccion();
  const deleteLineaMut = useDeleteLineaVoucherRecoleccion();
  const completarMut = useCompletarVoucherRecoleccion();

  // Reset / hidratación al abrir
  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && voucherDetail) {
      setRuta(voucherDetail.ruta);
      setFecha(voucherDetail.fecha_recoleccion);
      setNotas(voucherDetail.notas ?? '');
    } else if (!isEditing) {
      setRuta('');
      setFecha(new Date().toISOString().slice(0, 10));
      setNotas('');
    }
    setLineProveedor('');
    setLineProducto('');
    setLineCantidad('');
  }, [isOpen, isEditing, voucherDetail]);

  // Productos MP solamente
  const productosMp = useMemo(
    () => (Array.isArray(productos) ? productos.filter((p) => p.tipo === 'MATERIA_PRIMA') : []),
    [productos]
  );

  const lineas = voucherDetail?.lineas ?? [];
  const isCompleted = voucherDetail?.estado === EstadoVoucherRecoleccion.COMPLETADO;
  const isConsolidado = voucherDetail?.estado === EstadoVoucherRecoleccion.CONSOLIDADO;
  const readonly = isCompleted || isConsolidado;

  // ── Handlers ──────────────────────────────────────────────────────

  const handleCreateHeader = async () => {
    if (!ruta) {
      const { toast } = await import('sonner');
      toast.warning('Seleccione una ruta.');
      return;
    }
    try {
      const created = await createVoucherMut.mutateAsync({
        ruta: Number(ruta),
        fecha_recoleccion: fecha,
        notas,
      });
      // Una vez creado, el modal cambia a modo edición para agregar líneas
      // (se pasa al parent que reabre con voucherId). Como atajo: cerramos y
      // el parent puede reabrirlo con el id si quiere agregar líneas inmediato.
      onClose();
      // Notificación para que el usuario sepa qué hacer
      const { toast } = await import('sonner');
      toast.success(
        `Voucher ${created.codigo} creado. Reabra el voucher para agregar líneas (parada por parada).`,
        { duration: 6000 }
      );
    } catch {
      /* toast del hook */
    }
  };

  const handleUpdateHeader = async () => {
    if (!voucherId) return;
    try {
      await updateVoucherMut.mutateAsync({
        id: voucherId,
        data: { fecha_recoleccion: fecha, notas },
      });
    } catch {
      /* toast */
    }
  };

  const handleAddLinea = async () => {
    if (!voucherId) return;
    if (!lineProveedor || !lineProducto || !lineCantidad) {
      const { toast } = await import('sonner');
      toast.warning('Complete proveedor, producto y cantidad.');
      return;
    }
    const cantNum = Number(lineCantidad);
    if (!cantNum || cantNum <= 0) {
      const { toast } = await import('sonner');
      toast.warning('La cantidad debe ser mayor a cero.');
      return;
    }
    try {
      await createLineaMut.mutateAsync({
        voucher: voucherId,
        proveedor: Number(lineProveedor),
        producto: Number(lineProducto),
        cantidad: cantNum,
      });
      setLineProveedor('');
      setLineProducto('');
      setLineCantidad('');
    } catch {
      /* toast */
    }
  };

  const handleDeleteLinea = async (id: number) => {
    await deleteLineaMut.mutateAsync(id);
  };

  const handleCompletar = async () => {
    if (!voucherId) return;
    if (lineas.length === 0) {
      const { toast } = await import('sonner');
      toast.warning('Agregue al menos una línea antes de completar.');
      return;
    }
    await completarMut.mutateAsync(voucherId);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && voucherDetail && (
          <Badge
            variant={isConsolidado ? 'success' : isCompleted ? 'primary' : 'warning'}
            size="md"
          >
            {voucherDetail.estado_display ?? voucherDetail.estado}
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        {isEditing && !readonly && (
          <Button
            type="button"
            variant="primary"
            onClick={handleCompletar}
            disabled={lineas.length === 0 || completarMut.isPending}
            isLoading={completarMut.isPending}
          >
            <Save className="w-4 h-4 mr-1" />
            Completar voucher
          </Button>
        )}
        {!isEditing && (
          <Button
            type="button"
            variant="primary"
            onClick={handleCreateHeader}
            disabled={!ruta || createVoucherMut.isPending}
            isLoading={createVoucherMut.isPending}
          >
            Crear voucher
          </Button>
        )}
      </div>
    </div>
  );

  const operadorInfo = voucherDetail
    ? `${voucherDetail.operador_nombre ?? '—'}${voucherDetail.operador_cargo ? ` · ${voucherDetail.operador_cargo}` : ''}`
    : null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isEditing && voucherDetail
            ? `Voucher ${voucherDetail.codigo} — ${voucherDetail.ruta_nombre}`
            : 'Nuevo Voucher de Recolección'
        }
        size="4xl"
        footer={footer}
      >
        <div className="space-y-5">
          {/* HEADER */}
          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Encabezado
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <Select
                  label="Ruta *"
                  value={ruta}
                  onChange={(e) => setRuta(e.target.value ? Number(e.target.value) : '')}
                  disabled={isEditing}
                  options={[
                    { value: '', label: 'Seleccionar ruta...' },
                    ...rutas
                      .filter((r) => r.is_active)
                      .map((r) => ({
                        value: r.id,
                        label: `${r.codigo} — ${r.nombre}`,
                      })),
                  ]}
                  required
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Fecha *"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  disabled={readonly}
                  required
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                {operadorInfo && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 w-full pb-2">
                    <p className="font-medium text-gray-700 dark:text-gray-300">Realizado por</p>
                    <p>{operadorInfo}</p>
                  </div>
                )}
              </div>
              <div className="md:col-span-12">
                <Textarea
                  label="Notas (opcional)"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  disabled={readonly}
                  placeholder="Clima, novedades de ruta, observaciones..."
                />
              </div>
            </div>
            {isEditing && !readonly && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUpdateHeader}
                  disabled={updateVoucherMut.isPending}
                  isLoading={updateVoucherMut.isPending}
                >
                  Guardar encabezado
                </Button>
              </div>
            )}
          </Card>

          {/* LÍNEAS — solo en modo edición */}
          {isEditing && (
            <Card variant="bordered" padding="md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Líneas (parada por parada)
                  </h4>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total: <strong>{voucherDetail?.total_kilos ?? 0} kg</strong> en{' '}
                  {voucherDetail?.total_lineas ?? 0} línea(s)
                </div>
              </div>

              {!readonly && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4">
                  <div className="md:col-span-5">
                    <Select
                      label="Proveedor (parada)"
                      value={lineProveedor}
                      onChange={(e) =>
                        setLineProveedor(e.target.value ? Number(e.target.value) : '')
                      }
                      options={[
                        { value: '', label: 'Seleccionar parada...' },
                        ...paradas
                          .filter((p) => p.is_active)
                          .sort((a, b) => a.orden - b.orden)
                          .map((p) => ({
                            value: p.proveedor,
                            label: `${p.orden + 1}. ${p.proveedor_nombre}`,
                          })),
                      ]}
                      helperText={
                        paradas.length === 0
                          ? 'Esta ruta no tiene paradas. Agréguelas en Rutas de Recolección.'
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowCrearProveedor(true)}
                      className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Crear proveedor nuevo
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <Select
                      label="Producto (MP)"
                      value={lineProducto}
                      onChange={(e) =>
                        setLineProducto(e.target.value ? Number(e.target.value) : '')
                      }
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        ...productosMp.map((p) => ({
                          value: p.id,
                          label: `${p.codigo ?? ''} ${p.nombre}`.trim(),
                        })),
                      ]}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Kilos"
                      type="number"
                      step="0.001"
                      min="0"
                      value={lineCantidad}
                      onChange={(e) => setLineCantidad(e.target.value)}
                      placeholder="0.000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddLinea}
                      disabled={
                        !lineProveedor || !lineProducto || !lineCantidad || createLineaMut.isPending
                      }
                      isLoading={createLineaMut.isPending}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              )}

              {/* Tabla de líneas */}
              {!voucherDetail ? (
                <div className="flex justify-center py-6">
                  <Spinner size="md" />
                </div>
              ) : lineas.length === 0 ? (
                <EmptyState
                  icon={<Truck className="w-10 h-10" />}
                  title="Sin líneas"
                  description="Agregue una línea por cada parada visitada con su cantidad recolectada."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Proveedor
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Producto
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Kilos
                        </th>
                        {!readonly && <th className="px-3 py-2 w-12"></th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {lineas.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{l.proveedor_nombre}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              {l.proveedor_codigo}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {l.producto_nombre}
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-mono font-semibold text-gray-900 dark:text-white">
                            {Number(l.cantidad).toFixed(3)} kg
                          </td>
                          {!readonly && (
                            <td className="px-3 py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLinea(l.id)}
                                disabled={deleteLineaMut.isPending}
                                title="Eliminar línea"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {!isEditing && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
              Cree el voucher con la ruta y fecha. Después podrá abrirlo desde la lista para agregar
              las líneas (kilos por cada parada visitada).
            </div>
          )}
        </div>
      </BaseModal>

      {/* Atajo: crear proveedor inline (sin salir del flujo) */}
      <ProveedorFormModal
        isOpen={showCrearProveedor}
        onClose={() => setShowCrearProveedor(false)}
      />
    </>
  );
}
