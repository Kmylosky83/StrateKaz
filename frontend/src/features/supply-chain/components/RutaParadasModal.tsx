/**
 * Modal para gestionar las paradas de una Ruta de Recolección (H-SC-RUTA-02).
 *
 * Vincula M2M Ruta ↔ Proveedor con orden sugerido (no restrictivo).
 * Constraint: un proveedor solo puede ser parada de UNA ruta.
 *
 * Refactor 2026-04-26:
 *   - Eliminado `frecuencia_pago` (decisión de liquidación, no de parada).
 *   - Filtro: solo proveedores con modalidad logística "Compra en Punto"
 *     (código COMPRA_PUNTO) — los que la ruta puede recoger.
 */
import { useMemo, useState } from 'react';
import { Plus, Route, Trash2, Edit, Save, X, GripVertical, Info } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

import { useProveedores } from '@/features/catalogo-productos/hooks/useProveedores';
import { useModalidadesLogistica } from '../hooks/usePrecios';
import {
  useRutaParadasByRuta,
  useCreateRutaParada,
  useUpdateRutaParada,
  useDeleteRutaParada,
} from '../hooks/useRutaParadas';
import type { RutaParada } from '../types/ruta-paradas.types';
import type { RutaRecoleccion } from '../types/rutas.types';

interface RutaParadasModalProps {
  ruta: RutaRecoleccion;
  isOpen: boolean;
  onClose: () => void;
}

const MODALIDAD_RECOLECCION_CODE = 'COMPRA_PUNTO';

export default function RutaParadasModal({ ruta, isOpen, onClose }: RutaParadasModalProps) {
  const { data: paradas = [], isLoading } = useRutaParadasByRuta(ruta.id);
  const { data: proveedores = [] } = useProveedores();
  const { data: modalidades = [] } = useModalidadesLogistica();
  const createMutation = useCreateRutaParada();
  const updateMutation = useUpdateRutaParada();
  const deleteMutation = useDeleteRutaParada();

  // Estado del formulario "agregar parada"
  const [newProveedor, setNewProveedor] = useState<number | ''>('');

  // Edición inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editOrden, setEditOrden] = useState<number>(0);

  // Eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ID de la modalidad "Compra en Punto" (lookup por código, robusto a renames del nombre).
  const modalidadCompraPuntoId = useMemo(() => {
    const m = modalidades.find((x) => x.codigo === MODALIDAD_RECOLECCION_CODE);
    return m?.id ?? null;
  }, [modalidades]);

  // Proveedores disponibles para esta ruta:
  //   1. Activos.
  //   2. Con modalidad logística = "Compra en Punto" (la ruta los recoge).
  //   3. NO sean ya parada de ESTA u otra ruta.
  const idsParada = new Set(paradas.map((p) => p.proveedor));
  const proveedoresDisponibles = proveedores.filter((p) => {
    if (!p.is_active) return false;
    if (idsParada.has(p.id)) return false;
    // Si todavía no hay catálogo cargado, NO filtramos por modalidad (degrada
    // grácil para no bloquear UI mientras carga el catálogo).
    if (modalidadCompraPuntoId !== null && p.modalidad_logistica !== modalidadCompraPuntoId) {
      return false;
    }
    return true;
  });

  const handleAdd = async () => {
    if (!newProveedor) return;
    try {
      await createMutation.mutateAsync({
        ruta: ruta.id,
        proveedor: Number(newProveedor),
        orden: paradas.length,
      });
      setNewProveedor('');
    } catch {
      /* toast del hook */
    }
  };

  const startEdit = (parada: RutaParada) => {
    setEditingId(parada.id);
    setEditOrden(parada.orden);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { orden: editOrden },
      });
      setEditingId(null);
    } catch {
      /* toast */
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  const footer = (
    <Button type="button" variant="primary" onClick={onClose}>
      Cerrar
    </Button>
  );

  const helperFiltro =
    proveedoresDisponibles.length === 0 && modalidadCompraPuntoId !== null
      ? 'No hay proveedores disponibles. Solo se muestran los que tienen modalidad logística "Compra en Punto" y aún no son parada de otra ruta. Crea uno desde Catálogo de Productos → Proveedores.'
      : undefined;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Paradas de ${ruta.codigo} — ${ruta.nombre}`}
        size="3xl"
        footer={footer}
      >
        <div className="space-y-5">
          {/* Info: orden sugerido */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              El orden es <strong>sugerido</strong>, no restrictivo. La frecuencia de pago se decide
              al momento de liquidar (acumulativa), no aquí.
            </div>
          </div>

          {/* Sección: Agregar parada */}
          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Agregar parada
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-9">
                <Select
                  label="Proveedor (con modalidad Compra en Punto)"
                  value={newProveedor}
                  onChange={(e) => setNewProveedor(e.target.value ? Number(e.target.value) : '')}
                  options={[
                    { value: '', label: 'Seleccionar productor...' },
                    ...proveedoresDisponibles.map((p) => ({
                      value: p.id,
                      label: `${p.codigo_interno} — ${p.nombre_comercial}`,
                    })),
                  ]}
                  helperText={helperFiltro}
                />
              </div>
              <div className="md:col-span-3">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAdd}
                  disabled={!newProveedor || createMutation.isPending}
                  isLoading={createMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </Card>

          {/* Sección: Lista de paradas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Route className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Paradas configuradas ({paradas.length})
              </h4>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : paradas.length === 0 ? (
              <EmptyState
                icon={<Route className="w-10 h-10" />}
                title="Sin paradas"
                description="Agrega productores que esta ruta visita para empezar a registrar recolecciones."
              />
            ) : (
              <Card variant="bordered" padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                          Orden
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Proveedor
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paradas.map((parada) => {
                        const isEditing = editingId === parada.id;
                        return (
                          <tr
                            key={parada.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editOrden}
                                  onChange={(e) => setEditOrden(Number(e.target.value))}
                                  min={0}
                                  className="w-20"
                                />
                              ) : (
                                <div className="flex items-center gap-1 text-sm font-mono text-gray-700 dark:text-gray-300">
                                  <GripVertical className="w-3 h-3 text-gray-400" />
                                  {parada.orden}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                              {parada.proveedor_nombre}
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {parada.proveedor_codigo}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                              {parada.proveedor_documento}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isEditing ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Guardar"
                                      onClick={() => saveEdit(parada.id)}
                                      disabled={updateMutation.isPending}
                                    >
                                      <Save className="w-4 h-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Cancelar"
                                      onClick={cancelEdit}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Editar orden"
                                      onClick={() => startEdit(parada)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Eliminar"
                                      onClick={() => setDeletingId(parada.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      </BaseModal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Eliminar parada"
        message="¿Está seguro? La parada se quitará de la ruta. El proveedor sigue existiendo y puede asignarse a otra ruta."
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
