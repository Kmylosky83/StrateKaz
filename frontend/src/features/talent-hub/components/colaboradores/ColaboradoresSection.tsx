/**
 * ColaboradoresSection - CRUD principal de colaboradores
 * Talento Humano > Colaboradores
 *
 * Sprint 20: Migrado a ResponsiveTable (card view < 768px)
 *
 * Vista enterprise con:
 * - StatsGrid (4 métricas)
 * - SectionHeader con filtros inline (búsqueda, cargo, área, estado, contrato)
 * - ResponsiveTable con card view móvil
 * - Modal de creación/edición (ColaboradorFormModal)
 * - Confirmación de retiro
 *
 * Usa hooks de Talent Hub (useColaboradores, etc.) NO los de Users.
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
import { Avatar } from '@/components/common/Avatar';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import {
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Pencil,
  Eye,
  LogOut,
  Briefcase,
  Shield,
  Upload,
} from 'lucide-react';
import {
  useColaboradores,
  useColaboradoresEstadisticas,
  useRetirarColaborador,
} from '../../hooks/useColaboradores';
import { useCargos } from '@/features/users/hooks/useUsers';
import { useAreas } from '@/features/gestion-estrategica/hooks/useAreas';
import type {
  Colaborador,
  ColaboradorFilters,
  EstadoColaborador,
  TipoContratoColaborador,
} from '../../types';
import { ColaboradorFormModal } from './ColaboradorFormModal';
import { CrearAccesoModal } from './CrearAccesoModal';
import { ImportarColaboradoresModal } from './ImportarColaboradoresModal';

// Opciones de estado para filtro
const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'retirado', label: 'Retirado' },
];

// Opciones de contrato para filtro
const CONTRATO_OPTIONS = [
  { value: '', label: 'Todos los contratos' },
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'fijo', label: 'Término Fijo' },
  { value: 'obra_labor', label: 'Obra o Labor' },
  { value: 'aprendizaje', label: 'Aprendizaje' },
  { value: 'prestacion_servicios', label: 'Prestación de Servicios' },
];

/** Colores de badge por estado */
const ESTADO_BADGE: Record<EstadoColaborador, 'success' | 'gray' | 'warning' | 'danger'> = {
  activo: 'success',
  inactivo: 'gray',
  suspendido: 'warning',
  retirado: 'danger',
};

/** Labels de estado */
const ESTADO_LABELS: Record<EstadoColaborador, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  suspendido: 'Suspendido',
  retirado: 'Retirado',
};

/** Labels de contrato */
const CONTRATO_LABELS: Record<TipoContratoColaborador, string> = {
  indefinido: 'Indefinido',
  fijo: 'Término Fijo',
  obra_labor: 'Obra/Labor',
  aprendizaje: 'Aprendizaje',
  prestacion_servicios: 'Prest. Servicios',
};

