/**
 * StakeholderMatrix - Matriz Visual Poder-Interes con Recharts
 *
 * Visualizacion interactiva de stakeholders usando ScatterChart:
 * - Eje X: Nivel de Interes (Bajo → Alto)
 * - Eje Y: Nivel de Influencia/Poder (Bajo → Alto)
 *
 * Cuadrantes:
 * - Superior Derecho (Alta Influencia + Alto Interes): Gestionar de Cerca
 * - Superior Izquierdo (Alta Influencia + Bajo Interes): Mantener Satisfecho
 * - Inferior Derecho (Baja Influencia + Alto Interes): Mantener Informado
 * - Inferior Izquierdo (Baja Influencia + Bajo Interes): Monitorear
 *
 * ISO 9001:2015 Clausula 4.2 - Partes Interesadas
 */
import { useMemo, useCallback } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
  Label,
} from 'recharts';
import { Zap, Shield, Bell, Eye, Users, Building2, Globe, AlertTriangle, Info } from 'lucide-react';
import { Tooltip } from '@/components/common/Tooltip';
import { Card } from '@/components/common/Card';
import type { ParteInteresada } from '../../api/partesInteresadasApi';

// =============================================================================
// TIPOS
// =============================================================================

interface StakeholderMatrixProps {
  /** Lista de stakeholders a mostrar */
  stakeholders: ParteInteresada[];
  /** Handler al hacer click en un stakeholder */
  onStakeholderClick?: (stakeholder: ParteInteresada) => void;
  /** Color del modulo */
  moduleColor?: 'purple' | 'blue' | 'green' | 'orange' | 'gray';
  /** Mostrar leyenda */
  showLegend?: boolean;
  /** Altura del componente */
  height?: number;
}

type CuadranteKey = 'gestionar_cerca' | 'mantener_satisfecho' | 'mantener_informado' | 'monitorear';

