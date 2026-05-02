/**
 * Badge indicador de estado OCR para documentos.
 * NO_APLICA = oculto | PENDIENTE = gray | PROCESANDO = info+pulse |
 * COMPLETADO = success | ERROR = danger
 */
import { Badge } from '@/components/common';
import type { OcrEstado, OcrMetadatos } from '../types/gestion-documental.types';
import { OCR_ESTADO_LABELS, OCR_ESTADO_COLORS } from '../types/gestion-documental.types';

interface OcrStatusBadgeProps {
  estado: OcrEstado;
  metadatos?: OcrMetadatos;
  className?: string;
}

export default function OcrStatusBadge({ estado, metadatos, className = '' }: OcrStatusBadgeProps) {
  if (estado === 'NO_APLICA') return null;

  const label = OCR_ESTADO_LABELS[estado];
  const variant = OCR_ESTADO_COLORS[estado] as 'gray' | 'info' | 'success' | 'danger';

  // Tooltip con detalles
  let title = label;
  if (metadatos) {
    if (estado === 'COMPLETADO' && metadatos.confianza != null) {
      title = `${label} (${(metadatos.confianza * 100).toFixed(0)}% confianza, ${metadatos.metodo})`;
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
