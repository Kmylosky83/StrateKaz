/**
 * VacantesTab - CRUD de Vacantes Activas
 * Seleccion y Contratacion > Vacantes
 *
 * Vista enterprise con:
 * - StatsGrid (4 metricas del proceso de seleccion)
 * - SectionHeader con filtros inline (busqueda, estado, prioridad)
 * - Tabla de vacantes con acciones
 * - Modal de creacion/edicion (VacanteFormModal)
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
import { Spinner } from '@/components/common/Spinner';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
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
} from 'lucide-react';
import {
  useVacantesActivas,
  useProcesoSeleccionEstadisticas,
  useCerrarVacanteActiva,
} from '../../hooks/useSeleccionContratacion';
import type {
  VacanteActiva,
  VacanteActivaFilters,
  EstadoVacante,
  PrioridadVacante,
} from '../../types';
import {
  ESTADO_VACANTE_OPTIONS,
  PRIORIDAD_OPTIONS,
  ESTADO_VACANTE_BADGE,
  PRIORIDAD_BADGE,
} from '../../types';
import { VacanteFormModal } from './VacanteFormModal';

// ============================================================================
// Componente
// ============================================================================

export const VacantesTab = () => {
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
        label: 'Tiempo Prom. (dias)',
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

  const vacantes = vacantesData?.results || [];

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
              placeholder="Buscar por titulo, cargo..."
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
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus size={16} className="mr-1" />
              Nueva Vacante
            </Button>
          </div>
        }
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando vacantes...</p>
          </div>
        ) : vacantes.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Briefcase className="h-12 w-12 text-gray-300" />}
              title="Sin vacantes"
              description={
                searchTerm || Object.values(filters).some(Boolean)
                  ? 'No se encontraron vacantes con los filtros aplicados.'
                  : 'Crea la primera vacante para iniciar el proceso de seleccion.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Vacante
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Cargo / Area
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Posiciones
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Candidatos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Dias
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {vacantes.map((vacante) => (
                  <tr
                    key={vacante.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {/* Vacante (codigo + titulo) */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {vacante.titulo}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400 font-mono">
                            {vacante.codigo_vacante}
                          </span>
                          {vacante.publicada_externamente && (
                            <Globe size={12} className="text-green-500" title="Publicada" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cargo / Area */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                        {vacante.cargo_requerido}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">
                        {vacante.area || '-'}
                      </p>
                    </td>

                    {/* Posiciones */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {vacante.numero_posiciones}
                      </span>
                    </td>

                    {/* Candidatos */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {vacante.total_candidatos}
                        </span>
                        {vacante.candidatos_activos > 0 && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ({vacante.candidatos_activos})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Prioridad */}
                    <td className="px-4 py-3">
                      <Badge variant={PRIORIDAD_BADGE[vacante.prioridad]} size="sm">
                        {vacante.prioridad_display}
                      </Badge>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_VACANTE_BADGE[vacante.estado]} size="sm">
                        {vacante.estado_display}
                      </Badge>
                    </td>

                    {/* Dias abierta */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-medium ${
                          vacante.dias_abierta > 30
                            ? 'text-danger-600 dark:text-danger-400'
                            : vacante.dias_abierta > 15
                              ? 'text-warning-600 dark:text-warning-400'
                              : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {vacante.dias_abierta}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(vacante)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                          title="Ver / Editar"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(vacante)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-info-600 hover:bg-info-50 dark:hover:text-info-400 dark:hover:bg-info-900/20"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        {(vacante.estado === 'abierta' || vacante.estado === 'en_proceso') && (
                          <button
                            type="button"
                            onClick={() => handleCerrar(vacante)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                            title="Cerrar vacante"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        message={`¿Estas seguro de cerrar la vacante "${cerrarTarget?.titulo || ''}"? Los candidatos en proceso seran notificados.`}
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
