/**
 * Sección de Tipos de Documento y Categorías - Módulo Organización
 *
 * Gestión completa de categorías y tipos de documento.
 * Permite crear, editar y eliminar categorías y tipos.
 *
 * Usa Design System:
 * - Card, Badge, Button
 * - DataTableCard, FilterCard
 * - EmptyState, ConfirmDialog
 * - Tabs para alternar entre vistas
 */
import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  Tag,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { FilterCard } from '@/components/layout/FilterCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import {
  useCategorias,
  useTiposDocumento,
  useDeleteCategoria,
  useDeleteTipoDocumento,
} from '../hooks/useStrategic';
import { CategoriaFormModal } from './modals/CategoriaFormModal';
import { TipoDocumentoFormModal } from './modals/TipoDocumentoFormModal';
import type { CategoriaDocumento, TipoDocumento } from '../types/strategic.types';

// Mapeo de colores hex a variantes de Badge
const colorToVariant = (color: string): 'primary' | 'success' | 'purple' | 'warning' | 'info' | 'secondary' | 'gray' | 'danger' => {
  const colorMap: Record<string, 'primary' | 'success' | 'purple' | 'warning' | 'info' | 'secondary' | 'gray' | 'danger'> = {
    '#10B981': 'success',
    '#8B5CF6': 'purple',
    '#F59E0B': 'warning',
    '#6B7280': 'secondary',
    '#3B82F6': 'primary',
    '#14B8A6': 'info',
    '#EF4444': 'danger',
  };
  return colorMap[color] || 'gray';
};

