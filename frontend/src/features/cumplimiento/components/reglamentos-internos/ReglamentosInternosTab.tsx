/**
 * Tab de Reglamentos Internos
 *
 * Gestión completa de reglamentos internos de la empresa:
 * - Tabla de reglamentos con control de versiones
 * - Estados: borrador, en_revision, aprobado, vigente, obsoleto
 * - CRUD completo con upload de documentos
 * - Filtros por tipo, estado
 * - Registro de publicaciones y socializaciones
 * - Colores por estado: gris=borrador, amarillo=en_revision, azul=aprobado, verde=vigente, rojo=obsoleto
 *
 * Conecta con backend/apps/motor_cumplimiento/reglamentos_internos/
 */
import { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ReglamentosTable } from './ReglamentosTable';
import { ReglamentoFormModal } from './ReglamentoFormModal';
import { useReglamentos } from '../../hooks/useReglamentos';
import type { Reglamento, EstadoReglamento, ReglamentoFilters } from '../../types/cumplimiento.types';
import { useAuthStore } from '@/store/authStore';
import { reglamentosApi } from '../../api/reglamentosApi';
import { toast } from 'react-hot-toast';

interface ReglamentosInternosTabProps {
  /** Código de la subsección activa (desde API/DynamicSections) */
  activeSection?: string;
}

interface FilterState extends ReglamentoFilters {
  page: number;
  page_size: number;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const ReglamentosInternosTab = ({ activeSection }: ReglamentosInternosTabProps) => {
  const user = useAuthStore((state) => state.user);
  const empresaId = user?.empresa_id || 0;

  const [filters, setFilters] = useState<FilterState>({
    empresa: empresaId,
    page: 1,
    page_size: 10,
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedReglamento, setSelectedReglamento] = useState<Reglamento | null>(null);
  const [reglamentoToDelete, setReglamentoToDelete] = useState<Reglamento | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Query de reglamentos
  const {
    data: reglamentosData,
    isLoading,
    error,
    refetch,
  } = useReglamentos(filters);

  const reglamentos = reglamentosData?.results || [];
  const totalCount = reglamentosData?.count || 0;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreate = () => {
    setSelectedReglamento(null);
    setShowFormModal(true);
  };

  const handleEdit = (reglamento: Reglamento) => {
    setSelectedReglamento(reglamento);
    setShowFormModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reglamentoToDelete) return;

    setIsDeleting(true);
    try {
      await reglamentosApi.delete(reglamentoToDelete.id);
      toast.success('Reglamento eliminado exitosamente');
      setReglamentoToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error al eliminar reglamento:', error);
      toast.error('Error al eliminar el reglamento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Funcionalidad de exportación próximamente');
      // TODO: Implementar exportación cuando esté disponible
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page_size: pageSize, page: 1 });
  };

  // Calcular estadísticas para badges
  const stats = {
    total: reglamentos.length,
    borradores: reglamentos.filter((r) => r.estado === 'borrador').length,
    enRevision: reglamentos.filter((r) => r.estado === 'en_revision').length,
    aprobados: reglamentos.filter((r) => r.estado === 'aprobado').length,
    vigentes: reglamentos.filter((r) => r.estado === 'vigente').length,
    obsoletos: reglamentos.filter((r) => r.estado === 'obsoleto').length,
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalCount}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vigentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.vigentes}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Revisión</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.enRevision}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprobados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.aprobados}
                </p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Obsoletos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.obsoletos}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reglamentos Internos
              </h3>
              <Badge variant="gray">{totalCount} reglamentos</Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreate}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Nuevo Reglamento
              </Button>
            </div>
          </div>
        </Card>

        {/* Filtros (expandible) */}
        {showFilters && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  value={filters.estado || ''}
                  onChange={(e) =>
                    handleFiltersChange({
                      estado: e.target.value ? (e.target.value as EstadoReglamento) : undefined,
                    })
                  }
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Todos los estados</option>
                  <option value="borrador">Borrador</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="vigente">Vigente</option>
                  <option value="obsoleto">Obsoleto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleFiltersChange({ search: e.target.value })}
                  placeholder="Código o nombre del reglamento..."
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      empresa: empresaId,
                      page: 1,
                      page_size: 10,
                    })
                  }
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Badges de Filtros Rápidos */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFiltersChange({ estado: undefined })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !filters.estado
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Todos ({totalCount})
          </button>

          <button
            onClick={() => handleFiltersChange({ estado: 'vigente' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filters.estado === 'vigente'
                ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Vigentes ({stats.vigentes})
          </button>

          <button
            onClick={() => handleFiltersChange({ estado: 'en_revision' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filters.estado === 'en_revision'
                ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Clock className="h-3 w-3" />
            En Revisión ({stats.enRevision})
          </button>

          <button
            onClick={() => handleFiltersChange({ estado: 'aprobado' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filters.estado === 'aprobado'
                ? 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FileCheck className="h-3 w-3" />
            Aprobados ({stats.aprobados})
          </button>

          <button
            onClick={() => handleFiltersChange({ estado: 'obsoleto' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filters.estado === 'obsoleto'
                ? 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <XCircle className="h-3 w-3" />
            Obsoletos ({stats.obsoletos})
          </button>
        </div>

        {/* Table */}
        {error ? (
          <Card>
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Error al cargar reglamentos"
              description="No se pudieron cargar los reglamentos. Por favor, intenta de nuevo."
            />
          </Card>
        ) : (
          <ReglamentosTable
            data={reglamentos}
            totalCount={totalCount}
            page={filters.page}
            pageSize={filters.page_size}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={(reglamento) => setReglamentoToDelete(reglamento)}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Modales */}
      <ReglamentoFormModal
        reglamento={selectedReglamento}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedReglamento(null);
        }}
        empresaId={empresaId}
      />

      <ConfirmDialog
        isOpen={!!reglamentoToDelete}
        onClose={() => setReglamentoToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Reglamento"
        message={`¿Estas seguro de eliminar el reglamento ${reglamentoToDelete?.nombre}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
