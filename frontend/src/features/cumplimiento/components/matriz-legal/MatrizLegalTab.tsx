/**
 * Tab de Matriz Legal
 *
 * Gestión completa de normatividad aplicable:
 * - 6 subtabs por tipo de norma (Decretos, Leyes, Resoluciones, Circulares, NTC, Web Scraping)
 * - Buscador inteligente con filtros
 * - CRUD completo de normas
 * - Exportación a Excel
 * - Sistema de scraping para consulta automática
 *
 * Conecta con backend/apps/motor_cumplimiento/matriz_legal/
 */
import { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  Globe,
  Scale,
  BookOpen,
  FileCheck,
  MessageSquare,
  Award,
  Search as SearchIcon,
} from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { NormaFilters } from './NormaFilters';
import { NormasTable } from './NormasTable';
import { NormaFormModal } from './NormaFormModal';
import {
  useNormasLegales,
  useDeleteNorma,
  useExportNormas,
  useTiposNorma,
} from '../../hooks/useNormasLegales';
import type { NormaLegalList, NormaLegal } from '../../types/matrizLegal';
import type { NormasListParams } from '../../api/normasApi';

interface MatrizLegalTabProps {
  /** Código de la subsección activa (desde API/DynamicSections) */
  activeSection?: string;
}

// =============================================================================
// CONFIGURACIÓN DE SUBTABS
// =============================================================================

const TIPO_NORMA_CODES = {
  DECRETOS: 'DEC',
  LEYES: 'LEY',
  RESOLUCIONES: 'RES',
  CIRCULARES: 'CIR',
  NTC: 'NTC',
  WEB_SCRAPING: 'scraping',
} as const;

const SUBTABS = [
  { id: TIPO_NORMA_CODES.DECRETOS, label: 'Decretos', icon: <Scale className="h-4 w-4" /> },
  { id: TIPO_NORMA_CODES.LEYES, label: 'Leyes', icon: <BookOpen className="h-4 w-4" /> },
  {
    id: TIPO_NORMA_CODES.RESOLUCIONES,
    label: 'Resoluciones',
    icon: <FileCheck className="h-4 w-4" />,
  },
  {
    id: TIPO_NORMA_CODES.CIRCULARES,
    label: 'Circulares',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  { id: TIPO_NORMA_CODES.NTC, label: 'NTC', icon: <Award className="h-4 w-4" /> },
  { id: TIPO_NORMA_CODES.WEB_SCRAPING, label: 'Web Scraping', icon: <Globe className="h-4 w-4" /> },
];

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const MatrizLegalTab = ({ activeSection }: MatrizLegalTabProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.MOTOR_CUMPLIMIENTO, Sections.NORMAS, 'create');
  const canEdit = canDo(Modules.MOTOR_CUMPLIMIENTO, Sections.NORMAS, 'edit');
  const canDelete = canDo(Modules.MOTOR_CUMPLIMIENTO, Sections.NORMAS, 'delete');

  const [activeSubtab, setActiveSubtab] = useState(TIPO_NORMA_CODES.DECRETOS);
  const [filters, setFilters] = useState<NormasListParams>({
    page: 1,
    page_size: 10,
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedNorma, setSelectedNorma] = useState<NormaLegal | null>(null);
  const [normaToDelete, setNormaToDelete] = useState<NormaLegalList | null>(null);

  const { data: tiposNorma } = useTiposNorma();
  const deleteMutation = useDeleteNorma();
  const exportMutation = useExportNormas();

  // Agregar filtro por tipo de norma según el subtab activo
  const finalFilters: NormasListParams = {
    ...filters,
    tipo_norma:
      activeSubtab !== TIPO_NORMA_CODES.WEB_SCRAPING
        ? tiposNorma?.find((t) => t.codigo === activeSubtab)?.id
        : undefined,
  };

  const { data: normasData, isLoading, error } = useNormasLegales(finalFilters);

  const normas = normasData?.results || [];
  const totalCount = normasData?.count || 0;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreate = () => {
    setSelectedNorma(null);
    setShowFormModal(true);
  };

  const handleEdit = (norma: NormaLegalList) => {
    // Necesitamos el objeto completo, por ahora usamos el de la lista
    // En producción, hacer una llamada para obtener el detalle completo
    setSelectedNorma(norma as any);
    setShowFormModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!normaToDelete) return;

    try {
      await deleteMutation.mutateAsync(normaToDelete.id);
      setNormaToDelete(null);
    } catch (error) {
      console.error('Error al eliminar norma:', error);
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync(finalFilters);
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  const handleFiltersChange = (newFilters: NormasListParams) => {
    setFilters({ ...newFilters, page: 1 }); // Reset a página 1 al cambiar filtros
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page_size: pageSize, page: 1 });
  };

  // =============================================================================
  // RENDER: WEB SCRAPING SECTION
  // =============================================================================

  const renderWebScrapingSection = () => {
    return (
      <Card>
        <div className="p-8">
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="Búsqueda Inteligente de Normatividad"
            description="Busca automáticamente normas desde fuentes oficiales como la Función Pública, Congreso de la República y otros portales gubernamentales."
            action={{
              label: 'Próximamente',
              onClick: () => {},
              icon: <SearchIcon className="h-4 w-4" />,
            }}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Características disponibles en la próxima versión:
            </p>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Consulta automática por número y año</li>
              <li>• Extracción de contenido oficial</li>
              <li>• Actualización automática de normas derogadas</li>
              <li>• Alertas de nuevas normas publicadas</li>
            </ul>
          </div>
        </div>
      </Card>
    );
  };

  // =============================================================================
  // RENDER: NORMAS SECTION
  // =============================================================================

  const renderNormasSection = () => {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Normas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vigentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {normas.filter((n) => n.vigente).length}
                </p>
              </div>
              <FileCheck className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">SST</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {normas.filter((n) => n.aplica_sst).length}
                </p>
              </div>
              <Badge variant="warning">SST</Badge>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ambiental</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {normas.filter((n) => n.aplica_ambiental).length}
                </p>
              </div>
              <Badge variant="success">Ambiental</Badge>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {SUBTABS.find((t) => t.id === activeSubtab)?.label}
              </h3>
              <Badge variant="gray">{totalCount} normas</Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                leftIcon={<Download className="h-4 w-4" />}
                isLoading={exportMutation.isPending}
              >
                Exportar
              </Button>
              {canCreate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreate}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Nueva Norma
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Filters */}
        <NormaFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Table */}
        {error ? (
          <Card>
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Error al cargar normas"
              description="No se pudieron cargar las normas. Por favor, intenta de nuevo."
            />
          </Card>
        ) : (
          <NormasTable
            data={normas}
            totalCount={totalCount}
            page={filters.page || 1}
            pageSize={filters.page_size || 10}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={(norma) => setNormaToDelete(norma)}
            isLoading={isLoading}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </div>
    );
  };

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================

  return (
    <>
      <div className="space-y-6">
        {/* Subtabs */}
        <Tabs tabs={SUBTABS} activeTab={activeSubtab} onChange={setActiveSubtab} variant="pills" />

        {/* Content */}
        {activeSubtab === TIPO_NORMA_CODES.WEB_SCRAPING
          ? renderWebScrapingSection()
          : renderNormasSection()}
      </div>

      {/* Modales */}
      <NormaFormModal
        norma={selectedNorma}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedNorma(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!normaToDelete}
        onClose={() => setNormaToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Norma"
        message={`¿Estás seguro de eliminar la norma ${normaToDelete?.codigo_completo}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
