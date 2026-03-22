/**
 * Sección de Normas y Sistemas de Gestión
 *
 * Gestión de normas y sistemas de gestión aplicables a la organización.
 * Incluye: ISO (9001, 14001, 45001, 27001), PESV, SG-SST y otras normativas.
 * Incluye normas del sistema (no editables) y normas personalizadas.
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
import { Plus, FileCheck, Lock } from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  BrandedSkeleton,
  DynamicIcon,
  ProtectedAction,
} from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useNormasISO, useDeleteNormaISO } from '../hooks/useNormasISO';
import { NormaISOFormModal } from './modals/NormaISOFormModal';
import type { NormaISO } from '../api/strategicApi';

export const NormasISOSection = () => {
  const { canDo } = usePermissions();
  const { data: normasData, isLoading } = useNormasISO();
  const deleteMutation = useDeleteNormaISO();

  const [showModal, setShowModal] = useState(false);
  const [selectedNorma, setSelectedNorma] = useState<NormaISO | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [normaToDelete, setNormaToDelete] = useState<NormaISO | null>(null);

  const normas = normasData?.results || [];

  const handleEdit = (norma: NormaISO) => {
    setSelectedNorma(norma);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedNorma(null);
    setShowModal(true);
  };

  const handleDeleteClick = (norma: NormaISO) => {
    setNormaToDelete(norma);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (normaToDelete) {
      await deleteMutation.mutateAsync(normaToDelete.id);
      setShowDeleteDialog(false);
      setNormaToDelete(null);
    }
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
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Normas y Sistemas de Gestión
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ISO, PESV, SG-SST y otras normativas aplicables
              </p>
            </div>
          </div>
          <ProtectedAction permission="fundacion.normas_iso.create">
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Norma
            </Button>
          </ProtectedAction>
        </div>

        {/* Data Table Card */}
        {normas.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Norma
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Categoría
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Color
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
                  {normas.map((norma) => (
                    <tr
                      key={norma.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: norma.color
                                ? `${norma.color}20`
                                : 'rgba(59, 130, 246, 0.1)',
                            }}
                          >
                            <DynamicIcon
                              name={norma.icon || 'FileCheck'}
                              size={16}
                              color={norma.color || '#3b82f6'}
                              fallback={
                                <FileCheck
                                  className="h-4 w-4"
                                  style={{ color: norma.color || '#3b82f6' }}
                                />
                              }
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {norma.name}
                              </span>
                              {norma.es_sistema && (
                                <Badge
                                  variant="gray"
                                  size="sm"
                                  className="inline-flex items-center gap-1"
                                >
                                  <Lock className="h-3 w-3" />
                                  Sistema
                                </Badge>
                              )}
                            </div>
                            {norma.short_name && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {norma.short_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="gray" size="sm">
                          {norma.category_display || norma.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {norma.color && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-200 dark:border-gray-600"
                              style={{ backgroundColor: norma.color }}
                            />
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {norma.color}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={norma.is_active ? 'success' : 'gray'} size="sm">
                          {norma.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButtons
                            module={Modules.FUNDACION}
                            section={Sections.NORMAS_ISO}
                            onEdit={() => handleEdit(norma)}
                            onDelete={
                              !norma.es_sistema ? () => handleDeleteClick(norma) : undefined
                            }
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
          /* Empty State */
          <Card>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <FileCheck className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay normas configuradas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Agregue normas ISO, PESV, SG-SST u otras normativas aplicables a su organización
              </p>
              <ProtectedAction permission="fundacion.normas_iso.create">
                <Button variant="primary" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Norma
                </Button>
              </ProtectedAction>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de formulario */}
      <NormaISOFormModal
        norma={selectedNorma}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedNorma(null);
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setNormaToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Norma o Sistema de Gestión"
        message={`¿Está seguro de eliminar la norma "${normaToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
