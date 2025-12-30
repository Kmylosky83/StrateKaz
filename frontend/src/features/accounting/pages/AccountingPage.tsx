/**
 * Página Principal: Contabilidad (Módulo Activable)
 *
 * Dashboard de contabilidad con acceso a:
 * - Configuración: Plan de cuentas PUC
 * - Movimientos: Comprobantes contables
 * - Informes: Estados financieros
 * - Integración: Conexión con otros módulos
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Link2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  FileText,
  Settings,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockResumen = {
  configuracion: {
    ejercicio_actual: 2024,
    periodo_actual: 12,
    cuentas_activas: 245,
    plan_cuentas: 'PUC Colombia',
  },
  movimientos: {
    comprobantes_mes: 156,
    total_debitos: 1250000000,
    total_creditos: 1250000000,
    pendientes_contabilizar: 8,
  },
  informes: {
    ultimo_balance: '2024-11-30',
    ultimo_estado_resultados: '2024-11-30',
    informes_generados: 24,
  },
  integracion: {
    modulos_integrados: 4,
    cola_pendiente: 12,
    errores_recientes: 2,
  },
};

const mockComprobantesRecientes = [
  { id: 1, numero: 'CE-2024-0156', tipo: 'Egreso', fecha: '2024-12-28', concepto: 'Pago proveedores', debito: 15800000, credito: 15800000, estado: 'contabilizado' },
  { id: 2, numero: 'CI-2024-0089', tipo: 'Ingreso', fecha: '2024-12-27', concepto: 'Recaudo clientes', debito: 28500000, credito: 28500000, estado: 'contabilizado' },
  { id: 3, numero: 'NC-2024-0045', tipo: 'Nota Contable', fecha: '2024-12-26', concepto: 'Ajuste depreciación', debito: 4500000, credito: 4500000, estado: 'borrador' },
  { id: 4, numero: 'CE-2024-0155', tipo: 'Egreso', fecha: '2024-12-25', concepto: 'Pago nómina', debito: 45000000, credito: 45000000, estado: 'contabilizado' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

// ==================== COMPONENTS ====================

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
  stats: { label: string; value: string | number }[];
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
            <span className="font-medium text-gray-900 dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

export default function AccountingPage() {
  const navigate = useNavigate();
  const resumen = mockResumen;
  const comprobantes = mockComprobantesRecientes;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contabilidad"
        description="Sistema de contabilidad integrado - Plan Único de Cuentas (PUC) Colombia"
      />

      {/* Información del Período */}
      <Card variant="bordered" padding="md" className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow">
              <Calculator className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ejercicio {resumen.configuracion.ejercicio_actual} - Período {resumen.configuracion.periodo_actual}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {resumen.configuracion.plan_cuentas} • {resumen.configuracion.cuentas_activas} cuentas activas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">Período Abierto</Badge>
            <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
              Configuración
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Débitos del Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(resumen.movimientos.total_debitos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Créditos del Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(resumen.movimientos.total_creditos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprobantes</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{resumen.movimientos.comprobantes_mes}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="text-sm text-warning-600 mt-2">{resumen.movimientos.pendientes_contabilizar} pendientes</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cola Integración</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{resumen.integracion.cola_pendiente}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Link2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          {resumen.integracion.errores_recientes > 0 && (
            <p className="text-sm text-danger-600 mt-2">{resumen.integracion.errores_recientes} errores</p>
          )}
        </Card>
      </div>

      {/* Módulos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModuloCard
          titulo="Configuración Contable"
          icono={<BookOpen className="w-6 h-6 text-white" />}
          color="bg-primary-600"
          stats={[
            { label: 'Plan de cuentas', value: resumen.configuracion.plan_cuentas },
            { label: 'Cuentas activas', value: resumen.configuracion.cuentas_activas },
            { label: 'Ejercicio', value: resumen.configuracion.ejercicio_actual },
          ]}
          ruta="/contabilidad/configuracion"
        />

        <ModuloCard
          titulo="Movimientos"
          icono={<FileSpreadsheet className="w-6 h-6 text-white" />}
          color="bg-blue-600"
          stats={[
            { label: 'Comprobantes mes', value: resumen.movimientos.comprobantes_mes },
            { label: 'Pendientes', value: resumen.movimientos.pendientes_contabilizar },
            { label: 'Débitos = Créditos', value: 'Cuadrado' },
          ]}
          ruta="/contabilidad/movimientos"
        />

        <ModuloCard
          titulo="Informes Contables"
          icono={<BarChart3 className="w-6 h-6 text-white" />}
          color="bg-green-600"
          stats={[
            { label: 'Último balance', value: resumen.informes.ultimo_balance },
            { label: 'Estado resultados', value: resumen.informes.ultimo_estado_resultados },
            { label: 'Generados', value: resumen.informes.informes_generados },
          ]}
          ruta="/contabilidad/informes"
        />

        <ModuloCard
          titulo="Integración"
          icono={<Link2 className="w-6 h-6 text-white" />}
          color="bg-orange-600"
          stats={[
            { label: 'Módulos integrados', value: resumen.integracion.modulos_integrados },
            { label: 'En cola', value: resumen.integracion.cola_pendiente },
            { label: 'Errores', value: resumen.integracion.errores_recientes },
          ]}
          ruta="/contabilidad/integracion"
        />
      </div>

      {/* Comprobantes Recientes */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comprobantes Recientes</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/contabilidad/movimientos')}>
            Ver todos
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débito</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédito</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {comprobantes.map((comp) => (
                <tr key={comp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{comp.numero}</td>
                  <td className="px-4 py-3">
                    <Badge variant={comp.tipo === 'Ingreso' ? 'success' : comp.tipo === 'Egreso' ? 'danger' : 'primary'} size="sm">
                      {comp.tipo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{comp.fecha}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{comp.concepto}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right text-blue-600">{formatCurrency(comp.debito)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right text-green-600">{formatCurrency(comp.credito)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={comp.estado === 'contabilizado' ? 'success' : 'warning'} size="sm">
                      {comp.estado.charAt(0).toUpperCase() + comp.estado.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
