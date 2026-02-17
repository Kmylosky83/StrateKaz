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
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Induccion SST</p>
            <p className="text-sm font-semibold text-amber-600">Pendiente</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <HeartPulse className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Examen medico</p>
            <p className="text-sm font-semibold text-gray-400">No registrado</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <HardHat className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">EPPs asignados</p>
            <p className="text-lg font-semibold text-gray-900">0</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Reportes</p>
            <p className="text-lg font-semibold text-gray-900">0</p>
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
