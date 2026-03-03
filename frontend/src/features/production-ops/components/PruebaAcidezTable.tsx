/**
 * Componente: Tabla de Pruebas de Acidez con filtros
 * NOTA: Migrado de Supply Chain a Production Ops
 *
 * Características:
 * - Filtros por proveedor, fecha, estado
 * - Indicadores visuales de cumplimiento
 * - Acciones por fila (ver, editar, eliminar)
 * - Paginación
 */
import { useState } from 'react';
import { Edit, Eye, Trash2, Filter, Plus, FlaskConical, CheckCircle, XCircle } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';

import { usePruebasAcidez, useDeletePruebaAcidez } from '../hooks/usePruebasAcidez';
import { useSelectProveedores } from '@/hooks/useSelectLists';
import type { PruebaAcidez } from '../types/prueba-acidez.types';

// ==================== TIPOS ====================

interface PruebaAcidezTableProps {
  onView?: (prueba: PruebaAcidez) => void;
  onEdit?: (prueba: PruebaAcidez) => void;
  onNew?: () => void;
  proveedorId?: number;
}

interface Filtros {
  proveedor?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  cumple_especificacion?: boolean;
  accion_tomada?: string;
}

// ==================== UTILIDADES ====================

const getAccionBadgeVariant = (
  accion: string | undefined
): 'success' | 'warning' | 'danger' | 'gray' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'gray' | 'info'> = {
    ACEPTADO: 'success',
    RECHAZADO: 'danger',
    REPROCESO: 'warning',
    DEVOLUCION: 'danger',
    PENDIENTE: 'gray',
  };
  return map[accion || ''] || 'gray';
};

const formatAccion = (accion: string | undefined): string => {
  if (!accion) return 'Pendiente';
  return accion.charAt(0) + accion.slice(1).toLowerCase();
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ==================== COMPONENTE ====================

export function PruebaAcidezTable({ onView, onEdit, onNew, proveedorId }: PruebaAcidezTableProps) {
  const [filtros, setFiltros] = useState<Filtros>(proveedorId ? { proveedor: proveedorId } : {});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Queries
  const { data: pruebasData, isLoading } = usePruebasAcidez({
    ...filtros,
  });

  const { data: proveedores = [] } = useSelectProveedores();
  const deleteMutation = useDeletePruebaAcidez();

  // Manejar datos con o sin paginación
  const pruebas = Array.isArray(pruebasData) ? pruebasData : pruebasData?.results || [];
  const totalCount = Array.isArray(pruebasData) ? pruebasData.length : pruebasData?.count || 0;

  // ==================== HANDLERS ====================

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta prueba de acidez?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFilterChange = (key: keyof Filtros, value: unknown) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFiltros(proveedorId ? { proveedor: proveedorId } : {});
    setPage(1);
  };

  // Paginación local si no viene del servidor
  const paginatedPruebas = pruebas.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  // ==================== RENDERIZADO ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!pruebas || pruebas.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical className="w-16 h-16" />}
        title="No hay pruebas de acidez registradas"
        description="Comience registrando pruebas de acidez para controlar la calidad del sebo"
        action={
          onNew
            ? {
                label: 'Nueva Prueba',
                onClick: onNew,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pruebas de Acidez ({totalCount})
        </h3>
        <div className="flex items-center gap-2">
          {!proveedorId && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtros
            </Button>
          )}
          {onNew && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onNew}
            >
              Nueva Prueba
            </Button>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && !proveedorId && (
        <Card variant="bordered" padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">Filtros</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Proveedor"
                value={filtros.proveedor || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'proveedor',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              >
                <option value="">Todos</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Fecha Desde"
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => handleFilterChange('fecha_desde', e.target.value || undefined)}
              />

              <Input
                label="Fecha Hasta"
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value || undefined)}
              />

              <Select
                label="Cumplimiento"
                value={
                  filtros.cumple_especificacion === undefined
                    ? ''
                    : String(filtros.cumple_especificacion)
                }
                onChange={(e) =>
                  handleFilterChange(
                    'cumple_especificacion',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
              >
                <option value="">Todos</option>
                <option value="true">Cumple</option>
                <option value="false">No Cumple</option>
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
                  Fecha
                </th>
                {!proveedorId && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Materia Prima Original
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acidez (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Clasificación Resultante
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cumple
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedPruebas.map((prueba: PruebaAcidez) => (
                <tr key={prueba.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {prueba.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <p>{formatDate(prueba.fecha_prueba)}</p>
                      {prueba.hora_prueba && (
                        <p className="text-xs text-gray-500">{prueba.hora_prueba}</p>
                      )}
                    </div>
                  </td>
                  {!proveedorId && (
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {prueba.proveedor_nombre || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {prueba.tipo_materia_prima_original_nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {prueba.valor_acidez.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {prueba.tipo_materia_prima_resultante_nombre ? (
                      <Badge variant="info" size="sm">
                        {prueba.tipo_materia_prima_resultante_nombre}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Sin clasificar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {prueba.cumple_especificacion ? (
                      <CheckCircle className="w-5 h-5 text-success-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-danger-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getAccionBadgeVariant(prueba.accion_tomada)} size="sm">
                      {formatAccion(prueba.accion_tomada)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onView && (
                        <Button variant="ghost" size="sm" onClick={() => onView(prueba)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(prueba)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prueba.id)}
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
            Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalCount)} de{' '}
            {totalCount} pruebas
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
