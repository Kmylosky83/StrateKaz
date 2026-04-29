/**
 * CoberturaPanel - Panel de cobertura documental.
 * Muestra qué tipos de documento tienen cobertura y cuáles faltan.
 * Sprint 3: Conecta con GET /documentos/cobertura-documental/
 */
import { useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Card, Badge, Spinner } from '@/components/common';
import { useCoberturaDocumental } from '../hooks/useGestionDocumental';

export default function CoberturaPanel() {
  const { data: cobertura, isLoading } = useCoberturaDocumental();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Spinner size="sm" />
          <span className="text-sm text-gray-500">Calculando cobertura documental...</span>
        </div>
      </Card>
    );
  }

  if (!cobertura) return null;

  const coberturaColor =
    cobertura.cobertura_pct >= 80
      ? 'text-green-600 dark:text-green-400'
      : cobertura.cobertura_pct >= 50
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';

  const barColor =
    cobertura.cobertura_pct >= 80
      ? 'bg-green-500'
      : cobertura.cobertura_pct >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <Card className="p-4">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Cobertura Documental
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${coberturaColor}`}>
                {cobertura.cobertura_pct}%
              </span>
              <span className="text-xs text-gray-500">
                ({cobertura.con_documentos}/{cobertura.total_tipos} tipos cubiertos)
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Progress bar */}
      <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${cobertura.cobertura_pct}%` }}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Detalle por tipo */}
          <div className="space-y-2">
            {cobertura.detalle_por_tipo.map((tipo) => (
              <div
                key={tipo.tipo_codigo}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  {tipo.total_documentos > 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {tipo.tipo_nombre}
                    </p>
                    <p className="text-xs text-gray-500">{tipo.tipo_codigo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tipo.vigentes > 0 && (
                    <Badge variant="success" size="sm">
                      {tipo.vigentes} vigente{tipo.vigentes !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {tipo.borradores > 0 && (
                    <Badge variant="warning" size="sm">
                      {tipo.borradores} borrador{tipo.borradores !== 1 ? 'es' : ''}
                    </Badge>
                  )}
                  {tipo.obsoletos > 0 && (
                    <Badge variant="danger" size="sm">
                      {tipo.obsoletos} obsoleto{tipo.obsoletos !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {tipo.total_documentos === 0 && (
                    <Badge variant="secondary" size="sm">
                      Sin documentos
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Workflows sin procedimiento */}
          {cobertura.workflows_sin_procedimiento.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Workflows sin procedimiento documentado
              </p>
              <div className="space-y-1">
                {cobertura.workflows_sin_procedimiento.map((wf) => (
                  <div
                    key={wf.workflow_id}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {wf.workflow_nombre}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
