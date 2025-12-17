/**
 * Página de Identidad - Tab 3 de Dirección Estratégica
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
import { Compass, FileCheck } from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useStrategicStats } from '../hooks/useStrategic';
import { useTabSections } from '../hooks/useModules';
import { IdentidadTab } from '../components/IdentidadTab';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'identidad';

export const IdentidadPage = () => {
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

  const hasIdentity = stats?.completeness_details?.has_identity ?? false;

  const statsItems: StatItem[] = [
    {
      label: 'Versión Actual',
      value: stats?.identity_version ?? '-',
      icon: Compass,
      iconColor: 'primary',
      description: 'Identidad corporativa vigente',
    },
    {
      label: 'Identidad Configurada',
      value: hasIdentity ? 'Completa' : 'Pendiente',
      icon: FileCheck,
      iconColor: hasIdentity ? 'success' : 'warning',
      description: hasIdentity
        ? 'Misión, visión y valores definidos'
        : 'Requiere configuración',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identidad Corporativa"
        description="Gestiona la misión, visión, valores y política integral de la organización"
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

      {/* Contenido - IdentidadTab maneja sus propios tabs internos */}
      <IdentidadTab activeSection={activeSection} />
    </div>
  );
};

export default IdentidadPage;
