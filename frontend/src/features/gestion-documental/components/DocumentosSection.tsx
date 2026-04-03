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
  Clock,
  CheckCircle,
  Calendar,
  PenTool,
  Upload,
  Files,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  Card,
  Button,
  EmptyState,
  Badge,
  Spinner,
  ConfirmDialog,
  ExportButton,
  ProtectedAction,
  ViewToggle,
} from '@/components/common';
import { Input } from '@/components/forms';
import { usePermissions, useIsSuperAdmin } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import { useDocumentos, useDeleteDocumento } from '../hooks/useGestionDocumental';
import { useDocumentoContentType } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';
import { AsignarFirmantesModal } from './AsignarFirmantesModal';
import IngestarExternoModal from './IngestarExternoModal';
import OcrStatusBadge from './OcrStatusBadge';
import ScoreBadge from './ScoreBadge';
import type { Documento } from '../types/gestion-documental.types';

const IngestarLoteModal = lazy(() => import('./IngestarLoteModal'));
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
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; titulo: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('gd_docs_view') as ViewMode) || 'cards'
  );
  const [asignarFirmantesModal, setAsignarFirmantesModal] = useState<{
    documentoId: string;
    titulo: string;
  } | null>(null);
  const [showIngestarModal, setShowIngestarModal] = useState(false);
  const [showIngestarLoteModal, setShowIngestarLoteModal] = useState(false);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('gd_docs_view', mode);
  };

  const filteredDocs = (documentos || []).filter((doc) =>
    searchTerm
      ? doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalDocumentos = documentos?.length ?? 0;
  const vigentes =
    documentos?.filter((d) => d.estado === 'PUBLICADO' || d.estado === 'VIGENTE').length ?? 0;
  const borradores = documentos?.filter((d) => d.estado === 'BORRADOR').length ?? 0;
  const enRevision = documentos?.filter((d) => d.estado === 'EN_REVISION').length ?? 0;

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
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

        {/* Cobertura documental */}
        <Suspense fallback={null}>
          <CoberturaPanel />
        </Suspense>

        {/* Header + Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar documentos por código o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <ViewToggle
            value={viewMode}
            onChange={handleViewChange}
            options={VIEW_OPTIONS}
            moduleColor="blue"
          />
          {!isSuperAdmin && (
            <>
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
                  variant="outline"
                  size="sm"
                  leftIcon={<Files className="w-4 h-4" />}
                  onClick={() => setShowIngestarLoteModal(true)}
                >
                  Ingesta Masiva
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
        {/* Document List */}
        {filteredDocs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16" />}
            title={searchTerm ? 'Sin resultados' : 'No hay documentos'}
            description={
              searchTerm
                ? `No se encontraron documentos para "${searchTerm}".`
                : 'Comienza creando tu primer documento usando una plantilla o desde cero.'
            }
            action={
              !searchTerm && canCreate && !isSuperAdmin
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
                    <div>
                      <Badge variant={estadoCfg.variant} size="sm">
                        {estadoCfg.label}
                      </Badge>
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

      {showIngestarLoteModal && (
        <Suspense fallback={null}>
          <IngestarLoteModal
            isOpen={showIngestarLoteModal}
            onClose={() => setShowIngestarLoteModal(false)}
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
  compact,
}: {
  documento: Documento;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (d: Documento) => void;
  onSolicitarFirmas: (d: Documento) => void;
  compact?: boolean;
}) {
  const iconBtn =
    'p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors';

  const canAssignFirmas = documento.estado === 'BORRADOR' || documento.estado === 'EN_REVISION';

  if (compact) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <button className={iconBtn} onClick={() => onView(documento.id)} title="Ver">
          <Eye className="w-4 h-4" />
        </button>
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
          <>
            <ProtectedAction permission="gestion_documental.repositorio.edit">
              <button className={iconBtn} onClick={() => onEdit(documento.id)} title="Editar">
                <Edit className="w-4 h-4" />
              </button>
            </ProtectedAction>
            <ProtectedAction permission="gestion_documental.repositorio.delete">
              <button
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                onClick={() => onDelete(documento)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </ProtectedAction>
          </>
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
        <>
          <ProtectedAction permission="gestion_documental.repositorio.edit">
            <button className={iconBtn} onClick={() => onEdit(documento.id)} title="Editar">
              <Edit className="w-4 h-4" />
            </button>
          </ProtectedAction>
          <ProtectedAction permission="gestion_documental.repositorio.delete">
            <button
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
              onClick={() => onDelete(documento)}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </ProtectedAction>
        </>
      )}
    </div>
  );
}

/** Alias para la nueva arquitectura de tabs — sección 'repositorio' */
export { DocumentosSection as RepositorioSection };