interface CuadranteConfig {
  key: CuadranteKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface ScatterDataPoint {
  x: number;
  y: number;
  z: number;
  stakeholder: ParteInteresada;
  cuadrante: CuadranteKey;
}

// =============================================================================
// CONFIGURACION DE CUADRANTES
// =============================================================================

const CUADRANTES_CONFIG: Record<CuadranteKey, CuadranteConfig> = {
  gestionar_cerca: {
    key: 'gestionar_cerca',
    label: 'Gestionar de Cerca',
    shortLabel: 'Gestionar',
    description: 'Alta influencia + Alto interés: Máxima atención',
    icon: Zap,
    color: '#dc2626', // red-600
    bgColor: 'rgba(254, 202, 202, 0.4)', // red-200/40
  },
  mantener_satisfecho: {
    key: 'mantener_satisfecho',
    label: 'Mantener Satisfecho',
    shortLabel: 'Satisfecho',
    description: 'Alta influencia + Bajo interes: Satisfacer necesidades',
    icon: Shield,
    color: '#d97706', // amber-600
    bgColor: 'rgba(253, 230, 138, 0.4)', // amber-200/40
  },
  mantener_informado: {
    key: 'mantener_informado',
    label: 'Mantener Informado',
    shortLabel: 'Informado',
    description: 'Baja influencia + Alto interes: Comunicacion activa',
    icon: Bell,
    color: '#2563eb', // blue-600
    bgColor: 'rgba(191, 219, 254, 0.4)', // blue-200/40
  },
  monitorear: {
    key: 'monitorear',
    label: 'Monitorear',
    shortLabel: 'Monitorear',
    description: 'Baja influencia + Bajo interes: Supervision minima',
    icon: Eye,
    color: '#6b7280', // gray-500
    bgColor: 'rgba(229, 231, 235, 0.4)', // gray-200/40
  },
};

// Mapeo de niveles a valores numericos
const INFLUENCIA_VALUES: Record<string, number> = {
  alta: 3,
  media: 2,
  baja: 1,
};

const INTERES_VALUES: Record<string, number> = {
  alto: 3,
  medio: 2,
  bajo: 1,
};

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Determina el cuadrante de un stakeholder basado en influencia e interes
 */
const getCuadrante = (stakeholder: ParteInteresada): CuadranteKey => {
  const influenciaAlta = stakeholder.nivel_influencia_pi === 'alta';
  const interesAlto = stakeholder.nivel_interes === 'alto';

  if (influenciaAlta && interesAlto) return 'gestionar_cerca';
  if (influenciaAlta && !interesAlto) return 'mantener_satisfecho';
  if (!influenciaAlta && interesAlto) return 'mantener_informado';
  return 'monitorear';
};

/**
 * Genera jitter deterministico basado en el ID para evitar solapamiento
 */
const deterministicJitter = (id: number, maxJitter = 0.35): number => {
  const x = Math.sin(id * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * maxJitter * 2 - maxJitter;
};

/**
 * Convierte stakeholder a punto de scatter con jitter deterministico
 */
const stakeholderToScatterPoint = (stakeholder: ParteInteresada): ScatterDataPoint => {
  const baseX = INTERES_VALUES[stakeholder.nivel_interes] || 2;
  const baseY = INFLUENCIA_VALUES[stakeholder.nivel_influencia_pi] || 2;

  // Jitter deterministico basado en el ID
  const jitterX = deterministicJitter(stakeholder.id);
  const jitterY = deterministicJitter(stakeholder.id * 7);

  return {
    x: Math.max(0.6, Math.min(3.4, baseX + jitterX)),
    y: Math.max(0.6, Math.min(3.4, baseY + jitterY)),
    z: 180,
    stakeholder,
    cuadrante: getCuadrante(stakeholder),
  };
};

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScatterDataPoint }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const stakeholder = data.stakeholder;
  const config = CUADRANTES_CONFIG[data.cuadrante];
  const Icon = stakeholder.tipo_categoria === 'interna' ? Building2 : Globe;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 border border-gray-200 dark:border-gray-700 max-w-xs z-50">
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{stakeholder.nombre}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{stakeholder.tipo_nombre}</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs">
          <config.icon className="h-3.5 w-3.5" style={{ color: config.color }} />
          <span className="font-medium" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs text-gray-600 dark:text-gray-400">
          <span>
            Influencia:{' '}
            <strong>
              {stakeholder.nivel_influencia_pi_display || stakeholder.nivel_influencia_pi}
            </strong>
          </span>
          <span>
            Interes:{' '}
            <strong>{stakeholder.nivel_interes_display || stakeholder.nivel_interes}</strong>
          </span>
        </div>
      </div>
      {stakeholder.representante && (
        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          Contacto: {stakeholder.representante}
        </p>
      )}
      <p className="text-[10px] text-gray-400 mt-2 italic">Clic para editar</p>
    </div>
  );
};

// =============================================================================
// LEYENDA DE CUADRANTES
// =============================================================================

interface QuadrantLegendProps {
  stats: Record<CuadranteKey, number>;
}

