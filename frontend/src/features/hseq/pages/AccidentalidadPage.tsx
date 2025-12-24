/**
 * Página: Accidentalidad
 *
 * Gestión de incidentes y accidentes:
 * - Reporte de incidentes
 * - Investigación de accidentes
 * - Indicadores de accidentalidad
 * - Tendencias y análisis
 */
import { AlertTriangle, ClipboardList, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/layout';

export default function AccidentalidadPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Accidentalidad"
        description="Gestión de incidentes, accidentes y enfermedades laborales"
      />

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-rose-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Módulo en Desarrollo</h2>
              <p className="text-red-100">Este módulo estará disponible próximamente</p>
            </div>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES PLANEADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Reporte de Incidentes</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Registro inmediato de incidentes, accidentes y casi accidentes.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Investigación</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Investigación de causas raíz y definición de acciones correctivas.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Indicadores</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Índices de frecuencia, severidad y accidentalidad. Análisis de tendencias.
          </p>
        </div>
      </div>
    </div>
  );
}
