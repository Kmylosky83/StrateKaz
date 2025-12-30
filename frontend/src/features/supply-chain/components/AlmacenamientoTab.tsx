/**
 * Tab de Gestión de Almacenamiento - Supply Chain
 *
 * Gestión de inventarios, movimientos, kardex, alertas y configuración de stock
 */
import { useState } from 'react';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import {
  Package,
  ArrowRightLeft,
  FileText,
  AlertTriangle,
  Settings,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Filter,
  Download,
  TrendingDown,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useInventarios,
  useMovimientosInventario,
  useAlertasStock,
  useConfiguracionesStock,
  useStockBajo,
  useStockCritico,
} from '../hooks';

// ==================== UTILITY FUNCTIONS ====================

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const getEstadoBadgeVariant = (estado: string): 'success' | 'primary' | 'warning' | 'danger' | 'gray' => {
  const estadosSuccess = ['DISPONIBLE', 'ACTIVO', 'RESUELTA'];
  const estadosPrimary = ['EN_TRANSITO', 'RESERVADO'];
  const estadosWarning = ['STOCK_BAJO', 'PENDIENTE', 'LEIDA'];
  const estadosDanger = ['STOCK_CRITICO', 'VENCIDO', 'NO_DISPONIBLE'];

  if (estadosSuccess.some(e => estado.includes(e))) return 'success';
  if (estadosPrimary.some(e => estado.includes(e))) return 'primary';
  if (estadosWarning.some(e => estado.includes(e))) return 'warning';
  if (estadosDanger.some(e => estado.includes(e))) return 'danger';
  return 'gray';
};

// ==================== INVENTARIOS SECTION ====================

const InventariosSection = () => {
  const { data, isLoading } = useInventarios();
  const { data: stockBajo } = useStockBajo();
  const { data: stockCritico } = useStockCritico();
  const inventarios = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  const stats = {
    total: inventarios.length,
    stockBajo: stockBajo?.length || 0,
    stockCritico: stockCritico?.length || 0,
    valorTotal: inventarios.reduce((acc: number, inv: any) => acc + (inv.valor_total || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Inventarios</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.stockBajo}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Crítico</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.stockCritico}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${stats.valorTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventarios</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Exportar</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Inventario</Button>
        </div>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {inventarios.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{inv.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{inv.producto_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inv.stock_actual} {inv.unidad_medida_codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inv.stock_minimo} {inv.unidad_medida_codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(inv.estado_codigo)} size="sm">
                      {formatEstado(inv.estado_nombre)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-danger-600" /></Button>
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

// ==================== MOVIMIENTOS SECTION ====================

const MovimientosSection = () => {
  const { data, isLoading } = useMovimientosInventario();
  const movimientos = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (movimientos.length === 0) {
    return (
      <EmptyState
        icon={<ArrowRightLeft className="w-16 h-16" />}
        title="No hay movimientos registrados"
        description="Registre entradas, salidas y ajustes de inventario"
        action={{
          label: 'Nuevo Movimiento',
          onClick: () => console.log('Nuevo Movimiento'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movimientos de Inventario</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Movimiento</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inventario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {movimientos.map((mov: any) => (
                <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(mov.fecha_movimiento), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={mov.afectacion_stock === 'ENTRADA' ? 'success' : 'warning'} size="sm">
                      {formatEstado(mov.tipo_movimiento_nombre)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{mov.inventario_producto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {mov.afectacion_stock === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{mov.usuario_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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

// ==================== KARDEX SECTION ====================

const KardexSection = () => {
  return (
    <EmptyState
      icon={<FileText className="w-16 h-16" />}
      title="Consulta de Kardex"
      description="Seleccione un producto para ver su kardex"
    />
  );
};

// ==================== ALERTAS SECTION ====================

const AlertasSection = () => {
  const { data, isLoading } = useAlertasStock();
  const alertas = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (alertas.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-16 h-16" />}
        title="No hay alertas de stock"
        description="Las alertas se generarán automáticamente cuando se cumplan las condiciones"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alertas de Stock</h3>
        <Button variant="primary" size="sm">Generar Alertas</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inventario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {alertas.map((alerta: any) => (
                <tr key={alerta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(alerta.fecha_alerta), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{formatEstado(alerta.tipo_alerta_nombre)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{alerta.inventario_producto}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(alerta.prioridad)} size="sm">
                      {formatEstado(alerta.prioridad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={alerta.resuelta ? 'success' : 'warning'} size="sm">
                      {alerta.resuelta ? 'Resuelta' : (alerta.leida ? 'Leída' : 'Pendiente')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
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

// ==================== CONFIGURACIÓN SECTION ====================

const ConfiguracionSection = () => {
  const { data, isLoading } = useConfiguracionesStock();
  const configuraciones = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (configuraciones.length === 0) {
    return (
      <EmptyState
        icon={<Settings className="w-16 h-16" />}
        title="No hay configuraciones de stock"
        description="Configure los parámetros de stock para cada inventario"
        action={{
          label: 'Nueva Configuración',
          onClick: () => console.log('Nueva Config'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuración de Stock</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nueva Configuración</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inventario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock Máximo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Punto Reorden</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {configuraciones.map((config: any) => (
                <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{config.inventario_producto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{config.stock_minimo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{config.stock_maximo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{config.punto_reorden}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-danger-600" /></Button>
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

export default function AlmacenamientoTab() {
  const [activeTab, setActiveTab] = useState('inventarios');

  const tabs = [
    { id: 'inventarios', label: 'Inventarios', icon: <Package className="w-4 h-4" /> },
    { id: 'movimientos', label: 'Movimientos', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'kardex', label: 'Kardex', icon: <FileText className="w-4 h-4" /> },
    { id: 'alertas', label: 'Alertas', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'inventarios' && <InventariosSection />}
        {activeTab === 'movimientos' && <MovimientosSection />}
        {activeTab === 'kardex' && <KardexSection />}
        {activeTab === 'alertas' && <AlertasSection />}
        {activeTab === 'configuracion' && <ConfiguracionSection />}
      </div>
    </div>
  );
}
