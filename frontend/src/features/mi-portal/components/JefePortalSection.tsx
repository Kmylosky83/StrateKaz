/**
 * JefePortalSection - Sección de liderazgo en Mi Portal
 *
 * Se muestra entre el Hero y los Tabs cuando el usuario tiene cargo.is_jefatura=true.
 * Reutiliza hooks y endpoints existentes de Mi Equipo (MSS).
 *
 * - Stats: total equipo, aprobaciones pendientes
 * - Fichas del equipo (max 6)
 * - Aprobaciones pendientes (max 3)
 * - Links a /mi-equipo para gestión completa
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  ArrowRight,
  Briefcase,
  Calendar,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { Card, Badge, Skeleton, Avatar, Button } from '@/components/common';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import {
  useMiEquipo,
  useAprobacionesPendientes,
  useAprobarSolicitud,
} from '@/features/mi-equipo/api/miEquipoApi';
import { AprobacionModal } from '@/features/mi-equipo/components/AprobacionModal';
import type { AprobacionPendiente } from '@/features/mi-equipo/types';

const MAX_FICHAS = 6;
const MAX_APROBACIONES = 3;

const TIPO_ICONS: Record<string, typeof Calendar> = {
  vacaciones: Calendar,
  permiso: FileText,
  hora_extra: ClipboardCheck,
};

const TIPO_COLORS: Record<string, string> = {
  vacaciones: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  permiso: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  hora_extra: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
};

export function JefePortalSection() {
  const { primaryColor } = useBrandingConfig();
  const { data: equipo, isLoading: equipoLoading } = useMiEquipo();
  const { data: aprobaciones, isLoading: aprobacionesLoading } = useAprobacionesPendientes();
  const aprobarMutation = useAprobarSolicitud();

  const [selectedSolicitud, setSelectedSolicitud] = useState<AprobacionPendiente | null>(null);
  const [accionModal, setAccionModal] = useState<'aprobar' | 'rechazar'>('aprobar');

  const isLoading = equipoLoading || aprobacionesLoading;
  const totalEquipo = equipo?.length ?? 0;
  const totalAprobaciones = aprobaciones?.length ?? 0;

  // Si no hay equipo y ya cargó, no mostrar la sección
  if (!isLoading && totalEquipo === 0 && totalAprobaciones === 0) {
    return null;
  }

  const fichasVisibles = equipo?.slice(0, MAX_FICHAS) ?? [];
  const fichasRestantes = totalEquipo - MAX_FICHAS;
  const aprobacionesVisibles = aprobaciones?.slice(0, MAX_APROBACIONES) ?? [];

  const handleAccion = (solicitud: AprobacionPendiente, accion: 'aprobar' | 'rechazar') => {
    setSelectedSolicitud(solicitud);
    setAccionModal(accion);
  };

  return (
    <div className="space-y-4">
      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="lg">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEquipo}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">Mi Equipo</p>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: totalAprobaciones > 0 ? '#FEF3C7' : `${primaryColor}15`,
                color: totalAprobaciones > 0 ? '#D97706' : primaryColor,
              }}
            >
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalAprobaciones}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">Aprobaciones</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Equipo (max 6 fichas) ────────────────────────────────────── */}
      {(equipoLoading || totalEquipo > 0) && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: primaryColor }} />
              Mi Equipo
            </h3>
            <Link
              to="/mi-equipo"
              className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: primaryColor }}
            >
              Ver completo
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {equipoLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fichasVisibles.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Avatar src={col.foto_url} name={col.nombre_completo} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {col.nombre_completo}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{col.cargo_nombre}</span>
                    </div>
                  </div>
                  {col.is_externo && (
                    <Badge variant="info" size="sm">
                      Ext
                    </Badge>
                  )}
                </div>
              ))}
              {fichasRestantes > 0 && (
                <Link
                  to="/mi-equipo"
                  className="flex items-center justify-center p-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  +{fichasRestantes} m&aacute;s
                </Link>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Aprobaciones Pendientes (max 3) ──────────────────────────── */}
      {(aprobacionesLoading || totalAprobaciones > 0) && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-500" />
              Aprobaciones Pendientes
            </h3>
            {totalAprobaciones > MAX_APROBACIONES && (
              <Link
                to="/mi-equipo?tab=aprobaciones"
                className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: primaryColor }}
              >
                Ver todas ({totalAprobaciones})
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {aprobacionesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {aprobacionesVisibles.map((sol) => {
                const Icon = TIPO_ICONS[sol.tipo] || FileText;
                const colorClass = TIPO_COLORS[sol.tipo] || TIPO_COLORS.permiso;

                return (
                  <div
                    key={`${sol.tipo}-${sol.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {sol.colaborador_nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {sol.detalle}
                        </p>
                      </div>
                      <Badge variant="info" size="sm" className="flex-shrink-0">
                        {sol.tipo}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAccion(sol, 'rechazar')}
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 p-1.5 h-auto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccion(sol, 'aprobar')}
                        className="p-1.5 h-auto"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modal de confirmación (reutilizado de Mi Equipo) */}
      {selectedSolicitud && (
        <AprobacionModal
          isOpen={!!selectedSolicitud}
          onClose={() => setSelectedSolicitud(null)}
          solicitud={selectedSolicitud}
          accion={accionModal}
          onConfirm={(observaciones) => {
            aprobarMutation.mutate(
              {
                tipo: selectedSolicitud.tipo,
                solicitudId: selectedSolicitud.id,
                data: { accion: accionModal, observaciones },
              },
              { onSuccess: () => setSelectedSolicitud(null) }
            );
          }}
          isPending={aprobarMutation.isPending}
        />
      )}
    </div>
  );
}
