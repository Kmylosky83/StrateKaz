/**
 * MC-001: Sección de Unidades de Medida
 * Sistema de Gestión StrateKaz
 *
 * Vista 2B: Lista CRUD con Filtros en Línea
 * - DataSection con filtros en línea (sin hardcoding)
 * - DataTableCard para la tabla
 * - Colores dinámicos usando getModuleColorClasses()
 *
 * Características:
 * - Lista de unidades agrupadas por categoría
 * - Filtros por categoría y tipo (sistema/custom)
 * - CRUD completo con permisos RBAC
 * - Acciones: crear, editar, eliminar (solo custom)
 * - Carga de unidades del sistema (admin)
 *
 * Catálogo transversal usado por múltiples módulos:
 * - SedeEmpresa (capacidad de almacenamiento)
 * - Supply Chain (cantidades de productos)
 * - Gestión Ambiental (residuos, emisiones)
 * - Gestor Documental (tamaños de archivo)
 */
import { useState } from 'react';
import {
  Plus,
  Ruler,
  Download,
  Lock,
  Scale,
  Box,
  ArrowLeftRight,
  Square,
  Hash,
  Clock,
  Package,
  HelpCircle,
} from 'lucide-react';
import { Badge, Button, Alert, BrandedSkeleton } from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/forms/Select';
import { DataTableCard } from '@/components/layout';
import { DataSection } from '@/components/data-display';
import { usePermissions, useModuleColor } from '@/hooks';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import {
  useUnidadesMedida,
  useDeleteUnidadMedida,
  useCargarUnidadesSistema,
} from '../hooks/useStrategic';
import { UnidadMedidaFormModal } from './modals/UnidadMedidaFormModal';
import type { UnidadMedidaList, CategoriaUnidad } from '../api/strategicApi';

// Iconos por categoría (usando Design System colors via clases)
const CATEGORIA_ICONS: Record<CategoriaUnidad, React.ComponentType<{ className?: string }>> = {
  MASA: Scale,
  VOLUMEN: Box,
  LONGITUD: ArrowLeftRight,
  AREA: Square,
  CANTIDAD: Hash,
  TIEMPO: Clock,
  CONTENEDOR: Package,
  OTRO: HelpCircle,
};

const CATEGORIA_LABELS: Record<CategoriaUnidad, string> = {
  MASA: 'Masa / Peso',
  VOLUMEN: 'Volumen',
  LONGITUD: 'Longitud',
  AREA: 'Área',
  CANTIDAD: 'Cantidad / Unidades',
  TIEMPO: 'Tiempo',
  CONTENEDOR: 'Contenedores / Embalaje',
  OTRO: 'Otro',
};

export const UnidadesMedidaSection = () => {
  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const { canDo } = usePermissions();
  const isAdmin = canDo(Modules.GESTION_ESTRATEGICA, Sections.UNIDADES_MEDIDA, 'delete'); // Admin = delete permission

  // Estado local
  const [showModal, setShowModal] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadMedidaList | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [unidadToDelete, setUnidadToDelete] = useState<UnidadMedidaList | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<CategoriaUnidad | ''>('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'sistema' | 'custom'>('all');

  // Construir filtros para API (servidor-side filtering)
  const filters = {
    ...(filterCategoria && { categoria: filterCategoria }),
    ...(filterTipo === 'sistema' && { es_sistema: true }),
    ...(filterTipo === 'custom' && { es_sistema: false }),
  };

  // Hooks de datos con filtros aplicados en servidor
  const { data: unidadesData, isLoading, error } = useUnidadesMedida(filters);
  const deleteMutation = useDeleteUnidadMedida();
  const cargarSistemaMutation = useCargarUnidadesSistema();

  const filteredUnidades = unidadesData?.results || [];

  // Handlers
  const handleAdd = () => {
    setSelectedUnidad(null);
    setShowModal(true);
  };

  const handleEdit = (unidad: UnidadMedidaList) => {
    setSelectedUnidad(unidad);
    setShowModal(true);
  };

  const handleDeleteClick = (unidad: UnidadMedidaList) => {
    setUnidadToDelete(unidad);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (unidadToDelete) {
      await deleteMutation.mutateAsync(unidadToDelete.id);
      setShowDeleteDialog(false);
      setUnidadToDelete(null);
    }
  };

  const handleCargarSistema = async () => {
    await cargarSistemaMutation.mutateAsync();
  };

  // Permisos
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.UNIDADES_MEDIDA, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.UNIDADES_MEDIDA, 'edit');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.UNIDADES_MEDIDA, 'delete');

  // Loading state - muestra logo del branding
  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
  }

  // Error state
  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar las unidades de medida. Intente de nuevo."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* DataSection - Vista 2B: Filtros en línea (sin hardcoding) */}
      <DataSection
        icon={Ruler}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Unidades de Medida"
        description="Catálogo de unidades para documentos y registros"
        action={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value as CategoriaUnidad | '')}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              className="w-44"
            />
            <Select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as typeof filterTipo)}
              options={[
                { value: 'all', label: 'Todos los tipos' },
                { value: 'sistema', label: 'Del sistema' },
                { value: 'custom', label: 'Personalizadas' },
              ]}
              className="w-40"
            />
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCargarSistema}
                disabled={cargarSistemaMutation.isPending}
              >
                <Download className={`h-4 w-4 mr-2 ${cargarSistemaMutation.isPending ? 'animate-spin' : ''}`} />
                Cargar Sistema
              </Button>
            )}
            {canCreate && (
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Unidad
              </Button>
            )}
          </div>
        }
      />

      {/* Tabla de unidades */}
      <DataTableCard
        isEmpty={filteredUnidades.length === 0}
        isLoading={false}
        emptyMessage={
          filterCategoria || filterTipo !== 'all'
            ? 'No se encontraron unidades con los filtros aplicados.'
            : 'Cargue las unidades del sistema o agregue una nueva unidad personalizada.'
        }
      >
        {filteredUnidades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Código
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Símbolo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Categoría
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tipo
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnidades.map((unidad) => {
                    const CatIcon = CATEGORIA_ICONS[unidad.categoria] || HelpCircle;

                    return (
                      <tr
                        key={unidad.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-800">
                              <CatIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                              {unidad.codigo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {unidad.nombre}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" size="sm">
                            {unidad.simbolo}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {unidad.categoria_display || CATEGORIA_LABELS[unidad.categoria]}
                        </td>
                        <td className="py-3 px-4">
                          {unidad.es_sistema ? (
                            <Badge variant="info" size="sm">
                              <Lock className="h-3 w-3 mr-1" />
                              Sistema
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              Custom
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButtons
                              module={Modules.GESTION_ESTRATEGICA}
                              section={Sections.UNIDADES_MEDIDA}
                              onEdit={canEdit ? () => handleEdit(unidad) : undefined}
                              onDelete={
                                canDelete && !unidad.es_sistema
                                  ? () => handleDeleteClick(unidad)
                                  : undefined
                              }
                              size="sm"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        ) : null}
      </DataTableCard>

      {/* Modal de formulario */}
      <UnidadMedidaFormModal
        unidad={selectedUnidad}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUnidad(null);
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setUnidadToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Unidad de Medida"
        message={`¿Está seguro de eliminar la unidad "${unidadToDelete?.nombre}" (${unidadToDelete?.codigo})? Esta acción puede afectar registros que usen esta unidad.`}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
