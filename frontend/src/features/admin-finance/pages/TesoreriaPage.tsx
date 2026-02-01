/**
 * Página: Tesorería
 *
 * Gestión completa de tesorería con subsecciones:
 * - Cuentas Bancarias
 * - Movimientos Bancarios
 * - Flujo de Caja
 * - Programación de Pagos
 * - Caja Chica
 */
import { useState } from 'react';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  DollarSign,
  Building,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== MOCK DATA ====================

const mockCuentas = [
  { id: 1, codigo: 'CB-001', nombre: 'Bancolombia Corriente Principal', banco: 'Bancolombia', numero_cuenta: '****4567', tipo_cuenta: 'corriente', saldo_actual: 125800000, activa: true },
  { id: 2, codigo: 'CB-002', nombre: 'Davivienda Ahorros', banco: 'Davivienda', numero_cuenta: '****8901', tipo_cuenta: 'ahorros', saldo_actual: 45600000, activa: true },
  { id: 3, codigo: 'CB-003', nombre: 'BBVA Corriente Proveedores', banco: 'BBVA', numero_cuenta: '****2345', tipo_cuenta: 'corriente', saldo_actual: 32450000, activa: true },
  { id: 4, codigo: 'CB-004', nombre: 'CDT Bancolombia 90 días', banco: 'Bancolombia', numero_cuenta: '****6789', tipo_cuenta: 'cdt', saldo_actual: 50000000, activa: true },
];

const mockMovimientos = [
  { id: 1, numero_documento: 'MOV-001', fecha: '2024-12-28', concepto: 'Recaudo cliente ABC', tipo_movimiento: 'ingreso', valor: 15800000, cuenta_nombre: 'Bancolombia Corriente', conciliado: false },
  { id: 2, numero_documento: 'MOV-002', fecha: '2024-12-27', concepto: 'Pago proveedor XYZ', tipo_movimiento: 'egreso', valor: 8500000, cuenta_nombre: 'BBVA Corriente', conciliado: true },
  { id: 3, numero_documento: 'MOV-003', fecha: '2024-12-26', concepto: 'Transferencia entre cuentas', tipo_movimiento: 'transferencia', valor: 10000000, cuenta_nombre: 'Bancolombia Corriente', conciliado: false },
  { id: 4, numero_documento: 'MOV-004', fecha: '2024-12-25', concepto: 'Pago nómina quincenal', tipo_movimiento: 'egreso', valor: 23400000, cuenta_nombre: 'Bancolombia Corriente', conciliado: true },
  { id: 5, numero_documento: 'MOV-005', fecha: '2024-12-24', concepto: 'Recaudo varios clientes', tipo_movimiento: 'ingreso', valor: 28500000, cuenta_nombre: 'Davivienda Ahorros', conciliado: true },
];

const mockPagos = [
  { id: 1, proveedor_nombre: 'Proveedor ABC', concepto: 'Factura FV-1234', valor: 12500000, fecha_vencimiento: '2024-12-30', estado: 'pendiente', prioridad: 'alta' },
  { id: 2, proveedor_nombre: 'Servicios XYZ', concepto: 'Servicio de vigilancia', valor: 4800000, fecha_vencimiento: '2024-12-31', estado: 'programado', prioridad: 'media' },
  { id: 3, proveedor_nombre: 'Materia Prima SAS', concepto: 'Compra insumos', valor: 8900000, fecha_vencimiento: '2025-01-05', estado: 'pendiente', prioridad: 'alta' },
  { id: 4, proveedor_nombre: 'EPM', concepto: 'Servicios públicos', valor: 3200000, fecha_vencimiento: '2025-01-02', estado: 'vencido', prioridad: 'alta' },
];

