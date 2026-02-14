/**
 * Página de Gestión de Proyectos PMI - Tab 6 de Dirección Estratégica
 *
 * Layout estandarizado:
 * 1. PageHeader (solo titulo y descripcion)
 * 2. DynamicSections (sub-tabs debajo del header, variante underline)
 * 3. StatsGrid con KPIs del portafolio
 * 4. Contenido de la sección activa (GestionProyectosTab)
 *
 * Sin hardcoding - secciones cargadas desde API
 */
import { FolderKanban, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';
import { GestionProyectosTab } from '../components/proyectos';
import { useProyectosDashboard } from '../hooks/useProyectos';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'gestion_proyectos';

export const ProyectosPage = () => {
  const { data: dashboard, isLoading: dashboardLoading } = useProyectosDashboard();

  // Hook que maneja secciones localmente (igual que PlaneacionPage)
  const {
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading: sectionsLoading,
  } = usePageSections({
    moduleCode: MODULE_CODE,
    tabCode: TAB_CODE,
  });

  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');

  // Calcular proyectos activos (en ejecución + monitoreo)
  const proyectosActivos = (dashboard?.en_ejecucion ?? 0) + (dashboard?.en_monitoreo ?? 0);
  const proyectosEnRiesgo = dashboard?.proyectos_rojo ?? 0;

  const statsItems: StatItem[] = [
    {
      label: 'Total Proyectos',
      value: dashboard?.total_proyectos ?? 0,
      icon: FolderKanban,
      iconColor: 'info',
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

  // Si no hay sección activa aún (cargando), mostrar skeleton básico
  if (!activeSection && sectionsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PageHeader solo titulo y descripcion */}
      <PageHeader title="Gestión de Proyectos" description={activeSectionData.description} />

      {/* Sub-tabs debajo del header (underline, color dinamico) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {/* StatsGrid con KPIs del portafolio */}
      {dashboardLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={statsItems} columns={4} moduleColor={moduleColor} />
      )}

      {/* Contenido de la sección activa */}
      {activeSection && <GestionProyectosTab activeSection={activeSection} />}
    </div>
  );
};

export default ProyectosPage;
