/**
 * Badge indicador de score de cumplimiento documental (Fase 6).
 * 0-25: danger | 25-50: warning | 50-75: info | 75-100: success
 */
import { Badge } from '@/components/common';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export default function ScoreBadge({ score, className = '' }: ScoreBadgeProps) {
  const variant =
    score >= 75 ? 'success' : score >= 50 ? 'info' : score >= 25 ? 'warning' : 'danger';

  const label =
    score >= 75 ? 'Completo' : score >= 50 ? 'Parcial' : score >= 25 ? 'Bajo' : 'Crítico';

  return (
    <span className={className} title={`Score de cumplimiento: ${score}/100 (${label})`}>
      <Badge variant={variant}>{score}%</Badge>
    </span>
  );
}
