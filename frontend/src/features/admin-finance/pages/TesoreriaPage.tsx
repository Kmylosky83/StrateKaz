/**
 * Página: Tesorería
 * Tabs: Bancos, Cuentas por Pagar, Cuentas por Cobrar, Pagos y Recaudos
 */
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  DollarSign,
  Clock,
  AlertTriangle,
  Edit,
  Calendar,
} from 'lucide-react';
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
import {
  useBancos,
  useBancoSaldos,
  useCuentasPorPagar,
  useCuentasPorPagarEstadisticas,
  useCuentasPorCobrar,
  useCuentasPorCobrarEstadisticas,
  usePagos,
  useRecaudos,
} from '../hooks';
import type {
  Banco,
  BancoList,
  CuentaPorPagar,
  CuentaPorPagarList,
  CuentaPorCobrar,
  CuentaPorCobrarList,
  Pago,
  PagoList,
  Recaudo,
  RecaudoList,
} from '../types';
import BancoFormModal from '../components/BancoFormModal';
import CuentaPorPagarFormModal from '../components/CuentaPorPagarFormModal';
import CuentaPorCobrarFormModal from '../components/CuentaPorCobrarFormModal';
import PagoFormModal from '../components/PagoFormModal';
import RecaudoFormModal from '../components/RecaudoFormModal';

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
): { variant: 'success' | 'warning' | 'danger' | 'info' | 'gray'; label: string } => {
  const map: Record<
    string,
    { variant: 'success' | 'warning' | 'danger' | 'info' | 'gray'; label: string }
  > = {
    pendiente: { variant: 'warning', label: 'Pendiente' },
    parcial: { variant: 'info', label: 'Parcial' },
    pagada: { variant: 'success', label: 'Pagada' },
    cobrada: { variant: 'success', label: 'Cobrada' },
    anulada: { variant: 'gray', label: 'Anulada' },
    activa: { variant: 'success', label: 'Activa' },
    inactiva: { variant: 'gray', label: 'Inactiva' },
    bloqueada: { variant: 'danger', label: 'Bloqueada' },
  };
  return map[estado] ?? { variant: 'gray', label: estado };
};

// ==================== MAIN COMPONENT ====================

