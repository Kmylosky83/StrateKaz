/**
 * Tab de Requisitos Legales
 *
 * Gestión completa de requisitos legales de la empresa:
 * - Dashboard de vencimientos con alertas visuales
 * - Tabla de requisitos con estado (vigente, próximo a vencer, vencido)
 * - Colores por estado: verde=vigente, amarillo=próximo, rojo=vencido
 * - CRUD completo de requisitos
 * - Filtros por tipo, estado, sistema
 * - Indicador de días para vencer
 *
 * Conecta con backend/apps/motor_cumplimiento/requisitos_legales/
 */
import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { VencimientosCard } from './VencimientosCard';
import { RequisitosTable } from './RequisitosTable';
import { RequisitoFormModal } from './RequisitoFormModal';
import { useEmpresaRequisitos, useVencimientos } from '../../hooks/useRequisitos';
import type { EmpresaRequisito, EstadoRequisito } from '../../types/requisitosLegales';
import { useAuthStore } from '@/store/authStore';

interface RequisitosLegalesTabProps {
  /** Código de la subsección activa (desde API/DynamicSections) */
  activeSection?: string;
}

interface FilterState {
  page: number;
  page_size: number;
  estado?: EstadoRequisito;
  search?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const RequisitosLegalesTab = ({ activeSection }: RequisitosLegalesTabProps) => {
  const user = useAuthStore((state) => state.user);
  const empresaId = user?.empresa_id || 0;

  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    page_size: 10,
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRequisito, setSelectedRequisito] = useState<EmpresaRequisito | null>(null);
  const [requisitoToDelete, setRequisitoToDelete] = useState<EmpresaRequisito | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Query de requisitos
  const {
    data: requisitosData,
    isLoading,
    error,
  } = useEmpresaRequisitos({
    empresa_id: empresaId,
    ...filters,
  } as any);

  // Query de vencimientos (próximos 30 días)
  const { data: vencimientosData } = useVencimientos(empresaId, 30);

  const requisitos = requisitosData?.results || [];
  const totalCount = requisitosData?.count || 0;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreate = () => {
    setSelectedRequisito(null);
    setShowFormModal(true);
  };

  const handleEdit = (requisito: EmpresaRequisito) => {
    setSelectedRequisito(requisito);
    setShowFormModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requisitoToDelete) return;

    try {
      // Implementar delete mutation cuando esté disponible
      console.log('Delete requisito:', requisitoToDelete.id);
      setRequisitoToDelete(null);
    } catch (error) {
      console.error('Error al eliminar requisito:', error);
    }
  };

  const handleExport = async () => {
    try {
      // Implementar exportación cuando esté disponible
      console.log('Exportar requisitos');
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

  const handleRequisitoClick = (requisito: EmpresaRequisito) => {
    handleEdit(requisito);
  };

  // Calcular estadísticas para badges
  const stats = {
    total: requisitos.length,
    vigentes: requisitos.filter((r) => r.estado === 'vigente').length,
    proximosVencer: requisitos.filter((r) => r.estado === 'proximo_vencer').length,
    vencidos: requisitos.filter((r) => r.estado === 'vencido').length,
    enTramite: requisitos.filter((r) => r.estado === 'en_tramite').length,
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <>
      <div className="space-y-6">
        {/* Dashboard de Vencimientos */}
        <VencimientosCard
          requisitos={vencimientosData || requisitos}
          onRequisitoClick={handleRequisitoClick}
        />

        {/* Actions Bar */}
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Requisitos Legales
              </h3>
              <Badge variant="gray">{totalCount} requisitos</Badge>
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
                Nuevo Requisito
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
                      estado: e.target.value ? (e.target.value as EstadoRequisito) : undefined,
                    })
                  }
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Todos los estados</option>
                  <option value="vigente">Vigente</option>
                  <option value="proximo_vencer">Próximo a Vencer</option>
                  <option value="vencido">Vencido</option>
                  <option value="en_tramite">En Trámite</option>
                  <option value="renovando">En Renovación</option>
                  <option value="no_aplica">No Aplica</option>
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
                  placeholder="Nombre o número de documento..."
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
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
            onClick={() => handleFiltersChange({ estado: 'proximo_vencer' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filters.estado === 'proximo_vencer'
                ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Próximos a Vencer ({stats.proximosVencer})
          </button>

          <button
            onClick={() => handleFiltersChange({ estado: 'vencido' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filters.estado === 'vencido'
                ? 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <XCircle className="h-3 w-3" />
            Vencidos ({stats.vencidos})
          </button>
        </div>

        {/* Table */}
        {error ? (
          <Card>
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Error al cargar requisitos"
              description="No se pudieron cargar los requisitos. Por favor, intenta de nuevo."
            />
          </Card>
        ) : (
          <RequisitosTable
            data={requisitos}
            totalCount={totalCount}
            page={filters.page}
            pageSize={filters.page_size}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={(requisito) => setRequisitoToDelete(requisito)}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Modales */}
      <RequisitoFormModal
        requisito={selectedRequisito}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedRequisito(null);
        }}
        empresaId={empresaId}
      />

      <ConfirmDialog
        isOpen={!!requisitoToDelete}
        onClose={() => setRequisitoToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Requisito"
        message={`¿Estás seguro de eliminar el requisito ${requisitoToDelete?.requisito_nombre}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={false}
      />
    </>
  );
};
