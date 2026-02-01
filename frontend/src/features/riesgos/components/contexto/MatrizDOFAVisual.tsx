/**
 * MatrizDOFAVisual - Visualización interactiva de matriz DOFA
 */
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import type { FactorDOFA, TipoFactorDOFA, NivelImpacto } from '../../types';

interface MatrizDOFAVisualProps {
  factores: FactorDOFA[];
  onFactorClick?: (factor: FactorDOFA) => void;
  className?: string;
}

const CUADRANTE_CONFIG: Record<TipoFactorDOFA, {
  titulo: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Shield;
}> = {
  fortaleza: {
    titulo: 'Fortalezas',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: Shield,
  },
  oportunidad: {
    titulo: 'Oportunidades',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: TrendingUp,
  },
  debilidad: {
    titulo: 'Debilidades',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: TrendingDown,
  },
  amenaza: {
    titulo: 'Amenazas',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertTriangle,
  },
};

const IMPACTO_STYLES: Record<NivelImpacto, string> = {
  alto: 'border-l-4 border-l-red-500',
  medio: 'border-l-4 border-l-amber-500',
  bajo: 'border-l-4 border-l-green-500',
};

export function MatrizDOFAVisual({
  factores,
  onFactorClick,
  className,
}: MatrizDOFAVisualProps) {
  const factoresPorTipo = (tipo: TipoFactorDOFA) =>
    factores.filter((f) => f.tipo === tipo).sort((a, b) => a.orden - b.orden);

  const renderCuadrante = (tipo: TipoFactorDOFA) => {
    const config = CUADRANTE_CONFIG[tipo];
    const items = factoresPorTipo(tipo);
    const Icon = config.icon;

    return (
      <div
        className={cn(
          'rounded-lg border-2 p-4 min-h-[200px]',
          config.bgColor,
          config.borderColor
        )}
      >
        <div className={cn('flex items-center gap-2 mb-3 font-semibold', config.color)}>
          <Icon className="w-5 h-5" />
          <span>{config.titulo}</span>
          <span className="ml-auto text-sm font-normal">({items.length})</span>
        </div>
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin factores registrados</p>
          ) : (
            items.map((factor) => (
              <div
                key={factor.id}
                className={cn(
                  'bg-white rounded p-2 text-sm cursor-pointer hover:shadow-sm transition-shadow',
                  IMPACTO_STYLES[factor.impacto]
                )}
                onClick={() => onFactorClick?.(factor)}
              >
                <p className="line-clamp-2">{factor.descripcion}</p>
                <span className="text-xs text-muted-foreground capitalize">
                  Impacto: {factor.impacto}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {/* Factores Internos */}
      <div className="col-span-2 text-center text-sm font-medium text-muted-foreground mb-2">
        <span className="bg-muted px-3 py-1 rounded">Análisis Interno</span>
      </div>
      {renderCuadrante('fortaleza')}
      {renderCuadrante('debilidad')}

      {/* Factores Externos */}
      <div className="col-span-2 text-center text-sm font-medium text-muted-foreground mt-4 mb-2">
        <span className="bg-muted px-3 py-1 rounded">Análisis Externo</span>
      </div>
      {renderCuadrante('oportunidad')}
      {renderCuadrante('amenaza')}
    </div>
  );
}

export default MatrizDOFAVisual;
