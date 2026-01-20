/**
 * MC-001: Sección de Unidades de Medida
 * Sistema de Gestión StrateKaz
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
import { Card, Badge, Button, Alert } from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/forms/Select';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
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
  const { canDo } = usePermissions();
  const isAdmin = canDo(Modules.GESTION_ESTRATEGICA, Sections.UNIDADES_MEDIDA, 'delete'); // Admin = delete permission

  // Hooks de datos
  const { data: unidadesData, isLoading, error } = useUnidadesMedida();
  const deleteMutation = useDeleteUnidadMedida();
  const cargarSistemaMutation = useCargarUnidadesSistema();

  // Estado local
  const [showModal, setShowModal] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadMedidaList | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [unidadToDelete, setUnidadToDelete] = useState<UnidadMedidaList | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<CategoriaUnidad | ''>('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'sistema' | 'custom'>('all');

  const unidades = unidadesData?.results || [];

  // Filtrar unidades
  const filteredUnidades = unidades.filter((unidad) => {
    if (filterCategoria && unidad.categoria !== filterCategoria) return false;
    if (filterTipo === 'sistema' && !unidad.es_sistema) return false;
    if (filterTipo === 'custom' && unidad.es_sistema) return false;
    return true;
  });

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

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-1/4 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
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
    <>
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Ruler className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Unidades de Medida
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unidades.length} unidad{unidades.length !== 1 ? 'es' : ''} configurada
                  {unidades.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCargarSistema}
                  disabled={cargarSistemaMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Cargar Sistema
                </Button>
              )}
              {canCreate && (
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Unidad
                </Button>
              )}
            </div>
          </div>

          {/* Filtros */}
          {unidades.length > 0 && (
            <div className="flex gap-4 mb-6">
              <Select
                label=""
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value as CategoriaUnidad | '')}
                options={[
                  { value: '', label: 'Todas las categorías' },
                  { value: 'MASA', label: 'Masa / Peso' },
                  { value: 'VOLUMEN', label: 'Volumen' },
                  { value: 'LONGITUD', label: 'Longitud' },
                  { value: 'AREA', label: 'Área' },
                  { value: 'CANTIDAD', label: 'Cantidad / Unidades' },
                  { value: 'TIEMPO', label: 'Tiempo' },
                  { value: 'CONTENEDOR', label: 'Contenedores' },
                  { value: 'OTRO', label: 'Otro' },
                ]}
                className="w-48"
              />
              <Select
                label=""
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value as typeof filterTipo)}
                options={[
                  { value: 'all', label: 'Todas' },
                  { value: 'sistema', label: 'Del sistema' },
                  { value: 'custom', label: 'Personalizadas' },
                ]}
                className="w-40"
              />
            </div>
          )}

          {/* Tabla de unidades */}
          {filteredUnidades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200 dark:border-secondary-700">
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
                        className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-secondary-100 dark:bg-secondary-800">
                              <CatIcon className="h-4 w-4 text-secondary-600 dark:text-gray-400" />
                            </div>
                            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                              {unidad.codigo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-secondary-700 dark:text-secondary-300">
                          {unidad.nombre}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" size="sm">
                            {unidad.simbolo}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-secondary-600 dark:text-gray-400">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : unidades.length > 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron unidades con los filtros aplicados.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCategoria('');
                  setFilterTipo('all');
                }}
                className="mt-2"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-800 mb-4">
                <Ruler className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay unidades de medida
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Cargue las unidades del sistema o agregue una nueva unidad personalizada.
              </p>
              <div className="flex justify-center gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={handleCargarSistema}
                    disabled={cargarSistemaMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Cargar Sistema
                  </Button>
                )}
                {canCreate && (
                  <Button variant="primary" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Unidad
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

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
    </>
  );
};
