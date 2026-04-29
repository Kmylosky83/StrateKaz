import { Workflow } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { SelectionCard, SelectionCardGrid } from '@/components/common/SelectionCard';
import { GitBranch, Play, BarChart3 } from 'lucide-react';

export default function WorkflowsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Workflow Engine"
        description="Motor de flujos de trabajo y automatización de procesos"
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Motor de Automatización</h2>
          <p className="text-purple-100 max-w-2xl">
            Diseña, ejecuta y monitorea flujos de trabajo personalizados para automatizar procesos
            de negocio. Seleccione un módulo para comenzar.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-purple-200">Diseñador Visual</span>
              <p className="font-semibold">Drag & Drop</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-purple-200">Notificaciones</span>
              <p className="font-semibold">Automáticas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-purple-200">Métricas</span>
              <p className="font-semibold">SLA Tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <SelectionCardGrid columns={3}>
        <SelectionCard
          icon={GitBranch}
          title="Diseñador de Flujos"
          subtitle="Crear y configurar flujos de trabajo personalizados con editor visual"
          href="/workflows/disenador"
          variant="gradient"
          color="purple"
        />

        <SelectionCard
          icon={Play}
          title="Ejecución y Tareas"
          subtitle="Gestionar tareas pendientes y bandeja de trabajo unificada"
          href="/workflows/ejecucion"
          variant="gradient"
          color="purple"
        />

        <SelectionCard
          icon={BarChart3}
          title="Monitoreo y Métricas"
          subtitle="Analizar tiempos, SLAs y eficiencia de procesos"
          href="/workflows/monitoreo"
          variant="gradient"
          color="purple"
        />
      </SelectionCardGrid>

      {/* Info Section */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Workflow className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Motor de Automatización de Procesos
            </h3>
            <p className="text-purple-800 dark:text-purple-300 text-sm leading-relaxed">
              El Workflow Engine permite diseñar, ejecutar y monitorear flujos de trabajo
              personalizados para automatizar procesos de negocio. Incluye diseñador visual drag &
              drop, gestión de tareas, notificaciones automáticas, y análisis de rendimiento con
              métricas de SLA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
