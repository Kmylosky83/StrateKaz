/**
 * Pagina: Tesoreria
 *
 * Tabs: Bancos, Cuentas por Pagar, Cuentas por Cobrar, Pagos y Recaudos
 * Conectada a hooks reales del backend.
 */
import { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Calendar,
  Plus,
  Eye,
  Edit,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
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
  BancoList,
  CuentaPorPagarList,
  CuentaPorCobrarList,
  PagoList,
  RecaudoList,
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
    pendiente: { variant: 'warning', label: 'Pendiente' },
    parcial: { variant: 'primary', label: 'Parcial' },
    pagada: { variant: 'success', label: 'Pagada' },
    cobrada: { variant: 'success', label: 'Cobrada' },
    anulada: { variant: 'gray', label: 'Anulada' },
    activa: { variant: 'success', label: 'Activa' },
    inactiva: { variant: 'gray', label: 'Inactiva' },
    bloqueada: { variant: 'danger', label: 'Bloqueada' },
  };
  return map[estado] ?? { variant: 'gray' as const, label: estado };
};

// ==================== SECTIONS ====================

const BancosSection = () => {
  const { data: bancosData, isLoading } = useBancos();
  const { data: saldos } = useBancoSaldos();

  const bancos = extractResults<BancoList>(bancosData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(dec(saldos?.total_saldo_actual))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Disponible</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {formatCurrency(dec(saldos?.total_saldo_disponible))}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprometido</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">
                {formatCurrency(dec(saldos?.total_saldo_comprometido))}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cuentas Activas</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {saldos?.cuentas_activas ?? bancos.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cuentas Bancarias</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Cuenta
        </Button>
      </div>

      {/* Cuentas Grid */}
      {bancos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bancos.map((banco) => {
            const badge = getEstadoBadge(banco.estado);
            return (
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
                  <Badge variant={badge.variant} size="sm">
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
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                    Editar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay cuentas bancarias registradas
          </p>
        </Card>
      )}
    </div>
  );
};

const CuentasPorPagarSection = () => {
  const { data: cxpData, isLoading } = useCuentasPorPagar();
  const { data: stats } = useCuentasPorPagarEstadisticas();

  const cuentas = extractResults<CuentaPorPagarList>(cxpData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(dec(stats?.total_pendiente))}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">
                {stats?.cantidad_pendientes ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {stats?.cantidad_vencidas ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vencido</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {formatCurrency(dec(stats?.total_vencido))}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cuentas por Pagar</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Cuenta por Pagar
        </Button>
      </div>

      {/* Table */}
      {cuentas.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimiento
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
                {cuentas.map((cxp) => {
                  const badge = getEstadoBadge(cxp.estado);
                  return (
                    <tr key={cxp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {cxp.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {cxp.concepto}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {cxp.proveedor_nombre ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                        {formatCurrency(dec(cxp.monto_total))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-warning-600">
                        {formatCurrency(dec(cxp.saldo_pendiente))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          {cxp.fecha_vencimiento}
                          {cxp.dias_para_vencimiento < 0 && (
                            <AlertTriangle className="w-4 h-4 text-danger-600" />
                          )}
                        </div>
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
            No hay cuentas por pagar registradas
          </p>
        </Card>
      )}
    </div>
  );
};

const CuentasPorCobrarSection = () => {
  const { data: cxcData, isLoading } = useCuentasPorCobrar();
  const { data: stats } = useCuentasPorCobrarEstadisticas();

  const cuentas = extractResults<CuentaPorCobrarList>(cxcData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(dec(stats?.total_pendiente))}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">
                {stats?.cantidad_pendientes ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {stats?.cantidad_vencidas ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vencido</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {formatCurrency(dec(stats?.total_vencido))}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cuentas por Cobrar</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Cuenta por Cobrar
        </Button>
      </div>

      {/* Table */}
      {cuentas.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimiento
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
                {cuentas.map((cxc) => {
                  const badge = getEstadoBadge(cxc.estado);
                  return (
                    <tr key={cxc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {cxc.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {cxc.concepto}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {cxc.cliente_nombre ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                        {formatCurrency(dec(cxc.monto_total))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-success-600">
                        {formatCurrency(dec(cxc.saldo_pendiente))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          {cxc.fecha_vencimiento}
                          {cxc.dias_para_vencimiento < 0 && (
                            <AlertTriangle className="w-4 h-4 text-danger-600" />
                          )}
                        </div>
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
            No hay cuentas por cobrar registradas
          </p>
        </Card>
      )}
    </div>
  );
};

const PagosRecaudosSection = () => {
  const { data: pagosData, isLoading: loadingPagos } = usePagos();
  const { data: recaudosData, isLoading: loadingRecaudos } = useRecaudos();

  const pagos = extractResults<PagoList>(pagosData);
  const recaudos = extractResults<RecaudoList>(recaudosData);

  if (loadingPagos || loadingRecaudos) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const totalPagos = pagos.reduce((s, p) => s + dec(p.monto), 0);
  const totalRecaudos = recaudos.reduce((s, r) => s + dec(r.monto), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pagos</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {formatCurrency(totalPagos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Recaudos</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {formatCurrency(totalRecaudos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagos Registrados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {pagos.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recaudos Registrados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {recaudos.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pagos */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pagos Realizados</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Registrar Pago
        </Button>
      </div>

      {pagos.length > 0 ? (
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
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Metodo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Referencia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {pago.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {pago.fecha_pago}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {pago.cuenta_concepto}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {pago.proveedor_nombre ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-danger-600">
                      -{formatCurrency(dec(pago.monto))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {pago.metodo_pago_display}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {pago.referencia}
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
            No hay pagos registrados
          </p>
        </Card>
      )}

      {/* Recaudos */}
      <div className="flex items-center justify-between mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recaudos</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Registrar Recaudo
        </Button>
      </div>

      {recaudos.length > 0 ? (
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
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Metodo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Referencia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recaudos.map((recaudo) => (
                  <tr key={recaudo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {recaudo.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {recaudo.fecha_recaudo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {recaudo.cuenta_concepto}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {recaudo.cliente_nombre ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-success-600">
                      +{formatCurrency(dec(recaudo.monto))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {recaudo.metodo_pago_display}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {recaudo.referencia}
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
            No hay recaudos registrados
          </p>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function TesoreriaPage() {
  const [activeTab, setActiveTab] = useState('bancos');

  const tabs = [
    { id: 'bancos', label: 'Bancos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'cxp', label: 'Cuentas por Pagar', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'cxc', label: 'Cuentas por Cobrar', icon: <ArrowDownRight className="w-4 h-4" /> },
    { id: 'pagos-recaudos', label: 'Pagos y Recaudos', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tesoreria"
        description="Gestion de cuentas bancarias, pagos, cobros y flujo de caja"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'bancos' && <BancosSection />}
        {activeTab === 'cxp' && <CuentasPorPagarSection />}
        {activeTab === 'cxc' && <CuentasPorCobrarSection />}
        {activeTab === 'pagos-recaudos' && <PagosRecaudosSection />}
      </div>
    </div>
  );
}
