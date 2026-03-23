/**
 * ProfileProgressBar - Barra de completitud del perfil de usuario
 *
 * Muestra el porcentaje de completitud del perfil con:
 * - Barra de progreso contextual (Progress component)
 * - Mensaje dinámico según rango de porcentaje
 * - CTA para completar campos faltantes
 * - Badges con campos pendientes
 * - Auto-ocultamiento suave al llegar a 100%
 * - Animación de entrada con Framer Motion
 * - Soporte dark mode
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, UserCog } from 'lucide-react';
import { Card, Badge, Button, Progress } from '@/components/common';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { cn } from '@/utils/cn';

export interface ProfileProgressBarProps {
  className?: string;
}

/** Determina el color de la barra y del texto según el porcentaje */
function getColorConfig(percentage: number): {
  progressColor: 'warning' | 'primary' | 'success';
  textClass: string;
  badgeVariant: 'warning' | 'info' | 'success';
} {
  if (percentage < 50) {
    return {
      progressColor: 'warning',
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeVariant: 'warning',
    };
  }
  if (percentage < 80) {
    return {
      progressColor: 'primary',
      textClass: 'text-blue-600 dark:text-blue-400',
      badgeVariant: 'info',
    };
  }
  return {
    progressColor: 'success',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    badgeVariant: 'success',
  };
}

/** Construye el mensaje contextual según el porcentaje */
function buildMessage(
  percentage: number,
  nextActionLabel: string | undefined,
  missingLabels: string[]
): string {
  if (percentage < 50) {
    return `Tu perfil está al ${percentage}%. Completa tus datos básicos para empezar.`;
  }
  if (percentage < 80) {
    const next = nextActionLabel ? ` Siguiente: ${nextActionLabel}.` : '.';
    return `Tu perfil está al ${percentage}%. ¡Ya casi!${next}`;
  }
  if (percentage < 100) {
    const missing = missingLabels.length > 0 ? ` Solo te falta: ${missingLabels.join(', ')}.` : '.';
    return `Tu perfil está al ${percentage}%.${missing}`;
  }
  return '¡Tu perfil está completo!';
}

export function ProfileProgressBar({ className }: ProfileProgressBarProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useProfileCompleteness();
  const [visible, setVisible] = useState(true);

  const percentage = data?.percentage ?? 0;
  const missingFields = data?.missing_fields ?? [];
  const nextAction = data?.next_action ?? null;

  // Auto-ocultar con fade al llegar al 100%
  useEffect(() => {
    if (data && percentage === 100) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
    // Resetear visibilidad si baja de 100% (edge case)
    setVisible(true);
  }, [data, percentage]);

  // No renderizar mientras carga o si ya no es visible
  if (isLoading || !data) return null;

  const { progressColor, textClass, badgeVariant } = getColorConfig(percentage);
  const missingLabels = missingFields.map((f) => f.label);
  const message = buildMessage(percentage, nextAction?.label, missingLabels);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={className}
        >
          <Card
            variant="bordered"
            padding="md"
            className={cn(
              'bg-gray-50/60 dark:bg-gray-800/40',
              percentage === 100 && 'border-emerald-200 dark:border-emerald-800/50'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Icono de estado */}
              <div
                className={cn(
                  'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                  percentage === 100
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                )}
              >
                {percentage === 100 ? (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <UserCog
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Mensaje + porcentaje */}
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn('text-sm font-medium', textClass)}>{message}</p>
                  {percentage < 100 && (
                    <Badge variant={badgeVariant} size="sm">
                      {percentage}%
                    </Badge>
                  )}
                </div>

                {/* Barra de progreso */}
                <Progress
                  value={percentage}
                  size="sm"
                  color={progressColor}
                  aria-label={`Completitud del perfil: ${percentage}%`}
                />

                {/* Campos faltantes como badges (solo si < 100%) */}
                {percentage < 100 && missingFields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {missingFields.slice(0, 5).map((field) => (
                      <Badge key={field.field} variant="secondary" size="sm">
                        {field.label}
                      </Badge>
                    ))}
                    {missingFields.length > 5 && (
                      <Badge variant="secondary" size="sm">
                        +{missingFields.length - 5} más
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* CTA — solo si < 100% y hay next_action */}
              {percentage < 100 && nextAction?.link && (
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(nextAction.link)}
                    className="whitespace-nowrap"
                  >
                    Completar perfil
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProfileProgressBar;
