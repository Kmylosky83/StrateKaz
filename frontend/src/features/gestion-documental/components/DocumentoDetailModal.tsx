/**
 * DocumentoDetailModal - Modal de detalle con tabs: Info, Contenido, Versiones, Evidencias.
 * Acciones contextuales según estado del documento.
 */
import { useState } from 'react';
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
  FileDown,
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
} from '../hooks/useGestionDocumental';

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
  const aprobarMutation = useAprobarDocumento();
  const publicarMutation = usePublicarDocumento();
  const enviarRevisionMutation = useEnviarRevision();
  const marcarObsoletoMutation = useMarcarObsoleto();
  const exportPdfMutation = useExportDocumentoPdf();
  const exportDocxMutation = useExportDocumentoDocx();

  const [activeTab, setActiveTab] = useState('info');
  const [confirmAction, setConfirmAction] = useState<
    'aprobar' | 'publicar' | 'enviar_revision' | 'marcar_obsoleto' | null
  >(null);
  const [motivoObsoleto, setMotivoObsoleto] = useState('');

  if (!documentoId) return null;

  const handleAction = async () => {
    if (!confirmAction || !documentoId) return;

    switch (confirmAction) {
      case 'enviar_revision':
        await enviarRevisionMutation.mutateAsync({ id: documentoId, revisores: [], mensaje: '' });
        break;
      case 'aprobar':
        await aprobarMutation.mutateAsync({ id: documentoId });
        break;
      case 'publicar':
        await publicarMutation.mutateAsync({ id: documentoId });
        break;
      case 'marcar_obsoleto':
        await marcarObsoletoMutation.mutateAsync({
          id: documentoId,
          motivo: motivoObsoleto,
        });
        setMotivoObsoleto('');
        break;
    }
    setConfirmAction(null);
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: <FileText className="w-4 h-4" /> },
    { id: 'contenido', label: 'Contenido', icon: <Eye className="w-4 h-4" /> },
    { id: 'versiones', label: 'Versiones', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'evidencias', label: 'Evidencias', icon: <Paperclip className="w-4 h-4" /> },
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
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => setConfirmAction('aprobar')}
                  >
                    Aprobar
                  </Button>
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
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Publicar Documento"
        message={`¿Publicar "${documento?.titulo}"? Se creará una versión snapshot y un registro de distribución.`}
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
    </>
  );
}

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
