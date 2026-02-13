/**
 * ResultadosPsicometricosModal - Visualizacion de resultados psicometricos
 * Muestra grafico radar SVG + tabla de dimensiones + interpretacion
 *
 * Interpreta scoring_config.escalas de la PlantillaPruebaDinamica
 * para calcular puntajes por dimension a partir de las respuestas.
 *
 * Soporta modelos: DISC, Big Five (OCEAN), y cualquier modelo con escalas definidas.
 */
import { useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AsignacionPruebaList } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface EscalaConfig {
  nombre: string;
  descripcion: string;
  campos: string[];
  color: string;
}

interface ScoringConfig {
  tipo?: string;
  modelo?: string;
  escalas: Record<string, EscalaConfig>;
  escala_min: number;
  escala_max: number;
  preguntas_por_escala: number;
  puntaje_max_escala: number;
}

interface DimensionResult {
  key: string;
  nombre: string;
  descripcion: string;
  color: string;
  puntaje: number;
  maximo: number;
  porcentaje: number;
  nivel: 'bajo' | 'medio' | 'alto';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  asignacion: AsignacionPruebaList | null;
  /** scoring_config from the PlantillaPruebaDetail */
  scoringConfig: ScoringConfig | null;
  /** respuestas from the AsignacionPruebaDetail: {nombre_campo: valor} */
  respuestas: Record<string, number> | null;
}

// ============================================================================
// Helpers
// ============================================================================

function calcularDimensiones(
  scoringConfig: ScoringConfig,
  respuestas: Record<string, number>
): DimensionResult[] {
  const { escalas, puntaje_max_escala } = scoringConfig;
  const maxEscala = puntaje_max_escala || 25;

  return Object.entries(escalas).map(([key, escala]) => {
    const puntaje = escala.campos.reduce((sum, campo) => {
      const val = Number(respuestas[campo]) || 0;
      return sum + val;
    }, 0);

    const porcentaje = maxEscala > 0 ? Math.round((puntaje / maxEscala) * 100) : 0;
    const nivel: 'bajo' | 'medio' | 'alto' =
      porcentaje >= 70 ? 'alto' : porcentaje >= 40 ? 'medio' : 'bajo';

    return {
      key,
      nombre: escala.nombre,
      descripcion: escala.descripcion,
      color: escala.color,
      puntaje,
      maximo: maxEscala,
      porcentaje,
      nivel,
    };
  });
}

function getNivelBadge(nivel: 'bajo' | 'medio' | 'alto') {
  switch (nivel) {
    case 'alto':
      return { variant: 'success' as const, label: 'Alto' };
    case 'medio':
      return { variant: 'warning' as const, label: 'Medio' };
    case 'bajo':
      return { variant: 'gray' as const, label: 'Bajo' };
  }
}

function getNivelIcon(nivel: 'bajo' | 'medio' | 'alto') {
  switch (nivel) {
    case 'alto':
      return TrendingUp;
    case 'medio':
      return Minus;
    case 'bajo':
      return TrendingDown;
  }
}

// ============================================================================
// Radar Chart (SVG)
// ============================================================================

interface RadarChartProps {
  dimensiones: DimensionResult[];
  size?: number;
}

