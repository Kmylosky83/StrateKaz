/**
 * DocumentosSection - Constructor y Listado Maestro de Documentos
 * Extracted from GestionDocumentalTab for maintainability.
 */
import { useState, lazy, Suspense } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Calendar,
  PenTool,
  Upload,
  LayoutGrid,
  List,
  GitPullRequest,
  Wand2,
  AlertTriangle,
  SlidersHorizontal,
  X,
  FileCheck,
  Send,
} from 'lucide-react';
import {
  Card,
  Button,
  EmptyState,
  Badge,
  ConfirmDialog,
  ExportButton,
  ProtectedAction,
  ViewToggle,
} from '@/components/common';
import { StatsGrid, StatsGridSkeleton, TableSkeleton } from '@/components/layout';
import { Input, Select } from '@/components/forms';
import { usePermissions, useIsSuperAdmin } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import {
  useDocumentos,
  useDeleteDocumento,
  useTiposDocumento,
} from '../hooks/useGestionDocumental';
import { PublicarModal } from './PublicarModal';
import { useAreas } from '@/features/gestion-estrategica/hooks/useAreas';
import { useDocumentoContentType } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';
import { AsignarFirmantesModal } from './AsignarFirmantesModal';
import IngestarExternoModal from './IngestarExternoModal';
import AdoptarPdfModal from './AdoptarPdfModal';
import OcrStatusBadge from './OcrStatusBadge';
import ScoreBadge from './ScoreBadge';
import type { Documento } from '../types/gestion-documental.types';

const DigitalizarModal = lazy(() => import('./DigitalizarModal'));

const CoberturaPanel = lazy(() => import('./CoberturaPanel'));

type ViewMode = 'cards' | 'list';

const VIEW_OPTIONS = [
  { value: 'cards' as const, label: 'Tarjetas', icon: LayoutGrid },
  { value: 'list' as const, label: 'Lista', icon: List },
];

const ESTADO_CONFIG: Record<
  string,
  { variant: 'success' | 'warning' | 'secondary' | 'info' | 'danger'; label: string }
> = {
  PUBLICADO: { variant: 'success', label: 'Publicado' },
  APROBADO: { variant: 'info', label: 'Aprobado' },
  EN_REVISION: { variant: 'warning', label: 'En Revisión' },
  BORRADOR: { variant: 'secondary', label: 'Borrador' },
  OBSOLETO: { variant: 'danger', label: 'Obsoleto' },
};

/** Formatea fecha segura — evita "Invalid Date" */
function formatFecha(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO');
}

/** Calcula días restantes para revisión programada. Retorna null si no aplica. */
function diasParaRevision(doc: {
  estado: string;
  fecha_revision_programada?: string | null;
}): number | null {
  if (doc.estado !== 'PUBLICADO' || !doc.fecha_revision_programada) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(doc.fecha_revision_programada);
  if (isNaN(fecha.getTime())) return null;
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 86400));
}

interface DocumentosSectionProps {
  onCreateDocumento: () => void;
  onEditDocumento: (id: number) => void;
  onViewDocumento: (id: number) => void;
}

