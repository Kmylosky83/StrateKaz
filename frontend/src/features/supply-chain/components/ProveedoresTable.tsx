/**
 * Componente: Tabla de Proveedores con filtros
 *
 * Características:
 * - Filtros avanzados (tipo, estado, materia prima)
 * - Acciones por fila (ver, editar, cambiar estado)
 * - Exportación a Excel
 * - Paginación
 */
import { useState } from 'react';
import { Edit, Eye, Trash2, Download, Filter, Plus, Users } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

import { useProveedores, useDeleteProveedor, useExportProveedores } from '../hooks/useProveedores';
import { useTiposProveedor } from '../hooks/useCatalogos';
import type { ProveedorList, TipoProveedor } from '../types';

// ==================== TIPOS ====================

interface ProveedoresTableProps {
  onView?: (proveedor: ProveedorList) => void;
  onEdit?: (proveedor: ProveedorList) => void;
  onNew?: () => void;
}

interface Filtros {
  search?: string;
  tipo_proveedor?: number;
  estado?: string;
  tipos_materia_prima?: number[];
}

// ==================== UTILIDADES ====================

const getEstadoBadgeVariant = (estado: string): 'success' | 'warning' | 'danger' | 'gray' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
    ACTIVO: 'success',
    INACTIVO: 'gray',
    SUSPENDIDO: 'warning',
    BLOQUEADO: 'danger',
  };
  return map[estado] || 'gray';
};

const formatEstado = (estado: string): string => {
  return estado.charAt(0) + estado.slice(1).toLowerCase();
};

// ==================== COMPONENTE ====================

export function ProveedoresTable({ onView, onEdit, onNew }: ProveedoresTableProps) {
  const [filtros, setFiltros] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Queries
  const { data: proveedores, isLoading } = useProveedores({
    ...filtros,
    page,
    page_size: pageSize,
  });

  const { data: tiposProveedor } = useTiposProveedor({ is_active: true });
  const deleteMutation = useDeleteProveedor();
  const exportMutation = useExportProveedores();

  // ==================== HANDLERS ====================

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleExport = () => {
    exportMutation.mutate(filtros);
  };

  const handleFilterChange = (key: keyof Filtros, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFiltros({});
    setPage(1);
  };

  // ==================== RENDERIZADO ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!proveedores?.results || proveedores.results.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-16 h-16" />}
        title="No hay proveedores registrados"
        description="Comience agregando proveedores a su sistema"
        action={
          onNew
            ? {
                label: 'Nuevo Proveedor',
                onClick: onNew,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />
    );
  }

  const { results: data, count: totalCount } = proveedores;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Proveedores ({totalCount})
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            Exportar
          </Button>
          {onNew && (
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
              Nuevo Proveedor
            </Button>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <Card variant="bordered" padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">Filtros</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Búsqueda
                </label>
                <input
                  type="text"
                  placeholder="Buscar por nombre, NIT..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filtros.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Tipo de proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Proveedor
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filtros.tipo_proveedor || ''}
                  onChange={(e) =>
                    handleFilterChange('tipo_proveedor', e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">Todos</option>
                  {Array.isArray(tiposProveedor) && tiposProveedor.map((tipo: TipoProveedor) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filtros.estado || ''}
                  onChange={(e) => handleFilterChange('estado', e.target.value || undefined)}
                >
                  <option value="">Todos</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Razón Social
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  NIT/Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Materias Primas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Calificación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((proveedor) => (
                <tr key={proveedor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {proveedor.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{proveedor.razon_social}</p>
                    {proveedor.nombre_comercial && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{proveedor.nombre_comercial}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {proveedor.tipo_proveedor_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {proveedor.numero_documento}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {proveedor.telefono && <p>{proveedor.telefono}</p>}
                    {proveedor.email && <p className="text-xs">{proveedor.email}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {proveedor.tipos_materia_prima_nombres?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {proveedor.tipos_materia_prima_nombres.slice(0, 2).map((tipo, idx) => (
                          <Badge key={idx} variant="gray" size="sm">
                            {tipo}
                          </Badge>
                        ))}
                        {proveedor.tipos_materia_prima_nombres.length > 2 && (
                          <Badge variant="gray" size="sm">
                            +{proveedor.tipos_materia_prima_nombres.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(proveedor.estado)} size="sm">
                      {formatEstado(proveedor.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {proveedor.calificacion_actual ? (
                      <span className="font-medium">{proveedor.calificacion_actual}/100</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onView && (
                        <Button variant="ghost" size="sm" onClick={() => onView(proveedor)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(proveedor)} className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:text-secondary-300 dark:hover:bg-secondary-900/20">
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(proveedor.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalCount)} de {totalCount}{' '}
            proveedores
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
