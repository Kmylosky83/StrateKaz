/**
 * DistribucionSection - Distribución y Control Documental
 * Extracted from GestionDocumentalTab for maintainability.
 */
import { Share2, Eye, Users, AlertCircle, FileCheck } from 'lucide-react';
import { Card, Button, EmptyState, Badge } from '@/components/common';

import {
  useDocumentos,
  useEstadisticasDocumentales,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';

interface DistribucionSectionProps {
  onViewDocumento: (id: number) => void;
}

export function DistribucionSection({ onViewDocumento }: DistribucionSectionProps) {
  const { data: documentos } = useDocumentos({ estado: 'PUBLICADO' });
  const { data: estadisticas, isLoading: isLoadingStats } = useEstadisticasDocumentales();

  const totalDistribuidos = documentos?.length || 0;
  const totalConfirmados = estadisticas?.distribucion?.confirmadas || 0;
  const totalPendientes = estadisticas?.distribucion?.pendientes || 0;
  const totalRegistros = estadisticas?.distribucion?.total || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Distribution Table */}
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
                        {doc.areas_aplicacion?.slice(0, 2).map((area: string, idx: number) => (
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
