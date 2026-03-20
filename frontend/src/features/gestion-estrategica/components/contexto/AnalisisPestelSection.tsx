/**
 * Sección de Análisis PESTEL - Vista Híbrida
 *
 * Vista tabla CRUD + Matriz PESTEL con ViewToggle
 * - StatsGrid con métricas por dimensión
 * - SectionHeader con filtros, ViewToggle e import/export
 * - DataTableCard para vista tabla (CRUD directo)
 * - PESTELMatrix para visualización en cuadrantes
 * - Import/Export Excel (mismo patrón que Partes Interesadas)
 *
 * Los factores pueden venir de:
 * 1. Carga manual / Import Excel (este tab)
 * 2. Consolidación de encuestas PCI-POAM (tab Encuestas)
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Globe2,
  Search,
  Table,
  LayoutGrid,
  Upload,
  Download,
  FileDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Tooltip } from '@/components/common/Tooltip';
import { ViewToggle } from '@/components/common/ViewToggle';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import {
  useAnalisisPestel,
  useFactoresPestel,
  useDeleteFactorPestel,
} from '../../hooks/useContexto';
import { factoresPestelApi } from '../../api/contextoApi';
import type { AnalisisPESTEL, FactorPESTEL, FactorPESTELFilters } from '../../types/contexto.types';
import { PESTELMatrix } from './PESTELMatrix';
import { AnalisisPestelFormModal } from '../modals/AnalisisPestelFormModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

// =============================================================================
// TIPOS Y CONSTANTES
// =============================================================================

type ViewMode = 'tabla' | 'matriz';

const DIMENSION_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas las dimensiones' },
  { value: 'politico', label: 'Político' },
  { value: 'economico', label: 'Económico' },
  { value: 'social', label: 'Social' },
  { value: 'tecnologico', label: 'Tecnológico' },
  { value: 'ecologico', label: 'Ecológico' },
  { value: 'legal', label: 'Legal' },
];

const DIMENSION_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    badgeVariant:
      | 'primary'
      | 'secondary'
      | 'accent'
      | 'success'
      | 'warning'
      | 'danger'
      | 'info'
      | 'gray';
  }
> = {
  politico: { label: 'Político', color: 'text-red-600', badgeVariant: 'danger' },
  economico: { label: 'Económico', color: 'text-amber-600', badgeVariant: 'warning' },
  social: { label: 'Social', color: 'text-blue-600', badgeVariant: 'info' },
  tecnologico: { label: 'Tecnológico', color: 'text-purple-600', badgeVariant: 'accent' },
  ecologico: { label: 'Ecológico', color: 'text-green-600', badgeVariant: 'success' },
  legal: { label: 'Legal', color: 'text-gray-600', badgeVariant: 'gray' },
};

const TENDENCIA_ICONS: Record<string, React.ElementType> = {
  mejorando: TrendingUp,
  estable: Minus,
  empeorando: TrendingDown,
};

const IMPACTO_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' }> =
  {
    alto: { label: 'Alto', variant: 'danger' },
    medio: { label: 'Medio', variant: 'warning' },
    bajo: { label: 'Bajo', variant: 'success' },
  };

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface AnalisisPestelSectionProps {
  triggerNewForm?: number;
}

export const AnalisisPestelSection = ({ triggerNewForm }: AnalisisPestelSectionProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('tabla');
  const [filters, setFilters] = useState<FactorPESTELFilters>({});
  const [selectedAnalisis, setSelectedAnalisis] = useState<AnalisisPESTEL | null>(null);
  const [selectedFactor, setSelectedFactor] = useState<FactorPESTEL | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<FactorPESTEL | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.ANALISIS_CONTEXTO, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.ANALISIS_CONTEXTO, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.ANALISIS_CONTEXTO, 'delete');

  // Color del módulo
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Queries
  const { data: analisisData } = useAnalisisPestel({}, 1, 50);
  const {
    data: factoresData,
    isLoading,
    error,
  } = useFactoresPestel({ ...filters, analisis: selectedAnalisis?.id }, 1, 100);
  const deleteMutation = useDeleteFactorPestel();

  // Auto-seleccionar primer análisis
  useEffect(() => {
    if (analisisData?.results?.length && !selectedAnalisis) {
      const vigente = analisisData.results.find((a) => a.estado === 'vigente');
      setSelectedAnalisis(vigente || analisisData.results[0]);
    }
  }, [analisisData?.results, selectedAnalisis]);

  // Opciones de análisis
  const analisisOptions = useMemo(() => {
    if (!analisisData?.results) return [];
    return [
      { value: '', label: 'Seleccionar análisis...' },
      ...analisisData.results.map((a) => ({
        value: a.id.toString(),
        label: `${a.nombre} (${a.periodo})`,
      })),
    ];
  }, [analisisData?.results]);

  // Estadísticas
  const stats: StatItem[] = useMemo(() => {
    const factores = factoresData?.results || [];
    const porDimension: Record<string, number> = {};
    const porImpacto = { alto: 0, medio: 0, bajo: 0 };

    factores.forEach((f) => {
      porDimension[f.tipo] = (porDimension[f.tipo] || 0) + 1;
      if (f.impacto in porImpacto) porImpacto[f.impacto as keyof typeof porImpacto]++;
    });

    const dimensionesCubiertas = Object.keys(porDimension).length;

    return [
      {
        label: 'Total Factores',
        value: factores.length,
        icon: Globe2,
        iconColor: 'info',
      },
      {
        label: 'Dimensiones Cubiertas',
        value: `${dimensionesCubiertas}/6`,
        icon: Filter,
        iconColor: dimensionesCubiertas === 6 ? 'success' : 'warning',
        description:
          dimensionesCubiertas < 6 ? `${6 - dimensionesCubiertas} pendientes` : 'Completo',
      },
      {
        label: 'Impacto Alto',
        value: porImpacto.alto,
        icon: TrendingUp,
        iconColor: 'danger',
        description: 'Factores críticos',
      },
      {
        label: 'Empeorando',
        value: factores.filter((f) => f.tendencia === 'empeorando').length,
        icon: TrendingDown,
        iconColor: 'warning',
        description: 'Requieren atención',
      },
    ];
  }, [factoresData]);

  // Handlers
  const handleAnalisisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    const analisis = analisisData?.results?.find((a) => a.id === id);
    setSelectedAnalisis(analisis || null);
  };

  const handleCreate = () => {
    setSelectedFactor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (factor: FactorPESTEL) => {
    setSelectedFactor(factor);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (factor: FactorPESTEL) => {
    setDeleteConfirm(factor);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
      setAlertMessage({ type: 'success', message: 'Factor eliminado correctamente' });
    }
  };

  const handleExport = async () => {
    try {
      const blobUrl = await factoresPestelApi.exportExcel(
        selectedAnalisis ? { analisis: selectedAnalisis.id } : undefined
      );
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'Factores_PESTEL.xlsx';
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success('Excel exportado');
    } catch {
      toast.error('Error al exportar');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blobUrl = await factoresPestelApi.downloadTemplate();
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'Plantilla_Factores_PESTEL.xlsx';
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success('Plantilla descargada');
    } catch {
      toast.error('Error al descargar plantilla');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAnalisis) return;

    try {
      const result = await factoresPestelApi.importExcel(file, selectedAnalisis.id);
      setAlertMessage({
        type: result.errors?.length ? 'warning' : 'success',
        message:
          result.message + (result.errors?.length ? ` (${result.errors.length} errores)` : ''),
      });
    } catch {
      setAlertMessage({ type: 'error', message: 'Error al importar archivo' });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger externo
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      handleCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNewForm]);

  // Render badge de dimensión
  const renderDimensionBadge = (tipo: string) => {
    const config = DIMENSION_CONFIG[tipo];
    if (!config)
      return (
        <Badge variant="gray" size="sm">
          {tipo}
        </Badge>
      );
    return (
      <Badge variant={config.badgeVariant} size="sm">
        {config.label}
      </Badge>
    );
  };

  // Render tendencia
  const renderTendencia = (tendencia: string) => {
    const Icon = TENDENCIA_ICONS[tendencia] || Minus;
    const colorMap: Record<string, string> = {
      mejorando: 'text-green-600',
      estable: 'text-gray-500',
      empeorando: 'text-red-600',
    };
    const labelMap: Record<string, string> = {
      mejorando: 'Mejorando',
      estable: 'Estable',
      empeorando: 'Empeorando',
    };
    return (
      <div className="flex items-center gap-1">
        <Icon className={`h-4 w-4 ${colorMap[tendencia] || 'text-gray-500'}`} />
        <span className="text-xs">{labelMap[tendencia] || tendencia}</span>
      </div>
    );
  };

  if (error) {
    return <Alert variant="error" title="Error" message="Error al cargar los factores PESTEL." />;
  }

  const factores = factoresData?.results || [];
  const isEmpty = !isLoading && factores.length === 0;

  return (
    <div className="space-y-6">
      {/* Alerta de feedback */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.message}
          closable
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Estadísticas */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={stats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Section Header */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Globe2 className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="PESTEL"
        description="Factores Políticos, Económicos, Sociales, Tecnológicos, Ecológicos y Legales"
        variant="compact"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de análisis */}
            <Select
              value={selectedAnalisis?.id?.toString() || ''}
              onChange={handleAnalisisChange}
              options={analisisOptions}
              className="w-52"
            />

            {viewMode === 'tabla' && (
              <>
                <Input
                  placeholder="Buscar..."
                  value={(filters as Record<string, string>).search || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value } as FactorPESTELFilters)
                  }
                  leftIcon={<Search className="h-4 w-4" />}
                  className="w-40"
                />
                <Select
                  value={filters.tipo || ''}
                  onChange={(e) => setFilters({ ...filters, tipo: e.target.value || undefined })}
                  options={DIMENSION_OPTIONS}
                  className="w-44"
                />
              </>
            )}

            {/* ViewToggle */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'tabla', label: 'Tabla', icon: Table },
                { value: 'matriz', label: 'Matriz', icon: LayoutGrid },
              ]}
              moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
            />

            {/* Import/Export */}
            {canCreate && (
              <>
                <Tooltip content="Descargar plantilla">
                  <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Importar Excel">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedAnalisis}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </>
            )}
            <Tooltip content="Exportar Excel">
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </Tooltip>

            {canCreate && (
              <Button
                onClick={handleCreate}
                variant="primary"
                size="sm"
                disabled={!selectedAnalisis}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Factor
              </Button>
            )}
          </div>
        }
      />

      {/* Info si no hay análisis */}
      {!selectedAnalisis && (
        <Alert
          variant="info"
          title="Seleccione un análisis"
          message="Cree o seleccione un análisis PESTEL para gestionar sus factores. Puede crear un análisis desde el botón 'Nuevo Factor'."
        />
      )}

      {/* Contenido según vista */}
      {viewMode === 'matriz' && selectedAnalisis ? (
        <PESTELMatrix analisisId={selectedAnalisis.id} readOnly={!canEdit} />
      ) : (
        <>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : isEmpty ? (
            <EmptyState
              icon={<Globe2 className="h-12 w-12" />}
              title="Sin factores PESTEL"
              description={
                selectedAnalisis
                  ? 'Agregue factores manualmente, importe desde Excel, o genérelos desde una encuesta PCI-POAM.'
                  : 'Cree un análisis PESTEL primero para empezar a registrar factores del entorno.'
              }
              action={
                canCreate
                  ? {
                      label: 'Agregar Factor',
                      onClick: handleCreate,
                      icon: <Plus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />
          ) : (
            <DataTableCard
              columns={[
                {
                  key: 'tipo',
                  header: 'Dimensión',
                  render: (factor: FactorPESTEL) => renderDimensionBadge(factor.tipo),
                },
                {
                  key: 'descripcion',
                  header: 'Factor',
                  render: (factor: FactorPESTEL) => (
                    <div className="max-w-md">
                      <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                        {factor.descripcion}
                      </div>
                      {factor.implicaciones && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {factor.implicaciones}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'tendencia',
                  header: 'Tendencia',
                  render: (factor: FactorPESTEL) => renderTendencia(factor.tendencia),
                },
                {
                  key: 'impacto',
                  header: 'Impacto',
                  render: (factor: FactorPESTEL) => {
                    const config = IMPACTO_CONFIG[factor.impacto];
                    return config ? (
                      <Badge variant={config.variant} size="sm">
                        {config.label}
                      </Badge>
                    ) : (
                      <span>{factor.impacto}</span>
                    );
                  },
                },
                {
                  key: 'probabilidad',
                  header: 'Probabilidad',
                  render: (factor: FactorPESTEL) => {
                    const config = IMPACTO_CONFIG[factor.probabilidad];
                    return config ? (
                      <Badge variant={config.variant} size="sm">
                        {config.label}
                      </Badge>
                    ) : (
                      <span>{factor.probabilidad}</span>
                    );
                  },
                },
                {
                  key: 'acciones',
                  header: 'Acciones',
                  align: 'right',
                  render: (factor: FactorPESTEL) => (
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Tooltip content="Editar">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(factor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip content="Eliminar">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRequest(factor)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  ),
                },
              ]}
              data={factores}
            />
          )}
        </>
      )}

      {/* Diálogo eliminar */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Factor PESTEL"
        message={`¿Está seguro de eliminar el factor "${deleteConfirm?.descripcion?.slice(0, 60)}..."?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Modal de formulario — reutiliza el existente para factores */}
      {isModalOpen && (
        <AnalisisPestelFormModal
          analisis={null}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFactor(null);
          }}
        />
      )}
    </div>
  );
};

export default AnalisisPestelSection;
