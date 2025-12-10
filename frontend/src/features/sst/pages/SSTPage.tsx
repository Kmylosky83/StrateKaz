/**
 * Pagina Principal del Modulo SST (Seguridad y Salud en el Trabajo)
 *
 * Sistema de Gestion SG-SST basado en:
 * - Decreto 1072 de 2015
 * - Resolucion 0312 de 2019
 *
 * Diseño de tarjetas de seleccion para navegacion a submodulos
 */
import {
  Users,
  FileCheck,
  Heart,
  AlertTriangle,
  Shield,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { SelectionCard, SelectionCardGrid } from '@/components/common/SelectionCard';

export default function SSTPage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <PageHeader
        title="Sistema de Gestión SST"
        description="Gestión de Seguridad y Salud en el Trabajo - Decreto 1072/2015 y Resolución 0312/2019"
      />

      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Bienvenido al SG-SST</h2>
          <p className="text-purple-100 max-w-2xl">
            Gestione de forma integral la seguridad y salud de los trabajadores.
            Seleccione una sección para comenzar.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-purple-200">Ciclo PHVA</span>
              <p className="font-semibold">Planear - Hacer - Verificar - Actuar</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-purple-200">Normativa</span>
              <p className="font-semibold">Decreto 1072 / Res. 0312</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE SECCIONES */}
      <SelectionCardGrid columns={4}>
        <SelectionCard
          icon={Users}
          title="Recursos"
          subtitle="Administración de recursos humanos, técnicos y financieros para el SG-SST"
          href="/sst/recursos"
          variant="gradient"
          color="purple"
        />

        <SelectionCard
          icon={FileCheck}
          title="Gestión Integral"
          subtitle="Política, objetivos, plan de trabajo anual y asignación de responsabilidades"
          href="/sst/gestion-integral"
          variant="gradient"
          color="blue"
        />

        <SelectionCard
          icon={Heart}
          title="Gestión de la Salud"
          subtitle="Condiciones de salud, perfiles sociodemográficos, vigilancia epidemiológica"
          href="/sst/gestion-salud"
          variant="gradient"
          color="green"
        />

        <SelectionCard
          icon={AlertTriangle}
          title="Peligros y Riesgos"
          subtitle="Matriz de peligros, evaluación de riesgos y controles (GTC-45)"
          href="/sst/peligros-riesgos"
          variant="gradient"
          color="orange"
        />

        <SelectionCard
          icon={Shield}
          title="Amenazas"
          subtitle="Identificación de amenazas, vulnerabilidad y planes de respuesta"
          href="/sst/amenazas"
          variant="glass"
          color="purple"
        />

        <SelectionCard
          icon={CheckSquare}
          title="Verificación"
          subtitle="Indicadores, auditorías internas, revisión por la dirección"
          href="/sst/verificacion"
          variant="glass"
          color="blue"
        />

        <SelectionCard
          icon={TrendingUp}
          title="Mejoramiento"
          subtitle="Acciones correctivas, preventivas y de mejora del SG-SST"
          href="/sst/mejoramiento"
          variant="glass"
          color="green"
        />
      </SelectionCardGrid>

      {/* INFO ADICIONAL - CICLO PHVA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-medium text-purple-900">Planear</h4>
          </div>
          <p className="text-sm text-purple-700">
            Política, objetivos, planificación, asignación de recursos y responsabilidades.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-blue-900">Hacer</h4>
          </div>
          <p className="text-sm text-blue-700">
            Implementación de medidas de prevención, preparación y respuesta ante emergencias.
          </p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-medium text-green-900">Verificar y Actuar</h4>
          </div>
          <p className="text-sm text-green-700">
            Auditoría, revisión por la dirección, investigación de incidentes y mejora continua.
          </p>
        </div>
      </div>
    </div>
  );
}
