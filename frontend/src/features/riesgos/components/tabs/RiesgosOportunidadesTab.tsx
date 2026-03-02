/**
 * RiesgosOportunidadesTab - Tab principal para gestión de riesgos y oportunidades
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Resumen ejecutivo de riesgos
 * - Mapa de calor interactivo
 * - Listado de riesgos
 * - Gestión de oportunidades
 * - Seguimiento de tratamientos
 */
import { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { Tooltip } from '@/components/common/Tooltip';
import { EmptyState } from '@/components/common/EmptyState';
import { MapaCalorRiesgos } from '@/features/riesgos/components/riesgos/MapaCalorRiesgos';
import { RiesgoCard } from '@/features/riesgos/components/riesgos/RiesgoCard';
import {
  LayoutDashboard,
  Flame,
  AlertTriangle,
  Target,
  TrendingUp,
  Activity,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Filter,
  Download,
  Plus,
  Zap,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import type {
  RiesgoProceso,
  Oportunidad,
  TratamientoRiesgo,
  NivelRiesgo,
  EstadoRiesgo,
  TipoRiesgo,
} from '@/features/riesgos/types/riesgos.types';

// ==================== INTERFACES LOCALES ====================

interface RiesgosOportunidadesTabProps {
  riesgos: RiesgoProceso[];
  oportunidades: Oportunidad[];
  tratamientos: TratamientoRiesgo[];
  onRiesgoClick?: (riesgo: RiesgoProceso) => void;
  onOportunidadClick?: (oportunidad: Oportunidad) => void;
  onTratamientoClick?: (tratamiento: TratamientoRiesgo) => void;
  onCreateRiesgo?: () => void;
  onCreateOportunidad?: () => void;
  onCreateTratamiento?: () => void;
  isLoading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

// ==================== SUB-COMPONENTES ====================

/**
 * KPICard - Tarjeta de indicador clave
 */
function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  className,
}: KPICardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20',
    success: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    warning: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/20',
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>{icon}</div>
      </div>
    </Card>
  );
}

/**
 * getNivelRiesgoLabel - Retorna etiqueta de nivel de riesgo
 */
function getNivelRiesgoLabel(nivel: number): string {
  if (nivel >= 15) return 'Critico';
  if (nivel >= 10) return 'Alto';
  if (nivel >= 5) return 'Moderado';
  return 'Bajo';
}

/**
 * getNivelRiesgoColor - Retorna color según nivel
 */
function getNivelRiesgoColor(nivel: number): string {
  if (nivel >= 15) return 'danger';
  if (nivel >= 10) return 'warning';
  if (nivel >= 5) return 'warning';
  return 'success';
}

/**
 * TIPO_LABELS - Etiquetas para tipos de riesgo
 */
const TIPO_LABELS: Record<TipoRiesgo, string> = {
  estrategico: 'Estratégico',
  operativo: 'Operativo',
  financiero: 'Financiero',
  cumplimiento: 'Cumplimiento',
  tecnologico: 'Tecnológico',
  reputacional: 'Reputacional',
};

/**
 * ESTADO_LABELS - Etiquetas para estados de riesgo
 */
const ESTADO_LABELS: Record<EstadoRiesgo, string> = {
  identificado: 'Identificado',
  en_tratamiento: 'En Tratamiento',
  controlado: 'Controlado',
  materializado: 'Materializado',
  cerrado: 'Cerrado',
};

/**
 * ESTADO_COLORS - Colores para estados
 */
