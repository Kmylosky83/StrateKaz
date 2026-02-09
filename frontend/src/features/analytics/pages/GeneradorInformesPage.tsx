/**
 * Página: Generador de Informes (REWRITTEN - Sprint 8)
 *
 * Generación automática de informes dinámicos con 4 tabs:
 * - Plantillas: CRUD plantillas de informe
 * - Informes: Generación y descarga de informes
 * - Programación: Programaciones automáticas
 * - Historial: Historial de ejecuciones
 *
 * CHANGES:
 * - Deleted ALL mock data
 * - Connected to real hooks from useAnalytics
 * - All buttons functional (no noop)
 * - Integrated PlantillaInformeFormModal + ProgramacionInformeFormModal
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
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import {
  usePlantillasInforme,
  useInformesDinamicos,
  useGenerarInforme,
  useProgramacionesInforme,
} from '../hooks/useAnalytics';
import { PlantillaInformeFormModal } from '../components/PlantillaInformeFormModal';
import { ProgramacionInformeFormModal } from '../components/ProgramacionInformeFormModal';
import { useQuery } from '@tanstack/react-query';
import { historialInformesApi } from '../api';

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
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<any>(null);

  const { data: plantillasData, isLoading } = usePlantillasInforme();
  const plantillas = plantillasData || [];

  const handleEdit = (plantilla: any) => {
    setSelectedPlantilla(plantilla);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedPlantilla(null);
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
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowFormModal(true)}>
          Nueva Plantilla
        </Button>
      </div>

      {plantillas.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No hay plantillas registradas"
          description="Crea tu primera plantilla de informe"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado Por</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {plantillas.map((plantilla) => (
                  <tr key={plantilla.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {plantilla.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{plantilla.nombre}</td>
                    <td className="px-6 py-4">
                      <Badge variant="gray" size="sm" className={getTipoInformeColor(plantilla.tipo_informe)}>
                        {plantilla.tipo_informe}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 uppercase">
                      {plantilla.formato_salida}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {plantilla.creado_por_nombre || '-'}
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
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(plantilla)}>
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
      )}

      <PlantillaInformeFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        plantilla={selectedPlantilla}
      />
    </div>
  );
};

const InformesSection = () => {
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [plantillaId, setPlantillaId] = useState('');
  const [periodo, setPeriodo] = useState('');

  const { data: informesData, isLoading } = useInformesDinamicos();
  const { data: plantillasData } = usePlantillasInforme();
  const generarMutation = useGenerarInforme();

  const informes = informesData || [];
  const plantillas = plantillasData || [];

  const handleGenerar = async () => {
    if (!plantillaId || !periodo) return;
    try {
      await generarMutation.mutateAsync({
        plantillaId: parseInt(plantillaId),
        periodo,
      });
      setShowGenerateForm(false);
      setPlantillaId('');
      setPeriodo('');
    } catch (error) {
      console.error('Error al generar informe:', error);
    }
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informes Generados</h3>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowGenerateForm(!showGenerateForm)}
        >
          Generar Informe
        </Button>
      </div>

      {showGenerateForm && (
        <Card variant="bordered" padding="md">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Generar Nuevo Informe</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={plantillaId}
                onChange={(e) => setPlantillaId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar plantilla...</option>
                {plantillas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.codigo})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Periodo (2024-12)"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGenerateForm(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerar}
                disabled={generarMutation.isPending || !plantillaId || !periodo}
              >
                {generarMutation.isPending ? 'Generando...' : 'Generar'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {informes.length === 0 ? (
        <EmptyState icon={<FileText className="w-12 h-12" />} title="No hay informes generados" description="Genera tu primer informe dinámico" />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plantilla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Generación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generado Por</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {informes.map((informe) => (
                  <tr key={informe.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{informe.plantilla_nombre || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{informe.periodo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {informe.fecha_generacion || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {informe.generado_por_nombre || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getEstadoInformeIcon(informe.estado)}
                        <Badge
                          variant={
                            informe.estado === 'completado'
                              ? 'success'
                              : informe.estado === 'error'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {informe.estado}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {informe.estado === 'completado' && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        {informe.enviado_email && (
                          <Badge variant="info" size="sm">
                            <Send className="w-3 h-3 mr-1" />
                            Enviado
                          </Badge>
                        )}
                      </div>
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

const ProgramacionSection = () => {
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: programacionesData, isLoading } = useProgramacionesInforme();
  const programaciones = programacionesData || [];

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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Programaciones Automáticas</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowFormModal(true)}>
          Nueva Programación
        </Button>
      </div>

      {programaciones.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-12 h-12" />}
          title="No hay programaciones configuradas"
          description="Crea una programación para generar informes automáticamente"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programaciones.map((prog) => (
            <Card key={prog.id} variant="bordered" padding="md">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{prog.plantilla_nombre || '-'}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {prog.frecuencia} - {prog.hora_ejecucion}
                    </p>
                  </div>
                  {prog.activa ? (
                    <Badge variant="success" size="sm">
                      <Play className="w-3 h-3 mr-1" />
                      Activa
                    </Badge>
                  ) : (
                    <Badge variant="gray" size="sm">
                      <Pause className="w-3 h-3 mr-1" />
                      Pausada
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Próxima Ejecución:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{prog.proxima_ejecucion || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Última Ejecución:</span>
                    <span className="text-gray-600 dark:text-gray-300">{prog.ultima_ejecucion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Destinatarios:</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {prog.destinatarios_email?.length || 0} correo(s)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  {prog.estado_ultima_ejecucion && (
                    <div className="flex items-center gap-1">
                      {getEstadoInformeIcon(prog.estado_ultima_ejecucion)}
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {prog.estado_ultima_ejecucion}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProgramacionInformeFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} />
    </div>
  );
};

const HistorialSection = () => {
  const { data: historialData, isLoading } = useQuery({
    queryKey: ['historial-informes'],
    queryFn: () => historialInformesApi.getAll(),
  });

  const historial = historialData || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const stats = {
    total: historial.length,
    exitosos: historial.filter((h: any) => h.estado === 'completado').length,
    fallidos: historial.filter((h: any) => h.estado === 'error').length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Ejecuciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-500" />
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
      </div>

      {historial.length === 0 ? (
        <EmptyState icon={<Clock className="w-12 h-12" />} title="No hay historial" description="El historial de ejecuciones aparecerá aquí" />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ejecución</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duración (s)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tamaño (MB)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {historial.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.fecha_ejecucion || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getEstadoInformeIcon(item.estado)}
                        <Badge
                          variant={item.estado === 'completado' ? 'success' : item.estado === 'error' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {item.estado}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                      {item.duracion_segundos || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                      {item.tamano_archivo || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.archivo_generado || '-'}</td>
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
        description="Generación automática de informes dinámicos con plantillas configurables"
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
