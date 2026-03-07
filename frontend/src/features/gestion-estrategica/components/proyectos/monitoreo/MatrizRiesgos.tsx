/**
 * Matriz de Riesgos 5x5 (Probabilidad × Impacto)
 * Datos desde @action matriz-riesgos del backend
 * DS: Card + Badge
 */
import { Card, Badge } from '@/components/common';
import { useMatrizRiesgos } from '../../../hooks/useProyectos';

interface MatrizRiesgosProps {
  proyectoId: number;
}

const PROBABILIDADES = ['muy_alta', 'alta', 'media', 'baja', 'muy_baja'] as const;
const IMPACTOS = ['muy_bajo', 'bajo', 'medio', 'alto', 'muy_alto'] as const;

const PROB_LABELS: Record<string, string> = {
  muy_alta: 'Muy Alta',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  muy_baja: 'Muy Baja',
};

const IMP_LABELS: Record<string, string> = {
  muy_alto: 'Muy Alto',
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
  muy_bajo: 'Muy Bajo',
};

// Color by position: top-right = red, bottom-left = green
const getCellColor = (probIdx: number, impIdx: number): string => {
  const score = 4 - probIdx + impIdx; // 0-8 range
  if (score >= 6) return 'bg-red-100 dark:bg-red-900/30';
  if (score >= 4) return 'bg-amber-100 dark:bg-amber-900/30';
  if (score >= 2) return 'bg-yellow-100 dark:bg-yellow-900/20';
  return 'bg-green-100 dark:bg-green-900/20';
};

export const MatrizRiesgos = ({ proyectoId }: MatrizRiesgosProps) => {
  const { data: matrizData, isLoading } = useMatrizRiesgos(proyectoId);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse-subtle">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  const matriz = matrizData?.matriz ?? {};

  return (
    <Card>
      <div className="p-4 overflow-x-auto">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Matriz de Probabilidad × Impacto
        </h4>

        <div className="min-w-[500px]">
          {/* Header row */}
          <div className="flex">
            <div className="w-24 shrink-0" />
            {IMPACTOS.map((imp) => (
              <div
                key={imp}
                className="flex-1 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 pb-1"
              >
                {IMP_LABELS[imp]}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {PROBABILIDADES.map((prob, pIdx) => (
            <div key={prob} className="flex">
              {/* Row label */}
              <div className="w-24 shrink-0 flex items-center text-[10px] font-medium text-gray-500 dark:text-gray-400 pr-2">
                {PROB_LABELS[prob]}
              </div>
              {/* Cells */}
              {IMPACTOS.map((imp, iIdx) => {
                const riesgos = matriz?.[prob]?.[imp] ?? [];
                return (
                  <div
                    key={imp}
                    className={`flex-1 min-h-[48px] border border-gray-200 dark:border-gray-700 p-1 ${getCellColor(pIdx, iIdx)}`}
                  >
                    {riesgos.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {riesgos.map((r) => (
                          <Badge
                            key={r.id}
                            variant={r.tipo === 'amenaza' ? 'danger' : 'success'}
                            size="sm"
                          >
                            {r.codigo}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Axis labels */}
          <div className="flex mt-1">
            <div className="w-24 shrink-0" />
            <div className="flex-1 text-center text-xs text-gray-400">Impacto →</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-200 dark:bg-red-800" /> Alto
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800" /> Medio-Alto
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-800" /> Medio
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-200 dark:bg-green-800" /> Bajo
          </span>
        </div>
      </div>
    </Card>
  );
};