const mockCajasChicas = [
  { id: 1, codigo: 'CC-001', nombre: 'Caja Chica Administración', responsable_nombre: 'María García', fondo_fijo: 2000000, saldo_actual: 850000, estado: 'activa' },
  { id: 2, codigo: 'CC-002', nombre: 'Caja Chica Producción', responsable_nombre: 'Juan Pérez', fondo_fijo: 1500000, saldo_actual: 1200000, estado: 'activa' },
  { id: 3, codigo: 'CC-003', nombre: 'Caja Chica Logística', responsable_nombre: 'Carlos Rodríguez', fondo_fijo: 1000000, saldo_actual: 450000, estado: 'en_reembolso' },
];

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

const getTipoMovimientoBadge = (tipo: string) => {
  const config: Record<string, { variant: 'success' | 'danger' | 'primary' | 'warning' | 'info'; label: string }> = {
    ingreso: { variant: 'success', label: 'Ingreso' },
    egreso: { variant: 'danger', label: 'Egreso' },
    transferencia: { variant: 'primary', label: 'Transferencia' },
    nota_debito: { variant: 'warning', label: 'Nota Débito' },
    nota_credito: { variant: 'info', label: 'Nota Crédito' },
  };
  return config[tipo] || { variant: 'gray' as const, label: tipo };
};

const getEstadoPagoBadge = (estado: string) => {
  const config: Record<string, { variant: 'success' | 'warning' | 'danger' | 'primary'; label: string }> = {
    pendiente: { variant: 'warning', label: 'Pendiente' },
    programado: { variant: 'primary', label: 'Programado' },
    pagado: { variant: 'success', label: 'Pagado' },
    vencido: { variant: 'danger', label: 'Vencido' },
  };
  return config[estado] || { variant: 'gray' as const, label: estado };
};

const getEstadoCajaChicaBadge = (estado: string) => {
  const config: Record<string, { variant: 'success' | 'warning' | 'primary'; label: string }> = {
    activa: { variant: 'success', label: 'Activa' },
    en_reembolso: { variant: 'warning', label: 'En Reembolso' },
    cerrada: { variant: 'primary', label: 'Cerrada' },
  };
  return config[estado] || { variant: 'gray' as const, label: estado };
};

// ==================== SECTIONS ====================

