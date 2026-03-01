/**
 * AIHelpModal — Modal de ayuda contextual con IA
 *
 * Muestra información sobre dónde está el usuario y qué puede hacer,
 * con enriquecimiento por IA generativa (Gemini).
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, Lightbulb, BarChart3 } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { cn } from '@/utils/cn';
import { useContextHelp, useAIUsage } from '@/hooks/useIA';

export interface AIHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleCode?: string;
  tabCode?: string;
  sectionName?: string;
}

/**
 * Detecta el módulo desde la ruta actual.
 * Ej: /fundacion/organizacion → 'fundacion'
 *     /planeacion-estrategica/objetivos → 'planeacion_estrategica'
 */
function detectModuleFromPath(pathname: string): string {
  const routeToModule: Record<string, string> = {
    // C1
    '/fundacion': 'fundacion',
    // C2
    '/planeacion-estrategica': 'planeacion_estrategica',
    '/cumplimiento': 'motor_cumplimiento',
    '/riesgos': 'motor_riesgos',
    '/workflows': 'workflow_engine',
    '/hseq': 'hseq_management',
    '/sistema-gestion': 'hseq_management',
    '/supply-chain': 'supply_chain',
    '/production-ops': 'production_ops',
    '/logistics-fleet': 'logistics_fleet',
    '/sales-crm': 'sales_crm',
    '/talento': 'talent_hub',
    '/admin-finance': 'admin_finance',
    '/accounting': 'accounting',
    // C3
    '/analytics': 'analytics',
    '/revision-direccion': 'revision_direccion',
    // Portales
    '/mi-portal': 'mi_portal',
    '/mi-equipo': 'mi_equipo',
    '/admin-global': 'admin_global',
  };

  for (const [route, code] of Object.entries(routeToModule)) {
    if (pathname.startsWith(route)) return code;
  }

  return 'dashboard';
}

/**
 * Detecta el tab desde la ruta actual.
 * Ej: /fundacion/organizacion → 'organizacion'
 */
function detectTabFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export const AIHelpModal = ({
  isOpen,
  onClose,
  moduleCode: propModuleCode,
  tabCode: propTabCode,
  sectionName,
}: AIHelpModalProps) => {
  const location = useLocation();
  const { mutate, data, isPending, reset } = useContextHelp();
  const { data: usage } = useAIUsage();

  const moduleCode = propModuleCode || detectModuleFromPath(location.pathname);
  const tabCode = propTabCode || detectTabFromPath(location.pathname);

  // Cargar ayuda al abrir
  useEffect(() => {
    if (isOpen) {
      reset();
      mutate({
        module_code: moduleCode,
        tab_code: tabCode,
        section_name: sectionName,
      });
    }
  }, [isOpen, moduleCode, tabCode, sectionName]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Asistente IA"
      subtitle="¿Dónde estoy y qué puedo hacer?"
      size="md"
      footer={
        <>
          <div className="flex items-center gap-2 mr-auto">
            {data?.ai_enhanced && data?.tokens_used ? (
              <span className="text-xs text-gray-400">{data.tokens_used} tokens</span>
            ) : null}
            {usage && (
              <span
                className={cn(
                  'text-xs flex items-center gap-1',
                  usage.today.remaining === 0
                    ? 'text-red-500 font-medium'
                    : usage.today.remaining <= 10
                      ? 'text-amber-500'
                      : 'text-gray-400'
                )}
              >
                <BarChart3 className="h-3 w-3" />
                {usage.today.remaining === 0
                  ? 'Límite diario alcanzado'
                  : `${usage.today.calls}/${usage.today.limit} llamadas IA hoy`}
              </span>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {isPending ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Consultando al asistente...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Título del módulo */}
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{data.title}</h3>
              {data.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{data.description}</p>
              )}
            </div>
          </div>

          {/* Ayuda del tab */}
          {data.tab_help && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">En esta sección: </span>
                {data.tab_help}
              </p>
            </div>
          )}

          {/* Respuesta IA */}
          {data.ai_enhanced && data.ai_response && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Respuesta IA
                </span>
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                {data.ai_response}
              </div>
            </div>
          )}

          {/* Tips */}
          {data.tips && data.tips.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tips</span>
              </div>
              <ul className="space-y-1">
                {data.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <span className="text-amber-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Haz clic para obtener ayuda sobre esta sección.
          </p>
        </div>
      )}
    </BaseModal>
  );
};
