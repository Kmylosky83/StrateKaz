/**
 * Página: Medicina Laboral
 *
 * Sistema completo de medicina del trabajo con 5 subsecciones:
 * - Exámenes Médicos
 * - Restricciones Médicas
 * - Vigilancia Epidemiológica
 * - Diagnósticos Ocupacionales
 * - Estadísticas y Reportes
 */
import { useState } from 'react';
import {
  Stethoscope,
  AlertOctagon,
  Activity,
  FileText,
  BarChart3,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Input } from '@/components/common/Input';
import { cn } from '@/utils/cn';
import {
  useExamenesMedicos,
  useRestricciones,
  useCasosVigilancia,
  useProgramasVigilancia,
  useDiagnosticos,
  useEstadisticaMedica,
} from '../hooks/useMedicinaLaboral';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== PROGRESS COMPONENT ====================

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const Progress = ({ value, max = 100, className, showLabel = false, variant = 'default' }: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantColors = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };

  const getVariant = (): 'default' | 'success' | 'warning' | 'danger' => {
    if (variant !== 'default') return variant;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const currentVariant = getVariant();

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', variantColors[currentVariant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

const getConceptoBadgeVariant = (concepto: string): 'success' | 'warning' | 'danger' => {
  const conceptoMap: Record<string, 'success' | 'warning' | 'danger'> = {
    APTO: 'success',
    APTO_CON_RESTRICCIONES: 'warning',
    NO_APTO: 'danger',
    PENDIENTE: 'warning',
  };
  return conceptoMap[concepto] || 'warning';
};

const formatConcepto = (concepto: string): string => {
  const conceptoMap: Record<string, string> = {
    APTO: 'Apto',
    APTO_CON_RESTRICCIONES: 'Apto con Restricciones',
    NO_APTO: 'No Apto',
    PENDIENTE: 'Pendiente',
  };
  return conceptoMap[concepto] || concepto;
};

const getTipoRestriccionBadge = (tipo: string): 'warning' | 'danger' | 'primary' => {
  const tipoMap: Record<string, 'warning' | 'danger' | 'primary'> = {
    TEMPORAL: 'warning',
    PERMANENTE: 'danger',
    CONDICIONAL: 'primary',
  };
  return tipoMap[tipo] || 'warning';
};

const formatTipoRestriccion = (tipo: string): string => {
  const tipoMap: Record<string, string> = {
    TEMPORAL: 'Temporal',
    PERMANENTE: 'Permanente',
    CONDICIONAL: 'Condicional',
  };
  return tipoMap[tipo] || tipo;
};

const getSeveridadBadge = (
  severidad: string
): 'success' | 'warning' | 'danger' | 'gray' => {
  const severidadMap: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
    LEVE: 'success',
    MODERADA: 'warning',
    SEVERA: 'danger',
    CRITICA: 'danger',
  };
  return severidadMap[severidad] || 'gray';
};

const formatSeveridad = (severidad: string): string => {
  const severidadMap: Record<string, string> = {
    LEVE: 'Leve',
    MODERADA: 'Moderada',
    SEVERA: 'Severa',
    CRITICA: 'Crítica',
  };
  return severidadMap[severidad] || severidad;
};

const getEstadoBadgeVariant = (
  estado: string
): 'success' | 'primary' | 'warning' | 'danger' | 'info' | 'gray' => {
  const estadoMap: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info' | 'gray'> = {
    PROGRAMADO: 'warning',
    COMPLETADO: 'success',
    REALIZADO: 'success',
    PENDIENTE: 'warning',
    VENCIDO: 'danger',
    CANCELADO: 'gray',
    ACTIVO: 'primary',
    INACTIVO: 'gray',
    CONTROLADO: 'success',
    EN_SEGUIMIENTO: 'primary',
  };
  return estadoMap[estado] || 'gray';
};

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

// ==================== EXAMENES MEDICOS SECTION ====================

