/**
 * Pagina de Planificacion del Sistema - Tab de Soporte Estrategico
 *
 * Secciones (desde BD):
 * - plan_trabajo: Cronograma de trabajo
 * - objetivos: Objetivos del sistema
 * - programas: Programas de gestion
 * - seguimiento: Seguimiento y control
 */
import { useState, useEffect } from 'react';
import { Calendar, Target, Layers, TrendingUp } from 'lucide-react';
import { PageHeader, StatsGrid } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections, GenericSectionFallback } from '@/components/common';
import { useTabSections } from '@/features/gestion-estrategica/hooks/useModules';
import { useModuleColor } from '@/hooks/useModuleColor';

const MODULE_CODE = 'soporte_estrategico';
const TAB_CODE = 'planificacion_sistema';

export const PlanificacionSistemaPage = () => {
  const { color: moduleColor } = useModuleColor('SOPORTE_ESTRATEGICO');
  const { sections, isLoading: sectionsLoading } = useTabSections(MODULE_CODE, TAB_CODE);

  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  const statsItems: StatItem[] = [
    {
      label: 'Actividades Plan',
      value: '-',
      icon: Calendar,
      iconColor: 'info',
      description: 'En cronograma',
    },
    {
      label: 'Objetivos',
      value: '-',
      icon: Target,
      iconColor: 'success',
      description: 'Del sistema',
    },
    {
      label: 'Programas',
      value: '-',
      icon: Layers,
      iconColor: 'warning',
      description: 'Activos',
    },
    {
      label: 'Cumplimiento',
      value: '-',
      icon: TrendingUp,
      iconColor: 'success',
      description: 'Avance general',
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'plan_trabajo':
      case 'objetivos':
      case 'programas':
      case 'seguimiento':
        return (
          <GenericSectionFallback
            sectionCode={activeSection}
            parentName="Planificacion del Sistema"
          />
        );
      default:
        return (
          <GenericSectionFallback
            sectionCode={activeSection || 'ninguna'}
            parentName="Planificacion del Sistema"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planificacion del Sistema"
        description="Planificacion y seguimiento del sistema de gestion (ISO 9001:2015 Clausula 6.2)"
      />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        moduleColor={moduleColor}
        variant="pills"
      />

      <StatsGrid stats={statsItems} columns={4} moduleColor={moduleColor} />

      <div className="space-y-6">{renderSection()}</div>
    </div>
  );
};

export default PlanificacionSistemaPage;
