/**
 * Página: Gestión Ambiental
 *
 * ISO 14001 - Sistema de Gestión Ambiental:
 * - Aspectos e impactos ambientales
 * - Programas ambientales
 * - Requisitos legales ambientales
 * - Monitoreo ambiental
 */
import { Leaf, TreePine, Recycle } from 'lucide-react';
import { PageHeader } from '@/components/layout';

export default function GestionAmbientalPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión Ambiental"
        description="Sistema de Gestión Ambiental ISO 14001"
      />

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Módulo en Desarrollo</h2>
              <p className="text-green-100">Este módulo estará disponible próximamente</p>
            </div>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES PLANEADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Aspectos Ambientales</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Identificación y evaluación de aspectos e impactos ambientales.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Programas Ambientales</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestión de residuos, ahorro de energía, uso eficiente del agua.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Monitoreo Ambiental</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Medición de emisiones, vertimientos y consumos ambientales.
          </p>
        </div>
      </div>
    </div>
  );
}