const RadarChart = ({ dimensiones, size = 280 }: RadarChartProps) => {
  const center = size / 2;
  const radius = size * 0.38;
  const n = dimensiones.length;

  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;
  // Start from top (-PI/2)
  const startAngle = -Math.PI / 2;

  // Get point coordinates
  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = radius * (value / 100);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];

  // Data polygon path
  const dataPath =
    dimensiones
      .map((d, i) => {
        const pt = getPoint(i, d.porcentaje);
        return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
      })
      .join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const path =
          dimensiones
            .map((_, i) => {
              const pt = getPoint(i, level);
              return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
            })
            .join(' ') + ' Z';
        return (
          <path
            key={level}
            d={path}
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeWidth={level === 100 ? 1.5 : 0.5}
          />
        );
      })}

      {/* Axis lines */}
      {dimensiones.map((_, i) => {
        const pt = getPoint(i, 100);
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={pt.x}
            y2={pt.y}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data polygon (filled) */}
      <path
        d={dataPath}
        fill="rgba(139, 92, 246, 0.15)"
        stroke="#8B5CF6"
        strokeWidth={2}
        className="dark:fill-violet-500/20"
      />

      {/* Data points */}
      {dimensiones.map((d, i) => {
        const pt = getPoint(i, d.porcentaje);
        return (
          <circle
            key={`point-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill={d.color}
            stroke="white"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Labels */}
      {dimensiones.map((d, i) => {
        const pt = getPoint(i, 120);
        return (
          <text
            key={`label-${i}`}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-600 dark:fill-gray-400"
            fontSize={11}
            fontWeight={600}
          >
            {d.key}
          </text>
        );
      })}

      {/* Percentage values */}
      {dimensiones.map((d, i) => {
        const pt = getPoint(i, d.porcentaje);
        const labelPt = getPoint(i, d.porcentaje + 12);
        return (
          <text
            key={`val-${i}`}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900 dark:fill-white"
            fontSize={9}
            fontWeight={700}
          >
            {d.porcentaje}%
          </text>
        );
      })}
    </svg>
  );
};

// ============================================================================
// Componente Principal
// ============================================================================

export const ResultadosPsicometricosModal = ({
  isOpen,
  onClose,
  asignacion,
  scoringConfig,
  respuestas,
}: Props) => {
  const dimensiones = useMemo(() => {
    if (!scoringConfig || !respuestas) return [];
    return calcularDimensiones(scoringConfig, respuestas);
  }, [scoringConfig, respuestas]);

  const dominante = useMemo(() => {
    if (dimensiones.length === 0) return null;
    return [...dimensiones].sort((a, b) => b.porcentaje - a.porcentaje)[0];
  }, [dimensiones]);

  const modeloNombre =
    scoringConfig?.modelo === 'disc'
      ? 'DISC'
      : scoringConfig?.modelo === 'big_five'
        ? 'Big Five (OCEAN)'
        : 'Psicometrico';

  if (!asignacion || !scoringConfig || !respuestas) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Perfil ${modeloNombre}`} size="lg">
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-800/40 rounded-lg">
              <Brain size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {asignacion.candidato_nombre}
              </p>
              <p className="text-xs text-gray-500">
                {asignacion.plantilla_nombre}
                {asignacion.vacante_codigo && ` — ${asignacion.vacante_codigo}`}
              </p>
            </div>
          </div>
          {dominante && (
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Dimension dominante
              </p>
              <p className="text-sm font-bold" style={{ color: dominante.color }}>
                {dominante.nombre} ({dominante.porcentaje}%)
              </p>
            </div>
          )}
        </div>

        {/* Radar Chart */}
        {dimensiones.length >= 3 && (
          <div className="flex justify-center">
            <RadarChart dimensiones={dimensiones} />
          </div>
        )}

        {/* Dimensiones tabla */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Detalle por Dimension
          </h4>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {dimensiones.map((d) => {
              const nivelBadge = getNivelBadge(d.nivel);
              const NivelIcon = getNivelIcon(d.nivel);
              return (
                <div key={d.key} className="flex items-center gap-3 py-2.5">
                  {/* Color dot + name */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {d.nombre}
                        <span className="text-gray-400 ml-1 text-xs">({d.key})</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${d.porcentaje}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-10 text-right">
                      {d.puntaje}/{d.maximo}
                    </span>
                    <Badge variant={nivelBadge.variant} size="sm">
                      <NivelIcon size={10} className="mr-0.5" />
                      {nivelBadge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Descripcion de cada dimension */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Interpretacion
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dimensiones.map((d) => (
              <div key={d.key} className="flex gap-2">
                <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {d.nombre}
                    <span
                      className={cn(
                        'ml-1.5 text-[10px]',
                        d.nivel === 'alto'
                          ? 'text-green-600'
                          : d.nivel === 'medio'
                            ? 'text-amber-600'
                            : 'text-gray-500'
                      )}
                    >
                      {d.porcentaje}%
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{d.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fecha */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t">
          Evaluacion completada el{' '}
          {asignacion.fecha_completado
            ? new Date(asignacion.fecha_completado).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'N/A'}
        </div>
      </div>
    </Modal>
  );
};
