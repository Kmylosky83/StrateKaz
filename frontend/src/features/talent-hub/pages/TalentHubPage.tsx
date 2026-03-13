/**
 * Pagina Principal: Talent Hub - Gestion del Talento Humano
 * Sistema de Gestion StrateKaz
 *
 * Modulo 10 - Nivel Habilitadores
 *
 * Arquitectura route-based: El sidebar controla la navegacion.
 * Cada ruta /talento/{seccion} renderiza su componente correspondiente.
 * NO usa tabs internos — el sidebar ES la navegacion.
 *
 * Secciones (ciclo de vida del empleado):
 * 1. Estructura de Cargos — CRUD cargos, profesiogramas, GTC-45
 * 2. Seleccion/Contratacion — Candidatos, entrevistas, pruebas
 * 3. Colaboradores — CRUD empleados, hojas de vida, historial
 * 4. Onboarding/Induccion — Procesos de induccion, checklist, EPP
 * 5. Formacion/Reinduccion — LMS, capacitaciones, certificados
 * 6. Desempeno — Evaluaciones 360, planes de mejora
 * 7. Control de Tiempo — Turnos, asistencia, horas extra
 * 8. Novedades — Incapacidades, permisos, vacaciones
 * 9. Proceso Disciplinario — Llamados, descargos, memorandos
 * 10. Nomina — Periodos, conceptos, liquidaciones
 * 11. Off-Boarding — Salida, checklist, paz y salvo
 */
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Network,
  UserPlus,
  Users,
  Rocket,
  BookOpen,
  Award,
  Clock,
  Bell,
  Gavel,
  DollarSign,
  LogOut,
  UserCog,
} from 'lucide-react';

// Secciones implementadas
import { EstructuraSection } from '../components/estructura';
import { SeleccionSection } from '../components/seleccion';
import { ColaboradoresSection } from '../components/colaboradores';
import { OnboardingSection } from '../components/onboarding';
import { FormacionSection } from '../components/formacion';
import { DesempenoSection } from '../components/desempeno';
import { ControlTiempoSection } from '../components/control-tiempo';
import { NovedadesSection } from '../components/novedades';
import { ProcesoDisciplinarioSection } from '../components/proceso-disciplinario';
import { NominaSection } from '../components/nomina';
import { OffBoardingSection } from '../components/off-boarding';
import { ConsultoresExternosSection } from '../components/consultores-externos';

// ============================================================================
// Mapa de secciones por ruta
// ============================================================================

/** Metadata de cada seccion del ciclo de vida */
interface SectionMeta {
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

/**
 * Mapeo ruta -> seccion.
 * Las secciones con component: null muestran EmptyState (pendiente implementacion).
 * A medida que se implementen, reemplazar null con el componente real.
 */
const SECTION_MAP: Record<string, SectionMeta> = {
  estructura: {
    title: 'Estructura de Cargos',
    description: 'Cargos, profesiogramas, organigrama y permisos RBAC',
    icon: <Network className="w-5 h-5" />,
    component: EstructuraSection,
  },
  seleccion: {
    title: 'Selección y Contratación',
    description: 'Reclutamiento, candidatos, entrevistas, pruebas y contratación de personal',
    icon: <UserPlus className="w-5 h-5" />,
    component: SeleccionSection,
  },
  colaboradores: {
    title: 'Colaboradores',
    description: 'Directorio de empleados, hojas de vida, información personal e historial laboral',
    icon: <Users className="w-5 h-5" />,
    component: ColaboradoresSection,
  },
  onboarding: {
    title: 'Onboarding e Inducción',
    description:
      'Procesos de inducción, checklist de actividades, entregas de EPP y firma de documentos',
    icon: <Rocket className="w-5 h-5" />,
    component: OnboardingSection,
  },
  formacion: {
    title: 'Formación y Reinducción',
    description: 'Planes de formación, capacitaciones, gamificación, certificados y reinducciones',
    icon: <BookOpen className="w-5 h-5" />,
    component: FormacionSection,
  },
  desempeno: {
    title: 'Desempeño',
    description: 'Evaluaciones 360, planes de mejora, seguimientos y programa de reconocimientos',
    icon: <Award className="w-5 h-5" />,
    component: DesempenoSection,
  },
  'control-tiempo': {
    title: 'Control de Tiempo',
    description: 'Turnos, asistencia, horas extra, tardanzas y consolidación mensual',
    icon: <Clock className="w-5 h-5" />,
    component: ControlTiempoSection,
  },
  novedades: {
    title: 'Novedades',
    description: 'Incapacidades, permisos, licencias, vacaciones y ausencias',
    icon: <Bell className="w-5 h-5" />,
    component: NovedadesSection,
  },
  disciplinario: {
    title: 'Proceso Disciplinario',
    description: 'Llamados de atención, descargos, memorandos e historial disciplinario',
    icon: <Gavel className="w-5 h-5" />,
    component: ProcesoDisciplinarioSection,
  },
  nomina: {
    title: 'Nómina',
    description: 'Configuración de conceptos, períodos de pago, liquidaciones y reportes',
    icon: <DollarSign className="w-5 h-5" />,
    component: NominaSection,
  },
  'off-boarding': {
    title: 'Off-Boarding',
    description: 'Proceso de salida, checklist de entrega, paz y salvo y liquidación final',
    icon: <LogOut className="w-5 h-5" />,
    component: OffBoardingSection,
  },
  'consultores-externos': {
    title: 'Consultores Externos',
    description: 'Consultores y contratistas externos vinculados a la organización',
    icon: <UserCog className="w-5 h-5" />,
    component: ConsultoresExternosSection,
  },
};

// ============================================================================
// Componente Principal
// ============================================================================

export default function TalentHubPage() {
  const location = useLocation();

  // Extraer la seccion activa de la ruta: /talento/estructura -> "estructura"
  const activeKey = location.pathname.split('/talento/')[1]?.split('/')[0] || 'estructura';
  const section = SECTION_MAP[activeKey] || SECTION_MAP.estructura;

  const SectionComponent = section.component;

  return (
    <div className="space-y-6">
      <PageHeader title={section.title} description={section.description} />

      {SectionComponent ? (
        <SectionComponent />
      ) : (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                {section.icon}
              </div>
            }
            title={section.title}
            description={`Modulo en desarrollo. ${section.description}`}
          />
        </Card>
      )}
    </div>
  );
}
