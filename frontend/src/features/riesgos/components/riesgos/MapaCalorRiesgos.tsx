/**
 * MapaCalorRiesgos - Matriz 5x5 de Probabilidad vs Impacto
 * Visualizacion de riesgos segun ISO 31000
 */
import { useMemo } from 'react';
import { cn } from '@/utils/cn';

interface Riesgo {
  id: number;
  codigo: string;
  nombre: string;
  probabilidad_inherente: number;
  impacto_inherente: number;
  probabilidad_residual: number;
  impacto_residual: number;
  nivel_inherente: number;
  nivel_residual: number;
}

interface MapaCalorRiesgosProps {
  riesgos: Riesgo[];
  tipo?: 'inherente' | 'residual';
  onCellClick?: (probabilidad: number, impacto: number, riesgos: Riesgo[]) => void;
  className?: string;
}

// Colores segun nivel de riesgo
const getNivelColor = (nivel: number): string => {
  if (nivel >= 15) return 'bg-red-500 hover:bg-red-600'; // Critico
  if (nivel >= 10) return 'bg-orange-500 hover:bg-orange-600'; // Alto
  if (nivel >= 5) return 'bg-yellow-400 hover:bg-yellow-500'; // Moderado
  return 'bg-green-500 hover:bg-green-600'; // Bajo
};

const getNivelLabel = (nivel: number): string => {
  if (nivel >= 15) return 'Critico';
  if (nivel >= 10) return 'Alto';
  if (nivel >= 5) return 'Moderado';
  return 'Bajo';
};

// Labels para ejes
const PROBABILIDAD_LABELS = ['Muy Baja', 'Baja', 'Media', 'Alta', 'Muy Alta'];
const IMPACTO_LABELS = ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrofico'];

export function MapaCalorRiesgos({
  riesgos,
  tipo = 'inherente',
  onCellClick,
  className,
}: MapaCalorRiesgosProps) {
  // Agrupar riesgos por celda
  const matrizData = useMemo(() => {
    const matriz: Record<string, Riesgo[]> = {};

    // Inicializar matriz 5x5
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        matriz[`${p}-${i}`] = [];
      }
    }

    // Asignar riesgos a celdas
    riesgos.forEach((riesgo) => {
      const prob = tipo === 'inherente' ? riesgo.probabilidad_inherente : riesgo.probabilidad_residual;
      const imp = tipo === 'inherente' ? riesgo.impacto_inherente : riesgo.impacto_residual;
      const key = `${prob}-${imp}`;
      if (matriz[key]) {
        matriz[key].push(riesgo);
      }
    });

    return matriz;
  }, [riesgos, tipo]);

  const handleCellClick = (probabilidad: number, impacto: number) => {
    const key = `${probabilidad}-${impacto}`;
    const riesgosEnCelda = matrizData[key] || [];
    onCellClick?.(probabilidad, impacto, riesgosEnCelda);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Titulo */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">
          Mapa de Calor - Riesgo {tipo === 'inherente' ? 'Inherente' : 'Residual'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {riesgos.length} riesgos identificados
        </p>
      </div>

      <div className="flex">
        {/* Eje Y - Probabilidad */}
        <div className="flex flex-col justify-center mr-2">
          <div className="writing-mode-vertical text-sm font-medium text-center mb-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            PROBABILIDAD
          </div>
        </div>

        <div className="flex-1">
          {/* Labels Y */}
          <div className="flex">
            <div className="w-24" /> {/* Espacio para labels */}
            <div className="flex-1 grid grid-cols-5 gap-1 mb-1">
              {IMPACTO_LABELS.map((label, idx) => (
                <div key={idx} className="text-xs text-center font-medium truncate">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Matriz */}
          {[5, 4, 3, 2, 1].map((probabilidad) => (
            <div key={probabilidad} className="flex items-center mb-1">
              {/* Label probabilidad */}
              <div className="w-24 text-xs text-right pr-2 font-medium">
                {PROBABILIDAD_LABELS[probabilidad - 1]}
              </div>

              {/* Celdas */}
              <div className="flex-1 grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((impacto) => {
                  const nivel = probabilidad * impacto;
                  const key = `${probabilidad}-${impacto}`;
                  const riesgosEnCelda = matrizData[key] || [];
                  const cantidad = riesgosEnCelda.length;

                  return (
                    <button
                      key={impacto}
                      onClick={() => handleCellClick(probabilidad, impacto)}
                      className={cn(
                        'aspect-square rounded-md flex flex-col items-center justify-center',
                        'transition-all duration-200 cursor-pointer',
                        'border border-gray-300',
                        getNivelColor(nivel),
                        cantidad > 0 && 'ring-2 ring-offset-1 ring-gray-800'
                      )}
                      title={`${getNivelLabel(nivel)} (${nivel}) - ${cantidad} riesgos`}
                    >
                      <span className="text-white font-bold text-lg">
                        {cantidad > 0 ? cantidad : ''}
                      </span>
                      <span className="text-white text-xs opacity-75">
                        {nivel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Eje X - Impacto */}
          <div className="text-center mt-2">
            <span className="text-sm font-medium">IMPACTO</span>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Bajo (1-4)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-400" />
          <span>Moderado (5-9)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span>Alto (10-14)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>Critico (15-25)</span>
        </div>
      </div>
    </div>
  );
}

export default MapaCalorRiesgos;
