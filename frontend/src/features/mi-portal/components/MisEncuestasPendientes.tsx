/**
 * MisEncuestasPendientes — Tab de Mi Portal
 *
 * Lista las encuestas activas donde el colaborador es participante.
 * Muestra el progreso de respuesta, estado y tipo de encuesta.
 * Abre ResponderEncuestaModal al hacer clic en una encuesta pendiente.
 *
 * Vista 2A: Lista de cards siguiendo el patrón de LecturasPendientesTab.
 */

import { useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { useMisEncuestas } from '../../gestion-estrategica/hooks/useEncuestas';
import { ResponderEncuestaModal } from './ResponderEncuestaModal';
import type { MiEncuestaPendiente } from '../../gestion-estrategica/types/encuestas.types';

// =============================================================================
// HELPERS
// =============================================================================

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDiasRestantes(fechaCierre: string): number {
  const ahora = new Date();
  const cierre = new Date(fechaCierre);
  return Math.ceil((cierre.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
}

function getPorcentaje(respondidas: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((respondidas / total) * 100));
}

// =============================================================================
// SUBCOMPONENTE: CARD DE ENCUESTA
// =============================================================================

interface CardEncuestaProps {
  encuesta: MiEncuestaPendiente;
  onClick: (encuesta: MiEncuestaPendiente) => void;
}

function CardEncuesta({ encuesta, onClick }: CardEncuestaProps) {
  const total = encuesta.total_temas || 0;
  const respondidas = encuesta.total_mis_respuestas;
  const porcentaje = getPorcentaje(respondidas, total);
  const diasRestantes = getDiasRestantes(encuesta.fecha_cierre);
  const urgente = diasRestantes >= 0 && diasRestantes <= 3;

  const yaCompleto = encuesta.ya_respondio;
  const enProgreso = respondidas > 0 && !yaCompleto;

  return (
    <button type="button" onClick={() => onClick(encuesta)} className="w-full text-left group">
      <Card
        padding="none"
        className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group-focus:ring-2 group-focus:ring-brand-500 group-focus:ring-offset-2"
      >
        {/* Barra de color según estado */}
        <div
          className={`h-1 ${
            yaCompleto
              ? 'bg-green-500'
              : enProgreso
                ? 'bg-blue-500'
                : urgente
                  ? 'bg-red-500'
                  : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Ícono de estado */}
            <div
              className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                yaCompleto
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : enProgreso
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {yaCompleto ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : enProgreso ? (
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {encuesta.titulo}
                </p>
                <Badge variant={encuesta.tipo_encuesta === 'pci_poam' ? 'info' : 'gray'} size="sm">
                  {encuesta.tipo_encuesta === 'pci_poam' ? 'PCI-POAM' : 'DOFA'}
                </Badge>
              </div>

              {encuesta.descripcion && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                  {encuesta.descripcion}
                </p>
              )}

              {/* Barra de progreso */}
              {total > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {respondidas} de {total} preguntas respondidas
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {porcentaje}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        yaCompleto ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Metadatos */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Cierre: {formatFecha(encuesta.fecha_cierre)}
                </span>
                {urgente && !yaCompleto && (
                  <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    {diasRestantes === 0
                      ? 'Cierra hoy'
                      : `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`}
                  </span>
                )}
                <Badge variant={yaCompleto ? 'success' : enProgreso ? 'info' : 'warning'} size="sm">
                  {yaCompleto ? 'Completada' : enProgreso ? 'En progreso' : 'Pendiente'}
                </Badge>
              </div>
            </div>

            {/* Flecha de acción */}
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 shrink-0 mt-2.5 transition-colors" />
          </div>
        </div>
      </Card>
    </button>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function EncuestasSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} padding="none" className="overflow-hidden">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function MisEncuestasPendientes() {
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState<MiEncuestaPendiente | null>(
    null
  );

  const { data: encuestas, isLoading, error, refetch } = useMisEncuestas();

  const handleAbrir = (encuesta: MiEncuestaPendiente) => {
    setEncuestaSeleccionada(encuesta);
  };

  const handleCerrar = () => {
    setEncuestaSeleccionada(null);
    refetch();
  };

  const handleCompletado = () => {
    refetch();
  };

  if (isLoading) return <EncuestasSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar encuestas"
        description="No se pudieron cargar las encuestas. Intenta de nuevo."
        action={{ label: 'Reintentar', onClick: () => refetch() }}
      />
    );
  }

  const lista = encuestas || [];
  const pendientes = lista.filter((e) => !e.ya_respondio);
  const completadas = lista.filter((e) => e.ya_respondio);

  if (lista.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Sin encuestas pendientes"
        description="No tienes encuestas activas asignadas en este momento. Cuando el equipo de gestión activa una encuesta y te incluye como participante, aparecerá aquí."
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Encuestas pendientes */}
        {pendientes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Pendientes ({pendientes.length})
            </h3>
            {pendientes.map((encuesta) => (
              <CardEncuesta key={encuesta.id} encuesta={encuesta} onClick={handleAbrir} />
            ))}
          </div>
        )}

        {/* Encuestas completadas */}
        {completadas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Completadas ({completadas.length})
            </h3>
            {completadas.map((encuesta) => (
              <CardEncuesta key={encuesta.id} encuesta={encuesta} onClick={handleAbrir} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de respuesta */}
      <ResponderEncuestaModal
        encuesta={encuestaSeleccionada}
        isOpen={!!encuestaSeleccionada}
        onClose={handleCerrar}
        onCompletado={handleCompletado}
      />
    </>
  );
}
