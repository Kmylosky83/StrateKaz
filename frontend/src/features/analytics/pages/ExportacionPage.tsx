/**
 * Página: Exportación e Integración
 *
 * Configuración de exportaciones y logs con 2 tabs:
 * - Configuración
 * - Historial
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
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockConfiguraciones = [
  {
    id: 1,
    codigo: 'EXP-001',
    nombre: 'Exportación Excel KPIs SST',
    tipo_exportacion: 'excel',
    kpis_incluidos: [1, 2, 5, 8],
    incluir_graficos: true,
    incluir_analisis: true,
    activa: true,
    creado_por_nombre: 'Admin Sistema',
  },
  {
    id: 2,
    codigo: 'EXP-002',
    nombre: 'Reporte PDF Gerencial',
    tipo_exportacion: 'pdf',
    kpis_incluidos: [1, 2, 3, 4, 5, 6],
    incluir_graficos: true,
    incluir_analisis: true,
    activa: true,
    creado_por_nombre: 'María García',
  },
  {
    id: 3,
    codigo: 'EXP-003',
    nombre: 'Integración Power BI Dashboard',
    tipo_exportacion: 'power_bi',
    kpis_incluidos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    incluir_graficos: false,
    incluir_analisis: false,
    activa: true,
    creado_por_nombre: 'Carlos Rodríguez',
    configuracion_destino: {
      workspace: 'Workspace HSEQ',
      dataset: 'KPIs Analytics',
    },
  },
  {
    id: 4,
    codigo: 'EXP-004',
    nombre: 'API Externa Sistema Corporativo',
    tipo_exportacion: 'api_externa',
    kpis_incluidos: [1, 2, 3],
    incluir_graficos: false,
    incluir_analisis: false,
    activa: false,
    creado_por_nombre: 'Admin Sistema',
    configuracion_destino: {
      endpoint: 'https://api.empresa.com/kpis',
      method: 'POST',
    },
  },
  {
    id: 5,
    codigo: 'EXP-005',
    nombre: 'Webhook Notificaciones Teams',
    tipo_exportacion: 'webhook',
    kpis_incluidos: [1, 5, 8],
    incluir_graficos: false,
    incluir_analisis: true,
    activa: true,
    creado_por_nombre: 'Ana López',
    configuracion_destino: {
      webhook_url: 'https://outlook.office.com/webhook/...',
    },
  },
];

const mockHistorial = [
  {
    id: 1,
    configuracion_nombre: 'Exportación Excel KPIs SST',
    tipo_log: 'programada',
    fecha_exportacion: '2024-12-28 08:00',
    estado: 'exitoso',
    registros_exportados: 156,
    archivo_generado: 'KPIs_SST_2024-12.xlsx',
    tamano_archivo: 1.2,
    duracion_segundos: 8,
    exportado_por_nombre: 'Sistema Programado',
  },
  {
    id: 2,
    configuracion_nombre: 'Reporte PDF Gerencial',
    tipo_log: 'manual',
    fecha_exportacion: '2024-12-27 15:30',
    estado: 'exitoso',
    registros_exportados: 245,
    archivo_generado: 'Reporte_Gerencial_2024-12.pdf',
    tamano_archivo: 3.5,
    duracion_segundos: 12,
    exportado_por_nombre: 'María García',
  },
  {
    id: 3,
    configuracion_nombre: 'Integración Power BI Dashboard',
    tipo_log: 'programada',
    fecha_exportacion: '2024-12-28 06:00',
    estado: 'exitoso',
    registros_exportados: 489,
    duracion_segundos: 25,
    exportado_por_nombre: 'Sistema Programado',
  },
  {
    id: 4,
    configuracion_nombre: 'API Externa Sistema Corporativo',
    tipo_log: 'api',
    fecha_exportacion: '2024-12-27 18:45',
    estado: 'fallido',
    duracion_segundos: 3,
    error_mensaje: 'Error de conexión: Timeout al intentar conectar con el endpoint',
    exportado_por_nombre: 'API Client',
  },
  {
    id: 5,
    configuracion_nombre: 'Webhook Notificaciones Teams',
    tipo_log: 'programada',
    fecha_exportacion: '2024-12-28 09:00',
    estado: 'exitoso',
    registros_exportados: 3,
    duracion_segundos: 2,
    exportado_por_nombre: 'Sistema Programado',
  },
  {
    id: 6,
    configuracion_nombre: 'Exportación Excel KPIs SST',
    tipo_log: 'programada',
    fecha_exportacion: '2024-12-27 08:00',
    estado: 'exitoso',
    registros_exportados: 148,
    archivo_generado: 'KPIs_SST_2024-11.xlsx',
    tamano_archivo: 1.1,
    duracion_segundos: 7,
    exportado_por_nombre: 'Sistema Programado',
  },
];

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
  const configuraciones = mockConfiguraciones;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar configuraciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Configuración
        </Button>
      </div>

      {/* Grid de Configuraciones */}
      <div className="grid grid-cols-1 gap-4">
        {configuraciones.map((config) => (
          <Card key={config.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getTipoExportacionIcon(config.tipo_exportacion)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {config.nombre}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">{config.codigo}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="gray"
                        size="sm"
                        className={getTipoExportacionColor(config.tipo_exportacion)}
                      >
                        {config.tipo_exportacion.replace('_', ' ')}
                      </Badge>
                      {config.incluir_graficos && (
                        <Badge variant="info" size="sm">Con Gráficos</Badge>
                      )}
                      {config.incluir_analisis && (
                        <Badge variant="info" size="sm">Con Análisis</Badge>
                      )}
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
                    <Button variant="ghost" size="sm">
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
                    {config.kpis_incluidos.length} indicadores
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Creado Por:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {config.creado_por_nombre}
                  </span>
                </div>
                {config.configuracion_destino && (
                  <div>
                    <span className="text-gray-500">Destino:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {config.configuracion_destino.workspace ||
                       config.configuracion_destino.endpoint ||
                       config.configuracion_destino.webhook_url?.substring(0, 30) + '...'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm" leftIcon={<Play className="w-4 h-4" />}>
                  Ejecutar Ahora
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Descargar Última
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const HistorialSection = () => {
  const historial = mockHistorial;

  // Stats
  const totalExportaciones = historial.length;
  const exitosas = historial.filter(h => h.estado === 'exitoso').length;
  const fallidas = historial.filter(h => h.estado === 'fallido').length;
  const tasaExito = totalExportaciones > 0 ? (exitosas / totalExportaciones * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Exportaciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalExportaciones}
              </p>
            </div>
            <Download className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Exitosas</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {exitosas}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Fallidas</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {fallidas}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-danger-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {tasaExito}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-primary-500 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600">{tasaExito}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Configuración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Registros
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Exportado Por
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {historial.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.configuracion_nombre}
                      </p>
                      {item.archivo_generado && (
                        <p className="text-xs text-gray-500">{item.archivo_generado}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="gray"
                      size="sm"
                      className={getTipoLogColor(item.tipo_log)}
                    >
                      {item.tipo_log}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {item.fecha_exportacion}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getEstadoExportacionIcon(item.estado)}
                      <Badge
                        variant={item.estado === 'exitoso' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {item.estado}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                    {item.registros_exportados || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                    {item.tamano_archivo ? `${item.tamano_archivo} MB` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                    {item.duracion_segundos}s
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {item.exportado_por_nombre}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {item.archivo_generado && item.estado === 'exitoso' && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Error Details */}
      {historial.filter(h => h.error_mensaje).length > 0 && (
        <Card variant="bordered" padding="md" className="bg-red-50 dark:bg-red-900/20">
          <h4 className="font-medium text-red-900 dark:text-red-100 mb-3">
            Últimos Errores
          </h4>
          <div className="space-y-2">
            {historial
              .filter(h => h.error_mensaje)
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {item.configuracion_nombre} - {item.fecha_exportacion}
                  </p>
                  <p className="text-red-700 dark:text-red-300 ml-4">
                    {item.error_mensaje}
                  </p>
                </div>
              ))}
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
        description="Configuración de exportaciones y logs de integración con sistemas externos"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'configuracion' && <ConfiguracionSection />}
        {activeTab === 'historial' && <HistorialSection />}
      </div>
    </div>
  );
}
