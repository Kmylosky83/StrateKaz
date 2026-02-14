/**
 * Tab de Gestión Documental - Sistema de Gestión
 *
 * Secciones desde BD (TabSection.code):
 * - tipos_documento: Tipos de Documento y Plantillas
 * - documentos: Constructor y Listado Maestro
 * - control_cambios: Control de Versiones y Firmas
 * - distribucion: Distribución y Control Documental
 *
 * Reutiliza hooks de gestion-estrategica/gestion-documental
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
} from 'lucide-react';
import {
  Card,
  Button,
  EmptyState,
  Badge,
  Spinner,
  ConfirmDialog,
  ExportButton,
  GenericSectionFallback,
} from '@/components/common';

import {
  useDocumentos,
  useTiposDocumento,
  usePlantillasDocumento,
  useListadoMaestro,
  useVersionesDocumento,
  useDeleteTipoDocumento,
  useDeletePlantillaDocumento,
  useActivarPlantilla,
  useDeleteDocumento,
  useDistribucionesActivas,
  useEstadisticasDocumentales,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';
import { useMisFirmasPendientes } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';
import type {
  TipoDocumento,
  PlantillaDocumento,
} from '@/features/gestion-estrategica/types/gestion-documental.types';

// =============================================================================
// SECTION KEYS (match BD TabSection.code)
// =============================================================================

const SECTION_KEYS = {
  TIPOS_DOCUMENTO: 'tipos_documento',
  DOCUMENTOS: 'documentos',
  CONTROL_CAMBIOS: 'control_cambios',
  DISTRIBUCION: 'distribucion',
} as const;

// =============================================================================
// TAB PRINCIPAL
// =============================================================================

interface GestionDocumentalTabProps {
  activeSection: string;
  onCreateTipo: () => void;
  onEditTipo: (tipo: TipoDocumento) => void;
  onCreatePlantilla: () => void;
  onEditPlantilla: (plantilla: PlantillaDocumento) => void;
  onCreateDocumento: () => void;
  onEditDocumento: (id: number) => void;
  onViewDocumento: (id: number) => void;
  onFirmar?: (firmaId: number, rolDisplay?: string) => void;
  onRechazar?: (firmaId: number) => void;
}

export const GestionDocumentalTab = ({
  activeSection,
  onCreateTipo,
  onEditTipo,
  onCreatePlantilla,
  onEditPlantilla,
  onCreateDocumento,
  onEditDocumento,
  onViewDocumento,
  onFirmar,
  onRechazar,
}: GestionDocumentalTabProps) => {
  switch (activeSection) {
    case SECTION_KEYS.TIPOS_DOCUMENTO:
      return (
        <TiposPlantillasSection
          onCreateTipo={onCreateTipo}
          onEditTipo={onEditTipo}
          onCreatePlantilla={onCreatePlantilla}
          onEditPlantilla={onEditPlantilla}
        />
      );
    case SECTION_KEYS.DOCUMENTOS:
      return (
        <DocumentosSection
          onCreateDocumento={onCreateDocumento}
          onEditDocumento={onEditDocumento}
          onViewDocumento={onViewDocumento}
        />
      );
    case SECTION_KEYS.CONTROL_CAMBIOS:
      return (
        <ControlCambiosSection
          onViewDocumento={onViewDocumento}
          onFirmar={onFirmar}
          onRechazar={onRechazar}
        />
      );
    case SECTION_KEYS.DISTRIBUCION:
      return <DistribucionSection onViewDocumento={onViewDocumento} />;
    default:
      return <GenericSectionFallback sectionCode={activeSection} moduleName="Gestion Documental" />;
  }
};

// =============================================================================
// TIPOS Y PLANTILLAS
// =============================================================================

function TiposPlantillasSection({
  onCreateTipo,
  onEditTipo,
  onCreatePlantilla,
  onEditPlantilla,
}: {
  onCreateTipo: () => void;
  onEditTipo: (tipo: TipoDocumento) => void;
  onCreatePlantilla: () => void;
  onEditPlantilla: (plantilla: PlantillaDocumento) => void;
}) {
  const { data: tipos, isLoading: isLoadingTipos } = useTiposDocumento();
  const { data: plantillas, isLoading: isLoadingPlantillas } = usePlantillasDocumento();
  const deleteTipoMutation = useDeleteTipoDocumento();
  const deletePlantillaMutation = useDeletePlantillaDocumento();
  const activarPlantillaMutation = useActivarPlantilla();

  const [selectedTipo, setSelectedTipo] = useState<number | null>(null);
  const [confirmDeleteTipo, setConfirmDeleteTipo] = useState<TipoDocumento | null>(null);
  const [confirmDeletePlantilla, setConfirmDeletePlantilla] = useState<PlantillaDocumento | null>(
    null
  );
  const [tipoMenuOpen, setTipoMenuOpen] = useState<number | null>(null);
  const [plantillaMenuOpen, setPlantillaMenuOpen] = useState<number | null>(null);

  if (isLoadingTipos || isLoadingPlantillas) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de Documento */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tipos de Documento
            </h3>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onCreateTipo}
            >
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
                onClick: onCreateTipo,
                icon: <Plus className="w-4 h-4" />,
              }}
            />
          ) : (
            <div className="space-y-2">
              {tipos.map((tipo) => (
                <Card
                  key={tipo.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTipo === tipo.id ? 'ring-2 ring-indigo-500' : ''
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
                        <h4 className="font-medium text-gray-900 dark:text-white">{tipo.nombre}</h4>
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
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTipoMenuOpen(tipoMenuOpen === tipo.id ? null : tipo.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {tipoMenuOpen === tipo.id && (
                          <div
                            className="absolute right-0 top-8 z-50 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              onClick={() => {
                                onEditTipo(tipo);
                                setTipoMenuOpen(null);
                              }}
                            >
                              <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2"
                              onClick={() => {
                                setConfirmDeleteTipo(tipo);
                                setTipoMenuOpen(null);
                              }}
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
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
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onCreatePlantilla}
            >
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
                onClick: onCreatePlantilla,
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
                        {plantilla.es_por_defecto && <Badge variant="primary">Por defecto</Badge>}
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
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPlantillaMenuOpen(
                              plantillaMenuOpen === plantilla.id ? null : plantilla.id
                            )
                          }
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {plantillaMenuOpen === plantilla.id && (
                          <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              onClick={() => {
                                onEditPlantilla(plantilla);
                                setPlantillaMenuOpen(null);
                              }}
                            >
                              <Edit className="w-3 h-3" /> Editar
                            </button>
                            {plantilla.estado !== 'ACTIVA' && (
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-green-600 flex items-center gap-2"
                                onClick={() => {
                                  activarPlantillaMutation.mutate(plantilla.id);
                                  setPlantillaMenuOpen(null);
                                }}
                              >
                                <CheckCircle className="w-3 h-3" /> Activar
                              </button>
                            )}
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2"
                              onClick={() => {
                                setConfirmDeletePlantilla(plantilla);
                                setPlantillaMenuOpen(null);
                              }}
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Tipo */}
      <ConfirmDialog
        isOpen={!!confirmDeleteTipo}
        onClose={() => setConfirmDeleteTipo(null)}
        onConfirm={() => {
          if (confirmDeleteTipo) {
            deleteTipoMutation.mutate(confirmDeleteTipo.id, {
              onSuccess: () => setConfirmDeleteTipo(null),
            });
          }
        }}
        title="Eliminar Tipo de Documento"
        message={`¿Eliminar el tipo "${confirmDeleteTipo?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteTipoMutation.isPending}
      />

      {/* Confirm Delete Plantilla */}
      <ConfirmDialog
        isOpen={!!confirmDeletePlantilla}
        onClose={() => setConfirmDeletePlantilla(null)}
        onConfirm={() => {
          if (confirmDeletePlantilla) {
            deletePlantillaMutation.mutate(confirmDeletePlantilla.id, {
              onSuccess: () => setConfirmDeletePlantilla(null),
            });
          }
        }}
        title="Eliminar Plantilla"
        message={`¿Eliminar la plantilla "${confirmDeletePlantilla?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deletePlantillaMutation.isPending}
      />
    </>
  );
}

// =============================================================================
// DOCUMENTOS (Listado Maestro + Constructor)
// =============================================================================

function DocumentosSection({
  onCreateDocumento,
  onEditDocumento,
  onViewDocumento,
}: {
  onCreateDocumento: () => void;
  onEditDocumento: (id: number) => void;
  onViewDocumento: (id: number) => void;
}) {
  const { data: documentos, isLoading } = useDocumentos();
  const { data: listadoMaestro } = useListadoMaestro();
  const deleteDocumentoMutation = useDeleteDocumento();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; titulo: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalDocumentos =
    listadoMaestro?.reduce((acc, tipo) => acc + tipo.documentos.length, 0) ?? 0;
  const vigentes =
    listadoMaestro?.reduce(
      (acc, tipo) => acc + tipo.documentos.filter((d) => d.estado === 'PUBLICADO').length,
      0
    ) ?? 0;
  const borradores = documentos?.filter((d) => d.estado === 'BORRADOR').length ?? 0;
  const enRevision = documentos?.filter((d) => d.estado === 'EN_REVISION').length ?? 0;

  return (
    <>
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalDocumentos}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vigentes</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{vigentes}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Borradores</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {borradores}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Revisión</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {enRevision}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Header + Acciones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos por código o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onCreateDocumento}
          >
            Crear Documento
          </Button>
          <ExportButton
            endpoint="/api/gestion-estrategica/gestion-documental/documentos/export/"
            filename="documentos"
          />
        </div>

        {/* Lista de documentos */}
        {!documentos || documentos.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16" />}
            title="No hay documentos"
            description="Comienza creando tu primer documento usando una plantilla o desde cero."
            action={{
              label: 'Crear Documento',
              onClick: onCreateDocumento,
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {documentos
              .filter((doc) =>
                searchTerm
                  ? doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    doc.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                  : true
              )
              .map((documento) => (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                        onClick={() => onViewDocumento(documento.id)}
                      >
                        Ver
                      </Button>
                      {documento.estado === 'BORRADOR' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Edit className="w-4 h-4" />}
                            onClick={() => onEditDocumento(documento.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() =>
                              setConfirmDelete({ id: documento.id, titulo: documento.titulo })
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteDocumentoMutation.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(null),
            });
          }
        }}
        title="Eliminar Documento"
        message={`¿Eliminar "${confirmDelete?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteDocumentoMutation.isPending}
      />
    </>
  );
}

// =============================================================================
// CONTROL DE CAMBIOS (Versiones + Firmas)
// =============================================================================

function ControlCambiosSection({
  onViewDocumento,
  onFirmar,
  onRechazar,
}: {
  onViewDocumento: (id: number) => void;
  onFirmar?: (firmaId: number, rolDisplay?: string) => void;
  onRechazar?: (firmaId: number) => void;
}) {
  const [selectedDocumento, setSelectedDocumento] = useState<number | null>(null);
  const { data: documentos } = useDocumentos();
  const {
    firmasPendientes,
    totalPendientes,
    miTurno,
    isLoading: firmasLoading,
  } = useMisFirmasPendientes();

  return (
    <div className="space-y-8">
      {/* Firmas pendientes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Firmas Pendientes</h3>
        {firmasLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : !firmasPendientes || firmasPendientes.length === 0 ? (
          <EmptyState
            icon={<PenTool className="w-12 h-12" />}
            title="No hay firmas pendientes"
            description="No tienes documentos esperando tu firma en este momento."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {totalPendientes}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <PenTool className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mi Turno</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{miTurno}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">En Cola</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {totalPendientes - miTurno}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {firmasPendientes.map((firma) => (
                <Card key={firma.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={firma.es_mi_turno ? 'warning' : 'secondary'}>
                          {firma.rol_firma_display}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Orden: {firma.orden}
                        </span>
                        {firma.es_mi_turno && (
                          <Badge variant="primary" size="sm">
                            Tu turno
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {firma.documento_titulo}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {firma.documento_tipo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {firma.dias_pendiente} día(s) pendiente
                    </span>
                    {firma.fecha_limite && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Límite: {new Date(firma.fecha_limite).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      leftIcon={<PenTool className="w-4 h-4" />}
                      disabled={!firma.es_mi_turno}
                      onClick={() => onFirmar?.(firma.id, firma.rol_firma_display)}
                    >
                      Firmar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      disabled={!firma.es_mi_turno}
                      onClick={() => onRechazar?.(firma.id)}
                    >
                      Rechazar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Control de Versiones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Control de Versiones
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-4 lg:col-span-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Seleccionar Documento
            </h4>
            {!documentos || documentos.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No hay documentos disponibles
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {documentos.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocumento(doc.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedDocumento === doc.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
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
                      <span className="text-xs text-gray-500">Rev. {doc.numero_revision}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="lg:col-span-2">
            {!selectedDocumento ? (
              <EmptyState
                icon={<GitBranch className="w-12 h-12" />}
                title="Selecciona un documento"
                description="Elige un documento para ver su historial de versiones"
              />
            ) : (
              <VersionTimeline documentoId={selectedDocumento} onViewDocumento={onViewDocumento} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VersionTimeline({
  documentoId,
  onViewDocumento,
}: {
  documentoId: number;
  onViewDocumento: (id: number) => void;
}) {
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
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  version.is_version_actual
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <GitBranch className="w-5 h-5" />
              </div>
              {index < versiones.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
              )}
            </div>

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
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => onViewDocumento(documentoId)}
                >
                  Ver Documento
                </Button>
                {version.archivo_pdf_version && (
                  <a href={version.archivo_pdf_version} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                      Descargar
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// DISTRIBUCIÓN
// =============================================================================

function DistribucionSection({ onViewDocumento }: { onViewDocumento: (id: number) => void }) {
  const { data: documentos } = useDocumentos({ estado: 'PUBLICADO' });
  const { data: estadisticas, isLoading: isLoadingStats } = useEstadisticasDocumentales();

  const totalDistribuidos = documentos?.length || 0;
  const totalConfirmados = estadisticas?.distribucion?.confirmadas || 0;
  const totalPendientes = estadisticas?.distribucion?.pendientes || 0;
  const totalRegistros = estadisticas?.distribucion?.total || 0;

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Distribuidos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {isLoadingStats ? '...' : totalDistribuidos}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Registros</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {isLoadingStats ? '...' : totalRegistros}
              </p>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {isLoadingStats ? '...' : totalConfirmados}
              </p>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {isLoadingStats ? '...' : totalPendientes}
              </p>
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
                    Descargas
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
                        {doc.areas_aplicacion?.slice(0, 2).map((area, idx) => (
                          <Badge key={idx} variant="outline" size="sm">
                            {area}
                          </Badge>
                        ))}
                        {(doc.areas_aplicacion?.length || 0) > 2 && (
                          <Badge variant="outline" size="sm">
                            +{doc.areas_aplicacion.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {doc.numero_descargas || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="success">Distribuido</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                        onClick={() => onViewDocumento(doc.id)}
                      >
                        Ver
                      </Button>
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
