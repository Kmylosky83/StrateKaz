/**
 * Página Principal: Administración Financiera
 *
 * Dashboard de gestión financiera y administrativa con acceso a:
 * - Tesorería: Cuentas bancarias y flujo de caja
 * - Presupuesto: Control presupuestal
 * - Activos Fijos: Inventario y depreciaciones
 * - Servicios Generales: Gastos operativos
 */
import { useState } from 'react';
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
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockResumen = {
  tesoreria: {
    saldo_total: 245680000,
    ingresos_mes: 89500000,
    egresos_mes: 67800000,
    pagos_pendientes: 12,
  },
  presupuesto: {
    total: 1200000000,
    ejecutado: 720000000,
    comprometido: 180000000,
    disponible: 300000000,
    porcentaje: 60,
  },
  activos: {
    total_activos: 156,
    valor_libros: 456780000,
    en_mantenimiento: 8,
    proximas_depreciaciones: 45600000,
  },
  servicios: {
    contratos_activos: 24,
    gastos_mes: 32450000,
    facturas_pendientes: 5,
  },
};

const mockAlertasFinancieras = [
  {
    id: 1,
    tipo: 'warning',
    titulo: 'Pagos próximos a vencer',
    descripcion: '5 pagos vencen en los próximos 3 días',
    modulo: 'tesoreria',
  },
  {
    id: 2,
    tipo: 'danger',
    titulo: 'Rubro sobre-ejecutado',
    descripcion: 'Gastos de viaje al 115% del presupuesto',
    modulo: 'presupuesto',
  },
  {
    id: 3,
    tipo: 'info',
    titulo: 'Depreciación pendiente',
    descripcion: 'Calcular depreciación del mes de diciembre',
    modulo: 'activos',
  },
  {
    id: 4,
    tipo: 'warning',
    titulo: 'Contrato por vencer',
    descripcion: 'Contrato de vigilancia vence en 15 días',
    modulo: 'servicios',
  },
];

const mockUltimosMovimientos = [
  {
    id: 1,
    tipo: 'ingreso',
    concepto: 'Recaudo clientes',
    valor: 15800000,
    fecha: '2024-12-28',
    cuenta: 'Bancolombia 001',
  },
  {
    id: 2,
    tipo: 'egreso',
    concepto: 'Pago proveedores',
    valor: 8500000,
    fecha: '2024-12-27',
    cuenta: 'Davivienda 002',
  },
  {
    id: 3,
    tipo: 'egreso',
    concepto: 'Nómina quincenal',
    valor: 23400000,
    fecha: '2024-12-15',
    cuenta: 'Bancolombia 001',
  },
  {
    id: 4,
    tipo: 'ingreso',
    concepto: 'Venta de activo',
    valor: 4500000,
    fecha: '2024-12-10',
    cuenta: 'BBVA 003',
  },
];

// ==================== COMPONENTS ====================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

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

const AlertaCard = ({
  alerta,
}: {
  alerta: { id: number; tipo: string; titulo: string; descripcion: string; modulo: string };
}) => {
  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-danger-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-primary-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'danger':
        return 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/20';
      case 'warning':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20';
      case 'info':
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className={cn('p-4 border-l-4 rounded-r-lg', getAlertaColor(alerta.tipo))}>
      <div className="flex items-start gap-3">
        {getAlertaIcon(alerta.tipo)}
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
  const resumen = mockResumen;
  const alertas = mockAlertasFinancieras;
  const movimientos = mockUltimosMovimientos;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administración Financiera"
        description="Gestión integral de tesorería, presupuesto, activos fijos y servicios generales"
      />

      {/* KPI Cards Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo en Bancos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(resumen.tesoreria.saldo_total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <TrendingUp className="w-4 h-4 text-success-600" />
            <span className="text-sm text-success-600">+12.5% vs mes anterior</span>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Presupuesto Ejecutado</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {resumen.presupuesto.porcentaje}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <PieChart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3">
            <div
              className="h-full bg-primary-600 rounded-full"
              style={{ width: `${resumen.presupuesto.porcentaje}%` }}
            />
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor en Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(resumen.activos.valor_libros)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {resumen.activos.total_activos} activos registrados
          </p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gastos Operativos</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(resumen.servicios.gastos_mes)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {resumen.servicios.contratos_activos} contratos activos
          </p>
        </Card>
      </div>

      {/* Módulos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModuloCard
          titulo="Tesorería"
          icono={<Wallet className="w-6 h-6 text-white" />}
          color="bg-green-600"
          stats={[
            { label: 'Ingresos mes', value: formatCurrency(resumen.tesoreria.ingresos_mes), trend: 'up' },
            { label: 'Egresos mes', value: formatCurrency(resumen.tesoreria.egresos_mes), trend: 'down' },
            { label: 'Pagos pendientes', value: resumen.tesoreria.pagos_pendientes },
          ]}
          ruta="/finanzas/tesoreria"
        />

        <ModuloCard
          titulo="Presupuesto"
          icono={<BarChart3 className="w-6 h-6 text-white" />}
          color="bg-primary-600"
          stats={[
            { label: 'Total asignado', value: formatCurrency(resumen.presupuesto.total) },
            { label: 'Ejecutado', value: formatCurrency(resumen.presupuesto.ejecutado) },
            { label: 'Disponible', value: formatCurrency(resumen.presupuesto.disponible) },
          ]}
          ruta="/finanzas/presupuesto"
        />

        <ModuloCard
          titulo="Activos Fijos"
          icono={<Building2 className="w-6 h-6 text-white" />}
          color="bg-blue-600"
          stats={[
            { label: 'Total activos', value: resumen.activos.total_activos },
            { label: 'En mantenimiento', value: resumen.activos.en_mantenimiento },
            { label: 'Depreciación pend.', value: formatCurrency(resumen.activos.proximas_depreciaciones) },
          ]}
          ruta="/finanzas/activos-fijos"
        />

        <ModuloCard
          titulo="Servicios Generales"
          icono={<Wrench className="w-6 h-6 text-white" />}
          color="bg-orange-600"
          stats={[
            { label: 'Contratos activos', value: resumen.servicios.contratos_activos },
            { label: 'Gastos del mes', value: formatCurrency(resumen.servicios.gastos_mes) },
            { label: 'Facturas pend.', value: resumen.servicios.facturas_pendientes },
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
            <Badge variant="warning">{alertas.length}</Badge>
          </div>
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <AlertaCard key={alerta.id} alerta={alerta} />
            ))}
          </div>
        </Card>

        {/* Últimos Movimientos */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Últimos Movimientos
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finanzas/tesoreria')}>
              Ver todos
            </Button>
          </div>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">{mov.cuenta}</p>
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
        </Card>
      </div>
    </div>
  );
}
