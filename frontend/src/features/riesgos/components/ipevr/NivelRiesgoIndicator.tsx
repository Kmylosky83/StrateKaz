/**
 * NivelRiesgoIndicator - Indicador visual de nivel de riesgo GTC-45
 */
import { cn } from '@/utils/cn';
import type { InterpretacionNR, Aceptabilidad } from '../../types';

interface NivelRiesgoIndicatorProps {
  interpretacionNR: InterpretacionNR;
  nivelRiesgo: number;
  aceptabilidad: Aceptabilidad;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const INTERPRETACION_COLORS: Record<InterpretacionNR, string> = {
  I: 'bg-red-600 text-white',
  II: 'bg-orange-500 text-white',
  III: 'bg-yellow-400 text-gray-900',
  IV: 'bg-green-500 text-white',
};

const INTERPRETACION_LABELS: Record<InterpretacionNR, string> = {
  I: 'Situacion critica',
  II: 'Corregir inmediato',
  III: 'Mejorar si es posible',
  IV: 'Mantener controles',
};

const ACEPTABILIDAD_COLORS: Record<Aceptabilidad, string> = {
  no_aceptable: 'border-red-600',
  aceptable: 'border-green-600',
};

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function NivelRiesgoIndicator({
  interpretacionNR,
  nivelRiesgo,
  aceptabilidad,
  showLabel = false,
  size = 'md',
  className,
}: NivelRiesgoIndicatorProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Badge principal */}
      <div
        className={cn(
          'rounded font-bold border-2',
          INTERPRETACION_COLORS[interpretacionNR],
          ACEPTABILIDAD_COLORS[aceptabilidad],
          SIZE_CLASSES[size]
        )}
        title={INTERPRETACION_LABELS[interpretacionNR]}
      >
        <span className="mr-1">{interpretacionNR}</span>
        <span className="opacity-75">({nivelRiesgo})</span>
      </div>

      {/* Label opcional */}
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {INTERPRETACION_LABELS[interpretacionNR]}
        </span>
      )}

      {/* Indicador de aceptabilidad */}
      {aceptabilidad === 'no_aceptable' && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
          No Aceptable
        </span>
      )}
    </div>
  );
}

export default NivelRiesgoIndicator;
