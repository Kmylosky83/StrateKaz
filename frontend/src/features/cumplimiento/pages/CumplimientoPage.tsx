/**
 * Página Principal del Módulo Motor de Cumplimiento
 *
 * Sistema de gestión de cumplimiento normativo y legal:
 * - Matriz Legal (Decretos, Leyes, Resoluciones)
 * - Requisitos Legales (Licencias, Permisos, Conceptos)
 * - Partes Interesadas (Stakeholders, Comunicaciones)
 * - Reglamentos Internos (Con versionamiento)
 *
 * Normativa aplicable:
 * - Decreto 1072/2015 (SG-SST)
 * - ISO 9001, ISO 14001, ISO 45001 (Contexto de la organización)
 * - Código de Comercio (Registros y licencias)
 */
import {
  Scale,
  BookOpen,
  Users,
  FileText,
  Building2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { SelectionCard, SelectionCardGrid } from '@/components/common/SelectionCard';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Spinner } from '@/components/common/Spinner';

export default function CumplimientoPage() {
  const { color: moduleColor, isLoading } = useModuleColor('proteccion_cumplimiento');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <PageHeader
        title="Motor de Cumplimiento"
        description="Gestión integral de cumplimiento normativo, legal y regulatorio"
      />

      {/* HERO SECTION */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-${moduleColor}-600 via-${moduleColor}-700 to-indigo-800 p-8 text-white`}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Bienvenido al Motor de Cumplimiento</h2>
          <p className="text-blue-100 max-w-2xl">
            Asegure el cumplimiento normativo y legal de su organización. Gestione matrices legales,
            requisitos, partes interesadas y reglamentos internos de forma centralizada.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-blue-200">Normatividad</span>
              <p className="font-semibold">Matriz Legal Actualizada</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-blue-200">Licencias</span>
              <p className="font-semibold">Control de Vencimientos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-blue-200">Stakeholders</span>
              <p className="font-semibold">Gestión de Comunicaciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE MÓDULOS */}
      <SelectionCardGrid columns={4}>
        <SelectionCard
          icon={Scale}
          title="Matriz Legal"
          subtitle="Decretos, leyes, resoluciones y normativa aplicable a la organización"
          href="/cumplimiento/matriz-legal"
          variant="gradient"
          color="blue"
        />

        <SelectionCard
          icon={BookOpen}
          title="Requisitos Legales"
          subtitle="Licencias, permisos, conceptos y autorizaciones vigentes"
          href="/cumplimiento/requisitos"
          variant="gradient"
          color="blue"
        />

        <SelectionCard
          icon={Users}
          title="Partes Interesadas"
          subtitle="Stakeholders, matriz de comunicaciones y expectativas"
          href="/planeacion-estrategica/contexto"
          variant="gradient"
          color="blue"
        />

        <SelectionCard
          icon={FileText}
          title="Reglamentos Internos"
          subtitle="Reglamentos con control de versiones y aprobaciones"
          href="/cumplimiento/reglamentos"
          variant="gradient"
          color="blue"
        />
      </SelectionCardGrid>

      {/* INFO ADICIONAL - ÁREAS DE CUMPLIMIENTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`bg-${moduleColor}-50 dark:bg-${moduleColor}-900/20 border border-${moduleColor}-100 dark:border-${moduleColor}-800 rounded-xl p-4`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 bg-${moduleColor}-100 dark:bg-${moduleColor}-900/30 rounded-lg flex items-center justify-center`}
            >
              <Building2
                className={`w-5 h-5 text-${moduleColor}-600 dark:text-${moduleColor}-400`}
              />
            </div>
            <h4 className={`font-medium text-${moduleColor}-900 dark:text-${moduleColor}-100`}>
              Cumplimiento Corporativo
            </h4>
          </div>
          <p className={`text-sm text-${moduleColor}-700 dark:text-${moduleColor}-300`}>
            Gestión de requisitos comerciales, tributarios y societarios de la organización.
          </p>
        </div>

        <div
          className={`bg-${moduleColor}-50 dark:bg-${moduleColor}-900/20 border border-${moduleColor}-100 dark:border-${moduleColor}-800 rounded-xl p-4`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 bg-${moduleColor}-100 dark:bg-${moduleColor}-900/30 rounded-lg flex items-center justify-center`}
            >
              <ShieldCheck
                className={`w-5 h-5 text-${moduleColor}-600 dark:text-${moduleColor}-400`}
              />
            </div>
            <h4 className={`font-medium text-${moduleColor}-900 dark:text-${moduleColor}-100`}>
              Cumplimiento Operativo
            </h4>
          </div>
          <p className={`text-sm text-${moduleColor}-700 dark:text-${moduleColor}-300`}>
            Control de licencias, permisos y autorizaciones para operación legal del negocio.
          </p>
        </div>

        <div
          className={`bg-${moduleColor}-50 dark:bg-${moduleColor}-900/20 border border-${moduleColor}-100 dark:border-${moduleColor}-800 rounded-xl p-4`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 bg-${moduleColor}-100 dark:bg-${moduleColor}-900/30 rounded-lg flex items-center justify-center`}
            >
              <AlertCircle
                className={`w-5 h-5 text-${moduleColor}-600 dark:text-${moduleColor}-400`}
              />
            </div>
            <h4 className={`font-medium text-${moduleColor}-900 dark:text-${moduleColor}-100`}>
              Alertas y Vencimientos
            </h4>
          </div>
          <p className={`text-sm text-${moduleColor}-700 dark:text-${moduleColor}-300`}>
            Sistema de notificaciones automáticas para renovaciones y actualizaciones normativas.
          </p>
        </div>
      </div>

      {/* INDICADORES RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Normativas Vigentes</span>
            <Scale className={`w-4 h-4 text-${moduleColor}-600`} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">127</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Aplicables a la organización
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Licencias Activas</span>
            <BookOpen className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Permisos y autorizaciones</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Por Vencer</span>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Próximos 30 días</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Cumplimiento</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">98%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estado general</p>
        </div>
      </div>
    </div>
  );
}
