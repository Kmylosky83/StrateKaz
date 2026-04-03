/**
 * DashboardDocumentalSection — Centro de control documental personal.
 *
 * Responde: ¿qué necesita mi atención ahora?
 * - Métricas rápidas: borradores propios, firmas pendientes, próximas revisiones
 * - Acciones urgentes contextuales
 * - Cobertura documental del sistema
 * - Score de cumplimiento global
 */
import { lazy, Suspense } from 'react';
import { FileText, PenTool, CheckCircle, TrendingUp, GitPullRequest, Archive } from 'lucide-react';
import { Card, Button, Badge, Spinner } from '@/components/common';

import { useDocumentos, useEstadisticasDocumentales } from '../hooks/useGestionDocumental';
import { useMisFirmasPendientes } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';
import { useMisPendientes } from '../hooks/useAceptacionDocumental';

const CoberturaPanel = lazy(() => import('./CoberturaPanel'));

interface DashboardDocumentalSectionProps {
  onViewDocumento: (id: number) => void;
  onFirmar?: (firmaId: number, rolDisplay?: string) => void;
  onNavigateToSection?: (section: string) => void;
}

export function DashboardDocumentalSection({
  onFirmar,
  onNavigateToSection,
}: DashboardDocumentalSectionProps) {
  const { data: documentos, isLoading: isLoadingDocs } = useDocumentos();
  const { data: estadisticas } = useEstadisticasDocumentales();
  const {
    firmasPendientes,
    totalPendientes,
    miTurno,
    isLoading: firmasLoading,
  } = useMisFirmasPendientes();
  const { data: lecturasPendientes } = useMisPendientes();

  const misBorradores = documentos?.filter((d) => d.estado === 'BORRADOR') ?? [];
  const enRevision = documentos?.filter((d) => d.estado === 'EN_REVISION') ?? [];
  const totalLecturas = lecturasPendientes?.length ?? 0;
  const scoreGlobal = estadisticas?.score_promedio ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Métricas rápidas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          bgColor="bg-indigo-100 dark:bg-indigo-900/30"
          label="Mis Borradores"
          value={isLoadingDocs ? '...' : misBorradores.length}
          onClick={() => onNavigateToSection?.('en_proceso')}
        />
        <MetricCard
          icon={<PenTool className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          bgColor="bg-orange-100 dark:bg-orange-900/30"
          label="Por Firmar"
          value={firmasLoading ? '...' : miTurno}
          badge={miTurno > 0 ? 'Tu turno' : undefined}
          onClick={() => onNavigateToSection?.('en_proceso')}
        />
        <MetricCard
          icon={<GitPullRequest className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
          bgColor="bg-yellow-100 dark:bg-yellow-900/30"
          label="En Revisión"
          value={isLoadingDocs ? '...' : enRevision.length}
          onClick={() => onNavigateToSection?.('en_proceso')}
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />}
          bgColor="bg-green-100 dark:bg-green-900/30"
          label="Score Global"
          value={`${scoreGlobal}/100`}
          onClick={() => onNavigateToSection?.('repositorio')}
        />
      </div>

      {/* ── Acciones urgentes ── */}
      {(miTurno > 0 || totalLecturas > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Requieren tu atención
          </h3>
          <div className="space-y-2">
            {/* Firmas de mi turno */}
            {firmasPendientes
              ?.filter((f) => f.es_mi_turno)
              .slice(0, 3)
              .map((firma) => (
                <UrgentActionCard
                  key={firma.id}
                  icon={<PenTool className="w-4 h-4 text-orange-600" />}
                  bgColor="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  title={`Firmar: "${firma.documento_titulo}"`}
                  subtitle={`Rol: ${firma.rol_firma_display} · ${firma.dias_pendiente} día(s) pendiente`}
                  actionLabel="Ir a firmar"
                  onAction={() => onFirmar?.(firma.id, firma.rol_firma_display)}
                />
              ))}

            {/* Lecturas pendientes — redirige a Mi Portal */}
            {totalLecturas > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Archive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {totalLecturas} lectura{totalLecturas !== 1 ? 's' : ''} pendiente
                      {totalLecturas !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Documentos asignados para lectura verificada
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/mi-portal?tab=lecturas';
                  }}
                >
                  Ver en Mi Portal
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sin acciones urgentes ── */}
      {!firmasLoading && miTurno === 0 && totalLecturas === 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Todo al día</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No tienes firmas ni lecturas pendientes en este momento
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Resumen del sistema ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Flujo activo
          </h4>
          <div className="space-y-2">
            <StatusRow
              label="Borradores"
              value={misBorradores.length}
              color="text-gray-600 dark:text-gray-400"
            />
            <StatusRow
              label="En revisión"
              value={enRevision.length}
              color="text-yellow-600 dark:text-yellow-400"
            />
            <StatusRow
              label="Firmas pendientes (total)"
              value={totalPendientes}
              color="text-orange-600 dark:text-orange-400"
            />
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Archivo</h4>
          <div className="space-y-2">
            <StatusRow
              label="Publicados vigentes"
              value={estadisticas?.publicados ?? 0}
              color="text-green-600 dark:text-green-400"
            />
            <StatusRow
              label="Obsoletos / Archivados"
              value={(estadisticas?.obsoletos ?? 0) + (estadisticas?.archivados ?? 0)}
              color="text-gray-500 dark:text-gray-400"
            />
            <StatusRow
              label="Total documentos"
              value={estadisticas?.total ?? 0}
              color="text-indigo-600 dark:text-indigo-400"
            />
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Distribución
          </h4>
          <div className="space-y-2">
            <StatusRow
              label="Lecturas pendientes (sistema)"
              value={estadisticas?.lecturas_pendientes ?? 0}
              color="text-blue-600 dark:text-blue-400"
            />
            <StatusRow
              label="Lecturas completadas"
              value={estadisticas?.lecturas_completadas ?? 0}
              color="text-green-600 dark:text-green-400"
            />
            <StatusRow
              label="Lecturas vencidas"
              value={estadisticas?.lecturas_vencidas ?? 0}
              color="text-red-600 dark:text-red-400"
            />
          </div>
        </Card>
      </div>

      {/* ── Cobertura documental ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Cobertura por tipo de documento
        </h3>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          }
        >
          <CoberturaPanel />
        </Suspense>
      </div>
    </div>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function MetricCard({
  icon,
  bgColor,
  label,
  value,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value: number | string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{label}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            {badge && (
              <Badge variant="warning" size="sm">
                {badge}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function UrgentActionCard({
  icon,
  bgColor,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${bgColor}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0 ml-2" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function StatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
