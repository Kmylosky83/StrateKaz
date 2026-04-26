/**
 * Modal para gestionar las paradas de una Ruta de Recolección (H-SC-RUTA-02).
 *
 * Vincula M2M Ruta ↔ Proveedor con metadata operativa (orden, frecuencia_pago).
 * Constraint: un proveedor solo puede ser parada de UNA ruta.
 */
import { useState } from 'react';
import { Plus, Route, Trash2, Edit, Save, X, GripVertical } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

import { useProveedores } from '@/features/catalogo-productos/hooks/useProveedores';
import {
  useRutaParadasByRuta,
  useCreateRutaParada,
  useUpdateRutaParada,
  useDeleteRutaParada,
} from '../hooks/useRutaParadas';
import {
  FrecuenciaPago,
  FRECUENCIA_PAGO_LABELS,
  type RutaParada,
} from '../types/ruta-paradas.types';
import type { RutaRecoleccion } from '../types/rutas.types';

interface RutaParadasModalProps {
  ruta: RutaRecoleccion;
  isOpen: boolean;
  onClose: () => void;
}

export default function RutaParadasModal({ ruta, isOpen, onClose }: RutaParadasModalProps) {
  const { data: paradas = [], isLoading } = useRutaParadasByRuta(ruta.id);
  const { data: proveedores = [] } = useProveedores();
  const createMutation = useCreateRutaParada();
  const updateMutation = useUpdateRutaParada();
  const deleteMutation = useDeleteRutaParada();

  // Estado del formulario "agregar parada"
  const [newProveedor, setNewProveedor] = useState<number | ''>('');
  const [newFrecuencia, setNewFrecuencia] = useState<FrecuenciaPago>(FrecuenciaPago.MENSUAL);

  // Edición inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFrecuencia, setEditFrecuencia] = useState<FrecuenciaPago>(FrecuenciaPago.MENSUAL);
  const [editOrden, setEditOrden] = useState<number>(0);

  // Eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Proveedores disponibles = los que NO son ya parada (de cualquier ruta)
  const idsParada = new Set(paradas.map((p) => p.proveedor));
  const proveedoresDisponibles = proveedores.filter((p) => !idsParada.has(p.id) && p.is_active);

  const frecuenciaOptions = Object.entries(FRECUENCIA_PAGO_LABELS).map(([v, l]) => ({
    value: v,
    label: l,
  }));

  const handleAdd = async () => {
    if (!newProveedor) return;
    try {
      await createMutation.mutateAsync({
        ruta: ruta.id,
        proveedor: Number(newProveedor),
        orden: paradas.length,
        frecuencia_pago: newFrecuencia,
      });
      setNewProveedor('');
      setNewFrecuencia(FrecuenciaPago.MENSUAL);
    } catch {
      /* toast del hook */
    }
  };

  const startEdit = (parada: RutaParada) => {
    setEditingId(parada.id);
    setEditFrecuencia(parada.frecuencia_pago);
    setEditOrden(parada.orden);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { frecuencia_pago: editFrecuencia, orden: editOrden },
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
          {/* Sección: Agregar parada */}
          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Agregar parada
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-7">
                <Select
                  label="Proveedor"
                  value={newProveedor}
                  onChange={(e) => setNewProveedor(e.target.value ? Number(e.target.value) : '')}
                  options={[
                    { value: '', label: 'Seleccionar productor...' },
                    ...proveedoresDisponibles.map((p) => ({
                      value: p.id,
                      label: `${p.codigo_interno} — ${p.nombre_comercial}`,
                    })),
                  ]}
                  helperText={
                    proveedoresDisponibles.length === 0
                      ? 'Todos los proveedores activos ya están asignados a una ruta. Crea uno nuevo en Catálogo de Productos.'
                      : undefined
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Select
                  label="Frecuencia de pago"
                  value={newFrecuencia}
                  onChange={(e) => setNewFrecuencia(e.target.value as FrecuenciaPago)}
                  options={frecuenciaOptions}
                />
              </div>
              <div className="md:col-span-2">
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                          Orden
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Proveedor
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Frecuencia
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
                                  className="w-16"
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
                            <td className="px-4 py-2 text-center">
                              {isEditing ? (
                                <Select
                                  value={editFrecuencia}
                                  onChange={(e) =>
                                    setEditFrecuencia(e.target.value as FrecuenciaPago)
                                  }
                                  options={frecuenciaOptions}
                                />
                              ) : (
                                <Badge variant="default" size="sm">
                                  {parada.frecuencia_pago_display ??
                                    FRECUENCIA_PAGO_LABELS[parada.frecuencia_pago]}
                                </Badge>
                              )}
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
                                      title="Editar"
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