export const TiposDocumentoSection = () => {
  // Tab activa
  const [activeTab, setActiveTab] = useState<'categorias' | 'tipos'>('categorias');

  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Estado de modales - Categorías
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaDocumento | null>(null);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [deleteCategoriaConfirm, setDeleteCategoriaConfirm] = useState<CategoriaDocumento | null>(null);

  // Estado de modales - Tipos
  const [selectedTipo, setSelectedTipo] = useState<TipoDocumento | null>(null);
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);
  const [deleteTipoConfirm, setDeleteTipoConfirm] = useState<TipoDocumento | null>(null);

  // Queries
  const { data: categoriasData, isLoading: loadingCategorias } = useCategorias();
  const { data: tiposData, isLoading: loadingTipos } = useTiposDocumento();
  const deleteCategoriaMutation = useDeleteCategoria();
  const deleteTipoMutation = useDeleteTipoDocumento();

  // Mapa de categorías para fácil acceso
  const categoriasMap = useMemo(() => {
    const map = new Map<number, CategoriaDocumento>();
    categoriasData?.results?.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categoriasData]);

  // Filtrar categorías
  const categorias = useMemo(() => {
    const items = categoriasData?.results || [];
    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(
      (c) =>
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
    );
  }, [categoriasData, searchTerm]);

  // Filtrar tipos de documento
  const tiposDocumento = useMemo(() => {
    const items = tiposData?.results || [];
    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(
      (t) =>
        t.code.toLowerCase().includes(term) ||
        t.name.toLowerCase().includes(term) ||
        t.categoria_name?.toLowerCase().includes(term)
    );
  }, [tiposData, searchTerm]);

  // Calcular estadísticas para StatsGrid
  const documentStats: StatItem[] = useMemo(() => {
    const cats = categoriasData?.results || [];
    const tipos = tiposData?.results || [];
    const categoriasActivas = cats.filter((c) => c.is_active).length;
    const tiposActivos = tipos.filter((t) => t.is_active).length;
    const tiposConConsecutivo = tipos.filter((t) => t.tiene_consecutivo).length;

    return [
      { label: 'Categorías', value: cats.length, icon: FolderOpen, iconColor: 'info' as const },
      { label: 'Tipos de Documento', value: tipos.length, icon: FileText, iconColor: 'info' as const },
      { label: 'Tipos Activos', value: tiposActivos, icon: CheckCircle, iconColor: 'success' as const },
      { label: 'Con Consecutivo', value: tiposConConsecutivo, icon: Tag, iconColor: 'purple' as const, description: 'Configurados' },
    ];
  }, [categoriasData, tiposData]);

  // Handlers - Categorías
  const handleCreateCategoria = () => {
    setSelectedCategoria(null);
    setIsCategoriaModalOpen(true);
  };

  const handleEditCategoria = (categoria: CategoriaDocumento) => {
    setSelectedCategoria(categoria);
    setIsCategoriaModalOpen(true);
  };

  const handleDeleteCategoria = async () => {
    if (deleteCategoriaConfirm) {
      await deleteCategoriaMutation.mutateAsync(deleteCategoriaConfirm.id);
      setDeleteCategoriaConfirm(null);
    }
  };

  // Handlers - Tipos
  const handleCreateTipo = () => {
    setSelectedTipo(null);
    setIsTipoModalOpen(true);
  };

  const handleEditTipo = (tipo: TipoDocumento) => {
    setSelectedTipo(tipo);
    setIsTipoModalOpen(true);
  };

  const handleDeleteTipo = async () => {
    if (deleteTipoConfirm) {
      await deleteTipoMutation.mutateAsync(deleteTipoConfirm.id);
      setDeleteTipoConfirm(null);
    }
  };

  // Tabs
  const tabs = [
    {
      id: 'categorias',
      label: `Categorías (${categoriasData?.count || 0})`,
      icon: <FolderOpen className="h-4 w-4" />,
    },
    {
      id: 'tipos',
      label: `Tipos de Documento (${tiposData?.count || 0})`,
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  const isLoading = loadingCategorias || loadingTipos;

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {isLoading ? (
        <StatsGridSkeleton columns={4} />
      ) : (
        <StatsGrid stats={documentStats} columns={4} moduleColor="purple" />
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => {
          setActiveTab(id as 'categorias' | 'tipos');
          setSearchTerm('');
        }}
      />

      {/* Filtros */}
      <FilterCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder={activeTab === 'categorias' ? 'Buscar categoría...' : 'Buscar tipo de documento...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Filter className="h-4 w-4" />}
          />
          <div className="flex justify-end">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={activeTab === 'categorias' ? handleCreateCategoria : handleCreateTipo}
            >
              {activeTab === 'categorias' ? 'Nueva Categoría' : 'Nuevo Tipo'}
            </Button>
          </div>
        </div>
      </FilterCard>

      {/* Contenido según tab activa */}
      {activeTab === 'categorias' ? (
        /* Tabla de Categorías */
        <DataTableCard>
          {loadingCategorias ? (
            <TableSkeleton columns={6} rows={5} />
          ) : categorias.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-12 w-12" />}
              title="No hay categorías configuradas"
              description="Crea tu primera categoría para empezar a organizar tipos de documentos"
              action={{
                label: 'Crear Categoría',
                onClick: handleCreateCategoria,
              }}
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipos
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {categorias.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoria.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {categoria.name}
                            </p>
                            {categoria.is_system && (
                              <Lock className="h-3 w-3 text-gray-400" title="Categoría del sistema" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {categoria.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {categoria.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant="secondary" size="sm">
                        {categoria.count_tipos || 0} tipos
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {categoria.order}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {categoria.is_active ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactiva
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategoria(categoria)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!categoria.is_system && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCategoriaConfirm(categoria)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={!categoria.puede_eliminar?.puede}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataTableCard>
      ) : (
        /* Tabla de Tipos de Documento */
        <DataTableCard>
          {loadingTipos ? (
            <TableSkeleton columns={7} rows={5} />
          ) : tiposDocumento.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No hay tipos de documento configurados"
              description="Crea tu primer tipo de documento para empezar"
              action={{
                label: 'Crear Tipo de Documento',
                onClick: handleCreateTipo,
              }}
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo de Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Prefijo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Consecutivo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tiposDocumento.map((tipo) => {
                  const categoria = tipo.categoria ? categoriasMap.get(tipo.categoria) : null;

                  return (
                    <tr key={tipo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {tipo.name}
                              </p>
                              {tipo.is_system && (
                                <Lock className="h-3 w-3 text-gray-400" title="Tipo del sistema" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {tipo.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {categoria ? (
                          <Badge variant={colorToVariant(categoria.color)} size="sm">
                            {categoria.name}
                          </Badge>
                        ) : (
                          <Badge variant="gray" size="sm">
                            {tipo.categoria_name || 'Sin categoría'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {tipo.description || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {tipo.prefijo_sugerido ? (
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {tipo.prefijo_sugerido}
                          </code>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {tipo.tiene_consecutivo ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configurado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">
                            Sin consecutivo
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {tipo.is_active ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTipo(tipo)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!tipo.is_system && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTipoConfirm(tipo)}
                              title="Eliminar"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              disabled={!tipo.puede_eliminar?.puede}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </DataTableCard>
      )}

      {/* Modales */}
      <CategoriaFormModal
        categoria={selectedCategoria}
        isOpen={isCategoriaModalOpen}
        onClose={() => {
          setIsCategoriaModalOpen(false);
          setSelectedCategoria(null);
        }}
      />

      <TipoDocumentoFormModal
        tipoDocumento={selectedTipo}
        isOpen={isTipoModalOpen}
        onClose={() => {
          setIsTipoModalOpen(false);
          setSelectedTipo(null);
        }}
      />

      {/* Diálogos de confirmación */}
      <ConfirmDialog
        isOpen={deleteCategoriaConfirm !== null}
        onClose={() => setDeleteCategoriaConfirm(null)}
        onConfirm={handleDeleteCategoria}
        title="Eliminar Categoría"
        message={`¿Está seguro que desea eliminar la categoría "${deleteCategoriaConfirm?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteCategoriaMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteTipoConfirm !== null}
        onClose={() => setDeleteTipoConfirm(null)}
        onConfirm={handleDeleteTipo}
        title="Eliminar Tipo de Documento"
        message={`¿Está seguro que desea eliminar el tipo de documento "${deleteTipoConfirm?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteTipoMutation.isPending}
      />
    </div>
  );
};

export default TiposDocumentoSection;
