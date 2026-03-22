/**
 * Consultores Externos Section - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Vista Tipo A: StatsGrid + SectionHeader + ResponsiveTable
 * Muestra consultores y contratistas externos vinculados a la organización.
 */
import { useState, useMemo } from 'react';
import { UserCog, Users, UserCheck, Building2, User, Power } from 'lucide-react';
import { Badge, Card, EmptyState, SectionHeader, ResponsiveTable } from '@/components/common';
import type { ResponsiveTableColumn } from '@/components/common';
import { StatsGrid } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import usePermissions from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useSelectCargos } from '@/hooks/useSelectLists';
import {
  useConsultoresExternos,
  useConsultoresExternosEstadisticas,
  useToggleConsultorActivo,
} from '../../hooks/useConsultoresExternos';
import type { ConsultorExternoList, ConsultorExternoFilters } from '../../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'CONSULTOR', label: 'Consultores' },
  { value: 'CONTRATISTA', label: 'Contratistas' },
];

const INDEPENDIENTE_OPTIONS = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'true', label: 'Independientes' },
  { value: 'false', label: 'De firma' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'activo', label: 'Activos' },
  { value: 'inactivo', label: 'Inactivos' },
];

const MODALIDAD_OPTIONS = [
  { value: '', label: 'Todos los accesos' },
  { value: 'colocado', label: 'Colocados (Dashboard)' },
  { value: 'portal', label: 'Portal únicamente' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const ConsultoresExternosSection = () => {
  // RBAC
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.TALENT_HUB, Sections.CONSULTORES_EXTERNOS, 'edit');

  // State
  const [filters, setFilters] = useState<ConsultorExternoFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Module styling
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  // Data
  const { data: consultores, isLoading } = useConsultoresExternos({
    ...filters,
    search: searchTerm || undefined,
  });
  const { data: stats } = useConsultoresExternosEstadisticas();
  const { data: cargosData } = useSelectCargos();
  const toggleMutation = useToggleConsultorActivo();

  // Cargo options for filter
  const _cargoOptions = useMemo(() => {
    const options = [{ value: '', label: 'Todos los cargos' }];
    if (cargosData) {
      cargosData.forEach((c) => options.push({ value: String(c.id), label: c.label }));
    }
    return options;
  }, [cargosData]);

  // Stats grid
  const statsItems: StatItem[] = useMemo(
    () => [
      {
        label: 'Total Consultores',
        value: stats?.total ?? 0,
        icon: Users,
        iconColor: 'info' as const,
      },
      {
        label: 'Activos',
        value: stats?.activos ?? 0,
        icon: UserCheck,
        iconColor: 'success' as const,
      },
      {
        label: 'Independientes',
        value: stats?.independientes ?? 0,
        icon: User,
        iconColor: 'warning' as const,
      },
      {
        label: 'De Firma',
        value: stats?.de_firma ?? 0,
        icon: Building2,
        iconColor: 'primary' as const,
      },
    ],
    [stats]
  );

  // Table columns
  const columns: ResponsiveTableColumn<ConsultorExternoList & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'consultor',
        header: 'Consultor',
        priority: 1 as const,
        render: (c) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {c.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</p>
          </div>
        ),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        priority: 2 as const,
        render: (c) => (
          <Badge variant={c.tipo_consultor === 'CONSULTOR' ? 'blue' : 'purple'} size="sm">
            {c.tipo_consultor_nombre}
          </Badge>
        ),
      },
      {
        key: 'modalidad',
        header: 'Modalidad',
        render: (c) => (
          <Badge variant={c.es_independiente ? 'amber' : 'gray'} size="sm">
            {c.es_independiente ? 'Independiente' : 'Firma'}
          </Badge>
        ),
      },
      {
        key: 'firma',
        header: 'Firma / Origen',
        hideOnTablet: true,
        render: (c) => (
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px] block">
            {c.es_independiente ? '—' : c.firma_nombre}
          </span>
        ),
      },
      {
        key: 'cargo',
        header: 'Cargo',
        hideOnTablet: true,
        render: (c) => (
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[160px] block">
            {c.es_portal_only ? 'Portal' : c.cargo_nombre || '—'}
          </span>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        priority: 2 as const,
        render: (c) => (
          <Badge variant={c.is_active ? 'green' : 'red'} size="sm">
            {c.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        key: 'ultimo_acceso',
        header: 'Último acceso',
        hideOnTablet: true,
        render: (c) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {c.last_login
              ? new Date(c.last_login).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Nunca'}
          </span>
        ),
      },
    ],
    []
  );

  const handleToggle = (consultor: ConsultorExternoList) => {
    toggleMutation.mutate(consultor.id);
  };

  const data = consultores ?? [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsGrid stats={statsItems} columns={4} moduleColor={moduleColor} />

      {/* Header + Filters */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <UserCog className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Consultores Externos"
        description="Consultores y contratistas externos vinculados a la organización"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Buscar por nombre, email, firma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <select
              value={filters.tipo ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  tipo: (e.target.value || undefined) as ConsultorExternoFilters['tipo'],
                }))
              }
              className="w-36 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {TIPO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filters.es_independiente ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  es_independiente: e.target.value || undefined,
                }))
              }
              className="w-44 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {INDEPENDIENTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filters.estado ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  estado: (e.target.value || undefined) as ConsultorExternoFilters['estado'],
                }))
              }
              className="w-36 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {ESTADO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filters.modalidad ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  modalidad: (e.target.value || undefined) as ConsultorExternoFilters['modalidad'],
                }))
              }
              className="w-48 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {MODALIDAD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        {data.length === 0 && !isLoading ? (
          <div className="py-16">
            <EmptyState
              icon={<UserCog className="h-12 w-12 text-gray-300" />}
              title="Sin consultores externos"
              description={
                searchTerm || Object.values(filters).some(Boolean)
                  ? 'No se encontraron consultores con los filtros aplicados.'
                  : 'Los consultores se crean desde Supply Chain > Proveedores.'
              }
            />
          </div>
        ) : (
          <ResponsiveTable<ConsultorExternoList & Record<string, unknown>>
            data={data as (ConsultorExternoList & Record<string, unknown>)[]}
            columns={columns}
            keyExtractor={(c) => String(c.id)}
            isLoading={isLoading}
            emptyMessage="Sin consultores externos"
            hoverable
            mobileCardTitle={(c) => c.full_name}
            mobileCardSubtitle={(c) => (
              <span className="text-xs text-gray-500">
                {c.tipo_consultor_nombre} {' \u00b7 '}
                {c.es_independiente ? 'Independiente' : c.firma_nombre}
              </span>
            )}
            renderActions={
              canEdit
                ? (c) => (
                    <button
                      onClick={() => handleToggle(c as ConsultorExternoList)}
                      disabled={toggleMutation.isPending}
                      className={`p-1.5 rounded-md transition-colors ${
                        c.is_active
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                      title={c.is_active ? 'Desactivar' : 'Activar'}
                    >
                      <Power size={16} />
                    </button>
                  )
                : undefined
            }
          />
        )}

        {/* Footer */}
        {!isLoading && data.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Mostrando {data.length} consultor{data.length !== 1 ? 'es' : ''}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConsultoresExternosSection;
