/**
 * Tab de Programación de Abastecimiento - Supply Chain
 *
 * Gestión de programaciones, asignaciones de recursos, ejecuciones y liquidaciones.
 * KPIs + SectionToolbar + Table + CRUD modales.
 */
import { useState } from 'react';
import { PageTabs } from '@/components/layout';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { KpiCard, KpiCardGrid } from '@/components/common/KpiCard';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Calendar,
  Truck,
  DollarSign,
  CalendarDays,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  FileText,
  Clock,
  PlayCircle,
  ListChecks,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useProgramaciones,
  useDeleteProgramacion,
  useEstadisticasProgramaciones,
  useAsignacionesRecurso,
  useEjecuciones,
  useLiquidaciones,
} from '../hooks';
import ProgramacionFormModal from './ProgramacionFormModal';
import type { Programacion } from '../types';

// ==================== UTILITY FUNCTIONS ====================

const formatEstado = (estado: string): string => {
  return estado
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getEstadoBadgeVariant = (
  estado: string
): 'success' | 'primary' | 'warning' | 'danger' | 'gray' => {
  const estadosSuccess = ['COMPLETADA', 'LIQUIDADA', 'APROBADA', 'EJECUTADA'];
  const estadosPrimary = ['EN_EJECUCION', 'EN_CURSO', 'EN_PROCESO'];
  const estadosWarning = ['PROGRAMADA', 'PENDIENTE'];
  const estadosDanger = ['CANCELADA', 'RECHAZADA', 'VENCIDA'];

  if (estadosSuccess.some((e) => estado.includes(e))) return 'success';
  if (estadosPrimary.some((e) => estado.includes(e))) return 'primary';
  if (estadosWarning.some((e) => estado.includes(e))) return 'warning';
  if (estadosDanger.some((e) => estado.includes(e))) return 'danger';
  return 'gray';
};

// ==================== PROGRAMACIONES SECTION ====================

const ProgramacionesSection = () => {
  const { data, isLoading } = useProgramaciones();
  const { data: estadisticasData } = useEstadisticasProgramaciones();
  const deleteMutation = useDeleteProgramacion();

  const [selectedItem, setSelectedItem] = useState<Programacion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const programaciones = Array.isArray(data) ? data : (data?.results ?? []);
  const estadisticas = estadisticasData as Record<string, unknown> | undefined;

  const handleCreate = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Programacion) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Programaciones"
          value={estadisticas?.total_programaciones ?? programaciones.length}
          icon={<ListChecks className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Pendientes"
          value={estadisticas?.programaciones_pendientes ?? 0}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="En Proceso"
          value={estadisticas?.programaciones_en_proceso ?? 0}
          icon={<PlayCircle className="w-5 h-5" />}
          color="info"
        />
        <KpiCard
          label="Completadas"
          value={estadisticas?.programaciones_completadas ?? 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
      </KpiCardGrid>

      {/* Toolbar */}
      <SectionToolbar
        title="Programaciones"
        count={programaciones.length}
        primaryAction={{
          label: 'Nueva Programación',
          onClick: handleCreate,
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {/* Table */}
      {programaciones.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-16 h-16" />}
          title="No hay programaciones registradas"
          description="Comience creando programaciones de abastecimiento"
          action={{
            label: 'Nueva Programación',
            onClick: handleCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo Operación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Programada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {programaciones.map((prog: Programacion) => (
                  <tr key={prog.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {prog.codigo || `PROG-${prog.id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {prog.tipo_operacion_nombre || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {prog.fecha_programada
                        ? format(new Date(prog.fecha_programada), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {prog.proveedor_nombre || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(
                          prog.estado_nombre || String(prog.estado || '')
                        )}
                        size="sm"
                      >
                        {prog.estado_nombre || formatEstado(String(prog.estado || 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(prog)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(prog.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Crear/Editar */}
      <ProgramacionFormModal item={selectedItem} isOpen={isFormOpen} onClose={handleCloseForm} />

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Programación"
        description="¿Está seguro de que desea eliminar esta programación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== ASIGNACIONES SECTION ====================

const AsignacionesSection = () => {
  const { data, isLoading } = useAsignacionesRecurso();
  const asignaciones = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Asignación de Recursos"
        count={asignaciones.length}
        primaryAction={{
          label: 'Nueva Asignación',
          onClick: () => {},
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {asignaciones.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-16 h-16" />}
          title="No hay asignaciones de recursos"
          description="Asigne recursos a las programaciones de abastecimiento"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Programación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Recurso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Asignación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {asignaciones.map((asig: Record<string, unknown>) => (
                  <tr
                    key={asig.id as number}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {asig.programacion_codigo as string}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {asig.recurso_nombre as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatEstado(String(asig.tipo_recurso ?? ''))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {asig.created_at
                        ? format(new Date(asig.created_at as string), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Eliminar">
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== EJECUCIONES SECTION ====================

const EjecucionesSection = () => {
  const { data, isLoading } = useEjecuciones();
  const ejecuciones = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Ejecuciones"
        count={ejecuciones.length}
        primaryAction={{
          label: 'Nueva Ejecución',
          onClick: () => {},
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {ejecuciones.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-16 h-16" />}
          title="No hay ejecuciones registradas"
          description="Registre las ejecuciones de las programaciones"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Programación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cantidad Real
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {ejecuciones.map((ejec: Record<string, unknown>) => (
                  <tr
                    key={ejec.id as number}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {ejec.programacion_codigo as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {ejec.fecha_inicio
                        ? format(new Date(ejec.fecha_inicio as string), 'dd/MM/yyyy HH:mm', {
                            locale: es,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {ejec.fecha_fin
                        ? format(new Date(ejec.fecha_fin as string), 'dd/MM/yyyy HH:mm', {
                            locale: es,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {(ejec.cantidad_real as number) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(String(ejec.estado_codigo ?? ''))}
                        size="sm"
                      >
                        {formatEstado(String(ejec.estado_nombre ?? 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Completar">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== LIQUIDACIONES SECTION ====================

const LiquidacionesSection = () => {
  const { data, isLoading } = useLiquidaciones();
  const liquidaciones = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Liquidaciones"
        count={liquidaciones.length}
        primaryAction={{
          label: 'Nueva Liquidación',
          onClick: () => {},
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {liquidaciones.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="w-16 h-16" />}
          title="No hay liquidaciones registradas"
          description="Registre las liquidaciones de las ejecuciones"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ejecución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Liquidación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {liquidaciones.map((liq: Record<string, unknown>) => (
                  <tr key={liq.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {liq.ejecucion_codigo as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${Number(liq.total ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {liq.fecha_liquidacion
                        ? format(new Date(liq.fecha_liquidacion as string), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(String(liq.estado_codigo ?? ''))}
                        size="sm"
                      >
                        {formatEstado(String(liq.estado_nombre ?? 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Generar documento">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Aprobar">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== CALENDARIO SECTION ====================

const CalendarioSection = () => {
  return (
    <EmptyState
      icon={<CalendarDays className="w-16 h-16" />}
      title="Vista de Calendario"
      description="Vista de calendario de programaciones (próximamente)"
    />
  );
};

// ==================== MAIN COMPONENT ====================

export default function ProgramacionTab() {
  const moduleColor = useModuleColor('supply_chain');
  const [activeTab, setActiveTab] = useState('programaciones');

  const tabs = [
    { id: 'programaciones', label: 'Programaciones', icon: Calendar },
    { id: 'asignaciones', label: 'Asignaciones', icon: Truck },
    { id: 'ejecuciones', label: 'Ejecuciones', icon: CheckCircle },
    { id: 'liquidaciones', label: 'Liquidaciones', icon: DollarSign },
    { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        moduleColor={moduleColor}
      />

      <div className="mt-6">
        {activeTab === 'programaciones' && <ProgramacionesSection />}
        {activeTab === 'asignaciones' && <AsignacionesSection />}
        {activeTab === 'ejecuciones' && <EjecucionesSection />}
        {activeTab === 'liquidaciones' && <LiquidacionesSection />}
        {activeTab === 'calendario' && <CalendarioSection />}
      </div>
    </div>
  );
}