const ESTADO_COLORS: Record<EstadoRiesgo, string> = {
  identificado: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  en_tratamiento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  controlado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  materializado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cerrado: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

// ==================== SECCIONES ====================

/**
 * ResumenSection - Dashboard ejecutivo de riesgos
 */
function ResumenSection({ riesgos, oportunidades, tratamientos }: {
  riesgos: RiesgoProceso[];
  oportunidades: Oportunidad[];
  tratamientos: TratamientoRiesgo[];
}) {
  const stats = useMemo(() => {
    const totalRiesgos = riesgos.length;
    const riesgosCriticos = riesgos.filter(r => r.nivel_residual >= 15).length;
    const riesgosAltos = riesgos.filter(r => r.nivel_residual >= 10 && r.nivel_residual < 15).length;
    const riesgosControlados = riesgos.filter(r => r.estado === 'controlado').length;

    const totalOportunidades = oportunidades.length;
    const oportunidadesEnEjecucion = oportunidades.filter(
      o => o.estado === 'en_ejecucion' || o.estado === 'aprobada'
    ).length;

    const totalTratamientos = tratamientos.length;
    const tratamientosActivos = tratamientos.filter(
      t => t.estado === 'en_proceso'
    ).length;
    const tratamientosCompletados = tratamientos.filter(
      t => t.estado === 'completado'
    ).length;

    // Calcular promedios
    const promedioNivelInherente =
      riesgos.reduce((sum, r) => sum + r.nivel_inherente, 0) / (totalRiesgos || 1);
    const promedioNivelResidual =
      riesgos.reduce((sum, r) => sum + r.nivel_residual, 0) / (totalRiesgos || 1);
    const reduccionPromedio =
      ((promedioNivelInherente - promedioNivelResidual) / promedioNivelInherente) * 100;

    return {
      totalRiesgos,
      riesgosCriticos,
      riesgosAltos,
      riesgosControlados,
      totalOportunidades,
      oportunidadesEnEjecucion,
      totalTratamientos,
      tratamientosActivos,
      tratamientosCompletados,
      reduccionPromedio: Math.round(reduccionPromedio),
    };
  }, [riesgos, oportunidades, tratamientos]);

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Riesgos Totales"
          value={stats.totalRiesgos}
          subtitle="Identificados y activos"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="primary"
        />
        <KPICard
          title="Riesgos Críticos"
          value={stats.riesgosCriticos}
          subtitle="Nivel ≥ 15 - Atención inmediata"
          icon={<Flame className="w-6 h-6" />}
          color="danger"
        />
        <KPICard
          title="Oportunidades"
          value={stats.totalOportunidades}
          subtitle={`${stats.oportunidadesEnEjecucion} en ejecución`}
          icon={<Target className="w-6 h-6" />}
          color="success"
        />
        <KPICard
          title="Reducción Promedio"
          value={`${stats.reduccionPromedio}%`}
          subtitle="Riesgo inherente vs residual"
          icon={<TrendingUp className="w-6 h-6" />}
          color="success"
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Distribución por Nivel
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Críticos</span>
              <span className="text-sm font-medium text-red-600">{stats.riesgosCriticos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Altos</span>
              <span className="text-sm font-medium text-orange-600">{stats.riesgosAltos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Controlados</span>
              <span className="text-sm font-medium text-green-600">{stats.riesgosControlados}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tratamientos Activos
            </h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-sm font-medium">{stats.totalTratamientos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">En Proceso</span>
              <span className="text-sm font-medium text-blue-600">{stats.tratamientosActivos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completados</span>
              <span className="text-sm font-medium text-green-600">{stats.tratamientosCompletados}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado de Oportunidades
            </h3>
            <Zap className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-sm font-medium">{stats.totalOportunidades}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">En Ejecución</span>
              <span className="text-sm font-medium text-blue-600">{stats.oportunidadesEnEjecucion}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Implementadas</span>
              <span className="text-sm font-medium text-green-600">
                {oportunidades.filter(o => o.estado === 'implementada').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top 5 riesgos críticos */}
      {stats.riesgosCriticos > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Riesgos Críticos - Atención Prioritaria
            </h3>
            <Flame className="w-5 h-5 text-red-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riesgos
              .filter(r => r.nivel_residual >= 15)
              .slice(0, 6)
              .map(riesgo => (
                <RiesgoCard
                  key={riesgo.id}
                  codigo={riesgo.codigo}
                  nombre={riesgo.nombre}
                  tipo={riesgo.tipo}
                  nivelInherente={riesgo.nivel_inherente}
                  nivelResidual={riesgo.nivel_residual}
                  estado={riesgo.estado}
                  onClick={() => {}}
                />
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * MapaCalorSection - Visualización de matriz de riesgos
 */
function MapaCalorSection({ riesgos, onRiesgoClick }: {
  riesgos: RiesgoProceso[];
  onRiesgoClick?: (riesgo: RiesgoProceso) => void;
}) {
  const [tipoMapa, setTipoMapa] = useState<'inherente' | 'residual'>('residual');
  const [selectedCell, setSelectedCell] = useState<{
    probabilidad: number;
    impacto: number;
    riesgos: any[];
  } | null>(null);

  const handleCellClick = (probabilidad: number, impacto: number, riesgosEnCelda: any[]) => {
    setSelectedCell({ probabilidad, impacto, riesgos: riesgosEnCelda });
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Mapa de Calor de Riesgos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Visualización de probabilidad vs impacto
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip
              content="Riesgo inherente: nivel de riesgo antes de aplicar controles. Representa el riesgo en su estado natural."
              position="top"
            >
              <Button
                variant={tipoMapa === 'inherente' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTipoMapa('inherente')}
              >
                Inherente
              </Button>
            </Tooltip>
            <Tooltip
              content="Riesgo residual: nivel de riesgo que permanece después de aplicar los controles existentes."
              position="top"
            >
              <Button
                variant={tipoMapa === 'residual' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTipoMapa('residual')}
              >
                Residual
              </Button>
            </Tooltip>
            <Tooltip
              content="Probabilidad (1=Raro, 5=Casi Seguro) × Impacto (1=Insignificante, 5=Catastrófico). Nivel Crítico ≥15, Alto ≥10, Moderado ≥5, Bajo <5."
              position="left"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
        </div>
      </Card>

      {/* Mapa de calor */}
      <Card padding="lg">
        <MapaCalorRiesgos
          riesgos={riesgos}
          tipo={tipoMapa}
          onCellClick={handleCellClick}
        />
      </Card>

      {/* Detalle de celda seleccionada */}
      {selectedCell && selectedCell.riesgos.length > 0 && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Riesgos en celda seleccionada
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Probabilidad: {selectedCell.probabilidad} | Impacto: {selectedCell.impacto} |
              Nivel: {selectedCell.probabilidad * selectedCell.impacto}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCell.riesgos.map((riesgo) => (
              <RiesgoCard
                key={riesgo.id}
                codigo={riesgo.codigo}
                nombre={riesgo.nombre}
                tipo={riesgo.tipo}
                nivelInherente={riesgo.nivel_inherente}
                nivelResidual={riesgo.nivel_residual}
                estado={riesgo.estado}
                onClick={() => onRiesgoClick?.(riesgo)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * RiesgosSection - Listado completo de riesgos
 */
function RiesgosSection({ riesgos, onRiesgoClick, onCreateRiesgo }: {
  riesgos: RiesgoProceso[];
  onRiesgoClick?: (riesgo: RiesgoProceso) => void;
  onCreateRiesgo?: () => void;
}) {
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    estado: 'todos',
    nivelMinimo: 0,
  });

  const riesgosFiltrados = useMemo(() => {
    return riesgos.filter((riesgo) => {
      if (filtros.tipo !== 'todos' && riesgo.tipo !== filtros.tipo) return false;
      if (filtros.estado !== 'todos' && riesgo.estado !== filtros.estado) return false;
      if (riesgo.nivel_residual < filtros.nivelMinimo) return false;
      return true;
    });
  }, [riesgos, filtros]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Registro de Riesgos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {riesgosFiltrados.length} de {riesgos.length} riesgos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
              Filtros
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Exportar
            </Button>
            {onCreateRiesgo && (
              <Button size="sm" onClick={onCreateRiesgo} leftIcon={<Plus className="w-4 h-4" />}>
                Nuevo Riesgo
              </Button>
            )}
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltros({ ...filtros, nivelMinimo: 0 })}
            className={filtros.nivelMinimo === 0 ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400' : ''}
          >
            Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltros({ ...filtros, nivelMinimo: 15 })}
            className={filtros.nivelMinimo === 15 ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400' : ''}
          >
            Críticos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltros({ ...filtros, nivelMinimo: 10 })}
            className={filtros.nivelMinimo === 10 ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400' : ''}
          >
            Altos
          </Button>
        </div>
      </Card>

      {/* Grid de riesgos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riesgosFiltrados.map((riesgo) => (
          <RiesgoCard
            key={riesgo.id}
            codigo={riesgo.codigo}
            nombre={riesgo.nombre}
            tipo={riesgo.tipo}
            nivelInherente={riesgo.nivel_inherente}
            nivelResidual={riesgo.nivel_residual}
            estado={riesgo.estado}
            onClick={() => onRiesgoClick?.(riesgo)}
          />
        ))}
      </div>

      {riesgosFiltrados.length === 0 && (
        <Card>
          <EmptyState
            icon={<AlertTriangle className="w-12 h-12" />}
            title={riesgos.length === 0 ? 'No hay riesgos registrados' : 'No se encontraron riesgos'}
            description={
              riesgos.length === 0
                ? 'Comienza identificando los riesgos que pueden afectar los procesos de tu organización. Haz clic en "Nuevo Riesgo" para registrar el primero.'
                : 'No hay riesgos que coincidan con los filtros aplicados. Intenta con otros criterios.'
            }
            action={
              riesgos.length === 0 && onCreateRiesgo
                ? { label: 'Nuevo Riesgo', onClick: onCreateRiesgo, icon: <Plus className="w-4 h-4" /> }
                : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}

/**
 * OportunidadesSection - Gestión de oportunidades
 */
function OportunidadesSection({ oportunidades, onOportunidadClick, onCreateOportunidad }: {
  oportunidades: Oportunidad[];
  onOportunidadClick?: (oportunidad: Oportunidad) => void;
  onCreateOportunidad?: () => void;
}) {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const oportunidadesFiltradas = useMemo(() => {
    if (filtroEstado === 'todos') return oportunidades;
    return oportunidades.filter(o => o.estado === filtroEstado);
  }, [oportunidades, filtroEstado]);

  const getEstadoColor = (estado: Oportunidad['estado']): string => {
    const colors = {
      identificada: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      en_evaluacion: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      aprobada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      en_ejecucion: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      implementada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rechazada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[estado] || colors.identificada;
  };

  const getFactibilidadColor = (factibilidad: Oportunidad['factibilidad']): string => {
    const colors = {
      alta: 'text-green-600',
      media: 'text-yellow-600',
      baja: 'text-red-600',
    };
    return colors[factibilidad];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Registro de Oportunidades
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {oportunidadesFiltradas.length} de {oportunidades.length} oportunidades
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Exportar
            </Button>
            {onCreateOportunidad && (
              <Button size="sm" onClick={onCreateOportunidad} leftIcon={<Plus className="w-4 h-4" />}>
                Nueva Oportunidad
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroEstado('todos')}
            className={filtroEstado === 'todos' ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400' : ''}
          >
            Todas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroEstado('en_ejecucion')}
            className={filtroEstado === 'en_ejecucion' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
          >
            En Ejecución
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroEstado('implementada')}
            className={filtroEstado === 'implementada' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' : ''}
          >
            Implementadas
          </Button>
        </div>
      </Card>

      {/* Grid de oportunidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {oportunidadesFiltradas.map((oportunidad) => (
          <Card
            key={oportunidad.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onOportunidadClick?.(oportunidad)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                  {oportunidad.codigo}
                </span>
              </div>
              <span className={cn('text-xs px-2 py-1 rounded', getEstadoColor(oportunidad.estado))}>
                {oportunidad.estado.replace('_', ' ')}
              </span>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {oportunidad.nombre}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
              {oportunidad.descripcion}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-500">Factibilidad:</span>
                <p className={cn('font-medium capitalize', getFactibilidadColor(oportunidad.factibilidad))}>
                  {oportunidad.factibilidad}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-500">Impacto:</span>
                <p className="font-medium">
                  {oportunidad.impacto_beneficio}/5
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-500">Área:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {oportunidad.area_responsable}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-500">Origen:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100 uppercase">
                  {oportunidad.origen}
                </p>
              </div>
            </div>

            {oportunidad.costo_estimado && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500">Inversión estimada:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(oportunidad.costo_estimado)}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {oportunidadesFiltradas.length === 0 && (
        <Card>
          <EmptyState
            icon={<Target className="w-12 h-12" />}
            title={oportunidades.length === 0 ? 'No hay oportunidades registradas' : 'No se encontraron oportunidades'}
            description={
              oportunidades.length === 0
                ? 'Las oportunidades son situaciones favorables que pueden mejorar los procesos. Identifica y registra oportunidades de mejora para tu organización.'
                : 'No hay oportunidades que coincidan con el filtro seleccionado. Prueba con otro estado.'
            }
            action={
              oportunidades.length === 0 && onCreateOportunidad
                ? { label: 'Nueva Oportunidad', onClick: onCreateOportunidad, icon: <Plus className="w-4 h-4" /> }
                : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}

/**
 * TratamientosSection - Seguimiento de tratamientos
 */
function TratamientosSection({ tratamientos, riesgos, onTratamientoClick, onCreateTratamiento }: {
  tratamientos: TratamientoRiesgo[];
  riesgos: RiesgoProceso[];
  onTratamientoClick?: (tratamiento: TratamientoRiesgo) => void;
  onCreateTratamiento?: () => void;
}) {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const tratamientosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return tratamientos;
    return tratamientos.filter(t => t.estado === filtroEstado);
  }, [tratamientos, filtroEstado]);

  // Obtener riesgo asociado
  const getRiesgo = (riesgoId: number) => riesgos.find(r => r.id === riesgoId);

  const getEstadoColor = (estado: TratamientoRiesgo['estado']): string => {
    const colors = {
      pendiente: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      en_proceso: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[estado] || colors.pendiente;
  };

  const getTipoTratamientoIcon = (tipo: TratamientoRiesgo['tipo']) => {
    const icons = {
      evitar: <XCircle className="w-5 h-5 text-red-500" />,
      mitigar: <Shield className="w-5 h-5 text-blue-500" />,
      transferir: <Users className="w-5 h-5 text-purple-500" />,
      aceptar: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    };
    return icons[tipo];
  };

  const getTipoTratamientoLabel = (tipo: TratamientoRiesgo['tipo']): string => {
    const labels = {
      evitar: 'Evitar',
      mitigar: 'Mitigar',
      transferir: 'Transferir',
      aceptar: 'Aceptar',
    };
    return labels[tipo];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Planes de Tratamiento
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {tratamientosFiltrados.length} de {tratamientos.length} tratamientos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Exportar
            </Button>
            {onCreateTratamiento && (
              <Button size="sm" onClick={onCreateTratamiento} leftIcon={<Plus className="w-4 h-4" />}>
                Nuevo Tratamiento
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroEstado('todos')}
            className={filtroEstado === 'todos' ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400' : ''}
          >
            Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroEstado('en_proceso')}
            className={filtroEstado === 'en_proceso' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400' : ''}
          >
            En Proceso
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroEstado('completado')}
            className={filtroEstado === 'completado' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' : ''}
          >
            Completados
          </Button>
        </div>
      </Card>

      {/* Lista de tratamientos */}
      <div className="space-y-4">
        {tratamientosFiltrados.map((tratamiento) => {
          const riesgo = getRiesgo(tratamiento.riesgo);
          return (
            <Card
              key={tratamiento.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onTratamientoClick?.(tratamiento)}
            >
              <div className="flex items-start gap-4">
                {/* Icono de tipo */}
                <div className="flex-shrink-0 mt-1">
                  {getTipoTratamientoIcon(tratamiento.tipo)}
                </div>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {getTipoTratamientoLabel(tratamiento.tipo)}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded', getEstadoColor(tratamiento.estado))}>
                          {tratamiento.estado.replace('_', ' ')}
                        </span>
                      </div>
                      {riesgo && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-mono">{riesgo.codigo}</span> - {riesgo.nombre}
                        </p>
                      )}
                    </div>
                    {tratamiento.responsable_detail && (
                      <div className="text-xs text-gray-500 text-right">
                        <Users className="w-4 h-4 inline mr-1" />
                        {tratamiento.responsable_detail.first_name} {tratamiento.responsable_detail.last_name}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {tratamiento.descripcion}
                  </p>

                  {/* Barra de progreso */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Progreso</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {tratamiento.porcentaje_avance}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all"
                        style={{ width: `${tratamiento.porcentaje_avance}%` }}
                      />
                    </div>
                  </div>

                  {/* Fechas y costo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {tratamiento.fecha_inicio && (
                      <div>
                        <span className="text-gray-500 block">Inicio</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatDate(tratamiento.fecha_inicio)}
                        </span>
                      </div>
                    )}
                    {tratamiento.fecha_fin_planeada && (
                      <div>
                        <span className="text-gray-500 block">Fin Planeado</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatDate(tratamiento.fecha_fin_planeada)}
                        </span>
                      </div>
                    )}
                    {tratamiento.costo_estimado && (
                      <div>
                        <span className="text-gray-500 block">Costo</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatCurrency(tratamiento.costo_estimado)}
                        </span>
                      </div>
                    )}
                    {tratamiento.tareas && (
                      <div>
                        <span className="text-gray-500 block">Tareas</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {tratamiento.tareas.filter(t => t.completada).length}/{tratamiento.tareas.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {tratamientosFiltrados.length === 0 && (
        <Card>
          <EmptyState
            icon={<Shield className="w-12 h-12" />}
            title={tratamientos.length === 0 ? 'No hay planes de tratamiento registrados' : 'No se encontraron tratamientos'}
            description={
              tratamientos.length === 0
                ? 'Los planes de tratamiento definen las acciones para mitigar, evitar, transferir o aceptar los riesgos identificados. Crea un plan para cada riesgo que requiera intervención.'
                : 'No hay tratamientos que coincidan con el estado seleccionado. Prueba con otro filtro.'
            }
            action={
              tratamientos.length === 0 && onCreateTratamiento
                ? { label: 'Nuevo Tratamiento', onClick: onCreateTratamiento, icon: <Plus className="w-4 h-4" /> }
                : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

/**
 * RiesgosOportunidadesTab - Componente principal
 */
export function RiesgosOportunidadesTab({
  riesgos,
  oportunidades,
  tratamientos,
  onRiesgoClick,
  onOportunidadClick,
  onTratamientoClick,
  onCreateRiesgo,
  onCreateOportunidad,
  onCreateTratamiento,
  isLoading = false,
}: RiesgosOportunidadesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('resumen');

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'mapa_calor', label: 'Mapa de Calor', icon: <Flame className="w-4 h-4" /> },
    { id: 'riesgos', label: 'Riesgos', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'oportunidades', label: 'Oportunidades', icon: <Target className="w-4 h-4" /> },
    { id: 'tratamientos', label: 'Tratamientos', icon: <Shield className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subtabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
        variant="pills"
      />

      {/* Contenido según subtab activo */}
      <div>
        {activeSubTab === 'resumen' && (
          <ResumenSection
            riesgos={riesgos}
            oportunidades={oportunidades}
            tratamientos={tratamientos}
          />
        )}

        {activeSubTab === 'mapa_calor' && (
          <MapaCalorSection riesgos={riesgos} onRiesgoClick={onRiesgoClick} />
        )}

        {activeSubTab === 'riesgos' && (
          <RiesgosSection
            riesgos={riesgos}
            onRiesgoClick={onRiesgoClick}
            onCreateRiesgo={onCreateRiesgo}
          />
        )}

        {activeSubTab === 'oportunidades' && (
          <OportunidadesSection
            oportunidades={oportunidades}
            onOportunidadClick={onOportunidadClick}
            onCreateOportunidad={onCreateOportunidad}
          />
        )}

        {activeSubTab === 'tratamientos' && (
          <TratamientosSection
            tratamientos={tratamientos}
            riesgos={riesgos}
            onTratamientoClick={onTratamientoClick}
            onCreateTratamiento={onCreateTratamiento}
          />
        )}
      </div>
    </div>
  );
}

export default RiesgosOportunidadesTab;
