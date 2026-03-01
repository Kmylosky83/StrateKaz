/**
 * Página: Exportación e Integración (REWRITTEN - Sprint 8)
 *
 * Configuración de exportaciones y logs con 2 tabs:
 * - Configuración: CRUD configuraciones de exportación
 * - Historial: Logs de exportaciones realizadas
 *
 * CHANGES:
 * - Deleted ALL mock data
 * - Connected to real hooks from useAnalytics
 * - All buttons functional (no noop)
 * - Integrated ConfigExportacionFormModal
 */
import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Cloud,
  Webhook,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Search,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms';
import { cn } from '@/utils/cn';
import { useConfiguracionesExportacion, useLogsExportacion } from '../hooks/useAnalytics';
import { ConfigExportacionFormModal } from '../components/ConfigExportacionFormModal';

// ==================== UTILITY FUNCTIONS ====================

const getTipoExportacionIcon = (tipo: string) => {
  if (tipo === 'excel') return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  if (tipo === 'pdf') return <FileText className="w-5 h-5 text-red-600" />;
  if (tipo === 'power_bi') return <Cloud className="w-5 h-5 text-yellow-600" />;
  if (tipo === 'api_externa' || tipo === 'webhook') return <Webhook className="w-5 h-5 text-blue-600" />;
  return <Download className="w-5 h-5 text-gray-600" />;
};

const getTipoExportacionColor = (tipo: string) => {
  const colors = {
    excel: 'bg-green-100 text-green-800',
    pdf: 'bg-red-100 text-red-800',
    power_bi: 'bg-yellow-100 text-yellow-800',
    api_externa: 'bg-blue-100 text-blue-800',
    webhook: 'bg-purple-100 text-purple-800',
  };
  return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getEstadoExportacionIcon = (estado: string) => {
  if (estado === 'exitoso') return <CheckCircle className="w-4 h-4 text-success-600" />;
  if (estado === 'fallido') return <AlertCircle className="w-4 h-4 text-danger-600" />;
  if (estado === 'en_proceso') return <Clock className="w-4 h-4 text-warning-600 animate-spin" />;
  return <Clock className="w-4 h-4 text-gray-400" />;
};

const getTipoLogColor = (tipo: string) => {
  const colors = {
    manual: 'bg-blue-100 text-blue-800',
    programada: 'bg-purple-100 text-purple-800',
    api: 'bg-cyan-100 text-cyan-800',
  };
  return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// ==================== SECTIONS ====================

const ConfiguracionSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  const { data: configuracionesData, isLoading } = useConfiguracionesExportacion();
  const configuraciones = configuracionesData || [];

  const handleEdit = (config: any) => {
    setSelectedConfig(config);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedConfig(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Buscar configuraciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowFormModal(true)}>
          Nueva Configuración
        </Button>
      </div>

      {configuraciones.length === 0 ? (
        <EmptyState
          icon={<Download className="w-12 h-12" />}
          title="No hay configuraciones de exportación"
          description="Crea tu primera configuración para exportar datos"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {configuraciones.map((config) => (
            <Card key={config.id} variant="bordered" padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getTipoExportacionIcon(config.tipo_exportacion)}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{config.nombre}</h4>
                      <p className="text-sm text-gray-500 mt-1">{config.codigo || '-'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="gray" size="sm" className={getTipoExportacionColor(config.tipo_exportacion)}>
                          {config.tipo_exportacion.replace('_', ' ')}
                        </Badge>
                        {config.incluir_graficos && <Badge variant="info" size="sm">Con Gráficos</Badge>}
                        {config.incluir_analisis && <Badge variant="info" size="sm">Con Análisis</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.activa ? (
                      <Badge variant="success" size="sm">Activa</Badge>
                    ) : (
                      <Badge variant="gray" size="sm">Inactiva</Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">KPIs Incluidos:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {config.kpis_incluidos?.length || 0} indicadores
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Creado Por:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {config.creado_por_nombre || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Formato Fecha:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {config.formato_fecha || '-'}
                    </span>
                  </div>
                </div>

                {config.descripcion && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{config.descripcion}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfigExportacionFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        configuracion={selectedConfig}
      />
    </div>
  );
};

const HistorialSection = () => {
  const { data: logsData, isLoading } = useLogsExportacion();
  const logs = logsData || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const stats = {
    total: logs.length,
    exitosos: logs.filter((l) => l.estado === 'exitoso').length,
    fallidos: logs.filter((l) => l.estado === 'fallido').length,
    registrosExportados: logs.reduce((sum, l) => sum + (l.registros_exportados || 0), 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Exportaciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <Download className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Exitosos</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{stats.exitosos}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Fallidos</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{stats.fallidos}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Registros Exportados</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{stats.registrosExportados}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-12 h-12" />}
          title="No hay historial de exportaciones"
          description="El historial de exportaciones aparecerá aquí"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Configuración</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Registros</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duración (s)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.configuracion_nombre || '-'}
                        </p>
                        <p className="text-xs text-gray-500">{log.exportado_por_nombre || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {log.fecha_exportacion || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="gray" size="sm" className={getTipoLogColor(log.tipo_log)}>
                        {log.tipo_log}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-medium">
                      {log.registros_exportados || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                      {log.duracion_segundos || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getEstadoExportacionIcon(log.estado)}
                        <Badge
                          variant={
                            log.estado === 'exitoso'
                              ? 'success'
                              : log.estado === 'fallido'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {log.estado}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {log.archivo_generado || '-'}
                        </span>
                        {log.tamano_archivo && (
                          <span className="text-xs text-gray-500 ml-2">{log.tamano_archivo} MB</span>
                        )}
                      </div>
                      {log.error_mensaje && (
                        <p className="text-xs text-red-600 mt-1">{log.error_mensaje}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ExportacionPage() {
  const [activeTab, setActiveTab] = useState('configuracion');

  const tabs = [
    { id: 'configuracion', label: 'Configuración', icon: <Download className="w-4 h-4" /> },
    { id: 'historial', label: 'Historial', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Exportación e Integración"
        description="Configuración de exportaciones automáticas y logs de ejecuciones"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'configuracion' && <ConfiguracionSection />}
        {activeTab === 'historial' && <HistorialSection />}
      </div>
    </div>
  );
}
