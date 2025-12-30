/**
 * Página: Sistema Documental HSEQ
 *
 * Sistema completo de gestión documental con:
 * - Control de documentos y versiones
 * - Firmas digitales
 * - Plantillas y constructor de documentos
 * - Distribución y control documental
 */
import { useState } from 'react';
import {
  FileText,
  Files,
  Layout,
  GitBranch,
  PenTool,
  Share2,
  Plus,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  Tag,
  MoreVertical,
  FileCheck,
  Copy,
  Archive,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';

// Importar hooks del módulo
import {
  useDocumentos,
  useTiposDocumento,
  usePlantillasDocumento,
  useFirmasPendientes,
  useListadoMaestro,
  useVersionesDocumento,
  useControlDocumental,
  type Documento,
  type TipoDocumento,
  type PlantillaDocumento,
  type FirmaDocumento,
  type VersionDocumento,
  type ControlDocumental,
} from '../hooks/useSistemaDocumental';

// ==================== SECCIÓN: LISTADO MAESTRO ====================
function ListadoMaestroSection() {
  const { data: listadoMaestro, isLoading } = useListadoMaestro();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!listadoMaestro || listadoMaestro.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No hay documentos publicados"
        description="El listado maestro mostrará todos los documentos vigentes una vez que publiques documentos."
        action={{
          label: 'Crear Primer Documento',
          onClick: () => {},
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Documentos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {listadoMaestro.reduce((acc, tipo) => acc + tipo.documentos.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tipos de Documento</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {listadoMaestro.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Files className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vigentes</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {listadoMaestro.reduce(
                  (acc, tipo) => acc + tipo.documentos.filter((d) => d.estado === 'PUBLICADO').length,
                  0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Revisión</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {listadoMaestro.reduce(
                  (acc, tipo) => acc + tipo.documentos.filter((d) => d.estado === 'EN_REVISION').length,
                  0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos por código o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filtrar
        </Button>
        <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
          Exportar PDF
        </Button>
      </div>

      {/* Listado por tipo de documento */}
      <div className="space-y-6">
        {listadoMaestro.map((tipoDocumento) => (
          <Card key={tipoDocumento.tipo_documento} className="overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tipoDocumento.tipo_documento}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tipoDocumento.documentos.length} documento(s)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Versión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Vigencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tipoDocumento.documentos.map((doc) => (
                    <tr key={doc.codigo} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {doc.codigo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">{doc.titulo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">{doc.version}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(doc.fecha_vigencia).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            doc.estado === 'PUBLICADO'
                              ? 'success'
                              : doc.estado === 'APROBADO'
                              ? 'primary'
                              : 'warning'
                          }
                        >
                          {doc.estado}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                            Ver
                          </Button>
                          <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==================== SECCIÓN: TIPOS Y PLANTILLAS ====================
function TiposPlantillasSection() {
  const { data: tipos, isLoading: isLoadingTipos } = useTiposDocumento();
  const { data: plantillas, isLoading: isLoadingPlantillas } = usePlantillasDocumento();
  const [selectedTipo, setSelectedTipo] = useState<number | null>(null);

  if (isLoadingTipos || isLoadingPlantillas) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tipos de Documento */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tipos de Documento
          </h3>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Tipo
          </Button>
        </div>

        {!tipos || tipos.length === 0 ? (
          <EmptyState
            icon={<Files className="w-12 h-12" />}
            title="No hay tipos de documento"
            description="Crea tipos de documento para organizar tu sistema documental."
            action={{
              label: 'Crear Tipo',
              onClick: () => {},
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="space-y-2">
            {tipos.map((tipo) => (
              <Card
                key={tipo.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedTipo === tipo.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTipo(tipo.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tipo.color_identificacion }}
                      />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {tipo.nombre}
                      </h4>
                      <Badge variant="secondary">{tipo.codigo}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {tipo.descripcion}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tipo.nivel_documento}
                      </span>
                      {tipo.requiere_aprobacion && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Requiere aprobación
                        </span>
                      )}
                      {tipo.requiere_firma && (
                        <span className="flex items-center gap-1">
                          <PenTool className="w-3 h-3" />
                          Requiere firma
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tipo.is_active ? 'success' : 'secondary'}>
                      {tipo.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Plantillas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plantillas</h3>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Plantilla
          </Button>
        </div>

        {!plantillas || plantillas.length === 0 ? (
          <EmptyState
            icon={<Layout className="w-12 h-12" />}
            title="No hay plantillas"
            description="Crea plantillas reutilizables para generar documentos de forma rápida."
            action={{
              label: 'Crear Plantilla',
              onClick: () => {},
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="space-y-2">
            {plantillas.map((plantilla) => (
              <Card key={plantilla.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Layout className="w-4 h-4 text-gray-400" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {plantilla.nombre}
                      </h4>
                      {plantilla.es_por_defecto && (
                        <Badge variant="primary">Por defecto</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {plantilla.descripcion}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{plantilla.tipo_plantilla}</span>
                      <span>v{plantilla.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        plantilla.estado === 'ACTIVA'
                          ? 'success'
                          : plantilla.estado === 'BORRADOR'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {plantilla.estado}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== SECCIÓN: CONSTRUCTOR DE DOCUMENTOS ====================
function ConstructorDocumentosSection() {
  const { data: documentos, isLoading } = useDocumentos();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mis Documentos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestiona tus documentos en borrador y en proceso
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          Crear Documento
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Edit className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Borradores</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {documentos?.filter((d) => d.estado === 'BORRADOR').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Revisión</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {documentos?.filter((d) => d.estado === 'EN_REVISION').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aprobados</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {documentos?.filter((d) => d.estado === 'APROBADO').length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de documentos */}
      {!documentos || documentos.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No tienes documentos"
          description="Comienza creando tu primer documento usando una plantilla o desde cero."
          action={{
            label: 'Crear Documento',
            onClick: () => {},
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {documentos.map((documento) => (
            <Card key={documento.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {documento.titulo}
                    </h4>
                    <Badge variant="secondary" size="sm">
                      {documento.codigo}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {documento.resumen}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(documento.created_at).toLocaleDateString('es-CO')}
                </span>
                <span>v{documento.version_actual}</span>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    documento.estado === 'APROBADO'
                      ? 'success'
                      : documento.estado === 'EN_REVISION'
                      ? 'warning'
                      : 'secondary'
                  }
                >
                  {documento.estado}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                    Editar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== SECCIÓN: CONTROL DE VERSIONES ====================
function VersionesSection() {
  const [selectedDocumento, setSelectedDocumento] = useState<number | null>(null);
  const { data: documentos } = useDocumentos();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Control de Versiones
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visualiza y gestiona el historial de versiones de tus documentos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de documentos */}
        <Card className="p-4 lg:col-span-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Seleccionar Documento
          </h4>
          {!documentos || documentos.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No hay documentos disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {documentos.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocumento(doc.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDocumento === doc.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {doc.codigo}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {doc.titulo}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" size="sm">
                      v{doc.version_actual}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Rev. {doc.numero_revision}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Timeline de versiones */}
        <div className="lg:col-span-2">
          {!selectedDocumento ? (
            <EmptyState
              icon={<GitBranch className="w-12 h-12" />}
              title="Selecciona un documento"
              description="Elige un documento para ver su historial de versiones"
            />
          ) : (
            <VersionTimeline documentoId={selectedDocumento} />
          )}
        </div>
      </div>
    </div>
  );
}

function VersionTimeline({ documentoId }: { documentoId: number }) {
  const { data: versiones, isLoading } = useVersionesDocumento(documentoId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!versiones || versiones.length === 0) {
    return (
      <EmptyState
        icon={<GitBranch className="w-12 h-12" />}
        title="Sin historial de versiones"
        description="Este documento no tiene versiones registradas"
      />
    );
  }

  return (
    <div className="space-y-4">
      {versiones.map((version, index) => (
        <Card key={version.id} className="p-4">
          <div className="flex items-start gap-4">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  version.is_version_actual
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <GitBranch className="w-5 h-5" />
              </div>
              {index < versiones.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
              )}
            </div>

            {/* Version details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Versión {version.numero_version}
                    </h4>
                    {version.is_version_actual && (
                      <Badge variant="primary" size="sm">
                        Actual
                      </Badge>
                    )}
                    <Badge variant="secondary" size="sm">
                      {version.tipo_cambio}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {version.descripcion_cambios}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(version.fecha_version).toLocaleDateString('es-CO')}
                </span>
                {version.fecha_aprobacion && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Aprobado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                  Ver
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Descargar
                </Button>
                {!version.is_version_actual && (
                  <Button variant="ghost" size="sm" leftIcon={<Copy className="w-4 h-4" />}>
                    Restaurar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ==================== SECCIÓN: FIRMAS DIGITALES ====================
function FirmasSection() {
  const { data: firmasPendientes, isLoading } = useFirmasPendientes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const firmasPorEstado = {
    pendientes: firmasPendientes?.filter((f) => f.estado === 'PENDIENTE') || [],
    firmadas: firmasPendientes?.filter((f) => f.estado === 'FIRMADO') || [],
    rechazadas: firmasPendientes?.filter((f) => f.estado === 'RECHAZADO') || [],
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {firmasPorEstado.pendientes.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Firmadas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {firmasPorEstado.firmadas.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rechazadas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {firmasPorEstado.rechazadas.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Firmas pendientes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Firmas Pendientes
        </h3>
        {firmasPorEstado.pendientes.length === 0 ? (
          <EmptyState
            icon={<PenTool className="w-12 h-12" />}
            title="No hay firmas pendientes"
            description="No tienes documentos esperando tu firma en este momento."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {firmasPorEstado.pendientes.map((firma) => (
              <Card key={firma.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="warning">{firma.tipo_firma}</Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Orden: {firma.orden_firma}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Documento #{firma.documento}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cargo: {firma.cargo_firmante}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Solicitado: {new Date(firma.fecha_solicitud).toLocaleDateString('es-CO')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    leftIcon={<PenTool className="w-4 h-4" />}
                  >
                    Firmar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historial de firmas */}
      {firmasPorEstado.firmadas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Firmas
          </h3>
          <Card className="divide-y divide-gray-200 dark:divide-gray-700">
            {firmasPorEstado.firmadas.slice(0, 5).map((firma) => (
              <div key={firma.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Documento #{firma.documento}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {firma.tipo_firma} - {firma.cargo_firmante}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {firma.fecha_firma
                      ? new Date(firma.fecha_firma).toLocaleDateString('es-CO')
                      : '-'}
                  </p>
                  <Badge variant="success" size="sm">
                    Firmado
                  </Badge>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ==================== SECCIÓN: DISTRIBUCIÓN ====================
function DistribucionSection() {
  const { data: documentos } = useDocumentos({ estado: 'PUBLICADO' });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Distribución y Control Documental
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gestiona la distribución de documentos a las áreas y usuarios correspondientes
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Distribuidos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {documentos?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Áreas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confirmados</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">45</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de distribución */}
      {!documentos || documentos.length === 0 ? (
        <EmptyState
          icon={<Share2 className="w-16 h-16" />}
          title="No hay documentos para distribuir"
          description="Los documentos publicados aparecerán aquí para su distribución."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Versión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Áreas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Copias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {doc.titulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{doc.codigo}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{doc.version_actual}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {doc.areas_aplicacion.slice(0, 2).map((area, idx) => (
                          <Badge key={idx} variant="outline" size="sm">
                            {area}
                          </Badge>
                        ))}
                        {doc.areas_aplicacion.length > 2 && (
                          <Badge variant="outline" size="sm">
                            +{doc.areas_aplicacion.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {doc.numero_descargas} descargas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="success">Distribuido</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Share2 className="w-4 h-4" />}
                        >
                          Distribuir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Archive className="w-4 h-4" />}
                        >
                          Archivar
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
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function SistemaDocumentalPage() {
  const [activeTab, setActiveTab] = useState('listado-maestro');

  const tabs = [
    {
      id: 'listado-maestro',
      label: 'Listado Maestro',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'tipos-plantillas',
      label: 'Tipos y Plantillas',
      icon: <Files className="w-4 h-4" />,
    },
    {
      id: 'constructor',
      label: 'Constructor',
      icon: <Layout className="w-4 h-4" />,
    },
    {
      id: 'versiones',
      label: 'Versiones',
      icon: <GitBranch className="w-4 h-4" />,
    },
    {
      id: 'firmas',
      label: 'Firmas',
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      id: 'distribucion',
      label: 'Distribución',
      icon: <Share2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sistema Documental"
        description="Gestión integral de documentos HSEQ con control de versiones y firmas digitales"
      />

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'listado-maestro' && <ListadoMaestroSection />}
        {activeTab === 'tipos-plantillas' && <TiposPlantillasSection />}
        {activeTab === 'constructor' && <ConstructorDocumentosSection />}
        {activeTab === 'versiones' && <VersionesSection />}
        {activeTab === 'firmas' && <FirmasSection />}
        {activeTab === 'distribucion' && <DistribucionSection />}
      </div>
    </div>
  );
}
