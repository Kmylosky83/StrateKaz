/**
 * Pagina: Presupuesto
 *
 * Tabs: Presupuestos, Ejecuciones, Centros/Rubros, Aprobaciones
 * Conectada a hooks reales del backend.
 */
import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  DollarSign,
  FileText,
  Loader2,
  FolderTree,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import {
  usePresupuestos,
  useResumenEjecucion,
  useEjecuciones,
  useCentrosCosto,
  useRubros,
  useAprobaciones,
} from '../hooks';
import type {
  PresupuestoPorAreaList,
  EjecucionList,
  CentroCostoList,
  RubroList,
  AprobacionList,
} from '../types';

// ==================== HELPERS ====================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);

const dec = (val: string | number | undefined | null): number =>
  val != null ? Number(val) || 0 : 0;

const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  return ((data as { results?: T[] }).results ?? []) as T[];
};

const getEstadoBadge = (estado: string) => {
  const map: Record<
    string,
    { variant: 'success' | 'warning' | 'danger' | 'primary' | 'gray'; label: string }
  > = {
    borrador: { variant: 'gray', label: 'Borrador' },
    aprobado: { variant: 'success', label: 'Aprobado' },
    en_ejecucion: { variant: 'primary', label: 'En ejecucion' },
    cerrado: { variant: 'gray', label: 'Cerrado' },
    registrada: { variant: 'primary', label: 'Registrada' },
    aprobada: { variant: 'success', label: 'Aprobada' },
    anulada: { variant: 'danger', label: 'Anulada' },
    pendiente: { variant: 'warning', label: 'Pendiente' },
    rechazado: { variant: 'danger', label: 'Rechazado' },
    activo: { variant: 'success', label: 'Activo' },
    inactivo: { variant: 'gray', label: 'Inactivo' },
  };
  return map[estado] ?? { variant: 'gray' as const, label: estado };
};

// ==================== SECTIONS ====================

