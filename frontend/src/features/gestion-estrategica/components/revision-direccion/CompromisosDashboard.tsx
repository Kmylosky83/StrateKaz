/**
 * Dashboard de Compromisos Pendientes - Revisión por la Dirección
 * Muestra estadísticas, tabla de compromisos y alertas de vencimientos
 */
import { useState } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Filter,
} from 'lucide-react';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { Card, Badge, Button } from '@/components/common';
import {
  useRevisionDireccionDashboard,
  useCompromisos,
  useCompromisosVencidos,
  useCompromisosCriticos,
} from '../../hooks/useRevisionDireccion';
import type { CompromisoRevision, CompromisoRevisionFilters } from '../../types/strategic.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== SUB-COMPONENTES ====================

interface CompromisoRowProps {
  compromiso: CompromisoRevision;
  onEdit?: (compromiso: CompromisoRevision) => void;
}

const CompromisoRow = ({ compromiso, onEdit }: CompromisoRowProps) => {
  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      PENDIENTE: 'warning',
      EN_PROGRESO: 'primary',
      COMPLETADO: 'success',
      VENCIDO: 'danger',
      CANCELADO: 'gray',
    };
    return <Badge variant={variants[estado] || 'gray'}>{compromiso.estado_display}</Badge>;
  };

  const getPrioridadBadge = (prioridad: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      CRITICA: 'danger',
      ALTA: 'warning',
      MEDIA: 'primary',
      BAJA: 'success',
    };
    return <Badge variant={variants[prioridad] || 'gray'} size="sm">{compromiso.prioridad_display}</Badge>;
  };

  const diasVencimiento = compromiso.dias_vencimiento || 0;
  const showAlert = diasVencimiento <= 7 && diasVencimiento > 0 && compromiso.estado !== 'COMPLETADO';

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">{compromiso.codigo}</span>
          {showAlert && <AlertTriangle className="h-4 w-4 text-orange-500" />}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="max-w-md">
          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
            {compromiso.descripcion}
          </p>
          {compromiso.revision_codigo && (
            <p className="text-xs text-gray-500 mt-1">Revisión: {compromiso.revision_codigo}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm text-gray-900 dark:text-gray-100">{compromiso.responsable_name}</p>
          {compromiso.responsable_cargo_name && (
            <p className="text-xs text-gray-500">{compromiso.responsable_cargo_name}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">{getPrioridadBadge(compromiso.prioridad)}</td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <p className="text-gray-900 dark:text-gray-100">
            {format(new Date(compromiso.fecha_limite), 'dd/MM/yyyy', { locale: es })}
          </p>
          {diasVencimiento > 0 && compromiso.estado !== 'COMPLETADO' && (
            <p className={`text-xs ${diasVencimiento <= 7 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
              {diasVencimiento} {diasVencimiento === 1 ? 'día' : 'días'}
            </p>
          )}
          {compromiso.esta_vencido && (
            <p className="text-xs text-red-600 font-medium">
              Vencido hace {Math.abs(diasVencimiento)} días
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">{getEstadoBadge(compromiso.estado)}</td>
      <td className="px-4 py-3 text-center">
        <Button variant="ghost" size="sm" onClick={() => onEdit?.(compromiso)}>
          Ver
        </Button>
      </td>
    </tr>
  );
};

const CompromisosTable = ({
  compromisos,
  isLoading,
  onEdit,
}: {
  compromisos?: CompromisoRevision[];
  isLoading: boolean;
  onEdit?: (compromiso: CompromisoRevision) => void;
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse-subtle">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!compromisos || compromisos.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No hay compromisos registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Código
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Responsable
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Prioridad
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fecha Límite
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {compromisos.map((compromiso) => (
            <CompromisoRow key={compromiso.id} compromiso={compromiso} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const CompromisosDashboard = () => {
  const [filters, setFilters] = useState<CompromisoRevisionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Hooks de datos
  const { data: dashboardStats, isLoading: statsLoading } = useRevisionDireccionDashboard();
  const { data: compromisosData, isLoading: compromisosLoading } = useCompromisos(filters);
  const { data: vencidosData } = useCompromisosVencidos();
  const { data: criticosData } = useCompromisosCriticos(5);

  const stats = dashboardStats?.stats_compromisos;
  const compromisos = compromisosData?.results || [];
  const vencidos = vencidosData?.results || [];
  const criticos = criticosData?.results || [];

  // Estadísticas para StatsGrid
  const statsItems: StatItem[] = [
    {
      label: 'Total Compromisos',
      value: stats?.total_compromisos || 0,
      icon: ClipboardList,
      iconColor: 'primary',
      description: 'Todos los compromisos',
    },
    {
      label: 'Pendientes',
      value: stats?.total_pendientes || 0,
      icon: Clock,
      iconColor: 'warning',
      description: 'Por iniciar',
    },
    {
      label: 'En Progreso',
      value: stats?.total_en_progreso || 0,
      icon: TrendingUp,
      iconColor: 'info',
      description: 'En desarrollo',
    },
    {
      label: 'Completados',
      value: stats?.total_completados || 0,
      icon: CheckCircle2,
      iconColor: 'success',
      description: `${stats?.tasa_cumplimiento?.toFixed(1) || 0}% cumplimiento`,
    },
    {
      label: 'Vencidos',
      value: stats?.total_vencidos || 0,
      icon: AlertTriangle,
      iconColor: 'danger',
      description: 'Requieren atención inmediata',
    },
  ];

  const handleEditCompromiso = (compromiso: CompromisoRevision) => {
    // TODO: Abrir modal de edición
    console.log('Editar compromiso:', compromiso);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <StatsGrid stats={statsItems} columns={5} />

      {/* Alertas de Compromisos Críticos */}
      {criticos.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Compromisos Próximos a Vencer
                </h3>
                <div className="space-y-2">
                  {criticos.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded border border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {comp.codigo} - {comp.descripcion}
                        </p>
                        <p className="text-xs text-gray-500">
                          Responsable: {comp.responsable_name} | Vence:{' '}
                          {format(new Date(comp.fecha_limite), 'dd/MM/yyyy', { locale: es })} (
                          {comp.dias_vencimiento} días)
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditCompromiso(comp)}>
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Indicadores por Responsable */}
      {stats?.compromisos_por_responsable && stats.compromisos_por_responsable.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cumplimiento por Responsable
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.compromisos_por_responsable.map((resp) => (
              <Card key={resp.responsable_id}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {resp.responsable_nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {resp.total} {resp.total === 1 ? 'compromiso' : 'compromisos'}
                      </p>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        resp.tasa_cumplimiento >= 80
                          ? 'text-green-600'
                          : resp.tasa_cumplimiento >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {resp.tasa_cumplimiento.toFixed(0)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Pendientes</p>
                      <p className="font-medium text-orange-600">{resp.pendientes}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Completados</p>
                      <p className="font-medium text-green-600">{resp.completados}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Vencidos</p>
                      <p className="font-medium text-red-600">{resp.vencidos}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Compromisos */}
      <DataTableCard
        title="Todos los Compromisos"
        headerActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        }
        isEmpty={compromisos.length === 0}
        isLoading={compromisosLoading}
        emptyMessage="No hay compromisos que cumplan con los filtros seleccionados"
      >
        {/* Panel de filtros */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.estado || ''}
                  onChange={(e) => setFilters({ ...filters, estado: e.target.value as any || undefined })}
                >
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROGRESO">En Progreso</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="VENCIDO">Vencido</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioridad
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.prioridad || ''}
                  onChange={(e) => setFilters({ ...filters, prioridad: e.target.value as any || undefined })}
                >
                  <option value="">Todas</option>
                  <option value="CRITICA">Crítica</option>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Media</option>
                  <option value="BAJA">Baja</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        <CompromisosTable
          compromisos={compromisos}
          isLoading={compromisosLoading}
          onEdit={handleEditCompromiso}
        />
      </DataTableCard>
    </div>
  );
};
