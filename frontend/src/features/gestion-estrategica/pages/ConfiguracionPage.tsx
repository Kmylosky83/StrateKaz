/**
 * Página de Configuración - Tab 1 de Dirección Estratégica
 *
 * Layout:
 * 1. PageHeader
 * 2. DynamicSections (sub-navigation desde API)
 * 3. StatsGrid dinámico según sección activa
 * 4. Contenido de la sección activa
 *
 * Sin hardcoding - secciones y stats cargadas desde API
 */
import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Plug,
  Activity,
  Package,
  Hash,
  FileText,
  Settings,
  Layers,
  Grid3X3,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  Calendar,
  Warehouse,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useConfiguracionStats } from '../hooks/useStrategic';
import { useTabSections } from '../hooks/useModules';
import { ConfiguracionTab } from '../components/ConfiguracionTab';

// Códigos del módulo y tab en la BD (lowercase para coincidir con BD)
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'configuracion';

// Mapeo de nombres de iconos (string) a componentes de lucide-react
const ICON_MAP: Record<string, LucideIcon> = {
  MapPin,
  Building2,
  Plug,
  Activity,
  Package,
  Hash,
  FileText,
  Settings,
  Layers,
  Grid3X3,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  Calendar,
  Warehouse,
  CheckCircle2,
};

export const ConfiguracionPage = () => {
  const { sections, isLoading: sectionsLoading } = useTabSections(MODULE_CODE, TAB_CODE);

  // Sección activa - inicializar con la primera sección habilitada
  const [activeSection, setActiveSection] = useState<string>('');

  // Establecer sección inicial cuando se cargan
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  // Hook para stats dinámicos según sección activa
  const { data: sectionStats, isLoading: statsLoading } = useConfiguracionStats(activeSection);

  // Mapear respuesta del backend a StatItem[]
  const statsItems: StatItem[] = useMemo(() => {
    if (!sectionStats?.stats || activeSection === 'branding') {
      return [];
    }

    return sectionStats.stats.map((stat) => ({
      label: stat.label,
      value: stat.value,
      icon: stat.icon ? ICON_MAP[stat.icon] || Settings : Settings,
      iconColor: stat.iconColor || 'primary',
      description: stat.description,
    }));
  }, [sectionStats, activeSection]);

  // Determinar número de columnas basado en cantidad de stats
  const statsColumns = useMemo(() => {
    const count = statsItems.length;
    if (count <= 2) return 2;
    if (count <= 3) return 3;
    return 4;
  }, [statsItems.length]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Gestiona el branding, módulos del sistema y configuración de consecutivos"
      />

      {/* Sub-navigation dinámica desde API */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        macroprocessColor="purple"
        variant="pills"
      />

      {/* StatsGrid dinámico - solo mostrar si no es branding y hay stats */}
      {activeSection !== 'branding' && (
        statsLoading ? (
          <StatsGridSkeleton count={4} />
        ) : statsItems.length > 0 ? (
          <StatsGrid stats={statsItems} columns={statsColumns} macroprocessColor="purple" />
        ) : null
      )}

      {/* Contenido de la sección activa */}
      <ConfiguracionTab activeSection={activeSection} />
    </div>
  );
};

export default ConfiguracionPage;
