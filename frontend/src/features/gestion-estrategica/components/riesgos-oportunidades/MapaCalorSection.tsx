/**
 * Sección Mapa de Calor - Riesgos y Oportunidades
 * Visualización matricial 5x5 de probabilidad vs impacto
 * Conectado a motor_riesgos API
 */
import { useMemo, useState } from 'react';
import { Flame, Info } from 'lucide-react';
import { Card, Spinner, EmptyState, Badge } from '@/components/common';
import { useMapaCalorRiesgos } from '../../hooks/useRiesgosOportunidades';
import type { MapaCalorItem } from '../../api/riesgosOportunidadesApi';

interface MapaCalorSectionProps {
  triggerNewForm?: number;
}

const PROBABILIDAD_LABELS = ['Muy Baja', 'Baja', 'Media', 'Alta', 'Muy Alta'];
const IMPACTO_LABELS = ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrófico'];

function getCellColor(prob: number, impact: number): string {
  const nivel = prob * impact;
  if (nivel >= 15) return 'bg-red-600 text-white';
  if (nivel >= 10) return 'bg-orange-500 text-white';
  if (nivel >= 5) return 'bg-yellow-400 text-gray-900';
  if (nivel >= 2) return 'bg-green-400 text-gray-900';
  return 'bg-green-200 text-gray-700';
}

function getNivelLabel(nivel: number): string {
  if (nivel >= 15) return 'Crítico';
  if (nivel >= 10) return 'Alto';
  if (nivel >= 5) return 'Medio';
  return 'Bajo';
}

export function MapaCalorSection({ triggerNewForm }: MapaCalorSectionProps) {
  const { data: mapaCalor, isLoading } = useMapaCalorRiesgos();
  const [hoveredCell, setHoveredCell] = useState<{ p: number; i: number } | null>(null);

  const mapaData = useMemo(() => {
    const grid: Record<string, MapaCalorItem> = {};
    if (mapaCalor) {
      mapaCalor.forEach((item) => {
        grid[`${item.probabilidad}-${item.impacto}`] = item;
      });
    }
    return grid;
  }, [mapaCalor]);

  const totalRiesgos = useMemo(() => {
    if (!mapaCalor) return 0;
    return mapaCalor.reduce((sum, item) => sum + item.cantidad, 0);
  }, [mapaCalor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leyenda */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Niveles de Riesgo:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-200" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Bajo (1-4)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Medio (5-9)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Alto (10-14)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Crítico (15-25)</span>
          </div>
          <div className="ml-auto">
            <Badge variant="primary">{totalRiesgos} riesgos mapeados</Badge>
          </div>
        </div>
      </Card>

      {/* Matriz 5x5 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Matriz de Probabilidad vs Impacto
        </h3>

        {totalRiesgos === 0 ? (
          <EmptyState
            icon={<Flame className="w-12 h-12" />}
            title="Sin riesgos evaluados"
            description="Los riesgos identificados aparecerán automáticamente en el mapa de calor según su evaluación de probabilidad e impacto."
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header de Impacto */}
              <div className="flex items-end mb-1">
                <div className="w-28 shrink-0" />
                {IMPACTO_LABELS.map((label, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {label}
                    </span>
                    <div className="text-xs text-gray-400">({idx + 1})</div>
                  </div>
                ))}
              </div>

              {/* Filas de Probabilidad (de 5 a 1, de arriba a abajo) */}
              {[5, 4, 3, 2, 1].map((prob) => (
                <div key={prob} className="flex items-stretch mb-1">
                  <div className="w-28 shrink-0 flex items-center pr-2">
                    <div className="text-right w-full">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {PROBABILIDAD_LABELS[prob - 1]}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">({prob})</span>
                    </div>
                  </div>

                  {[1, 2, 3, 4, 5].map((impact) => {
                    const key = `${prob}-${impact}`;
                    const cellData = mapaData[key];
                    const cantidad = cellData?.cantidad || 0;
                    const isHovered = hoveredCell?.p === prob && hoveredCell?.i === impact;

                    return (
                      <div
                        key={key}
                        className={`flex-1 mx-0.5 rounded-lg cursor-pointer transition-all duration-200 relative ${getCellColor(
                          prob,
                          impact
                        )} ${isHovered ? 'ring-2 ring-gray-900 dark:ring-white scale-105 z-10' : ''}`}
                        style={{ minHeight: '64px' }}
                        onMouseEnter={() => setHoveredCell({ p: prob, i: impact })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div className="flex flex-col items-center justify-center h-full p-2">
                          <span className="text-lg font-bold">{cantidad || ''}</span>
                          <span className="text-[10px] opacity-75">{prob * impact}</span>
                        </div>

                        {isHovered && cellData && cellData.riesgos.length > 0 && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-60 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none">
                            <p className="font-medium mb-1">
                              {getNivelLabel(prob * impact)} - {cantidad} riesgo{cantidad !== 1 ? 's' : ''}
                            </p>
                            <ul className="space-y-0.5">
                              {cellData.riesgos.slice(0, 5).map((r) => (
                                <li key={r.id} className="truncate">
                                  {r.nombre}
                                </li>
                              ))}
                              {cellData.riesgos.length > 5 && (
                                <li className="text-gray-400">
                                  +{cellData.riesgos.length - 5} más
                                </li>
                              )}
                            </ul>
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="flex items-center mt-4">
                <div className="w-28 shrink-0" />
                <div className="flex-1 text-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    IMPACTO →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Información */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Matriz de Riesgos ISO 31000
            </p>
            <p>
              Esta matriz muestra la distribución de riesgos según su evaluación residual
              (probabilidad × impacto con controles aplicados). Los riesgos se posicionan
              automáticamente al ser evaluados en el módulo de Gestión de Riesgos.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default MapaCalorSection;
