/**
 * Página: Servicios Generales
 *
 * Control de servicios y gastos operativos:
 * - Contratos de Servicios
 * - Gastos Operativos
 * - Consumos de Servicios Públicos
 */
import { useState } from 'react';
import {
  Wrench,
  FileText,
  Zap,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  TrendingUp,
  Droplet,
  Flame,
  Wifi,
  Building,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockContratos = [
  { id: 1, codigo: 'CT-001', nombre: 'Vigilancia Sede Principal', proveedor: 'Seguridad ABC', tipo: 'vigilancia', valor_mensual: 8500000, fecha_inicio: '2024-01-01', fecha_fin: '2024-12-31', estado: 'activo' },
  { id: 2, codigo: 'CT-002', nombre: 'Arrendamiento Bodega A', proveedor: 'Inmobiliaria XYZ', tipo: 'arrendamiento', valor_mensual: 12000000, fecha_inicio: '2024-03-01', fecha_fin: '2025-02-28', estado: 'activo' },
  { id: 3, codigo: 'CT-003', nombre: 'Aseo y Cafetería', proveedor: 'Servicios Integrales', tipo: 'aseo', valor_mensual: 4500000, fecha_inicio: '2024-06-01', fecha_fin: '2025-05-31', estado: 'activo' },
  { id: 4, codigo: 'CT-004', nombre: 'Internet Fibra Óptica', proveedor: 'Claro Colombia', tipo: 'comunicaciones', valor_mensual: 850000, fecha_inicio: '2024-01-15', fecha_fin: '2025-01-14', estado: 'activo' },
];

const mockGastos = [
  { id: 1, numero_factura: 'FV-12345', fecha: '2024-12-28', proveedor: 'EPM', categoria: 'servicios_publicos', concepto: 'Energía dic 2024', valor: 4800000, estado: 'registrado' },
  { id: 2, numero_factura: 'FV-12346', fecha: '2024-12-27', proveedor: 'Papelería Nacional', categoria: 'papeleria', concepto: 'Insumos oficina', valor: 650000, estado: 'aprobado' },
  { id: 3, numero_factura: 'FV-12347', fecha: '2024-12-26', proveedor: 'Transporte Express', categoria: 'transporte', concepto: 'Mensajería mes', valor: 890000, estado: 'pagado' },
  { id: 4, numero_factura: 'FV-12348', fecha: '2024-12-25', proveedor: 'Aguas de Cartagena', categoria: 'servicios_publicos', concepto: 'Agua dic 2024', valor: 1200000, estado: 'pendiente' },
];

const mockConsumos = [
  { id: 1, tipo: 'energia', periodo: '2024-12', lectura_anterior: 45000, lectura_actual: 48500, consumo: 3500, unidad: 'kWh', valor: 4800000, estado: 'pendiente' },
  { id: 2, tipo: 'agua', periodo: '2024-12', lectura_anterior: 1200, lectura_actual: 1350, consumo: 150, unidad: 'm³', valor: 1200000, estado: 'pagado' },
  { id: 3, tipo: 'gas', periodo: '2024-12', lectura_anterior: 890, lectura_actual: 920, consumo: 30, unidad: 'm³', valor: 450000, estado: 'pendiente' },
  { id: 4, tipo: 'internet', periodo: '2024-12', lectura_anterior: 0, lectura_actual: 0, consumo: 0, unidad: 'GB', valor: 850000, estado: 'pagado' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

const getTipoContratoIcon = (tipo: string) => {
  switch (tipo) {
    case 'vigilancia': return <Building className="w-5 h-5" />;
    case 'arrendamiento': return <Building className="w-5 h-5" />;
    case 'aseo': return <Wrench className="w-5 h-5" />;
    case 'comunicaciones': return <Wifi className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
};

const getTipoConsumoIcon = (tipo: string) => {
  switch (tipo) {
    case 'energia': return <Zap className="w-5 h-5 text-yellow-500" />;
    case 'agua': return <Droplet className="w-5 h-5 text-blue-500" />;
    case 'gas': return <Flame className="w-5 h-5 text-orange-500" />;
    case 'internet': return <Wifi className="w-5 h-5 text-purple-500" />;
    default: return <Zap className="w-5 h-5" />;
  }
};

// ==================== SECTIONS ====================

const ContratosSection = () => {
  const contratos = mockContratos;
  const totalMensual = contratos.reduce((s, c) => s + c.valor_mensual, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contratos Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{contratos.filter(c => c.estado === 'activo').length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gasto Mensual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalMensual)}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Por Vencer</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">2</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gasto Anual Est.</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(totalMensual * 12)}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contratos de Servicios</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Contrato</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contratos.map((contrato) => (
          <Card key={contrato.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  {getTipoContratoIcon(contrato.tipo)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{contrato.nombre}</h4>
                  <p className="text-sm text-gray-500">{contrato.proveedor}</p>
                </div>
              </div>
              <Badge variant={contrato.estado === 'activo' ? 'success' : 'warning'} size="sm">
                {contrato.estado.charAt(0).toUpperCase() + contrato.estado.slice(1)}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor mensual</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(contrato.valor_mensual)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vigencia</span>
                <span className="text-gray-900 dark:text-white">{contrato.fecha_inicio} - {contrato.fecha_fin}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver</Button>
              <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
              <Button variant="ghost" size="sm" leftIcon={<Calendar className="w-4 h-4" />}>Renovar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const GastosSection = () => {
  const gastos = mockGastos;
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gastos Operativos</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Exportar</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Gasto</Button>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {gastos.map((gasto) => (
                <tr key={gasto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{gasto.numero_factura}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{gasto.fecha}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{gasto.proveedor}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{gasto.concepto}</td>
                  <td className="px-6 py-4">
                    <Badge variant="gray" size="sm">{gasto.categoria.replace('_', ' ').charAt(0).toUpperCase() + gasto.categoria.slice(1).replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{formatCurrency(gasto.valor)}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={gasto.estado === 'pagado' ? 'success' : gasto.estado === 'aprobado' ? 'primary' : gasto.estado === 'registrado' ? 'warning' : 'gray'}
                      size="sm"
                    >
                      {gasto.estado.charAt(0).toUpperCase() + gasto.estado.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><CheckCircle className="w-4 h-4 text-success-600" /></Button>
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

const ConsumosSection = () => {
  const consumos = mockConsumos;
  const totalConsumos = consumos.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Servicios</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalConsumos)}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        {consumos.slice(0, 3).map((consumo) => (
          <Card key={consumo.id} variant="bordered" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{consumo.tipo}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{consumo.consumo} {consumo.unidad}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {getTipoConsumoIcon(consumo.tipo)}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{formatCurrency(consumo.valor)}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consumos de Servicios Públicos</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Registrar Consumo</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lectura Ant.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lectura Act.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Consumo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {consumos.map((consumo) => (
                <tr key={consumo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTipoConsumoIcon(consumo.tipo)}
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{consumo.tipo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{consumo.periodo}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{consumo.lectura_anterior.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{consumo.lectura_actual.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{consumo.consumo.toLocaleString()} {consumo.unidad}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{formatCurrency(consumo.valor)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={consumo.estado === 'pagado' ? 'success' : consumo.estado === 'pendiente' ? 'warning' : 'danger'} size="sm">
                      {consumo.estado.charAt(0).toUpperCase() + consumo.estado.slice(1)}
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
};

// ==================== MAIN COMPONENT ====================

export default function ServiciosGeneralesPage() {
  const [activeTab, setActiveTab] = useState('contratos');

  const tabs = [
    { id: 'contratos', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
    { id: 'gastos', label: 'Gastos Operativos', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'consumos', label: 'Servicios Públicos', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Servicios Generales" description="Gestión de contratos, gastos operativos y consumos de servicios públicos" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      <div className="mt-6">
        {activeTab === 'contratos' && <ContratosSection />}
        {activeTab === 'gastos' && <GastosSection />}
        {activeTab === 'consumos' && <ConsumosSection />}
      </div>
    </div>
  );
}
