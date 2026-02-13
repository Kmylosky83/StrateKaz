/**
 * CandidatosTab - Pipeline de Candidatos
 * Seleccion y Contratacion > Candidatos
 *
 * Vista enterprise con:
 * - StatsGrid (4 metricas de candidatos)
 * - SectionHeader con filtros inline (busqueda, vacante, estado)
 * - Tabla de candidatos con acciones
 * - Modal de creacion/edicion
 * - Drawer lateral de detalle con timeline
 * - Cambiar estado (dialog)
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  ArrowRightLeft,
  Clock,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import {
  useCandidatos,
  useProcesoSeleccionEstadisticas,
  useVacantesActivasAbiertas,
} from '../../hooks/useSeleccionContratacion';
import type { Candidato, CandidatoFilters, EstadoCandidato } from '../../types';
import { ESTADO_CANDIDATO_OPTIONS, ESTADO_CANDIDATO_BADGE } from '../../types';
import { CandidatoFormModal } from './CandidatoFormModal';
import { CandidatoDetailDrawer } from './CandidatoDetailDrawer';
import { CambiarEstadoDialog } from './CambiarEstadoDialog';

// ============================================================================
// Componente
// ============================================================================

export const CandidatosTab = () => {
  // State
  const [filters, setFilters] = useState<CandidatoFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailCandidato, setDetailCandidato] = useState<Candidato | null>(null);
  const [isEstadoOpen, setIsEstadoOpen] = useState(false);
  const [estadoTarget, setEstadoTarget] = useState<Candidato | null>(null);

  // Module color
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  // Queries
  const { data: candidatosData, isLoading } = useCandidatos({
    ...filters,
    search: searchTerm || undefined,
  });
  const { data: statsData } = useProcesoSeleccionEstadisticas();
  const { data: vacantesData } = useVacantesActivasAbiertas();

  // Stats
  const stats: StatItem[] = useMemo(
    () => [
      {
        label: 'Total Candidatos',
        value: statsData?.candidatos_total ?? candidatosData?.count ?? 0,
        icon: Users,
        iconColor: 'info' as const,
      },
      {
        label: 'En Proceso',
        value: statsData?.candidatos_en_proceso ?? 0,
        icon: Clock,
        iconColor: 'warning' as const,
      },
      {
        label: 'Aprobados',
        value: statsData?.candidatos_aprobados ?? 0,
        icon: UserCheck,
        iconColor: 'success' as const,
      },
      {
        label: 'Contratados',
        value: statsData?.candidatos_contratados ?? 0,
        icon: UserPlus,
        iconColor: 'primary' as const,
      },
    ],
    [statsData, candidatosData]
  );

  // Vacante options for filter
  const vacanteOptions = useMemo(() => {
    const options = [{ value: '', label: 'Todas las vacantes' }];
    if (vacantesData?.results) {
      vacantesData.results.forEach((v: { id: number; titulo: string; codigo_vacante: string }) => {
        options.push({ value: String(v.id), label: `${v.codigo_vacante} - ${v.titulo}` });
      });
    }
    return options;
  }, [vacantesData]);

  const estadoOptions = useMemo(
    () => [{ value: '', label: 'Todos los estados' }, ...ESTADO_CANDIDATO_OPTIONS],
    []
  );

  // Handlers
  const handleCreate = () => {
    setSelectedCandidato(null);
    setIsFormOpen(true);
  };

  const handleEdit = (candidato: Candidato) => {
    setSelectedCandidato(candidato);
    setIsFormOpen(true);
  };

  const handleViewDetail = (candidato: Candidato) => {
    setDetailCandidato(candidato);
    setIsDetailOpen(true);
  };

  const handleCambiarEstado = (candidato: Candidato) => {
    setEstadoTarget(candidato);
    setIsEstadoOpen(true);
  };

  const candidatos = candidatosData?.results || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsGrid stats={stats} columns={4} moduleColor={moduleColor} />

      {/* Header + Filters */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Users className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Pipeline de Candidatos"
        description="Gestiona los candidatos en el proceso de seleccion"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar por nombre, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-52"
            />
            <Select
              value={filters.vacante || ''}
              onChange={(e) => setFilters({ ...filters, vacante: e.target.value || undefined })}
              options={vacanteOptions}
              className="w-52"
            />
            <Select
              value={filters.estado || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  estado: (e.target.value as EstadoCandidato) || undefined,
                })
              }
              options={estadoOptions}
              className="w-40"
            />
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <UserPlus size={16} className="mr-1" />
              Nuevo
            </Button>
          </div>
        }
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando candidatos...</p>
          </div>
        ) : candidatos.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Users className="h-12 w-12 text-gray-300" />}
              title="Sin candidatos"
              description={
                searchTerm || Object.values(filters).some(Boolean)
                  ? 'No se encontraron candidatos con los filtros aplicados.'
                  : 'Registra el primer candidato para iniciar el proceso.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Candidato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Vacante
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Origen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Dias
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {candidatos.map((candidato) => (
                  <tr
                    key={candidato.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => handleViewDetail(candidato)}
                  >
                    {/* Candidato */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                          {candidato.nombre_completo}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-gray-400">{candidato.tipo_documento}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {candidato.numero_documento}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Vacante */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                        {candidato.vacante_titulo}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{candidato.vacante_codigo}</p>
                    </td>

                    {/* Contacto */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Mail size={11} className="shrink-0" />
                          <span className="truncate max-w-[140px]">{candidato.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Phone size={11} className="shrink-0" />
                          <span>{candidato.telefono}</span>
                        </div>
                        {candidato.ciudad && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={11} className="shrink-0" />
                            <span>{candidato.ciudad}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Origen */}
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {candidato.origen_display}
                      </Badge>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_CANDIDATO_BADGE[candidato.estado]} size="sm">
                        {candidato.estado_display}
                      </Badge>
                    </td>

                    {/* Dias en proceso */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-medium ${
                          candidato.dias_en_proceso > 30
                            ? 'text-danger-600 dark:text-danger-400'
                            : candidato.dias_en_proceso > 15
                              ? 'text-warning-600 dark:text-warning-400'
                              : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {candidato.dias_en_proceso}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3 text-center">
                      {candidato.calificacion_general !== null ? (
                        <span
                          className={`text-sm font-bold ${
                            candidato.calificacion_general >= 80
                              ? 'text-green-600 dark:text-green-400'
                              : candidato.calificacion_general >= 60
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {candidato.calificacion_general}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(candidato)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(candidato)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-info-600 hover:bg-info-50 dark:hover:text-info-400 dark:hover:bg-info-900/20"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        {candidato.estado !== 'contratado' && candidato.estado !== 'rechazado' && (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstado(candidato)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-warning-600 hover:bg-warning-50 dark:hover:text-warning-400 dark:hover:bg-warning-900/20"
                            title="Cambiar estado"
                          >
                            <ArrowRightLeft size={16} />
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
        {!isLoading && candidatos.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Mostrando {candidatos.length} de {candidatosData?.count || 0} candidatos
            </span>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <CandidatoFormModal
        candidato={selectedCandidato}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCandidato(null);
        }}
      />

      {/* Detail Drawer */}
      <CandidatoDetailDrawer
        candidato={detailCandidato}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailCandidato(null);
        }}
        onEdit={(c) => {
          setIsDetailOpen(false);
          setDetailCandidato(null);
          handleEdit(c);
        }}
        onCambiarEstado={(c) => {
          handleCambiarEstado(c);
        }}
      />

      {/* Cambiar Estado Dialog */}
      <CambiarEstadoDialog
        candidato={estadoTarget}
        isOpen={isEstadoOpen}
        onClose={() => {
          setIsEstadoOpen(false);
          setEstadoTarget(null);
        }}
      />
    </div>
  );
};
