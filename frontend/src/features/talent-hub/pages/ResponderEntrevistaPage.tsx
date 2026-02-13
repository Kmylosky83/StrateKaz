/**
 * ResponderEntrevistaPage - Pagina publica para que candidatos respondan entrevistas
 *
 * Accesible SIN autenticacion via token unico.
 * Ruta: /entrevistas/responder/:token
 *
 * Flujo:
 * 1. Candidato recibe email con link
 * 2. Abre link -> ve instrucciones + preguntas
 * 3. Responde todas las preguntas
 * 4. Envia respuestas -> HR las evalua despues
 *
 * Usa design system: Card, Button, Badge, Spinner, Alert
 */
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, Send, MessageSquare, Info } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import {
  useEntrevistaPublica,
  useResponderEntrevistaAsync,
} from '../hooks/useSeleccionContratacion';
import type { PreguntaEntrevistaAsync } from '../types';

// ============================================================================
// Public Layout
// ============================================================================

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo-light.png" alt="StrateKaz" className="h-8" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">StrateKaz</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="text-center py-6 text-xs text-gray-400">
        StrateKaz ERP &middot; Entrevista confidencial
      </footer>
    </div>
  );
}

function ErrorLayout({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon || <AlertCircle className="w-8 h-8 text-red-500" />}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Entrevista no disponible
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </PublicLayout>
  );
}

// ============================================================================
// Pregunta Renderer
// ============================================================================

interface PreguntaRendererProps {
  pregunta: PreguntaEntrevistaAsync;
  value: string;
  onChange: (value: string) => void;
  index: number;
}

function PreguntaRenderer({ pregunta, value, onChange, index }: PreguntaRendererProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        <span className="text-indigo-600 dark:text-indigo-400 mr-1">{index + 1}.</span>
        {pregunta.pregunta}
        {pregunta.obligatoria && <span className="text-red-500 ml-1">*</span>}
      </label>
      {pregunta.descripcion && <p className="text-xs text-gray-500">{pregunta.descripcion}</p>}

      {/* Texto corto */}
      {pregunta.tipo === 'texto_corto' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Escribe tu respuesta..."
        />
      )}

      {/* Texto largo */}
      {pregunta.tipo === 'texto_largo' && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
          placeholder="Escribe tu respuesta detallada..."
        />
      )}

      {/* Opcion multiple */}
      {pregunta.tipo === 'opcion_multiple' && (
        <div className="space-y-2">
          {(pregunta.opciones || []).map((opcion, i) => (
            <label
              key={i}
              className={cn(
                'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                value === opcion
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
                value={opcion}
                checked={value === opcion}
                onChange={() => onChange(opcion)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opcion}</span>
            </label>
          ))}
        </div>
      )}

      {/* Escala */}
      {pregunta.tipo === 'escala' && (
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from(
            { length: (pregunta.escala_max || 10) - (pregunta.escala_min || 1) + 1 },
            (_, i) => i + (pregunta.escala_min || 1)
          ).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className={cn(
                'w-10 h-10 rounded-lg border text-sm font-medium transition-all',
                value === String(n)
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ResponderEntrevistaPage() {
  const { token } = useParams<{ token: string }>();
  const { data: entrevista, isLoading, error } = useEntrevistaPublica(token || '');
  const responderMutation = useResponderEntrevistaAsync();

  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const preguntas: PreguntaEntrevistaAsync[] = useMemo(() => {
    if (!entrevista?.preguntas) return [];
    return [...entrevista.preguntas].sort((a, b) => a.orden - b.orden);
  }, [entrevista]);

  const totalObligatorias = preguntas.filter((p) => p.obligatoria).length;
  const respondidas = preguntas.filter((p) => p.obligatoria && respuestas[p.id]?.trim()).length;
  const progress = totalObligatorias > 0 ? (respondidas / totalObligatorias) * 100 : 0;

  const handleRespuestaChange = (preguntaId: string, value: string) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: value }));
  };

  const handleSubmit = () => {
    if (!token) return;

    // Validate required
    for (const pregunta of preguntas) {
      if (pregunta.obligatoria && !respuestas[pregunta.id]?.trim()) {
        return;
      }
    }

    responderMutation.mutate(
      { token, respuestas },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  // Loading
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </PublicLayout>
    );
  }

  // Error
  if (error) {
    const errorData = (
      error as {
        response?: { data?: { completada?: boolean; expirada?: boolean; detail?: string } };
      }
    )?.response?.data;
    if (errorData?.completada) {
      return (
        <ErrorLayout
          message="Ya completaste esta entrevista. Gracias por tu participacion."
          icon={<CheckCircle className="w-8 h-8 text-green-500" />}
        />
      );
    }
    if (errorData?.expirada) {
      return (
        <ErrorLayout
          message="El plazo para responder esta entrevista ha vencido."
          icon={<Clock className="w-8 h-8 text-amber-500" />}
        />
      );
    }
    return <ErrorLayout message={errorData?.detail || 'Entrevista no encontrada.'} />;
  }

  if (!entrevista) {
    return <ErrorLayout message="Entrevista no encontrada." />;
  }

  // Success
  if (submitted) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Entrevista completada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gracias por tus respuestas, {entrevista.candidato_nombre}. Nuestro equipo las revisara y
            te contactaremos pronto.
          </p>
        </div>
      </PublicLayout>
    );
  }

  // Main form
  return (
    <PublicLayout>
      {/* Header card */}
      <Card className="mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {entrevista.titulo}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Hola <strong>{entrevista.candidato_nombre}</strong>, por favor responde las siguientes
              preguntas.
            </p>

            {entrevista.instrucciones && (
              <Alert variant="info" className="mb-3">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>{entrevista.instrucciones}</span>
              </Alert>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                {preguntas.length} preguntas
              </span>
              {entrevista.fecha_vencimiento && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Vence:{' '}
                  {new Date(entrevista.fecha_vencimiento).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>
              {respondidas} de {totalObligatorias} obligatorias
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {preguntas.map((pregunta, index) => (
          <Card key={pregunta.id} className="p-5">
            <PreguntaRenderer
              pregunta={pregunta}
              value={respuestas[pregunta.id] || ''}
              onChange={(value) => handleRespuestaChange(pregunta.id, value)}
              index={index}
            />
          </Card>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          isLoading={responderMutation.isPending}
          disabled={respondidas < totalObligatorias}
          size="lg"
        >
          <Send size={18} className="mr-2" />
          Enviar Respuestas
        </Button>
      </div>
    </PublicLayout>
  );
}
