/**
 * Pagina de Configuracion - Tab 1 de Direccion Estrategica
 *
 * Layout estandar:
 * - PageHeader con titulo y descripcion de la seccion activa
 * - Tabs de secciones en el Header global (via usePageHeader)
 * - Buscador contextual en el Header
 * - StatsGrid dinamico por seccion
 * - Contenido de la seccion activa
 */
import { useMemo } from 'react';
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
import { useConfiguracionStats } from '../hooks/useStrategic';
import { ConfiguracionTab } from '../components/ConfiguracionTab';
import { usePageHeader } from '@/hooks/usePageHeader';

// Codigos del modulo y tab en la BD
const MODULE_CODE = 'gestion_estrategica';
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
  // Hook que configura el Header automaticamente
  const {
    activeSection,
    activeSectionName,
    activeSectionDescription,
    searchQuery,
    isLoading: sectionsLoading,
  } = usePageHeader({
    moduleCode: MODULE_CODE,
    tabCode: TAB_CODE,
    moduleColor: 'purple',
    searchEnabled: true,
    searchPlaceholder: 'Buscar en configuracion...',
  });

  // Stats dinamicos segun seccion activa
  const { data: sectionStats, isLoading: statsLoading } = useConfiguracionStats(activeSection);

  // Mapear stats del backend a StatItem[]
  const statsItems: StatItem[] = useMemo(() => {
    // No mostrar stats en branding ni si no hay seccion activa
    if (!sectionStats?.stats || activeSection === 'branding' || !activeSection) {
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
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Titulo y descripcion de la seccion activa */}
      {activeSectionName && (
        <PageHeader title={activeSectionName} description={activeSectionDescription} />
      )}

      {/* StatsGrid - solo si hay stats y no es branding */}
      {activeSection !== 'branding' &&
        (statsLoading ? (
          <StatsGridSkeleton count={4} />
        ) : statsItems.length > 0 ? (
          <StatsGrid stats={statsItems} columns={statsColumns} moduleColor="purple" />
        ) : null)}

      {/* Contenido de la seccion activa */}
      {activeSection && (
        <ConfiguracionTab activeSection={activeSection} searchQuery={searchQuery} />
      )}
    </div>
  );
};

export default ConfiguracionPage;
