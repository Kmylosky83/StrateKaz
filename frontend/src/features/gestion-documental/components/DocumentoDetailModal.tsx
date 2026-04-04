/**
 * DocumentoDetailModal - Modal de detalle SOLO LECTURA.
 * Tabs: Info, Contenido, Versiones, Anexos, Evidencias.
 * Las acciones de workflow (aprobar, publicar, sellar, etc.) viven en EnProcesoSection.
 */
import { useState, useRef, useCallback, Fragment } from 'react';
import DOMPurify from 'dompurify';
import {
  FileText,
  Clock,
  GitBranch,
  Eye,
  Download,
  Paperclip,
  Calendar,
  User,
  Shield,
  Upload,
  Trash2,
  File,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
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
import {
  useDocumento,
  useVersionesDocumento,
  useEstadoFirmasDocumento,
  useSubirAnexo,
  useEliminarAnexo,
} from '../hooks/useGestionDocumental';
import type { AnexoMeta } from '../types/gestion-documental.types';
import TextoExtraidoPanel from './TextoExtraidoPanel';
import SelladoBadge from './SelladoBadge';
import OcrStatusBadge from './OcrStatusBadge';

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
  const subirAnexoMutation = useSubirAnexo();
  const eliminarAnexoMutation = useEliminarAnexo();
  const anexoInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteAnexo, setConfirmDeleteAnexo] = useState<AnexoMeta | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  if (!documentoId) return null;

  const isBorrador = documento?.estado === 'BORRADOR';
  const isPostPublicado =
    documento?.estado === 'PUBLICADO' ||
    documento?.estado === 'OBSOLETO' ||
    documento?.estado === 'ARCHIVADO';

  const tabs = [
    { id: 'info', label: 'Información', icon: <FileText className="w-4 h-4" /> },
    { id: 'contenido', label: 'Contenido', icon: <Eye className="w-4 h-4" /> },
    ...(!isBorrador
      ? [
          { id: 'versiones', label: 'Versiones', icon: <GitBranch className="w-4 h-4" /> },
          { id: 'anexos', label: 'Anexos', icon: <Paperclip className="w-4 h-4" /> },
          { id: 'evidencias', label: 'Evidencias', icon: <File className="w-4 h-4" /> },
        ]
      : []),
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
            {/* Header profesional */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {documento.titulo}
              </h3>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {documento.codigo}
                </span>
                <MetaSep />
                <span className="text-gray-500 dark:text-gray-400">
                  v{documento.version_actual}
                </span>
                <MetaSep />
                <Badge variant={ESTADO_VARIANT[documento.estado] || 'secondary'} size="sm">
                  {documento.estado}
                </Badge>
                <MetaSep />
                <Badge variant={CLASIFICACION_VARIANT[documento.clasificacion] || 'info'} size="sm">
                  <Shield className="w-3 h-3 mr-1 inline" />
                  {documento.clasificacion}
                </Badge>
                {documento.tipo_documento_detail && (
                  <>
                    <MetaSep />
                    <span className="text-gray-500 dark:text-gray-400">
                      {(documento.tipo_documento_detail as { codigo: string }).codigo}
                    </span>
                  </>
                )}
                {(documento.areas_aplicacion as string[])?.length > 0 && (
                  <>
                    <MetaSep />
                    <span className="text-gray-500 dark:text-gray-400">
                      {(documento.areas_aplicacion as string[])[0]}
                    </span>
                  </>
                )}
                {documento.es_externo && documento.ocr_estado !== 'NO_APLICA' && (
                  <>
                    <MetaSep />
                    <OcrStatusBadge
                      estado={documento.ocr_estado}
                      metadatos={documento.ocr_metadatos}
                    />
                  </>
                )}
                {isPostPublicado && (
                  <>
                    <MetaSep />
                    <SelladoBadge
                      estado={documento.sellado_estado}
                      metadatos={documento.sellado_metadatos}
                    />
                  </>
                )}
                {documento.es_auto_generado && (
                  <>
                    <MetaSep />
                    <Badge variant="info" size="sm">
                      BPM
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Stepper de flujo documental */}
            <WorkflowStepper estado={documento.estado} />

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

                  {/* PDF Original Ingestado */}
                  {documento.es_externo && documento.archivo_original && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          PDF Original Ingestado
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Documento fuente — no modificable
                        </p>
                      </div>
                      <a
                        href={documento.archivo_original}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 dark:border-blue-700 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Ver PDF
                      </a>
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
                </div>
              )}

              {activeTab === 'contenido' &&
                (() => {
                  const pdfUrl = documento.archivo_pdf || documento.archivo_original;
                  const tieneContenido = documento.contenido?.replace(/<[^>]*>/g, '').trim();
                  return (
                    <div className="space-y-4">
                      {/* Visor PDF embebido (original ingestado o generado) */}
                      {pdfUrl && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                          <iframe
                            src={pdfUrl}
                            title={`PDF: ${documento.titulo}`}
                            className="w-full border-0"
                            style={{ height: '60vh' }}
                          />
                        </div>
                      )}
                      {/* Contenido HTML editado */}
                      {tieneContenido && (
                        <>
                          {pdfUrl && (
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Contenido digitalizado
                            </h4>
                          )}
                          <div className="prose dark:prose-invert max-w-none p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(documento.contenido || ''),
                              }}
                            />
                          </div>
                        </>
                      )}
                      {/* Sin PDF ni contenido */}
                      {!pdfUrl && !tieneContenido && (
                        <div className="text-center py-8 text-sm text-gray-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          Sin contenido — edite el documento para agregar contenido
                        </div>
                      )}
                    </div>
                  );
                })()}

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
            {/* Panel de texto extraído (OCR) — visible para docs ingestados en cualquier estado */}
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
    </>
  );
}