export const ColaboradoresSection = () => {
  // State
  const [filters, setFilters] = useState<ColaboradorFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRetireOpen, setIsRetireOpen] = useState(false);
  const [retireTarget, setRetireTarget] = useState<Colaborador | null>(null);
  const [isAccesoOpen, setIsAccesoOpen] = useState(false);
  const [accesoTarget, setAccesoTarget] = useState<Colaborador | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Module color
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  // Queries
  const { data: colaboradoresData, isLoading } = useColaboradores({
    ...filters,
    search: searchTerm || undefined,
  });
  const { data: statsData } = useColaboradoresEstadisticas();
  const { data: cargosData } = useCargos();
  const { data: areasData } = useAreas();
  const retirarMutation = useRetirarColaborador();

  // Stats
  const stats: StatItem[] = useMemo(
    () => [
      {
        label: 'Total Colaboradores',
        value: statsData?.total || colaboradoresData?.length || 0,
        icon: Users,
        iconColor: 'info' as const,
      },
      {
        label: 'Activos',
        value: statsData?.activos || 0,
        icon: UserCheck,
        iconColor: 'success' as const,
      },
      {
        label: 'Inactivos',
        value: statsData?.por_estado?.inactivo || 0,
        icon: UserPlus,
        iconColor: 'primary' as const,
      },
      {
        label: 'Retirados',
        value: statsData?.por_estado?.retirado || 0,
        icon: UserMinus,
        iconColor: 'danger' as const,
      },
    ],
    [statsData, colaboradoresData]
  );

  // Cargo options for filter
  const cargoOptions = useMemo(() => {
    const options = [{ value: '', label: 'Todos los cargos' }];
    if (cargosData?.results) {
      cargosData.results.forEach((c: { id: number; name: string }) => {
        options.push({ value: String(c.id), label: c.name });
      });
    }
    return options;
  }, [cargosData]);

  // Area options for filter
  const areaOptions = useMemo(() => {
    const options = [{ value: '', label: 'Todos los procesos' }];
    if (areasData?.results) {
      areasData.results.forEach((a: { id: number; name: string }) => {
        options.push({ value: String(a.id), label: a.name });
      });
    }
    return options;
  }, [areasData]);

  // Handlers
  const handleCreate = () => {
    setSelectedColaborador(null);
    setIsFormOpen(true);
  };

  const handleEdit = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador);
    setIsFormOpen(true);
  };

  const handleRetire = (colaborador: Colaborador) => {
    setRetireTarget(colaborador);
    setIsRetireOpen(true);
  };

  const handleCrearAcceso = (colaborador: Colaborador) => {
    setAccesoTarget(colaborador);
    setIsAccesoOpen(true);
  };

  const confirmRetire = async () => {
    if (!retireTarget) return;
    await retirarMutation.mutateAsync({
      id: String(retireTarget.id),
      fecha_retiro: new Date().toISOString().split('T')[0],
      motivo_retiro: 'Retiro voluntario',
    });
    setIsRetireOpen(false);
    setRetireTarget(null);
  };

  // useColaboradores ya devuelve Colaborador[] (hook desempaqueta .results)
  const colaboradores = colaboradoresData || [];

  // ============================================================================
  // ResponsiveTable columns
  // ============================================================================

  const columns: ResponsiveTableColumn<Colaborador & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'colaborador',
        header: 'Colaborador',
        priority: 1 as const,
        render: (c) => (
          <div className="flex items-center gap-3">
            <Avatar
              src={c.foto as string | null}
              alt={String(c.nombre_completo) || `${c.primer_nombre} ${c.primer_apellido}`}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {String(c.nombre_completo) || `${c.primer_nombre} ${c.primer_apellido}`}
              </p>
              {c.email_personal && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {String(c.email_personal)}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'documento',
        header: 'Documento',
        priority: 2 as const,
        render: (c) => (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            <span className="text-xs text-gray-400 mr-1">{String(c.tipo_documento)}</span>
            {String(c.numero_identificacion)}
          </span>
        ),
      },
      {
        key: 'cargo',
        header: 'Cargo',
        render: (c) => (
          <div className="flex items-center gap-1.5">
            <Briefcase size={14} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
              {String(c.cargo_nombre || '-')}
            </span>
          </div>
        ),
      },
      {
        key: 'area',
        header: 'Proceso',
        hideOnTablet: true,
        render: (c) => (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {String(c.area_nombre || '-')}
          </span>
        ),
      },
      {
        key: 'contrato',
        header: 'Contrato',
        hideOnTablet: true,
        render: (c) => (
          <Badge variant="gray" size="sm">
            {CONTRATO_LABELS[c.tipo_contrato as TipoContratoColaborador] || String(c.tipo_contrato)}
          </Badge>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        priority: 2 as const,
        render: (c) => (
          <Badge variant={ESTADO_BADGE[c.estado as EstadoColaborador]} size="sm">
            {ESTADO_LABELS[c.estado as EstadoColaborador] || String(c.estado)}
          </Badge>
        ),
      },
      {
        key: 'ingreso',
        header: 'Ingreso',
        hideOnTablet: true,
        render: (c) => (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {c.fecha_ingreso ? new Date(String(c.fecha_ingreso)).toLocaleDateString('es-CO') : '-'}
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
            <Users className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Colaboradores"
        description="Directorio de empleados, información personal e historial laboral"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar por nombre, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56"
            />
            <Select
              value={filters.cargo || ''}
              onChange={(e) => setFilters({ ...filters, cargo: e.target.value || undefined })}
              options={cargoOptions}
              className="w-40"
            />
            <Select
              value={filters.area || ''}
              onChange={(e) => setFilters({ ...filters, area: e.target.value || undefined })}
              options={areaOptions}
              className="w-40"
            />
            <Select
              value={filters.estado || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  estado: (e.target.value as EstadoColaborador) || undefined,
                })
              }
              options={ESTADO_OPTIONS}
              className="w-36"
            />
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload size={16} className="mr-1" />
              Importar
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <UserPlus size={16} className="mr-1" />
              Nuevo
            </Button>
          </div>
        }
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        {colaboradores.length === 0 && !isLoading ? (
          <div className="py-16">
            <EmptyState
              icon={<Users className="h-12 w-12 text-gray-300" />}
              title="Sin colaboradores"
              description={
                searchTerm || Object.values(filters).some(Boolean)
                  ? 'No se encontraron colaboradores con los filtros aplicados.'
                  : 'Agrega el primer colaborador para comenzar.'
              }
            />
          </div>
        ) : (
          <ResponsiveTable<Colaborador & Record<string, unknown>>
            data={colaboradores as (Colaborador & Record<string, unknown>)[]}
            columns={columns}
            keyExtractor={(c) => String(c.id)}
            isLoading={isLoading}
            emptyMessage="Sin colaboradores"
            hoverable
            mobileCardTitle={(c) =>
              String(c.nombre_completo) || `${c.primer_nombre} ${c.primer_apellido}`
            }
            mobileCardSubtitle={(c) => (
              <span className="text-xs text-gray-500">
                {String(c.cargo_nombre || '-')} • {ESTADO_LABELS[c.estado as EstadoColaborador]}
              </span>
            )}
            mobileCardAvatar={(c) => (
              <Avatar
                src={c.foto as string | null}
                alt={String(c.nombre_completo || c.primer_nombre)}
                size="sm"
              />
            )}
            renderActions={(c) => (
              <>
                <button
                  type="button"
                  onClick={() => handleEdit(c as unknown as Colaborador)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                  title="Ver / Editar"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(c as unknown as Colaborador)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-info-600 hover:bg-info-50 dark:hover:text-info-400 dark:hover:bg-info-900/20"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                {!c.usuario && c.estado === 'activo' && (
                  <button
                    type="button"
                    onClick={() => handleCrearAcceso(c as unknown as Colaborador)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-success-600 hover:bg-success-50 dark:hover:text-success-400 dark:hover:bg-success-900/20"
                    title="Crear Acceso al Sistema"
                  >
                    <Shield size={16} />
                  </button>
                )}
                {c.estado === 'activo' && (
                  <button
                    type="button"
                    onClick={() => handleRetire(c as unknown as Colaborador)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                    title="Retirar"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </>
            )}
          />
        )}

        {/* Pagination info */}
        {!isLoading && colaboradores.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Mostrando {colaboradores.length} colaboradores</span>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <ColaboradorFormModal
        colaborador={selectedColaborador}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedColaborador(null);
        }}
      />

      {/* Crear Acceso Modal */}
      <CrearAccesoModal
        colaborador={accesoTarget}
        isOpen={isAccesoOpen}
        onClose={() => {
          setIsAccesoOpen(false);
          setAccesoTarget(null);
        }}
      />

      {/* Retire Confirmation */}
      <ConfirmDialog
        isOpen={isRetireOpen}
        title="Retirar Colaborador"
        message={`¿Estás seguro de retirar a ${retireTarget?.nombre_completo || retireTarget?.primer_nombre || ''}? Esta acción registrará la fecha de retiro y cambiará su estado.`}
        confirmText="Confirmar Retiro"
        variant="danger"
        isLoading={retirarMutation.isPending}
        onConfirm={confirmRetire}
        onClose={() => {
          setIsRetireOpen(false);
          setRetireTarget(null);
        }}
      />

      {/* Importar Modal */}
      <ImportarColaboradoresModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
};
