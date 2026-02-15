/**
 * ColaboradoresSection - CRUD principal de colaboradores
 * Talento Humano > Colaboradores
 *
 * Vista enterprise con:
 * - StatsGrid (4 metricas)
 * - SectionHeader con filtros inline (busqueda, cargo, area, estado, contrato)
 * - Tabla de colaboradores con acciones CRUD
 * - Modal de creacion/edicion (ColaboradorFormModal)
 * - Confirmacion de retiro
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
import { Spinner } from '@/components/common/Spinner';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
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
  { value: 'fijo', label: 'Termino Fijo' },
  { value: 'obra_labor', label: 'Obra o Labor' },
  { value: 'aprendizaje', label: 'Aprendizaje' },
  { value: 'prestacion_servicios', label: 'Prestacion de Servicios' },
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
  fijo: 'Termino Fijo',
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

  // Stats — backend estadisticas retorna { total, activos, por_estado, por_tipo_contrato, por_area }
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
        description="Directorio de empleados, informacion personal e historial laboral"
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
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Cargando colaboradores...
            </p>
          </div>
        ) : colaboradores.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Cargo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Proceso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Contrato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ingreso
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {colaboradores.map((colab) => (
                  <tr
                    key={colab.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {/* Colaborador (foto + nombre) */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={colab.foto}
                          alt={
                            colab.nombre_completo ||
                            `${colab.primer_nombre} ${colab.primer_apellido}`
                          }
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {colab.nombre_completo ||
                              `${colab.primer_nombre} ${colab.primer_apellido}`}
                          </p>
                          {colab.email_personal && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {colab.email_personal}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Documento */}
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-xs text-gray-400 mr-1">{colab.tipo_documento}</span>
                      {colab.numero_identificacion}
                    </td>

                    {/* Cargo */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                          {colab.cargo_nombre || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Proceso (Area) */}
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {colab.area_nombre || '-'}
                    </td>

                    {/* Tipo contrato */}
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {CONTRATO_LABELS[colab.tipo_contrato] || colab.tipo_contrato}
                      </Badge>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[colab.estado]} size="sm">
                        {ESTADO_LABELS[colab.estado] || colab.estado}
                      </Badge>
                    </td>

                    {/* Fecha ingreso */}
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {colab.fecha_ingreso
                        ? new Date(colab.fecha_ingreso).toLocaleDateString('es-CO')
                        : '-'}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(colab)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                          title="Ver / Editar"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(colab)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-info-600 hover:bg-info-50 dark:hover:text-info-400 dark:hover:bg-info-900/20"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        {colab.estado === 'activo' && (
                          <button
                            type="button"
                            onClick={() => handleRetire(colab)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                            title="Retirar"
                          >
                            <LogOut size={16} />
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

      {/* Retire Confirmation */}
      <ConfirmDialog
        isOpen={isRetireOpen}
        title="Retirar Colaborador"
        message={`¿Estas seguro de retirar a ${retireTarget?.nombre_completo || retireTarget?.primer_nombre || ''}? Esta accion registrara la fecha de retiro y cambiara su estado.`}
        confirmText="Confirmar Retiro"
        variant="danger"
        isLoading={retirarMutation.isPending}
        onConfirm={confirmRetire}
        onClose={() => {
          setIsRetireOpen(false);
          setRetireTarget(null);
        }}
      />
    </div>
  );
};
