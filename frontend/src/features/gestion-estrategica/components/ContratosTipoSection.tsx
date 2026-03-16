/**
 * ContratosTipoSection - Seccion principal de Tipos de Contrato
 *
 * Vista Tipo B: SectionToolbar + Table en Card
 * Fundacion Tab 4 "Mis Politicas y Reglamentos"
 *
 * Features:
 * - SectionToolbar con busqueda + boton crear (RBAC)
 * - Tabla con columnas: nombre, tipo, duracion, periodo prueba, poliza, estado
 * - ActionButtons por fila (edit, delete) basado en RBAC
 * - ConfirmDialog para eliminar
 * - EmptyState sin datos
 * - BrandedSkeleton mientras carga
 */
import { useState, useMemo } from 'react';
import { FileSignature, Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { BrandedSkeleton } from '@/components/common/BrandedSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useContratosTipo, useDeleteContratoTipo } from '../hooks/useContratos';
import { ContratoTipoFormModal } from './ContratoTipoFormModal';
import type { TipoContratoDetail } from '../types/contratos.types';

// ==================== COMPONENT ====================

export function ContratosTipoSection() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.CONTRATOS_TIPO, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.CONTRATOS_TIPO, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.CONTRATOS_TIPO, 'delete');

  // -- State --
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<TipoContratoDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TipoContratoDetail | null>(null);

  // -- Data --
  const { data: contratos = [], isLoading } = useContratosTipo();
  const deleteMutation = useDeleteContratoTipo();

  // -- Filtered data --
  const filteredContratos = useMemo(() => {
    if (!search.trim()) return contratos;
    const term = search.toLowerCase();
    return contratos.filter(
      (c) => c.nombre.toLowerCase().includes(term) || c.tipo_display.toLowerCase().includes(term)
    );
  }, [contratos, search]);

  // -- Handlers --
  const handleCreate = () => {
    setSelectedContrato(null);
    setShowFormModal(true);
  };

  const handleEdit = (contrato: TipoContratoDetail) => {
    setSelectedContrato(contrato);
    setShowFormModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error handling via mutation onError (toast)
    }
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedContrato(null);
  };

  // -- Loading --
  if (isLoading) {
    return <BrandedSkeleton lines={8} />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <SectionToolbar
        title="Tipos de Contrato"
        count={filteredContratos.length}
        searchable
        searchValue={search}
        searchPlaceholder="Buscar tipo de contrato..."
        onSearchChange={setSearch}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo tipo de contrato',
                onClick: handleCreate,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {/* Table / Content */}
      <Card padding="none">
        {filteredContratos.length === 0 ? (
          <EmptyState
            icon={<FileSignature className="w-12 h-12" />}
            title="Sin tipos de contrato"
            description="No se han registrado tipos de contrato laboral. Comience creando el primero."
            action={
              canCreate
                ? {
                    label: 'Crear tipo de contrato',
                    onClick: handleCreate,
                    icon: <Plus className="w-4 h-4" />,
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    Duraci&oacute;n (d&iacute;as)
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    Per&iacute;odo de prueba
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    P&oacute;liza
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    Estado
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContratos.map((contrato) => (
                  <tr
                    key={contrato.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {contrato.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">
                        {contrato.tipo_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">
                        {contrato.duracion_default_dias != null
                          ? `${contrato.duracion_default_dias} d\u00edas`
                          : 'Indefinido'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">
                        {contrato.periodo_prueba_dias > 0
                          ? `${contrato.periodo_prueba_dias} d\u00edas`
                          : 'Sin periodo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant={contrato.requiere_poliza ? 'warning' : 'gray'} size="sm">
                        {contrato.requiere_poliza ? 'Requerida' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant={contrato.is_active ? 'success' : 'gray'} size="sm">
                        {contrato.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3 text-right">
                        <ActionButtons
                          module={Modules.FUNDACION}
                          section={Sections.CONTRATOS_TIPO}
                          onEdit={() => handleEdit(contrato)}
                          onDelete={() => setDeleteTarget(contrato)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <ContratoTipoFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        contrato={selectedContrato}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar tipo de contrato"
        message={`\u00bfEst\u00e1 seguro de eliminar el tipo de contrato "${deleteTarget?.nombre}"? Esta acci\u00f3n no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