// ==================== Header Separator ====================

function MetaSep() {
  return <span className="text-gray-300 dark:text-gray-600">&middot;</span>;
}

// ==================== Info Item ====================

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
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
  documentoId: _documentoId,
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

// ==================== Workflow Stepper ====================

const WORKFLOW_STEPS = [
  { key: 'BORRADOR', label: 'Borrador' },
  { key: 'EN_REVISION', label: 'En Revisión' },
  { key: 'APROBADO', label: 'Aprobado' },
  { key: 'PUBLICADO', label: 'Publicado' },
];

const WORKFLOW_ORDER: Record<string, number> = {
  BORRADOR: 0,
  EN_REVISION: 1,
  APROBADO: 2,
  PUBLICADO: 3,
  OBSOLETO: 4,
  ARCHIVADO: 4,
};

function WorkflowStepper({ estado }: { estado: string }) {
  const currentOrder = WORKFLOW_ORDER[estado] ?? 0;
  const isTerminal = estado === 'OBSOLETO' || estado === 'ARCHIVADO';

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 py-1">
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full font-medium',
            estado === 'OBSOLETO' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            estado === 'ARCHIVADO' &&
              'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          )}
        >
          {estado === 'OBSOLETO' ? 'Obsoleto — fuera de vigencia' : 'Archivado'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 text-xs py-1 flex-wrap">
      {WORKFLOW_STEPS.map((step, i) => {
        const stepOrder = i;
        const isDone = stepOrder < currentOrder;
        const isCurrent = stepOrder === currentOrder;

        return (
          <Fragment key={step.key}>
            {i > 0 && (
              <ChevronRight
                className={cn(
                  'w-3.5 h-3.5 flex-shrink-0',
                  isDone || isCurrent ? 'text-blue-400' : 'text-gray-300 dark:text-gray-600'
                )}
              />
            )}
            <span
              className={cn(
                'px-2 py-0.5 rounded-full whitespace-nowrap',
                isDone && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                isCurrent &&
                  'bg-blue-600 text-white dark:bg-blue-500 font-medium ring-2 ring-blue-200 dark:ring-blue-800',
                !isDone && !isCurrent && 'text-gray-400 dark:text-gray-500'
              )}
            >
              {step.label}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
