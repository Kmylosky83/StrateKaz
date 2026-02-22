/**
 * Dashboard: Administracion Financiera
 *
 * KPIs y acceso a: Tesoreria, Presupuesto, Activos Fijos, Servicios Generales.
 * Datos reales via hooks conectados al backend.
 */
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  PieChart,
  Building2,
  Wrench,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import {
  useBancoSaldos,
  useResumenEjecucion,
  useActivosFijosEstadisticas,
  useCuentasPorPagarEstadisticas,
  useCuentasPorPagarPorVencer,
  useContratosPorVencer,
  useContratosVigentes,
  usePagos,
  useRecaudos,
} from '../hooks';
import type { PagoList, RecaudoList } from '../types';

// ==================== HELPERS ====================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** DRF DecimalField returns string - convert safely */
const dec = (val: string | number | undefined | null): number =>
  val != null ? Number(val) || 0 : 0;

// ==================== SUB-COMPONENTS ====================

const ModuloCard = ({
  titulo,
  icono,
  color,
  stats,
  ruta,
}: {
  titulo: string;
  icono: React.ReactNode;
  color: string;
  stats: { label: string; value: string | number; trend?: 'up' | 'down' }[];
  ruta: string;
}) => {
  const navigate = useNavigate();

  return (
    <Card
      variant="bordered"
      padding="md"
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(ruta)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', color)}>
          {icono}
        </div>
        <ArrowUpRight className="w-5 h-5 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{titulo}</h3>

      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{stat.value}</span>
              {stat.trend && (
                <span
                  className={cn(
                    'flex items-center',
                    stat.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

interface AlertaItem {
  id: string;
  tipo: 'danger' | 'warning' | 'info';
  titulo: string;
  descripcion: string;
  modulo: string;
}

const AlertaCard = ({ alerta }: { alerta: AlertaItem }) => {
  const iconMap = {
    danger: <AlertTriangle className="w-5 h-5 text-danger-600" />,
    warning: <Clock className="w-5 h-5 text-warning-600" />,
    info: <Clock className="w-5 h-5 text-primary-600" />,
  };
  const colorMap = {
    danger: 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/20',
    warning: 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20',
    info: 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20',
  };

  return (
    <div className={cn('p-4 border-l-4 rounded-r-lg', colorMap[alerta.tipo])}>
      <div className="flex items-start gap-3">
        {iconMap[alerta.tipo]}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{alerta.titulo}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alerta.descripcion}</p>
        </div>
        <Badge variant="gray" size="sm">
          {alerta.modulo}
        </Badge>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function AdminFinancePage() {
  const navigate = useNavigate();

  // --- Data hooks ---
  const { data: saldos, isLoading: loadingSaldos } = useBancoSaldos();
  const { data: resumenEjec, isLoading: loadingEjec } = useResumenEjecucion();
  const { data: activosStats, isLoading: loadingActivos } = useActivosFijosEstadisticas();
  const { data: cxpStats } = useCuentasPorPagarEstadisticas();
  const { data: cxpPorVencer } = useCuentasPorPagarPorVencer();
  const { data: contratosVigentes } = useContratosVigentes();
  const { data: contratosPorVencer } = useContratosPorVencer();
  const { data: pagosData } = usePagos({ page_size: 3, ordering: '-fecha_pago' });
  const { data: recaudosData } = useRecaudos({ page_size: 3, ordering: '-fecha_recaudo' });

  const isLoading = loadingSaldos || loadingEjec || loadingActivos;

  // --- Derived values (DRF returns strings for DecimalField) ---
  const saldoTotal = dec(saldos?.total_saldo_actual);
  const pctEjecucion = dec(resumenEjec?.porcentaje_ejecucion);
  const totalActivos = activosStats?.total_activos ?? 0;
  const valorLibros = dec(activosStats?.valor_total_en_libros);
  const porEstado = activosStats?.por_estado ?? {};
  const enMantenimiento = porEstado['en_mantenimiento'] ?? 0;

  const numContratosVigentes =
    contratosVigentes?.count ??
    (Array.isArray(contratosVigentes) ? (contratosVigentes as unknown[]).length : 0);

  // --- Build alerts from real data ---
  const alertas: AlertaItem[] = [];
  if (cxpStats && dec(cxpStats.cantidad_vencidas) > 0) {
    alertas.push({
      id: 'cxp-vencidas',
      tipo: 'danger',
      titulo: 'Cuentas por pagar vencidas',
      descripcion: `${cxpStats.cantidad_vencidas} cuentas vencidas por ${formatCurrency(dec(cxpStats.total_vencido))}`,
      modulo: 'Tesoreria',
    });
  }
  if (cxpPorVencer) {
    const proximas = Array.isArray(cxpPorVencer) ? cxpPorVencer.length : (cxpPorVencer.count ?? 0);
    if (proximas > 0) {
      alertas.push({
        id: 'cxp-por-vencer',
        tipo: 'warning',
        titulo: 'Pagos proximos a vencer',
        descripcion: `${proximas} pagos proximos a vencimiento`,
        modulo: 'Tesoreria',
      });
    }
  }
  if (contratosPorVencer) {
    const ctsPorVencer = Array.isArray(contratosPorVencer)
      ? contratosPorVencer.length
      : (contratosPorVencer.count ?? 0);
    if (ctsPorVencer > 0) {
      alertas.push({
        id: 'contratos-por-vencer',
        tipo: 'warning',
        titulo: 'Contratos por vencer',
        descripcion: `${ctsPorVencer} contratos proximos a vencimiento`,
        modulo: 'Servicios',
      });
    }
  }
  if (enMantenimiento > 0) {
    alertas.push({
      id: 'activos-mantenimiento',
      tipo: 'info',
      titulo: 'Activos en mantenimiento',
      descripcion: `${enMantenimiento} activos actualmente en mantenimiento`,
      modulo: 'Activos',
    });
  }

  // --- Recent movements: merge pagos + recaudos ---
  const pagos = (Array.isArray(pagosData) ? pagosData : (pagosData?.results ?? [])) as PagoList[];
  const recaudos = (
    Array.isArray(recaudosData) ? recaudosData : (recaudosData?.results ?? [])
  ) as RecaudoList[];

  const movimientos = [
    ...pagos.map((p) => ({
      id: `pago-${p.id}`,
      tipo: 'egreso' as const,
      concepto: p.cuenta_concepto || p.proveedor_nombre || 'Pago',
      valor: dec(p.monto),
      fecha: p.fecha_pago,
      referencia: p.referencia,
    })),
    ...recaudos.map((r) => ({
      id: `recaudo-${r.id}`,
      tipo: 'ingreso' as const,
      concepto: r.cuenta_concepto || r.cliente_nombre || 'Recaudo',
      valor: dec(r.monto),
      fecha: r.fecha_recaudo,
      referencia: r.referencia,
    })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administracion Financiera"
        description="Gestion integral de tesoreria, presupuesto, activos fijos y servicios generales"
      />

      {/* KPI Cards Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo en Bancos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(saldoTotal)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {saldos?.cuentas_activas ?? 0} cuentas activas
          </p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Presupuesto Ejecutado</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {pctEjecucion.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <PieChart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3">
            <div
              className="h-full bg-primary-600 rounded-full transition-all"
              style={{ width: `${Math.min(pctEjecucion, 100)}%` }}
            />
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor en Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(valorLibros)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {totalActivos} activos registrados
          </p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contratos Activos</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {numContratosVigentes}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {cxpStats ? cxpStats.cantidad_pendientes : 0} pagos pendientes
          </p>
        </Card>
      </div>

      {/* Modulos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModuloCard
          titulo="Tesoreria"
          icono={<Wallet className="w-6 h-6 text-white" />}
          color="bg-green-600"
          stats={[
            {
              label: 'Saldo disponible',
              value: formatCurrency(dec(saldos?.total_saldo_disponible)),
            },
            { label: 'Pagos pendientes', value: cxpStats?.cantidad_pendientes ?? 0 },
            {
              label: 'Total por pagar',
              value: formatCurrency(dec(cxpStats?.total_pendiente)),
            },
          ]}
          ruta="/finanzas/tesoreria"
        />

        <ModuloCard
          titulo="Presupuesto"
          icono={<BarChart3 className="w-6 h-6 text-white" />}
          color="bg-primary-600"
          stats={[
            {
              label: 'Total asignado',
              value: formatCurrency(dec(resumenEjec?.total_asignado)),
            },
            {
              label: 'Ejecutado',
              value: formatCurrency(dec(resumenEjec?.total_ejecutado)),
            },
            {
              label: 'Disponible',
              value: formatCurrency(dec(resumenEjec?.total_disponible)),
            },
          ]}
          ruta="/finanzas/presupuesto"
        />

        <ModuloCard
          titulo="Activos Fijos"
          icono={<Building2 className="w-6 h-6 text-white" />}
          color="bg-blue-600"
          stats={[
            { label: 'Total activos', value: totalActivos },
            { label: 'En mantenimiento', value: enMantenimiento },
            {
              label: 'Depreciacion acum.',
              value: formatCurrency(dec(activosStats?.depreciacion_total_acumulada)),
            },
          ]}
          ruta="/finanzas/activos-fijos"
        />

        <ModuloCard
          titulo="Servicios Generales"
          icono={<Wrench className="w-6 h-6 text-white" />}
          color="bg-orange-600"
          stats={[
            { label: 'Contratos vigentes', value: numContratosVigentes },
            {
              label: 'Vencidas por pagar',
              value: cxpStats?.cantidad_vencidas ?? 0,
            },
            {
              label: 'Monto vencido',
              value: formatCurrency(dec(cxpStats?.total_vencido)),
            },
          ]}
          ruta="/finanzas/servicios-generales"
        />
      </div>

      {/* Alertas y Movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Financieras */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alertas Financieras
            </h3>
            {alertas.length > 0 && <Badge variant="warning">{alertas.length}</Badge>}
          </div>
          {alertas.length > 0 ? (
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <AlertaCard key={alerta.id} alerta={alerta} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No hay alertas pendientes
            </p>
          )}
        </Card>

        {/* Ultimos Movimientos */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ultimos Movimientos
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finanzas/tesoreria')}>
              Ver todos
            </Button>
          </div>
          {movimientos.length > 0 ? (
            <div className="space-y-4">
              {movimientos.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        mov.tipo === 'ingreso'
                          ? 'bg-success-100 dark:bg-success-900/30'
                          : 'bg-danger-100 dark:bg-danger-900/30'
                      )}
                    >
                      {mov.tipo === 'ingreso' ? (
                        <ArrowDownRight className="w-5 h-5 text-success-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-danger-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{mov.concepto}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{mov.referencia}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'font-semibold',
                        mov.tipo === 'ingreso' ? 'text-success-600' : 'text-danger-600'
                      )}
                    >
                      {mov.tipo === 'ingreso' ? '+' : '-'}
                      {formatCurrency(mov.valor)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{mov.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No hay movimientos recientes
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
