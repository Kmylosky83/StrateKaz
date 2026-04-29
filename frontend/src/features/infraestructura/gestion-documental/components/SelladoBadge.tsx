/**
 * Badge indicador de estado de sellado PDF (Mejora 2 — ISO 27001).
 * NO_APLICA = oculto | PENDIENTE = gray | PROCESANDO = info+pulse |
 * COMPLETADO = success | ERROR = danger
 */
import { Badge } from '@/components/common';
import type { SelladoEstado, SelladoMetadatos } from '../types/gestion-documental.types';
import { SELLADO_ESTADO_LABELS, SELLADO_ESTADO_COLORS } from '../types/gestion-documental.types';

interface SelladoBadgeProps {
  estado: SelladoEstado;
  metadatos?: SelladoMetadatos;
  className?: string;
}

export default function SelladoBadge({ estado, metadatos, className = '' }: SelladoBadgeProps) {
  if (!estado || estado === 'NO_APLICA') return null;

  const label = SELLADO_ESTADO_LABELS[estado];
  const variant = SELLADO_ESTADO_COLORS[estado] as 'gray' | 'info' | 'success' | 'danger';

  let title = label;
  if (metadatos) {
    if (estado === 'COMPLETADO' && metadatos.fecha_sellado) {
      const fecha = new Date(metadatos.fecha_sellado).toLocaleDateString('es-CO');
      title = `${label} — ${fecha} (${metadatos.algoritmo ?? 'SHA-256'})`;
    } else if (estado === 'ERROR' && metadatos.error) {
      title = `${label}: ${metadatos.error}`;
    }
  }

  return (
    <span className={className} title={title}>
      <Badge variant={variant}>
        {estado === 'PROCESANDO' && (
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
        )}
        {label}
      </Badge>
    </span>
  );
}
