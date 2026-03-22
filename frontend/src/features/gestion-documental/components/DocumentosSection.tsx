/**
 * DocumentosSection - Constructor y Listado Maestro de Documentos
 * Extracted from GestionDocumentalTab for maintainability.
 */
import { useState } from 'react';
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
} from '@/components/common';
import { Input } from '@/components/forms';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import {
  useDocumentos,
  useListadoMaestro,
  useDeleteDocumento,
} from '../hooks/useGestionDocumental';
import { useDocumentoContentType } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';
import { AsignarFirmantesModal } from './AsignarFirmantesModal';
import IngestarExternoModal from './IngestarExternoModal';
import OcrStatusBadge from './OcrStatusBadge';
import ScoreBadge from './ScoreBadge';

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
  const canCreate = canDo(Modules.GESTION_DOCUMENTAL, Sections.DOCUMENTOS, 'create');

  const { data: documentos, isLoading } = useDocumentos();
  const { data: listadoMaestro } = useListadoMaestro();
  const deleteDocumentoMutation = useDeleteDocumento();
  const { data: contentTypeData } = useDocumentoContentType();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; titulo: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [asignarFirmantesModal, setAsignarFirmantesModal] = useState<{
    documentoId: string;
    titulo: string;
  } | null>(null);
  const [showIngestarModal, setShowIngestarModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const listadoItems = listadoMaestro ? Object.values(listadoMaestro) : [];
  const totalDocumentos = listadoItems.reduce((acc, tipo) => acc + tipo.documentos.length, 0);
  const vigentes = listadoItems.reduce(
    (acc, tipo) => acc + tipo.documentos.filter((d) => d.estado === 'PUBLICADO').length,
    0
  );
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
          <ProtectedAction permission="gestion_documental.documentos.create">
            <Button
              variant="outline"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setShowIngestarModal(true)}
            >
              Ingestar PDF
            </Button>
          </ProtectedAction>
          <ProtectedAction permission="gestion_documental.documentos.create">
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onCreateDocumento}
            >
              Crear Documento
            </Button>
          </ProtectedAction>
          <ExportButton
            endpoint="/api/gestion-estrategica/gestion-documental/documentos/export/"
            filename="documentos"
          />
        </div>

        {/* Document List */}
        {!documentos || documentos.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16" />}
            title="No hay documentos"
            description="Comienza creando tu primer documento usando una plantilla o desde cero."
            action={
              canCreate
                ? {
                    label: 'Crear Documento',
                    onClick: onCreateDocumento,
                    icon: <Plus className="w-4 h-4" />,
                  }
                : undefined
            }
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
                    <div className="flex items-center gap-2">
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
                          <ProtectedAction permission="gestion_documental.documentos.edit">
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<PenTool className="w-4 h-4" />}
                              onClick={() =>
                                setAsignarFirmantesModal({
                                  documentoId: String(documento.id),
                                  titulo: documento.titulo,
                                })
                              }
                            >
                              Solicitar Firmas
                            </Button>
                          </ProtectedAction>
                          <ProtectedAction permission="gestion_documental.documentos.edit">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Edit className="w-4 h-4" />}
                              onClick={() => onEditDocumento(documento.id)}
                            >
                              Editar
                            </Button>
                          </ProtectedAction>
                          <ProtectedAction permission="gestion_documental.documentos.delete">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 className="w-4 h-4" />}
                              onClick={() =>
                                setConfirmDelete({ id: documento.id, titulo: documento.titulo })
                              }
                            />
                          </ProtectedAction>
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
    </>
  );
}
