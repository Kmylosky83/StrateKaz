/**
 * Página: Acciones por Indicador
 *
 * Planes de acción para mejorar KPIs con 4 tabs:
 * - Planes de Acción
 * - Actividades
 * - Seguimiento
 * - Integración AC
 */
import { useState } from 'react';
import {
  Target,
  ClipboardList,
  TrendingUp,
  Link2,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Play,
  Search,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockPlanes = [
  {
    id: 1,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia',
    codigo_plan: 'PLAN-KPI-001',
    titulo: 'Reducir Accidentalidad en Área de Producción',
    estado: 'en_ejecucion',
    prioridad: 'alta',
    valor_actual: 2.8,
    meta_objetivo: 2.0,
    brecha: 0.8,
    fecha_inicio: '2024-11-01',
    fecha_fin_prevista: '2025-03-31',
    responsable_nombre: 'María García - SST',
    presupuesto_estimado: 15000000,
    presupuesto_ejecutado: 8500000,
  },
  {
    id: 2,
    kpi_codigo: 'KPI-FIN-001',
    kpi_nombre: 'EBITDA Mensual',
    codigo_plan: 'PLAN-KPI-002',
    titulo: 'Incrementar EBITDA mediante Optimización de Costos',
    estado: 'aprobado',
    prioridad: 'critica',
    valor_actual: 16.5,
    meta_objetivo: 18.0,
    brecha: 1.5,
    fecha_inicio: '2025-01-01',
    fecha_fin_prevista: '2025-06-30',
    responsable_nombre: 'Carlos Rodríguez - Finanzas',
    presupuesto_estimado: 25000000,
    presupuesto_ejecutado: 0,
  },
  {
    id: 3,
    kpi_codigo: 'KPI-OP-001',
    kpi_nombre: 'Eficiencia Operacional',
    codigo_plan: 'PLAN-KPI-003',
    titulo: 'Mejorar Eficiencia mediante Automatización',
    estado: 'propuesto',
    prioridad: 'media',
    valor_actual: 87.5,
    meta_objetivo: 92.0,
    brecha: 4.5,
    fecha_inicio: '2025-02-01',
    fecha_fin_prevista: '2025-08-31',
    responsable_nombre: 'Ana López - Operaciones',
    presupuesto_estimado: 45000000,
  },
  {
    id: 4,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia',
    codigo_plan: 'PLAN-KPI-004',
    titulo: 'Programa de Capacitación en Seguridad',
    estado: 'completado',
    prioridad: 'alta',
    valor_actual: 2.0,
    meta_objetivo: 2.5,
    brecha: -0.5,
    fecha_inicio: '2024-07-01',
    fecha_fin_prevista: '2024-10-31',
    fecha_fin_real: '2024-10-28',
    responsable_nombre: 'María García - SST',
    presupuesto_estimado: 8000000,
    presupuesto_ejecutado: 7800000,
  },
];

const mockActividades = [
  {
    id: 1,
    plan_accion: 1,
    codigo_actividad: 'ACT-001',
    nombre: 'Capacitación en Prevención de Riesgos',
    responsable_nombre: 'Pedro Martínez',
    fecha_inicio: '2024-11-05',
    fecha_fin: '2024-11-30',
    estado: 'completada',
    porcentaje_avance: 100,
  },
  {
    id: 2,
    plan_accion: 1,
    codigo_actividad: 'ACT-002',
    nombre: 'Renovación de EPP',
    responsable_nombre: 'Laura Sánchez',
    fecha_inicio: '2024-11-15',
    fecha_fin: '2024-12-15',
    estado: 'en_proceso',
    porcentaje_avance: 75,
  },
  {
    id: 3,
    plan_accion: 1,
    codigo_actividad: 'ACT-003',
    nombre: 'Inspecciones Semanales de Seguridad',
    responsable_nombre: 'María García',
    fecha_inicio: '2024-12-01',
    fecha_fin: '2025-03-31',
    estado: 'en_proceso',
    porcentaje_avance: 30,
  },
  {
    id: 4,
    plan_accion: 2,
    codigo_actividad: 'ACT-004',
    nombre: 'Análisis de Costos Operacionales',
    responsable_nombre: 'Carlos Rodríguez',
    fecha_inicio: '2025-01-01',
    fecha_fin: '2025-02-15',
    estado: 'pendiente',
    porcentaje_avance: 0,
  },
];

const mockSeguimientos = [
  {
    id: 1,
    plan_accion: 1,
    fecha_seguimiento: '2024-12-15',
    porcentaje_avance_general: 65,
    avances_logrados: '2 de 3 actividades en ejecución. Capacitación completada exitosamente.',
    valor_kpi_actual: 2.6,
    variacion_vs_inicio: -0.2,
    cumple_cronograma: true,
    registrado_por_nombre: 'María García',
  },
  {
    id: 2,
    plan_accion: 1,
    fecha_seguimiento: '2024-11-30',
    porcentaje_avance_general: 35,
    avances_logrados: 'Capacitación en fase final. Inicio renovación EPP.',
    valor_kpi_actual: 2.7,
    variacion_vs_inicio: -0.1,
    cumple_cronograma: true,
    registrado_por_nombre: 'María García',
  },
  {
    id: 3,
    plan_accion: 1,
    fecha_seguimiento: '2024-11-15',
    porcentaje_avance_general: 15,
    avances_logrados: 'Inicio del programa de capacitación.',
    dificultades_encontradas: 'Retraso en convocatoria de personal turno nocturno',
    valor_kpi_actual: 2.8,
    variacion_vs_inicio: 0,
    cumple_cronograma: false,
    registrado_por_nombre: 'María García',
  },
];

const mockIntegraciones = [
  {
    id: 1,
    plan_accion_kpi: 1,
    plan_codigo: 'PLAN-KPI-001',
    accion_correctiva_codigo: 'AC-SST-2024-008',
    tipo_vinculo: 'origen',
    descripcion_vinculo: 'Plan generado a partir de hallazgo de auditoría interna',
    fecha_vinculacion: '2024-11-01',
    vinculado_por_nombre: 'María García',
  },
  {
    id: 2,
    plan_accion_kpi: 1,
    plan_codigo: 'PLAN-KPI-001',
    accion_correctiva_codigo: 'AC-SST-2024-012',
    tipo_vinculo: 'relacionada',
    descripcion_vinculo: 'Acción correctiva complementaria del mismo proceso',
    fecha_vinculacion: '2024-11-15',
    vinculado_por_nombre: 'Pedro Martínez',
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getEstadoPlanColor = (estado: string) => {
  const colors = {
    propuesto: 'bg-gray-100 text-gray-800',
    aprobado: 'bg-blue-100 text-blue-800',
    en_ejecucion: 'bg-yellow-100 text-yellow-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  };
  return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getPrioridadColor = (prioridad: string) => {
  const colors = {
    baja: 'bg-blue-100 text-blue-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  return colors[prioridad as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getEstadoActividadIcon = (estado: string) => {
  if (estado === 'completada') return <CheckCircle className="w-4 h-4 text-success-600" />;
  if (estado === 'en_proceso') return <Clock className="w-4 h-4 text-warning-600" />;
  if (estado === 'pendiente') return <Play className="w-4 h-4 text-gray-400" />;
  return <Clock className="w-4 h-4 text-gray-400" />;
};

// ==================== SECTIONS ====================

const PlanesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const planes = mockPlanes;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar planes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Plan
        </Button>
      </div>

      {/* Grid de Planes */}
      <div className="grid grid-cols-1 gap-4">
        {planes.map((plan) => (
          <Card key={plan.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {plan.titulo}
                    </h4>
                    <Badge
                      variant="gray"
                      size="sm"
                      className={getEstadoPlanColor(plan.estado)}
                    >
                      {plan.estado.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant="gray"
                      size="sm"
                      className={getPrioridadColor(plan.prioridad)}
                    >
                      {plan.prioridad}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.codigo_plan} - KPI: {plan.kpi_nombre} ({plan.kpi_codigo})
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Valor Actual
                  </label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {plan.valor_actual}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Meta Objetivo
                  </label>
                  <p className="text-lg font-bold text-primary-600 mt-1">
                    {plan.meta_objetivo}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Brecha
                  </label>
                  <p className={cn(
                    "text-lg font-bold mt-1",
                    plan.brecha > 0 ? 'text-danger-600' : 'text-success-600'
                  )}>
                    {plan.brecha > 0 ? '+' : ''}{plan.brecha}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Presupuesto
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    ${(plan.presupuesto_ejecutado || 0).toLocaleString()} / ${plan.presupuesto_estimado.toLocaleString()}
                  </p>
                  {plan.presupuesto_estimado > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(((plan.presupuesto_ejecutado || 0) / plan.presupuesto_estimado) * 100, 100)}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Responsable:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {plan.responsable_nombre}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Plazo:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {plan.fecha_inicio} - {plan.fecha_fin_real || plan.fecha_fin_prevista}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ActividadesSection = () => {
  const actividades = mockActividades;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Actividades de Planes
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Actividad
        </Button>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Fin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Avance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {actividades.map((actividad) => (
                <tr
                  key={actividad.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {actividad.codigo_actividad}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {actividad.nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {actividad.responsable_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {actividad.fecha_inicio}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {actividad.fecha_fin}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getEstadoActividadIcon(actividad.estado)}
                      <Badge
                        variant={
                          actividad.estado === 'completada'
                            ? 'success'
                            : actividad.estado === 'en_proceso'
                            ? 'warning'
                            : 'gray'
                        }
                        size="sm"
                      >
                        {actividad.estado.replace('_', ' ')}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {actividad.porcentaje_avance}%
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            actividad.porcentaje_avance === 100
                              ? 'bg-success-600'
                              : actividad.porcentaje_avance >= 50
                              ? 'bg-primary-600'
                              : 'bg-warning-600'
                          )}
                          style={{ width: `${actividad.porcentaje_avance}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
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

const SeguimientoSection = () => {
  const seguimientos = mockSeguimientos;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Seguimientos de Planes
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Seguimiento
        </Button>
      </div>

      {/* Grid de Seguimientos */}
      <div className="grid grid-cols-1 gap-4">
        {seguimientos.map((seg) => (
          <Card key={seg.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Seguimiento - {seg.fecha_seguimiento}
                    </h4>
                    {seg.cumple_cronograma ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        En Cronograma
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        Atrasado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Registrado por: {seg.registrado_por_nombre}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {seg.porcentaje_avance_general}%
                  </p>
                  <p className="text-xs text-gray-500">Avance General</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${seg.porcentaje_avance_general}%` }}
                />
              </div>

              {seg.valor_kpi_actual && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Valor KPI Actual
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {seg.valor_kpi_actual}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Variación vs Inicio
                    </label>
                    <p className={cn(
                      "text-lg font-bold mt-1",
                      seg.variacion_vs_inicio < 0 ? 'text-success-600' : 'text-danger-600'
                    )}>
                      {seg.variacion_vs_inicio > 0 ? '+' : ''}{seg.variacion_vs_inicio}
                      <TrendingUp className="w-4 h-4 inline ml-1" />
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Avances Logrados
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {seg.avances_logrados}
                  </p>
                </div>
                {seg.dificultades_encontradas && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Dificultades
                    </label>
                    <p className="text-sm text-danger-700 dark:text-danger-300 mt-1">
                      {seg.dificultades_encontradas}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const IntegracionSection = () => {
  const integraciones = mockIntegraciones;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Integración con Acciones Correctivas
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Vinculación
        </Button>
      </div>

      {/* Info Card */}
      <Card variant="bordered" padding="md" className="bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Trazabilidad con Sistema HSEQ
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Los planes de acción de KPIs pueden vincularse con acciones correctivas del módulo HSEQ para mantener trazabilidad completa.
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plan KPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acción Correctiva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo Vínculo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Vinculación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vinculado Por
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {integraciones.map((int) => (
                <tr
                  key={int.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {int.plan_codigo}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary-600">
                    {int.accion_correctiva_codigo}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info" size="sm">
                      {int.tipo_vinculo}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {int.descripcion_vinculo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {int.fecha_vinculacion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {int.vinculado_por_nombre}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
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

// ==================== MAIN COMPONENT ====================

export default function AccionesIndicadorPage() {
  const [activeTab, setActiveTab] = useState('planes');

  const tabs = [
    { id: 'planes', label: 'Planes de Acción', icon: <Target className="w-4 h-4" /> },
    { id: 'actividades', label: 'Actividades', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'seguimiento', label: 'Seguimiento', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'integracion', label: 'Integración AC', icon: <Link2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Acciones por Indicador"
        description="Planes de acción y actividades para mejorar el desempeño de KPIs"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'planes' && <PlanesSection />}
        {activeTab === 'actividades' && <ActividadesSection />}
        {activeTab === 'seguimiento' && <SeguimientoSection />}
        {activeTab === 'integracion' && <IntegracionSection />}
      </div>
    </div>
  );
}
