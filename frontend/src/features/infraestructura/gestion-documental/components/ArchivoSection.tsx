/**
 * ArchivoSection — Archivo documental: vigentes, historial y obsoletos.
 *
 * Responde: ¿cómo consulto el archivo de documentos ya procesados?
 * Sub-secciones:
 *   - Vigentes: documentos PUBLICADOS con búsqueda full-text
 *   - Versiones: historial de cambios por documento
 *   - Distribución: seguimiento de lecturas (vista admin)
 *   - Archivados: OBSOLETO + ARCHIVADO (retención completada)
 *
 * Nota: "Mis Lecturas" viven en Mi Portal — esta vista es para administradores
 * del sistema que necesitan ver QUIÉN leyó qué y cuándo.
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import {
  Archive,
  BookOpen,
  GitBranch,
  Share2,
  Search,
  Eye,
  Download,
  CheckCircle,
  Calendar,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  FileCheck,
  Layers,
  ExternalLink,
  GitCompare,
  FileDown,
  ArrowLeftRight,
} from 'lucide-react';
import { Card, Button, EmptyState, Badge, Spinner, ProtectedAction } from '@/components/common';
import { BaseModal } from '@/components/modals';
import { Input } from '@/components/forms';
import { PageTabs, StatsGrid, StatsGridSkeleton, TableSkeleton } from '@/components/layout';
import type { TabItem } from '@/components/layout';
import { useModuleColor } from '@/hooks/useModuleColor';
import { useIsSuperAdmin } from '@/hooks/usePermissions';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { documentoApi } from '../api/gestionDocumentalApi';

import {
  useDocumentos,
  useVersionesDocumento,
  useCompararVersiones,
  useEstadisticasDocumentales,
} from '../hooks/useGestionDocumental';
import type { Documento, VersionDocumento } from '../types/gestion-documental.types';

const IngestarLoteModal = lazy(() => import('./IngestarLoteModal'));

type SubTab = 'vigentes' | 'versiones' | 'distribucion' | 'archivados' | 'registros_externos';

const ARCHIVO_TABS: TabItem[] = [
  { id: 'vigentes', label: 'Vigentes', icon: BookOpen },
  { id: 'versiones', label: 'Versiones', icon: GitBranch },
  { id: 'distribucion', label: 'Distribución', icon: Share2 },
  { id: 'archivados', label: 'Archivados', icon: Archive },
  { id: 'registros_externos', label: 'Registros Externos', icon: ExternalLink },
];

interface ArchivoSectionProps {
  onViewDocumento: (id: number) => void;
}

export function ArchivoSection({ onViewDocumento }: ArchivoSectionProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('vigentes');
  const [showLoteModal, setShowLoteModal] = useState(false);
  const { color: moduleColor } = useModuleColor('infra_gestion_documental');
  const isSuperAdmin = useIsSuperAdmin();
  const { data: estadisticas, isLoading: isLoadingStats } = useEstadisticasDocumentales();

  const totalArchivo =
    (estadisticas?.publicados ?? 0) +
    (estadisticas?.obsoletos ?? 0) +
    (estadisticas?.archivados ?? 0);

  const archivoStats = [
    { label: 'Total Archivo', value: totalArchivo, icon: BookOpen, iconColor: 'info' as const },
    {
      label: 'Publicados',
      value: estadisticas?.publicados ?? 0,
      icon: CheckCircle,
      iconColor: 'success' as const,
    },
    {
      label: 'Obsoletos',
      value: estadisticas?.obsoletos ?? 0,
      icon: XCircle,
      iconColor: 'danger' as const,
    },
    {
      label: 'Archivados',
      value: estadisticas?.archivados ?? 0,
      icon: Archive,
      iconColor: 'gray' as const,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats: conteo de documentos procesados (PUBLICADO + OBSOLETO + ARCHIVADO) */}
      {isLoadingStats ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={archivoStats} columns={4} moduleColor="indigo" variant="compact" />
      )}

      {/* Acción: Ingesta Masiva */}
      {!isSuperAdmin && (
        <div className="flex justify-end">
          <ProtectedAction permission="gestion_documental.repositorio.create">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Layers className="w-4 h-4" />}
              onClick={() => setShowLoteModal(true)}
            >
              Ingesta Masiva
            </Button>
          </ProtectedAction>
        </div>
      )}

      <PageTabs
        tabs={ARCHIVO_TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as SubTab)}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeTab === 'vigentes' && <VigentesTab onViewDocumento={onViewDocumento} />}
      {activeTab === 'versiones' && <VersionesTab onViewDocumento={onViewDocumento} />}
      {activeTab === 'distribucion' && <DistribucionTab onViewDocumento={onViewDocumento} />}
      {activeTab === 'archivados' && <ArchivadosTab onViewDocumento={onViewDocumento} />}
      {activeTab === 'registros_externos' && (
        <RegistrosExternosTab onViewDocumento={onViewDocumento} />
      )}

      <Suspense fallback={null}>
        {showLoteModal && (
          <IngestarLoteModal isOpen={showLoteModal} onClose={() => setShowLoteModal(false)} />
        )}
      </Suspense>
    </div>
  );
}

