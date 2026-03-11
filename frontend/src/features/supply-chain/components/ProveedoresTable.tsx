/**
 * Componente: Tabla de Proveedores con filtros
 *
 * Características:
 * - Filtros avanzados (tipo, estado, materia prima)
 * - Acciones por fila (ver, editar, cambiar estado)
 * - Exportación a Excel
 * - Paginación
 */
import { useState, useEffect } from 'react';
import { Edit, Eye, Trash2, Users, Shield, UserCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';

import { useProveedores, useDeleteProveedor } from '../hooks/useProveedores';
import { useTiposProveedor } from '../hooks/useCatalogos';
import { CrearAccesoProveedorModal } from './CrearAccesoProveedorModal';
import type { ProveedorList, TipoProveedor } from '../types';

// ==================== TIPOS ====================

interface ProveedoresTableProps {
  onView?: (proveedor: ProveedorList) => void;
  onEdit?: (proveedor: ProveedorList) => void;
  showFilters?: boolean;
}

interface Filtros {
  search?: string;
  tipo_proveedor?: number;
  is_active?: boolean;
  tipos_materia_prima?: number[];
}

// ==================== UTILIDADES ====================

const getEstadoBadgeVariant = (isActive: boolean): 'success' | 'gray' => {
  return isActive ? 'success' : 'gray';
};

const formatEstado = (isActive: boolean): string => {
  return isActive ? 'Activo' : 'Inactivo';
};

// ==================== COMPONENTE ====================

export function ProveedoresTable({
  onView,
  onEdit,
  showFilters: externalShowFilters,
}: ProveedoresTableProps) {
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.SUPPLY_CHAIN, Sections.REGISTRO_PROVEEDORES, 'edit');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.REGISTRO_PROVEEDORES, 'delete');

  const [filtros, setFiltros] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);

  // Sync filter visibility from parent (SectionToolbar toggle)
  useEffect(() => {
    if (externalShowFilters !== undefined) {
      setShowFilters(externalShowFilters);
    }
  }, [externalShowFilters]);
  const [page, setPage] = useState(1);
  const [accesoProveedor, setAccesoProveedor] = useState<ProveedorList | null>(null);
  const pageSize = 10;

  // Queries
  const { data: proveedores, isLoading } = useProveedores({
    ...filtros,
    page,
    page_size: pageSize,
  });

  const { data: tiposProveedor } = useTiposProveedor({ is_active: true });
  const deleteMutation = useDeleteProveedor();

  // ==================== HANDLERS ====================

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      await deleteMutation.mutateAsync(id);
    }
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
      />
    );
  }

  const { results: data, count: totalCount } = proveedores;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
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
              <Input
                label="Búsqueda"
                type="text"
                placeholder="Buscar por nombre, NIT..."
                value={filtros.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />

              <Select
                label="Tipo de Proveedor"
                value={filtros.tipo_proveedor || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'tipo_proveedor',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              >
                <option value="">Todos</option>
                {Array.isArray(tiposProveedor) &&
                  tiposProveedor.map((tipo: TipoProveedor) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
              </Select>

              <Select
                label="Estado"
                value={filtros.is_active === undefined ? '' : filtros.is_active ? 'true' : 'false'}
                onChange={(e) =>
                  handleFilterChange(
                    'is_active',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
              >
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
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
                  Suministros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
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
                    {proveedor.codigo_interno}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{proveedor.razon_social}</p>
                    {proveedor.nombre_comercial && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {proveedor.nombre_comercial}
                      </p>
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
                    {proveedor.tipos_materia_prima_display?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {proveedor.tipos_materia_prima_display.slice(0, 2).map((tipo, idx) => (
                          <Badge key={idx} variant="primary" size="sm">
                            {tipo}
                          </Badge>
                        ))}
                        {proveedor.tipos_materia_prima_display.length > 2 && (
                          <Badge variant="gray" size="sm">
                            +{proveedor.tipos_materia_prima_display.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                        No aplica
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(proveedor.is_active)} size="sm">
                      {formatEstado(proveedor.is_active)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onView && (
                        <Button variant="ghost" size="sm" onClick={() => onView(proveedor)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {canEdit && onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(proveedor)}
                          className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:text-secondary-300 dark:hover:bg-secondary-900/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canEdit && proveedor.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAccesoProveedor(proveedor)}
                          title={
                            proveedor.tiene_acceso
                              ? `Agregar otro usuario (${proveedor.usuarios_vinculados_count} activo${proveedor.usuarios_vinculados_count !== 1 ? 's' : ''})`
                              : 'Crear acceso al sistema'
                          }
                        >
                          {proveedor.tiene_acceso ? (
                            <UserCheck className="w-4 h-4 text-success-600 dark:text-success-400" />
                          ) : (
                            <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          )}
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(proveedor.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </Button>
                      )}
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
            Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalCount)} de{' '}
            {totalCount} proveedores
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

      {/* Modal Crear Acceso */}
      <CrearAccesoProveedorModal
        proveedor={accesoProveedor}
        isOpen={!!accesoProveedor}
        onClose={() => setAccesoProveedor(null)}
      />
    </div>
  );
}
