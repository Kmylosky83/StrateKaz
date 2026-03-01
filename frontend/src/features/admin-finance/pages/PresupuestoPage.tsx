/**
 * Página: Presupuesto
 * Tabs: Presupuestos, Ejecuciones, Centros/Rubros, Aprobaciones
 */
import { useState } from 'react';
import { BarChart3, TrendingUp, CheckCircle, DollarSign, FolderTree, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Card,
  Badge,
  Button,
  Tabs,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  EmptyState,
} from '@/components/common';
import { cn } from '@/utils/cn';
import {
  usePresupuestos,
  useResumenEjecucion,
  useEjecuciones,
  useCentrosCosto,
  useRubros,
  useAprobaciones,
  useCreateCentroCosto,
  useCreateRubro,
} from '../hooks';
import type {
  PresupuestoPorArea,
  PresupuestoPorAreaList,
  Ejecucion,
  EjecucionList,
  CentroCosto,
  CentroCostoList,
  Rubro,
  RubroList,
  AprobacionList,
} from '../types';
import CentroCostoFormModal from '../components/CentroCostoFormModal';
import RubroFormModal from '../components/RubroFormModal';
import PresupuestoFormModal from '../components/PresupuestoFormModal';
import EjecucionFormModal from '../components/EjecucionFormModal';

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

const getEstadoBadge = (
  estado: string
): { variant: 'success' | 'warning' | 'danger' | 'primary' | 'gray'; label: string } => {
  const map: Record<
    string,
    { variant: 'success' | 'warning' | 'danger' | 'primary' | 'gray'; label: string }
  > = {
    borrador: { variant: 'gray', label: 'Borrador' },
    aprobado: { variant: 'success', label: 'Aprobado' },
    en_ejecucion: { variant: 'primary', label: 'En ejecución' },
    cerrado: { variant: 'gray', label: 'Cerrado' },
    registrada: { variant: 'primary', label: 'Registrada' },
    aprobada: { variant: 'success', label: 'Aprobada' },
    anulada: { variant: 'danger', label: 'Anulada' },
    pendiente: { variant: 'warning', label: 'Pendiente' },
    rechazado: { variant: 'danger', label: 'Rechazado' },
    activo: { variant: 'success', label: 'Activo' },
    inactivo: { variant: 'gray', label: 'Inactivo' },
  };
  return map[estado] ?? { variant: 'gray', label: estado };
};

// ==================== MAIN COMPONENT ====================

