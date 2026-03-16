/**
 * MiEquipoModulePage — Módulo Mi Equipo (Cascada V2)
 *
 * Ciclo de vinculación del colaborador:
 * 1. Perfiles de Cargo — Requisitos, competencias y SST por cargo
 * 2. Selección y Contratación — Vacantes, candidatos, contratación
 * 3. Colaboradores — Directorio, hojas de vida, contratos
 * 4. Onboarding — Inducción, afiliaciones, dotación
 *
 * Arquitectura route-based: el sidebar controla la navegación.
 * Cada ruta /mi-equipo/{seccion} renderiza su componente correspondiente.
 */
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Briefcase, UserPlus, Users, Rocket } from 'lucide-react';

import { PerfilesCargoSection } from '../components/perfiles-cargo';
import { SeleccionSection } from '../components/seleccion';
import { ColaboradoresSection } from '../components/colaboradores';
import { OnboardingSection } from '../components/onboarding';

interface SectionMeta {
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

const SECTION_MAP: Record<string, SectionMeta> = {
  'perfiles-cargo': {
    title: 'Perfiles de Cargo',
    description: 'Requisitos de formación, competencias, experiencia y SST por cargo',
    icon: <Briefcase className="w-5 h-5" />,
    component: PerfilesCargoSection,
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
};

const DEFAULT_SECTION = 'perfiles-cargo';

export default function MiEquipoModulePage() {
  const location = useLocation();

  const activeKey = location.pathname.split('/mi-equipo/')[1]?.split('/')[0] || DEFAULT_SECTION;
  const section = SECTION_MAP[activeKey] || SECTION_MAP[DEFAULT_SECTION];

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
              <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">{section.icon}</div>
            }
            title={section.title}
            description={`Módulo en desarrollo. ${section.description}`}
          />
        </Card>
      )}
    </div>
  );
}
