/**
 * AprobacionesPendientes - Lista de solicitudes pendientes de aprobacion
 */

import { useState } from 'react';
import { ClipboardCheck, Calendar, FileText, Check, X } from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState, Button } from '@/components/common';
import { useAprobacionesPendientes, useAprobarSolicitud } from '../api/miEquipoApi';
import { AprobacionModal } from './AprobacionModal';
import type { AprobacionPendiente } from '../types';

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

export function AprobacionesPendientes() {
  const { data: pendientes, isLoading } = useAprobacionesPendientes();
  const aprobarMutation = useAprobarSolicitud();
  const [selectedSolicitud, setSelectedSolicitud] = useState<AprobacionPendiente | null>(null);
  const [accionModal, setAccionModal] = useState<'aprobar' | 'rechazar'>('aprobar');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!pendientes || pendientes.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="w-12 h-12" />}
        title="Sin solicitudes pendientes"
        description="No tiene solicitudes de su equipo por aprobar."
      />
    );
  }

  const handleAccion = (solicitud: AprobacionPendiente, accion: 'aprobar' | 'rechazar') => {
    setSelectedSolicitud(solicitud);
    setAccionModal(accion);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <ClipboardCheck className="w-4 h-4" />
        <span>{pendientes.length} solicitudes pendientes</span>
      </div>

      <div className="space-y-3">
        {pendientes.map((sol) => {
          const Icon = TIPO_ICONS[sol.tipo] || FileText;
          const colorClass = TIPO_COLORS[sol.tipo] || TIPO_COLORS.permiso;

          return (
            <Card key={`${sol.tipo}-${sol.id}`} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {sol.colaborador_nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {sol.detalle}
                    </p>
                  </div>
                  <Badge variant="info" size="sm">
                    {sol.tipo}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAccion(sol, 'rechazar')}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccion(sol, 'aprobar')}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Aprobar
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de confirmacion */}
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
