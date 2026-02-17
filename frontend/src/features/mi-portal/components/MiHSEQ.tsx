/**
 * MiHSEQ - Tab de HSEQ para contratistas externos
 *
 * Muestra al contratista:
 * - Induccion SST pendiente o completada
 * - Examenes medicos ocupacionales
 * - EPPs asignados
 * - Reporte de condiciones inseguras
 * - Politicas y procedimientos aplicables
 */

import { ShieldCheck, HeartPulse, HardHat, AlertTriangle } from 'lucide-react';
import { Card, EmptyState } from '@/components/common';

export function MiHSEQ() {
  return (
    <div className="space-y-6">
      {/* Resumen HSEQ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Induccion SST</p>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Pendiente</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <HeartPulse className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Examen medico</p>
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">No registrado</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <HardHat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">EPPs asignados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reportes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contenido principal */}
      <Card className="p-6">
        <EmptyState
          icon={<ShieldCheck className="w-12 h-12" />}
          title="Requisitos HSEQ"
          description="Aquí podrá completar su inducción SST, consultar exámenes médicos, verificar EPPs asignados y reportar condiciones inseguras."
        />
      </Card>
    </div>
  );
}
