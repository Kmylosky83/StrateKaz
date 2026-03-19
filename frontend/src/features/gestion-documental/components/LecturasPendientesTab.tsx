/**
 * LecturasPendientesTab — Tab para Mi Portal.
 * Muestra documentos pendientes de lectura verificada del usuario.
 */
import { useState } from 'react';
import { BookOpen, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge, Card, Spinner } from '@/components/common';
import { useMisPendientes } from '../hooks/useAceptacionDocumental';
import DocumentoReaderModal from './DocumentoReaderModal';
import type { AceptacionDocumental } from '../types/gestion-documental.types';
import { ACEPTACION_ESTADO_COLORS } from '../types/gestion-documental.types';

export default function LecturasPendientesTab() {
  const { data: pendientes, isLoading, refetch } = useMisPendientes();
  const [selectedAceptacion, setSelectedAceptacion] = useState<AceptacionDocumental | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pendientes || pendientes.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Sin lecturas pendientes
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          No tiene documentos pendientes de lectura verificada.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {pendientes.map((aceptacion) => (
          <Card
            key={aceptacion.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedAceptacion(aceptacion)}
          >
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {aceptacion.documento_titulo}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{aceptacion.documento_codigo}</span>
                    <span>&middot;</span>
                    <span>v{aceptacion.version_documento}</span>
                    {aceptacion.fecha_limite && (
                      <>
                        <span>&middot;</span>
                        <span
                          className={`flex items-center gap-1 ${
                            aceptacion.dias_restantes != null && aceptacion.dias_restantes < 3
                              ? 'text-red-500 font-medium'
                              : ''
                          }`}
                        >
                          {aceptacion.dias_restantes != null && aceptacion.dias_restantes < 0 ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {aceptacion.dias_restantes != null && aceptacion.dias_restantes < 0
                            ? 'Vencido'
                            : `${aceptacion.dias_restantes} días`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Barra de progreso mini */}
                <div className="w-20">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-500">{aceptacion.porcentaje_lectura}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        aceptacion.porcentaje_lectura >= 90
                          ? 'bg-green-500'
                          : aceptacion.porcentaje_lectura > 0
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                      }`}
                      style={{ width: `${aceptacion.porcentaje_lectura}%` }}
                    />
                  </div>
                </div>

                <Badge
                  variant={
                    ACEPTACION_ESTADO_COLORS[aceptacion.estado] as
                      | 'gray'
                      | 'info'
                      | 'success'
                      | 'danger'
                      | 'warning'
                  }
                >
                  {aceptacion.estado === 'EN_PROGRESO' && (
                    <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                  )}
                  {aceptacion.estado === 'PENDIENTE' ? 'Leer' : 'Continuar'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DocumentoReaderModal
        isOpen={!!selectedAceptacion}
        onClose={() => setSelectedAceptacion(null)}
        aceptacion={selectedAceptacion}
        onCompleted={() => refetch()}
      />
    </>
  );
}