const CuentasBancariasSection = () => {
  const cuentas = mockCuentas;
  const saldoTotal = cuentas.reduce((sum, c) => sum + c.saldo_actual, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(saldoTotal)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cuentas Activas</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{cuentas.filter(c => c.activa).length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En CDT</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(cuentas.filter(c => c.tipo_cuenta === 'cdt').reduce((s, c) => s + c.saldo_actual, 0))}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{formatCurrency(cuentas.filter(c => c.tipo_cuenta !== 'cdt').reduce((s, c) => s + c.saldo_actual, 0))}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-success-600" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cuentas.map((cuenta) => (
          <Card key={cuenta.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{cuenta.nombre}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{cuenta.banco} - {cuenta.numero_cuenta}</p>
              </div>
              <Badge variant={cuenta.activa ? 'success' : 'gray'} size="sm">
                {cuenta.tipo_cuenta.charAt(0).toUpperCase() + cuenta.tipo_cuenta.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Saldo actual</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(cuenta.saldo_actual)}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver</Button>
              <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>Conciliar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const MovimientosBancariosSection = () => {
  const movimientos = mockMovimientos;
  const totalIngresos = movimientos.filter(m => m.tipo_movimiento === 'ingreso').reduce((s, m) => s + m.valor, 0);
  const totalEgresos = movimientos.filter(m => m.tipo_movimiento === 'egreso').reduce((s, m) => s + m.valor, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Movimientos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{movimientos.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{formatCurrency(totalIngresos)}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Egresos</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{formatCurrency(totalEgresos)}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sin Conciliar</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{movimientos.filter(m => !m.conciliado).length}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movimientos Bancarios</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Exportar</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Movimiento</Button>
        </div>
      </div>

      {/* Movimientos Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conciliado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {movimientos.map((mov) => {
                const tipoBadge = getTipoMovimientoBadge(mov.tipo_movimiento);
                return (
                  <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{mov.numero_documento}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{format(new Date(mov.fecha), 'dd/MM/yyyy', { locale: es })}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{mov.concepto}</td>
                    <td className="px-6 py-4"><Badge variant={tipoBadge.variant} size="sm">{tipoBadge.label}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{mov.cuenta_nombre}</td>
                    <td className={cn('px-6 py-4 text-sm font-medium text-right', mov.tipo_movimiento === 'ingreso' ? 'text-success-600' : mov.tipo_movimiento === 'egreso' ? 'text-danger-600' : 'text-gray-900 dark:text-white')}>
                      {mov.tipo_movimiento === 'ingreso' ? '+' : mov.tipo_movimiento === 'egreso' ? '-' : ''}{formatCurrency(mov.valor)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {mov.conciliado ? <CheckCircle className="w-5 h-5 text-success-600 mx-auto" /> : <Clock className="w-5 h-5 text-warning-600 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const ProgramacionPagosSection = () => {
  const pagos = mockPagos;
  const totalPendiente = pagos.filter(p => p.estado !== 'pagado').reduce((s, p) => s + p.valor, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalPendiente)}</p>
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
              <p className="text-2xl font-bold text-warning-600 mt-1">{pagos.filter(p => p.estado === 'pendiente').length}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programados</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{pagos.filter(p => p.estado === 'programado').length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidos</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{pagos.filter(p => p.estado === 'vencido').length}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Programación de Pagos</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Pago</Button>
        </div>
      </div>

      {/* Pagos Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pagos.map((pago) => {
                const estadoBadge = getEstadoPagoBadge(pago.estado);
                return (
                  <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{pago.proveedor_nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{pago.concepto}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{formatCurrency(pago.valor)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{format(new Date(pago.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}</td>
                    <td className="px-6 py-4">
                      <Badge variant={pago.prioridad === 'alta' ? 'danger' : pago.prioridad === 'media' ? 'warning' : 'gray'} size="sm">
                        {pago.prioridad.charAt(0).toUpperCase() + pago.prioridad.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4"><Badge variant={estadoBadge.variant} size="sm">{estadoBadge.label}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><CheckCircle className="w-4 h-4 text-success-600" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const CajasChicasSection = () => {
  const cajas = mockCajasChicas;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cajas Chicas</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nueva Caja Chica</Button>
      </div>

      {/* Cajas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cajas.map((caja) => {
          const estadoBadge = getEstadoCajaChicaBadge(caja.estado);
          const porcentaje = (caja.saldo_actual / caja.fondo_fijo) * 100;
          return (
            <Card key={caja.id} variant="bordered" padding="md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{caja.nombre}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{caja.responsable_nombre}</p>
                </div>
                <Badge variant={estadoBadge.variant} size="sm">{estadoBadge.label}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Fondo fijo</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(caja.fondo_fijo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Saldo actual</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(caja.saldo_actual)}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className={cn('h-full rounded-full', porcentaje > 50 ? 'bg-success-600' : porcentaje > 25 ? 'bg-warning-600' : 'bg-danger-600')} style={{ width: `${porcentaje}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver</Button>
                <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>Reembolsar</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function TesoreriaPage() {
  const [activeTab, setActiveTab] = useState('cuentas');

  const tabs = [
    { id: 'cuentas', label: 'Cuentas Bancarias', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'movimientos', label: 'Movimientos', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'pagos', label: 'Programación Pagos', icon: <Calendar className="w-4 h-4" /> },
    { id: 'cajas-chicas', label: 'Cajas Chicas', icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tesorería"
        description="Gestión de cuentas bancarias, movimientos, flujo de caja y programación de pagos"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'cuentas' && <CuentasBancariasSection />}
        {activeTab === 'movimientos' && <MovimientosBancariosSection />}
        {activeTab === 'pagos' && <ProgramacionPagosSection />}
        {activeTab === 'cajas-chicas' && <CajasChicasSection />}
      </div>
    </div>
  );
}