const PresupuestosSection = () => {
  const { data: presupuestosData, isLoading } = usePresupuestos();
  const { data: resumen } = useResumenEjecucion();

  const presupuestos = extractResults<PresupuestoPorAreaList>(presupuestosData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const totalAsignado = dec(resumen?.total_asignado);
  const totalEjecutado = dec(resumen?.total_ejecutado);
  const totalDisponible = dec(resumen?.total_disponible);
  const pctEjecucion = dec(resumen?.porcentaje_ejecucion);
  const porArea = resumen?.por_area ?? [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Asignado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalAsignado)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ejecutado</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {formatCurrency(totalEjecutado)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <p className="text-sm text-success-600 mt-2">{pctEjecucion.toFixed(1)}% del total</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {formatCurrency(totalDisponible)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ejecucion</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{pctEjecucion.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
            <div
              className={cn(
                'h-full rounded-full',
                pctEjecucion > 90
                  ? 'bg-danger-600'
                  : pctEjecucion > 75
                    ? 'bg-warning-600'
                    : 'bg-success-600'
              )}
              style={{ width: `${Math.min(pctEjecucion, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Ejecucion por Area */}
      {porArea.length > 0 && (
        <Card variant="bordered" padding="md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ejecucion por Area
          </h3>
          <div className="space-y-4">
            {porArea.map((area, idx) => {
              const pct = dec(area.porcentaje);
              return (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {area.area_nombre}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        pct > 90 ? 'bg-danger-600' : pct > 75 ? 'bg-warning-600' : 'bg-success-600'
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Ejecutado: {formatCurrency(dec(area.monto_ejecutado))}</span>
                    <span>Asignado: {formatCurrency(dec(area.monto_asignado))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Presupuestos List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Presupuestos por Area
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Presupuesto
        </Button>
      </div>

      {presupuestos.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rubro
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Ano
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Asignado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ejecutado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Disponible
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {presupuestos.map((p) => {
                  const badge = getEstadoBadge(p.estado);
                  const pct = dec(p.porcentaje_ejecucion);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {p.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.area_nombre ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.rubro_nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 dark:text-gray-300">
                        {p.anio}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right">
                        {formatCurrency(dec(p.monto_asignado))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-success-600">
                        {formatCurrency(dec(p.monto_ejecutado))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-primary-600">
                        {formatCurrency(dec(p.saldo_disponible))}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span
                          className={cn(
                            'font-medium',
                            pct > 90
                              ? 'text-danger-600'
                              : pct > 75
                                ? 'text-warning-600'
                                : 'text-success-600'
                          )}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay presupuestos registrados
          </p>
        </Card>
      )}
    </div>
  );
};

const EjecucionesSection = () => {
  const { data: ejData, isLoading } = useEjecuciones();
  const ejecuciones = extractResults<EjecucionList>(ejData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ejecuciones Presupuestales
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Ejecucion
        </Button>
      </div>

      {ejecuciones.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Presupuesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rubro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ejecuciones.map((ej) => {
                  const badge = getEstadoBadge(ej.estado);
                  return (
                    <tr key={ej.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {ej.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {ej.fecha}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {ej.presupuesto_codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {ej.presupuesto_area ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {ej.presupuesto_rubro}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {ej.concepto}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                        {formatCurrency(dec(ej.monto))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay ejecuciones registradas
          </p>
        </Card>
      )}
    </div>
  );
};

const CentrosCostoRubrosSection = () => {
  const { data: ccData, isLoading: loadingCC } = useCentrosCosto();
  const { data: rubrosData, isLoading: loadingR } = useRubros();

  const centros = extractResults<CentroCostoList>(ccData);
  const rubros = extractResults<RubroList>(rubrosData);

  if (loadingCC || loadingR) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Centros de Costo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Centros de Costo</h3>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Centro
          </Button>
        </div>

        {centros.length > 0 ? (
          <Card variant="bordered" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Codigo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Area
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {centros.map((cc) => {
                    const badge = getEstadoBadge(cc.estado);
                    return (
                      <tr key={cc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {cc.codigo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {cc.nombre}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {cc.area_nombre ?? '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={badge.variant} size="sm">
                            {badge.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card variant="bordered" padding="lg">
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No hay centros de costo registrados
            </p>
          </Card>
        )}
      </div>

      {/* Rubros */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rubros Presupuestales
          </h3>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Rubro
          </Button>
        </div>

        {rubros.length > 0 ? (
          <Card variant="bordered" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Codigo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoria
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rubros.map((rubro) => (
                    <tr key={rubro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {rubro.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {rubro.nombre}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={rubro.tipo === 'ingreso' ? 'success' : 'danger'} size="sm">
                          {rubro.tipo_display}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {rubro.categoria_display}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card variant="bordered" padding="lg">
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No hay rubros registrados
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

const AprobacionesSection = () => {
  const { data: aprobData, isLoading } = useAprobaciones();
  const aprobaciones = extractResults<AprobacionList>(aprobData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aprobaciones</h3>

      {aprobaciones.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Presupuesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aprobado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {aprobaciones.map((a) => {
                  const badge = getEstadoBadge(a.estado);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {a.presupuesto_codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {a.nivel_aprobacion_display}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 dark:text-gray-300">
                        {a.orden}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {a.aprobado_por_nombre ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {a.fecha_aprobacion ?? '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay aprobaciones registradas
          </p>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function PresupuestoPage() {
  const [activeTab, setActiveTab] = useState('presupuestos');

  const tabs = [
    { id: 'presupuestos', label: 'Presupuestos', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ejecuciones', label: 'Ejecuciones', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'centros-rubros', label: 'Centros y Rubros', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'aprobaciones', label: 'Aprobaciones', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Presupuesto"
        description="Control y seguimiento presupuestal, ejecuciones y aprobaciones"
      />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      <div className="mt-6">
        {activeTab === 'presupuestos' && <PresupuestosSection />}
        {activeTab === 'ejecuciones' && <EjecucionesSection />}
        {activeTab === 'centros-rubros' && <CentrosCostoRubrosSection />}
        {activeTab === 'aprobaciones' && <AprobacionesSection />}
      </div>
    </div>
  );
}
