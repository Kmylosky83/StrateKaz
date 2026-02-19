/**
 * PorterRadarChart - Gráfico Radar para las 5 Fuerzas de Porter
 * Sistema de Gestión StrateKaz
 *
 * Visualización impactante de la "huella competitiva":
 * - 5 ejes representando cada fuerza de Porter
 * - Área coloreada mostrando intensidad relativa
 * - Tooltips interactivos con detalle
 * - Animaciones suaves con Recharts
 * - Click en puntos para editar fuerza
 *
 * Escala de intensidad:
 * - Alto: 80-100
 * - Medio: 40-60
 * - Bajo: 10-30
 */

import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { useFuerzasPorter } from '../../hooks/useContexto';
import {
  TIPO_FUERZA_PORTER_CONFIG,
  NIVEL_IMPACTO_CONFIG,
  type FuerzaPorter,
  type TipoFuerzaPorter,
} from '../../types/contexto.types';
import { cn } from '@/utils/cn';

// ============================================================================
// TIPOS
// ============================================================================

interface PorterRadarChartProps {
  periodo: string;
  onEditFuerza?: (fuerza: FuerzaPorter) => void;
  onConfigureFuerza?: (tipo: TipoFuerzaPorter) => void;
  readOnly?: boolean;
}

interface RadarDataPoint {
  fuerza: string;
  intensidad: number;
  tipo: TipoFuerzaPorter;
  nivel: string;
  fullMark: number;
  data: FuerzaPorter | null;
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RadarDataPoint;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const config = TIPO_FUERZA_PORTER_CONFIG[data.tipo];
  const nivelConfig = data.data ? NIVEL_IMPACTO_CONFIG[data.data.nivel] : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs"
    >
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {config.label}
        </h4>
        {nivelConfig && (
          <Badge variant={nivelConfig.color} size="sm">
            {nivelConfig.label}
          </Badge>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {config.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-500">
          Intensidad:
        </span>
        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
          {data.intensidad}%
        </span>
      </div>

      {data.data?.factores && data.data.factores.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Factores clave:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
            {data.data.factores.slice(0, 2).map((factor, idx) => (
              <li key={idx} className="truncate">
                • {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// LEYENDA CON ACCIONES
// ============================================================================

interface FuerzaLegendItemProps {
  tipo: TipoFuerzaPorter;
  fuerza: FuerzaPorter | null;
  onEdit?: () => void;
  onConfigure?: () => void;
  readOnly?: boolean;
}

const FuerzaLegendItem = ({
  tipo,
  fuerza,
  onEdit,
  onConfigure,
  readOnly,
}: FuerzaLegendItemProps) => {
  const config = TIPO_FUERZA_PORTER_CONFIG[tipo];
  const nivelConfig = fuerza ? NIVEL_IMPACTO_CONFIG[fuerza.nivel] : null;

  const intensidad = fuerza
    ? fuerza.nivel === 'alto'
      ? 80
      : fuerza.nivel === 'medio'
        ? 50
        : 20
    : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
        fuerza
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
          : 'bg-gray-50 dark:bg-gray-900 border-dashed border-gray-300 dark:border-gray-600'
      )}
      onClick={() => {
        if (fuerza && onEdit) onEdit();
        else if (!fuerza && onConfigure) onConfigure();
      }}
    >
      <div className="flex items-center gap-3">
        {/* Indicador de color */}
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            fuerza
              ? fuerza.nivel === 'alto'
                ? 'bg-red-500'
                : fuerza.nivel === 'medio'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              : 'bg-gray-300 dark:bg-gray-600'
          )}
        />

        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {config.shortLabel}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fuerza ? `${intensidad}% intensidad` : 'Sin configurar'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {nivelConfig && (
          <Badge variant={nivelConfig.color} size="sm">
            {nivelConfig.label}
          </Badge>
        )}
        {!fuerza && !readOnly && (
          <Button variant="ghost" size="sm">
            Configurar
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const PorterRadarChart = ({
  periodo,
  onEditFuerza,
  onConfigureFuerza,
  readOnly,
}: PorterRadarChartProps) => {
  const { data, isLoading, error } = useFuerzasPorter({ periodo }, 1, 10);

  // Mapear fuerzas por tipo
  const fuerzasPorTipo = useMemo(() => {
    const fuerzas = data?.results || [];
    return {
      rivalidad: fuerzas.find((f) => f.tipo === 'rivalidad') || null,
      nuevos_entrantes: fuerzas.find((f) => f.tipo === 'nuevos_entrantes') || null,
      sustitutos: fuerzas.find((f) => f.tipo === 'sustitutos') || null,
      poder_proveedores: fuerzas.find((f) => f.tipo === 'poder_proveedores') || null,
      poder_clientes: fuerzas.find((f) => f.tipo === 'poder_clientes') || null,
    };
  }, [data?.results]);

  // Preparar datos para el radar
  const radarData: RadarDataPoint[] = useMemo(() => {
    const tipos: TipoFuerzaPorter[] = [
      'rivalidad',
      'nuevos_entrantes',
      'poder_clientes',
      'sustitutos',
      'poder_proveedores',
    ];

    return tipos.map((tipo) => {
      const fuerza = fuerzasPorTipo[tipo];
      const config = TIPO_FUERZA_PORTER_CONFIG[tipo];

      const intensidad = fuerza
        ? fuerza.nivel === 'alto'
          ? 80
          : fuerza.nivel === 'medio'
            ? 50
            : 20
        : 0;

      return {
        fuerza: config.shortLabel,
        intensidad,
        tipo,
        nivel: fuerza?.nivel || 'sin_configurar',
        fullMark: 100,
        data: fuerza,
      };
    });
  }, [fuerzasPorTipo]);

  // Calcular intensidad promedio
  const intensidadPromedio = useMemo(() => {
    const configuradas = radarData.filter((d) => d.data !== null);
    if (configuradas.length === 0) return 0;
    return Math.round(
      configuradas.reduce((sum, d) => sum + d.intensidad, 0) / configuradas.length
    );
  }, [radarData]);

  // Color del área según intensidad promedio
  const areaColor = useMemo(() => {
    if (intensidadPromedio >= 70) return '#ef4444'; // red-500
    if (intensidadPromedio >= 40) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  }, [intensidadPromedio]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando análisis Porter...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="error" title="Error">
          Error al cargar las fuerzas de Porter
        </Alert>
      </div>
    );
  }

  const fuerzasConfiguradas = Object.values(fuerzasPorTipo).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Radar Chart */}
      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Huella Competitiva
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Periodo: {periodo}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Intensidad Promedio
            </p>
            <p
              className={cn(
                'text-2xl font-bold',
                intensidadPromedio >= 70
                  ? 'text-red-600'
                  : intensidadPromedio >= 40
                    ? 'text-yellow-600'
                    : 'text-green-600'
              )}
            >
              {intensidadPromedio}%
            </p>
          </div>
        </div>

        {fuerzasConfiguradas === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-gray-400">
            <div className="w-32 h-32 mb-4 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-lg font-medium mb-2">Sin datos configurados</p>
            <p className="text-sm text-center max-w-xs">
              Configure al menos una fuerza de Porter para visualizar el radar
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid
                stroke="#e5e7eb"
                strokeDasharray="3 3"
                className="dark:stroke-gray-700"
              />
              <PolarAngleAxis
                dataKey="fuerza"
                tick={{
                  fill: '#6b7280',
                  fontSize: 12,
                  fontWeight: 500,
                }}
                className="dark:fill-gray-400"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
              />
              <Radar
                name="Intensidad"
                dataKey="intensidad"
                stroke={areaColor}
                fill={areaColor}
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{
                  r: 5,
                  fill: areaColor,
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 8,
                  fill: areaColor,
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {/* Indicadores de nivel */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Alto (70-100%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Medio (40-60%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Bajo (10-30%)
            </span>
          </div>
        </div>
      </Card>

      {/* Panel lateral con leyenda interactiva */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Fuerzas Competitivas
          </h3>
          <Badge
            variant={fuerzasConfiguradas === 5 ? 'success' : 'warning'}
            size="sm"
          >
            {fuerzasConfiguradas}/5
          </Badge>
        </div>

        <div className="space-y-3">
          {(
            [
              'rivalidad',
              'nuevos_entrantes',
              'poder_clientes',
              'sustitutos',
              'poder_proveedores',
            ] as TipoFuerzaPorter[]
          ).map((tipo) => (
            <FuerzaLegendItem
              key={tipo}
              tipo={tipo}
              fuerza={fuerzasPorTipo[tipo]}
              onEdit={() =>
                fuerzasPorTipo[tipo] && onEditFuerza?.(fuerzasPorTipo[tipo]!)
              }
              onConfigure={() => onConfigureFuerza?.(tipo)}
              readOnly={readOnly}
            />
          ))}
        </div>

        {/* Resumen */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Análisis de intensidad competitiva
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {intensidadPromedio >= 70
              ? 'El entorno competitivo es muy intenso. Se requieren estrategias defensivas sólidas.'
              : intensidadPromedio >= 40
                ? 'Competencia moderada. Hay oportunidades de diferenciación.'
                : fuerzasConfiguradas > 0
                  ? 'Entorno favorable. Aproveche las condiciones actuales para crecer.'
                  : 'Configure las fuerzas para obtener un análisis completo.'}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PorterRadarChart;
