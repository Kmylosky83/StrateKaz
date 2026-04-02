/**
 * DocumentoDetailModal - Modal de detalle con tabs: Info, Contenido, Versiones, Evidencias.
 * Acciones contextuales según estado del documento.
 */
import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import DOMPurify from 'dompurify';
import {
  FileText,
  Clock,
  CheckCircle,
  Send,
  Archive,
  GitBranch,
  Eye,
  Download,
  Paperclip,
  Calendar,
  User,
  Shield,
  ShieldCheck,
  FileDown,
  BookOpen,
  Upload,
  Trash2,
  File,
  Undo2,
} from 'lucide-react';
import {
  Button,
  Badge,
  Spinner,
  Tabs,
  ConfirmDialog,
  EvidenceGallery,
  EvidenceUploader,
} from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Textarea } from '@/components/forms';
import {
  useDocumento,
  useAprobarDocumento,
  usePublicarDocumento,
  useEnviarRevision,
  useMarcarObsoleto,
  useVersionesDocumento,
  useExportDocumentoPdf,
  useExportDocumentoDocx,
  useEstadoFirmasDocumento,
  useDevolverBorrador,
  useSellarDocumento,
  useVerificarSellado,
  useSubirAnexo,
  useEliminarAnexo,
} from '../hooks/useGestionDocumental';
import type { AnexoMeta } from '../types/gestion-documental.types';
import TextoExtraidoPanel from './TextoExtraidoPanel';
import SelladoBadge from './SelladoBadge';

const AsignarLecturaModal = lazy(() => import('./AsignarLecturaModal'));

interface DocumentoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId: number | null;
}

const ESTADO_VARIANT: Record<
  string,
  'success' | 'warning' | 'info' | 'danger' | 'secondary' | 'primary'
> = {
  BORRADOR: 'secondary',
  EN_REVISION: 'warning',
  APROBADO: 'primary',
  PUBLICADO: 'success',
  OBSOLETO: 'danger',
  ARCHIVADO: 'info',
};

const CLASIFICACION_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  PUBLICO: 'success',
  INTERNO: 'info',
  CONFIDENCIAL: 'warning',
  RESTRINGIDO: 'danger',
};

