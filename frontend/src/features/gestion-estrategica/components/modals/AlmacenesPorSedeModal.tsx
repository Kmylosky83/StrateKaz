/**
 * Modal "Almacenes por Sede" (H-SC-07)
 *
 * Lista los almacenes físicos (silos, bodegas, tanques) que viven dentro
 * de una Sede. Permite crear, editar y eliminar almacenes de esa sede.
 *
 * Se abre desde SedesSection.tsx con el action "Gestionar almacenes".
 */
import { useState } from 'react';
import {
  Plus,
  Warehouse,
  CheckCircle2,
  Package,
  Truck,
  Star,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Card, Badge, BrandedSkeleton } from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAlmacenes, useDeleteAlmacen } from '@/features/supply-chain/hooks';
import type { Almacen } from '@/features/supply-chain/types';
import type { SedeEmpresaList } from '../../types/strategic.types';
import { AlmacenFormModal } from './AlmacenFormModal';

interface AlmacenesPorSedeModalProps {
  sede: SedeEmpresaList | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlmacenesPorSedeModal = ({
  sede,
  isOpen,
  onClose,
}: AlmacenesPorSedeModalProps) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [almacenToDelete, setAlmacenToDelete] = useState<Almacen | null>(null);

  const { data: almacenesData, isLoading } = useAlmacenes(
    sede ? { sede: sede.id } : undefined
  );
  const deleteMutation = useDeleteAlmacen();

  const almacenes = Array.isArray(almacenesData) ? almacenesData : [];

  if (!sede) return null;

  const handleAdd = () => {
    setSelectedAlmacen(null);
    setShowFormModal(true);
  };

  const handleEdit = (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    setShowFormModal(true);
  };

  const handleDeleteClick = (almacen: Almacen) => {
    setAlmacenToDelete(almacen);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (almacenToDelete) {
      await deleteMutation.mutateAsync(almacenToDelete.id);
      setShowDeleteDialog(false);
      setAlmacenToDelete(null);
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Almacenes — ${sede.nombre}`}
        subtitle="Silos, bodegas, tanques y contenedores físicos de esta sede"
        size="3xl"
      >
        <div className="space-y-4">
          {/* Header con botón Agregar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Warehouse className="h-4 w-4" />
              <span>
                {almacenes.length} almacén{almacenes.length !== 1 ? 'es' : ''}{' '}
                configurado{almacenes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Almacén
            </Button>
          </div>

          {/* Lista / Empty state */}
          {isLoading ? (
            <BrandedSkeleton height="h-60" logoSize="md" />
          ) : almacenes.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Almacén
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Capacidad
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Operaciones
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Estado
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {almacenes.map((almacen) => (
                      <tr
                        key={almacen.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                              <Warehouse className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {almacen.nombre}
                                </span>
                                {almacen.es_principal && (
                                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {almacen.codigo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {almacen.tipo_almacen_nombre ? (
                            <Badge variant="gray" size="sm">
                              {almacen.tipo_almacen_nombre}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Sin especificar
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                          {almacen.capacidad_maxima
                            ? Number(almacen.capacidad_maxima).toLocaleString('es-CO')
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {almacen.permite_recepcion && (
                              <Badge variant="success" size="sm">
                                <Package className="h-3 w-3 mr-1" />
                                Recepción
                              </Badge>
                            )}
                            {almacen.permite_despacho && (
                              <Badge variant="info" size="sm">
                                <Truck className="h-3 w-3 mr-1" />
                                Despacho
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={almacen.is_active ? 'success' : 'gray'}
                            size="sm"
                          >
                            {almacen.is_active ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              'Inactivo'
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButtons
                              onEdit={() => handleEdit(almacen)}
                              onDelete={() => handleDeleteClick(almacen)}
                              size="sm"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                  <Warehouse className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                  No hay almacenes en esta sede
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Agregue el primer almacén físico (silo, bodega, tanque) para
                  esta sede.
                </p>
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Almacén
                </Button>
              </div>
            </Card>
          )}
        </div>
      </BaseModal>

      {/* Sub-modal de creación/edición */}
      <AlmacenFormModal
        sede={sede}
        almacen={selectedAlmacen}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedAlmacen(null);
        }}
      />

      {/* Confirmación de borrado */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar almacén"
        message={`¿Está seguro de eliminar el almacén "${almacenToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </>
  );
};
