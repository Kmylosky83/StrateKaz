/**
 * Página: Medicina Laboral
 *
 * Gestión de salud ocupacional:
 * - Exámenes médicos ocupacionales
 * - Historia clínica laboral
 * - Vigilancia epidemiológica
 * - Restricciones médicas
 */
import { Heart, Stethoscope, Activity } from 'lucide-react';
import { PageHeader } from '@/components/layout';

export default function MedicinaLaboralPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Medicina Laboral"
        description="Gestión de salud ocupacional y vigilancia epidemiológica"
      />

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Módulo en Desarrollo</h2>
              <p className="text-rose-100">Este módulo estará disponible próximamente</p>
            </div>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES PLANEADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Exámenes Médicos</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestión de exámenes médicos ocupacionales de ingreso, periódicos y egreso.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Vigilancia Epidemiológica</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Programas de vigilancia epidemiológica y control de riesgos prioritarios.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Restricciones Médicas</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Control de restricciones y recomendaciones médicas laborales.
          </p>
        </div>
      </div>
    </div>
  );
}
