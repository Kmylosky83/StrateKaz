/**
 * Página: Gestión de Comités
 *
 * Gestión de comités HSEQ:
 * - COPASST
 * - Comité de Convivencia
 * - Brigada de Emergencias
 * - Actas y asistencias
 */
import { Users, FileText, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout';

export default function GestionComitesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Comités"
        description="Administración de comités HSEQ, actas y seguimiento"
      />

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Módulo en Desarrollo</h2>
              <p className="text-violet-100">Este módulo estará disponible próximamente</p>
            </div>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES PLANEADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">COPASST</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestión del Comité Paritario de Seguridad y Salud en el Trabajo.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Reuniones</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Programación de reuniones, asistencias y seguimiento de compromisos.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Actas</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Registro y gestión de actas de reuniones de comités.
          </p>
        </div>
      </div>
    </div>
  );
}
