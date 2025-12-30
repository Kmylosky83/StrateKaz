/**
 * RiesgoCard - Card compacta para mostrar un riesgo
 */
import { cn } from '@/utils/cn';
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface RiesgoCardProps {
  codigo: string;
  nombre: string;
  tipo: string;
  nivelInherente: number;
  nivelResidual: number;
  estado: string;
  onClick?: () => void;
  className?: string;
}

const getNivelColor = (nivel: number): string => {
  if (nivel >= 15) return 'text-red-600 bg-red-100';
  if (nivel >= 10) return 'text-orange-600 bg-orange-100';
  if (nivel >= 5) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
};

const getNivelLabel = (nivel: number): string => {
  if (nivel >= 15) return 'CRITICO';
  if (nivel >= 10) return 'ALTO';
  if (nivel >= 5) return 'MODERADO';
  return 'BAJO';
};

const getTendenciaIcon = (inherente: number, residual: number) => {
  const diff = inherente - residual;
  if (diff > 0) return <TrendingDown className="w-4 h-4 text-green-600" />;
  if (diff < 0) return <TrendingUp className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

const TIPO_LABELS: Record<string, string> = {
  estrategico: 'Estrategico',
  operativo: 'Operativo',
  financiero: 'Financiero',
  cumplimiento: 'Cumplimiento',
  tecnologico: 'Tecnologico',
  reputacional: 'Reputacional',
  sst: 'SST',
  ambiental: 'Ambiental',
};

const ESTADO_COLORS: Record<string, string> = {
  identificado: 'bg-gray-100 text-gray-700',
  en_analisis: 'bg-blue-100 text-blue-700',
  en_tratamiento: 'bg-yellow-100 text-yellow-700',
  monitoreado: 'bg-green-100 text-green-700',
  cerrado: 'bg-gray-200 text-gray-500',
};

export function RiesgoCard({
  codigo,
  nombre,
  tipo,
  nivelInherente,
  nivelResidual,
  estado,
  onClick,
  className,
}: RiesgoCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">{codigo}</span>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded', ESTADO_COLORS[estado] || 'bg-gray-100')}>
          {estado.replace('_', ' ')}
        </span>
      </div>

      {/* Nombre */}
      <h4 className="font-medium text-sm line-clamp-2 mb-2">{nombre}</h4>

      {/* Tipo y Niveles */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {TIPO_LABELS[tipo] || tipo}
        </span>

        <div className="flex items-center gap-2">
          {/* Nivel Inherente */}
          <div className={cn('px-2 py-0.5 rounded text-xs font-medium', getNivelColor(nivelInherente))}>
            {nivelInherente}
          </div>

          {/* Tendencia */}
          {getTendenciaIcon(nivelInherente, nivelResidual)}

          {/* Nivel Residual */}
          <div className={cn('px-2 py-0.5 rounded text-xs font-medium', getNivelColor(nivelResidual))}>
            {nivelResidual}
          </div>
        </div>
      </div>

      {/* Barra de reduccion */}
      {nivelInherente > 0 && (
        <div className="mt-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: `${Math.max(0, ((nivelInherente - nivelResidual) / nivelInherente) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Reduccion: {Math.round(((nivelInherente - nivelResidual) / nivelInherente) * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}

export default RiesgoCard;
