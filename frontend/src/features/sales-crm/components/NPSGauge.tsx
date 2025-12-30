/**
 * NPSGauge Component - Sales CRM
 * Medidor visual para Net Promoter Score
 */
import { cn } from '@/utils/cn';

interface NPSGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NPSGauge({ score, size = 'md', className }: NPSGaugeProps) {
  const getColor = (npsScore: number): string => {
    if (npsScore >= 50) return 'text-success-600 dark:text-success-400';
    if (npsScore >= 0) return 'text-warning-600 dark:text-warning-400';
    return 'text-danger-600 dark:text-danger-400';
  };

  const getLabel = (npsScore: number): string => {
    if (npsScore >= 50) return 'Excelente';
    if (npsScore >= 0) return 'Bueno';
    return 'Necesita Mejora';
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className={cn('font-bold', sizeClasses[size], getColor(score))}>
        {score}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {getLabel(score)}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            score >= 50 ? 'bg-success-600' : score >= 0 ? 'bg-warning-600' : 'bg-danger-600'
          )}
          style={{ width: `${Math.min(Math.max((score + 100) / 2, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
