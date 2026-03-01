/**
 * AIHelpModal — Modal de ayuda contextual con IA
 *
 * Muestra información sobre dónde está el usuario y qué puede hacer,
 * con enriquecimiento por IA generativa (Gemini).
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, Lightbulb, X, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { cn } from '@/utils/cn';
import { useContextHelp } from '@/hooks/useIA';

export interface AIHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleCode?: string;
  tabCode?: string;
  sectionName?: string;
}

/**
 * Detecta el módulo desde la ruta actual.
 * Ej: /planeacion-estrategica/planes → 'planeacion_estrategica'
 */
function detectModuleFromPath(pathname: string): string {
  const routeToModule: Record<string, string> = {
    '/configuracion': 'fundacion',
    '/organizacion': 'fundacion',
    '/identidad': 'fundacion',
    '/planeacion-estrategica': 'planeacion_estrategica',
    '/cumplimiento': 'motor_cumplimiento',
    '/riesgos': 'motor_riesgos',
    '/workflows': 'workflow_engine',
    '/hseq': 'hseq_management',
    '/supply-chain': 'supply_chain',
    '/production-ops': 'production_ops',
    '/logistics-fleet': 'logistics_fleet',
    '/sales-crm': 'sales_crm',
    '/talent-hub': 'talent_hub',
    '/admin-finance': 'admin_finance',
    '/accounting': 'accounting',
    '/analytics': 'analytics',
    '/sistema-gestion': 'hseq_management',
  };

  for (const [route, code] of Object.entries(routeToModule)) {
    if (pathname.startsWith(route)) return code;
  }

  return 'dashboard';
}

/**
 * Detecta el tab desde la ruta actual.
 * Ej: /planeacion-estrategica/planes → 'planes'
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
  }, [isOpen, moduleCode, tabCode, sectionName]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Asistente IA
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿Dónde estoy y qué puedo hacer?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {data.description}
                    </p>
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tips
                    </span>
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          {data?.ai_enhanced && data?.tokens_used ? (
            <span className="text-xs text-gray-400">{data.tokens_used} tokens · Powered by AI</span>
          ) : (
            <span />
          )}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
