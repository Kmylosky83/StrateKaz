/**
 * VacantesTab - CRUD de Vacantes Activas
 * Selección y Contratación > Vacantes
 *
 * Sprint 20: Migrado a ResponsiveTable (card view < 768px)
 *
 * Vista enterprise con:
 * - StatsGrid (4 métricas del proceso de selección)
 * - SectionHeader con filtros inline (búsqueda, estado, prioridad)
 * - ResponsiveTable con card view móvil
 * - Modal de creación/edición (VacanteFormModal)
 * - Cerrar vacante (ConfirmDialog)
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import {
  Briefcase,
  Plus,
  Eye,
  Pencil,
  XCircle,
  Users,
  Clock,
  TrendingUp,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useVacantesActivas,
  useProcesoSeleccionEstadisticas,
  useCerrarVacanteActiva,
  usePublicarVacanteActiva,
} from '@/features/talent-hub/hooks/useSeleccionContratacion';
import type {
  VacanteActiva,
  VacanteActivaFilters,
  EstadoVacante,
  PrioridadVacante,
} from '@/features/talent-hub/types';
import {
  ESTADO_VACANTE_OPTIONS,
  PRIORIDAD_OPTIONS,
  ESTADO_VACANTE_BADGE,
  PRIORIDAD_BADGE,
} from '@/features/talent-hub/types';
import { VacanteFormModal } from './VacanteFormModal';

// ============================================================================
// Componente
// ============================================================================

export const VacantesTab = () => {
  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.VACANTES, 'create');
  const canEdit = canDo(Modules.TALENT_HUB, Sections.VACANTES, 'edit');
  const canDelete = canDo(Modules.TALENT_HUB, Sections.VACANTES, 'delete');

  // State
  const [filters, setFilters] = useState<VacanteActivaFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVacante, setSelectedVacante] = useState<VacanteActiva | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCerrarOpen, setIsCerrarOpen] = useState(false);
  const [cerrarTarget, setCerrarTarget] = useState<VacanteActiva | null>(null);

  // Module color
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  // Queries
  const { data: vacantesData, isLoading } = useVacantesActivas({
    ...filters,
    search: searchTerm || undefined,
  });
  const { data: statsData } = useProcesoSeleccionEstadisticas();
  const cerrarMutation = useCerrarVacanteActiva();
  const publicarMutation = usePublicarVacanteActiva();

  // Stats
  const stats: StatItem[] = useMemo(
    () => [
      {
        label: 'Vacantes Abiertas',
        value: statsData?.vacantes_abiertas ?? vacantesData?.count ?? 0,
        icon: Briefcase,
        iconColor: 'info' as const,
      },
      {
        label: 'Candidatos en Proceso',
        value: statsData?.candidatos_en_proceso ?? 0,
        icon: Users,
        iconColor: 'primary' as const,
      },
      {
        label: 'Contratados',
        value: statsData?.candidatos_contratados ?? 0,
        icon: TrendingUp,
        iconColor: 'success' as const,
      },
      {
        label: 'Tiempo Prom. (días)',
        value: statsData?.tiempo_promedio_contratacion
          ? Math.round(statsData.tiempo_promedio_contratacion)
          : '-',
        icon: Clock,
        iconColor: 'warning' as const,
      },
    ],
    [statsData, vacantesData]
  );

  // Filter options
  const estadoOptions = useMemo(
    () => [{ value: '', label: 'Todos los estados' }, ...ESTADO_VACANTE_OPTIONS],
    []
  );

  const prioridadOptions = useMemo(
    () => [{ value: '', label: 'Todas las prioridades' }, ...PRIORIDAD_OPTIONS],
    []
  );

  // Handlers
  const handleCreate = () => {
    setSelectedVacante(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vacante: VacanteActiva) => {
    setSelectedVacante(vacante);
    setIsFormOpen(true);
  };

  const handleCerrar = (vacante: VacanteActiva) => {
    setCerrarTarget(vacante);
    setIsCerrarOpen(true);
  };

  const confirmCerrar = async () => {
    if (!cerrarTarget) return;
    await cerrarMutation.mutateAsync({ id: cerrarTarget.id });
    setIsCerrarOpen(false);
    setCerrarTarget(null);
  };

  const handlePublicar = (vacante: VacanteActiva) => {
    publicarMutation.mutate({ id: vacante.id });
  };

  // URL del portal público de vacantes (mismo subdominio, ruta /vacantes)
  const portalPublicoUrl = `${window.location.origin}/vacantes`;

  const vacantes = vacantesData?.results || [];

  // ============================================================================
  // ResponsiveTable columns
  // ============================================================================

  const columns: ResponsiveTableColumn<VacanteActiva & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'vacante',
        header: 'Vacante',
        priority: 1 as const,
        render: (v) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
              {v.titulo}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400 font-mono">{v.codigo_vacante}</span>
              {v.publicada_externamente && (
                <Globe size={12} className="text-green-500" title="Publicada" />
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'cargo',
        header: 'Cargo / Área',
        priority: 2 as const,
        render: (v) => (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
              {v.cargo_requerido}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-[160px]">{String(v.area || '-')}</p>
          </div>
        ),
      },
      {
        key: 'posiciones',
        header: 'Posiciones',
        align: 'center' as const,
        render: (v) => (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {String(v.numero_posiciones)}
          </span>
        ),
      },
      {
        key: 'candidatos',
        header: 'Candidatos',
        align: 'center' as const,
        render: (v) => (
          <div className="flex items-center justify-center gap-1">
            <Users size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {String(v.total_candidatos)}
            </span>
            {Number(v.candidatos_activos) > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400">
                ({v.candidatos_activos})
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'prioridad',
        header: 'Prioridad',
        hideOnTablet: true,
        render: (v) => (
          <Badge variant={PRIORIDAD_BADGE[v.prioridad as PrioridadVacante]} size="sm">
            {String(v.prioridad_display)}
          </Badge>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        priority: 2 as const,
        render: (v) => (
          <Badge variant={ESTADO_VACANTE_BADGE[v.estado as EstadoVacante]} size="sm">
            {String(v.estado_display)}
          </Badge>
        ),
      },
      {
        key: 'dias',
        header: 'Días',
        align: 'center' as const,
        hideOnTablet: true,
        render: (v) => (
          <span
            className={`text-sm font-medium ${
              Number(v.dias_abierta) > 30
                ? 'text-danger-600 dark:text-danger-400'
                : Number(v.dias_abierta) > 15
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {String(v.dias_abierta)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsGrid stats={stats} columns={4} moduleColor={moduleColor} />

      {/* Header + Filters */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Briefcase className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Vacantes Activas"
        description="Gestiona las vacantes abiertas y el proceso de reclutamiento"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar por título, cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56"
            />
            <Select
              value={filters.estado || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  estado: (e.target.value as EstadoVacante) || undefined,
                })
              }
              options={estadoOptions}
              className="w-40"
            />
            <Select
              value={filters.prioridad || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  prioridad: (e.target.value as PrioridadVacante) || undefined,
                })
              }
              options={prioridadOptions}
              className="w-44"
            />
            <a
              href={portalPublicoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Ver portal público de vacantes"
            >
              <ExternalLink size={14} />
              Portal público
            </a>
            {canCreate && (
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <Plus size={16} className="mr-1" />
                Nueva Vacante
              </Button>
            )}
          </div>
        }
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        {vacantes.length === 0 && !isLoading ? (
          <div className="py-16">
            <EmptyState
              icon={<Briefcase className="h-12 w-12 text-gray-300" />}
              title="Sin vacantes"
              description={
                searchTerm || Object.values(filters).some(Boolean)
                  ? 'No se encontraron vacantes con los filtros aplicados.'
                  : 'Crea la primera vacante para iniciar el proceso de selección.'
              }
            />
          </div>
        ) : (
          <ResponsiveTable<VacanteActiva & Record<string, unknown>>
            data={vacantes as (VacanteActiva & Record<string, unknown>)[]}
            columns={columns}
            keyExtractor={(v) => String(v.id)}
            isLoading={isLoading}
            emptyMessage="Sin vacantes"
            hoverable
            mobileCardTitle={(v) => String(v.titulo)}
            mobileCardSubtitle={(v) => (
              <span className="text-xs text-gray-500">
                {String(v.cargo_requerido)} • {String(v.estado_display)}
              </span>
            )}
            mobileCardAvatar={(v) => (
              <Badge variant={ESTADO_VACANTE_BADGE[v.estado as EstadoVacante]} size="sm">
                {String(v.estado_display)}
              </Badge>
            )}
            renderActions={(v) => (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(v as unknown as VacanteActiva)}
                  title="Ver / Editar"
                >
                  <Eye size={16} />
                </Button>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(v as unknown as VacanteActiva)}
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </Button>
                )}
                {canEdit && (v.estado === 'abierta' || v.estado === 'en_proceso') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePublicar(v as unknown as VacanteActiva)}
                    title={
                      v.publicada_externamente
                        ? 'Despublicar del portal público'
                        : 'Publicar en portal público'
                    }
                    disabled={publicarMutation.isPending}
                    className={
                      v.publicada_externamente
                        ? 'text-green-500 hover:text-green-700'
                        : 'text-gray-400 hover:text-green-600'
                    }
                  >
                    <Globe size={16} />
                  </Button>
                )}
                {canDelete && (v.estado === 'abierta' || v.estado === 'en_proceso') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCerrar(v as unknown as VacanteActiva)}
                    title="Cerrar vacante"
                    className="text-gray-400 hover:text-danger-600"
                  >
                    <XCircle size={16} />
                  </Button>
                )}
              </>
            )}
          />
        )}

        {/* Pagination info */}
        {!isLoading && vacantes.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Mostrando {vacantes.length} de {vacantesData?.count || 0} vacantes
            </span>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <VacanteFormModal
        vacante={selectedVacante}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedVacante(null);
        }}
      />

      {/* Cerrar Vacante Confirmation */}
      <ConfirmDialog
        isOpen={isCerrarOpen}
        title="Cerrar Vacante"
        message={`¿Estás seguro de cerrar la vacante "${cerrarTarget?.titulo || ''}"? Los candidatos en proceso serán notificados.`}
        confirmText="Cerrar Vacante"
        variant="danger"
        isLoading={cerrarMutation.isPending}
        onConfirm={confirmCerrar}
        onClose={() => {
          setIsCerrarOpen(false);
          setCerrarTarget(null);
        }}
      />
    </div>
  );
};
