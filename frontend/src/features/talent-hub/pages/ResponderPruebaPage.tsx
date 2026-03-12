/**
 * ResponderPruebaPage - Pagina publica para que candidatos respondan pruebas
 *
 * Accesible SIN autenticacion via token unico.
 * Ruta: /pruebas/responder/:token
 *
 * Flujo:
 * 1. Candidato recibe email con link
 * 2. Abre link -> ve instrucciones + preguntas
 * 3. Responde todas las preguntas obligatorias
 * 4. Envia respuestas -> scoring automatico si aplica
 *
 * Usa design system: Card, Button, Badge, Spinner, Alert
 * Renderiza campos dinamicos inline (no DynamicFormRenderer para mantener independencia)
 */
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { cn } from '@/utils/cn';
import { usePruebaPublica, useResponderPrueba } from '../hooks/useSeleccionContratacion';
import { useBrandingPublicoHelpers } from '../hooks/useVacantesPublicas';
import type { CampoPruebaDinamica } from '../types';

// ============================================================================
// Public Layout (same pattern as EncuestaPublicaPage)
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
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {empresaNombre}
          </span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="text-center py-6 text-xs text-gray-400">
        {empresaNombre} &middot; Prueba tecnica confidencial &middot; Powered by StrateKaz
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
          Prueba no disponible
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </PublicLayout>
  );
}

// ============================================================================
// Campo Renderer
// ============================================================================

interface CampoRendererProps {
  campo: CampoPruebaDinamica;
  value: unknown;
  onChange: (value: unknown) => void;
  primaryColor: string;
}