export default function PresupuestoPage() {
  const [activeTab, setActiveTab] = useState('presupuestos');

  // Modal state
  const [presupuestoModal, setPresupuestoModal] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<PresupuestoPorArea | null>(null);
  const [ejecucionModal, setEjecucionModal] = useState(false);
  const [selectedEjecucion, setSelectedEjecucion] = useState<Ejecucion | null>(null);
  const [centroCostoModal, setCentroCostoModal] = useState(false);
  const [selectedCentroCosto, setSelectedCentroCosto] = useState<CentroCosto | null>(null);
  const [rubroModal, setRubroModal] = useState(false);
  const [selectedRubro, setSelectedRubro] = useState<Rubro | null>(null);

  // Queries
  const { data: presupuestosData, isLoading: loadingP } = usePresupuestos();
  const { data: resumen } = useResumenEjecucion();
  const { data: ejData, isLoading: loadingEj } = useEjecuciones();
  const { data: ccData, isLoading: loadingCC } = useCentrosCosto();
  const { data: rubrosData, isLoading: loadingR } = useRubros();
  const { data: aprobData, isLoading: loadingAp } = useAprobaciones();

  // Mutations
  const createCCMut = useCreateCentroCosto();
  const createRubroMut = useCreateRubro();

  const presupuestos = extractResults<PresupuestoPorAreaList>(presupuestosData);
  const ejecuciones = extractResults<EjecucionList>(ejData);
  const centros = extractResults<CentroCostoList>(ccData);
  const rubros = extractResults<RubroList>(rubrosData);
  const aprobaciones = extractResults<AprobacionList>(aprobData);

  const totalAsignado = dec(resumen?.total_asignado);
  const totalEjecutado = dec(resumen?.total_ejecutado);
  const totalDisponible = dec(resumen?.total_disponible);
  const pctEjecucion = dec(resumen?.porcentaje_ejecucion);
  const porArea = resumen?.por_area ?? [];

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

      {/* ===== Presupuestos ===== */}
      {activeTab === 'presupuestos' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Total Asignado"
              value={formatCurrency(totalAsignado)}
              icon={<DollarSign className="w-6 h-6" />}
              color="blue"
            />
            <KpiCard
              label="Ejecutado"
              value={formatCurrency(totalEjecutado)}
              description={`${pctEjecucion.toFixed(1)}% del total`}
              icon={<CheckCircle className="w-6 h-6" />}
              color="success"
            />
            <KpiCard
              label="Disponible"
              value={formatCurrency(totalDisponible)}
              icon={<BarChart3 className="w-6 h-6" />}
              color="info"
            />
            <KpiCard
              label="Ejecución"
              value={`${pctEjecucion.toFixed(1)}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              color={pctEjecucion > 90 ? 'danger' : pctEjecucion > 75 ? 'warning' : 'success'}
            />
          </KpiCardGrid>

          {/* Ejecución por Área */}
          {porArea.length > 0 && (
            <Card variant="bordered" padding="md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ejecución por Área
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
                            pct > 90
                              ? 'bg-danger-600'
                              : pct > 75
                                ? 'bg-warning-600'
                                : 'bg-success-600'
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

          <SectionToolbar
            title="Presupuestos por Área"
            count={presupuestos.length}
            primaryAction={{
              label: 'Nuevo Presupuesto',
              onClick: () => {
                setSelectedPresupuesto(null);
                setPresupuestoModal(true);
              },
            }}
          />

          {loadingP ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : presupuestos.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-16 h-16" />}
              title="No hay presupuestos registrados"
              description="Cree presupuestos para controlar la ejecución financiera por área"
              action={{ label: 'Nuevo Presupuesto', onClick: () => setPresupuestoModal(true) }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Área
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Rubro
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Año
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Asignado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Ejecutado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Disponible
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        %
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {presupuestos.map((p) => {
                      const badge = getEstadoBadge(p.estado);
                      const pct = dec(p.porcentaje_ejecucion);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {p.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {p.area_nombre ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {p.rubro_nombre}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                            {p.anio}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right">
                            {formatCurrency(dec(p.monto_asignado))}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-success-600">
                            {formatCurrency(dec(p.monto_ejecutado))}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-primary-600">
                            {formatCurrency(dec(p.saldo_disponible))}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
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
                          <td className="px-4 py-3">
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
          )}
        </div>
      )}

      {/* ===== Ejecuciones ===== */}
      {activeTab === 'ejecuciones' && (
        <div className="space-y-6">
          <SectionToolbar
            title="Ejecuciones Presupuestales"
            count={ejecuciones.length}
            primaryAction={{
              label: 'Nueva Ejecución',
              onClick: () => {
                setSelectedEjecucion(null);
                setEjecucionModal(true);
              },
            }}
          />

          {loadingEj ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : ejecuciones.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-16 h-16" />}
              title="No hay ejecuciones registradas"
              description="Registre ejecuciones contra los presupuestos aprobados"
              action={{ label: 'Nueva Ejecución', onClick: () => setEjecucionModal(true) }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Presupuesto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Área
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {ejecuciones.map((ej) => {
                      const badge = getEstadoBadge(ej.estado);
                      return (
                        <tr key={ej.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {ej.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {ej.fecha}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {ej.presupuesto_codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {ej.presupuesto_area ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {ej.concepto}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                            {formatCurrency(dec(ej.monto))}
                          </td>
                          <td className="px-4 py-3">
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
          )}
        </div>
      )}

      {/* ===== Centros y Rubros ===== */}
      {activeTab === 'centros-rubros' && (
        <div className="space-y-8">
          {/* Centros de Costo */}
          <div className="space-y-6">
            <SectionToolbar
              title="Centros de Costo"
              count={centros.length}
              primaryAction={{
                label: 'Nuevo Centro',
                onClick: () => {
                  setSelectedCentroCosto(null);
                  setCentroCostoModal(true);
                },
              }}
            />

            {loadingCC ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : centros.length === 0 ? (
              <EmptyState
                icon={<FolderTree className="w-16 h-16" />}
                title="No hay centros de costo"
                description="Defina centros de costo para organizar los presupuestos"
                action={{ label: 'Nuevo Centro', onClick: () => setCentroCostoModal(true) }}
              />
            ) : (
              <Card variant="bordered" padding="none">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Área
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {centros.map((cc) => {
                        const badge = getEstadoBadge(cc.estado);
                        return (
                          <tr key={cc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {cc.codigo}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {cc.nombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {cc.area_nombre ?? '-'}
                            </td>
                            <td className="px-4 py-3">
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
            )}
          </div>

          {/* Rubros */}
          <div className="space-y-6">
            <SectionToolbar
              title="Rubros Presupuestales"
              count={rubros.length}
              primaryAction={{
                label: 'Nuevo Rubro',
                onClick: () => {
                  setSelectedRubro(null);
                  setRubroModal(true);
                },
              }}
            />

            {loadingR ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : rubros.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-16 h-16" />}
                title="No hay rubros registrados"
                description="Cree rubros para clasificar los presupuestos"
                action={{ label: 'Nuevo Rubro', onClick: () => setRubroModal(true) }}
              />
            ) : (
              <Card variant="bordered" padding="none">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Categoría
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {rubros.map((rubro) => (
                        <tr key={rubro.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {rubro.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {rubro.nombre}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={rubro.tipo === 'ingreso' ? 'success' : 'danger'}
                              size="sm"
                            >
                              {rubro.tipo_display}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {rubro.categoria_display}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ===== Aprobaciones ===== */}
      {activeTab === 'aprobaciones' && (
        <div className="space-y-6">
          <SectionToolbar title="Aprobaciones" count={aprobaciones.length} />

          {loadingAp ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : aprobaciones.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-16 h-16" />}
              title="No hay aprobaciones registradas"
              description="Las aprobaciones se generan automáticamente al crear presupuestos"
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Presupuesto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nivel
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Orden
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Aprobado por
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {aprobaciones.map((a) => {
                      const badge = getEstadoBadge(a.estado);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {a.presupuesto_codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {a.nivel_aprobacion_display}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                            {a.orden}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {a.aprobado_por_nombre ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {a.fecha_aprobacion ?? '-'}
                          </td>
                          <td className="px-4 py-3">
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
          )}
        </div>
      )}

      {/* Modals */}
      <PresupuestoFormModal
        item={selectedPresupuesto}
        isOpen={presupuestoModal}
        onClose={() => {
          setSelectedPresupuesto(null);
          setPresupuestoModal(false);
        }}
      />
      <EjecucionFormModal
        item={selectedEjecucion}
        isOpen={ejecucionModal}
        onClose={() => {
          setSelectedEjecucion(null);
          setEjecucionModal(false);
        }}
      />
      <CentroCostoFormModal
        item={selectedCentroCosto}
        isOpen={centroCostoModal}
        onClose={() => {
          setSelectedCentroCosto(null);
          setCentroCostoModal(false);
        }}
        onCreate={(data) =>
          createCCMut.mutate(data, {
            onSuccess: () => {
              setSelectedCentroCosto(null);
              setCentroCostoModal(false);
            },
          })
        }
        isLoading={createCCMut.isPending}
      />
      <RubroFormModal
        item={selectedRubro}
        isOpen={rubroModal}
        onClose={() => {
          setSelectedRubro(null);
          setRubroModal(false);
        }}
        onCreate={(data) =>
          createRubroMut.mutate(data, {
            onSuccess: () => {
              setSelectedRubro(null);
              setRubroModal(false);
            },
          })
        }
        isLoading={createRubroMut.isPending}
      />
    </div>
  );
}
