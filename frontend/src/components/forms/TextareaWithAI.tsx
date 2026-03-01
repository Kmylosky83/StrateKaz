/**
 * TextareaWithAI — Textarea con asistente de IA integrado
 *
 * Extiende el Textarea del design system agregando un botón de IA
 * que permite mejorar, formalizar, resumir o expandir el texto.
 *
 * Uso con React Hook Form:
 *   <TextareaWithAI label="Descripción" {...register('descripcion')} />
 *
 * Uso standalone:
 *   <TextareaWithAI label="Notas" value={text} onChange={setText} />
 */
import { forwardRef, useState, useCallback, useRef, useEffect } from 'react';
import {
  Sparkles,
  Check,
  X,
  Loader2,
  GraduationCap,
  AlignLeft,
  Maximize2,
  CheckCheck,
} from 'lucide-react';
import { Textarea, type TextareaProps } from './Textarea';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { useTextAssist, useIAStatus, TEXT_ASSIST_ACTIONS } from '@/hooks/useIA';
import type { TextAssistAction } from '@/hooks/useIA';

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  GraduationCap,
  AlignLeft,
  Maximize2,
  CheckCheck,
};

export interface TextareaWithAIProps extends TextareaProps {
  /** Acciones de IA disponibles. Por defecto todas. */
  aiActions?: TextAssistAction[];
  /** Callback cuando se acepta el texto generado por IA */
  onAIAccept?: (text: string) => void;
}

export const TextareaWithAI = forwardRef<HTMLTextAreaElement, TextareaWithAIProps>(
  (
    {
      aiActions = ['improve', 'formal', 'summarize', 'expand', 'proofread'],
      onAIAccept,
      className,
      ...textareaProps
    },
    ref
  ) => {
    const { data: iaStatus } = useIAStatus();
    const { mutate: assistText, isPending, data: aiResult, reset } = useTextAssist();
    const [showMenu, setShowMenu] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    // Disponible solo si hay IA
    const isAvailable = iaStatus?.available ?? false;

    // Filtrar acciones disponibles
    const availableActions = TEXT_ASSIST_ACTIONS.filter((a) => aiActions.includes(a.value));

    // Cerrar menú al hacer click fuera
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setShowMenu(false);
        }
      };
      if (showMenu) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    // Obtener el texto actual del textarea
    const getCurrentText = useCallback((): string => {
      if (internalRef.current) {
        return internalRef.current.value || '';
      }
      return '';
    }, []);

    // Ejecutar acción de IA
    const handleAction = useCallback(
      (action: TextAssistAction) => {
        const text = getCurrentText();
        if (!text.trim()) return;
        setShowMenu(false);
        setShowResult(true);
        assistText({ text, action });
      },
      [getCurrentText, assistText]
    );

    // Aceptar resultado de IA
    const handleAccept = useCallback(() => {
      if (aiResult?.success && aiResult.text && internalRef.current) {
        // Simular un input event para que React Hook Form lo capture
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(internalRef.current, aiResult.text);
          internalRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
        onAIAccept?.(aiResult.text);
      }
      setShowResult(false);
      reset();
    }, [aiResult, onAIAccept, reset]);

    // Rechazar resultado
    const handleReject = useCallback(() => {
      setShowResult(false);
      reset();
    }, [reset]);

    // Combinar refs
    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    // Si no hay IA disponible, renderizar Textarea normal
    if (!isAvailable) {
      return <Textarea ref={ref} className={className} {...textareaProps} />;
    }

    return (
      <div className="relative">
        <Textarea ref={setRefs} className={cn('pr-10', className)} {...textareaProps} />

        {/* Botón IA (esquina superior derecha del textarea) */}
        <div className="absolute top-8 right-2" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              if (showResult) return;
              setShowMenu(!showMenu);
            }}
            disabled={isPending}
            className={cn(
              'p-1.5 rounded-md transition-all',
              'text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300',
              'hover:bg-purple-50 dark:hover:bg-purple-900/20',
              'focus:outline-none focus:ring-2 focus:ring-purple-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Asistente de texto IA"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>

          {/* Menú de acciones */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Asistente IA
                </p>
              </div>
              {availableActions.map((action) => {
                const IconComp = ACTION_ICONS[action.icon] || Sparkles;
                return (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => handleAction(action.value)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel de resultado IA */}
        {showResult && (
          <div className="mt-2 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-purple-100 dark:border-purple-800/50">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Sugerencia IA
              </span>
              {aiResult && !isPending && (
                <span className="text-xs text-purple-500 dark:text-purple-400 ml-auto">
                  {aiResult.processing_time_ms.toFixed(0)}ms
                </span>
              )}
            </div>

            {/* Contenido */}
            <div className="p-3">
              {isPending ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                  <span className="text-sm text-purple-600 dark:text-purple-300 animate-pulse">
                    Procesando texto...
                  </span>
                </div>
              ) : aiResult?.success ? (
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                  {aiResult.text}
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {aiResult?.error || 'Error al procesar el texto.'}
                </p>
              )}
            </div>

            {/* Acciones */}
            {!isPending && aiResult && (
              <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-purple-100 dark:border-purple-800/50">
                <Button type="button" variant="ghost" onClick={handleReject} className="text-xs">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Descartar
                </Button>
                {aiResult.success && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAccept}
                    className="text-xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Usar texto
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

TextareaWithAI.displayName = 'TextareaWithAI';
