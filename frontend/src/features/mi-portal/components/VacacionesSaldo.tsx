/**
 * VacacionesSaldo - Muestra saldo de vacaciones y permite solicitar
 */

import { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, Badge, Skeleton, Button } from '@/components/common';
import { useMisVacaciones } from '../api/miPortalApi';
import { VacacionesSolicitar } from './VacacionesSolicitar';

export function VacacionesSaldo() {
  const { data: saldo, isLoading } = useMisVacaciones();
  const [showSolicitar, setShowSolicitar] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Acumulados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {saldo?.dias_acumulados ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Disfrutados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {saldo?.dias_disfrutados ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {saldo?.dias_disponibles ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {saldo?.solicitudes_pendientes ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Info adicional + boton */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {saldo?.fecha_ultimo_periodo && (
            <span>Ultimo periodo desde: {saldo.fecha_ultimo_periodo}</span>
          )}
        </div>
        <Button onClick={() => setShowSolicitar(true)}>
          Solicitar vacaciones
        </Button>
      </div>

      {/* Modal solicitar */}
      <VacacionesSolicitar
        isOpen={showSolicitar}
        onClose={() => setShowSolicitar(false)}
        diasDisponibles={saldo?.dias_disponibles ?? 0}
      />
    </div>
  );
}
