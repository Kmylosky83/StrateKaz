/**
 * FundacionChecklist — Card de onboarding para el Dashboard.
 *
 * Muestra el progreso de configuración de Fundación como un checklist
 * colapsable con links directos a cada sección pendiente.
 * Se oculta cuando el progreso es 100% o el usuario lo descarta.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Check, Circle, ChevronDown, ChevronUp, ArrowRight, X } from 'lucide-react';
import { Progress } from '@/components/common';
import { cn } from '@/utils/cn';
import type { FundacionProgress } from '../hooks/useFundacionProgress';

const STORAGE_KEY = 'stratekaz_fundacion_checklist_dismissed';

interface FundacionChecklistProps {
  data: FundacionProgress;
}

export function FundacionChecklist({ data }: FundacionChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  if (isDismissed || data.is_complete) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const pendingSteps = data.steps.filter((s) => !s.done);
  const nextStep = pendingSteps[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
          <Landmark className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Configura tu empresa
            </h3>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {data.overall_progress}%
            </span>
          </div>
          <Progress
            value={data.overall_progress}
            max={100}
            size="sm"
            color="primary"
            className="mt-1.5"
          />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Descartar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Checklist expandible */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5">
              {data.steps.map((step) => (
                <Link
                  key={step.key}
                  to={step.route}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group',
                    step.done
                      ? 'bg-white/40 dark:bg-gray-800/30'
                      : 'bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60'
                  )}
                >
                  {/* Checkmark */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                      step.done
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {step.done ? (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    ) : (
                      <Circle className="w-2 h-2 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-sm',
                        step.done
                          ? 'text-gray-400 dark:text-gray-500 line-through'
                          : 'text-gray-700 dark:text-gray-200 font-medium'
                      )}
                    >
                      {step.label}
                    </span>
                    {!step.done && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {step.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  {!step.done && (
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </Link>
              ))}

              {/* CTA directo al siguiente paso */}
              {nextStep && (
                <Link
                  to={nextStep.route}
                  className="flex items-center justify-center gap-2 mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  Continuar: {nextStep.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