const QuadrantLegend = ({ stats }: QuadrantLegendProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
      {Object.entries(CUADRANTES_CONFIG).map(([key, config]) => {
        const count = stats[key as CuadranteKey];
        return (
          <div
            key={key}
            className="flex items-center gap-2 p-2.5 rounded-lg border"
            style={{
              backgroundColor: config.bgColor,
              borderColor: config.color + '40',
            }}
          >
            <div className="p-1.5 rounded-md" style={{ backgroundColor: config.color + '20' }}>
              <config.icon className="h-4 w-4" style={{ color: config.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {config.shortLabel}
              </p>
              <p className="text-lg font-bold" style={{ color: config.color }}>
                {count}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const StakeholderMatrix = ({
  stakeholders,
  onStakeholderClick,
  showLegend = true,
  height = 420,
}: StakeholderMatrixProps) => {
  // Convertir stakeholders a puntos de scatter
  const scatterData = useMemo(() => {
    return stakeholders.map((s) => stakeholderToScatterPoint(s));
  }, [stakeholders]);

  // Estadisticas por cuadrante
  const stats = useMemo(() => {
    const result: Record<CuadranteKey, number> = {
      gestionar_cerca: 0,
      mantener_satisfecho: 0,
      mantener_informado: 0,
      monitorear: 0,
    };

    scatterData.forEach((point) => {
      result[point.cuadrante]++;
    });

    return result;
  }, [scatterData]);

  // Total stats
  const totalStats = useMemo(
    () => ({
      total: stakeholders.length,
      criticos: stats.gestionar_cerca,
    }),
    [stakeholders.length, stats]
  );

  // Handler para click en punto
  const handlePointClick = useCallback(
    (data: { payload: ScatterDataPoint }) => {
      if (onStakeholderClick && data?.payload?.stakeholder) {
        onStakeholderClick(data.payload.stakeholder);
      }
    },
    [onStakeholderClick]
  );

  if (stakeholders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No hay stakeholders para visualizar</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con estadisticas */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span className="font-medium">{totalStats.total}</span>
            <span>stakeholders</span>
          </div>
          {totalStats.criticos > 0 && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{totalStats.criticos}</span>
              <span>requieren atencion prioritaria</span>
            </div>
          )}
          <Tooltip
            content={
              <div className="max-w-xs text-xs">
                <p className="font-medium mb-1">Matriz Poder-Interes</p>
                <p>
                  Posicione el cursor sobre cada punto para ver detalles. Haga clic para editar.
                </p>
              </div>
            }
          >
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </div>
      )}

      {/* Grafico Scatter */}
      <Card className="p-4 overflow-hidden">
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 70 }}>
            {/* Grid de fondo */}
            <CartesianGrid strokeDasharray="3 3" className="opacity-40" />

            {/* Areas de cuadrantes con colores */}
            <ReferenceArea
              x1={0.5}
              x2={2}
              y1={2}
              y2={3.5}
              fill={CUADRANTES_CONFIG.mantener_satisfecho.bgColor}
              fillOpacity={1}
            />
            <ReferenceArea
              x1={2}
              x2={3.5}
              y1={2}
              y2={3.5}
              fill={CUADRANTES_CONFIG.gestionar_cerca.bgColor}
              fillOpacity={1}
            />
            <ReferenceArea
              x1={0.5}
              x2={2}
              y1={0.5}
              y2={2}
              fill={CUADRANTES_CONFIG.monitorear.bgColor}
              fillOpacity={1}
            />
            <ReferenceArea
              x1={2}
              x2={3.5}
              y1={0.5}
              y2={2}
              fill={CUADRANTES_CONFIG.mantener_informado.bgColor}
              fillOpacity={1}
            />

            {/* Lineas divisorias centrales */}
            <ReferenceLine x={2} stroke="#9ca3af" strokeWidth={2} strokeDasharray="8 4" />
            <ReferenceLine y={2} stroke="#9ca3af" strokeWidth={2} strokeDasharray="8 4" />

            {/* Ejes */}
            <XAxis
              type="number"
              dataKey="x"
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(value) => {
                if (value === 1) return 'Bajo';
                if (value === 2) return 'Medio';
                if (value === 3) return 'Alto';
                return '';
              }}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            >
              <Label
                value="NIVEL DE INTERES"
                position="bottom"
                offset={25}
                style={{
                  fill: '#6b7280',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(value) => {
                if (value === 1) return 'Bajo';
                if (value === 2) return 'Medio';
                if (value === 3) return 'Alto';
                return '';
              }}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            >
              <Label
                value="NIVEL DE INFLUENCIA (Poder)"
                position="insideLeft"
                angle={-90}
                offset={-5}
                style={{
                  textAnchor: 'middle',
                  fill: '#6b7280',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              />
            </YAxis>

            <ZAxis type="number" dataKey="z" range={[120, 200]} />

            {/* Tooltip personalizado */}
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: '#9ca3af' }}
              wrapperStyle={{ zIndex: 100 }}
            />

            {/* Puntos de scatter */}
            <Scatter data={scatterData} onClick={handlePointClick} cursor="pointer">
              {scatterData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CUADRANTES_CONFIG[entry.cuadrante].color}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      {/* Leyenda de cuadrantes */}
      {showLegend && <QuadrantLegend stats={stats} />}

      {/* Descripcion de estrategias */}
      <details className="text-xs text-gray-500 dark:text-gray-400">
        <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 font-medium">
          Ver estrategias por cuadrante
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pl-4">
          {Object.values(CUADRANTES_CONFIG).map((config) => (
            <div
              key={config.key}
              className="flex items-start gap-2 p-2 rounded-lg border"
              style={{
                backgroundColor: config.bgColor,
                borderColor: config.color + '30',
              }}
            >
              <config.icon
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: config.color }}
              />
              <div>
                <span className="font-medium" style={{ color: config.color }}>
                  {config.label}:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{config.description}</span>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default StakeholderMatrix;
