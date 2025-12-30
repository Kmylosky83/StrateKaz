/**
 * Página Principal: Talent Hub - Gestión del Talento Humano
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Módulo 10 - Nivel Habilitadores
 *
 * Subsecciones:
 * - Estructura de Cargos: Profesiogramas, competencias, vacantes
 * - Selección y Contratación: Candidatos, entrevistas, pruebas
 * - Colaboradores: Empleados activos, hojas de vida, historial
 * - Onboarding e Inducción: Procesos de inducción, checklist, entregas EPP
 * - Formación y Reinducción: LMS, capacitaciones, gamificación, certificados
 * - Desempeño: Evaluaciones 360°, planes de mejora, reconocimientos
 */
import { useState } from 'react';
import {
  Users,
  Search,
  Briefcase,
  ClipboardList,
  UserPlus,
  FileText,
  History,
  TrendingUp,
  GraduationCap,
  Award,
  UserCheck,
  BookOpen,
  Target,
  Star,
  Trophy,
  CheckCircle,
  Play,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import {
  useColaboradoresEstadisticas,
  useVacanteEstadisticas,
  useProcesoSeleccionEstadisticas,
  useOnboardingEstadisticas,
  useFormacionEstadisticas,
  useDesempenoEstadisticas,
} from '../hooks';

// ============================================================================
// Componente: Tab de Estructura de Cargos
// ============================================================================
function EstructuraCargosTab() {
  const { data: vacanteStats, isLoading } = useVacanteEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Profesiogramas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vacantes Abiertas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {vacanteStats?.vacantes_abiertas ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Competencias</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Posiciones Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {vacanteStats?.posiciones_pendientes ?? '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Area */}
      <Card className="p-6">
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title="Estructura de Cargos"
          description="Gestione profesiogramas, matriz de competencias, requisitos especiales y vacantes de la organización"
          action={{
            label: 'Nuevo Profesiograma',
            onClick: () => console.log('Nuevo profesiograma'),
          }}
        />
      </Card>
    </div>
  );
}

// ============================================================================
// Componente: Tab de Selección y Contratación
// ============================================================================
function SeleccionContratacionTab() {
  const { data: stats, isLoading } = useProcesoSeleccionEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vacantes Activas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.vacantes_abiertas ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Candidatos Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.candidatos_activos ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Entrevistas Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.entrevistas_hoy ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <UserPlus className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contrataciones Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.contrataciones_mes ?? '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Area */}
      <Card className="p-6">
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="Selección y Contratación"
          description="Gestione el proceso de reclutamiento, candidatos, entrevistas, pruebas y contratación de personal"
          action={{
            label: 'Nuevo Candidato',
            onClick: () => console.log('Nuevo candidato'),
          }}
        />
      </Card>
    </div>
  );
}

// ============================================================================
// Componente: Tab de Colaboradores
// ============================================================================
function ColaboradoresTab() {
  const { data: stats, isLoading } = useColaboradoresEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Colaboradores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activos ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.ingresos_mes ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <History className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Retiros Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.retiros_mes ?? '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Area */}
      <Card className="p-6">
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="Colaboradores"
          description="Gestione el directorio de empleados, hojas de vida, información personal e historial laboral"
          action={{
            label: 'Nuevo Colaborador',
            onClick: () => console.log('Nuevo colaborador'),
          }}
        />
      </Card>
    </div>
  );
}

// ============================================================================
// Componente: Tab de Onboarding e Inducción
// ============================================================================
function OnboardingInduccionTab() {
  const { data: stats, isLoading } = useOnboardingEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.procesos_en_curso ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completados Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.completados_mes ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Módulos Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.modulos_activos ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasa Completitud</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.tasa_completitud ? `${stats.tasa_completitud}%` : '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Area */}
      <Card className="p-6">
        <EmptyState
          icon={<UserCheck className="w-12 h-12" />}
          title="Onboarding e Inducción"
          description="Gestione procesos de inducción, checklist de actividades, entregas de EPP y activos, firma de documentos"
          action={{
            label: 'Nuevo Proceso',
            onClick: () => console.log('Nuevo proceso onboarding'),
          }}
        />
      </Card>
    </div>
  );
}

// ============================================================================
// Componente: Tab de Formación y Reinducción (LMS)
// ============================================================================
function FormacionReinduccionTab() {
  const { data: stats, isLoading } = useFormacionEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Capacitaciones Activas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.capacitaciones_activas ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Certificados Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.certificados_mes ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Puntos Gamificación</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.puntos_gamificacion ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Badges Otorgados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.badges_otorgados ?? '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Area */}
      <Card className="p-6">
        <EmptyState
          icon={<GraduationCap className="w-12 h-12" />}
          title="Formación y Reinducción (LMS)"
          description="Gestione planes de formación, capacitaciones, gamificación con puntos y badges, certificados y reinducciones"
          action={{
            label: 'Nueva Capacitación',
            onClick: () => console.log('Nueva capacitación'),
          }}
        />
      </Card>
    </div>
  );
}

// ============================================================================
// Componente: Tab de Desempeño
// ============================================================================
function DesempenoTab() {
  const { data: stats, isLoading } = useDesempenoEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Evaluaciones Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.evaluaciones_pendientes ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.evaluaciones_completadas ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Planes Mejora Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.planes_mejora_activos ?? '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reconocimientos Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.reconocimientos_mes ?? '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Area */}
      <Card className="p-6">
        <EmptyState
          icon={<Target className="w-12 h-12" />}
          title="Desempeño"
          description="Gestione evaluaciones 360°, planes de mejora, seguimientos y programa de reconocimientos con muro social"
          action={{
            label: 'Nuevo Ciclo Evaluación',
            onClick: () => console.log('Nuevo ciclo evaluación'),
          }}
        />
      </Card>
    </div>
  );
}

// ============================================================================
// Componente Principal: TalentHubPage
// ============================================================================
export default function TalentHubPage() {
  const [activeTab, setActiveTab] = useState('estructura');

  const tabs = [
    {
      id: 'estructura',
      label: 'Estructura de Cargos',
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 'seleccion',
      label: 'Selección',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'colaboradores',
      label: 'Colaboradores',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'formacion',
      label: 'Formación',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 'desempeno',
      label: 'Desempeño',
      icon: <Target className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Talent Hub"
        description="Gestión integral del talento humano: estructura, selección, colaboradores, onboarding, formación y desempeño"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'estructura' && <EstructuraCargosTab />}
        {activeTab === 'seleccion' && <SeleccionContratacionTab />}
        {activeTab === 'colaboradores' && <ColaboradoresTab />}
        {activeTab === 'onboarding' && <OnboardingInduccionTab />}
        {activeTab === 'formacion' && <FormacionReinduccionTab />}
        {activeTab === 'desempeno' && <DesempenoTab />}
      </div>
    </div>
  );
}
