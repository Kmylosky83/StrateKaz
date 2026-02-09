/**
 * Página: Acciones por Indicador
 *
 * Planes de acción para mejorar KPIs con 4 tabs:
 * - Planes de Acción
 * - Actividades
 * - Seguimiento
 * - Integración AC
 *
 * Datos reales desde hooks TanStack Query.
 */
import { useState } from 'react';
import {
  Target,
  ClipboardList,
  TrendingUp,
  Link2,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Play,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import {
  usePlanesAccionKPI,
  useActividadesPlanKPI,
  useSeguimientosPlanKPI,
  useIntegracionesAC,
} from '../hooks/useAnalytics';
import { PlanAccionFormModal } from '../components/PlanAccionFormModal';
import { ActividadPlanFormModal } from '../components/ActividadPlanFormModal';
import { SeguimientoFormModal } from '../components/SeguimientoFormModal';
import type {
  PlanAccionKPI,
  ActividadPlanKPI,
  SeguimientoPlanKPI,
  IntegracionAccionCorrectiva,
} from '../types';

// ==================== UTILITY FUNCTIONS ====================

const getEstadoPlanColor = (estado: string) => {
  const colors: Record<string, string> = {
    propuesto: 'bg-gray-100 text-gray-800',
    aprobado: 'bg-blue-100 text-blue-800',
    en_ejecucion: 'bg-yellow-100 text-yellow-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

const getPrioridadColor = (prioridad: string) => {
  const colors: Record<string, string> = {
    baja: 'bg-blue-100 text-blue-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  return colors[prioridad] || 'bg-gray-100 text-gray-800';
};

const getEstadoActividadIcon = (estado: string) => {
  if (estado === 'completada') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (estado === 'en_proceso') return <Clock className="w-4 h-4 text-yellow-600" />;
  return <Play className="w-4 h-4 text-gray-400" />;
};

// ==================== SECTIONS ====================

const PlanesSection = ({ onEdit, onNew }: { onEdit: (item: PlanAccionKPI) => void; onNew: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: planesData, isLoading } = usePlanesAccionKPI();
  const planes = Array.isArray(planesData) ? planesData : [];

  const filtered = planes.filter(
    (p: PlanAccionKPI) =>
      !searchTerm ||
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo_plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar planes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
          Nuevo Plan
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Target className="w-12 h-12" />} title="Sin planes de acción" description="Cree planes de acción para mejorar sus KPIs" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((plan: PlanAccionKPI) => (
            <Card key={plan.id} variant="bordered" padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{plan.titulo}</h4>
                      <Badge variant="gray" size="sm" className={getEstadoPlanColor(plan.estado)}>
                        {plan.estado.replace('_', ' ')}
                      </Badge>
                      <Badge variant="gray" size="sm" className={getPrioridadColor(plan.prioridad)}>
                        {plan.prioridad}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.codigo_plan} - KPI: {plan.kpi_nombre} ({plan.kpi_codigo})
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Valor Actual</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{plan.valor_actual}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Meta Objetivo</label>
                    <p className="text-lg font-bold text-primary-600 mt-1">{plan.meta_objetivo}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Brecha</label>
                    <p className={cn("text-lg font-bold mt-1", plan.brecha > 0 ? 'text-red-600' : 'text-green-600')}>
                      {plan.brecha > 0 ? '+' : ''}{plan.brecha}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Presupuesto</label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      ${(plan.presupuesto_ejecutado || 0).toLocaleString()} / ${(plan.presupuesto_estimado || 0).toLocaleString()}
                    </p>
                    {(plan.presupuesto_estimado ?? 0) > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${Math.min(((plan.presupuesto_ejecutado || 0) / (plan.presupuesto_estimado || 1)) * 100, 100)}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Responsable:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">{plan.responsable_nombre}</span>
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
      )}
    </div>
  );
};

const ActividadesSection = ({ onNew }: { onNew: () => void }) => {
  const { data: actividadesData, isLoading } = useActividadesPlanKPI();
  const actividades = Array.isArray(actividadesData) ? actividadesData : [];

  if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividades de Planes</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>Nueva Actividad</Button>
      </div>

      {actividades.length === 0 ? (
        <EmptyState icon={<ClipboardList className="w-12 h-12" />} title="Sin actividades" description="Las actividades se crean dentro de planes de acción" />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {actividades.map((act: ActividadPlanKPI) => (
                  <tr key={act.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{act.codigo_actividad}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{act.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{act.responsable_nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{act.fecha_inicio}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{act.fecha_fin}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getEstadoActividadIcon(act.estado)}
                        <Badge variant={act.estado === 'completada' ? 'success' : act.estado === 'en_proceso' ? 'warning' : 'gray'} size="sm">
                          {act.estado.replace('_', ' ')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{act.porcentaje_avance}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={cn("h-2 rounded-full", act.porcentaje_avance === 100 ? 'bg-green-600' : act.porcentaje_avance >= 50 ? 'bg-primary-600' : 'bg-yellow-600')}
                            style={{ width: `${act.porcentaje_avance}%` }}
                          />
                        </div>
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

const SeguimientoSection = ({ onNew }: { onNew: () => void }) => {
  const { data: seguimientosData, isLoading } = useSeguimientosPlanKPI();
  const seguimientos = Array.isArray(seguimientosData) ? seguimientosData : [];

  if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguimientos de Planes</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>Nuevo Seguimiento</Button>
      </div>

      {seguimientos.length === 0 ? (
        <EmptyState icon={<TrendingUp className="w-12 h-12" />} title="Sin seguimientos" description="Registre seguimientos periódicos de sus planes de acción" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {seguimientos.map((seg: SeguimientoPlanKPI) => (
            <Card key={seg.id} variant="bordered" padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Seguimiento - {seg.fecha_seguimiento}</h4>
                      {seg.cumple_cronograma ? (
                        <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3 mr-1" />En Cronograma</Badge>
                      ) : (
                        <Badge variant="danger" size="sm"><Clock className="w-3 h-3 mr-1" />Atrasado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Registrado por: {seg.registrado_por_nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{seg.porcentaje_avance_general}%</p>
                    <p className="text-xs text-gray-500">Avance General</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${seg.porcentaje_avance_general}%` }} />
                </div>

                {seg.valor_kpi_actual != null && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Valor KPI Actual</label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{seg.valor_kpi_actual}</p>
                    </div>
                    {seg.variacion_vs_inicio != null && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Variación vs Inicio</label>
                        <p className={cn("text-lg font-bold mt-1", seg.variacion_vs_inicio < 0 ? 'text-green-600' : 'text-red-600')}>
                          {seg.variacion_vs_inicio > 0 ? '+' : ''}{seg.variacion_vs_inicio}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Avances Logrados</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{seg.avances_logrados}</p>
                  </div>
                  {seg.dificultades_encontradas && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Dificultades</label>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{seg.dificultades_encontradas}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const IntegracionSection = () => {
  const { data: integracionesData, isLoading } = useIntegracionesAC();
  const integraciones = Array.isArray(integracionesData) ? integracionesData : [];

  if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Integración con Acciones Correctivas</h3>

      <Card variant="bordered" padding="md" className="bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Trazabilidad con Sistema HSEQ</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Los planes de acción de KPIs pueden vincularse con acciones correctivas del módulo HSEQ.
            </p>
          </div>
        </div>
      </Card>

      {integraciones.length === 0 ? (
        <EmptyState icon={<Link2 className="w-12 h-12" />} title="Sin integraciones" description="No hay vinculaciones entre planes KPI y acciones correctivas" />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan KPI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción Correctiva</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Vínculo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vinculado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {integraciones.map((int: IntegracionAccionCorrectiva) => (
                  <tr key={int.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{int.plan_codigo}</td>
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">{int.accion_correctiva_codigo}</td>
                    <td className="px-6 py-4"><Badge variant="info" size="sm">{int.tipo_vinculo}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{int.descripcion_vinculo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{int.fecha_vinculacion}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{int.vinculado_por_nombre}</td>
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

// ==================== MAIN COMPONENT ====================

export default function AccionesIndicadorPage() {
  const [activeTab, setActiveTab] = useState('planes');

  const [selectedPlan, setSelectedPlan] = useState<PlanAccionKPI | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);

  const tabs = [
    { id: 'planes', label: 'Planes de Acción', icon: <Target className="w-4 h-4" /> },
    { id: 'actividades', label: 'Actividades', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'seguimiento', label: 'Seguimiento', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'integracion', label: 'Integración AC', icon: <Link2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Acciones por Indicador" description="Planes de acción y actividades para mejorar el desempeño de KPIs" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'planes' && (
          <PlanesSection
            onNew={() => { setSelectedPlan(null); setShowPlanModal(true); }}
            onEdit={(item) => { setSelectedPlan(item); setShowPlanModal(true); }}
          />
        )}
        {activeTab === 'actividades' && <ActividadesSection onNew={() => setShowActividadModal(true)} />}
        {activeTab === 'seguimiento' && <SeguimientoSection onNew={() => setShowSeguimientoModal(true)} />}
        {activeTab === 'integracion' && <IntegracionSection />}
      </div>

      <PlanAccionFormModal item={selectedPlan} isOpen={showPlanModal} onClose={() => { setShowPlanModal(false); setSelectedPlan(null); }} />
      <ActividadPlanFormModal item={null} isOpen={showActividadModal} onClose={() => setShowActividadModal(false)} />
      <SeguimientoFormModal item={null} isOpen={showSeguimientoModal} onClose={() => setShowSeguimientoModal(false)} />
    </div>
  );
}
