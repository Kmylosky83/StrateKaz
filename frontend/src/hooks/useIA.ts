/**
 * Hooks para Inteligencia Artificial
 * Ayuda contextual y asistente de texto
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getContextHelp,
  getTextAssist,
  getIAStatus,
  getAIUsageStats,
  type ContextHelpRequest,
  type TextAssistRequest,
  type TextAssistAction,
  type AIUsageStats,
} from '@/api/ia.api';

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO DE IA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para verificar si la IA está disponible.
 * Se ejecuta una vez y cachea por 5 minutos.
 */
export const useIAStatus = () => {
  return useQuery({
    queryKey: ['ia', 'status'],
    queryFn: getIAStatus,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// AYUDA CONTEXTUAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para obtener ayuda contextual.
 * Usa mutation porque se dispara manualmente (click en botón).
 */
export const useContextHelp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: ContextHelpRequest) => getContextHelp(params),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ia', 'usage-stats'] });
    },
    onError: () => {
      toast.error('No se pudo cargar la ayuda. Intenta de nuevo.');
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// ASISTENTE DE TEXTO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para el asistente de texto con IA.
 * Usa mutation porque se dispara manualmente.
 */
export const useTextAssist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TextAssistRequest) => getTextAssist(params),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ia', 'usage-stats'] });
    },
    onError: () => {
      toast.error('No se pudo procesar el texto. Intenta de nuevo.');
    },
  });
};

/**
 * Labels de las acciones de texto en español
 */
export const TEXT_ASSIST_ACTIONS: {
  value: TextAssistAction;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'improve',
    label: 'Mejorar redacción',
    description: 'Corrige gramática, ortografía y mejora la claridad',
    icon: 'Sparkles',
  },
  {
    value: 'formal',
    label: 'Lenguaje formal',
    description: 'Convierte a lenguaje corporativo profesional',
    icon: 'GraduationCap',
  },
  {
    value: 'summarize',
    label: 'Resumir',
    description: 'Resume el texto conservando los puntos clave',
    icon: 'AlignLeft',
  },
  {
    value: 'expand',
    label: 'Expandir',
    description: 'Agrega más detalles y contexto relevante',
    icon: 'Maximize2',
  },
  {
    value: 'proofread',
    label: 'Revisar ortografía',
    description: 'Revisa y corrige errores gramaticales',
    icon: 'CheckCheck',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS DE USO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para obtener estadísticas de uso de IA del usuario actual.
 * Cachea por 1 minuto.
 */
export const useAIUsage = () => {
  return useQuery({
    queryKey: ['ia', 'usage-stats'],
    queryFn: getAIUsageStats,
    staleTime: 60_000, // 1 minuto
    retry: 1,
  });
};

export type { ContextHelpRequest, TextAssistRequest, TextAssistAction, AIUsageStats };