export function DocumentoDetailModal({ isOpen, onClose, documentoId }: DocumentoDetailModalProps) {
  const { data: documento, isLoading } = useDocumento(documentoId!);
  const { data: versiones } = useVersionesDocumento(documentoId!);
  const { data: estadoFirmas } = useEstadoFirmasDocumento(documentoId);
  const aprobarMutation = useAprobarDocumento();
  const publicarMutation = usePublicarDocumento();
  const enviarRevisionMutation = useEnviarRevision();
  const devolverBorradorMutation = useDevolverBorrador();
  const marcarObsoletoMutation = useMarcarObsoleto();
  const exportPdfMutation = useExportDocumentoPdf();
  const exportDocxMutation = useExportDocumentoDocx();
  const sellarMutation = useSellarDocumento();
  const verificarSelladoMutation = useVerificarSellado();
  const subirAnexoMutation = useSubirAnexo();
  const eliminarAnexoMutation = useEliminarAnexo();
  const anexoInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteAnexo, setConfirmDeleteAnexo] = useState<AnexoMeta | null>(null);

  const [activeTab, setActiveTab] = useState('info');
  const [confirmAction, setConfirmAction] = useState<
    | 'aprobar'
    | 'publicar'
    | 'enviar_revision'
    | 'devolver_borrador'
    | 'marcar_obsoleto'
    | 'sellar_pdf'
    | null
  >(null);
  const [motivoObsoleto, setMotivoObsoleto] = useState('');
  const [lecturaObligatoria, setLecturaObligatoria] = useState(false);
  const [showAsignarLectura, setShowAsignarLectura] = useState(false);

  if (!documentoId) return null;

  const handleAction = async () => {
    if (!confirmAction || !documentoId) return;

    switch (confirmAction) {
      case 'enviar_revision':
        await enviarRevisionMutation.mutateAsync({ id: documentoId, revisores: [], mensaje: '' });
        break;
      case 'devolver_borrador':
        await devolverBorradorMutation.mutateAsync({ id: documentoId });
        break;
      case 'aprobar':
        await aprobarMutation.mutateAsync({ id: documentoId });
        break;
      case 'publicar':
        await publicarMutation.mutateAsync({
          id: documentoId,
          lectura_obligatoria: lecturaObligatoria,
        });
        setLecturaObligatoria(false);
        break;
      case 'marcar_obsoleto':
        await marcarObsoletoMutation.mutateAsync({
          id: documentoId,
          motivo: motivoObsoleto,
        });
        setMotivoObsoleto('');
        break;
      case 'sellar_pdf':
        await sellarMutation.mutateAsync(documentoId);
        break;
    }
    setConfirmAction(null);
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: <FileText className="w-4 h-4" /> },
    { id: 'contenido', label: 'Contenido', icon: <Eye className="w-4 h-4" /> },
    { id: 'versiones', label: 'Versiones', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'anexos', label: 'Anexos', icon: <Paperclip className="w-4 h-4" /> },
    { id: 'evidencias', label: 'Evidencias', icon: <File className="w-4 h-4" /> },
  ];

  return (
    <>
      <BaseModal isOpen={isOpen} onClose={onClose} title="Detalle del Documento" size="4xl">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !documento ? (
          <p className="text-gray-500 text-center py-8">Documento no encontrado</p>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {documento.titulo}
                  </h3>
                  <Badge variant="secondary">{documento.codigo}</Badge>
                  {documento.es_auto_generado && <Badge variant="info">Auto-generado BPM</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>v{documento.version_actual}</span>
                  <span>&middot;</span>
                  <Badge variant={ESTADO_VARIANT[documento.estado] || 'secondary'}>
                    {documento.estado}
                  </Badge>
                  <Badge
                    variant={CLASIFICACION_VARIANT[documento.clasificacion] || 'info'}
                    size="sm"
                  >
                    <Shield className="w-3 h-3 mr-1 inline" />
                    {documento.clasificacion}
                  </Badge>
                  <SelladoBadge
                    estado={documento.sellado_estado}
                    metadatos={documento.sellado_metadatos}
                  />
                </div>
              </div>

              {/* Contextual Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Export buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileDown className="w-4 h-4" />}
                  onClick={() =>
                    exportPdfMutation.mutate({
                      id: documentoId!,
                      codigo: documento.codigo,
                      version: documento.version_actual,
                    })
                  }
                  disabled={exportPdfMutation.isPending}
                >
                  {exportPdfMutation.isPending ? '...' : 'PDF'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileDown className="w-4 h-4" />}
                  onClick={() =>
                    exportDocxMutation.mutate({
                      id: documentoId!,
                      codigo: documento.codigo,
                      version: documento.version_actual,
                    })
                  }
                  disabled={exportDocxMutation.isPending}
                >
                  {exportDocxMutation.isPending ? '...' : 'DOCX'}
                </Button>
                {documento.estado === 'BORRADOR' && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Send className="w-4 h-4" />}
                    onClick={() => setConfirmAction('enviar_revision')}
                  >
                    Enviar a Revisión
                  </Button>
                )}
                {documento.estado === 'EN_REVISION' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Undo2 className="w-4 h-4" />}
                      onClick={() => setConfirmAction('devolver_borrador')}
                    >
                      Devolver a Borrador
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => setConfirmAction('aprobar')}
                    >
                      Aprobar
                    </Button>
                  </>
                )}
                {documento.estado === 'APROBADO' && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => setConfirmAction('publicar')}
                  >
                    Publicar
                  </Button>
                )}
                {documento.estado === 'PUBLICADO' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Archive className="w-4 h-4" />}
                    onClick={() => setConfirmAction('marcar_obsoleto')}
                  >
                    Marcar Obsoleto
                  </Button>
                )}
                {documento.estado === 'PUBLICADO' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<BookOpen className="w-4 h-4" />}
                    onClick={() => setShowAsignarLectura(true)}
                  >
                    Asignar Lectura
                  </Button>
                )}
                {documento.estado === 'PUBLICADO' &&
                  (!documento.sellado_estado ||
                    documento.sellado_estado === 'NO_APLICA' ||
                    documento.sellado_estado === 'ERROR') && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ShieldCheck className="w-4 h-4" />}
                      onClick={() => setConfirmAction('sellar_pdf')}
                      disabled={sellarMutation.isPending}
                    >
                      {sellarMutation.isPending ? '...' : 'Sellar PDF'}
                    </Button>
                  )}
                {documento.sellado_estado === 'COMPLETADO' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ShieldCheck className="w-4 h-4" />}
                      onClick={() => verificarSelladoMutation.mutate(documentoId!)}
                      disabled={verificarSelladoMutation.isPending}
                    >
                      {verificarSelladoMutation.isPending ? '...' : 'Verificar'}
                    </Button>
                    {documento.pdf_sellado && (
                      <a
                        href={documento.pdf_sellado}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4" />
                        Sellado
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Tab Content */}
            <div className="max-h-[50vh] overflow-y-auto">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  {documento.resumen && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Resumen
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {documento.resumen}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Creado"
                      value={
                        documento.fecha_creacion
                          ? new Date(documento.fecha_creacion).toLocaleDateString('es-CO')
                          : '-'
                      }
                    />
                    <InfoItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Vigencia"
                      value={
                        documento.fecha_vigencia
                          ? new Date(documento.fecha_vigencia).toLocaleDateString('es-CO')
                          : '-'
                      }
                    />
                    <InfoItem
                      icon={<Clock className="w-4 h-4" />}
                      label="Revisión Programada"
                      value={
                        documento.fecha_revision_programada
                          ? new Date(documento.fecha_revision_programada).toLocaleDateString(
                              'es-CO'
                            )
                          : '-'
                      }
                    />
                    <InfoItem
                      icon={<User className="w-4 h-4" />}
                      label="Elaborado por"
                      value={documento.elaborado_por_nombre || '-'}
                    />
                    <InfoItem
                      icon={<User className="w-4 h-4" />}
                      label="Revisado por"
                      value={documento.revisado_por_nombre || '-'}
                    />
                    <InfoItem
                      icon={<User className="w-4 h-4" />}
                      label="Aprobado por"
                      value={documento.aprobado_por_nombre || '-'}
                    />
                  </div>

                  {documento.palabras_clave?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Palabras Clave
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {documento.palabras_clave.map((kw: string) => (
                          <Badge key={kw} variant="secondary" size="sm">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estado de Firmas Digitales */}
                  {estadoFirmas && estadoFirmas.total > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Firmas Digitales
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <p className="text-lg font-semibold">{estadoFirmas.total}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <p className="text-lg font-semibold text-green-600">
                            {estadoFirmas.firmadas}
                          </p>
                          <p className="text-xs text-gray-500">Firmadas</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <p className="text-lg font-semibold text-yellow-600">
                            {estadoFirmas.pendientes}
                          </p>
                          <p className="text-xs text-gray-500">Pendientes</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <p className="text-lg font-semibold text-red-600">
                            {estadoFirmas.rechazadas}
                          </p>
                          <p className="text-xs text-gray-500">Rechazadas</p>
                        </div>
                      </div>
                      {!estadoFirmas.puede_publicar && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          Todas las firmas deben completarse antes de aprobar/publicar
                        </p>
                      )}
                    </div>
                  )}

                  {documento.archivo_pdf && (
                    <div>
                      <a
                        href={documento.archivo_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'contenido' && (
                <div className="prose dark:prose-invert max-w-none p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        documento.contenido || '<p><em>Sin contenido</em></p>'
                      ),
                    }}
                  />
                </div>
              )}

              {activeTab === 'versiones' && (
                <div className="space-y-3">
                  {!versiones || (versiones as unknown[]).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Sin versiones registradas
                    </p>
                  ) : (
                    (
                      versiones as {
                        id: number;
                        numero_version: string;
                        tipo_cambio: string;
                        descripcion_cambios: string;
                        fecha_version: string;
                        is_version_actual: boolean;
                        creado_por_nombre?: string;
                      }[]
                    ).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${v.is_version_actual ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}
                        >
                          <GitBranch
                            className={`w-4 h-4 ${v.is_version_actual ? 'text-blue-600' : 'text-gray-500'}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">v{v.numero_version}</span>
                            {v.is_version_actual && (
                              <Badge variant="primary" size="sm">
                                Actual
                              </Badge>
                            )}
                            <Badge variant="secondary" size="sm">
                              {v.tipo_cambio}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">{v.descripcion_cambios}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(v.fecha_version).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'anexos' && (
                <AnexosTab
                  documentoId={documentoId!}
                  anexos={(documento.archivos_anexos as unknown as AnexoMeta[]) || []}
                  onUpload={(file) => subirAnexoMutation.mutate({ id: documentoId!, file })}
                  onDelete={(anexo) => setConfirmDeleteAnexo(anexo)}
                  isUploading={subirAnexoMutation.isPending}
                  inputRef={anexoInputRef}
                />
              )}

              {activeTab === 'evidencias' && (
                <div className="space-y-4">
                  <EvidenceGallery
                    entityType="gestion_documental.documento"
                    entityId={documentoId}
                    layout="list"
                    showActions
                  />
                  <EvidenceUploader
                    entityType="gestion_documental.documento"
                    entityId={documentoId}
                    categoria="DOCUMENTAL"
                  />
                </div>
              )}
            </div>
            {/* Panel de texto extraído (OCR) */}
            {documento && documento.ocr_estado !== 'NO_APLICA' && (
              <TextoExtraidoPanel
                documentoId={documento.id}
                ocrEstado={documento.ocr_estado}
                ocrMetadatos={documento.ocr_metadatos}
                textoExtraido={documento.texto_extraido}
              />
            )}
          </div>
        )}
      </BaseModal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmAction === 'enviar_revision'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Enviar a Revisión"
        message={`¿Enviar "${documento?.titulo}" a revisión?`}
        confirmText="Enviar"
        isLoading={enviarRevisionMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'devolver_borrador'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Devolver a Borrador"
        message={`¿Devolver "${documento?.titulo}" a borrador? Podrá asignar firmantes y volver a enviarlo.`}
        confirmText="Devolver"
        isLoading={devolverBorradorMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'aprobar'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Aprobar Documento"
        message={`¿Aprobar "${documento?.titulo}"?`}
        confirmText="Aprobar"
        isLoading={aprobarMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'publicar'}
        onClose={() => {
          setConfirmAction(null);
          setLecturaObligatoria(false);
        }}
        onConfirm={handleAction}
        title="Publicar Documento"
        message={
          <div className="space-y-3">
            <p>
              ¿Publicar &quot;{documento?.titulo}&quot;? Se creará una versión snapshot y un
              registro de distribución.
            </p>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lecturaObligatoria}
                onChange={(e) => setLecturaObligatoria(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Distribución obligatoria</strong> — Notificar a todos los colaboradores
                activos para lectura y aceptación del documento.
              </span>
            </label>
          </div>
        }
        confirmText="Publicar"
        isLoading={publicarMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'marcar_obsoleto'}
        onClose={() => {
          setConfirmAction(null);
          setMotivoObsoleto('');
        }}
        onConfirm={handleAction}
        title="Marcar como Obsoleto"
        message={
          <div className="space-y-3">
            <p>¿Marcar &quot;{documento?.titulo}&quot; como obsoleto?</p>
            <Textarea
              value={motivoObsoleto}
              onChange={(e) => setMotivoObsoleto(e.target.value)}
              placeholder="Motivo de obsolescencia..."
              rows={3}
            />
          </div>
        }
        confirmText="Marcar Obsoleto"
        variant="danger"
        isLoading={marcarObsoletoMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'sellar_pdf'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Sellar PDF con Firma Digital"
        message={`¿Sellar "${documento?.titulo}" con firma digital X.509? El PDF sellado será inmutable y verificable.`}
        confirmText="Sellar PDF"
        isLoading={sellarMutation.isPending}
      />

      {/* Confirmar eliminación de anexo */}
      <ConfirmDialog
        isOpen={!!confirmDeleteAnexo}
        onClose={() => setConfirmDeleteAnexo(null)}
        onConfirm={() => {
          if (confirmDeleteAnexo && documentoId) {
            eliminarAnexoMutation.mutate(
              { id: documentoId, anexoId: confirmDeleteAnexo.id },
              { onSuccess: () => setConfirmDeleteAnexo(null) }
            );
          }
        }}
        title="Eliminar Anexo"
        message={`¿Eliminar el anexo "${confirmDeleteAnexo?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarAnexoMutation.isPending}
      />

      {/* Asignar Lectura Verificada */}
      {documento && showAsignarLectura && (
        <Suspense fallback={null}>
          <AsignarLecturaModal
            isOpen={showAsignarLectura}
            onClose={() => setShowAsignarLectura(false)}
            documentoId={documento.id}
            documentoTitulo={documento.titulo}
            documentoCodigo={documento.codigo}
          />
        </Suspense>
      )}
    </>
  );
}

// ==================== Anexos Tab ====================

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.zip',
  '.rar',
  '.7z',
  '.csv',
  '.txt',
];
const MAX_ANEXO_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AnexosTab({
  documentoId,
  anexos,
  onUpload,
  onDelete,
  isUploading,
  inputRef,
}: {
  documentoId: number;
  anexos: AnexoMeta[];
  onUpload: (file: File) => void;
  onDelete: (anexo: AnexoMeta) => void;
  isUploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return;
      }
      if (file.size > MAX_ANEXO_SIZE) {
        return;
      }
      onUpload(file);
      e.target.value = '';
    },
    [onUpload]
  );

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {anexos.length} anexo{anexos.length !== 1 ? 's' : ''} adjunto
          {anexos.length !== 1 ? 's' : ''}
        </p>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Subiendo...' : 'Subir Anexo'}
          </Button>
        </div>
      </div>

      {/* Anexo list */}
      {anexos.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No hay anexos adjuntos a este documento
        </div>
      ) : (
        <div className="space-y-2">
          {anexos.map((anexo) => (
            <div
              key={anexo.id}
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {anexo.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(anexo.tamaño)} &middot;{' '}
                  {new Date(anexo.fecha_subida).toLocaleDateString('es-CO')}
                  {anexo.subido_por_nombre && ` &middot; ${anexo.subido_por_nombre}`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {anexo.url && (
                  <a
                    href={anexo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(anexo)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Formatos permitidos: PDF, Word, Excel, imágenes, ZIP. Máximo 20 MB por archivo.
      </p>
    </div>
  );
}

// ==================== Info Item ====================

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
