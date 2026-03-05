/**
 * Pagina de Configuracion - Tab 1 de Direccion Estrategica
 *
 * Layout estandarizado:
 * 1. PageHeader (solo titulo y descripcion)
 * 2. DynamicSections (sub-tabs debajo del header, variante underline)
 * 3. StatsGrid dinamico por seccion
 * 4. Contenido de la seccion activa
 */
import { useMemo, useState } from 'react';
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
  Search,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader, StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { useConfiguracionStats } from '../hooks/useStrategic';
import { ConfiguracionTab } from '../components/ConfiguracionTab';
import { usePageSections } from '@/hooks/usePageSections';

// Codigos del modulo y tab en la BD
const MODULE_CODE = 'fundacion';
const TAB_CODE = 'configuracion';

// Mapeo de nombres de iconos a componentes
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
  // Hook que maneja secciones localmente (sin HeaderContext)
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

  // Buscador local
  const [searchQuery, setSearchQuery] = useState('');

  // Stats dinamicos segun seccion activa
  const { data: sectionStats, isLoading: statsLoading } = useConfiguracionStats(activeSection);

  // Secciones que no tienen StatsGrid
  const SECTIONS_WITHOUT_STATS = ['normas_iso', 'modulos'];

  // Mapear stats del backend a StatItem[]
  const statsItems: StatItem[] = useMemo(() => {
    // No mostrar stats en secciones que no lo necesitan
    if (!sectionStats?.stats || !activeSection || SECTIONS_WITHOUT_STATS.includes(activeSection)) {
      return [];
    }

    return sectionStats.stats.map((stat) => ({
      label: stat.label,
      value: stat.value,
      icon: stat.icon ? ICON_MAP[stat.icon] || Settings : Settings,
      iconColor: stat.iconColor || 'info',
      description: stat.description,
    }));
  }, [sectionStats, activeSection]);

  // Columnas del grid segun cantidad de stats
  const statsColumns = useMemo(() => {
    const count = statsItems.length;
    if (count <= 2) return 2;
    if (count <= 3) return 3;
    return 4;
  }, [statsItems.length]);

  // Si no hay seccion activa aun (cargando), mostrar skeleton
  if (!activeSection && sectionsLoading) {
    return (
      <div className="space-y-4">
        <StatsGridSkeleton count={4} />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PageHeader solo titulo y descripcion */}
      <PageHeader title="Configuración" description={activeSectionData.description} />

      {/* Sub-tabs debajo del header (underline, color dinamico) */}
      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {/* StatsGrid - solo si hay stats y la sección lo soporta */}
      {activeSection &&
        !SECTIONS_WITHOUT_STATS.includes(activeSection) &&
        (statsLoading ? (
          <StatsGridSkeleton count={4} />
        ) : statsItems.length > 0 ? (
          <StatsGrid stats={statsItems} columns={statsColumns} moduleColor={moduleColor} />
        ) : null)}

      {/* Contenido de la seccion activa */}
      {activeSection && (
        <ConfiguracionTab activeSection={activeSection} searchQuery={searchQuery} />
      )}
    </div>
  );
};

export default ConfiguracionPage;
