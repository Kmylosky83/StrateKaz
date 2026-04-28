/**
 * Modal de Voucher de Recolección — 1 voucher = 1 parada (H-SC-RUTA-02 r2).
 *
 * Form simple: ruta + fecha + proveedor (filtrado por paradas de la ruta) +
 * producto (MP) + cantidad. Sin precios. Operador auto desde JWT.
 *
 * Atajo "+ Crear proveedor" inline cuando el productor no está registrado.
 */
import { useEffect, useMemo, useState } from 'react';
import { Truck, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

import { useRutas } from '../hooks/useRutas';
import { useRutaParadasByRuta } from '../hooks/useRutaParadas';
import { useProductos } from '@/features/catalogo-productos/hooks/useProductos';
import {
  useCreateVoucherRecoleccion,
  useUpdateVoucherRecoleccion,
  useVoucherRecoleccion,
  useCompletarVoucherRecoleccion,
} from '../hooks/useVoucherRecoleccion';

import ProveedorFormModal from '@/features/catalogo-productos/components/ProveedorFormModal';

import { EstadoVoucherRecoleccion } from '../types/voucher-recoleccion.types';

interface VoucherRecoleccionFormModalProps {
  voucherId: number | null;
  isOpen: boolean;
  onClose: () => void;
  /** Pre-seleccionar ruta al crear (UX: si vienes desde una ruta específica). */
  defaultRutaId?: number;
}

export default function VoucherRecoleccionFormModal({
  voucherId,
  isOpen,
  onClose,
  defaultRutaId,
}: VoucherRecoleccionFormModalProps) {
  const isEditing = voucherId !== null;

  const [ruta, setRuta] = useState<number | ''>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [proveedor, setProveedor] = useState<number | ''>('');
  const [producto, setProducto] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [showCrearProveedor, setShowCrearProveedor] = useState(false);

  const { data: rutas = [] } = useRutas();
  const { data: paradas = [] } = useRutaParadasByRuta(ruta || null);
  const { data: productos = [] } = useProductos();
  const { data: voucherDetail } = useVoucherRecoleccion(voucherId);

  const createMut = useCreateVoucherRecoleccion();
  const updateMut = useUpdateVoucherRecoleccion();
  const completarMut = useCompletarVoucherRecoleccion();

  // Hidratación / reset
  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && voucherDetail) {
      setRuta(voucherDetail.ruta);
      setFecha(voucherDetail.fecha_recoleccion);
      setProveedor(voucherDetail.proveedor);
      setProducto(voucherDetail.producto);
      setCantidad(String(voucherDetail.cantidad));
      setNotas(voucherDetail.notas ?? '');
    } else if (!isEditing) {
      setRuta(defaultRutaId ?? '');
      setFecha(new Date().toISOString().slice(0, 10));
      setProveedor('');
      setProducto('');
      setCantidad('');
      setNotas('');
    }
  }, [isOpen, isEditing, voucherDetail, defaultRutaId]);

  const productosMp = useMemo(
    () => (Array.isArray(productos) ? productos.filter((p) => p.tipo === 'MATERIA_PRIMA') : []),
    [productos]
  );

  const isCompleted = voucherDetail?.estado === EstadoVoucherRecoleccion.COMPLETADO;
  const readonly = isCompleted;

  const validar = (): string | null => {
    if (!ruta) return 'Seleccione una ruta.';
    if (!proveedor) return 'Seleccione un proveedor (parada).';
    if (!producto) return 'Seleccione el producto (MP).';
    const cantNum = Number(cantidad);
    if (!cantNum || cantNum <= 0) return 'La cantidad debe ser mayor a cero.';
    return null;
  };

  const handleGuardar = async (keepOpen = false) => {
    const err = validar();
    if (err) {
      toast.warning(err);
      return;
    }
    try {
      if (isEditing && voucherId) {
        await updateMut.mutateAsync({
          id: voucherId,
          data: {
            ruta: Number(ruta),
            fecha_recoleccion: fecha,
            proveedor: Number(proveedor),
            producto: Number(producto),
            cantidad: Number(cantidad),
            notas,
          },
        });
      } else {
        await createMut.mutateAsync({
          ruta: Number(ruta),
          fecha_recoleccion: fecha,
          proveedor: Number(proveedor),
          producto: Number(producto),
          cantidad: Number(cantidad),
          notas,
        });
      }
      if (keepOpen && !isEditing) {
        // UX: si en una parada hay N productos, permitir crear el siguiente
        // sin reabrir el modal — preserva ruta+fecha+proveedor, limpia
        // producto+cantidad+notas.
        toast.success('Voucher guardado. Agrega el siguiente producto del proveedor.');
        setProducto('');
        setCantidad('');
        setNotas('');
      } else {
        onClose();
      }
    } catch {
      /* toast ya */
    }
  };

  const handleCompletar = async () => {
    if (!voucherId) return;
    await completarMut.mutateAsync(voucherId);
    onClose();
  };

  const isLoading = createMut.isPending || updateMut.isPending;

  // Operador (auto)
  const operadorInfo = voucherDetail
    ? `${voucherDetail.operador_nombre ?? '—'}${voucherDetail.operador_cargo ? ` · ${voucherDetail.operador_cargo}` : ''}`
    : null;

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && voucherDetail && (
          <Badge variant={isCompleted ? 'success' : 'warning'} size="md">
            {voucherDetail.estado_display ?? voucherDetail.estado}
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        {!isEditing && !readonly && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleGuardar(true)}
            disabled={isLoading}
            isLoading={isLoading}
            title="Guarda este voucher y deja el modal abierto para registrar otro producto del mismo proveedor"
          >
            Guardar y agregar otro
          </Button>
        )}
        {!readonly && (
          <Button
            type="button"
            variant="primary"
            onClick={() => handleGuardar(false)}
            disabled={isLoading}
            isLoading={isLoading}
          >
            <Save className="w-4 h-4 mr-1" />
            {isEditing ? 'Guardar cambios' : 'Guardar voucher'}
          </Button>
        )}
        {isEditing && !readonly && (
          <Button
            type="button"
            variant="primary"
            onClick={handleCompletar}
            disabled={completarMut.isPending}
            isLoading={completarMut.isPending}
          >
            Completar
          </Button>
        )}
      </div>
    </div>
  );

  // Filtro proveedores: solo paradas activas de la ruta seleccionada.
  const paradasOptions = paradas
    .filter((p) => p.is_active)
    .sort((a, b) => a.orden - b.orden)
    .map((p) => ({
      value: p.proveedor,
      label: `${p.orden + 1}. ${p.proveedor_nombre} (${p.proveedor_documento ?? ''})`,
    }));

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isEditing && voucherDetail
            ? `Voucher ${voucherDetail.codigo} — ${voucherDetail.proveedor_nombre}`
            : 'Nueva recolección (parada)'
        }
        size="2xl"
        footer={footer}
      >
        <div className="space-y-5">
          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Datos de la parada
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7">
                <Select
                  label="Ruta *"
                  value={ruta}
                  onChange={(e) => {
                    setRuta(e.target.value ? Number(e.target.value) : '');
                    setProveedor(''); // reset proveedor al cambiar ruta
                  }}
                  disabled={isEditing || readonly}
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
              <div className="md:col-span-5">
                <Input
                  label="Fecha *"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  disabled={readonly}
                  required
                />
              </div>

              <div className="md:col-span-12">
                <Select
                  label="Proveedor (parada de esta ruta) *"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value ? Number(e.target.value) : '')}
                  disabled={!ruta || readonly}
                  options={[
                    {
                      value: '',
                      label: ruta ? 'Seleccionar parada...' : 'Selecciona ruta primero',
                    },
                    ...paradasOptions,
                  ]}
                  helperText={
                    ruta && paradasOptions.length === 0
                      ? 'Esta ruta no tiene paradas. Agrégalas en Rutas de Recolección o crea un proveedor nuevo.'
                      : undefined
                  }
                />
                {ruta && !readonly && (
                  <button
                    type="button"
                    onClick={() => setShowCrearProveedor(true)}
                    className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    Crear proveedor nuevo
                  </button>
                )}
              </div>

              <div className="md:col-span-7">
                <Select
                  label="Producto (MP) *"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value ? Number(e.target.value) : '')}
                  disabled={readonly}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    ...productosMp.map((p) => ({
                      value: p.id,
                      label: `${p.codigo ?? ''} ${p.nombre}`.trim(),
                    })),
                  ]}
                  required
                />
              </div>
              <div className="md:col-span-5">
                <Input
                  label="Kilos *"
                  type="number"
                  step="0.1"
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0.0"
                  disabled={readonly}
                  required
                />
              </div>

              <div className="md:col-span-12">
                <Textarea
                  label="Notas (opcional)"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  disabled={readonly}
                  placeholder="Observaciones de la parada (clima, novedades, etc.)"
                />
              </div>

              {operadorInfo && (
                <div className="md:col-span-12 text-xs text-gray-500 dark:text-gray-400">
                  <strong>Registrado por:</strong> {operadorInfo}
                </div>
              )}
            </div>
          </Card>

          {readonly && (
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300">
              Este voucher está <strong>completado</strong> y ya no es editable. Puede asociarlo a
              una recepción de planta para liquidar al productor.
            </div>
          )}
        </div>
      </BaseModal>

      <ProveedorFormModal
        isOpen={showCrearProveedor}
        onClose={() => setShowCrearProveedor(false)}
      />
    </>
  );
}
