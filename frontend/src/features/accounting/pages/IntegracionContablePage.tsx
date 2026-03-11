/**
 * Pagina: Integración Contable
 *
 * Gestión de integración con otros módulos con datos reales del backend:
 * - Parámetros: Configuración de cuentas por módulo
 * - Cola: Cola de contabilización automática
 * - Logs: Historial de integraciones
 * - Estadísticas: Métricas de integración
 */
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Settings,
  Clock,
  FileText,
  BarChart3,
  Edit2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Tabs,
  Spinner,
  EmptyState,
  SectionToolbar,
  ConfirmDialog,
} from '@/components/common';
import { Input, Select } from '@/components/forms';
import { cn } from '@/utils/cn';
import {
  useParametrosIntegracion,
  useDeleteParametro,
  useToggleParametroActivo,
  useLogsIntegracion,
  useErroresRecientes,
  useEstadisticasLogs,
  useColaContabilizacion,
  useColaPendientes,
  useColaErrores,
  useEstadisticasCola,
  useReintentarCola,
  useCancelarCola,
  useReintentarTodosCola,
} from '../hooks';
import type {
  ParametrosIntegracion,
  ParametrosIntegracionList,
  LogIntegracionList,
  ColaContabilizacionList,
} from '../types';
import ParametroIntegracionFormModal from '../components/ParametroIntegracionFormModal';

const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as { results?: T[] };
  return d.results ?? [];
};

const getModuloColor = (modulo: string) => {
  const colores: Record<string, string> = {
    tesoreria: 'bg-blue-500',
    nomina: 'bg-green-500',
    inventarios: 'bg-purple-500',
    activos_fijos: 'bg-orange-500',
    ventas: 'bg-teal-500',
    compras: 'bg-red-500',
    presupuesto: 'bg-indigo-500',
    servicios_generales: 'bg-pink-500',
  };
  return colores[modulo] || 'bg-gray-500';
};

const getColaEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'completado':
      return { variant: 'success' as const, label: 'Completado' };
    case 'procesando':
      return { variant: 'primary' as const, label: 'Procesando' };
    case 'error':
      return { variant: 'danger' as const, label: 'Error' };
    case 'pendiente':
      return { variant: 'warning' as const, label: 'Pendiente' };
    case 'cancelado':
      return { variant: 'secondary' as const, label: 'Cancelado' };
    default:
      return { variant: 'secondary' as const, label: estado };
  }
};

const getLogEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'exitoso':
      return { variant: 'success' as const, label: 'Exitoso' };
    case 'error':
      return { variant: 'danger' as const, label: 'Error' };
    case 'revertido':
      return { variant: 'warning' as const, label: 'Revertido' };
    default:
      return { variant: 'secondary' as const, label: estado };
  }
};

// ==================== COMPONENTS ====================

