/**
 * Página Principal del Módulo HSEQ Management
 *
 * Sistema Integrado de Gestión HSEQ:
 * - Health (Salud)
 * - Safety (Seguridad)
 * - Environment (Medio Ambiente)
 * - Quality (Calidad)
 *
 * Basado en:
 * - ISO 9001 (Calidad)
 * - ISO 14001 (Ambiental)
 * - ISO 45001 (Seguridad y Salud Ocupacional)
 * - Decreto 1072/2015 (SG-SST Colombia)
 */
import { Award, Heart, HardHat, Wind, Users, AlertTriangle, Siren, Leaf } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { SelectionCard, SelectionCardGrid } from '@/components/common/SelectionCard';

export default function HSEQPage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <PageHeader
        title="Gestión HSEQ"
        description="Torre de Control - Sistema Integrado de Gestión en Salud, Seguridad, Medio Ambiente y Calidad"
      />

      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Bienvenido a Gestión HSEQ</h2>
          <p className="text-blue-100 max-w-2xl">
            Gestión integrada de calidad, seguridad, salud ocupacional y medio ambiente. Seleccione
            un módulo para comenzar.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-blue-200">ISO 9001</span>
              <p className="font-semibold">Sistema de Gestión de Calidad</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-blue-200">ISO 14001</span>
              <p className="font-semibold">Sistema de Gestión Ambiental</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-blue-200">ISO 45001</span>
              <p className="font-semibold">Seguridad y Salud Ocupacional</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE MÓDULOS — 7 tabs operativos HSEQ + acceso a Calidad (SGI) */}
      <SelectionCardGrid columns={4}>
        <SelectionCard
          icon={Award}
          title="Calidad"
          subtitle="ISO 9001 - No conformidades, acciones correctivas y control de cambios"
          href="/sistema-gestion/calidad"
          variant="gradient"
          color="green"
        />

        <SelectionCard
          icon={Heart}
          title="Medicina Laboral"
          subtitle="Exámenes médicos, vigilancia epidemiológica y restricciones"
          href="/hseq/medicina-laboral"
          variant="gradient"
          color="orange"
        />

        <SelectionCard
          icon={HardHat}
          title="Seguridad Industrial"
          subtitle="Inspecciones, EPP, permisos de trabajo y señalización"
          href="/hseq/seguridad-industrial"
          variant="gradient"
          color="orange"
        />

        <SelectionCard
          icon={Wind}
          title="Higiene Industrial"
          subtitle="Mediciones de agentes físicos, químicos y control ambiental"
          href="/hseq/higiene-industrial"
          variant="gradient"
          color="blue"
        />

        <SelectionCard
          icon={Users}
          title="Comités"
          subtitle="COPASST, Convivencia, Brigada de Emergencias, actas y reuniones"
          href="/hseq/comites"
          variant="glass"
          color="purple"
        />

        <SelectionCard
          icon={AlertTriangle}
          title="Accidentalidad"
          subtitle="Reporte de incidentes, investigación e indicadores de accidentalidad"
          href="/hseq/accidentalidad"
          variant="glass"
          color="orange"
        />

        <SelectionCard
          icon={Siren}
          title="Emergencias"
          subtitle="Plan de emergencias, brigada, simulacros y recursos de respuesta"
          href="/hseq/emergencias"
          variant="glass"
          color="orange"
        />

        <SelectionCard
          icon={Leaf}
          title="Gestión Ambiental"
          subtitle="ISO 14001 - Aspectos ambientales, programas y monitoreo"
          href="/hseq/gestion-ambiental"
          variant="glass"
          color="green"
        />
      </SelectionCardGrid>

      {/* INFO ADICIONAL - SISTEMAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-medium text-emerald-900 dark:text-emerald-100">ISO 9001</h4>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Sistema de Gestión de Calidad enfocado en la satisfacción del cliente y mejora continua.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">ISO 14001</h4>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Sistema de Gestión Ambiental para control de aspectos e impactos ambientales.
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 className="font-medium text-orange-900 dark:text-orange-100">ISO 45001 / SG-SST</h4>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Seguridad y Salud en el Trabajo (Decreto 1072/2015 - Colombia).
          </p>
        </div>
      </div>
    </div>
  );
}
