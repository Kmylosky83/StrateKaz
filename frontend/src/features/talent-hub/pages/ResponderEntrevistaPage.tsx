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
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { cn } from '@/utils/cn';
import {
  useEntrevistaPublica,
  useResponderEntrevistaAsync,
} from '../hooks/useSeleccionContratacion';
import { useBrandingPublicoHelpers } from '../hooks/useVacantesPublicas';
import type { PreguntaEntrevistaAsync } from '../types';

// ============================================================================
// Public Layout
// ============================================================================

function PublicLayout({
  children,
  empresaNombre,
  logoUrl,
  primaryColor,
}: {
  children: React.ReactNode;
  empresaNombre: string;
  logoUrl: string | null;
  primaryColor: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="h-1" style={{ backgroundColor: primaryColor }} />
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={empresaNombre}
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {empresaNombre}
          </span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="text-center py-6 text-xs text-gray-400">
        {empresaNombre} &middot; Entrevista confidencial &middot; Powered by StrateKaz
      </footer>
    </div>
  );
}

function ErrorLayout({
  message,
  icon,
  empresaNombre,
  logoUrl,
  primaryColor,
}: {
  message: string;
  icon?: React.ReactNode;
  empresaNombre: string;
  logoUrl: string | null;
  primaryColor: string;
}) {
  return (
    <PublicLayout empresaNombre={empresaNombre} logoUrl={logoUrl} primaryColor={primaryColor}>
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
  primaryColor: string;
}

function PreguntaRenderer({
  pregunta,
  value,
  onChange,
  index,
  primaryColor,
}: PreguntaRendererProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        <span className="mr-1" style={{ color: primaryColor }}>
          {index + 1}.
        </span>
        {pregunta.pregunta}
        {pregunta.obligatoria && <span className="text-red-500 ml-1">*</span>}
      </label>
      {pregunta.descripcion && <p className="text-xs text-gray-500">{pregunta.descripcion}</p>}

      {/* Texto corto */}
      {pregunta.tipo === 'texto_corto' && (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe tu respuesta..."
        />
      )}

      {/* Texto largo */}
      {pregunta.tipo === 'texto_largo' && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
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
                  ? 'border-2'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
              style={
                value === opcion
                  ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` }
                  : undefined
              }
            >
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
                value={opcion}
                checked={value === opcion}
                onChange={() => onChange(opcion)}
                style={{ accentColor: primaryColor }}
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
            <Button
              key={n}
              type="button"
              size="sm"
              variant={value === String(n) ? 'primary' : 'outline'}
              onClick={() => onChange(String(n))}
              className="w-10 !px-0"
            >
              {n}
            </Button>
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
  const { empresaNombre, logoUrl, primaryColor } = useBrandingPublicoHelpers();

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

  const brandingProps = { empresaNombre: empresaNombre || 'StrateKaz', logoUrl, primaryColor };

  // Loading
  if (isLoading) {
    return (
      <PublicLayout {...brandingProps}>
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
          {...brandingProps}
        />
      );
    }
    if (errorData?.expirada) {
      return (
        <ErrorLayout
          message="El plazo para responder esta entrevista ha vencido."
          icon={<Clock className="w-8 h-8 text-amber-500" />}
          {...brandingProps}
        />
      );
    }
    return (
      <ErrorLayout message={errorData?.detail || 'Entrevista no encontrada.'} {...brandingProps} />
    );
  }

  if (!entrevista) {
    return <ErrorLayout message="Entrevista no encontrada." {...brandingProps} />;
  }

  // Success
  if (submitted) {
    return (
      <PublicLayout {...brandingProps}>
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
    <PublicLayout {...brandingProps}>
      {/* Header card */}
      <Card className="mb-6 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
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
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
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
              primaryColor={primaryColor}
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
