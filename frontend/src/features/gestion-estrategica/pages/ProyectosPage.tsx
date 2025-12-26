/**
 * Página de Gestión de Proyectos PMI - Tab 5 de Dirección Estratégica
 *
 * Layout:
 * 1. PageHeader
 * 2. DynamicSections (sub-navigation desde API, si existen)
 * 3. StatsGrid
 * 4. Contenido de la sección activa (GestionProyectosTab)
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { useState, useEffect } from 'react';
import { FolderKanban, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useTabSections } from '../hooks/useModules';
import { GestionProyectosTab } from '../components/proyectos';
import { useProyectosDashboard } from '../hooks/useProyectos';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'gestion_proyectos';

export const ProyectosPage = () => {
  const { data: dashboard, isLoading: dashboardLoading } = useProyectosDashboard();
  const { sections, isLoading: sectionsLoading } = useTabSections(MODULE_CODE, TAB_CODE);

  // Sección activa - inicializar con la primera sección habilitada
  const [activeSection, setActiveSection] = useState<string>('');

  // Establecer sección inicial cuando se cargan
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  // Calcular proyectos activos (en ejecución + monitoreo)
  const proyectosActivos = (dashboard?.en_ejecucion ?? 0) + (dashboard?.en_monitoreo ?? 0);
  const proyectosEnRiesgo = dashboard?.proyectos_rojo ?? 0;

  const statsItems: StatItem[] = [
    {
      label: 'Total Proyectos',
      value: dashboard?.total_proyectos ?? 0,
      icon: FolderKanban,
      iconColor: 'primary',
      description: `${proyectosActivos} activos`,
    },
    {
      label: 'En Ejecución',
      value: dashboard?.en_ejecucion ?? 0,
      icon: TrendingUp,
      iconColor: 'info',
      description: 'Proyectos en curso',
    },
    {
      label: 'En Riesgo',
      value: proyectosEnRiesgo,
      icon: AlertTriangle,
      iconColor: proyectosEnRiesgo > 0 ? 'danger' : 'success',
      description: 'Requieren atención',
    },
    {
      label: 'Completados',
      value: dashboard?.completados ?? 0,
      icon: CheckCircle2,
      iconColor: 'success',
      description: 'Finalizados exitosamente',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Proyectos"
        description="Administra el portafolio de proyectos con metodología PMI/PMBOK 7"
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

      {dashboardLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={statsItems} columns={4} macroprocessColor="purple" />
      )}

      {/* Contenido */}
      <GestionProyectosTab activeSection={activeSection} />
    </div>
  );
};

export default ProyectosPage;
