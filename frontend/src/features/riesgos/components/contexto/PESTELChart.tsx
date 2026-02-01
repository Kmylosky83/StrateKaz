/**
 * PESTELChart - Visualización de análisis PESTEL
 */
import { cn } from '@/utils/cn';
import {
  Building2,
  DollarSign,
  Users,
  Cpu,
  Leaf,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { FactorPESTEL, TipoFactorPESTEL, NivelImpacto } from '../../types';

interface PESTELChartProps {
  factores: FactorPESTEL[];
  onFactorClick?: (factor: FactorPESTEL) => void;
  className?: string;
}

const FACTOR_CONFIG: Record<TipoFactorPESTEL, {
  titulo: string;
  color: string;
  bgColor: string;
  icon: typeof Building2;
}> = {
  politico: {
    titulo: 'Político',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: Building2,
  },
  economico: {
    titulo: 'Económico',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: DollarSign,
  },
  social: {
    titulo: 'Social',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Users,
  },
  tecnologico: {
    titulo: 'Tecnológico',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    icon: Cpu,
  },
  ecologico: {
    titulo: 'Ecológico',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: Leaf,
  },
  legal: {
    titulo: 'Legal',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    icon: Scale,
  },
};

const IMPACTO_COLORS: Record<NivelImpacto, string> = {
  alto: 'bg-red-100 text-red-700 border-red-200',
  medio: 'bg-amber-100 text-amber-700 border-amber-200',
  bajo: 'bg-green-100 text-green-700 border-green-200',
};

const TENDENCIA_ICON = {
  creciente: TrendingUp,
  estable: Minus,
  decreciente: TrendingDown,
};

const TENDENCIA_COLOR = {
  creciente: 'text-green-600',
  estable: 'text-gray-500',
  decreciente: 'text-red-600',
};

export function PESTELChart({
  factores,
  onFactorClick,
  className,
}: PESTELChartProps) {
  const tipos: TipoFactorPESTEL[] = [
    'politico',
    'economico',
    'social',
    'tecnologico',
    'ecologico',
    'legal',
  ];

  const factoresPorTipo = (tipo: TipoFactorPESTEL) =>
    factores.filter((f) => f.tipo === tipo).sort((a, b) => a.orden - b.orden);

  return (
    <div className={cn('space-y-4', className)}>
      {tipos.map((tipo) => {
        const config = FACTOR_CONFIG[tipo];
        const items = factoresPorTipo(tipo);
        const Icon = config.icon;

        return (
          <div key={tipo} className={cn('rounded-lg border p-4', config.bgColor)}>
            <div className={cn('flex items-center gap-2 mb-3 font-semibold', config.color)}>
              <Icon className="w-5 h-5" />
              <span>{config.titulo}</span>
              <span className="ml-auto text-sm font-normal bg-white px-2 py-0.5 rounded">
                {items.length} factores
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Sin factores registrados
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {items.map((factor) => {
                  const TendenciaIcon = TENDENCIA_ICON[factor.tendencia];
                  return (
                    <div
                      key={factor.id}
                      className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow border"
                      onClick={() => onFactorClick?.(factor)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{factor.factor}</span>
                        <div className="flex items-center gap-1">
                          <TendenciaIcon
                            className={cn('w-4 h-4', TENDENCIA_COLOR[factor.tendencia])}
                          />
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded border capitalize',
                              IMPACTO_COLORS[factor.impacto]
                            )}
                          >
                            {factor.impacto}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {factor.descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        Impacto: {factor.tiempo_impacto.replace('_', ' ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PESTELChart;