const ExamenesMedicosSection = () => {
  const { data: examenes, isLoading } = useExamenesMedicos();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!examenes || examenes.length === 0) {
    return (
      <EmptyState
        icon={<Stethoscope className="w-16 h-16" />}
        title="No hay exámenes médicos registrados"
        description="Comience programando exámenes médicos para sus colaboradores"
        action={{
          label: 'Programar Examen',
          onClick: () => console.log('Programar examen'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    programados: examenes.filter((e) => e.estado === 'PROGRAMADO').length,
    completados: examenes.filter((e) => e.estado === 'COMPLETADO').length,
    vencidos: examenes.filter((e) => e.estado === 'VENCIDO').length,
    proximos30: examenes.filter((e) => {
      if (e.estado !== 'PROGRAMADO' || !e.fecha_programada) return false;
      const diff = new Date(e.fecha_programada).getTime() - new Date().getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days <= 30 && days >= 0;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.programados}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Pendientes de realizar</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.completados}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este mes</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidos</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.vencidos}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren atención</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Próximos 30 días</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.proximos30}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Por vencer</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Exámenes Médicos</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Programar Examen
          </Button>
        </div>
      </div>

      {/* Examenes Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo Examen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {examenes.map((examen) => (
                <tr key={examen.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {examen.numero_examen}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">Colaborador #{examen.colaborador_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{examen.tipo_examen_nombre || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {examen.tipo_examen_nombre || `Tipo #${examen.tipo_examen}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {examen.fecha_realizado
                      ? format(new Date(examen.fecha_realizado), 'dd/MM/yyyy', { locale: es })
                      : examen.fecha_programada
                      ? format(new Date(examen.fecha_programada), 'dd/MM/yyyy', { locale: es })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {examen.concepto_aptitud ? (
                      <Badge variant={getConceptoBadgeVariant(examen.concepto_aptitud)} size="sm">
                        {examen.concepto_aptitud_display || formatConcepto(examen.concepto_aptitud)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(examen.estado)} size="sm">
                      {examen.estado_display || formatEstado(examen.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== RESTRICCIONES MEDICAS SECTION ====================

const RestriccionesMedicasSection = () => {
  const { data: restricciones, isLoading } = useRestricciones();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!restricciones || restricciones.length === 0) {
    return (
      <EmptyState
        icon={<AlertOctagon className="w-16 h-16" />}
        title="No hay restricciones médicas registradas"
        description="Registre las restricciones médicas de los colaboradores"
        action={{
          label: 'Nueva Restricción',
          onClick: () => console.log('Nueva restricción'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: restricciones.filter((r) => r.estado === 'ACTIVA').length,
    temporales: restricciones.filter((r) => r.tipo_restriccion === 'TEMPORAL' && r.estado === 'ACTIVA').length,
    permanentes: restricciones.filter((r) => r.tipo_restriccion === 'PERMANENTE' && r.estado === 'ACTIVA').length,
    porVencer: restricciones.filter((r) => {
      if (r.tipo_restriccion === 'PERMANENTE' || !r.fecha_fin || r.estado !== 'ACTIVA') return false;
      const diff = new Date(r.fecha_fin).getTime() - new Date().getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days <= 30 && days >= 0;
    }).length,
  };

  // Agrupar restricciones por categoría
  const restriccionesPorCategoria = restricciones
    .filter((r) => r.estado === 'ACTIVA')
    .reduce((acc, r) => {
      const cat = r.categoria_display || r.categoria || 'Otros';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat]++;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activas Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Restricciones vigentes</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temporales</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.temporales}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Con fecha de fin</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Permanentes</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.permanentes}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Sin fecha de finalización</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Por Vencer (30 días)</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.porVencer}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren revisión</p>
        </Card>
      </div>

      {/* Dashboard de restricciones por categoría */}
      {Object.keys(restriccionesPorCategoria).length > 0 && (
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Restricciones por Categoría</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(restriccionesPorCategoria).map(([categoria, count]) => (
              <div key={categoria} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{categoria}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Restricciones Médicas</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Restricción
          </Button>
        </div>
      </div>

      {/* Restricciones Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {restricciones.map((restriccion) => (
                <tr key={restriccion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {restriccion.codigo_restriccion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">Colaborador #{restriccion.colaborador_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {restriccion.descripcion}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getTipoRestriccionBadge(restriccion.tipo_restriccion)} size="sm">
                      {restriccion.tipo_restriccion_display || formatTipoRestriccion(restriccion.tipo_restriccion)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {restriccion.categoria_display || restriccion.categoria || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {restriccion.tipo_restriccion === 'PERMANENTE' ? (
                      <span className="text-danger-600">Indefinida</span>
                    ) : restriccion.fecha_fin ? (
                      <div>
                        <p>{format(new Date(restriccion.fecha_fin), 'dd/MM/yyyy', { locale: es })}</p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(restriccion.estado)} size="sm">
                      {restriccion.estado_display || formatEstado(restriccion.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
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
    </div>
  );
};

// ==================== VIGILANCIA EPIDEMIOLOGICA SECTION ====================

const VigilanciaEpidemiologicaSection = () => {
  const { data: programas, isLoading: loadingProgramas } = useProgramasVigilancia();
  const { data: casos, isLoading: loadingCasos } = useCasosVigilancia();

  if (loadingProgramas || loadingCasos) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if ((!programas || programas.length === 0) && (!casos || casos.length === 0)) {
    return (
      <EmptyState
        icon={<Activity className="w-16 h-16" />}
        title="No hay programas de vigilancia registrados"
        description="Configure programas de vigilancia epidemiológica ocupacional"
        action={{
          label: 'Nuevo Caso',
          onClick: () => console.log('Nuevo caso'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    programasActivos: programas?.filter((p) => p.estado === 'ACTIVO').length || 0,
    casosActivos: casos?.filter((c) => c.estado === 'EN_SEGUIMIENTO' || c.estado === 'ACTIVO').length || 0,
    casosCriticos: casos?.filter((c) => c.severidad === 'CRITICA').length || 0,
    casosControlados: casos?.filter((c) => c.estado === 'CONTROLADO').length || 0,
  };

  // Agrupar casos por programa
  const casosPorPrograma = programas?.map((programa) => ({
    ...programa,
    casos_count: casos?.filter((c) => c.programa === programa.id).length || 0,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programas Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.programasActivos}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En ejecución</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Casos Activos</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.casosActivos}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En seguimiento</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Casos Críticos</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.casosCriticos}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren atención</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Controlados</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.casosControlados}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Bajo control</p>
        </Card>
      </div>

      {/* Programas con casos */}
      {casosPorPrograma && casosPorPrograma.length > 0 && (
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Casos por Programa de Vigilancia</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {casosPorPrograma.map((programa) => (
              <div
                key={programa.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">{programa.nombre}</h5>
                  <Badge variant={programa.casos_count > 0 ? 'warning' : 'success'} size="sm">
                    {programa.casos_count}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{programa.descripcion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Casos de Vigilancia</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Registrar Seguimiento
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Caso
          </Button>
        </div>
      </div>

      {/* Casos Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Programa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último Seguimiento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {casos?.map((caso) => (
                <tr key={caso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {caso.numero_caso}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {caso.programa_nombre || `Programa #${caso.programa}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">Colaborador #{caso.colaborador_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {caso.diagnosticos_cie10?.[0]?.codigo || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getSeveridadBadge(caso.severidad)} size="sm">
                      {caso.severidad_display || formatSeveridad(caso.severidad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(caso.estado)} size="sm">
                      {caso.estado_display || formatEstado(caso.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {caso.fecha_ultimo_seguimiento
                      ? format(new Date(caso.fecha_ultimo_seguimiento), 'dd/MM/yyyy', { locale: es })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== DIAGNOSTICOS OCUPACIONALES SECTION ====================

const DiagnosticosOcupacionalesSection = () => {
  const { data: diagnosticos, isLoading } = useDiagnosticos();
  const [searchCIE10, setSearchCIE10] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!diagnosticos || diagnosticos.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No hay diagnósticos registrados"
        description="Registre los diagnósticos ocupacionales y comunes de sus colaboradores"
        action={{
          label: 'Nuevo Diagnóstico',
          onClick: () => console.log('Nuevo diagnóstico'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: diagnosticos.length,
    ocupacionales: diagnosticos.filter((d) => d.origen === 'OCUPACIONAL').length,
    comunes: diagnosticos.filter((d) => d.origen === 'COMUN').length,
    requierenVigilancia: diagnosticos.filter((d) => d.requiere_vigilancia).length,
  };

  const filteredDiagnosticos = searchCIE10
    ? diagnosticos.filter(
        (d) =>
          d.codigo_cie10.toLowerCase().includes(searchCIE10.toLowerCase()) ||
          d.nombre.toLowerCase().includes(searchCIE10.toLowerCase())
      )
    : diagnosticos;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Diagnósticos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Registrados en el sistema</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ocupacionales</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.ocupacionales}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Relacionados con el trabajo</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comunes</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.comunes}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">No ocupacionales</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Requieren Vigilancia</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.requierenVigilancia}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Incluir en PVE</p>
        </Card>
      </div>

      {/* Buscador CIE-10 */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por código CIE-10 o nombre del diagnóstico..."
              value={searchCIE10}
              onChange={(e) => setSearchCIE10(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Diagnóstico
          </Button>
        </div>
      </Card>

      {/* Diagnosticos Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código CIE-10
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requiere PVE
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requiere Reporte
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDiagnosticos.map((diagnostico) => (
                <tr key={diagnostico.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {diagnostico.codigo_cie10}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-md">
                      <p className="font-medium">{diagnostico.nombre}</p>
                      {diagnostico.descripcion && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{diagnostico.descripcion}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={diagnostico.origen === 'OCUPACIONAL' ? 'danger' : 'primary'} size="sm">
                      {diagnostico.origen_display || formatEstado(diagnostico.origen)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {diagnostico.requiere_vigilancia ? (
                      <CheckCircle2 className="w-5 h-5 text-success-600 mx-auto" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {diagnostico.requiere_reporte_arl ? (
                      <AlertTriangle className="w-5 h-5 text-warning-600 mx-auto" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
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

      {filteredDiagnosticos.length === 0 && searchCIE10 && (
        <EmptyState
          icon={<Search className="w-16 h-16" />}
          title="No se encontraron resultados"
          description={`No hay diagnósticos que coincidan con "${searchCIE10}"`}
        />
      )}
    </div>
  );
};

// ==================== ESTADISTICAS Y REPORTES SECTION ====================

const EstadisticasReportesSection = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { data: estadisticas, isLoading } = useEstadisticaMedica(selectedYear, selectedMonth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-16 h-16" />}
        title="No hay estadísticas disponibles"
        description="Seleccione un período para ver las estadísticas de medicina laboral"
      />
    );
  }

  // Usar los campos directos del tipo EstadisticaMedica
  const porcentajeAptitud = estadisticas.porcentaje_aptitud || 0;
  const coberturaExamenes = estadisticas.porcentaje_cobertura_examenes || 0;
  const restricciones_activas = estadisticas.restricciones_activas || 0;
  const casos_vigilancia = estadisticas.casos_vigilancia_activos || 0;
  const top_diagnosticos = estadisticas.top_diagnosticos || [];

  // Resumen de exámenes
  const examenes_resumen = {
    total_examenes: estadisticas.examenes_realizados || 0,
    aptos: estadisticas.aptos || 0,
  };

  // Conceptos de aptitud
  const conceptos_aptitud = {
    APTO: estadisticas.aptos || 0,
    APTO_CON_RESTRICCIONES: estadisticas.aptos_con_restricciones || 0,
    NO_APTO: (estadisticas.no_aptos_temporal || 0) + (estadisticas.no_aptos_permanente || 0),
  };

  // Cobertura
  const cobertura_examenes = {
    realizados: estadisticas.examenes_realizados || 0,
    total_colaboradores: estadisticas.total_colaboradores || 0,
  };

  return (
    <div className="space-y-6">
      {/* Selector de Período */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="block w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {format(new Date(2024, month - 1), 'MMMM', { locale: es })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Generar Estadística
            </Button>
            <Button variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
              Exportar Reporte
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">% Aptitud</p>
            <p
              className={cn(
                'text-3xl font-bold mt-2',
                Number(porcentajeAptitud) >= 90
                  ? 'text-success-600 dark:text-success-400'
                  : Number(porcentajeAptitud) >= 70
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-danger-600 dark:text-danger-400'
              )}
            >
              {porcentajeAptitud}%
            </p>
            <Progress value={Number(porcentajeAptitud)} className="mt-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {examenes_resumen.aptos} de {examenes_resumen.total_examenes} aptos
            </p>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cobertura Exámenes</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">{coberturaExamenes}%</p>
            <Progress value={coberturaExamenes} className="mt-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {cobertura_examenes?.realizados || 0} de {cobertura_examenes?.total_colaboradores || 0} colaboradores
            </p>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Restricciones Activas</p>
            <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-2">
              {restricciones_activas}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <AlertOctagon className="w-5 h-5 text-warning-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Vigentes actualmente</p>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Casos PVE</p>
            <p className="text-3xl font-bold text-danger-600 dark:text-danger-400 mt-2">{casos_vigilancia}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-danger-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En seguimiento</p>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de exámenes (placeholder) */}
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Tendencia de Exámenes Médicos</h4>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Gráfico de tendencia mensual</p>
            </div>
          </div>
        </Card>

        {/* Distribución por concepto */}
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Distribución por Concepto de Aptitud</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Apto</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{conceptos_aptitud.APTO || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {examenes_resumen.total_examenes > 0
                    ? (((conceptos_aptitud.APTO || 0) / examenes_resumen.total_examenes) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Apto con Restricciones</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {conceptos_aptitud.APTO_CON_RESTRICCIONES || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {examenes_resumen.total_examenes > 0
                    ? (
                        ((conceptos_aptitud.APTO_CON_RESTRICCIONES || 0) / examenes_resumen.total_examenes) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-danger-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">No Apto</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{conceptos_aptitud.NO_APTO || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {examenes_resumen.total_examenes > 0
                    ? (((conceptos_aptitud.NO_APTO || 0) / examenes_resumen.total_examenes) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Diagnósticos */}
      {top_diagnosticos && top_diagnosticos.length > 0 && (
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Top Diagnósticos del Período (Últimos 10)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código CIE-10
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Diagnóstico
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Casos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Frecuencia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {top_diagnosticos.slice(0, 10).map((diag, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {diag.codigo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{diag.nombre}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white">
                      {diag.cantidad}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(diag.cantidad / (top_diagnosticos[0]?.cantidad || 1)) * 100}
                          className="flex-1"
                        />
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

// ==================== MAIN PAGE COMPONENT ====================

export default function MedicinaLaboralPage() {
  const [activeTab, setActiveTab] = useState('examenes');

  const tabs = [
    {
      id: 'examenes',
      label: 'Exámenes Médicos',
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      id: 'restricciones',
      label: 'Restricciones Médicas',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
    {
      id: 'vigilancia',
      label: 'Vigilancia Epidemiológica',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'diagnosticos',
      label: 'Diagnósticos Ocupacionales',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas y Reportes',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Medicina Laboral"
        description="Gestión integral de medicina del trabajo: exámenes médicos, restricciones, vigilancia epidemiológica y diagnósticos ocupacionales"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'examenes' && <ExamenesMedicosSection />}
        {activeTab === 'restricciones' && <RestriccionesMedicasSection />}
        {activeTab === 'vigilancia' && <VigilanciaEpidemiologicaSection />}
        {activeTab === 'diagnosticos' && <DiagnosticosOcupacionalesSection />}
        {activeTab === 'estadisticas' && <EstadisticasReportesSection />}
      </div>
    </div>
  );
}
