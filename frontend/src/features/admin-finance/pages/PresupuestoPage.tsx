/**
 * Página: Presupuesto
 *
 * Control presupuestal con subsecciones:
 * - Presupuestos Anuales
 * - Rubros Presupuestales
 * - Ejecución Presupuestal
 * - CDP/CRP
 */
import { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  ArrowRightLeft,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockPresupuesto = {
  total: 1200000000,
  ejecutado: 720000000,
  comprometido: 180000000,
  disponible: 300000000,
  rubros: [
    { id: 1, codigo: 'R-001', nombre: 'Gastos de Personal', tipo: 'gasto', asignado: 480000000, ejecutado: 320000000, disponible: 160000000 },
    { id: 2, codigo: 'R-002', nombre: 'Gastos Operacionales', tipo: 'gasto', asignado: 360000000, ejecutado: 240000000, disponible: 120000000 },
    { id: 3, codigo: 'R-003', nombre: 'Inversiones', tipo: 'gasto', asignado: 240000000, ejecutado: 100000000, disponible: 140000000 },
    { id: 4, codigo: 'R-004', nombre: 'Gastos Financieros', tipo: 'gasto', asignado: 120000000, ejecutado: 60000000, disponible: 60000000 },
  ],
  ejecuciones: [
    { id: 1, rubro: 'Gastos de Personal', tipo: 'pago', numero: 'EJ-001', fecha: '2024-12-28', concepto: 'Pago nómina', valor: 45000000 },
    { id: 2, rubro: 'Gastos Operacionales', tipo: 'compromiso', numero: 'EJ-002', fecha: '2024-12-27', concepto: 'Compra insumos', valor: 12000000 },
    { id: 3, rubro: 'Inversiones', tipo: 'causacion', numero: 'EJ-003', fecha: '2024-12-26', concepto: 'Equipos de cómputo', valor: 25000000 },
  ],
  cdpCrp: [
    { id: 1, tipo: 'cdp', numero: 'CDP-001', fecha: '2024-12-20', objeto: 'Adquisición de materiales', valor: 35000000, estado: 'vigente' },
    { id: 2, tipo: 'crp', numero: 'CRP-001', fecha: '2024-12-22', objeto: 'Servicios profesionales', valor: 18000000, estado: 'ejecutado' },
    { id: 3, tipo: 'cdp', numero: 'CDP-002', fecha: '2024-12-25', objeto: 'Mantenimiento equipos', valor: 8000000, estado: 'vigente' },
  ],
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

// ==================== SECTIONS ====================

const PresupuestosSection = () => {
  const { total, ejecutado, comprometido, disponible } = mockPresupuesto;
  const porcentajeEjecucion = (ejecutado / total) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Presupuesto Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(total)}</p>
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
              <p className="text-2xl font-bold text-success-600 mt-1">{formatCurrency(ejecutado)}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <p className="text-sm text-success-600 mt-2">{porcentajeEjecucion.toFixed(1)}% del total</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprometido</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{formatCurrency(comprometido)}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(disponible)}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card variant="bordered" padding="md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ejecución por Rubros</h3>
        <div className="space-y-4">
          {mockPresupuesto.rubros.map((rubro) => {
            const porcentaje = (rubro.ejecutado / rubro.asignado) * 100;
            return (
              <div key={rubro.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{rubro.nombre}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{porcentaje.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                  <div className={cn('h-full rounded-full', porcentaje > 90 ? 'bg-danger-600' : porcentaje > 75 ? 'bg-warning-600' : 'bg-success-600')} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Ejecutado: {formatCurrency(rubro.ejecutado)}</span>
                  <span>Disponible: {formatCurrency(rubro.disponible)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const EjecucionSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ejecuciones Presupuestales</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Exportar</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nueva Ejecución</Button>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rubro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockPresupuesto.ejecuciones.map((ej) => (
                <tr key={ej.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{ej.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ej.fecha}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ej.rubro}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ej.concepto}</td>
                  <td className="px-6 py-4">
                    <Badge variant={ej.tipo === 'pago' ? 'success' : ej.tipo === 'compromiso' ? 'warning' : 'primary'} size="sm">
                      {ej.tipo.charAt(0).toUpperCase() + ej.tipo.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{formatCurrency(ej.valor)}</td>
                  <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const CdpCrpSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CDP y CRP</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo CDP</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo CRP</Button>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objeto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockPresupuesto.cdpCrp.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <Badge variant={item.tipo === 'cdp' ? 'primary' : 'success'} size="sm">{item.tipo.toUpperCase()}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.fecha}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.objeto}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{formatCurrency(item.valor)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={item.estado === 'vigente' ? 'success' : item.estado === 'ejecutado' ? 'primary' : 'danger'} size="sm">
                      {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
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

export default function PresupuestoPage() {
  const [activeTab, setActiveTab] = useState('presupuestos');

  const tabs = [
    { id: 'presupuestos', label: 'Presupuestos', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ejecucion', label: 'Ejecución', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'cdp-crp', label: 'CDP / CRP', icon: <FileText className="w-4 h-4" /> },
    { id: 'traslados', label: 'Traslados', icon: <ArrowRightLeft className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Presupuesto" description="Control y seguimiento presupuestal, ejecuciones y certificados" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      <div className="mt-6">
        {activeTab === 'presupuestos' && <PresupuestosSection />}
        {activeTab === 'ejecucion' && <EjecucionSection />}
        {activeTab === 'cdp-crp' && <CdpCrpSection />}
        {activeTab === 'traslados' && <div className="p-8 text-center text-gray-500">Traslados Presupuestales - Próximamente</div>}
      </div>
    </div>
  );
}