export default function TesoreriaPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.ADMIN_FINANCE, Sections.FLUJO_CAJA, 'create');
  const canEdit = canDo(Modules.ADMIN_FINANCE, Sections.FLUJO_CAJA, 'edit');

  const [activeTab, setActiveTab] = useState('bancos');

  // Modal state
  const [bancoModal, setBancoModal] = useState(false);
  const [selectedBanco, setSelectedBanco] = useState<Banco | null>(null);
  const [cxpModal, setCxpModal] = useState(false);
  const [selectedCxp, setSelectedCxp] = useState<CuentaPorPagar | null>(null);
  const [cxcModal, setCxcModal] = useState(false);
  const [selectedCxc, setSelectedCxc] = useState<CuentaPorCobrar | null>(null);
  const [pagoModal, setPagoModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [recaudoModal, setRecaudoModal] = useState(false);
  const [selectedRecaudo, setSelectedRecaudo] = useState<Recaudo | null>(null);

  // Queries
  const { data: bancosData, isLoading: loadingBancos } = useBancos();
  const { data: saldos } = useBancoSaldos();
  const { data: cxpData, isLoading: loadingCxp } = useCuentasPorPagar();
  const { data: cxpStats } = useCuentasPorPagarEstadisticas();
  const { data: cxcData, isLoading: loadingCxc } = useCuentasPorCobrar();
  const { data: cxcStats } = useCuentasPorCobrarEstadisticas();
  const { data: pagosData, isLoading: loadingPagos } = usePagos();
  const { data: recaudosData, isLoading: loadingRecaudos } = useRecaudos();

  const bancos = extractResults<BancoList>(bancosData);
  const cxp = extractResults<CuentaPorPagarList>(cxpData);
  const cxc = extractResults<CuentaPorCobrarList>(cxcData);
  const pagos = extractResults<PagoList>(pagosData);
  const recaudos = extractResults<RecaudoList>(recaudosData);

  const totalPagos = pagos.reduce((s, p) => s + dec(p.monto), 0);
  const totalRecaudos = recaudos.reduce((s, r) => s + dec(r.monto), 0);

  const tabs = [
    { id: 'bancos', label: 'Bancos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'cxp', label: 'Cuentas por Pagar', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'cxc', label: 'Cuentas por Cobrar', icon: <ArrowDownRight className="w-4 h-4" /> },
    { id: 'pagos-recaudos', label: 'Pagos y Recaudos', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tesorería"
        description="Gestión de cuentas bancarias, pagos, cobros y flujo de caja"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* ===== Bancos ===== */}
      {activeTab === 'bancos' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Saldo Total"
              value={formatCurrency(dec(saldos?.total_saldo_actual))}
              icon={<DollarSign className="w-6 h-6" />}
              color="success"
            />
            <KpiCard
              label="Saldo Disponible"
              value={formatCurrency(dec(saldos?.total_saldo_disponible))}
              icon={<Wallet className="w-6 h-6" />}
              color="blue"
            />
            <KpiCard
              label="Comprometido"
              value={formatCurrency(dec(saldos?.total_saldo_comprometido))}
              icon={<Clock className="w-6 h-6" />}
              color="warning"
            />
            <KpiCard
              label="Cuentas Activas"
              value={saldos?.cuentas_activas ?? bancos.length}
              icon={<CreditCard className="w-6 h-6" />}
              color="info"
            />
          </KpiCardGrid>

          <SectionToolbar
            title="Cuentas Bancarias"
            count={bancos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nueva Cuenta',
                    onClick: () => {
                      setSelectedBanco(null);
                      setBancoModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingBancos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : bancos.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-16 h-16" />}
              title="No hay cuentas bancarias"
              description="Registre las cuentas bancarias de su empresa"
              action={
                canCreate
                  ? { label: 'Nueva Cuenta', onClick: () => setBancoModal(true) }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bancos.map((banco) => (
                <Card key={banco.id} variant="bordered" padding="md">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {banco.nombre_cuenta}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {banco.entidad_bancaria} - {banco.numero_cuenta}
                      </p>
                    </div>
                    <Badge variant={getEstadoBadge(banco.estado).variant} size="sm">
                      {banco.tipo_cuenta_display}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Saldo actual</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(dec(banco.saldo_actual))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Disponible</span>
                      <span className="text-sm font-medium text-success-600">
                        {formatCurrency(dec(banco.saldo_disponible))}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBanco(banco as unknown as Banco);
                          setBancoModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Cuentas por Pagar ===== */}
      {activeTab === 'cxp' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Total Pendiente"
              value={formatCurrency(dec(cxpStats?.total_pendiente))}
              icon={<DollarSign className="w-6 h-6" />}
              color="blue"
            />
            <KpiCard
              label="Pendientes"
              value={cxpStats?.cantidad_pendientes ?? 0}
              icon={<Clock className="w-6 h-6" />}
              color="warning"
            />
            <KpiCard
              label="Vencidas"
              value={cxpStats?.cantidad_vencidas ?? 0}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="danger"
            />
            <KpiCard
              label="Total Vencido"
              value={formatCurrency(dec(cxpStats?.total_vencido))}
              icon={<ArrowUpRight className="w-6 h-6" />}
              color="danger"
            />
          </KpiCardGrid>

          <SectionToolbar
            title="Cuentas por Pagar"
            count={cxp.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nueva CxP',
                    onClick: () => {
                      setSelectedCxp(null);
                      setCxpModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingCxp ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : cxp.length === 0 ? (
            <EmptyState
              icon={<ArrowUpRight className="w-16 h-16" />}
              title="No hay cuentas por pagar"
              description="Registre las obligaciones financieras de su empresa"
              action={
                canCreate ? { label: 'Nueva CxP', onClick: () => setCxpModal(true) } : undefined
              }
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
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Proveedor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Saldo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vencimiento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {cxp.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {c.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.concepto}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.proveedor_nombre ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(dec(c.monto_total))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-warning-600">
                          {formatCurrency(dec(c.saldo_pendiente))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            {c.fecha_vencimiento}
                            {c.dias_para_vencimiento < 0 && (
                              <AlertTriangle className="w-4 h-4 text-danger-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getEstadoBadge(c.estado).variant} size="sm">
                            {getEstadoBadge(c.estado).label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===== Cuentas por Cobrar ===== */}
      {activeTab === 'cxc' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Total Pendiente"
              value={formatCurrency(dec(cxcStats?.total_pendiente))}
              icon={<DollarSign className="w-6 h-6" />}
              color="success"
            />
            <KpiCard
              label="Pendientes"
              value={cxcStats?.cantidad_pendientes ?? 0}
              icon={<Clock className="w-6 h-6" />}
              color="warning"
            />
            <KpiCard
              label="Vencidas"
              value={cxcStats?.cantidad_vencidas ?? 0}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="danger"
            />
            <KpiCard
              label="Total Vencido"
              value={formatCurrency(dec(cxcStats?.total_vencido))}
              icon={<ArrowDownRight className="w-6 h-6" />}
              color="danger"
            />
          </KpiCardGrid>

          <SectionToolbar
            title="Cuentas por Cobrar"
            count={cxc.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nueva CxC',
                    onClick: () => {
                      setSelectedCxc(null);
                      setCxcModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingCxc ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : cxc.length === 0 ? (
            <EmptyState
              icon={<ArrowDownRight className="w-16 h-16" />}
              title="No hay cuentas por cobrar"
              description="Registre las facturas pendientes de cobro"
              action={
                canCreate ? { label: 'Nueva CxC', onClick: () => setCxcModal(true) } : undefined
              }
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
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Saldo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vencimiento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {cxc.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {c.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.concepto}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.cliente_nombre ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(dec(c.monto_total))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-success-600">
                          {formatCurrency(dec(c.saldo_pendiente))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            {c.fecha_vencimiento}
                            {c.dias_para_vencimiento < 0 && (
                              <AlertTriangle className="w-4 h-4 text-danger-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getEstadoBadge(c.estado).variant} size="sm">
                            {getEstadoBadge(c.estado).label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===== Pagos y Recaudos ===== */}
      {activeTab === 'pagos-recaudos' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Total Pagos"
              value={formatCurrency(totalPagos)}
              icon={<ArrowUpRight className="w-6 h-6" />}
              color="danger"
            />
            <KpiCard
              label="Total Recaudos"
              value={formatCurrency(totalRecaudos)}
              icon={<ArrowDownRight className="w-6 h-6" />}
              color="success"
            />
            <KpiCard
              label="Pagos Registrados"
              value={pagos.length}
              icon={<RefreshCw className="w-6 h-6" />}
              color="blue"
            />
            <KpiCard
              label="Recaudos Registrados"
              value={recaudos.length}
              icon={<Calendar className="w-6 h-6" />}
              color="info"
            />
          </KpiCardGrid>

          {/* Pagos */}
          <SectionToolbar
            title="Pagos Realizados"
            count={pagos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Registrar Pago',
                    onClick: () => {
                      setSelectedPago(null);
                      setPagoModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingPagos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : pagos.length === 0 ? (
            <EmptyState
              icon={<ArrowUpRight className="w-16 h-16" />}
              title="No hay pagos registrados"
              description="Registre los pagos realizados a proveedores"
              action={
                canCreate
                  ? { label: 'Registrar Pago', onClick: () => setPagoModal(true) }
                  : undefined
              }
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
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Proveedor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Método
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Referencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {pagos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {p.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {p.fecha_pago}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {p.cuenta_concepto}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {p.proveedor_nombre ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-danger-600">
                          -{formatCurrency(dec(p.monto))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {p.metodo_pago_display}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {p.referencia}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Recaudos */}
          <SectionToolbar
            title="Recaudos"
            count={recaudos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Registrar Recaudo',
                    onClick: () => {
                      setSelectedRecaudo(null);
                      setRecaudoModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingRecaudos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : recaudos.length === 0 ? (
            <EmptyState
              icon={<ArrowDownRight className="w-16 h-16" />}
              title="No hay recaudos registrados"
              description="Registre los cobros realizados a clientes"
              action={
                canCreate
                  ? { label: 'Registrar Recaudo', onClick: () => setRecaudoModal(true) }
                  : undefined
              }
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
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Método
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Referencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {recaudos.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {r.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {r.fecha_recaudo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {r.cuenta_concepto}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {r.cliente_nombre ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-success-600">
                          +{formatCurrency(dec(r.monto))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {r.metodo_pago_display}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {r.referencia}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <BancoFormModal
        item={selectedBanco}
        isOpen={bancoModal}
        onClose={() => {
          setSelectedBanco(null);
          setBancoModal(false);
        }}
      />
      <CuentaPorPagarFormModal
        item={selectedCxp}
        isOpen={cxpModal}
        onClose={() => {
          setSelectedCxp(null);
          setCxpModal(false);
        }}
      />
      <CuentaPorCobrarFormModal
        item={selectedCxc}
        isOpen={cxcModal}
        onClose={() => {
          setSelectedCxc(null);
          setCxcModal(false);
        }}
      />
      <PagoFormModal
        item={selectedPago}
        isOpen={pagoModal}
        onClose={() => {
          setSelectedPago(null);
          setPagoModal(false);
        }}
      />
      <RecaudoFormModal
        item={selectedRecaudo}
        isOpen={recaudoModal}
        onClose={() => {
          setSelectedRecaudo(null);
          setRecaudoModal(false);
        }}
      />
    </div>
  );
}
