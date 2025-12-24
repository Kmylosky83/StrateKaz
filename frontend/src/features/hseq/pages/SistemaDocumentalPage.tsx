/**
 * Página: Sistema Documental
 *
 * Gestión del sistema documental:
 * - Control de documentos
 * - Registros
 * - Versiones
 * - Aprobaciones
 */
import { FileText, FolderOpen, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout';

export default function SistemaDocumentalPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Sistema Documental"
        description="Gestión y control de documentos y registros del sistema de gestión HSEQ"
      />

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Módulo en Desarrollo</h2>
              <p className="text-blue-100">Este módulo estará disponible próximamente</p>
            </div>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES PLANEADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Control de Documentos</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestión centralizada de documentos, control de versiones, aprobaciones y distribución.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Registros</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Administración de registros del sistema, trazabilidad y control de acceso.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Cumplimiento</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verificación de cumplimiento normativo y auditorías documentales.
          </p>
        </div>
      </div>
    </div>
  );
}