const ParametrosSection = () => {
  const [filtroModulo, setFiltroModulo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ParametrosIntegracion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParametrosIntegracionList | null>(null);

  const { data: parametrosData, isLoading } = useParametrosIntegracion({
    modulo: filtroModulo || undefined,
    search: searchTerm || undefined,
  });
  const toggleActivo = useToggleParametroActivo();
  const deleteMut = useDeleteParametro();

  const parametros = extractResults<ParametrosIntegracionList>(parametrosData);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p: ParametrosIntegracionList) => {
    setEditing(p as unknown as ParametrosIntegracion);
    setModalOpen(true);
  };
  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Parámetros de Integración"
        count={parametros.length}
        searchable
        searchValue={searchTerm}
        searchPlaceholder="Buscar parámetro..."
        onSearchChange={setSearchTerm}
        primaryAction={canCreate ? { label: 'Nuevo Parámetro', onClick: openCreate } : undefined}
      />

      <div className="flex items-center gap-3">
        <Select
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
          className="w-56"
        >
          <option value="">Todos los módulos</option>
          <option value="tesoreria">Tesorería</option>
          <option value="nomina">Nómina</option>
          <option value="inventarios">Inventarios</option>
          <option value="activos_fijos">Activos Fijos</option>
          <option value="ventas">Ventas</option>
          <option value="compras">Compras</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="medium" />
        </div>
      ) : parametros.length === 0 ? (
        <EmptyState
          icon={<Settings className="w-12 h-12" />}
          title="Sin parámetros configurados"
          description="No se encontraron parámetros de integración"
          action={{
            label: 'Nuevo Parámetro',
            onClick: openCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card variant="bordered" padding="none">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Módulo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clave
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cuenta Contable
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {parametros.map((param) => (
                <tr key={param.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium text-white rounded',
                        getModuloColor(param.modulo)
                      )}
                    >
                      {param.modulo_display ?? param.modulo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                    {param.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {param.descripcion ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm text-primary-600">
                        {param.cuenta_codigo ?? '-'}
                      </span>
                      <span className="text-xs text-gray-500">{param.cuenta_nombre ?? ''}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={param.activo ? 'success' : 'danger'} size="sm">
                      {param.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => openEdit(param)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => toggleActivo.mutate(param.id)}
                        disabled={toggleActivo.isPending}
                      >
                        {param.activo ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-red-500"
                        onClick={() => setDeleteTarget(param)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ParametroIntegracionFormModal item={editing} isOpen={modalOpen} onClose={closeModal} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Eliminar Parámetro"
        message={`¿Está seguro de eliminar el parámetro "${deleteTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

const ColaSection = () => {
  const [estadoFilter, setEstadoFilter] = useState('');

  const { data: colaData, isLoading } = useColaContabilizacion({
    estado: estadoFilter || undefined,
    ordering: '-created_at',
  });
  const { data: pendientesData } = useColaPendientes();
  const { data: erroresData } = useColaErrores();
  const { data: estadisticasData } = useEstadisticasCola();
  const reintentar = useReintentarCola();
  const cancelar = useCancelarCola();
  const reintentarTodos = useReintentarTodosCola();

  const cola = extractResults<ColaContabilizacionList>(colaData);
  const pendientes = Array.isArray(pendientesData) ? pendientesData : [];
  const errores = Array.isArray(erroresData) ? erroresData : [];
  const estadisticas = estadisticasData as Record<string, number> | undefined;

  return (
    <div className="space-y-4">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{pendientes.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Procesando</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticas?.procesando ?? 0}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-200" />
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Completados</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas?.completados ?? 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Con Error</p>
              <p className="text-2xl font-bold text-red-600">{errores.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="w-56"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="procesando">Procesando</option>
          <option value="error">Error</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </Select>
        <div className="flex items-center gap-2">
          {errores.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => reintentarTodos.mutate()}
              disabled={reintentarTodos.isPending}
            >
              Reintentar Errores ({errores.length})
            </Button>
          )}
        </div>
      </div>

      {/* Lista de cola */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="medium" />
        </div>
      ) : cola.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-12 h-12" />}
          title="Cola vacía"
          description="No hay documentos en cola de contabilización"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Módulo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Documento
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Prioridad
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Intentos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Creado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cola.map((item) => {
                const badge = getColaEstadoBadge(item.estado);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium text-white rounded',
                          getModuloColor(item.modulo_origen ?? '')
                        )}
                      >
                        {item.modulo_origen_display ?? item.modulo_origen ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">
                          {item.documento_referencia ?? '-'}
                        </span>
                        <span className="text-xs text-gray-500">{item.tipo_documento ?? ''}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          item.prioridad === 1
                            ? 'danger'
                            : item.prioridad === 2
                              ? 'warning'
                              : 'secondary'
                        }
                        size="sm"
                      >
                        {item.prioridad === 1 ? 'Alta' : item.prioridad === 2 ? 'Media' : 'Baja'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={badge.variant} size="sm">
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          item.intentos >= (item.max_intentos ?? 3)
                            ? 'text-red-600'
                            : 'text-gray-600'
                        )}
                      >
                        {item.intentos ?? 0}/{item.max_intentos ?? 3}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.comprobante_numero ? (
                        <span className="font-mono text-sm text-primary-600">
                          {item.comprobante_numero}
                        </span>
                      ) : item.mensaje_error ? (
                        <span className="text-xs text-red-500 truncate max-w-[200px] block">
                          {item.mensaje_error}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.created_at?.slice(0, 16).replace('T', ' ') ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.estado === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            title="Reintentar"
                            onClick={() => reintentar.mutate(item.id)}
                            disabled={reintentar.isPending}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        {(item.estado === 'pendiente' || item.estado === 'error') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-red-500"
                            title="Cancelar"
                            onClick={() => cancelar.mutate(item.id)}
                            disabled={cancelar.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

const LogsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const { data: logsData, isLoading } = useLogsIntegracion({
    search: searchTerm || undefined,
    estado: estadoFilter || undefined,
    ordering: '-created_at',
  });

  const logs = extractResults<LogIntegracionList>(logsData);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          type="text"
          placeholder="Buscar documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        <Select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="w-52"
        >
          <option value="">Todos los estados</option>
          <option value="exitoso">Exitoso</option>
          <option value="error">Error</option>
          <option value="revertido">Revertido</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="medium" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="Sin registros"
          description="No se encontraron logs de integración"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Módulo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Documento
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Comprobante
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => {
                const badge = getLogEstadoBadge(log.estado);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium text-white rounded',
                          getModuloColor(log.modulo_origen ?? '')
                        )}
                      >
                        {log.modulo_origen_display ?? log.modulo_origen ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{log.documento_referencia ?? '-'}</span>
                        <span className="text-xs text-gray-500">{log.tipo_documento ?? ''}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={badge.variant} size="sm">
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {log.comprobante_numero ? (
                        <span className="font-mono text-sm text-primary-600">
                          {log.comprobante_numero}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                          {log.descripcion ?? '-'}
                        </span>
                        {log.mensaje_error && (
                          <span className="text-xs text-red-500 truncate max-w-[200px]">
                            {log.mensaje_error}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {log.created_at?.slice(0, 16).replace('T', ' ') ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

const EstadisticasSection = () => {
  const { data: estadisticasLogsData, isLoading: loadingStats } = useEstadisticasLogs();
  const { data: estadisticasColaData } = useEstadisticasCola();
  const { data: erroresData } = useErroresRecientes();
  const { data: parametrosData } = useParametrosIntegracion();

  const statsLogs = estadisticasLogsData as Record<string, number> | undefined;
  const statsCola = estadisticasColaData as Record<string, number> | undefined;
  const erroresRecientes = extractResults<LogIntegracionList>(erroresData);
  const parametros = extractResults<ParametrosIntegracionList>(parametrosData);
  const modulosActivos = new Set(parametros.filter((p) => p.activo).map((p) => p.modulo)).size;

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="medium" />
      </div>
    );
  }

  const totalProcesados = (statsLogs?.total_exitosos ?? 0) + (statsLogs?.total_errores ?? 0);
  const tasaExito =
    totalProcesados > 0
      ? (((statsLogs?.total_exitosos ?? 0) / totalProcesados) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Total Procesados</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalProcesados}</p>
            <p className="text-xs text-green-600 mt-1">Histórico</p>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Tasa de Éxito</p>
            <p className="text-3xl font-bold text-green-600">{tasaExito}%</p>
            <p className="text-xs text-gray-500 mt-1">General</p>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Errores Recientes</p>
            <p className="text-3xl font-bold text-red-600">{erroresRecientes.length}</p>
            <p className="text-xs text-gray-500 mt-1">Sin resolver</p>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Módulos Activos</p>
            <p className="text-3xl font-bold text-primary-600">{modulosActivos}</p>
            <p className="text-xs text-gray-500 mt-1">Integrados</p>
          </div>
        </Card>
      </div>

      {/* Resumen + Errores recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resumen por Estado</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{statsLogs?.total_exitosos ?? 0}</p>
              <p className="text-xs text-gray-500">Exitosos</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-red-600">{statsLogs?.total_errores ?? 0}</p>
              <p className="text-xs text-gray-500">Errores</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{statsCola?.pendientes ?? 0}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Errores Recientes</h3>
          {erroresRecientes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm text-gray-500">Sin errores recientes</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {erroresRecientes.slice(0, 5).map((err) => (
                <div
                  key={err.id}
                  className="text-xs p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/30"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-red-700 dark:text-red-400">
                      {err.documento_referencia ?? err.tipo_documento ?? 'Desconocido'}
                    </span>
                    <span className="text-gray-400">{err.created_at?.slice(0, 10) ?? '-'}</span>
                  </div>
                  <p className="text-red-600 dark:text-red-400 truncate">
                    {err.mensaje_error ?? 'Error desconocido'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function IntegracionContablePage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.ACCOUNTING, Sections.INTEGRACION_CONTABLE, 'create');

  const { data: pendientesData } = useColaPendientes();
  const { data: erroresData } = useColaErrores();
  const pendientes = Array.isArray(pendientesData) ? pendientesData : [];
  const errores = Array.isArray(erroresData) ? erroresData : [];
  const totalBadge = pendientes.length + errores.length;

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
      badge: totalBadge > 0 ? String(totalBadge) : undefined,
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
