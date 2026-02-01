/**
 * ScoringBadge Component - Sales CRM
 * Badge para mostrar el scoring de cliente
 */
import { Badge } from '@/components/common/Badge';

interface ScoringBadgeProps {
  scoring: number;
  className?: string;
}

export function ScoringBadge({ scoring, className }: ScoringBadgeProps) {
  const getVariant = (score: number): 'success' | 'warning' | 'danger' | 'primary' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  const getLabel = (score: number): string => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Bajo';
  };

  return (
    <Badge variant={getVariant(scoring)} size="sm" className={className}>
      {scoring}/100 - {getLabel(scoring)}
    </Badge>
  );
}
