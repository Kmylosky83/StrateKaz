/**
 * EncuestaPublicaPage - Página pública para responder encuestas DOFA.
 *
 * Accesible SIN autenticación via token UUID.
 * Ruta: /encuestas/responder/:token
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, Send, ChevronRight } from 'lucide-react';
import { Button, Badge, Spinner, Alert, Card } from '@/components/common';
import {
  useEncuestaPublica,
  useResponderEncuestaPublica,
} from '@/features/gestion-estrategica/hooks/useEncuestas';
import type { NivelImpacto, Clasificacion } from '@/features/gestion-estrategica/types/encuestas.types';

interface RespuestaTema {
  tema_id: number;
  clasificacion: Clasificacion;
  justificacion: string;
  impacto_percibido: NivelImpacto;
}

export default function EncuestaPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const { data: encuesta, isLoading, error } = useEncuestaPublica(token || '');
  const responderMutation = useResponderEncuestaPublica();

  const [respuestas, setRespuestas] = useState<Record<number, RespuestaTema>>({});
  const [enviado, setEnviado] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  if (!token) {
    return <ErrorLayout message="Token de encuesta no proporcionado." />;
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Cargando encuesta...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !encuesta) {
    const errorMsg = (error as Error)?.message || '';
    if (errorMsg.includes('404') || errorMsg.includes('no encontrada')) {
      return <ErrorLayout message="Esta encuesta no existe o el enlace ha expirado." />;
    }
    if (errorMsg.includes('cerrada') || errorMsg.includes('closed')) {
      return <ErrorLayout message="Esta encuesta ya fue cerrada y no acepta más respuestas." icon={<Clock className="w-12 h-12 text-amber-400" />} />;
    }
    return <ErrorLayout message="No se pudo cargar la encuesta. Intente nuevamente." />;
  }

  const temas = (encuesta as { temas?: { id: number; titulo: string; descripcion: string; requiere_justificacion?: boolean }[] }).temas || [];

  if (enviado) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Respuestas enviadas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Gracias por participar en la encuesta. Sus respuestas han sido registradas exitosamente.
          </p>
          <Badge variant="success" size="lg">Completado</Badge>
        </div>
      </PublicLayout>
    );
  }

  const updateRespuesta = (temaId: number, field: keyof RespuestaTema, value: string) => {
    setRespuestas(prev => ({
      ...prev,
      [temaId]: {
        ...prev[temaId],
        tema_id: temaId,
        [field]: value,
      } as RespuestaTema,
    }));
  };

  const allAnswered = temas.every((t) => {
    const r = respuestas[t.id];
    return r?.clasificacion && r?.impacto_percibido;
  });

  const handleSubmit = async () => {
    if (!allAnswered) return;

    const payload = {
      respuestas: Object.values(respuestas).map(r => ({
        tema_id: r.tema_id,
        clasificacion: r.clasificacion,
        justificacion: r.justificacion || '',
        impacto_percibido: r.impacto_percibido,
      })),
    };

    await responderMutation.mutateAsync({ token: token!, data: payload });
    setEnviado(true);
  };

  const enc = encuesta as { titulo?: string; descripcion?: string; fecha_cierre?: string };

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {enc.titulo || 'Encuesta'}
          </h1>
          {enc.descripcion && (
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {enc.descripcion}
            </p>
          )}
          {enc.fecha_cierre && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Cierre: {new Date(enc.fecha_cierre).toLocaleDateString('es-CO')}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progreso</span>
            <span>{Object.keys(respuestas).filter(k => respuestas[Number(k)]?.clasificacion).length} / {temas.length}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${temas.length > 0 ? (Object.keys(respuestas).filter(k => respuestas[Number(k)]?.clasificacion).length / temas.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Temas */}
        <div className="space-y-4">
          {temas.map((tema, index) => {
            const r = respuestas[tema.id];
            const isActive = currentStep === index;

            return (
              <Card
                key={tema.id}
                className={`transition-all ${isActive ? 'ring-2 ring-blue-500 shadow-lg' : 'opacity-90'}`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Tema {index + 1} de {temas.length}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                        {tema.titulo}
                      </h3>
                    </div>
                    {r?.clasificacion && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  {tema.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tema.descripcion}</p>
                  )}

                  {/* Clasificación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Clasificación *
                    </label>
                    <div className="flex gap-3">
                      {(['fortaleza', 'debilidad'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateRespuesta(tema.id, 'clasificacion', c); }}
                          className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                            r?.clasificacion === c
                              ? c === 'fortaleza'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                              : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400'
                          }`}
                        >
                          {c === 'fortaleza' ? 'Fortaleza' : 'Debilidad'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Impacto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nivel de Impacto *
                    </label>
                    <div className="flex gap-2">
                      {(['alto', 'medio', 'bajo'] as const).map((nivel) => (
                        <button
                          key={nivel}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateRespuesta(tema.id, 'impacto_percibido', nivel); }}
                          className={`flex-1 py-1.5 px-3 rounded-md border text-sm transition-all ${
                            r?.impacto_percibido === nivel
                              ? nivel === 'alto'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700'
                                : nivel === 'medio'
                                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700'
                                  : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                              : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400'
                          }`}
                        >
                          {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Justificación */}
                  {tema.requiere_justificacion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Justificación
                      </label>
                      <textarea
                        value={r?.justificacion || ''}
                        onChange={(e) => updateRespuesta(tema.id, 'justificacion', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        rows={2}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Explique su respuesta..."
                      />
                    </div>
                  )}

                  {/* Next button */}
                  {isActive && index < temas.length - 1 && r?.clasificacion && r?.impacto_percibido && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setCurrentStep(index + 1); }}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            disabled={!allAnswered || responderMutation.isPending}
            onClick={handleSubmit}
            leftIcon={<Send className="w-5 h-5" />}
          >
            {responderMutation.isPending ? 'Enviando...' : 'Enviar Respuestas'}
          </Button>
        </div>

        {responderMutation.isError && (
          <Alert variant="error" className="mt-4">
            {(responderMutation.error as Error)?.message?.includes('ya respondió')
              ? 'Ya ha respondido esta encuesta anteriormente.'
              : 'Error al enviar las respuestas. Intente nuevamente.'}
          </Alert>
        )}
      </div>
    </PublicLayout>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo-light.png" alt="StrateKaz" className="h-8" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">StrateKaz</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="text-center py-6 text-xs text-gray-400">
        StrateKaz ERP &middot; Encuesta anónima y confidencial
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
          Encuesta no disponible
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </PublicLayout>
  );
}
