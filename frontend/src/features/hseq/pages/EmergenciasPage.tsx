/**
 * Página: Gestión de Emergencias HSEQ
 *
 * Sistema completo de gestión de emergencias con 6 subsecciones:
 * - Análisis de Vulnerabilidad
 * - Planes de Emergencia
 * - Planos de Evacuación
 * - Brigadas y Brigadistas
 * - Simulacros
 * - Recursos de Emergencia
 */
import { useState } from 'react';
import {
  Shield,
  FileText,
  Map,
  Users,
  Calendar,
  Package,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  XCircle,
  MapPin,
  Phone,
  User,
  Flame,
  Heart,
  Radio,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Tabs,
  Card,
  Button,
  EmptyState,
  Badge,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  StatusBadge,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import {
  useAnalisisVulnerabilidad,
  usePlanesEmergencia,
  usePlanosEvacuacion,
  useBrigadas,
  useSimulacros,
  useRecursosEmergencia,
} from '../hooks/useEmergencias';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type {
  AnalisisVulnerabilidadList,
  PlanEmergenciaList,
  PlanoEvacuacion,
  BrigadaList,
  SimulacroList,
  RecursoEmergenciaList,
  TipoRecursoEmergencia,
} from '../types/emergencias.types';

// ==================== UTILITY FUNCTIONS ====================

const getTipoRecursoIcon = (tipo: TipoRecursoEmergencia) => {
  const iconMap: Record<TipoRecursoEmergencia, React.ReactNode> = {
    EXTINTOR: <Flame className="w-4 h-4" />,
    BOTIQUIN: <Heart className="w-4 h-4" />,
    CAMILLA: <Activity className="w-4 h-4" />,
    ALARMA: <Radio className="w-4 h-4" />,
    SEÑALIZACION: <MapPin className="w-4 h-4" />,
    EQUIPO_COMUNICACION: <Phone className="w-4 h-4" />,
    LINTERNA: <Activity className="w-4 h-4" />,
    MEGAFONO: <Radio className="w-4 h-4" />,
    EQUIPO_RESCATE: <Users className="w-4 h-4" />,
    DESFIBRILADOR: <Heart className="w-4 h-4" />,
    OTRO: <Package className="w-4 h-4" />,
  };
  return iconMap[tipo] || <Package className="w-4 h-4" />;
};

/**
 * Variant overrides for statuses not covered by StatusBadge's built-in PROCESO_MAP.
 * Only statuses that fall through to 'gray' but need a specific color are listed here.
 */
const EMERGENCIAS_VARIANT_MAP: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'gray' | 'info'> = {
  ACTUALIZADO: 'primary',
  DESACTUALIZADO: 'danger',
  EN_FORMACION: 'warning',
  DISUELTA: 'danger',
  CONFIRMADO: 'primary',
  EVALUADO: 'success',
  POSPUESTO: 'warning',
  OPERATIVO: 'success',
  EN_MANTENIMIENTO: 'warning',
  FUERA_SERVICIO: 'danger',
  DADO_BAJA: 'gray',
};

/**
 * Returns a variant override for statuses not in the PROCESO_MAP,
 * or undefined to let StatusBadge resolve from its built-in maps.
 */
const getVariantOverride = (status: string) => EMERGENCIAS_VARIANT_MAP[status] || undefined;

// ==================== ANÁLISIS DE VULNERABILIDAD SECTION ====================

const AnalisisVulnerabilidadSection = () => {
  const { data, isLoading } = useAnalisisVulnerabilidad();
  const analisis = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!analisis || analisis.length === 0) {
    return (
      <EmptyState
        icon={<Shield className="w-16 h-16" />}
        title="No hay análisis de vulnerabilidad registrados"
        description="Comience identificando las amenazas y vulnerabilidades de la organización"
        action={{
          label: 'Nuevo Análisis',
          onClick: () => console.log('Nuevo Análisis'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: analisis.length,
    aprobados: analisis.filter((a) => a.estado === 'APROBADO').length,
    criticos: analisis.filter((a) => a.nivel_vulnerabilidad === 'CRITICO' || a.nivel_vulnerabilidad === 'ALTO').length,
    amenazasCriticas: analisis.reduce((acc, a) => acc + (a.amenazas_criticas || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Análisis"
          value={stats.total}
          icon={<Shield className="w-6 h-6" />}
          color="primary"
        />
        <KpiCard
          label="Aprobados"
          value={stats.aprobados}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Alto/Crítico"
          value={stats.criticos}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Amenazas Críticas"
          value={stats.amenazasCriticas}
          icon={<XCircle className="w-6 h-6" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Análisis de Vulnerabilidad"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{
          label: 'Nuevo Análisis',
          onClick: () => console.log('Nuevo Análisis'),
        }}
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amenazas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próx. Revisión</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analisis.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium truncate max-w-xs">{item.nombre}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatStatusLabel(item.tipo_amenaza)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={item.nivel_vulnerabilidad} preset="gravedad" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={item.estado}
                      preset="proceso"
                      variant={getVariantOverride(item.estado)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.total_amenazas}</span>
                    {item.amenazas_criticas && item.amenazas_criticas > 0 && (
                      <span className="text-danger-600 dark:text-danger-400 ml-1">({item.amenazas_criticas} críticas)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {item.proxima_revision ? format(new Date(item.proxima_revision), 'dd/MM/yyyy', { locale: es }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-danger-600" /></Button>
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

// ==================== PLANES DE EMERGENCIA SECTION ====================

const PlanesEmergenciaSection = () => {
  const { data, isLoading } = usePlanesEmergencia();
  const planes = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!planes || planes.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No hay planes de emergencia registrados"
        description="Comience creando el plan de emergencias de la organización"
        action={{
          label: 'Nuevo Plan',
          onClick: () => console.log('Nuevo Plan'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <SectionToolbar
        title="Planes de Emergencia"
        onExport={() => console.log('Exportar')}
        primaryAction={{
          label: 'Nuevo Plan',
          onClick: () => console.log('Nuevo Plan'),
        }}
      />

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {planes.map((plan) => (
          <Card key={plan.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{plan.codigo}</h4>
                    <StatusBadge
                      status={plan.estado}
                      preset="proceso"
                      variant={getVariantOverride(plan.estado)}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plan.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Versión {plan.version}</p>
                </div>
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.total_procedimientos}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Procedimientos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.total_planos}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Planos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.total_simulacros}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Simulacros</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Vigencia</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(plan.fecha_vigencia), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Próx. Revisión</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(plan.fecha_revision), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver</Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== PLANOS DE EVACUACIÓN SECTION ====================

const PlanosEvacuacionSection = () => {
  const { data, isLoading } = usePlanosEvacuacion();
  const planos = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!planos || planos.length === 0) {
    return (
      <EmptyState
        icon={<Map className="w-16 h-16" />}
        title="No hay planos de evacuación registrados"
        description="Comience cargando los planos de evacuación de las instalaciones"
        action={{
          label: 'Nuevo Plano',
          onClick: () => console.log('Nuevo Plano'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <SectionToolbar
        title="Planos de Evacuación"
        onFilter={() => console.log('Filtros')}
        primaryAction={{
          label: 'Nuevo Plano',
          onClick: () => console.log('Nuevo Plano'),
        }}
      />

      {/* Planos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <Card key={plano.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{plano.codigo}</p>
                  <h4 className="font-semibold text-gray-900 dark:text-white mt-1">{plano.nombre}</h4>
                </div>
                {plano.publicado ? (
                  <Badge variant="success" size="sm">Publicado</Badge>
                ) : (
                  <Badge variant="gray" size="sm">Borrador</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>{plano.edificio} - Piso {plano.piso}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Capacidad</p>
                  <p className="font-medium text-gray-900 dark:text-white">{plano.capacidad_personas} personas</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Rutas</p>
                  <p className="font-medium text-gray-900 dark:text-white">{plano.numero_rutas} rutas</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {plano.extintores} ext.
                </span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3" /> {plano.alarmas} alarm.
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {plano.botiquines} botiq.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver Plano</Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== BRIGADAS SECTION ====================

const BrigadasSection = () => {
  const { data, isLoading } = useBrigadas();
  const brigadas = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!brigadas || brigadas.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-16 h-16" />}
        title="No hay brigadas registradas"
        description="Comience conformando las brigadas de emergencia"
        action={{
          label: 'Nueva Brigada',
          onClick: () => console.log('Nueva Brigada'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const totalBrigadistas = brigadas.reduce((acc, b) => acc + (b.brigadistas_activos || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Brigadas"
          value={brigadas.length}
          icon={<Users className="w-6 h-6" />}
          color="primary"
        />
        <KpiCard
          label="Activas"
          value={brigadas.filter((b) => b.estado === 'ACTIVA').length}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Total Brigadistas"
          value={totalBrigadistas}
          icon={<User className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          label="En Formación"
          value={brigadas.filter((b) => b.estado === 'EN_FORMACION').length}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Brigadas de Emergencia"
        onExport={() => console.log('Exportar')}
        primaryAction={{
          label: 'Nueva Brigada',
          onClick: () => console.log('Nueva Brigada'),
        }}
      />

      {/* Brigadas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {brigadas.map((brigada) => (
          <Card key={brigada.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${brigada.tipo_brigada_color}20` }}
                  >
                    <Users className="w-5 h-5" style={{ color: brigada.tipo_brigada_color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{brigada.nombre}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{brigada.tipo_brigada_nombre}</p>
                  </div>
                </div>
                <StatusBadge
                  status={brigada.estado}
                  preset="proceso"
                  variant={getVariantOverride(brigada.estado)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Líder</span>
                  <span className="font-medium text-gray-900 dark:text-white">{brigada.lider_brigada}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Brigadistas</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {brigada.brigadistas_activos} / {brigada.numero_minimo_brigadistas}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    brigada.estado_capacidad === 'OPTIMO' && 'bg-success-500',
                    brigada.estado_capacidad === 'MINIMO' && 'bg-warning-500',
                    brigada.estado_capacidad === 'INSUFICIENTE' && 'bg-danger-500'
                  )}
                  style={{
                    width: `${Math.min((brigada.numero_brigadistas_actuales / brigada.numero_minimo_brigadistas) * 100, 100)}%`,
                  }}
                />
              </div>

              {brigada.fecha_proxima_capacitacion && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>Próx. capacitación: {format(new Date(brigada.fecha_proxima_capacitacion), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver</Button>
                <Button variant="ghost" size="sm" leftIcon={<Users className="w-4 h-4" />}>Brigadistas</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== SIMULACROS SECTION ====================

const SimulacrosSection = () => {
  const { data, isLoading } = useSimulacros();
  const simulacros = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!simulacros || simulacros.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-16 h-16" />}
        title="No hay simulacros registrados"
        description="Comience programando simulacros de emergencia"
        action={{
          label: 'Nuevo Simulacro',
          onClick: () => console.log('Nuevo Simulacro'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    programados: simulacros.filter((s) => s.estado === 'PROGRAMADO' || s.estado === 'CONFIRMADO').length,
    realizados: simulacros.filter((s) => s.estado === 'REALIZADO' || s.estado === 'EVALUADO').length,
    exitosos: simulacros.filter((s) => s.fue_exitoso).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Simulacros"
          value={simulacros.length}
          icon={<Calendar className="w-6 h-6" />}
          color="primary"
        />
        <KpiCard
          label="Programados"
          value={stats.programados}
          icon={<Clock className="w-6 h-6" />}
          color="info"
          valueColor="text-info-600 dark:text-info-400"
        />
        <KpiCard
          label="Realizados"
          value={stats.realizados}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Exitosos"
          value={stats.exitosos}
          icon={<Activity className="w-6 h-6" />}
          color="success"
          valueColor="text-success-600 dark:text-success-400"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Simulacros de Emergencia"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{
          label: 'Nuevo Simulacro',
          onClick: () => console.log('Nuevo Simulacro'),
        }}
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coordinador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resultado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {simulacros.map((simulacro) => (
                <tr key={simulacro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{simulacro.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium truncate max-w-xs">{simulacro.nombre}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {simulacro.tipo_simulacro_display || formatStatusLabel(simulacro.tipo_simulacro)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(simulacro.fecha_programada), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={simulacro.estado}
                      preset="proceso"
                      variant={getVariantOverride(simulacro.estado)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{simulacro.coordinador}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {simulacro.estado === 'REALIZADO' || simulacro.estado === 'EVALUADO' ? (
                      simulacro.fue_exitoso ? (
                        <Badge variant="success" size="sm">Exitoso</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">No Exitoso</Badge>
                      )
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><FileText className="w-4 h-4" /></Button>
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

// ==================== RECURSOS DE EMERGENCIA SECTION ====================

const RecursosEmergenciaSection = () => {
  const { data, isLoading } = useRecursosEmergencia();
  const recursos = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!recursos || recursos.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-16 h-16" />}
        title="No hay recursos de emergencia registrados"
        description="Comience registrando los equipos y recursos de emergencia"
        action={{
          label: 'Nuevo Recurso',
          onClick: () => console.log('Nuevo Recurso'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: recursos.length,
    operativos: recursos.filter((r) => r.estado === 'OPERATIVO').length,
    mantenimiento: recursos.filter((r) => r.estado === 'EN_MANTENIMIENTO').length,
    requierenInspeccion: recursos.filter((r) => r.requiere_inspeccion).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Recursos"
          value={stats.total}
          icon={<Package className="w-6 h-6" />}
          color="primary"
        />
        <KpiCard
          label="Operativos"
          value={stats.operativos}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="En Mantenimiento"
          value={stats.mantenimiento}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
        />
        <KpiCard
          label="Requieren Inspección"
          value={stats.requierenInspeccion}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Recursos de Emergencia"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{
          label: 'Nuevo Recurso',
          onClick: () => console.log('Nuevo Recurso'),
        }}
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próx. Inspección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recursos.map((recurso) => (
                <tr key={recurso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{recurso.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTipoRecursoIcon(recurso.tipo_recurso)}
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {recurso.tipo_recurso_display || formatStatusLabel(recurso.tipo_recurso)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{recurso.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>{recurso.area}</p>
                    <p className="text-xs text-gray-400">{recurso.ubicacion_especifica}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={recurso.estado}
                      preset="proceso"
                      variant={getVariantOverride(recurso.estado)}
                      label={recurso.estado_display || undefined}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {recurso.fecha_proxima_inspeccion ? (
                      <span className={cn(recurso.requiere_inspeccion && 'text-danger-600 dark:text-danger-400 font-medium')}>
                        {format(new Date(recurso.fecha_proxima_inspeccion), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{recurso.responsable}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><CheckCircle className="w-4 h-4" /></Button>
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

// ==================== MAIN PAGE COMPONENT ====================

export default function EmergenciasPage() {
  const [activeTab, setActiveTab] = useState('vulnerabilidad');

  const tabs = [
    {
      id: 'vulnerabilidad',
      label: 'Análisis Vulnerabilidad',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'planes',
      label: 'Planes Emergencia',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'planos',
      label: 'Planos Evacuación',
      icon: <Map className="w-4 h-4" />,
    },
    {
      id: 'brigadas',
      label: 'Brigadas',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'simulacros',
      label: 'Simulacros',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'recursos',
      label: 'Recursos',
      icon: <Package className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Emergencias"
        description="Análisis de vulnerabilidad, planes de emergencia, brigadas, simulacros y recursos de emergencia"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'vulnerabilidad' && <AnalisisVulnerabilidadSection />}
        {activeTab === 'planes' && <PlanesEmergenciaSection />}
        {activeTab === 'planos' && <PlanosEvacuacionSection />}
        {activeTab === 'brigadas' && <BrigadasSection />}
        {activeTab === 'simulacros' && <SimulacrosSection />}
        {activeTab === 'recursos' && <RecursosEmergenciaSection />}
      </div>
    </div>
  );
}
