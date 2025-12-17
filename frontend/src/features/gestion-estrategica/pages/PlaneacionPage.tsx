/**
 * Página de Planeación - Tab 4 de Dirección Estratégica
 *
 * Layout:
 * 1. PageHeader
 * 2. DynamicSections (sub-navigation desde API, si existen)
 * 3. StatsGrid
 * 4. Contenido de la sección activa
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { useState, useEffect } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useStrategicStats } from '../hooks/useStrategic';
import { useTabSections } from '../hooks/useModules';
import { PlaneacionTab } from '../components/PlaneacionTab';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'planeacion';

export const PlaneacionPage = () => {
  const { data: stats, isLoading: statsLoading } = useStrategicStats();
  const { sections, isLoading: sectionsLoading } = useTabSections(MODULE_CODE, TAB_CODE);

  // Sección activa - inicializar con la primera sección habilitada
  const [activeSection, setActiveSection] = useState<string>('');

  // Establecer sección inicial cuando se cargan
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  const avgProgress = stats?.avg_progress ?? 0;

  const statsItems: StatItem[] = [
    {
      label: 'Objetivos Estratégicos',
      value: stats?.total_objectives ?? 0,
      icon: Target,
      iconColor: 'primary',
      description: `${stats?.completed_objectives ?? 0} completados`,
    },
    {
      label: 'Progreso Promedio',
      value: `${avgProgress}%`,
      icon: TrendingUp,
      iconColor: avgProgress >= 50 ? 'success' : 'warning',
      description: stats?.active_plan_name ?? 'Sin plan activo',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planeación Estratégica"
        description="Gestiona el plan estratégico, objetivos BSC y mapa estratégico de la organización"
      />

      {/* Sub-navigation dinámica desde API (si existen secciones) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        macroprocessColor="purple"
        variant="pills"
      />

      {statsLoading ? (
        <StatsGridSkeleton count={2} />
      ) : (
        <StatsGrid stats={statsItems} columns={4} macroprocessColor="purple" />
      )}

      {/* Contenido */}
      <PlaneacionTab activeSection={activeSection} />
    </div>
  );
};

export default PlaneacionPage;
