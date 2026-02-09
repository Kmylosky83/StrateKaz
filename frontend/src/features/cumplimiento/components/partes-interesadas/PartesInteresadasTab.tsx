/**
 * Tab de Partes Interesadas
 *
 * Gestión completa de partes interesadas según ISO 9001:2015 (4.2)
 * - Subtabs: Listado de Partes | Matriz Influencia/Interés | Requisitos | Comunicaciones
 * - Identificación de partes internas y externas
 * - Análisis de influencia e interés (matriz 3x3)
 * - Requisitos y expectativas por parte interesada
 * - Plan de comunicación con stakeholders
 *
 * Conecta con backend/apps/motor_cumplimiento/partes_interesadas/
 */
import { useState } from 'react';
import { Users, Plus, Download, Grid3x3, FileText, MessageSquare } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PartesTable } from './PartesTable';
import { ParteFormModal } from './ParteFormModal';
import { MatrizInfluenciaInteres } from './MatrizInfluenciaInteres';
import { usePartesInteresadas } from '../../hooks/usePartesInteresadas';
import type { ParteInteresada, ParteInteresadaFilters } from '../../types';

interface PartesInteresadasTabProps {
  /** Código de la subsección activa (desde API/DynamicSections) */
  activeSection?: string;
}

// =============================================================================
// CONFIGURACIÓN DE SUBTABS
// =============================================================================

const SUBTABS = [
  { id: 'listado', label: 'Partes Interesadas', icon: <Users className="h-4 w-4" /> },
  { id: 'matriz', label: 'Matriz Influencia/Interés', icon: <Grid3x3 className="h-4 w-4" /> },
  { id: 'requisitos', label: 'Requisitos', icon: <FileText className="h-4 w-4" /> },
  { id: 'comunicaciones', label: 'Comunicaciones', icon: <MessageSquare className="h-4 w-4" /> },
];

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const PartesInteresadasTab = ({
  activeSection: _activeSection,
}: PartesInteresadasTabProps) => {
  const [activeSubtab, setActiveSubtab] = useState('listado');
  const [filters, setFilters] = useState<ParteInteresadaFilters>({
    page: 1,
    page_size: 10,
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedParte, setSelectedParte] = useState<ParteInteresada | null>(null);
  const [parteToDelete, setParteToDelete] = useState<ParteInteresada | null>(null);

  // Hooks
  const partesQuery = usePartesInteresadas(filters);
  const { data: partesData, isLoading, error } = partesQuery;

  const partes = partesData?.results || [];
  const totalCount = partesData?.count || 0;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreate = () => {
    setSelectedParte(null);
    setShowFormModal(true);
  };

  const handleEdit = (parte: ParteInteresada) => {
    setSelectedParte(parte);
    setShowFormModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!parteToDelete) return;

    try {
      // TODO: Implementar deleteMutation cuando se agregue al hook
      setParteToDelete(null);
    } catch {
      // Error al eliminar parte interesada
    }
  };

  const handleExport = async () => {
    try {
      // TODO: Implementar exportMutation
    } catch {
      // Error al exportar
    }
  };

  const _handleFiltersChange = (newFilters: ParteInteresadaFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset a página 1 al cambiar filtros
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page_size: pageSize, page: 1 });
  };

  // =============================================================================
  // RENDER: LISTADO SECTION
  // =============================================================================

  const renderListadoSection = () => {
    const internas = partes.filter((p) => p.tipo_nombre.toLowerCase().includes('intern'));
    const externas = partes.filter((p) => !p.tipo_nombre.toLowerCase().includes('intern'));

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Partes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Internas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {internas.length}
                </p>
              </div>
              <Badge variant="info">Internas</Badge>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Externas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {externas.length}
                </p>
              </div>
              <Badge variant="success">Externas</Badge>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alta Influencia</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {partes.filter((p) => p.nivel_influencia === 'alta').length}
                </p>
              </div>
              <Badge variant="danger">Alta</Badge>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Partes Interesadas
              </h3>
              <Badge variant="gray">{totalCount} registros</Badge>
            </div>

            <div className="flex gap-2">
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
                Nueva Parte
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        {error ? (
          <Card>
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Error al cargar partes interesadas"
              description="No se pudieron cargar las partes interesadas. Por favor, intenta de nuevo."
            />
          </Card>
        ) : (
          <PartesTable
            data={partes}
            totalCount={totalCount}
            page={filters.page || 1}
            pageSize={filters.page_size || 10}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={(parte) => setParteToDelete(parte)}
            isLoading={isLoading}
          />
        )}
      </div>
    );
  };

  // =============================================================================
  // RENDER: MATRIZ SECTION
  // =============================================================================

  const renderMatrizSection = () => {
    return (
      <div className="space-y-6">
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Matriz de Influencia e Interés
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análisis visual de partes interesadas según su nivel de influencia e interés en la
                organización
              </p>
            </div>
          </div>
        </Card>

        <MatrizInfluenciaInteres />
      </div>
    );
  };

  // =============================================================================
  // RENDER: REQUISITOS SECTION (Próximamente)
  // =============================================================================

  const renderRequisitosSection = () => {
    return (
      <Card>
        <div className="p-8">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Requisitos y Expectativas"
            description="Gestión de necesidades, expectativas y requisitos de las partes interesadas."
            action={{
              label: 'Próximamente',
              onClick: () => {},
              icon: <Plus className="h-4 w-4" />,
            }}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Características disponibles en la próxima versión:
            </p>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Registro de requisitos legales y contractuales</li>
              <li>• Necesidades y expectativas documentadas</li>
              <li>• Vinculación con procesos de la organización</li>
              <li>• Indicadores de seguimiento del cumplimiento</li>
            </ul>
          </div>
        </div>
      </Card>
    );
  };

  // =============================================================================
  // RENDER: COMUNICACIONES SECTION (Próximamente)
  // =============================================================================

  const renderComunicacionesSection = () => {
    return (
      <Card>
        <div className="p-8">
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title="Matriz de Comunicaciones"
            description="Plan de comunicación con las partes interesadas: qué, cuándo, cómo y quién comunica."
            action={{
              label: 'Próximamente',
              onClick: () => {},
              icon: <Plus className="h-4 w-4" />,
            }}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Características disponibles en la próxima versión:
            </p>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Definición de qué se comunica a cada parte</li>
              <li>• Frecuencia de comunicación (diaria, semanal, mensual, etc.)</li>
              <li>• Medios de comunicación (email, reunión, informe, etc.)</li>
              <li>• Responsables de la comunicación</li>
              <li>• Registros y evidencias de comunicación</li>
            </ul>
          </div>
        </div>
      </Card>
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
        {activeSubtab === 'listado' && renderListadoSection()}
        {activeSubtab === 'matriz' && renderMatrizSection()}
        {activeSubtab === 'requisitos' && renderRequisitosSection()}
        {activeSubtab === 'comunicaciones' && renderComunicacionesSection()}
      </div>

      {/* Modales */}
      <ParteFormModal
        parte={selectedParte}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedParte(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!parteToDelete}
        onClose={() => setParteToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Parte Interesada"
        message={`¿Estás seguro de eliminar la parte interesada "${parteToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </>
  );
};
