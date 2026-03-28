/**
 * EntrevistasTab - Gestion de Entrevistas (Sincronas + Asincronicas)
 * Seleccion y Contratacion > Entrevistas
 *
 * Dos sub-vistas:
 * 1. Sincronas - Entrevistas presenciales/virtuales/telefonicas programadas
 * 2. Asincronicas - Entrevistas por email con link publico
 *
 * Usa design system: Card, Badge, Button, SectionHeader, StatsGrid, EmptyState, Spinner
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { cn } from '@/utils/cn';
import {
  MessageSquare,
  Plus,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Mail,
  Video,
  Phone,
  Users as UsersIcon,
  Calendar,
  Star,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import {
  useEntrevistas,
  useEntrevistasAsync,
  useCancelarEntrevista,
  useReenviarEmailEntrevistaAsync,
  useCancelarEntrevistaAsync,
} from '../../hooks/useSeleccionContratacion';
import type {
  Entrevista,
  EntrevistaAsincronicaList,
  EstadoEntrevista,
  EstadoEntrevistaAsync,
} from '../../types';
import {
  ESTADO_ENTREVISTA_OPTIONS,
  ESTADO_ENTREVISTA_BADGE,
  TIPO_ENTREVISTA_BADGE,
  RECOMENDACION_BADGE,
  ESTADO_ENTREVISTA_ASYNC_OPTIONS,
  ESTADO_ENTREVISTA_ASYNC_BADGE,
} from '../../types';
import { EntrevistaFormModal } from './EntrevistaFormModal';
import { RealizarEntrevistaModal } from './RealizarEntrevistaModal';
import { EntrevistaAsyncFormModal } from './EntrevistaAsyncFormModal';
import { EvaluarEntrevistaAsyncModal } from './EvaluarEntrevistaAsyncModal';

// ============================================================================
// Sub-vista toggle
// ============================================================================

type SubView = 'sincronas' | 'asincronicas';

// ============================================================================
// Helpers
// ============================================================================

const TIPO_ICON: Record<string, React.ReactNode> = {
  telefonica: <Phone size={14} />,
  presencial: <UsersIcon size={14} />,
  virtual: <Video size={14} />,
  grupal: <UsersIcon size={14} />,
  panel: <UsersIcon size={14} />,
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Componente
// ============================================================================

export const EntrevistasTab = () => {
  const [subView, setSubView] = useState<SubView>('sincronas');
  const [estadoFilter, setEstadoFilter] = useState<EstadoEntrevista | ''>('');
  const [estadoAsyncFilter, setEstadoAsyncFilter] = useState<EstadoEntrevistaAsync | ''>('');

  // Sincrona modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRealizarOpen, setIsRealizarOpen] = useState(false);
  const [selectedEntrevista, setSelectedEntrevista] = useState<Entrevista | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Entrevista | null>(null);

  // Async modal state
  const [isAsyncFormOpen, setIsAsyncFormOpen] = useState(false);
  const [isEvaluarAsyncOpen, setIsEvaluarAsyncOpen] = useState(false);
  const [selectedAsync, setSelectedAsync] = useState<EntrevistaAsincronicaList | null>(null);
  const [cancelAsyncTarget, setCancelAsyncTarget] = useState<EntrevistaAsincronicaList | null>(
    null
  );

  // Module color
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  // Queries
  const { data: entrevistasData, isLoading: isLoadingSync } = useEntrevistas({
    estado: estadoFilter || undefined,
  });
  const { data: asyncData, isLoading: isLoadingAsync } = useEntrevistasAsync({
    estado: estadoAsyncFilter || undefined,
  });

  // Mutations
  const cancelarSync = useCancelarEntrevista();
  const reenviarEmailAsync = useReenviarEmailEntrevistaAsync();
  const cancelarAsync = useCancelarEntrevistaAsync();

  // Data
  const entrevistas = useMemo(() => entrevistasData?.results || [], [entrevistasData]);
  const entrevistasAsync = useMemo(() => asyncData?.results || [], [asyncData]);

  // Stats
  const stats: StatItem[] = useMemo(() => {
    const syncProgramadas = entrevistas.filter((e) => e.estado === 'programada').length;
    const syncRealizadas = entrevistas.filter((e) => e.estado === 'realizada').length;
    const asyncPendientes = entrevistasAsync.filter((e) =>
      ['pendiente', 'enviada', 'en_progreso'].includes(e.estado)
    ).length;
    const asyncCompletadas = entrevistasAsync.filter((e) =>
      ['completada', 'evaluada'].includes(e.estado)
    ).length;

    return [
      {
        label: 'Programadas',
        value: syncProgramadas,
        icon: Calendar,
        iconColor: 'info' as const,
      },
      {
        label: 'Realizadas',
        value: syncRealizadas,
        icon: CheckCircle,
        iconColor: 'success' as const,
      },
      {
        label: 'Async Pendientes',
        value: asyncPendientes,
        icon: Mail,
        iconColor: 'warning' as const,
      },
      {
        label: 'Async Completadas',
        value: asyncCompletadas,
        icon: Star,
        iconColor: 'primary' as const,
      },
    ];
  }, [entrevistas, entrevistasAsync]);

  // Handlers
  const handleRealizarEntrevista = (entrevista: Entrevista) => {
    setSelectedEntrevista(entrevista);
    setIsRealizarOpen(true);
  };

  const handleCancelSync = () => {
    if (!cancelTarget) return;
    cancelarSync.mutate(
      { id: cancelTarget.id, estado: 'cancelada', motivo: 'Cancelada por el reclutador' },
      { onSuccess: () => setCancelTarget(null) }
    );
  };

  const handleCancelAsync = () => {
    if (!cancelAsyncTarget) return;
    cancelarAsync.mutate(cancelAsyncTarget.id, {
      onSuccess: () => setCancelAsyncTarget(null),
    });
  };

  const handleEvaluarAsync = (entrevista: EntrevistaAsincronicaList) => {
    setSelectedAsync(entrevista);
    setIsEvaluarAsyncOpen(true);
  };

  const getPublicUrl = (token: string) => {
    const base = window.location.origin;
    return `${base}/entrevistas/responder/${token}`;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <StatsGrid stats={stats} columns={4} moduleColor={moduleColor} />

      {/* Sub-view toggle */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSubView('sincronas')}
          className={cn(
            '!px-4 !py-2 text-sm font-medium rounded-lg transition-all',
            subView === 'sincronas'
              ? `${colorClasses.badge} ${colorClasses.text}`
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          <span className="flex items-center gap-2">
            <Video size={16} />
            Presenciales / Virtuales
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSubView('asincronicas')}
          className={cn(
            '!px-4 !py-2 text-sm font-medium rounded-lg transition-all',
            subView === 'asincronicas'
              ? `${colorClasses.badge} ${colorClasses.text}`
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          <span className="flex items-center gap-2">
            <Mail size={16} />
            Asincronicas por Email
          </span>
        </Button>
      </div>

      {/* Content */}
      {subView === 'sincronas' ? (
        <SyncEntrevistasView
          entrevistas={entrevistas}
          isLoading={isLoadingSync}
          estadoFilter={estadoFilter}
          onEstadoFilterChange={setEstadoFilter}
          onCreateNew={() => setIsFormOpen(true)}
          onRealizar={handleRealizarEntrevista}
          onCancel={setCancelTarget}
          colorClasses={colorClasses}
        />
      ) : (
        <AsyncEntrevistasView
          entrevistas={entrevistasAsync}
          isLoading={isLoadingAsync}
          estadoFilter={estadoAsyncFilter}
          onEstadoFilterChange={setEstadoAsyncFilter}
          onCreateNew={() => setIsAsyncFormOpen(true)}
          onEvaluar={handleEvaluarAsync}
          onReenviarEmail={(id) => reenviarEmailAsync.mutate(id)}
          onCancel={setCancelAsyncTarget}
          getPublicUrl={getPublicUrl}
          colorClasses={colorClasses}
        />
      )}

      {/* Modals - Sincronas */}
      {isFormOpen && (
        <EntrevistaFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      )}

      {isRealizarOpen && selectedEntrevista && (
        <RealizarEntrevistaModal
          isOpen={isRealizarOpen}
          onClose={() => {
            setIsRealizarOpen(false);
            setSelectedEntrevista(null);
          }}
          entrevista={selectedEntrevista}
        />
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelSync}
        title="Cancelar entrevista"
        message={`Cancelar la entrevista #${cancelTarget?.numero_entrevista} de ${cancelTarget?.candidato_nombre}?`}
        confirmText="Cancelar entrevista"
        variant="danger"
        isLoading={cancelarSync.isPending}
      />

      {/* Modals - Asincronicas */}
      {isAsyncFormOpen && (
        <EntrevistaAsyncFormModal
          isOpen={isAsyncFormOpen}
          onClose={() => setIsAsyncFormOpen(false)}
        />
      )}

      {isEvaluarAsyncOpen && selectedAsync && (
        <EvaluarEntrevistaAsyncModal
          isOpen={isEvaluarAsyncOpen}
          onClose={() => {
            setIsEvaluarAsyncOpen(false);
            setSelectedAsync(null);
          }}
          entrevistaId={selectedAsync.id}
        />
      )}

      <ConfirmDialog
        isOpen={!!cancelAsyncTarget}
        onClose={() => setCancelAsyncTarget(null)}
        onConfirm={handleCancelAsync}
        title="Cancelar entrevista asincronica"
        message={`Cancelar "${cancelAsyncTarget?.titulo}" de ${cancelAsyncTarget?.candidato_nombre}?`}
        confirmText="Cancelar entrevista"
        variant="danger"
        isLoading={cancelarAsync.isPending}
      />
    </div>
  );
};

// ============================================================================
// Sub-componente: Entrevistas Sincronas
// ============================================================================

interface SyncEntrevistasViewProps {
  entrevistas: Entrevista[];
  isLoading: boolean;
  estadoFilter: EstadoEntrevista | '';
  onEstadoFilterChange: (estado: EstadoEntrevista | '') => void;
  onCreateNew: () => void;
  onRealizar: (entrevista: Entrevista) => void;
  onCancel: (entrevista: Entrevista) => void;
  colorClasses: ReturnType<typeof getModuleColorClasses>;
}

const SyncEntrevistasView = ({
  entrevistas,
  isLoading,
  estadoFilter,
  onEstadoFilterChange,
  onCreateNew,
  onRealizar,
  onCancel,
  colorClasses,
}: SyncEntrevistasViewProps) => {
  return (
    <>
      <SectionHeader
        title="Entrevistas Programadas"
        description="Entrevistas presenciales, virtuales y telefonicas"
        actions={
          <Button onClick={onCreateNew} size="sm">
            <Plus size={16} className="mr-1" />
            Programar Entrevista
          </Button>
        }
      >
        <div className="flex items-center gap-3">
          <Select
            value={estadoFilter}
            onChange={(e) => onEstadoFilterChange(e.target.value as EstadoEntrevista | '')}
            className="w-44"
          >
            <option value="">Todos los estados</option>
            {ESTADO_ENTREVISTA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </SectionHeader>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : entrevistas.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={
                <div className={cn('p-3 rounded-xl', colorClasses.badge)}>
                  <MessageSquare size={24} className={colorClasses.icon} />
                </div>
              }
              title="Sin entrevistas"
              description="No hay entrevistas programadas. Crea una nueva para empezar."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Candidato
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Calificacion
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Recomendacion
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entrevistas.map((entrevista) => (
                  <tr
                    key={entrevista.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">#{entrevista.numero_entrevista}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {entrevista.candidato_nombre}
                      </div>
                      <div className="text-xs text-gray-500">{entrevista.vacante_codigo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={TIPO_ENTREVISTA_BADGE[entrevista.tipo_entrevista]}>
                        <span className="flex items-center gap-1">
                          {TIPO_ICON[entrevista.tipo_entrevista]}
                          {entrevista.tipo_display}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 dark:text-white">
                        {formatDateTime(entrevista.fecha_programada)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entrevista.duracion_estimada_minutos} min
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_ENTREVISTA_BADGE[entrevista.estado]}>
                        {entrevista.estado_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {entrevista.calificacion_promedio != null ? (
                        <div className="flex items-center gap-1">
                          <BarChart3 size={14} className="text-gray-400" />
                          <span className="font-medium">
                            {Math.round(entrevista.calificacion_promedio)}
                          </span>
                          <span className="text-gray-400">/100</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entrevista.recomendacion ? (
                        <Badge variant={RECOMENDACION_BADGE[entrevista.recomendacion]}>
                          {entrevista.recomendacion_display}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {entrevista.estado === 'programada' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRealizar(entrevista)}
                              title="Registrar resultado"
                            >
                              <CheckCircle size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCancel(entrevista)}
                              title="Cancelar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        {entrevista.estado === 'realizada' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRealizar(entrevista)}
                            title="Ver evaluacion"
                          >
                            <Eye size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};

// ============================================================================
// Sub-componente: Entrevistas Asincronicas
// ============================================================================

interface AsyncEntrevistasViewProps {
  entrevistas: EntrevistaAsincronicaList[];
  isLoading: boolean;
  estadoFilter: EstadoEntrevistaAsync | '';
  onEstadoFilterChange: (estado: EstadoEntrevistaAsync | '') => void;
  onCreateNew: () => void;
  onEvaluar: (entrevista: EntrevistaAsincronicaList) => void;
  onReenviarEmail: (id: number) => void;
  onCancel: (entrevista: EntrevistaAsincronicaList) => void;
  getPublicUrl: (token: string) => string;
  colorClasses: ReturnType<typeof getModuleColorClasses>;
}

const AsyncEntrevistasView = ({
  entrevistas,
  isLoading,
  estadoFilter,
  onEstadoFilterChange,
  onCreateNew,
  onEvaluar,
  onReenviarEmail,
  onCancel,
  getPublicUrl,
  colorClasses,
}: AsyncEntrevistasViewProps) => {
  return (
    <>
      <SectionHeader
        title="Entrevistas Asincronicas"
        description="Entrevistas por email que el candidato responde a su ritmo"
        actions={
          <Button onClick={onCreateNew} size="sm">
            <Plus size={16} className="mr-1" />
            Nueva Entrevista Async
          </Button>
        }
      >
        <div className="flex items-center gap-3">
          <Select
            value={estadoFilter}
            onChange={(e) => onEstadoFilterChange(e.target.value as EstadoEntrevistaAsync | '')}
            className="w-44"
          >
            <option value="">Todos los estados</option>
            {ESTADO_ENTREVISTA_ASYNC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </SectionHeader>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : entrevistas.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={
                <div className={cn('p-3 rounded-xl', colorClasses.badge)}>
                  <Mail size={24} className={colorClasses.icon} />
                </div>
              }
              title="Sin entrevistas asincronicas"
              description="Crea una entrevista por email para que el candidato responda a su ritmo."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Titulo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Candidato
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Preguntas
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Vence
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Calificacion
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entrevistas.map((entrevista) => (
                  <tr
                    key={entrevista.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {entrevista.titulo}
                      </div>
                      <div className="text-xs text-gray-500">{entrevista.vacante_codigo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 dark:text-white">
                        {entrevista.candidato_nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <span className="font-medium">{entrevista.total_respuestas}</span>
                        <span className="text-gray-400">/</span>
                        <span>{entrevista.total_preguntas}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_ENTREVISTA_ASYNC_BADGE[entrevista.estado]}>
                        {entrevista.estado_display}
                      </Badge>
                      {entrevista.esta_vencida && entrevista.estado !== 'vencida' && (
                        <Badge variant="danger" className="ml-1">
                          Vencida
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-600 dark:text-gray-300">
                        {formatDate(entrevista.fecha_vencimiento)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {entrevista.calificacion_general != null ? (
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-amber-500" />
                          <span className="font-medium">{entrevista.calificacion_general}</span>
                          <span className="text-gray-400">/100</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Evaluar (para completadas) */}
                        {['completada', 'evaluada'].includes(entrevista.estado) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEvaluar(entrevista)}
                            title={entrevista.estado === 'evaluada' ? 'Ver evaluacion' : 'Evaluar'}
                          >
                            {entrevista.estado === 'evaluada' ? (
                              <Eye size={16} />
                            ) : (
                              <Star size={16} />
                            )}
                          </Button>
                        )}

                        {/* Copiar link */}
                        {!['completada', 'evaluada', 'cancelada', 'vencida'].includes(
                          entrevista.estado
                        ) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(getPublicUrl(entrevista.token));
                              import('sonner').then(({ toast }) => toast.success('Link copiado'));
                            }}
                            title="Copiar link"
                          >
                            <ExternalLink size={16} />
                          </Button>
                        )}

                        {/* Reenviar email */}
                        {['pendiente', 'enviada', 'en_progreso'].includes(entrevista.estado) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReenviarEmail(entrevista.id)}
                            title="Reenviar email"
                          >
                            <RefreshCw size={16} />
                          </Button>
                        )}

                        {/* Cancelar */}
                        {!['evaluada', 'cancelada'].includes(entrevista.estado) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancel(entrevista)}
                            title="Cancelar"
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};
