/**
 * CandidatosTab - Pipeline de Candidatos
 * Selección y Contratación > Candidatos
 *
 * Sprint 20: ResponsiveTable + botón Contratar + HireFromCandidateModal
 *
 * Vista enterprise con:
 * - StatsGrid (4 métricas de candidatos)
 * - SectionHeader con filtros inline (búsqueda, vacante, estado)
 * - ResponsiveTable con card view móvil
 * - Modal de creación/edición
 * - Drawer lateral de detalle con timeline
 * - Cambiar estado (dialog)
 * - Contratar candidato aprobado (HireFromCandidateModal)
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import {
  Users,
  UserPlus,
  UserCheck,
  Eye,
  Pencil,
  ArrowRightLeft,
  Clock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { ProtectedAction } from '@/components/common';
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
import { HireFromCandidateModal } from './HireFromCandidateModal';

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
  const [isHireOpen, setIsHireOpen] = useState(false);
  const [hireTarget, setHireTarget] = useState<Candidato | null>(null);

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

  const handleContratar = (candidato: Candidato) => {
    setHireTarget(candidato);
    setIsHireOpen(true);
  };

  const candidatos = candidatosData?.results || [];

  // ============================================================================
  // ResponsiveTable columns
  // ============================================================================

  const columns: ResponsiveTableColumn<Candidato & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'candidato',
        header: 'Candidato',
        priority: 1 as const,
        render: (c) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
              {c.nombre_completo}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-gray-400">{c.tipo_documento}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{c.numero_documento}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'vacante',
        header: 'Vacante',
        priority: 2 as const,
        render: (c) => (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
              {c.vacante_titulo}
            </p>
            <p className="text-xs text-gray-400 font-mono">{c.vacante_codigo}</p>
          </div>
        ),
      },
      {
        key: 'contacto',
        header: 'Contacto',
        hideOnTablet: true,
        render: (c) => (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Mail size={11} className="shrink-0" />
              <span className="truncate max-w-[140px]">{c.email}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Phone size={11} className="shrink-0" />
              <span>{c.telefono}</span>
            </div>
            {c.ciudad && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} className="shrink-0" />
                <span>{String(c.ciudad)}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'origen',
        header: 'Origen',
        hideOnTablet: true,
        render: (c) => (
          <Badge variant="gray" size="sm">
            {String(c.origen_display)}
          </Badge>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        priority: 2 as const,
        render: (c) => (
          <Badge variant={ESTADO_CANDIDATO_BADGE[c.estado as EstadoCandidato]} size="sm">
            {String(c.estado_display)}
          </Badge>
        ),
      },
      {
        key: 'dias',
        header: 'Días',
        align: 'center' as const,
        render: (c) => (
          <span
            className={`text-sm font-medium ${
              Number(c.dias_en_proceso) > 30
                ? 'text-danger-600 dark:text-danger-400'
                : Number(c.dias_en_proceso) > 15
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {String(c.dias_en_proceso)}
          </span>
        ),
      },
      {
        key: 'score',
        header: 'Score',
        align: 'center' as const,
        hideOnTablet: true,
        render: (c) =>
          c.calificacion_general !== null && c.calificacion_general !== undefined ? (
            <span
              className={`text-sm font-bold ${
                Number(c.calificacion_general) >= 80
                  ? 'text-green-600 dark:text-green-400'
                  : Number(c.calificacion_general) >= 60
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {c.calificacion_general}%
            </span>
          ) : (
            <span className="text-xs text-gray-400">-</span>
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
            <Users className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Pipeline de Candidatos"
        description="Gestiona los candidatos en el proceso de selección"
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
            <ProtectedAction permission="talent_hub.candidatos.create">
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <UserPlus size={16} className="mr-1" />
                Nuevo
              </Button>
            </ProtectedAction>
          </div>
        }
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        {candidatos.length === 0 && !isLoading ? (
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
          <ResponsiveTable<Candidato & Record<string, unknown>>
            data={candidatos as (Candidato & Record<string, unknown>)[]}
            columns={columns}
            keyExtractor={(c) => String(c.id)}
            isLoading={isLoading}
            emptyMessage="Sin candidatos"
            hoverable
            onRowClick={(c) => handleViewDetail(c as unknown as Candidato)}
            mobileCardTitle={(c) => String(c.nombre_completo)}
            mobileCardSubtitle={(c) => (
              <span className="text-xs text-gray-500">
                {String(c.vacante_titulo)} • {String(c.estado_display)}
              </span>
            )}
            mobileCardAvatar={(c) => (
              <Badge variant={ESTADO_CANDIDATO_BADGE[c.estado as EstadoCandidato]} size="sm">
                {String(c.estado_display)}
              </Badge>
            )}
            renderActions={(c) => (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(c as unknown as Candidato);
                  }}
                  title="Ver detalle"
                >
                  <Eye size={16} />
                </Button>
                <ProtectedAction permission="talent_hub.candidatos.edit">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(c as unknown as Candidato);
                    }}
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </Button>
                </ProtectedAction>
                {c.estado === 'aprobado' && (
                  <ProtectedAction permission="talent_hub.candidatos.edit">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContratar(c as unknown as Candidato);
                      }}
                      title="Contratar"
                      className="text-green-500 hover:text-green-700"
                    >
                      <Briefcase size={16} />
                    </Button>
                  </ProtectedAction>
                )}
                {c.estado !== 'contratado' && c.estado !== 'rechazado' && (
                  <ProtectedAction permission="talent_hub.candidatos.edit">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCambiarEstado(c as unknown as Candidato);
                      }}
                      title="Cambiar estado"
                    >
                      <ArrowRightLeft size={16} />
                    </Button>
                  </ProtectedAction>
                )}
              </>
            )}
          />
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

      {/* Hire Modal — Sprint 20 */}
      <HireFromCandidateModal
        candidato={hireTarget}
        isOpen={isHireOpen}
        onClose={() => {
          setIsHireOpen(false);
          setHireTarget(null);
        }}
      />
    </div>
  );
};
