/**
 * Sección de Sedes y Ubicaciones
 *
 * Gestión de sedes, plantas, sucursales y ubicaciones de la empresa.
 *
 * Vista 2: Lista CRUD (Table View)
 * - Section Header por fuera del Card (icono + título + contador + botón crear)
 * - Data Table en Card con acciones por fila
 * - Empty State con CTA
 * - Modal de formulario para crear/editar
 * - ConfirmDialog para eliminar
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md
 */
import { useState } from 'react';
import { Plus, MapPin, Building2, Star, CheckCircle2, Warehouse } from 'lucide-react';
import { Card, Badge, Button, BrandedSkeleton } from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useSedes, useDeleteSede, useSetSedePrincipal } from '../hooks/useStrategic';
import { SedeFormModal } from './modals/SedeFormModal';
import { AlmacenesPorSedeModal } from './modals/AlmacenesPorSedeModal';
import type { SedeEmpresaList } from '../types/strategic.types';

export const SedesSection = () => {
  const { canDo } = usePermissions();
  const { data: sedesData, isLoading } = useSedes();
  const deleteMutation = useDeleteSede();
  const setPrincipalMutation = useSetSedePrincipal();

  const [showModal, setShowModal] = useState(false);
  const [selectedSede, setSelectedSede] = useState<SedeEmpresaList | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState<SedeEmpresaList | null>(null);
  const [showAlmacenesModal, setShowAlmacenesModal] = useState(false);
  const [sedeForAlmacenes, setSedeForAlmacenes] = useState<SedeEmpresaList | null>(
    null
  );

  const handleManageAlmacenes = (sede: SedeEmpresaList) => {
    setSedeForAlmacenes(sede);
    setShowAlmacenesModal(true);
  };

  const sedes = Array.isArray(sedesData) ? sedesData : [];

  const handleEdit = (sede: SedeEmpresaList) => {
    setSelectedSede(sede);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedSede(null);
    setShowModal(true);
  };

  const handleDeleteClick = (sede: SedeEmpresaList) => {
    setSedeToDelete(sede);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (sedeToDelete) {
      await deleteMutation.mutateAsync(sedeToDelete.id);
      setShowDeleteDialog(false);
      setSedeToDelete(null);
    }
  };

  const handleSetPrincipal = async (sede: SedeEmpresaList) => {
    await setPrincipalMutation.mutateAsync(sede.id);
  };

  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Section Header - Por fuera del Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Sedes y Ubicaciones
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sedes.length} sede{sedes.length !== 1 ? 's' : ''} configurada
                {sedes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {canDo(Modules.FUNDACION, Sections.SEDES, 'create') && (
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Sede
            </Button>
          )}
        </div>

        {/* Data Table Card */}
        {sedes.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sede
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ubicación
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Responsable
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
                  {sedes.map((sede) => (
                    <tr
                      key={sede.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {sede.nombre}
                              </span>
                              {sede.es_sede_principal && (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {sede.codigo}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="gray" size="sm">
                          {sede.tipo_sede_display}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {sede.ciudad}, {sede.departamento_display}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {sede.responsable_name || (
                          <span className="text-gray-400 dark:text-gray-500 italic">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={sede.is_active ? 'success' : 'gray'} size="sm">
                          {sede.is_active ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Activa
                            </>
                          ) : (
                            'Inactiva'
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButtons
                            module={Modules.FUNDACION}
                            section={Sections.SEDES}
                            onEdit={() => handleEdit(sede)}
                            onDelete={
                              !sede.es_sede_principal ? () => handleDeleteClick(sede) : undefined
                            }
                            size="sm"
                            customActions={[
                              {
                                key: 'almacenes',
                                label: 'Gestionar almacenes',
                                icon: <Warehouse className="h-4 w-4" />,
                                onClick: () => handleManageAlmacenes(sede),
                              },
                              ...(!sede.es_sede_principal && sede.is_active
                                ? [
                                    {
                                      key: 'set-principal',
                                      label: 'Establecer como principal',
                                      icon: <Star className="h-4 w-4" />,
                                      onClick: () => handleSetPrincipal(sede),
                                    },
                                  ]
                                : []),
                            ]}
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
          /* Empty State */
          <Card>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay sedes configuradas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Agregue la primera sede de su empresa para comenzar.
              </p>
              {canDo(Modules.FUNDACION, Sections.SEDES, 'create') && (
                <Button variant="primary" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Sede
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modal de formulario */}
      <SedeFormModal
        sede={selectedSede}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedSede(null);
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSedeToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Sede"
        message={`¿Está seguro de eliminar la sede "${sedeToDelete?.nombre}"? Esta acción se puede revertir.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Modal: Almacenes por Sede (H-SC-07) */}
      <AlmacenesPorSedeModal
        sede={sedeForAlmacenes}
        isOpen={showAlmacenesModal}
        onClose={() => {
          setShowAlmacenesModal(false);
          setSedeForAlmacenes(null);
        }}
      />
    </>
  );
};
