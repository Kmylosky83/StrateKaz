/**
 * AIAssistantButton — Botón de ayuda contextual con IA
 *
 * Se coloca en el Header (ZONA B) para ofrecer ayuda sobre
 * "dónde estoy y qué puedo hacer" en cada sección del sistema.
 *
 * Uso:
 *   <AIAssistantButton />
 */
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { cn } from '@/utils/cn';
import { useIAStatus } from '@/hooks/useIA';
import { AIHelpModal } from './AIHelpModal';

export interface AIAssistantButtonProps {
  /** Código del módulo actual (se auto-detecta si no se pasa) */
  moduleCode?: string;
  /** Código del tab activo */
  tabCode?: string;
  /** Nombre de la sección */
  sectionName?: string;
  /** Clases adicionales */
  className?: string;
}

export const AIAssistantButton = ({
  moduleCode,
  tabCode,
  sectionName,
  className,
}: AIAssistantButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: iaStatus } = useIAStatus();

  // No mostrar si no hay IA configurada
  if (!iaStatus?.available) return null;

  return (
    <>
      <Tooltip content="Asistente IA">
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'relative p-2 rounded-lg transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            className
          )}
          title="Asistente IA"
        >
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          {/* Indicador "IA activa" */}
          <span className="absolute top-1 right-1 h-2 w-2 bg-purple-500 rounded-full" />
        </button>
      </Tooltip>

      <AIHelpModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        moduleCode={moduleCode}
        tabCode={tabCode}
        sectionName={sectionName}
      />
    </>
  );
};
