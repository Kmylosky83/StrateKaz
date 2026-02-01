/**
 * MapaEstrategicoTab - Tab principal del Mapa Estratégico BSC
 * Sistema de Gestión StrateKaz
 *
 * Wrapper que integra el canvas del mapa estratégico en la página de Planeación.
 * Incluye:
 * - SectionHeader con título y acciones
 * - StatsGrid con métricas del mapa
 * - MapaEstrategicoCanvas con el canvas interactivo
 * - Loading y error states
 */

import { useMemo } from 'react';
import { Map, Target, GitBranch, TrendingUp, Users, Cog, GraduationCap, DollarSign } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { Card, Spinner, Alert, Badge } from '@/components/common';
import { useMapaVisualizacion } from '../../hooks/useMapaEstrategico';
import { MapaEstrategicoCanvas } from './MapaEstrategicoCanvas';
import { BSC_PERSPECTIVE_CONFIG } from '../../types/mapa-estrategico.types';
import type { BSCPerspective } from '../../types/mapa-estrategico.types';

// ============================================================================
// TIPOS
// ============================================================================

interface MapaEstrategicoTabProps {
  planId: number;
  onEditObjective?: (id: number) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const MapaEstrategicoTab = ({ planId, onEditObjective }: MapaEstrategicoTabProps) => {
  const { data, isLoading, error } = useMapaVisualizacion(planId);

  // Calcular estadísticas
  const stats = useMemo<StatItem[]>(() => {
    if (!data) return [];

    const { stats: dataStats } = data;

    return [
      {
        label: 'Total Objetivos',
        value: dataStats.total_objetivos,
        icon: Target,
        iconColor: 'primary',
        description: 'En el mapa',
      },
      {
        label: 'Total Relaciones',
        value: dataStats.total_relaciones,
        icon: GitBranch,
        iconColor: 'info',
        description: 'Causa-efecto',
      },
      {
        label: 'Progreso Promedio',
        value: `${Math.round(dataStats.progreso_promedio)}%`,
        icon: TrendingUp,
        iconColor: dataStats.progreso_promedio >= 70 ? 'success' : dataStats.progreso_promedio >= 40 ? 'warning' : 'danger',
        description: 'De cumplimiento',
      },
    ];
  }, [data]);

  // Stats de perspectivas (segunda fila)
  const perspectiveStats = useMemo<StatItem[]>(() => {
    if (!data) return [];

    const { stats: dataStats } = data;
    const perspectives: BSCPerspective[] = ['FINANCIERA', 'CLIENTES', 'PROCESOS', 'APRENDIZAJE'];

    return perspectives.map((key) => {
      const config = BSC_PERSPECTIVE_CONFIG[key];
      const count = dataStats.objetivos_por_perspectiva[key] || 0;

      // Mapear icon name a componente
      const IconComponent = {
        DollarSign,
        Users,
        Cog,
        GraduationCap,
      }[config.icon] || Target;

      return {
        label: config.shortLabel,
        value: count,
        icon: IconComponent,
        iconColor: config.color === 'green' ? 'success' : config.color === 'blue' ? 'info' : config.color === 'amber' ? 'warning' : config.color === 'purple' ? 'primary' : 'gray',
        description: 'objetivos',
      };
    });
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Mapa Estratégico BSC"
          description="Visualización interactiva de objetivos y relaciones causa-efecto"
          icon={<Map className="h-5 w-5" />}
        />
        <Card>
          <div className="flex items-center justify-center h-96">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Cargando mapa estratégico...
            </span>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Mapa Estratégico BSC"
          description="Visualización interactiva de objetivos y relaciones causa-efecto"
          icon={<Map className="h-5 w-5" />}
        />
        <Alert variant="danger" title="Error">
          Error al cargar el mapa estratégico. Por favor, intente nuevamente.
        </Alert>
      </div>
    );
  }

  // Sin datos
  if (!data) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Mapa Estratégico BSC"
          description="Visualización interactiva de objetivos y relaciones causa-efecto"
          icon={<Map className="h-5 w-5" />}
        />
        <Alert variant="info" title="Sin datos">
          No se pudo cargar la información del mapa estratégico.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Mapa Estratégico BSC"
        description="Visualización interactiva de objetivos y relaciones causa-efecto"
        icon={<Map className="h-5 w-5" />}
      />

      {/* Stats Grid - Primera fila (métricas generales) */}
      <StatsGrid stats={stats} columns={3} moduleColor="purple" />

      {/* Stats Grid - Segunda fila (por perspectiva) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Objetivos por Perspectiva BSC
        </h3>
        <StatsGrid stats={perspectiveStats} columns={4} variant="compact" moduleColor="purple" />
      </div>

      {/* Información del mapa */}
      {data.mapa && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {data.mapa.name}
              </h3>
              {data.mapa.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {data.mapa.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={data.mapa.is_active ? 'success' : 'gray'} size="sm">
                {data.mapa.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant="outline" size="sm">
                v{data.mapa.version}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Canvas del Mapa */}
      <MapaEstrategicoCanvas
        planId={planId}
        height={800}
        onEditObjective={onEditObjective}
      />

      {/* Ayuda */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Map className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Cómo usar el Mapa Estratégico
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Arrastra los nodos para reorganizar el mapa según tu preferencia</li>
              <li>• Conecta objetivos arrastrando desde los puntos de conexión para crear relaciones causa-efecto</li>
              <li>• Haz doble clic en un objetivo para editarlo</li>
              <li>• Haz doble clic en una relación para eliminarla</li>
              <li>• Usa los controles del toolbar para zoom, ajustar vista y guardar cambios</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
