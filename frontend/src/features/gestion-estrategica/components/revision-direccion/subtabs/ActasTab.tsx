/**
 * Tab de Actas de Revision por la Direccion
 * Listado y gestion de actas generadas
 */
import { useState } from 'react';
import {
  FileText,
  CheckCircle,
  Plus,
  Calendar,
  Edit3,
  ThumbsUp,
  Lock,
  Download,
  PenTool,
  Mail,
} from 'lucide-react';
import { Card, Button, Badge, ConfirmDialog } from '@/components/common';
import { DataTableCard } from '@/components/layout/DataTableCard';
import {
  useActasRevision,
  useAprobarActa,
  useCerrarActa,
} from '../../../hooks/useRevisionDireccion';
import { actasApi } from '../../../api/revisionDireccionApi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ActaRevision } from '../../../types/revision-direccion.types';
import { GeneradorActaModal } from '../GeneradorActaModal';
import { FirmaActaModal } from '../FirmaActaModal';
import { EnviarInformeModal } from '../EnviarInformeModal';

export const ActasTab = () => {
  const [showGeneradorModal, setShowGeneradorModal] = useState(false);
  const [selectedActa, setSelectedActa] = useState<ActaRevision | null>(null);
  const [aprobarId, setAprobarId] = useState<number | null>(null);
  const [cerrarId, setCerrarId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [firmaActa, setFirmaActa] = useState<ActaRevision | null>(null);
  const [enviarActa, setEnviarActa] = useState<ActaRevision | null>(null);

  const { data: actasData, isLoading } = useActasRevision({});
  const aprobarMutation = useAprobarActa();
  const cerrarMutation = useCerrarActa();

  const actas = actasData?.results || [];
  const actasAprobadas = actas.filter(
    (a) => a.estado === 'APROBADA' || a.estado === 'CERRADA'
  ).length;
  const actasBorrador = actas.filter((a) => a.estado === 'BORRADOR').length;

  const handleNew = () => {
    setSelectedActa(null);
    setShowGeneradorModal(true);
  };

  const handleEdit = (acta: ActaRevision) => {
    setSelectedActa(acta);
    setShowGeneradorModal(true);
  };

  const handleCloseModal = () => {
    setShowGeneradorModal(false);
    setSelectedActa(null);
  };

  const handleDownloadPDF = async (acta: ActaRevision) => {
    if (downloadingId) return;
    setDownloadingId(acta.id);
    try {
      const blob = await actasApi.generarPDF(acta.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Acta-${acta.numero_acta}-Revision-Direccion.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // toast is handled by axios interceptor
    } finally {
      setDownloadingId(null);
    }
  };

  const getEstadoBadge = (estado: string, display?: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      BORRADOR: 'gray',
      EN_REVISION: 'warning',
      APROBADA: 'success',
      CERRADA: 'primary',
    };
    return <Badge variant={variants[estado] || 'gray'}>{display || estado}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Actas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Actas
              </span>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{actas.length}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Actas Aprobadas
              </span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{actasAprobadas}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                En Borrador
              </span>
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-600">{actasBorrador}</p>
          </div>
        </Card>
      </div>

      {/* Tabla de Actas */}
      <DataTableCard
        title="Todas las Actas"
        headerActions={
          <Button size="sm" className="flex items-center gap-2" onClick={handleNew}>
            <Plus className="h-4 w-4" />
            Nueva Acta
          </Button>
        }
        isEmpty={actas.length === 0}
        isLoading={isLoading}
        emptyMessage="No hay actas generadas"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Numero Acta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Programacion
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha Revision
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Detalles
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {actas.map((acta) => (
                <tr
                  key={acta.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {acta.numero_acta}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {acta.programacion_codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(acta.fecha_revision), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-gray-100">
                        {acta.participantes_count ?? acta.participantes?.length ?? 0} participantes
                      </p>
                      <p className="text-xs text-gray-500">
                        {acta.compromisos_count ?? acta.compromisos?.length ?? 0}{' '}
                        {(acta.compromisos_count ?? acta.compromisos?.length ?? 0) === 1
                          ? 'compromiso'
                          : 'compromisos'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getEstadoBadge(acta.estado, acta.estado_display)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(acta)}>
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        Ver
                      </Button>

                      {/* Aprobar: solo BORRADOR o EN_REVISION */}
                      {(acta.estado === 'BORRADOR' || acta.estado === 'EN_REVISION') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAprobarId(acta.id)}
                          className="text-green-600 hover:text-green-700"
                          title="Aprobar Acta"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Cerrar: solo APROBADA */}
                      {acta.estado === 'APROBADA' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCerrarId(acta.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Cerrar Acta"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Exportar PDF: APROBADA o CERRADA */}
                      {(acta.estado === 'APROBADA' || acta.estado === 'CERRADA') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Descargar PDF"
                          className="text-gray-600 hover:text-blue-600"
                          onClick={() => handleDownloadPDF(acta)}
                          disabled={downloadingId === acta.id}
                        >
                          <Download
                            className={`h-3.5 w-3.5 ${downloadingId === acta.id ? 'animate-pulse' : ''}`}
                          />
                        </Button>
                      )}

                      {/* Firmar Acta: APROBADA */}
                      {acta.estado === 'APROBADA' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFirmaActa(acta)}
                          className="text-purple-600 hover:text-purple-700"
                          title="Firma Digital"
                        >
                          <PenTool className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Enviar por correo: APROBADA o CERRADA */}
                      {(acta.estado === 'APROBADA' || acta.estado === 'CERRADA') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEnviarActa(acta)}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="Enviar por correo"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>

      {/* Modal Generador de Acta */}
      {showGeneradorModal && (
        <GeneradorActaModal
          acta={selectedActa}
          isOpen={showGeneradorModal}
          onClose={handleCloseModal}
        />
      )}

      {/* Confirm Aprobar */}
      {aprobarId && (
        <ConfirmDialog
          isOpen={!!aprobarId}
          onClose={() => setAprobarId(null)}
          onConfirm={() => {
            aprobarMutation.mutate({ id: aprobarId }, { onSuccess: () => setAprobarId(null) });
          }}
          title="Aprobar Acta"
          message="Esta seguro de aprobar esta acta de revision por la direccion? Una vez aprobada se podra exportar a PDF."
          confirmLabel="Si, Aprobar"
          variant="primary"
          isLoading={aprobarMutation.isPending}
        />
      )}

      {/* Confirm Cerrar */}
      {cerrarId && (
        <ConfirmDialog
          isOpen={!!cerrarId}
          onClose={() => setCerrarId(null)}
          onConfirm={() => {
            cerrarMutation.mutate(
              { id: cerrarId, data: {} },
              { onSuccess: () => setCerrarId(null) }
            );
          }}
          title="Cerrar Acta"
          message="Esta seguro de cerrar esta acta? Una vez cerrada no se podra modificar."
          confirmLabel="Si, Cerrar"
          variant="danger"
          isLoading={cerrarMutation.isPending}
        />
      )}

      {/* Modal Firma Digital */}
      {firmaActa && (
        <FirmaActaModal isOpen={!!firmaActa} onClose={() => setFirmaActa(null)} acta={firmaActa} />
      )}

      {/* Modal Enviar por Correo */}
      {enviarActa && (
        <EnviarInformeModal
          isOpen={!!enviarActa}
          onClose={() => setEnviarActa(null)}
          actaId={enviarActa.id}
          actaNumero={enviarActa.numero_acta}
        />
      )}
    </div>
  );
};
