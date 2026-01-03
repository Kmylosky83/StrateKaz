/**
 * Sección de Consecutivos - Módulo Organización
 *
 * Sistema simplificado de gestión de consecutivos.
 * Los tipos de documento son dinámicos según necesidad.
 *
 * Usa Design System:
 * - Card, Badge, Button
 * - DataTableCard, FilterCard
 * - EmptyState, ConfirmDialog
 */
import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Hash,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  List,
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
import {
  useConsecutivos,
  useDeleteConsecutivo,
} from '../hooks/useStrategic';
import { ConsecutivoFormModal } from './modals/ConsecutivoFormModal';
import type { ConsecutivoConfig } from '../types/strategic.types';

export const ConsecutivosSection = () => {
  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Estado de modales
  const [selectedConsecutivo, setSelectedConsecutivo] = useState<ConsecutivoConfig | null>(null);
  const [isConsecutivoModalOpen, setIsConsecutivoModalOpen] = useState(false);
  const [deleteConsecutivoConfirm, setDeleteConsecutivoConfirm] =
    useState<ConsecutivoConfig | null>(null);

  // Queries
  const { data: consecutivosData, isLoading: loadingConsecutivos } = useConsecutivos();
  const deleteConsecutivoMutation = useDeleteConsecutivo();

  // Filtrar consecutivos
  const consecutivos = useMemo(() => {
    const items = consecutivosData?.results || [];
    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(
      (c) =>
        c.prefix.toLowerCase().includes(term) ||
        c.tipo_documento_name?.toLowerCase().includes(term) ||
        c.tipo_documento_code?.toLowerCase().includes(term)
    );
  }, [consecutivosData, searchTerm]);

  // Handlers
  const handleCreateConsecutivo = () => {
    setSelectedConsecutivo(null);
    setIsConsecutivoModalOpen(true);
  };

  const handleEditConsecutivo = (consecutivo: ConsecutivoConfig) => {
    setSelectedConsecutivo(consecutivo);
    setIsConsecutivoModalOpen(true);
  };

  const handleDeleteConsecutivo = async () => {
    if (deleteConsecutivoConfirm) {
      await deleteConsecutivoMutation.mutateAsync(deleteConsecutivoConfirm.id);
      setDeleteConsecutivoConfirm(null);
    }
  };

  // Generar ejemplo de consecutivo
  const generateExample = (config: ConsecutivoConfig): string => {
    const sep = config.separator || '';
    const parts: string[] = [config.prefix];

    const now = new Date();
    if (config.include_day) {
      parts.push(now.toISOString().slice(0, 10).replace(/-/g, ''));
    } else if (config.include_month) {
      parts.push(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`);
    } else if (config.include_year) {
      parts.push(String(now.getFullYear()));
    }

    const nextNumber = config.current_number + 1;
    parts.push(String(nextNumber).padStart(config.padding, '0'));

    let result = parts.join(sep);
    if (config.suffix) {
      result += `${sep}${config.suffix}`;
    }

    return result;
  };

  /**
   * Mapeo de colores hex a variantes de badge
   */
  const colorToVariant = (color?: string | null): 'primary' | 'success' | 'purple' | 'warning' | 'info' | 'secondary' | 'gray' => {
    if (!color) return 'gray';
    const colorMap: Record<string, 'primary' | 'success' | 'purple' | 'warning' | 'info' | 'secondary' | 'gray'> = {
      '#10B981': 'success', // green
      '#8B5CF6': 'purple',  // purple
      '#F59E0B': 'warning', // amber
      '#6B7280': 'secondary', // gray
      '#3B82F6': 'primary', // blue
      '#14B8A6': 'info',    // teal
    };
    return colorMap[color] || 'gray';
  };

  // Calcular estadísticas para StatsGrid
  const consecutivoStats: StatItem[] = useMemo(() => {
    const items = consecutivosData?.results || [];
    const activos = items.filter((c) => c.is_active).length;
    const conResetAnual = items.filter((c) => c.reset_yearly).length;
    const totalGenerados = items.reduce((sum, c) => sum + (c.current_number || 0), 0);

    return [
      { label: 'Total Consecutivos', value: items.length, icon: Hash, iconColor: 'info' as const },
      { label: 'Activos', value: activos, icon: CheckCircle, iconColor: 'success' as const },
      { label: 'Reset Anual', value: conResetAnual, icon: Calendar, iconColor: 'info' as const, description: 'Se reinician cada año' },
      { label: 'Docs Generados', value: totalGenerados, icon: List, iconColor: 'gray' as const, description: 'Total acumulado' },
    ];
  }, [consecutivosData]);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {loadingConsecutivos ? (
        <StatsGridSkeleton columns={4} />
      ) : (
        <StatsGrid stats={consecutivoStats} columns={4} moduleColor="purple" />
      )}

      {/* Filtros */}
      <FilterCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por prefijo o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Filter className="h-4 w-4" />}
          />
          <div className="flex justify-end">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleCreateConsecutivo}
            >
              Nuevo Consecutivo
            </Button>
          </div>
        </div>
      </FilterCard>

      {/* Tabla de Consecutivos */}
      <DataTableCard>
        {loadingConsecutivos ? (
          <TableSkeleton columns={6} rows={5} />
        ) : consecutivos.length === 0 ? (
          <EmptyState
            icon={<Hash className="h-12 w-12" />}
            title="No hay consecutivos configurados"
            description="Crea tu primer consecutivo para empezar a numerar documentos automáticamente"
            action={{
              label: 'Crear Consecutivo',
              onClick: handleCreateConsecutivo,
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
                  Formato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ejemplo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actual
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
              {consecutivos.map((consecutivo) => {
                // Usar datos de categoría directamente del consecutivo
                const categoryName = consecutivo.tipo_documento_categoria_name || 'Sin categoría';
                const categoryColor = consecutivo.tipo_documento_categoria_color;
                const categoryVariant = colorToVariant(categoryColor);

                return (
                  <tr key={consecutivo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {consecutivo.tipo_documento_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {consecutivo.prefix}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={categoryVariant} size="sm">
                        {categoryName}
                      </Badge>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" size="sm">
                        {consecutivo.padding} dígitos
                      </Badge>
                      {consecutivo.include_year && (
                        <Badge variant="info" size="sm">
                          Año
                        </Badge>
                      )}
                      {consecutivo.include_month && (
                        <Badge variant="info" size="sm">
                          Mes
                        </Badge>
                      )}
                      {consecutivo.reset_yearly && (
                        <Badge variant="warning" size="sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          Anual
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-primary-600 dark:text-primary-400">
                      {consecutivo.ejemplo || generateExample(consecutivo)}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {consecutivo.current_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {consecutivo.is_active ? (
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
                        onClick={() => handleEditConsecutivo(consecutivo)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConsecutivoConfirm(consecutivo)}
                        title="Eliminar"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </DataTableCard>

      {/* Modal de Consecutivo */}
      <ConsecutivoFormModal
        consecutivo={selectedConsecutivo}
        isOpen={isConsecutivoModalOpen}
        onClose={() => {
          setIsConsecutivoModalOpen(false);
          setSelectedConsecutivo(null);
        }}
      />

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={deleteConsecutivoConfirm !== null}
        onClose={() => setDeleteConsecutivoConfirm(null)}
        onConfirm={handleDeleteConsecutivo}
        title="Eliminar Consecutivo"
        message={`¿Está seguro que desea eliminar el consecutivo "${deleteConsecutivoConfirm?.prefix}" (${deleteConsecutivoConfirm?.tipo_documento_name})? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteConsecutivoMutation.isPending}
      />
    </div>
  );
};

export default ConsecutivosSection;
