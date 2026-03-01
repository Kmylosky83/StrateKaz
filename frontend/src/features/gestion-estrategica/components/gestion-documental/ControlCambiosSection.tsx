/**
 * ControlCambiosSection - Control de Versiones + Firmas Pendientes
 * Extracted from GestionDocumentalTab for maintainability.
 */
import { useState } from 'react';
import {
  GitBranch,
  PenTool,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { Card, Button, EmptyState, Badge, Spinner } from '@/components/common';

import {
  useDocumentos,
  useVersionesDocumento,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';
import { useMisFirmasPendientes } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';

interface ControlCambiosSectionProps {
  onViewDocumento: (id: number) => void;
  onFirmar?: (firmaId: number, rolDisplay?: string) => void;
  onRechazar?: (firmaId: number) => void;
}

export function ControlCambiosSection({
  onViewDocumento,
  onFirmar,
  onRechazar,
}: ControlCambiosSectionProps) {
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
                  <Button
                    key={doc.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDocumento(doc.id)}
                    className={`w-full !justify-start text-left !p-3 !min-h-0 rounded-lg transition-colors ${
                      selectedDocumento === doc.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex flex-col items-start w-full">
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
                    </div>
                  </Button>
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  if (!versiones || versiones.length === 0)
    return (
      <EmptyState
        icon={<GitBranch className="w-12 h-12" />}
        title="Sin historial de versiones"
        description="Este documento no tiene versiones registradas"
      />
    );

  return (
    <div className="space-y-4">
      {versiones.map((version, index) => (
        <Card key={version.id} className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${version.is_version_actual ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
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
