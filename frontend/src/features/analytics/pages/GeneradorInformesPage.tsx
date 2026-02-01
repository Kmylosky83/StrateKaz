/**
 * Página: Generador de Informes
 *
 * Generación automática de informes dinámicos con 4 tabs:
 * - Plantillas
 * - Informes
 * - Programación
 * - Historial
 */
import { useState } from 'react';
import {
  FileText,
  Download,
  Send,
  Play,
  Pause,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Plus,
  Edit,
  Trash2,
  Eye,
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

const mockPlantillas = [
  {
    id: 1,
    codigo: 'PLANTILLA-001',
    nombre: 'Informe Mensual SST - Res. 0312',
    tipo_informe: 'normativo',
    formato_salida: 'pdf',
    activa: true,
    creado_por_nombre: 'Admin Sistema',
  },
  {
    id: 2,
    codigo: 'PLANTILLA-002',
    nombre: 'Dashboard Gerencial HSEQ',
    tipo_informe: 'gerencial',
    formato_salida: 'pdf',
    activa: true,
    creado_por_nombre: 'María García',
  },
  {
    id: 3,
    codigo: 'PLANTILLA-003',
    nombre: 'Reporte Operacional PESV',
    tipo_informe: 'operativo',
    formato_salida: 'excel',
    activa: true,
    creado_por_nombre: 'Carlos Rodríguez',
  },
  {
    id: 4,
    codigo: 'PLANTILLA-004',
    nombre: 'Informe KPIs Financieros',
    tipo_informe: 'personalizado',
    formato_salida: 'excel',
    activa: false,
    creado_por_nombre: 'Ana López',
  },
];

const mockInformes = [
  {
    id: 1,
    plantilla_nombre: 'Informe Mensual SST - Res. 0312',
    periodo: '2024-12',
    fecha_generacion: '2024-12-28 15:30',
    estado: 'completado',
    generado_por_nombre: 'Admin Sistema',
    enviado_email: true,
    url_descarga: '/api/informes/1/descargar',
  },
  {
    id: 2,
    plantilla_nombre: 'Dashboard Gerencial HSEQ',
    periodo: '2024-12',
    fecha_generacion: '2024-12-28 08:00',
    estado: 'completado',
    generado_por_nombre: 'Sistema Programado',
    enviado_email: true,
    url_descarga: '/api/informes/2/descargar',
  },
  {
    id: 3,
    plantilla_nombre: 'Reporte Operacional PESV',
    periodo: '2024-12',
    fecha_generacion: '2024-12-27 18:45',
    estado: 'completado',
    generado_por_nombre: 'Carlos Rodríguez',
    enviado_email: false,
    url_descarga: '/api/informes/3/descargar',
  },
  {
    id: 4,
    plantilla_nombre: 'Informe Mensual SST - Res. 0312',
    periodo: '2024-11',
    fecha_generacion: '2024-11-30 16:00',
    estado: 'completado',
    generado_por_nombre: 'Admin Sistema',
    enviado_email: true,
    url_descarga: '/api/informes/4/descargar',
  },
];

const mockProgramaciones = [
  {
    id: 1,
    plantilla_nombre: 'Dashboard Gerencial HSEQ',
    frecuencia: 'mensual',
    dia_ejecucion: 28,
    hora_ejecucion: '08:00',
    proxima_ejecucion: '2025-01-28 08:00',
    activa: true,
    destinatarios_email: ['gerencia@empresa.com', 'calidad@empresa.com'],
    ultima_ejecucion: '2024-12-28 08:00',
    estado_ultima_ejecucion: 'completado',
  },
  {
    id: 2,
    plantilla_nombre: 'Informe Mensual SST - Res. 0312',
    frecuencia: 'mensual',
    dia_ejecucion: 5,
    hora_ejecucion: '09:00',
    proxima_ejecucion: '2025-01-05 09:00',
    activa: true,
    destinatarios_email: ['sst@empresa.com', 'gerencia@empresa.com'],
    ultima_ejecucion: '2024-12-05 09:00',
    estado_ultima_ejecucion: 'completado',
  },
  {
    id: 3,
    plantilla_nombre: 'Reporte Operacional PESV',
    frecuencia: 'semanal',
    hora_ejecucion: '18:00',
    proxima_ejecucion: '2025-01-03 18:00',
    activa: false,
    destinatarios_email: ['pesv@empresa.com'],
    ultima_ejecucion: '2024-12-20 18:00',
    estado_ultima_ejecucion: 'error',
  },
];

const mockHistorial = [
  {
    id: 1,
    informe: 1,
    fecha_ejecucion: '2024-12-28 08:00',
    estado: 'completado',
    duracion_segundos: 45,
    tamano_archivo: 2.5,
  },
  {
    id: 2,
    informe: 2,
    fecha_ejecucion: '2024-12-28 08:00',
    estado: 'completado',
    duracion_segundos: 32,
    tamano_archivo: 1.8,
  },
  {
    id: 3,
    informe: 3,
    fecha_ejecucion: '2024-12-27 18:00',
    estado: 'error',
    duracion_segundos: 5,
    error_mensaje: 'Error al generar gráfico de tendencias',
  },
  {
    id: 4,
    informe: 1,
    fecha_ejecucion: '2024-11-30 08:00',
    estado: 'completado',
    duracion_segundos: 48,
    tamano_archivo: 2.3,
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getTipoInformeColor = (tipo: string) => {
  const colors = {
    normativo: 'bg-blue-100 text-blue-800',
    gerencial: 'bg-purple-100 text-purple-800',
    operativo: 'bg-cyan-100 text-cyan-800',
    personalizado: 'bg-pink-100 text-pink-800',
  };
  return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getEstadoInformeIcon = (estado: string) => {
  if (estado === 'completado') return <CheckCircle className="w-4 h-4 text-success-600" />;
  if (estado === 'error') return <AlertCircle className="w-4 h-4 text-danger-600" />;
  if (estado === 'generando') return <Clock className="w-4 h-4 text-warning-600 animate-spin" />;
  return <Clock className="w-4 h-4 text-gray-400" />;
};

// ==================== SECTIONS ====================

const PlantillasSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const plantillas = mockPlantillas;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar plantillas..."
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
          Nueva Plantilla
        </Button>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Formato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Creado Por
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {plantillas.map((plantilla) => (
                <tr
                  key={plantilla.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {plantilla.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {plantilla.nombre}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="gray"
                      size="sm"
                      className={getTipoInformeColor(plantilla.tipo_informe)}
                    >
                      {plantilla.tipo_informe}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 uppercase">
                    {plantilla.formato_salida}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {plantilla.creado_por_nombre}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={plantilla.activa ? 'success' : 'gray'} size="sm">
                      {plantilla.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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

const InformesSection = () => {
  const informes = mockInformes;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Informes Generados
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Generar Informe
        </Button>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plantilla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Generación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Generado Por
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {informes.map((informe) => (
                <tr
                  key={informe.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {informe.plantilla_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {informe.periodo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {informe.fecha_generacion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {informe.generado_por_nombre}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getEstadoInformeIcon(informe.estado)}
                      <Badge
                        variant={informe.estado === 'completado' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {informe.estado}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {informe.enviado_email ? (
                      <CheckCircle className="w-5 h-5 text-success-600 mx-auto" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {informe.estado === 'completado' && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Send className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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

const ProgramacionSection = () => {
  const programaciones = mockProgramaciones;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Informes Programados
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Programación
        </Button>
      </div>

      {/* Grid de Programaciones */}
      <div className="grid grid-cols-1 gap-4">
        {programaciones.map((prog) => (
          <Card key={prog.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {prog.plantilla_nombre}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Frecuencia: {prog.frecuencia} - {prog.hora_ejecucion}
                    {prog.dia_ejecucion && ` (día ${prog.dia_ejecucion})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {prog.activa ? (
                    <Badge variant="success" size="sm">Activa</Badge>
                  ) : (
                    <Badge variant="gray" size="sm">Pausada</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Próxima Ejecución
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {prog.proxima_ejecucion}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Última Ejecución
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {prog.ultima_ejecucion}
                    </p>
                    {prog.estado_ultima_ejecucion === 'completado' ? (
                      <CheckCircle className="w-4 h-4 text-success-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-danger-600" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Destinatarios
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {prog.destinatarios_email.length} emails
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm" leftIcon={<Play className="w-4 h-4" />}>
                  Ejecutar Ahora
                </Button>
                {prog.activa ? (
                  <Button variant="outline" size="sm" leftIcon={<Pause className="w-4 h-4" />}>
                    Pausar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" leftIcon={<Play className="w-4 h-4" />}>
                    Reanudar
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4 text-red-600" />
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Historial de Ejecuciones
      </h3>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Ejecución
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Duración (seg)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Tamaño (MB)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observaciones
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
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {item.fecha_ejecucion}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getEstadoInformeIcon(item.estado)}
                      <Badge
                        variant={item.estado === 'completado' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {item.estado}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                    {item.duracion_segundos}s
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                    {item.tamano_archivo ? `${item.tamano_archivo} MB` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {item.error_mensaje || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
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

export default function GeneradorInformesPage() {
  const [activeTab, setActiveTab] = useState('plantillas');

  const tabs = [
    { id: 'plantillas', label: 'Plantillas', icon: <FileText className="w-4 h-4" /> },
    { id: 'informes', label: 'Informes', icon: <Download className="w-4 h-4" /> },
    { id: 'programacion', label: 'Programación', icon: <Clock className="w-4 h-4" /> },
    { id: 'historial', label: 'Historial', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Generador de Informes"
        description="Creación y gestión de plantillas de informes dinámicos"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'plantillas' && <PlantillasSection />}
        {activeTab === 'informes' && <InformesSection />}
        {activeTab === 'programacion' && <ProgramacionSection />}
        {activeTab === 'historial' && <HistorialSection />}
      </div>
    </div>
  );
}
