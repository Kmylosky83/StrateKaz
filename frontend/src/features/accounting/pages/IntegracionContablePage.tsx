/**
 * Página: Integración Contable
 *
 * Gestión de integración con otros módulos:
 * - Parámetros: Configuración de cuentas por módulo
 * - Cola: Cola de contabilización automática
 * - Logs: Historial de integraciones
 * - Estadísticas: Métricas de integración
 */
import { useState } from 'react';
import {
  Link2,
  Settings,
  Clock,
  FileText,
  BarChart3,
  Plus,
  Search,
  Edit2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Eye,
  Download,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockParametros = [
  { id: 1, modulo: 'tesoreria', clave: 'CUENTA_BANCOS', descripcion: 'Cuenta principal de bancos', cuenta: '111005', cuenta_nombre: 'Bancos nacionales', activo: true },
  { id: 2, modulo: 'tesoreria', clave: 'CUENTA_CAJA', descripcion: 'Cuenta de caja general', cuenta: '110505', cuenta_nombre: 'Caja general', activo: true },
  { id: 3, modulo: 'nomina', clave: 'GASTO_SALARIOS', descripcion: 'Gasto de salarios', cuenta: '510506', cuenta_nombre: 'Sueldos', activo: true },
  { id: 4, modulo: 'nomina', clave: 'PROVISION_CESANTIAS', descripcion: 'Provisión de cesantías', cuenta: '261005', cuenta_nombre: 'Cesantías consolidadas', activo: true },
  { id: 5, modulo: 'inventarios', clave: 'INVENTARIO_MP', descripcion: 'Inventario materia prima', cuenta: '143505', cuenta_nombre: 'Materias primas', activo: true },
  { id: 6, modulo: 'activos_fijos', clave: 'DEP_ACUMULADA', descripcion: 'Depreciación acumulada', cuenta: '159205', cuenta_nombre: 'Depreciación maquinaria', activo: true },
  { id: 7, modulo: 'ventas', clave: 'INGRESO_VENTAS', descripcion: 'Ingresos por ventas', cuenta: '413505', cuenta_nombre: 'Venta de productos', activo: true },
  { id: 8, modulo: 'compras', clave: 'CXP_PROVEEDORES', descripcion: 'Cuentas por pagar proveedores', cuenta: '220505', cuenta_nombre: 'Proveedores nacionales', activo: true },
];

const mockCola = [
  { id: 1, modulo: 'tesoreria', documento_tipo: 'Pago', documento_id: 'PAG-2024-0156', prioridad: 1, estado: 'pendiente', intentos: 0, max_intentos: 3, created_at: '2024-12-29 08:30:00' },
  { id: 2, modulo: 'nomina', documento_tipo: 'Liquidación', documento_id: 'LIQ-2024-024', prioridad: 3, estado: 'procesando', intentos: 1, max_intentos: 3, created_at: '2024-12-29 08:15:00' },
  { id: 3, modulo: 'inventarios', documento_tipo: 'Movimiento', documento_id: 'MOV-2024-0890', prioridad: 5, estado: 'error', intentos: 3, max_intentos: 3, mensaje_error: 'Cuenta contable no encontrada', created_at: '2024-12-29 07:45:00' },
  { id: 4, modulo: 'ventas', documento_tipo: 'Factura', documento_id: 'FV-2024-1250', prioridad: 1, estado: 'completado', intentos: 1, max_intentos: 3, comprobante: 'CI-2024-0089', created_at: '2024-12-29 07:30:00' },
  { id: 5, modulo: 'compras', documento_tipo: 'Factura', documento_id: 'FC-2024-0890', prioridad: 3, estado: 'pendiente', intentos: 0, max_intentos: 3, created_at: '2024-12-29 09:00:00' },
];

const mockLogs = [
  { id: 1, modulo: 'tesoreria', documento_tipo: 'Pago', documento_id: 'PAG-2024-0155', estado: 'exitoso', comprobante: 'CE-2024-0156', descripcion: 'Pago a proveedores', created_at: '2024-12-28 16:45:00' },
  { id: 2, modulo: 'nomina', documento_tipo: 'Liquidación', documento_id: 'LIQ-2024-023', estado: 'exitoso', comprobante: 'CE-2024-0155', descripcion: 'Nómina quincenal diciembre', created_at: '2024-12-25 14:30:00' },
  { id: 3, modulo: 'inventarios', documento_tipo: 'Ajuste', documento_id: 'AJU-2024-0045', estado: 'error', comprobante: null, descripcion: 'Ajuste de inventario', mensaje_error: 'Centro de costo inválido', created_at: '2024-12-24 11:20:00' },
  { id: 4, modulo: 'ventas', documento_tipo: 'Factura', documento_id: 'FV-2024-1249', estado: 'exitoso', comprobante: 'CI-2024-0088', descripcion: 'Venta cliente XYZ', created_at: '2024-12-24 09:15:00' },
  { id: 5, modulo: 'activos_fijos', documento_tipo: 'Depreciación', documento_id: 'DEP-2024-012', estado: 'revertido', comprobante: 'NC-2024-0044', descripcion: 'Depreciación mensual noviembre', created_at: '2024-12-23 17:00:00' },
];

const mockEstadisticas = {
  por_estado: { pendiente: 8, procesando: 2, completado: 145, error: 5 },
  por_modulo: { tesoreria: 45, nomina: 24, inventarios: 38, activos_fijos: 12, ventas: 28, compras: 13 },
  ultimas_24h: { exitosos: 18, errores: 2, pendientes: 8 },
  tiempo_promedio: '2.3 segundos',
};

const getModuloColor = (modulo: string) => {
  const colores: Record<string, string> = {
    tesoreria: 'bg-blue-500',
    nomina: 'bg-green-500',
    inventarios: 'bg-purple-500',
    activos_fijos: 'bg-orange-500',
    ventas: 'bg-teal-500',
    compras: 'bg-red-500',
  };
  return colores[modulo] || 'bg-gray-500';
};

const getModuloNombre = (modulo: string) => {
  const nombres: Record<string, string> = {
    tesoreria: 'Tesorería',
    nomina: 'Nómina',
    inventarios: 'Inventarios',
    activos_fijos: 'Activos Fijos',
    ventas: 'Ventas',
    compras: 'Compras',
  };
  return nombres[modulo] || modulo;
};

// ==================== COMPONENTS ====================

const ParametrosSection = () => {
  const [filtroModulo, setFiltroModulo] = useState('');

  const parametrosFiltrados = filtroModulo
    ? mockParametros.filter(p => p.modulo === filtroModulo)
    : mockParametros;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar parámetro..."
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          >
            <option value="">Todos los módulos</option>
            <option value="tesoreria">Tesorería</option>
            <option value="nomina">Nómina</option>
            <option value="inventarios">Inventarios</option>
            <option value="activos_fijos">Activos Fijos</option>
            <option value="ventas">Ventas</option>
            <option value="compras">Compras</option>
          </select>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Parámetro
        </Button>
      </div>

      <Card variant="bordered" padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clave</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta Contable</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {parametrosFiltrados.map((param) => (
              <tr key={param.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 text-xs font-medium text-white rounded', getModuloColor(param.modulo))}>
                    {getModuloNombre(param.modulo)}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{param.clave}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{param.descripcion}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-primary-600">{param.cuenta}</span>
                    <span className="text-xs text-gray-500">{param.cuenta_nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={param.activo ? 'success' : 'danger'} size="sm">
                    {param.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="p-1">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const ColaSection = () => {
  return (
    <div className="space-y-4">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{mockEstadisticas.por_estado.pendiente}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Procesando</p>
              <p className="text-2xl font-bold text-blue-600">{mockEstadisticas.por_estado.procesando}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-200 animate-spin" />
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Completados (hoy)</p>
              <p className="text-2xl font-bold text-green-600">{mockEstadisticas.ultimas_24h.exitosos}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Con Error</p>
              <p className="text-2xl font-bold text-red-600">{mockEstadisticas.por_estado.error}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </Card>
      </div>

      {/* Acciones y filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="procesando">Procesando</option>
            <option value="error">Error</option>
            <option value="completado">Completado</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
            <option value="">Todos los módulos</option>
            <option value="tesoreria">Tesorería</option>
            <option value="nomina">Nómina</option>
            <option value="inventarios">Inventarios</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reintentar Errores
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Play className="w-4 h-4" />}>
            Procesar Cola
          </Button>
        </div>
      </div>

      {/* Lista de cola */}
      <Card variant="bordered" padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prioridad</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Intentos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockCola.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 text-xs font-medium text-white rounded', getModuloColor(item.modulo))}>
                    {getModuloNombre(item.modulo)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{item.documento_id}</span>
                    <span className="text-xs text-gray-500">{item.documento_tipo}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={item.prioridad === 1 ? 'danger' : item.prioridad === 3 ? 'warning' : 'secondary'}
                    size="sm"
                  >
                    {item.prioridad === 1 ? 'Alta' : item.prioridad === 3 ? 'Media' : 'Baja'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={
                      item.estado === 'completado' ? 'success' :
                      item.estado === 'error' ? 'danger' :
                      item.estado === 'procesando' ? 'primary' : 'warning'
                    }
                    size="sm"
                  >
                    {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    'text-sm font-medium',
                    item.intentos >= item.max_intentos ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {item.intentos}/{item.max_intentos}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.comprobante ? (
                    <span className="font-mono text-sm text-primary-600">{item.comprobante}</span>
                  ) : item.mensaje_error ? (
                    <span className="text-xs text-red-500">{item.mensaje_error}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.created_at}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.estado === 'error' && item.intentos < item.max_intentos && (
                      <Button variant="ghost" size="sm" className="p-1" title="Reintentar">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    {item.estado !== 'completado' && item.estado !== 'procesando' && (
                      <Button variant="ghost" size="sm" className="p-1 text-red-500" title="Cancelar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const LogsSection = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documento..."
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
            <option value="">Todos los estados</option>
            <option value="exitoso">Exitoso</option>
            <option value="error">Error</option>
            <option value="revertido">Revertido</option>
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          />
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
          Exportar
        </Button>
      </div>

      <Card variant="bordered" padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 text-xs font-medium text-white rounded', getModuloColor(log.modulo))}>
                    {getModuloNombre(log.modulo)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{log.documento_id}</span>
                    <span className="text-xs text-gray-500">{log.documento_tipo}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={
                      log.estado === 'exitoso' ? 'success' :
                      log.estado === 'error' ? 'danger' : 'warning'
                    }
                    size="sm"
                  >
                    {log.estado.charAt(0).toUpperCase() + log.estado.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {log.comprobante ? (
                    <span className="font-mono text-sm text-primary-600">{log.comprobante}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{log.descripcion}</span>
                    {log.mensaje_error && (
                      <span className="text-xs text-red-500">{log.mensaje_error}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{log.created_at}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="p-1">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const EstadisticasSection = () => {
  const stats = mockEstadisticas;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Total Procesados</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.por_estado.completado}</p>
            <p className="text-xs text-green-600 mt-1">Este mes</p>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Tasa de Éxito</p>
            <p className="text-3xl font-bold text-green-600">
              {((stats.por_estado.completado / (stats.por_estado.completado + stats.por_estado.error)) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Tiempo Promedio</p>
            <p className="text-3xl font-bold text-blue-600">{stats.tiempo_promedio}</p>
            <p className="text-xs text-gray-500 mt-1">Por documento</p>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Módulos Activos</p>
            <p className="text-3xl font-bold text-primary-600">{Object.keys(stats.por_modulo).length}</p>
            <p className="text-xs text-gray-500 mt-1">Integrados</p>
          </div>
        </Card>
      </div>

      {/* Gráficos por módulo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Integraciones por Módulo</h3>
          <div className="space-y-3">
            {Object.entries(stats.por_modulo).map(([modulo, total]) => {
              const porcentaje = (total / stats.por_estado.completado) * 100;
              return (
                <div key={modulo}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{getModuloNombre(modulo)}</span>
                    <span className="text-sm font-medium">{total}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full', getModuloColor(modulo))}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Últimas 24 Horas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{stats.ultimas_24h.exitosos}</p>
              <p className="text-xs text-gray-500">Exitosos</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-red-600">{stats.ultimas_24h.errores}</p>
              <p className="text-xs text-gray-500">Errores</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{stats.ultimas_24h.pendientes}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Estado del Servicio</h4>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600">Servicio de integración activo</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Última ejecución: hace 2 minutos</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function IntegracionContablePage() {
  const tabs = [
    {
      id: 'parametros',
      label: 'Parámetros',
      icon: <Settings className="w-4 h-4" />,
      content: <ParametrosSection />,
    },
    {
      id: 'cola',
      label: 'Cola',
      icon: <Clock className="w-4 h-4" />,
      badge: String(mockEstadisticas.por_estado.pendiente),
      content: <ColaSection />,
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: <FileText className="w-4 h-4" />,
      content: <LogsSection />,
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: <BarChart3 className="w-4 h-4" />,
      content: <EstadisticasSection />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integración Contable"
        description="Integración automática con módulos del sistema"
      />

      <Tabs tabs={tabs} defaultTab="cola" />
    </div>
  );
}
