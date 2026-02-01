/**
 * WizardModal - Modal para flujos multi-paso
 *
 * Características:
 * - Indicador de progreso visual
 * - Navegación paso a paso
 * - Validación por paso
 * - Pasos opcionales (skip)
 * - Navegación hacia atrás permitida
 */
import { useState, useCallback, ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseModal, ModalSize } from './BaseModal';
import { Button } from '@/components/common/Button';
import { tabContentVariants } from '@/lib/animations';

export interface WizardStep {
  /** ID único del paso */
  id: string;
  /** Título del paso */
  title: string;
  /** Descripción opcional */
  description?: string;
  /** Si el paso es opcional */
  optional?: boolean;
  /** Contenido del paso */
  content: ReactNode;
  /** Validación antes de avanzar */
  validate?: () => boolean | Promise<boolean>;
}

export interface WizardModalProps {
  /** Control de apertura del modal */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Callback al completar todos los pasos */
  onComplete: () => void | Promise<void>;
  /** Título del modal */
  title: string;
  /** Array de pasos del wizard */
  steps: WizardStep[];
  /** Tamaño del modal */
  size?: ModalSize;
  /** Estado de carga */
  isLoading?: boolean;
  /** Texto del botón de completar */
  completeLabel?: string;
  /** Permitir saltar pasos opcionales */
  allowSkip?: boolean;
}

export const WizardModal = ({
  isOpen,
  onClose,
  onComplete,
  title,
  steps,
  size = '2xl',
  isLoading = false,
  completeLabel = 'Completar',
  allowSkip = true,
}: WizardModalProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Reset al cerrar
  const handleClose = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    onClose();
  }, [onClose]);

  // Validar y avanzar
  const handleNext = useCallback(async () => {
    if (isValidating || isLoading) return;

    setIsValidating(true);
    try {
      // Validar paso actual si tiene validación
      if (currentStep.validate) {
        const isValid = await currentStep.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      }

      // Marcar como completado
      setCompletedSteps((prev) => new Set([...prev, currentStepIndex]));

      if (isLastStep) {
        await onComplete();
        handleClose();
      } else {
        setDirection(1);
        setCurrentStepIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error en validación:', error);
    } finally {
      setIsValidating(false);
    }
  }, [currentStep, currentStepIndex, isLastStep, isLoading, isValidating, onComplete, handleClose]);

  // Retroceder
  const handleBack = useCallback(() => {
    if (isFirstStep || isValidating || isLoading) return;
    setDirection(-1);
    setCurrentStepIndex((prev) => prev - 1);
  }, [isFirstStep, isValidating, isLoading]);

  // Saltar paso opcional
  const handleSkip = useCallback(() => {
    if (!currentStep.optional || isLastStep) return;
    setDirection(1);
    setCurrentStepIndex((prev) => prev + 1);
  }, [currentStep.optional, isLastStep]);

  // Ir a un paso específico (solo completados o el siguiente)
  const goToStep = useCallback(
    (index: number) => {
      if (index <= currentStepIndex || completedSteps.has(index - 1)) {
        setDirection(index > currentStepIndex ? 1 : -1);
        setCurrentStepIndex(index);
      }
    },
    [currentStepIndex, completedSteps]
  );

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        disabled={isFirstStep || isValidating || isLoading}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Anterior
      </Button>

      <div className="flex-1" />

      {allowSkip && currentStep.optional && !isLastStep && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleSkip}
          disabled={isValidating || isLoading}
        >
          Omitir
        </Button>
      )}

      <Button
        type="button"
        variant="primary"
        onClick={handleNext}
        disabled={isValidating || isLoading}
        isLoading={isValidating || isLoading}
      >
        {isLastStep ? completeLabel : 'Siguiente'}
        {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size={size}
      footer={footer}
      closeOnBackdrop={false}
    >
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStepIndex;
            const isClickable = index <= currentStepIndex || completedSteps.has(index - 1);

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  disabled={!isClickable}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full
                    text-sm font-medium transition-all duration-200
                    ${
                      isCompleted
                        ? 'bg-primary-600 text-white'
                        : isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/50'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                    ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="hidden sm:block ml-3 flex-shrink-0">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.optional && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Opcional</p>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-0.5 transition-colors duration-200 ${
                        completedSteps.has(index)
                          ? 'bg-primary-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Step Label */}
        <div className="sm:hidden mt-4 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentStep.title}
          </p>
          {currentStep.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {currentStep.description}
            </p>
          )}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentStepIndex}
          variants={tabContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          custom={direction}
        >
          {currentStep.content}
        </motion.div>
      </AnimatePresence>
    </BaseModal>
  );
};