// ── Tab Vigentes ──────────────────────────────────────────────────────────

function VigentesTab({ onViewDocumento }: { onViewDocumento: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);

  // Debounce 350ms — evita request por cada tecla
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: documentos, isLoading } = useDocumentos({
    estado: 'PUBLICADO',
    ...(debouncedSearch.length >= 3 ? { buscar: debouncedSearch } : {}),
  });

  // Fallback client-side para búsquedas cortas (< 3 chars)
  const filtered =
    debouncedSearch.length > 0 && debouncedSearch.length < 3
      ? (documentos ?? []).filter(
          (d) =>
            d.titulo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            d.codigo.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      : (documentos ?? []);

  async function handleExportListadoPdf() {
    setExportingPdf(true);
    try {
      const blob = await documentoApi.listadoMaestroPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listado_maestro_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  }

  if (isLoading) return <TableSkeleton rows={5} columns={4} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <ProtectedAction permission="gestion_documental.archivo.view">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileDown className="w-4 h-4" />}
            onClick={handleExportListadoPdf}
            isLoading={exportingPdf}
            className="w-full sm:w-auto"
          >
            Listado Maestro PDF
          </Button>
        </ProtectedAction>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title={search ? 'Sin resultados' : 'Sin documentos vigentes'}
          description={
            search
              ? `No se encontraron documentos para "${search}".`
              : 'Los documentos publicados aparecerán aquí. Crea un documento en Repositorio y completa el flujo de aprobación.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{doc.codigo}</p>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.titulo}
                  </h4>
                </div>
                <Badge variant="success" size="sm" className="shrink-0">
                  v{doc.version_actual}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {doc.tipo_documento_detail?.nombre ?? String(doc.tipo_documento)}
              </p>
              {doc.fecha_publicacion && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Publicado: {new Date(doc.fecha_publicacion).toLocaleDateString('es-CO')}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={() => onViewDocumento(doc.id)}
              >
                Ver documento
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab Versiones ─────────────────────────────────────────────────────────

function VersionesTab({ onViewDocumento }: { onViewDocumento: (id: number) => void }) {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const { data: documentos } = useDocumentos();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Selector de documento */}
      <Card className="p-4 lg:col-span-1">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Seleccionar documento
        </h4>
        {!documentos || documentos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay documentos disponibles</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {documentos.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors text-sm ${
                  selectedDocId === doc.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <p className="font-medium text-gray-900 dark:text-white truncate">{doc.codigo}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.titulo}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="secondary" size="sm">
                    v{doc.version_actual}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Timeline de versiones */}
      <div className="lg:col-span-2">
        {!selectedDocId ? (
          <EmptyState
            icon={<GitBranch className="w-12 h-12" />}
            title="Selecciona un documento"
            description="Elige un documento para ver su historial de versiones"
          />
        ) : (
          <VersionTimeline documentoId={selectedDocId} onViewDocumento={onViewDocumento} />
        )}
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
  const [comparandoVersionId, setComparandoVersionId] = useState<number | null>(null);
  const { data: versiones, isLoading } = useVersionesDocumento(documentoId);

  if (isLoading) return <TableSkeleton rows={4} columns={3} />;

  if (!versiones || versiones.length === 0)
    return (
      <EmptyState
        icon={<GitBranch className="w-12 h-12" />}
        title="Sin historial de versiones"
        description="Este documento no tiene versiones registradas"
      />
    );

  return (
    <>
      <div className="space-y-3">
        {versiones.map((version, index) => (
          <Card key={version.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    version.is_version_actual
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                </div>
                {index < versiones.length - 1 && (
                  <div className="w-0.5 h-4 bg-gray-200 dark:bg-gray-700 mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    Versión {version.numero_version}
                  </span>
                  {version.is_version_actual && (
                    <Badge variant="primary" size="sm">
                      Actual
                    </Badge>
                  )}
                  <Badge variant="secondary" size="sm">
                    {version.tipo_cambio}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {version.descripcion_cambios}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(version.fecha_version).toLocaleDateString('es-CO')}
                  </span>
                  {version.fecha_aprobacion && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      Aprobado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => onViewDocumento(documentoId)}
                  >
                    Ver
                  </Button>
                  {/* Comparar solo si no es la primera versión */}
                  {index < versiones.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<GitCompare className="w-3.5 h-3.5" />}
                      onClick={() => setComparandoVersionId(version.id)}
                    >
                      Comparar
                    </Button>
                  )}
                  {version.archivo_pdf_version && (
                    <a href={version.archivo_pdf_version} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        PDF
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {comparandoVersionId !== null && (
        <VersionDiffModal
          versionId={comparandoVersionId}
          versiones={versiones}
          onClose={() => setComparandoVersionId(null)}
        />
      )}
    </>
  );
}

// ── Modal Comparación de Versiones ────────────────────────────────────────

function VersionDiffModal({
  versionId,
  versiones,
  onClose,
}: {
  versionId: number;
  versiones: VersionDocumento[];
  onClose: () => void;
}) {
  const { data, isLoading } = useCompararVersiones(versionId);

  const versionActual = versiones.find((v) => v.id === versionId);

  return (
    <BaseModal isOpen onClose={onClose} title="Comparación de Versiones" size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !data ? (
        <EmptyState
          icon={<ArrowLeftRight className="w-10 h-10" />}
          title="Sin datos de comparación"
          description="No se pudo obtener la comparación de versiones."
        />
      ) : (
        <div className="space-y-5">
          {/* Encabezado comparación */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Versión anterior</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                v{data.version_anterior?.numero_version ?? '—'}
              </p>
              {data.version_anterior?.fecha_version && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {new Date(data.version_anterior.fecha_version).toLocaleDateString('es-CO')}
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-0.5">Versión actual</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                v{versionActual?.numero_version ?? data.version_actual?.numero_version ?? '—'}
              </p>
              {data.version_actual?.fecha_version && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {new Date(data.version_actual.fecha_version).toLocaleDateString('es-CO')}
                </p>
              )}
            </div>
          </div>

          {/* Cambios detectados */}
          {Array.isArray(data.cambios) && data.cambios.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Cambios detectados ({data.cambios.length})
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(data.cambios as Array<{ campo: string; anterior: string; nuevo: string }>).map(
                  (cambio, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
                          {cambio.campo}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/10">
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                            Anterior
                          </p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
                            {cambio.anterior || <span className="italic text-gray-400">vacío</span>}
                          </p>
                        </div>
                        <div className="px-3 py-2 bg-green-50 dark:bg-green-900/10">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                            Nuevo
                          </p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
                            {cambio.nuevo || <span className="italic text-gray-400">vacío</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                No hay cambios detallados registrados para esta versión.
                {versionActual?.descripcion_cambios && (
                  <span className="block mt-1 font-medium">
                    Descripción: {versionActual.descripcion_cambios}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Snapshots de contenido side-by-side */}
          {(data.version_anterior?.contenido_snapshot ||
            data.version_actual?.contenido_snapshot) && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Contenido
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
                  <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      v{data.version_anterior?.numero_version}
                    </span>
                  </div>
                  <div
                    className="p-3 text-xs text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto prose prose-xs dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: data.version_anterior?.contenido_snapshot ?? '',
                    }}
                  />
                </div>
                <div className="rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
                  <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      v{data.version_actual?.numero_version}
                    </span>
                  </div>
                  <div
                    className="p-3 text-xs text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto prose prose-xs dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: data.version_actual?.contenido_snapshot ?? '',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
}

// ── Tab Distribución (vista admin) ────────────────────────────────────────

const distribucionColumns: ResponsiveTableColumn<Documento & Record<string, unknown>>[] = [
  {
    key: 'documento',
    header: 'Documento',
    priority: 1,
    render: (item) => {
      const doc = item as unknown as Documento;
      return (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.titulo}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{doc.codigo}</p>
        </div>
      );
    },
  },
  {
    key: 'version',
    header: 'Versión',
    priority: 2,
    render: (item) => {
      const doc = item as unknown as Documento;
      return <Badge variant="secondary">{doc.version_actual}</Badge>;
    },
  },
  {
    key: 'areas',
    header: 'Áreas',
    hideOnTablet: true,
    render: (item) => {
      const doc = item as unknown as Documento;
      return (
        <div className="flex flex-wrap gap-1">
          {doc.areas_aplicacion?.slice(0, 2).map((area: string, idx: number) => (
            <Badge key={idx} variant="gray" size="sm">
              {area}
            </Badge>
          ))}
          {(doc.areas_aplicacion?.length || 0) > 2 && (
            <Badge variant="gray" size="sm">
              +{doc.areas_aplicacion.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    key: 'descargas',
    header: 'Descargas',
    hideOnTablet: true,
    render: (item) => {
      const doc = item as unknown as Documento;
      return (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {doc.numero_descargas || 0}
        </span>
      );
    },
  },
  {
    key: 'estado',
    header: 'Estado',
    priority: 2,
    render: () => <Badge variant="success">Publicado</Badge>,
  },
];

function DistribucionTab({ onViewDocumento }: { onViewDocumento: (id: number) => void }) {
  const { data: documentos } = useDocumentos({ estado: 'PUBLICADO' });
  const { data: estadisticas, isLoading: isLoadingStats } = useEstadisticasDocumentales();

  return (
    <div className="space-y-6">
      {/* Nota orientativa */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Esta vista muestra el seguimiento de distribución para administradores. Los colaboradores
          ven sus lecturas pendientes en <strong>Mi Portal</strong>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          bgColor="bg-indigo-100 dark:bg-indigo-900/30"
          label="Distribuidos"
          value={isLoadingStats ? '...' : (documentos?.length ?? 0)}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          bgColor="bg-purple-100 dark:bg-purple-900/30"
          label="Asignaciones"
          value={isLoadingStats ? '...' : (estadisticas?.lecturas_total ?? 0)}
        />
        <StatCard
          icon={<FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />}
          bgColor="bg-green-100 dark:bg-green-900/30"
          label="Completadas"
          value={isLoadingStats ? '...' : (estadisticas?.lecturas_completadas ?? 0)}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          bgColor="bg-orange-100 dark:bg-orange-900/30"
          label="Pendientes"
          value={isLoadingStats ? '...' : (estadisticas?.lecturas_pendientes ?? 0)}
        />
      </div>

      {/* Tabla documentos distribuidos */}
      {!documentos || documentos.length === 0 ? (
        <EmptyState
          icon={<Share2 className="w-12 h-12" />}
          title="Sin documentos distribuidos"
          description="Los documentos publicados aparecerán aquí con su estado de distribución."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <ResponsiveTable<Documento & Record<string, unknown>>
            data={documentos as (Documento & Record<string, unknown>)[]}
            columns={distribucionColumns}
            keyExtractor={(item) => item.id as number}
            mobileCardTitle={(item) => {
              const doc = item as unknown as Documento;
              return <span>{doc.titulo}</span>;
            }}
            mobileCardSubtitle={(item) => {
              const doc = item as unknown as Documento;
              return (
                <span className="text-xs">
                  {doc.codigo} — v{doc.version_actual}
                </span>
              );
            }}
            renderActions={(item) => {
              const doc = item as unknown as Documento;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => onViewDocumento(doc.id)}
                >
                  Ver
                </Button>
              );
            }}
            hoverable
          />
        </Card>
      )}
    </div>
  );
}

// ── Tab Archivados ────────────────────────────────────────────────────────

function RegistrosExternosTab({ onViewDocumento }: { onViewDocumento: (id: number) => void }) {
  const { data: archivados, isLoading } = useDocumentos({ estado: 'ARCHIVADO' });
  const registros = (archivados ?? []).filter((d) => d.modulo_origen);

  const MODULO_LABELS: Record<string, string> = {
    hseq: 'HSEQ',
    talento_humano: 'Talento Humano',
    pesv: 'PESV',
    bpm: 'BPM',
    auditoria: 'Auditoría',
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  if (registros.length === 0) {
    return (
      <EmptyState
        icon={<ExternalLink className="w-10 h-10" />}
        title="Sin registros externos"
        description="Cuando los módulos C2 (HSEQ, Talento Humano, PESV) generen registros, aparecerán aquí como evidencia archivada."
      />
    );
  }

  return (
    <div className="space-y-3">
      {registros.map((doc) => (
        <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900 dark:text-white truncate">{doc.titulo}</p>
                <Badge variant="secondary" size="sm">
                  {doc.codigo}
                </Badge>
                <Badge variant="info" size="sm">
                  {MODULO_LABELS[doc.modulo_origen || ''] || doc.modulo_origen}
                </Badge>
              </div>
              {doc.proceso_nombre && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Proceso: {doc.proceso_nombre}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => onViewDocumento(doc.id)}
            >
              Ver
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ArchivadosTab({ onViewDocumento }: { onViewDocumento: (id: number) => void }) {
  const { data: obsoletos, isLoading: loadingObsoletos } = useDocumentos({ estado: 'OBSOLETO' });
  const { data: archivados, isLoading: loadingArchivados } = useDocumentos({ estado: 'ARCHIVADO' });

  const todos = [...(obsoletos ?? []), ...(archivados ?? [])];
  const isLoading = loadingObsoletos || loadingArchivados;

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );

  if (todos.length === 0)
    return (
      <EmptyState
        icon={<Archive className="w-12 h-12" />}
        title="Sin documentos archivados"
        description="Los documentos obsoletos y archivados por retención aparecerán aquí."
      />
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {todos.map((doc) => (
        <Card key={doc.id} className="p-4 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{doc.codigo}</p>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {doc.titulo}
              </h4>
            </div>
            <Badge
              variant={doc.estado === 'ARCHIVADO' ? 'secondary' : 'danger'}
              size="sm"
              className="shrink-0"
            >
              {doc.estado === 'ARCHIVADO' ? 'Archivado' : 'Obsoleto'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {doc.tipo_documento_detail?.nombre ?? String(doc.tipo_documento)}
          </p>
          {doc.fecha_obsolescencia && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Obsoleto: {new Date(doc.fecha_obsolescencia).toLocaleDateString('es-CO')}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => onViewDocumento(doc.id)}
          >
            Ver
          </Button>
        </Card>
      ))}
    </div>
  );
}

// ── Utilitario ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  bgColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}