export function DocumentosSection({
  onCreateDocumento,
  onEditDocumento,
  onViewDocumento,
}: DocumentosSectionProps) {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_DOCUMENTAL, Sections.REPOSITORIO, 'create');
  const isSuperAdmin = useIsSuperAdmin();

  const { data: documentos, isLoading } = useDocumentos();
  const deleteDocumentoMutation = useDeleteDocumento();
  const { data: contentTypeData } = useDocumentoContentType();
  const { data: tipos = [] } = useTiposDocumento({ is_active: true });
  const { data: procesosData } = useAreas({ is_active: true });
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; titulo: string } | null>(null);
  const [publicarModal, setPublicarModal] = useState<{
    id: number;
    titulo: string;
    codigo: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterProceso, setFilterProceso] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('gd_docs_view') as ViewMode) || 'cards'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [asignarFirmantesModal, setAsignarFirmantesModal] = useState<{
    documentoId: string;
    titulo: string;
  } | null>(null);
  const [showIngestarModal, setShowIngestarModal] = useState(false);
  const [showAdoptarModal, setShowAdoptarModal] = useState(false);
  const [digitalizarDocumento, setDigitalizarDocumento] = useState<Documento | null>(null);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('gd_docs_view', mode);
  };

  const filteredDocs = (documentos || []).filter((doc) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!doc.titulo.toLowerCase().includes(term) && !doc.codigo.toLowerCase().includes(term))
        return false;
    }
    if (filterTipo && doc.tipo_documento !== Number(filterTipo)) return false;
    if (filterProceso && String(doc.proceso) !== filterProceso) return false;
    return true;
  });

  const totalDocumentos = documentos?.length ?? 0;
  const vigentes =
    documentos?.filter((d) => d.estado === 'PUBLICADO' || d.estado === 'VIGENTE').length ?? 0;
  const borradores = documentos?.filter((d) => d.estado === 'BORRADOR').length ?? 0;
  const enRevision = documentos?.filter((d) => d.estado === 'EN_REVISION').length ?? 0;

  const statsItems = [
    { label: 'Total', value: totalDocumentos, icon: FileText, iconColor: 'info' as const },
    { label: 'Vigentes', value: vigentes, icon: CheckCircle, iconColor: 'success' as const },
    { label: 'Borradores', value: borradores, icon: Edit, iconColor: 'warning' as const },
    {
      label: 'En Revisión',
      value: enRevision,
      icon: GitPullRequest,
      iconColor: 'warning' as const,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        {isLoading ? (
          <StatsGridSkeleton count={4} />
        ) : (
          <StatsGrid stats={statsItems} columns={4} moduleColor="indigo" variant="compact" />
        )}

        {/* Cobertura documental */}
        <Suspense fallback={null}>
          <CoberturaPanel />
        </Suspense>

        {/* Buscador prominente + botón filtros */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por código o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <Button
            variant={showFilters || filterTipo || filterProceso ? 'primary' : 'outline'}
            size="sm"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filtros
            {(filterTipo || filterProceso) && (
              <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-xs">
                {[filterTipo, filterProceso].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Filtros avanzados colapsables */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <Select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {(tipos as { id: number; codigo: string; nombre: string }[]).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} - {t.nombre}
                </option>
              ))}
            </Select>
            <Select value={filterProceso} onChange={(e) => setFilterProceso(e.target.value)}>
              <option value="">Todos los procesos</option>
              {(procesosData?.results || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Chips de filtros activos */}
        {(filterTipo || filterProceso) && (
          <div className="flex flex-wrap gap-2">
            {filterTipo &&
              (() => {
                const t = (tipos as { id: number; codigo: string; nombre: string }[]).find(
                  (x) => String(x.id) === filterTipo
                );
                return t ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Tipo: {t.codigo}
                    <button onClick={() => setFilterTipo('')} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })()}
            {filterProceso &&
              (() => {
                const p = (procesosData?.results || []).find((x) => String(x.id) === filterProceso);
                return p ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                    Proceso: {p.code}
                    <button onClick={() => setFilterProceso('')} className="hover:text-teal-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })()}
            <button
              onClick={() => {
                setFilterTipo('');
                setFilterProceso('');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1" />
          <ViewToggle
            value={viewMode}
            onChange={handleViewChange}
            options={VIEW_OPTIONS}
            moduleColor="blue"
          />
          {/* Acciones de creación: superadmin puede crear; empleados con permiso también */}
          {(isSuperAdmin || canCreate) && (
            <>
              <ProtectedAction permission="gestion_documental.repositorio.create">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileCheck className="w-4 h-4" />}
                  onClick={() => setShowAdoptarModal(true)}
                >
                  Adoptar PDF
                </Button>
              </ProtectedAction>
              <ProtectedAction permission="gestion_documental.repositorio.create">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={() => setShowIngestarModal(true)}
                >
                  Ingestar PDF
                </Button>
              </ProtectedAction>
              <ProtectedAction permission="gestion_documental.repositorio.create">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={onCreateDocumento}
                >
                  Crear Documento
                </Button>
              </ProtectedAction>
            </>
          )}
          <ExportButton
            endpoint="/api/gestion-estrategica/gestion-documental/documentos/export/"
            filename="documentos"
          />
        </div>

        {/* Document List */}
        {isLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16" />}
            title={searchTerm ? 'Sin resultados' : 'No hay documentos'}
            description={
              searchTerm
                ? `No se encontraron documentos para "${searchTerm}".`
                : 'Comienza creando tu primer documento usando una plantilla o desde cero.'
            }
            action={
              !searchTerm && canCreate
                ? {
                    label: 'Crear Documento',
                    onClick: onCreateDocumento,
                    icon: <Plus className="w-4 h-4" />,
                  }
                : undefined
            }
          />
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDocs.map((documento) => {
              const estadoCfg = ESTADO_CONFIG[documento.estado] || ESTADO_CONFIG.BORRADOR;
              return (
                <Card key={documento.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {documento.titulo}
                        </h4>
                        <Badge variant="secondary" size="sm">
                          {documento.codigo}
                        </Badge>
                      </div>
                      {documento.resumen && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {documento.resumen}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatFecha(documento.fecha_creacion)}
                    </span>
                    <span>v{documento.version_actual}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={estadoCfg.variant}>{estadoCfg.label}</Badge>
                      {documento.score_cumplimiento != null && documento.score_cumplimiento > 0 && (
                        <ScoreBadge score={documento.score_cumplimiento} />
                      )}
                      {documento.es_externo && (
                        <OcrStatusBadge
                          estado={documento.ocr_estado}
                          metadatos={documento.ocr_metadatos}
                        />
                      )}
                      {(() => {
                        const dias = diasParaRevision(documento);
                        if (dias === null) return null;
                        if (dias < 0)
                          return (
                            <Badge variant="danger" size="sm">
                              <AlertTriangle className="w-3 h-3 mr-1 inline" />
                              Vencido
                            </Badge>
                          );
                        if (dias <= 30)
                          return (
                            <Badge variant="warning" size="sm">
                              <AlertTriangle className="w-3 h-3 mr-1 inline" />
                              Vence en {dias}d
                            </Badge>
                          );
                        return null;
                      })()}
                    </div>
                    <DocumentActions
                      documento={documento}
                      onView={onViewDocumento}
                      onEdit={onEditDocumento}
                      onDelete={(d) => setConfirmDelete({ id: d.id, titulo: d.titulo })}
                      onSolicitarFirmas={(d) =>
                        setAsignarFirmantesModal({
                          documentoId: String(d.id),
                          titulo: d.titulo,
                        })
                      }
                      onDigitalizar={(d) => setDigitalizarDocumento(d)}
                      onPublicar={(d) =>
                        setPublicarModal({ id: d.id, titulo: d.titulo, codigo: d.codigo })
                      }
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header row */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_110px_100px_60px_180px] gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <div>Documento</div>
              <div>Estado</div>
              <div>Fecha</div>
              <div>Ver.</div>
              <div className="text-right">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredDocs.map((documento) => {
                const estadoCfg = ESTADO_CONFIG[documento.estado] || ESTADO_CONFIG.BORRADOR;
                return (
                  <div
                    key={documento.id}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_110px_100px_60px_180px] gap-3 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Title + code */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {documento.titulo}
                        </p>
                        <Badge variant="secondary" size="sm" className="shrink-0">
                          {documento.codigo}
                        </Badge>
                      </div>
                      {documento.resumen && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {documento.resumen}
                        </p>
                      )}
                    </div>

                    {/* Estado */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant={estadoCfg.variant} size="sm">
                        {estadoCfg.label}
                      </Badge>
                      {(() => {
                        const dias = diasParaRevision(documento);
                        if (dias === null) return null;
                        if (dias < 0)
                          return (
                            <Badge variant="danger" size="sm">
                              Vencido
                            </Badge>
                          );
                        if (dias <= 30)
                          return (
                            <Badge variant="warning" size="sm">
                              {dias}d
                            </Badge>
                          );
                        return null;
                      })()}
                    </div>

                    {/* Fecha */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFecha(documento.fecha_creacion)}
                    </div>

                    {/* Version */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      v{documento.version_actual}
                    </div>

                    {/* Actions */}
                    <DocumentActions
                      documento={documento}
                      onView={onViewDocumento}
                      onEdit={onEditDocumento}
                      onDelete={(d) => setConfirmDelete({ id: d.id, titulo: d.titulo })}
                      onSolicitarFirmas={(d) =>
                        setAsignarFirmantesModal({
                          documentoId: String(d.id),
                          titulo: d.titulo,
                        })
                      }
                      onDigitalizar={(d) => setDigitalizarDocumento(d)}
                      onPublicar={(d) =>
                        setPublicarModal({ id: d.id, titulo: d.titulo, codigo: d.codigo })
                      }
                      compact
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete)
            deleteDocumentoMutation.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(null),
            });
        }}
        title="Eliminar Documento"
        message={`¿Eliminar "${confirmDelete?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteDocumentoMutation.isPending}
      />

      <PublicarModal
        isOpen={!!publicarModal}
        onClose={() => setPublicarModal(null)}
        documentoId={publicarModal?.id ?? 0}
        documentoTitulo={publicarModal?.titulo ?? ''}
        documentoCodigo={publicarModal?.codigo}
      />

      {contentTypeData && (
        <AsignarFirmantesModal
          isOpen={!!asignarFirmantesModal}
          onClose={() => setAsignarFirmantesModal(null)}
          contentTypeId={contentTypeData.content_type_id}
          documentoId={asignarFirmantesModal?.documentoId ?? ''}
          documentoTitulo={asignarFirmantesModal?.titulo ?? ''}
        />
      )}

      <IngestarExternoModal
        isOpen={showIngestarModal}
        onClose={() => setShowIngestarModal(false)}
      />

      <AdoptarPdfModal isOpen={showAdoptarModal} onClose={() => setShowAdoptarModal(false)} />

      {digitalizarDocumento && (
        <Suspense fallback={null}>
          <DigitalizarModal
            isOpen={!!digitalizarDocumento}
            documento={digitalizarDocumento}
            onClose={() => setDigitalizarDocumento(null)}
          />
        </Suspense>
      )}
    </>
  );
}

// ─── Document Actions (shared between card and list) ─────────────
function DocumentActions({
  documento,
  onView,
  onEdit,
  onDelete,
  onSolicitarFirmas,
  onDigitalizar,
  onPublicar,
  compact,
}: {
  documento: Documento;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (d: Documento) => void;
  onSolicitarFirmas: (d: Documento) => void;
  onDigitalizar: (d: Documento) => void;
  onPublicar?: (d: Documento) => void;
  compact?: boolean;
}) {
  const iconBtn =
    'p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors';

  const canAssignFirmas = documento.estado === 'BORRADOR' && !documento.es_externo;
  const canDigitalizar = documento.estado === 'BORRADOR' && documento.es_externo;
  const canPublicar = documento.estado === 'APROBADO';

  if (compact) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <button className={iconBtn} onClick={() => onView(documento.id)} title="Ver">
          <Eye className="w-4 h-4" />
        </button>
        {canPublicar && onPublicar && (
          <ProtectedAction permission="gestion_documental.repositorio.edit">
            <button
              className="p-1.5 rounded-md text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 dark:text-green-400 transition-colors"
              onClick={() => onPublicar(documento)}
              title="Publicar"
            >
              <Send className="w-4 h-4" />
            </button>
          </ProtectedAction>
        )}
        {documento.estado === 'BORRADOR' && !canDigitalizar && (
          <ProtectedAction permission="gestion_documental.repositorio.edit">
            <button className={iconBtn} onClick={() => onEdit(documento.id)} title="Editar">
              <Edit className="w-4 h-4" />
            </button>
          </ProtectedAction>
        )}
        {canDigitalizar && (
          <ProtectedAction permission="gestion_documental.repositorio.edit">
            <button
              className="p-1.5 rounded-md text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 dark:text-violet-400 transition-colors"
              onClick={() => onDigitalizar(documento)}
              title="Digitalizar"
            >
              <Wand2 className="w-4 h-4" />
            </button>
          </ProtectedAction>
        )}
        {canAssignFirmas && (
          <ProtectedAction permission="gestion_documental.repositorio.edit">
            <button
              className="p-1.5 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:text-primary-400 transition-colors"
              onClick={() => onSolicitarFirmas(documento)}
              title="Solicitar Firmas"
            >
              <PenTool className="w-4 h-4" />
            </button>
          </ProtectedAction>
        )}
        {documento.estado === 'BORRADOR' && (
          <ProtectedAction permission="gestion_documental.repositorio.delete">
            <button
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
              onClick={() => onDelete(documento)}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </ProtectedAction>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Eye className="w-4 h-4" />}
        onClick={() => onView(documento.id)}
      >
        Ver
      </Button>
      {canPublicar && onPublicar && (
        <ProtectedAction permission="gestion_documental.repositorio.edit">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={() => onPublicar(documento)}
            className="bg-green-600 hover:bg-green-700 border-green-600"
          >
            Publicar
          </Button>
        </ProtectedAction>
      )}
      {documento.estado === 'BORRADOR' && !canDigitalizar && (
        <ProtectedAction permission="gestion_documental.repositorio.edit">
          <button className={iconBtn} onClick={() => onEdit(documento.id)} title="Editar">
            <Edit className="w-4 h-4" />
          </button>
        </ProtectedAction>
      )}
      {canDigitalizar && (
        <ProtectedAction permission="gestion_documental.repositorio.edit">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Wand2 className="w-4 h-4" />}
            onClick={() => onDigitalizar(documento)}
            className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-700 dark:hover:bg-violet-900/20"
          >
            Digitalizar
          </Button>
        </ProtectedAction>
      )}
      {canAssignFirmas && (
        <ProtectedAction permission="gestion_documental.repositorio.edit">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PenTool className="w-4 h-4" />}
            onClick={() => onSolicitarFirmas(documento)}
          >
            Solicitar Firmas
          </Button>
        </ProtectedAction>
      )}
      {documento.estado === 'BORRADOR' && (
        <ProtectedAction permission="gestion_documental.repositorio.delete">
          <button
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            onClick={() => onDelete(documento)}
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </ProtectedAction>
      )}
    </div>
  );
}

/** Alias para la nueva arquitectura de tabs — sección 'repositorio' */
export { DocumentosSection as RepositorioSection };