function CampoRenderer({ campo, value, onChange, primaryColor }: CampoRendererProps) {
  const tipo = campo.tipo_campo.toUpperCase();

  // TEXT
  if (tipo === 'TEXT' || tipo === 'EMAIL') {
    return (
      <Input
        type={tipo === 'EMAIL' ? 'email' : 'text'}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder || ''}
        required={campo.es_obligatorio}
      />
    );
  }

  // TEXTAREA
  if (tipo === 'TEXTAREA') {
    return (
      <Textarea
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder || ''}
        rows={4}
        required={campo.es_obligatorio}
      />
    );
  }

  // NUMBER
  if (tipo === 'NUMBER') {
    return (
      <Input
        type="number"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder || '0'}
        required={campo.es_obligatorio}
      />
    );
  }

  // DATE
  if (tipo === 'DATE') {
    return (
      <Input
        type="date"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        required={campo.es_obligatorio}
      />
    );
  }

  // SELECT
  if (tipo === 'SELECT') {
    return (
      <Select
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        required={campo.es_obligatorio}
        placeholder="Seleccionar..."
        options={(campo.opciones || []).map((opt) => ({ value: opt.valor, label: opt.etiqueta }))}
      />
    );
  }

  // RADIO
  if (tipo === 'RADIO') {
    return (
      <div className="space-y-2">
        {(campo.opciones || []).map((opt) => (
          <label
            key={opt.valor}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
              value !== opt.valor &&
                'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
            style={
              value === opt.valor
                ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` }
                : undefined
            }
          >
            <input
              type="radio"
              name={campo.nombre_campo}
              value={opt.valor}
              checked={value === opt.valor}
              onChange={() => onChange(opt.valor)}
              className="w-4 h-4"
              style={{ accentColor: primaryColor }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{opt.etiqueta}</span>
          </label>
        ))}
      </div>
    );
  }

  // CHECKBOX (multiple selection)
  if (tipo === 'CHECKBOX') {
    const selectedValues = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {(campo.opciones || []).map((opt) => {
          const isChecked = selectedValues.includes(opt.valor);
          return (
            <label
              key={opt.valor}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                !isChecked &&
                  'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              style={
                isChecked
                  ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` }
                  : undefined
              }
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  const newValues = isChecked
                    ? selectedValues.filter((v: string) => v !== opt.valor)
                    : [...selectedValues, opt.valor];
                  onChange(newValues);
                }}
                className="w-4 h-4 rounded"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.etiqueta}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // Fallback
  return (
    <Input
      type="text"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={campo.placeholder || ''}
    />
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ResponderPruebaPage() {
  const { token } = useParams<{ token: string }>();
  const { data: prueba, isLoading, error } = usePruebaPublica(token || '');
  const responderMutation = useResponderPrueba();
  const { empresaNombre, logoUrl, primaryColor } = useBrandingPublicoHelpers();

  const [respuestas, setRespuestas] = useState<Record<string, unknown>>({});
  const [enviado, setEnviado] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Sorted campos
  const campos = useMemo(() => {
    if (!prueba?.campos) return [];
    return [...prueba.campos].sort((a, b) => a.orden - b.orden);
  }, [prueba]);

  // Validation
  const camposObligatorios = useMemo(() => campos.filter((c) => c.es_obligatorio), [campos]);

  const allRequired = useMemo(() => {
    return camposObligatorios.every((c) => {
      const val = respuestas[c.nombre_campo];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
  }, [camposObligatorios, respuestas]);

  const answeredCount = useMemo(
    () =>
      campos.filter((c) => {
        const val = respuestas[c.nombre_campo];
        if (val === undefined || val === null || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      }).length,
    [campos, respuestas]
  );

  // Time display
  const vencimientoStr = prueba?.fecha_vencimiento
    ? new Date(prueba.fecha_vencimiento).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const brandingProps = { empresaNombre: empresaNombre || 'StrateKaz', logoUrl, primaryColor };

  // Error states
  if (!token) {
    return <ErrorLayout message="Token de prueba no proporcionado." {...brandingProps} />;
  }

  if (isLoading) {
    return (
      <PublicLayout {...brandingProps}>
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Cargando prueba...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !prueba) {
    const errorMsg = (error as Error)?.message || '';
    if (errorMsg.includes('404') || errorMsg.includes('no encontrada')) {
      return (
        <ErrorLayout message="Esta prueba no existe o el enlace ha expirado." {...brandingProps} />
      );
    }
    if (errorMsg.includes('vencida') || errorMsg.includes('expired')) {
      return (
        <ErrorLayout
          message="El plazo para responder esta prueba ha expirado."
          icon={<Clock className="w-8 h-8 text-amber-400" />}
          {...brandingProps}
        />
      );
    }
    if (errorMsg.includes('completada') || errorMsg.includes('completed')) {
      return (
        <ErrorLayout
          message="Esta prueba ya fue respondida."
          icon={<CheckCircle className="w-8 h-8 text-green-400" />}
          {...brandingProps}
        />
      );
    }
    return (
      <ErrorLayout message="No se pudo cargar la prueba. Intente nuevamente." {...brandingProps} />
    );
  }

  // Success state
  if (enviado) {
    return (
      <PublicLayout {...brandingProps}>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Prueba enviada exitosamente
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Gracias por completar la prueba, {prueba.candidato_nombre}. Sus respuestas han sido
            registradas y seran evaluadas por nuestro equipo.
          </p>
          <Badge variant="success" size="lg">
            Completado
          </Badge>
        </div>
      </PublicLayout>
    );
  }

  // Update respuesta
  const updateRespuesta = (nombreCampo: string, value: unknown) => {
    setRespuestas((prev) => ({ ...prev, [nombreCampo]: value }));
  };

  // Submit
  const handleSubmit = async () => {
    if (!allRequired) return;

    try {
      await responderMutation.mutateAsync({
        token: token!,
        respuestas,
      });
      setEnviado(true);
    } catch {
      // Error handled by mutation
    }
  };

  const _currentCampo = campos[currentQuestion];

  return (
    <PublicLayout {...brandingProps}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <ClipboardCheck className="w-7 h-7" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {prueba.prueba_nombre}
          </h1>
          {prueba.prueba_descripcion && (
            <p className="text-gray-600 dark:text-gray-400 mb-3">{prueba.prueba_descripcion}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>{prueba.candidato_nombre}</span>
            {prueba.vacante_titulo && (
              <>
                <span>&middot;</span>
                <span>{prueba.vacante_titulo}</span>
              </>
            )}
            {prueba.duracion_estimada_minutos > 0 && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />~{prueba.duracion_estimada_minutos} min
                </span>
              </>
            )}
          </div>
          {vencimientoStr && (
            <p className="text-xs text-gray-400 mt-2">Responder antes del {vencimientoStr}</p>
          )}
        </div>

        {/* Instructions */}
        {prueba.instrucciones && <Alert variant="info" message={prueba.instrucciones} />}

        {/* Progress bar */}
        <div className="mb-6 mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progreso</span>
            <span>
              {answeredCount} / {campos.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${campos.length > 0 ? (answeredCount / campos.length) * 100 : 0}%`,
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>

        {/* Questions - Card per question */}
        <div className="space-y-4">
          {campos.map((campo, index) => {
            const isActive = currentQuestion === index;
            const hasValue = (() => {
              const val = respuestas[campo.nombre_campo];
              if (val === undefined || val === null || val === '') return false;
              if (Array.isArray(val) && val.length === 0) return false;
              return true;
            })();

            return (
              <Card
                key={campo.nombre_campo}
                className={cn(
                  'transition-all cursor-pointer',
                  isActive ? 'ring-2 shadow-lg' : 'opacity-80 hover:opacity-100'
                )}
                style={
                  isActive
                    ? ({ '--tw-ring-color': primaryColor } as React.CSSProperties)
                    : undefined
                }
                onClick={() => setCurrentQuestion(index)}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium" style={{ color: primaryColor }}>
                          Pregunta {index + 1} de {campos.length}
                        </span>
                        {campo.es_obligatorio && (
                          <Badge variant="danger" size="sm">
                            Obligatoria
                          </Badge>
                        )}
                        {campo.puntaje && campo.puntaje > 0 && (
                          <Badge variant="gray" size="sm">
                            {campo.puntaje} pts
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {campo.etiqueta}
                      </h3>
                      {campo.descripcion && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {campo.descripcion}
                        </p>
                      )}
                    </div>
                    {hasValue && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Campo input (always visible) */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <CampoRenderer
                      campo={campo}
                      value={respuestas[campo.nombre_campo]}
                      onChange={(val) => updateRespuesta(campo.nombre_campo, val)}
                      primaryColor={primaryColor}
                    />
                  </div>

                  {/* Navigation within card */}
                  {isActive && (
                    <div className="flex justify-between pt-2">
                      <div>
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentQuestion(index - 1);
                            }}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Anterior
                          </Button>
                        )}
                      </div>
                      <div>
                        {index < campos.length - 1 && hasValue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentQuestion(index + 1);
                            }}
                          >
                            Siguiente
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {!allRequired && answeredCount > 0 && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Info className="w-4 h-4" />
              Responde todas las preguntas obligatorias para enviar
            </p>
          )}
          <Button
            size="lg"
            disabled={!allRequired || responderMutation.isPending}
            onClick={handleSubmit}
            isLoading={responderMutation.isPending}
          >
            <Send className="w-5 h-5 mr-2" />
            {responderMutation.isPending ? 'Enviando...' : 'Enviar Respuestas'}
          </Button>
        </div>

        {responderMutation.isError && (
          <Alert
            variant="error"
            className="mt-4"
            message={
              (responderMutation.error as Error)?.message?.includes('ya respondida')
                ? 'Esta prueba ya fue respondida anteriormente.'
                : 'Error al enviar las respuestas. Intente nuevamente.'
            }
          />
        )}
      </div>
    </PublicLayout>
  );
}
