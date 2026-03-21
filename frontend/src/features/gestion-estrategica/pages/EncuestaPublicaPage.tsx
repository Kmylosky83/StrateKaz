/**
 * EncuestaPublicaPage - Pagina publica para responder encuestas DOFA.
 *
 * Accesible SIN autenticacion via token UUID.
 * Ruta: /encuestas/responder/:token
 *
 * Wizard single-question con:
 * - Branding dinamico del tenant
 * - Persistencia localStorage
 * - Navegacion swipe + botones
 * - Responsive mobile-first
 * - Layout full-width (Typeform-style)
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  ChevronRight,
  ChevronLeft,
  Building2,
  Shield,
  RotateCcw,
  ListChecks,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge, Spinner, Alert } from '@/components/common';
import { Textarea } from '@/components/forms';
import {
  useEncuestaPublica,
  useResponderEncuestaPublica,
} from '@/features/gestion-estrategica/hooks/useEncuestas';
import type {
  NivelImpacto,
  Clasificacion,
  EncuestaPublica as EncuestaPublicaType,
  EncuestaBranding,
  TemaPublico,
} from '@/features/gestion-estrategica/types/encuestas.types';

// ============================================================================
// TYPES
// ============================================================================

interface RespuestaTema {
  tema_id: number;
  clasificacion: Clasificacion;
  justificacion: string;
  impacto_percibido: NivelImpacto;
}

interface SavedProgress {
  respuestas: Record<number, RespuestaTema>;
  currentStep: number;
  lastSaved: number;
}

type WizardScreen = 'welcome' | 'question' | 'summary' | 'thanks';

// ============================================================================
// HELPERS
// ============================================================================

const STORAGE_KEY_PREFIX = 'encuesta_progress_';
const MARKETING_URL = 'https://stratekaz.com';

function getSavedProgress(token: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    if (Date.now() - parsed.lastSaved > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${token}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveProgress(token: string, data: SavedProgress) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${token}`, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

function clearProgress(token: string) {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${token}`);
  } catch {
    // ignore
  }
}

function getBrandColors(branding?: EncuestaBranding | null) {
  return {
    primary: branding?.primary_color || '#3b82f6',
    secondary: branding?.secondary_color || '#6366f1',
    accent: branding?.accent_color || '#ec4899',
  };
}

function getSectionLabel(tema: TemaPublico): string {
  if (tema.capacidad_pci) {
    const labels: Record<string, string> = {
      directiva: 'Capacidad Directiva',
      talento_humano: 'Capacidad del Talento Humano',
      tecnologica: 'Capacidad Tecnológica',
      competitiva: 'Capacidad Competitiva',
      financiera: 'Capacidad Financiera',
    };
    return labels[tema.capacidad_pci] || 'PCI';
  }
  if (tema.factor_poam) {
    const labels: Record<string, string> = {
      economico: 'Factores Económicos',
      politico: 'Factores Políticos',
      social: 'Factores Sociales',
      tecnologico: 'Factores Tecnológicos',
      geografico: 'Factores Geográficos',
    };
    return labels[tema.factor_poam] || 'POAM';
  }
  return '';
}

/** Resolve empresa name with robust fallback */
function resolveEmpresaNombre(enc?: EncuestaPublicaType): string {
  if (enc?.empresa_nombre && enc.empresa_nombre !== 'Empresa Sin Configurar') {
    return enc.empresa_nombre;
  }
  if (enc?.branding?.empresa_nombre) {
    return enc.branding.empresa_nombre;
  }
  return enc?.empresa_nombre || 'Organización';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EncuestaPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const { data: encuesta, isLoading, error } = useEncuestaPublica(token || '');
  const responderMutation = useResponderEncuestaPublica();

  const [respuestas, setRespuestas] = useState<Record<number, RespuestaTema>>({});
  const [screen, setScreen] = useState<WizardScreen>('welcome');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const enc = encuesta as EncuestaPublicaType | undefined;
  const temas = enc?.temas || [];

  // Keyboard navigation: Enter/→ = siguiente, ←/Escape = anterior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'question') {
        if (screen === 'welcome' && e.key === 'Enter') {
          e.preventDefault();
          setScreen('question');
          setQuestionIndex(0);
        }
        return;
      }
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        const tema = temas[questionIndex];
        const r = respuestas[tema?.id];
        const answered = !!(r?.clasificacion && r?.impacto_percibido);
        if (answered) {
          if (questionIndex < temas.length - 1) {
            setSlideDirection('right');
            setQuestionIndex((i) => i + 1);
          } else {
            setScreen('summary');
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        e.preventDefault();
        if (questionIndex > 0) {
          setSlideDirection('left');
          setQuestionIndex((i) => i - 1);
        } else {
          setScreen('welcome');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, questionIndex, respuestas, temas]);
  const isPciPoam = enc?.tipo_encuesta === 'pci_poam';
  const empresaNombre = resolveEmpresaNombre(enc);
  const brand = getBrandColors(enc?.branding);

  useEffect(() => {
    if (!enc) return;
    const nombre = resolveEmpresaNombre(enc);
    if (nombre) document.title = `${enc.titulo || 'Encuesta'} — ${nombre}`;
    const faviconUrl = enc.branding?.favicon_url;
    if (faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
    return () => {
      document.title = 'StrateKaz';
    };
  }, [enc]);

  useEffect(() => {
    if (!token || !enc) return;
    const saved = getSavedProgress(token);
    if (saved && Object.keys(saved.respuestas).length > 0) {
      setShowResumePrompt(true);
    }
  }, [token, enc]);

  useEffect(() => {
    if (!token || screen === 'thanks' || screen === 'welcome') return;
    if (Object.keys(respuestas).length === 0) return;
    saveProgress(token, {
      respuestas,
      currentStep: questionIndex,
      lastSaved: Date.now(),
    });
  }, [respuestas, questionIndex, token, screen]);

  const answeredCount = useMemo(
    () => Object.values(respuestas).filter((r) => r?.clasificacion && r?.impacto_percibido).length,
    [respuestas]
  );

  const allAnswered = temas.length > 0 && answeredCount === temas.length;
  const currentTema = temas[questionIndex] as TemaPublico | undefined;
  const currentRespuesta = currentTema ? respuestas[currentTema.id] : undefined;
  const currentAnswered = !!(
    currentRespuesta?.clasificacion && currentRespuesta?.impacto_percibido
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const updateRespuesta = useCallback(
    (temaId: number, field: keyof RespuestaTema, value: string) => {
      setRespuestas((prev) => ({
        ...prev,
        [temaId]: {
          ...prev[temaId],
          tema_id: temaId,
          [field]: value,
        } as RespuestaTema,
      }));
    },
    []
  );

  const goNext = useCallback(() => {
    if (questionIndex < temas.length - 1) {
      setSlideDirection('right');
      setQuestionIndex((i) => i + 1);
    } else {
      setScreen('summary');
    }
  }, [questionIndex, temas.length]);

  const goPrev = useCallback(() => {
    if (questionIndex > 0) {
      setSlideDirection('left');
      setQuestionIndex((i) => i - 1);
    } else {
      setScreen('welcome');
    }
  }, [questionIndex]);

  const handleStart = useCallback(() => {
    setScreen('question');
    setQuestionIndex(0);
  }, []);

  const handleResume = useCallback(() => {
    if (!token) return;
    const saved = getSavedProgress(token);
    if (saved) {
      setRespuestas(saved.respuestas);
      setQuestionIndex(Math.min(saved.currentStep, temas.length - 1));
    }
    setShowResumePrompt(false);
    setScreen('question');
  }, [token, temas.length]);

  const handleStartFresh = useCallback(() => {
    if (token) clearProgress(token);
    setRespuestas({});
    setShowResumePrompt(false);
    setScreen('question');
    setQuestionIndex(0);
  }, [token]);

  const handleSubmit = useCallback(async () => {
    if (!allAnswered || !token) return;

    const payload = {
      respuestas: Object.values(respuestas).map((r) => ({
        tema_id: r.tema_id,
        clasificacion: r.clasificacion,
        justificacion: r.justificacion || '',
        impacto_percibido: r.impacto_percibido,
      })),
    };

    await responderMutation.mutateAsync({ token, data: payload });
    clearProgress(token);
    setScreen('thanks');
  }, [allAnswered, token, respuestas, responderMutation]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (screen !== 'question') return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < -60 && currentAnswered) goNext();
      else if (dx > 60) goPrev();
    },
    [screen, currentAnswered, goNext, goPrev]
  );

  // ============================================================================
  // LOADING / ERROR STATES
  // ============================================================================

  if (!token) {
    return <ErrorLayout message="Token de encuesta no proporcionado." />;
  }

  if (isLoading) {
    return (
      <PublicLayout brand={brand}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Cargando encuesta...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !enc) {
    const errorMsg = (error as Error)?.message || '';
    if (errorMsg.includes('404') || errorMsg.includes('no encontrada')) {
      return <ErrorLayout message="Esta encuesta no existe o el enlace ha expirado." />;
    }
    if (errorMsg.includes('cerrada') || errorMsg.includes('closed')) {
      return (
        <ErrorLayout
          message="Esta encuesta ya fue cerrada y no acepta mas respuestas."
          icon={<Clock className="w-12 h-12 text-amber-400" />}
        />
      );
    }
    return <ErrorLayout message="No se pudo cargar la encuesta. Intente nuevamente." />;
  }

  if (enc.puede_responder === false && enc.razon) {
    return (
      <PublicLayout empresaNombre={empresaNombre} brand={brand} logoUrl={enc.branding?.logo_url}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
            {enc.titulo}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{enc.razon}</p>
        </div>
      </PublicLayout>
    );
  }

  // ============================================================================
  // SCREEN: THANKS
  // ============================================================================

  if (screen === 'thanks') {
    return (
      <PublicLayout empresaNombre={empresaNombre} brand={brand} logoUrl={enc.branding?.logo_url}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
            style={{ backgroundColor: `${brand.primary}15` }}
          >
            <CheckCircle className="w-12 h-12" style={{ color: brand.primary }} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 text-center">
            ¡Gracias por participar!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-lg text-base sm:text-lg">
            Sus respuestas han sido registradas exitosamente para <strong>{empresaNombre}</strong>.
          </p>
          <Badge variant="success" size="lg">
            {answeredCount} respuestas enviadas
          </Badge>
        </div>
      </PublicLayout>
    );
  }

  // ============================================================================
  // SCREEN: WELCOME
  // ============================================================================

  if (screen === 'welcome') {
    const sectionLabel = isPciPoam ? 'Diagnóstico PCI-POAM' : 'Encuesta de Contexto';

    return (
      <PublicLayout empresaNombre={empresaNombre} brand={brand} logoUrl={enc.branding?.logo_url}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full max-w-2xl lg:max-w-3xl text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{
                backgroundColor: `${brand.primary}12`,
                color: brand.primary,
              }}
            >
              <Shield className="w-4 h-4" />
              {sectionLabel}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {enc.titulo || 'Encuesta'}
            </h1>

            {enc.descripcion && (
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
                {enc.descripcion}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm text-gray-500 mb-10">
              {enc.responsable_nombre && (
                <span className="truncate max-w-[250px]">
                  Responsable: {enc.responsable_nombre}
                </span>
              )}
              {enc.fecha_cierre && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Cierre: {new Date(enc.fecha_cierre).toLocaleDateString('es-CO')}</span>
                </div>
              )}
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-md mx-auto mb-10">
              <div
                className="rounded-2xl p-5 border text-center"
                style={{
                  backgroundColor: `${brand.primary}06`,
                  borderColor: `${brand.primary}20`,
                }}
              >
                <div
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ color: brand.primary }}
                >
                  {temas.length}
                </div>
                <div className="text-sm text-gray-500 font-medium">Preguntas</div>
              </div>
              <div
                className="rounded-2xl p-5 border text-center"
                style={{
                  backgroundColor: `${brand.primary}06`,
                  borderColor: `${brand.primary}20`,
                }}
              >
                <div
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ color: brand.primary }}
                >
                  ~{Math.ceil(temas.length * 0.4)}
                </div>
                <div className="text-sm text-gray-500 font-medium">Min. aprox.</div>
              </div>
            </div>

            {/* Privacy note */}
            <p className="text-xs sm:text-sm text-gray-400 mb-8 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0" />
              Anónima y confidencial — No necesita cuenta para responder
            </p>

            {/* Resume prompt */}
            {showResumePrompt ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tiene progreso guardado de una sesión anterior
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={handleResume}
                    leftIcon={<RotateCcw className="w-5 h-5" />}
                    style={{ backgroundColor: brand.primary }}
                    className="text-white min-h-[52px] text-base px-8"
                  >
                    Continuar ({answeredCount || '...'})
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleStartFresh}
                    className="min-h-[52px] text-base"
                  >
                    Empezar de nuevo
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={handleStart}
                rightIcon={<ChevronRight className="w-5 h-5" />}
                style={{ backgroundColor: brand.primary }}
                className="text-white min-h-[52px] w-full sm:w-auto px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Comenzar Encuesta
              </Button>
            )}

            {temas.length === 0 && (
              <Alert variant="warning" className="mt-8">
                No se encontraron preguntas para esta encuesta.
              </Alert>
            )}
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ============================================================================
  // SCREEN: SUMMARY
  // ============================================================================

  if (screen === 'summary') {
    const unanswered = temas.filter(
      (t) => !respuestas[t.id]?.clasificacion || !respuestas[t.id]?.impacto_percibido
    );

    return (
      <PublicLayout empresaNombre={empresaNombre} brand={brand} logoUrl={enc.branding?.logo_url}>
        <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="text-center mb-8">
            <ListChecks className="w-12 h-12 mx-auto mb-4" style={{ color: brand.primary }} />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Resumen de respuestas
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              {answeredCount} de {temas.length} preguntas respondidas
            </p>
          </div>

          {unanswered.length > 0 && (
            <Alert variant="warning" className="mb-6">
              Faltan {unanswered.length} pregunta(s) por responder.
            </Alert>
          )}

          {/* Summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 max-h-[55vh] overflow-y-auto pr-1">
            {temas.map((tema, i) => {
              const r = respuestas[tema.id];
              const answered = !!(r?.clasificacion && r?.impacto_percibido);
              return (
                <button
                  key={tema.id}
                  type="button"
                  onClick={() => {
                    setQuestionIndex(i);
                    setScreen('question');
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm active:scale-[0.99] ${
                    answered
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                  }`}
                >
                  <span className="flex-shrink-0">
                    {answered ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {i + 1}. {tema.titulo}
                    </p>
                    {answered && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {getClasificacionLabel(r.clasificacion)} · Impacto {r.impacto_percibido}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setScreen('question');
                setQuestionIndex(temas.length - 1);
              }}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              className="min-h-[48px]"
            >
              Volver a preguntas
            </Button>
            <Button
              size="lg"
              disabled={!allAnswered || responderMutation.isPending}
              onClick={handleSubmit}
              leftIcon={<Send className="w-5 h-5" />}
              style={allAnswered ? { backgroundColor: brand.primary } : undefined}
              className={allAnswered ? 'text-white min-h-[48px] shadow-lg px-8' : 'min-h-[48px]'}
            >
              {responderMutation.isPending ? 'Enviando...' : 'Enviar Respuestas'}
            </Button>
          </div>

          {responderMutation.isError && (
            <Alert variant="error" className="mt-6">
              {(responderMutation.error as Error)?.message?.includes('ya respondido')
                ? 'Ya ha respondido esta encuesta anteriormente.'
                : 'Error al enviar las respuestas. Intente nuevamente.'}
            </Alert>
          )}
        </div>
      </PublicLayout>
    );
  }

  // ============================================================================
  // SCREEN: QUESTION (wizard single-question)
  // ============================================================================

  if (!currentTema) {
    return (
      <PublicLayout empresaNombre={empresaNombre} brand={brand} logoUrl={enc.branding?.logo_url}>
        <ErrorLayout message="No se encontraron preguntas." />
      </PublicLayout>
    );
  }

  const sectionLabel = isPciPoam ? getSectionLabel(currentTema) : '';
  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === temas.length - 1;
  const prevTema = questionIndex > 0 ? temas[questionIndex - 1] : null;
  const showSectionHeader = isPciPoam && (!prevTema || getSectionLabel(prevTema) !== sectionLabel);

  return (
    <PublicLayout empresaNombre={empresaNombre} brand={brand} logoUrl={enc.branding?.logo_url}>
      <div
        className="w-full max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span className="font-medium">
              Pregunta {questionIndex + 1} de {temas.length}
            </span>
            <span className="font-bold text-base" style={{ color: brand.primary }}>
              {Math.round(((questionIndex + 1) / temas.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((questionIndex + 1) / temas.length) * 100}%`,
                backgroundColor: brand.primary,
              }}
            />
          </div>
          {sectionLabel && (
            <div
              className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${brand.primary}12`,
                color: brand.primary,
              }}
            >
              {sectionLabel}
            </div>
          )}
        </div>

        {/* Section transition header */}
        {showSectionHeader && (
          <div
            className="rounded-xl p-4 mb-6 border text-center"
            style={{
              backgroundColor: `${brand.primary}08`,
              borderColor: `${brand.primary}25`,
            }}
          >
            <p className="text-sm font-bold" style={{ color: brand.primary }}>
              {sectionLabel}
            </p>
          </div>
        )}

        {/* Question card */}
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 sm:p-8 transition-transform duration-300 ease-in-out"
          key={currentTema.id}
          style={{
            animation: `slideIn${slideDirection === 'right' ? 'Right' : 'Left'} 0.3s ease-out`,
          }}
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-relaxed mb-6">
            {currentTema.titulo}
          </h3>

          {currentTema.descripcion && (
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {currentTema.descripcion}
            </p>
          )}

          {/* Clasificación */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Clasificación *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(currentTema.clasificacion_esperada === 'oa'
                ? (['oportunidad', 'amenaza'] as const)
                : (['fortaleza', 'debilidad'] as const)
              ).map((c) => {
                const isSelected = currentRespuesta?.clasificacion === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateRespuesta(currentTema.id, 'clasificacion', c)}
                    className={`py-4 px-4 rounded-xl border-2 text-sm font-bold transition-all min-h-[56px] w-full ${
                      isSelected
                        ? 'shadow-md scale-[1.02]'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400 active:scale-[0.98]'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: getClasificacionColor(c),
                            backgroundColor: `${getClasificacionColor(c)}15`,
                            color: getClasificacionColor(c),
                          }
                        : undefined
                    }
                  >
                    {getClasificacionLabel(c)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impacto */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Nivel de Impacto *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['alto', 'medio', 'bajo'] as const).map((nivel) => {
                const isSelected = currentRespuesta?.impacto_percibido === nivel;
                const impactoColor =
                  nivel === 'alto' ? '#ef4444' : nivel === 'medio' ? '#f59e0b' : '#3b82f6';
                return (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => updateRespuesta(currentTema.id, 'impacto_percibido', nivel)}
                    className={`py-3.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all min-h-[52px] w-full ${
                      isSelected
                        ? 'shadow-sm scale-[1.02]'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400 active:scale-[0.98]'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: impactoColor,
                            backgroundColor: `${impactoColor}15`,
                            color: impactoColor,
                          }
                        : undefined
                    }
                  >
                    {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Justificacion */}
          {enc.requiere_justificacion && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Justificación (opcional)
              </label>
              <Textarea
                value={currentRespuesta?.justificacion || ''}
                onChange={(e) => updateRespuesta(currentTema.id, 'justificacion', e.target.value)}
                rows={3}
                placeholder="Explique brevemente su respuesta..."
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 gap-4">
          <Button
            variant="outline"
            onClick={goPrev}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            className="min-h-[48px]"
          >
            {isFirstQuestion ? 'Inicio' : 'Anterior'}
          </Button>

          {/* Dots indicator (desktop, max 30 questions) */}
          {!isMobile && temas.length <= 30 && (
            <div className="flex items-center gap-1.5 overflow-hidden flex-wrap justify-center max-w-[300px]">
              {temas.map((_, i) => {
                const t = temas[i];
                const answered = !!(
                  respuestas[t.id]?.clasificacion && respuestas[t.id]?.impacto_percibido
                );
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSlideDirection(i > questionIndex ? 'right' : 'left');
                      setQuestionIndex(i);
                    }}
                    className="w-2.5 h-2.5 rounded-full transition-all hover:opacity-80"
                    style={{
                      backgroundColor:
                        i === questionIndex
                          ? brand.primary
                          : answered
                            ? `${brand.primary}60`
                            : '#d1d5db',
                      transform: i === questionIndex ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </div>
          )}

          <Button
            onClick={isLastQuestion ? () => setScreen('summary') : goNext}
            disabled={!currentAnswered}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            style={currentAnswered ? { backgroundColor: brand.primary } : undefined}
            className={currentAnswered ? 'text-white min-h-[48px] shadow-md' : 'min-h-[48px]'}
          >
            {isLastQuestion ? 'Revisar' : 'Siguiente'}
          </Button>
        </div>

        {/* Answered counter */}
        <p className="text-center text-xs sm:text-sm text-gray-400 mt-4">
          {answeredCount} de {temas.length} respondidas
          {isMobile ? ' · Deslice para navegar' : ' · Use ← → para navegar'}
        </p>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </PublicLayout>
  );
}

// ============================================================================
// CLASIFICACION HELPERS
// ============================================================================

function getClasificacionLabel(c: Clasificacion): string {
  const labels: Record<Clasificacion, string> = {
    fortaleza: 'Fortaleza',
    debilidad: 'Debilidad',
    oportunidad: 'Oportunidad',
    amenaza: 'Amenaza',
  };
  return labels[c] || c;
}

function getClasificacionColor(c: Clasificacion): string {
  const colors: Record<Clasificacion, string> = {
    fortaleza: '#22c55e',
    debilidad: '#ef4444',
    oportunidad: '#3b82f6',
    amenaza: '#f59e0b',
  };
  return colors[c] || '#6b7280';
}

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

function PublicLayout({
  children,
  empresaNombre,
  brand,
  logoUrl,
}: {
  children: React.ReactNode;
  empresaNombre?: string;
  brand?: ReturnType<typeof getBrandColors>;
  logoUrl?: string;
}) {
  const primaryColor = brand?.primary || '#3b82f6';
  const [logoError, setLogoError] = useState(false);
  const showLogo = logoUrl && !logoError;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header — full width */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {showLogo ? (
                <img
                  src={logoUrl}
                  alt={empresaNombre || 'Logo'}
                  className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[220px] object-contain flex-shrink-0"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">
                  {empresaNombre || 'Organización'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Diagnóstico Organizacional
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 flex-shrink-0">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Anonima y confidencial</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main — flex-1 to push footer down */}
      <main className="flex-1 w-full">{children}</main>

      {/* Footer — always at bottom */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-400">
            {empresaNombre || 'Organización'} &middot; Encuesta anónima y confidencial
          </p>
          <a
            href={MARKETING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Powered by <span className="font-semibold">StrateKaz</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}

function ErrorLayout({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          {icon || <AlertCircle className="w-8 h-8 text-red-500" />}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
          Encuesta no disponible
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{message}</p>
      </div>
    </PublicLayout>
  );
}
