/**
 * Tab de Gestión del Cambio
 *
 * Vista 2B del Catálogo de Vistas UI:
 * - SectionHeader con botón "Nuevo Cambio"
 * - StatsGrid con 4 tarjetas
 * - Filtros de búsqueda
 * - DataTableCard con tabla paginada
 *
 * ZERO HARDCODING - Usa configuraciones de types
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { CambioFormModal } from './modals/CambioFormModal';
import {
  useGestionCambios,
  useGestionCambioStats,
  useDeleteCambio,
  useChangeTypes,
  useChangePriorities,
  useChangeStatuses,
} from '../hooks/useGestionCambio';
import { proyectosApi } from '../api/proyectosApi';
import { toast } from 'sonner';
import type {
  GestionCambio,
  GestionCambioFilters,
  ChangeStatus,
  ChangePriority,
  ChangeType,
} from '../types/gestion-cambio.types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from '../types/gestion-cambio.types';
import type { StatItem } from '@/components/layout/StatsGrid';
import { formatFechaLocal } from '@/utils/dateUtils';

export const GestionCambioTab = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.GESTION_CAMBIO, 'create');
  const canEdit = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.GESTION_CAMBIO, 'edit');
  const canDelete = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.GESTION_CAMBIO, 'delete');

  const [filters, setFilters] = useState<GestionCambioFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCambio, setSelectedCambio] = useState<GestionCambio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const {
    data: cambiosData,
    isLoading,
    error,
  } = useGestionCambios({ ...filters, search: searchTerm });
  const { data: stats } = useGestionCambioStats();
  const { data: changeTypes } = useChangeTypes();
  const { data: priorities } = useChangePriorities();
  const { data: statuses } = useChangeStatuses();

  // Mutations
  const deleteMutation = useDeleteCambio();

  const cambios = cambiosData?.results || [];

  // StatsGrid - 4 tarjetas principales
  const statsCards: StatItem[] = [
    {
      label: 'Total de Cambios',
      value: stats?.total || 0,
      iconColor: 'primary',
    },
    {
      label: 'Prioridad Crítica',
      value: stats?.by_priority?.critica || 0,
      iconColor: 'danger',
      description: `${stats?.by_priority?.alta || 0} alta`,
    },
    {
      label: 'En Ejecución',
      value: stats?.by_status?.en_ejecucion || 0,
      iconColor: 'warning',
      description: `${stats?.by_status?.planificado || 0} planificados`,
    },
    {
      label: 'Completados',
      value: stats?.by_status?.completado || 0,
      iconColor: 'success',
      description: `${stats?.by_status?.cancelado || 0} cancelados`,
    },
  ];

  const handleEdit = (cambio: GestionCambio) => {
    setSelectedCambio(cambio);
    setIsModalOpen(true);
  };

  const handleDelete = async (cambio: GestionCambio) => {
    if (window.confirm(`¿Está seguro de eliminar el cambio ${cambio.code}?`)) {
      await deleteMutation.mutateAsync(cambio.id);
    }
  };

  const handleCreate = () => {
    setSelectedCambio(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCambio(null);
  };

  const handleConvertirAProyecto = async (cambio: GestionCambio) => {
    if (
      window.confirm(
        `¿Desea convertir el cambio "${cambio.title}" en un proyecto?\n\nSe creará un nuevo proyecto con la información del cambio.`
      )
    ) {
      try {
        const result = await proyectosApi.crearDesdeCambio({ cambio_id: cambio.id });
        toast.success(result.detail);
      } catch (error: unknown) {
        const message = error?.response?.data?.detail || 'Error al crear el proyecto';
        toast.error(message);
      }
    }
  };

  // Columnas de la tabla
  const columns = [
    {
      header: 'Código',
      accessor: 'code' as const,
      className: 'font-mono text-xs',
    },
    {
      header: 'Título',
      accessor: 'title' as const,
      className: 'font-medium',
    },
    {
      header: 'Tipo',
      accessor: 'change_type' as const,
      render: (value: ChangeType) => {
        const config = TYPE_CONFIG[value];
        return (
          <div className="flex items-center gap-2">
            <DynamicIcon
              name={config.icon}
              className={`w-4 h-4 text-${config.color}-600 dark:text-${config.color}-400`}
            />
            <span className="text-sm">{config.label}</span>
          </div>
        );
      },
    },
    {
      header: 'Prioridad',
      accessor: 'priority' as const,
      render: (value: ChangePriority) => {
        const config = PRIORITY_CONFIG[value];
        return (
          <Badge variant="gray" className={`${config.textColor} ${config.borderColor}`}>
            <DynamicIcon name={config.icon} className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Estado',
      accessor: 'status' as const,
      render: (value: ChangeStatus) => {
        const config = STATUS_CONFIG[value];
        return (
          <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
            <DynamicIcon name={config.icon} className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Responsable',
      accessor: 'responsible_name' as const,
      render: (value: string | null) => value || '-',
    },
    {
      header: 'Fecha Límite',
      accessor: 'due_date' as const,
      render: (value: string | null) => (value ? formatFechaLocal(value) : '-'),
    },
  ];

  const actions = [
    ...(canEdit
      ? [
          {
            label: 'Convertir a Proyecto',
            icon: 'FolderKanban',
            onClick: handleConvertirAProyecto,
            variant: 'ghost' as const,
            className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
          },
          {
            label: 'Editar',
            icon: 'Edit',
            onClick: handleEdit,
            variant: 'ghost' as const,
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Eliminar',
            icon: 'Trash2',
            onClick: handleDelete,
            variant: 'ghost' as const,
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
          },
        ]
      : []),
  ];

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error al cargar cambios"
        message={error instanceof Error ? error.message : 'Error desconocido'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Cambios"
        description="Registre y dé seguimiento a cambios estratégicos, organizacionales, de procesos o tecnológicos"
        actions={
          canCreate ? (
            <Button
              onClick={handleCreate}
              leftIcon={<DynamicIcon name="Plus" className="w-4 h-4" />}
              variant="primary"
            >
              Nuevo Cambio
            </Button>
          ) : undefined
        }
      />

      {/* Stats Grid */}
      <StatsGrid stats={statsCards} columns={4} />

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por código o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<DynamicIcon name="Search" className="w-4 h-4" />}
          />

          <Select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as ChangeStatus | undefined })
            }
            options={[
              { value: '', label: 'Todos los estados' },
              ...(statuses?.map((s) => ({ value: s.value, label: s.label })) || []),
            ]}
          />

          <Select
            value={filters.priority || ''}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value as ChangePriority | undefined })
            }
            options={[
              { value: '', label: 'Todas las prioridades' },
              ...(priorities?.map((p) => ({ value: p.value, label: p.label })) || []),
            ]}
          />

          <Select
            value={filters.change_type || ''}
            onChange={(e) =>
              setFilters({ ...filters, change_type: e.target.value as ChangeType | undefined })
            }
            options={[
              { value: '', label: 'Todos los tipos' },
              ...(changeTypes?.map((t) => ({ value: t.value, label: t.label })) || []),
            ]}
          />
        </div>
      </motion.div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando cambios...</span>
        </div>
      ) : cambios.length === 0 ? (
        <EmptyState
          icon={<DynamicIcon name="GitBranch" className="w-12 h-12" />}
          title="No hay cambios registrados"
          description="Comience creando su primer cambio organizacional"
          action={
            canCreate
              ? {
                  label: 'Nuevo Cambio',
                  onClick: handleCreate,
                  icon: <DynamicIcon name="Plus" className="w-4 h-4" />,
                }
              : undefined
          }
        />
      ) : (
        <DataTableCard
          title={`Cambios (${cambiosData?.count || 0})`}
          isLoading={isLoading}
          isEmpty={cambios.length === 0}
          emptyMessage="No hay cambios registrados"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.accessor}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {cambios.map((cambio) => (
                  <tr key={cambio.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {columns.map((column) => (
                      <td
                        key={column.accessor}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                      >
                        {column.render
                          ? column.render(cambio[column.accessor] as unknown)
                          : (cambio[column.accessor] as unknown)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={action.variant}
                            className={action.className}
                            onClick={() => action.onClick(cambio)}
                            leftIcon={<DynamicIcon name={action.icon} className="w-4 h-4" />}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTableCard>
      )}

      {/* Modal */}
      <CambioFormModal cambio={selectedCambio} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};
