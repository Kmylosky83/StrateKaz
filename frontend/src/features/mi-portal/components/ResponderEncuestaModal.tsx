/**
 * ResponderEncuestaModal
 *
 * Modal para que los colaboradores respondan una encuesta DOFA o PCI-POAM.
 * Agrupa las preguntas por capacidad/factor y permite responder todas en una sola
 * sesión scrollable. Las respuestas se guardan en estado local y se envían al
 * cerrar mediante POST (nuevas) o PATCH (modificadas).
 *
 * UX:
 * - Progreso sticky con barra de avance
 * - Preguntas agrupadas por sección (PCI-POAM) o sin agrupar (libre)
 * - Botones de clasificación con color semántico (F=verde, D=rojo, O=azul, A=ámbar)
 * - Justificación y nivel de impacto opcionales (requerido si encuesta.requiere_justificacion)
 * - Guardado en lote al confirmar
 */

import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Textarea } from '@/components/forms/Textarea';
import { RadioGroup } from '@/components/forms/RadioGroup';
import { useEncuesta } from '../../gestion-estrategica/hooks/useEncuestas';
import {
  useRespuestas,
  useCreateRespuesta,
  useUpdateRespuesta,
} from '../../gestion-estrategica/hooks/useEncuestas';
import type { MiEncuestaPendiente } from '../../gestion-estrategica/types/encuestas.types';
import type {
  Clasificacion,
  NivelImpacto,
  TemaEncuesta,
  LocalRespuesta,
} from '../../gestion-estrategica/types/encuestas.types';

// =============================================================================
// CONSTANTES DE CLASIFICACIÓN
// =============================================================================

interface OpcionClasificacion {
  value: Clasificacion;
  label: string;
  labelCorto: string;
  icon: React.ElementType;
  bgSelected: string;
  bgHover: string;
  textSelected: string;
  border: string;
}

const OPCION_FORTALEZA: OpcionClasificacion = {
  value: 'fortaleza',
  label: 'Fortaleza',
  labelCorto: 'F',
  icon: TrendingUp,
  bgSelected: 'bg-green-100 dark:bg-green-900/40',
  bgHover: 'hover:bg-green-50 dark:hover:bg-green-900/20',
  textSelected: 'text-green-700 dark:text-green-300',
  border: 'border-green-500',
};
const OPCION_DEBILIDAD: OpcionClasificacion = {
  value: 'debilidad',
  label: 'Debilidad',
  labelCorto: 'D',
  icon: TrendingDown,
  bgSelected: 'bg-red-100 dark:bg-red-900/40',
  bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
  textSelected: 'text-red-700 dark:text-red-300',
  border: 'border-red-500',
};
const OPCION_OPORTUNIDAD: OpcionClasificacion = {
  value: 'oportunidad',
  label: 'Oportunidad',
  labelCorto: 'O',
  icon: ArrowUpRight,
  bgSelected: 'bg-blue-100 dark:bg-blue-900/40',
  bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  textSelected: 'text-blue-700 dark:text-blue-300',
  border: 'border-blue-500',
};
const OPCION_AMENAZA: OpcionClasificacion = {
  value: 'amenaza',
  label: 'Amenaza',
  labelCorto: 'A',
  icon: AlertTriangle,
  bgSelected: 'bg-amber-100 dark:bg-amber-900/40',
  bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
  textSelected: 'text-amber-700 dark:text-amber-300',
  border: 'border-amber-500',
};

const OPCIONES_FD = [OPCION_FORTALEZA, OPCION_DEBILIDAD];
const OPCIONES_OA = [OPCION_OPORTUNIDAD, OPCION_AMENAZA];
const OPCIONES_TODAS = [OPCION_FORTALEZA, OPCION_DEBILIDAD, OPCION_OPORTUNIDAD, OPCION_AMENAZA];

const IMPACTO_OPTIONS = [
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Medio' },
  { value: 'bajo', label: 'Bajo' },
];

// =============================================================================
// AGRUPACIÓN PCI-POAM
// =============================================================================

interface GrupoTemas {
  nombre: string;
  prefijo: 'PCI' | 'POAM' | 'LIBRE';
  temas: TemaEncuesta[];
}

function getNumeroFromCodigo(codigo: string | null | undefined): number {
  if (!codigo) return 0;
  const partes = codigo.split('-');
  return parseInt(partes[1] || '0', 10);
}

function getNombreGrupoPci(num: number): string {
  if (num <= 12) return 'Capacidad Directiva';
  if (num <= 26) return 'Capacidad del Talento Humano';
  if (num <= 36) return 'Capacidad Tecnológica';
  if (num <= 46) return 'Capacidad Competitiva';
  return 'Capacidad Financiera';
}

function getNombreGrupoPoam(num: number): string {
  if (num <= 58) return 'Factores Económicos';
  if (num <= 63) return 'Factores Políticos';
  if (num <= 69) return 'Factores Sociales';
  if (num <= 72) return 'Factores Tecnológicos';
  return 'Factores Geográficos';
}

function agruparTemas(temas: TemaEncuesta[]): GrupoTemas[] {
  const esPciPoam = temas.some((t) => t.pregunta_codigo);
  if (!esPciPoam) {
    return [{ nombre: 'Temas', prefijo: 'LIBRE', temas }];
  }

  const mapaGrupos = new Map<string, GrupoTemas>();

  for (const tema of temas) {
    const codigo = tema.pregunta_codigo || '';
    const num = getNumeroFromCodigo(codigo);
    let nombre: string;
    let prefijo: 'PCI' | 'POAM' | 'LIBRE';

    if (codigo.startsWith('PCI')) {
      nombre = getNombreGrupoPci(num);
      prefijo = 'PCI';
    } else if (codigo.startsWith('POAM')) {
      nombre = getNombreGrupoPoam(num);
      prefijo = 'POAM';
    } else {
      nombre = 'Otros';
      prefijo = 'LIBRE';
    }

    if (!mapaGrupos.has(nombre)) {
      mapaGrupos.set(nombre, { nombre, prefijo, temas: [] });
    }
    mapaGrupos.get(nombre)!.temas.push(tema);
  }

  return Array.from(mapaGrupos.values());
}

// =============================================================================
// SUBCOMPONENTE: TARJETA DE PREGUNTA
// =============================================================================

interface TarjetaPreguntaProps {
  tema: TemaEncuesta;
  respuesta: LocalRespuesta | undefined;
  requiereJustificacion: boolean;
  onChange: (temaId: number, respuesta: LocalRespuesta) => void;
}

function TarjetaPregunta({
  tema,
  respuesta,
  requiereJustificacion,
  onChange,
}: TarjetaPreguntaProps) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const opciones = useMemo(() => {
    if (tema.clasificacion_esperada === 'fd') return OPCIONES_FD;
    if (tema.clasificacion_esperada === 'oa') return OPCIONES_OA;
    return OPCIONES_TODAS;
  }, [tema.clasificacion_esperada]);

  const respondida = !!respuesta?.clasificacion;

  const handleClasificacion = (opcion: OpcionClasificacion) => {
    const nueva: LocalRespuesta = {
      ...respuesta,
      clasificacion: opcion.value,
      existingId: respuesta?.existingId,
    };
    onChange(tema.id, nueva);
    if (!mostrarDetalle) setMostrarDetalle(true);
  };

  const handleJustificacion = (valor: string) => {
    if (!respuesta) return;
    onChange(tema.id, { ...respuesta, justificacion: valor });
  };

  const handleImpacto = (valor: string) => {
    if (!respuesta) return;
    onChange(tema.id, { ...respuesta, impacto_percibido: valor as NivelImpacto });
  };

  return (
    <div
      className={`rounded-lg border transition-colors ${
        respondida
          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
      }`}
    >
      <div className="p-4">
        {/* Código + texto */}
        <div className="flex items-start gap-3 mb-3">
          {tema.pregunta_codigo && (
            <Badge variant="gray" size="sm" className="mt-0.5 shrink-0 font-mono">
              {tema.pregunta_codigo}
            </Badge>
          )}
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed flex-1">
            {tema.titulo}
            {requiereJustificacion && !respondida && <span className="text-red-500 ml-1">*</span>}
          </p>
          {respondida && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
        </div>

        {/* Botones de clasificación */}
        <div
          className={`grid gap-2 ${opciones.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}
        >
          {opciones.map((opcion) => {
            const Icon = opcion.icon;
            const seleccionada = respuesta?.clasificacion === opcion.value;
            return (
              <button
                key={opcion.value}
                type="button"
                onClick={() => handleClasificacion(opcion)}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium
                  transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
                  ${
                    seleccionada
                      ? `${opcion.bgSelected} ${opcion.textSelected} ${opcion.border}`
                      : `border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 ${opcion.bgHover}`
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{opcion.label}</span>
                <span className="sm:hidden font-bold">{opcion.labelCorto}</span>
              </button>
            );
          })}
        </div>

        {/* Detalle: justificación + impacto */}
        {respondida && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setMostrarDetalle((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {mostrarDetalle ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {requiereJustificacion
                ? 'Justificación (requerida)'
                : 'Agregar justificación (opcional)'}
            </button>

            {mostrarDetalle && (
              <div className="mt-3 space-y-3">
                <Textarea
                  label={requiereJustificacion ? 'Justificación *' : 'Justificación'}
                  value={respuesta?.justificacion || ''}
                  onChange={(e) => handleJustificacion(e.target.value)}
                  placeholder="Explica brevemente tu clasificación..."
                  rows={3}
                />
                <RadioGroup
                  label="Nivel de impacto"
                  name={`impacto-${tema.id}`}
                  value={respuesta?.impacto_percibido || ''}
                  onChange={handleImpacto}
                  options={IMPACTO_OPTIONS}
                  layout="horizontal"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTE: SECCIÓN DE GRUPO
// =============================================================================

interface SeccionGrupoProps {
  grupo: GrupoTemas;
  respuestasLocal: Record<number, LocalRespuesta>;
  requiereJustificacion: boolean;
  onChange: (temaId: number, respuesta: LocalRespuesta) => void;
}

function SeccionGrupo({
  grupo,
  respuestasLocal,
  requiereJustificacion,
  onChange,
}: SeccionGrupoProps) {
  const [expandida, setExpandida] = useState(true);
  const respondidas = grupo.temas.filter((t) => !!respuestasLocal[t.id]).length;
  const total = grupo.temas.length;
  const completa = respondidas === total;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Encabezado del grupo */}
      <button
        type="button"
        onClick={() => setExpandida((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Badge
            variant={
              grupo.prefijo === 'PCI' ? 'info' : grupo.prefijo === 'POAM' ? 'warning' : 'gray'
            }
            size="sm"
          >
            {grupo.prefijo === 'LIBRE' ? 'Temas' : grupo.prefijo}
          </Badge>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {grupo.nombre}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${completa ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {respondidas}/{total}
          </span>
          {expandida ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Preguntas */}
      {expandida && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {grupo.temas.map((tema) => (
            <div key={tema.id} className="px-4 py-3">
              <TarjetaPregunta
                tema={tema}
                respuesta={respuestasLocal[tema.id]}
                requiereJustificacion={requiereJustificacion}
                onChange={onChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface ResponderEncuestaModalProps {
  encuesta: MiEncuestaPendiente | null;
  isOpen: boolean;
  onClose: () => void;
  onCompletado?: () => void;
}

export function ResponderEncuestaModal({
  encuesta,
  isOpen,
  onClose,
  onCompletado,
}: ResponderEncuestaModalProps) {
  const [respuestasLocal, setRespuestasLocal] = useState<Record<number, LocalRespuesta>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const encuestaId = encuesta?.id;

  // Detalle con temas
  const { data: detalle, isLoading: loadingDetalle } = useEncuesta(encuestaId);

  // Respuestas existentes del usuario para esta encuesta
  const { data: respuestasExistentes, isLoading: loadingRespuestas } = useRespuestas(
    encuestaId ? { tema__encuesta: encuestaId } : undefined
  );

  const createMutation = useCreateRespuesta();
  const updateMutation = useUpdateRespuesta();

  // Inicializar estado local desde respuestas existentes al cargar
  const temas = useMemo(() => detalle?.temas || [], [detalle]);

  useMemo(() => {
    if (!respuestasExistentes?.results?.length) return;
    const mapa: Record<number, LocalRespuesta> = {};
    for (const r of respuestasExistentes.results) {
      mapa[r.tema] = {
        clasificacion: r.clasificacion,
        justificacion: r.justificacion,
        impacto_percibido: r.impacto_percibido,
        existingId: r.id,
      };
    }
    setRespuestasLocal(mapa);
  }, [respuestasExistentes]);

  const gruposTemas = useMemo(() => agruparTemas(temas), [temas]);

  const totalTemas = temas.length;
  const totalRespondidas = Object.keys(respuestasLocal).length;
  const porcentaje = totalTemas > 0 ? Math.round((totalRespondidas / totalTemas) * 100) : 0;

  const handleChange = useCallback((temaId: number, respuesta: LocalRespuesta) => {
    setRespuestasLocal((prev) => ({ ...prev, [temaId]: respuesta }));
  }, []);

  const requiereJustificacion = encuesta?.requiere_justificacion ?? false;

  const validarEnvio = (): string | null => {
    if (totalRespondidas === 0) return 'Responde al menos una pregunta antes de enviar.';
    if (requiereJustificacion) {
      const sinJustificacion = Object.values(respuestasLocal).filter(
        (r) => !r.justificacion?.trim()
      );
      if (sinJustificacion.length > 0) {
        return `${sinJustificacion.length} respuesta(s) requieren justificación.`;
      }
    }
    return null;
  };

  const handleEnviar = async () => {
    const error = validarEnvio();
    if (error) return;

    setEnviando(true);
    try {
      const promesas: Promise<unknown>[] = [];

      for (const [temaIdStr, resp] of Object.entries(respuestasLocal)) {
        const temaId = parseInt(temaIdStr, 10);
        const payload = {
          tema: temaId,
          clasificacion: resp.clasificacion,
          justificacion: resp.justificacion || undefined,
          impacto_percibido: resp.impacto_percibido || undefined,
        };

        if (resp.existingId) {
          // Respuesta modificada → PATCH
          const existente = respuestasExistentes?.results?.find((r) => r.id === resp.existingId);
          const cambio =
            existente?.clasificacion !== resp.clasificacion ||
            existente?.justificacion !== resp.justificacion ||
            existente?.impacto_percibido !== resp.impacto_percibido;

          if (cambio) {
            promesas.push(updateMutation.mutateAsync({ id: resp.existingId, data: payload }));
          }
        } else {
          // Respuesta nueva → POST
          promesas.push(createMutation.mutateAsync(payload));
        }
      }

      await Promise.all(promesas);
      setEnviado(true);
      onCompletado?.();
    } catch {
      // El error lo maneja el hook con toast
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    setEnviado(false);
    setRespuestasLocal({});
    onClose();
  };

  const validationError = validarEnvio();
  const isLoading = loadingDetalle || loadingRespuestas;

  // Footer
  const footer = (
    <div className="flex items-center justify-between w-full gap-3">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">{totalRespondidas}</span>
        {' de '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{totalTemas}</span>
        {' respondidas'}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleClose} disabled={enviando}>
          {enviado ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!enviado && (
          <Button
            variant="primary"
            onClick={handleEnviar}
            disabled={totalRespondidas === 0 || enviando}
            isLoading={enviando}
          >
            Enviar respuestas
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={encuesta?.titulo || 'Encuesta'}
      subtitle={
        encuesta?.tipo_encuesta === 'pci_poam'
          ? 'Diagnóstico de contexto — PCI-POAM'
          : 'Encuesta DOFA colaborativa'
      }
      size="4xl"
      footer={footer}
    >
      {/* Estado: Completado */}
      {enviado && (
        <div className="py-12 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              ¡Respuestas enviadas!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registraste {totalRespondidas} respuesta{totalRespondidas !== 1 ? 's' : ''}. Gracias
              por participar.
            </p>
          </div>
        </div>
      )}

      {/* Estado: Cargando */}
      {!enviado && isLoading && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          Cargando preguntas...
        </div>
      )}

      {/* Estado: Sin temas */}
      {!enviado && !isLoading && temas.length === 0 && (
        <div className="py-12 text-center space-y-3">
          <ClipboardList className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta encuesta aún no tiene preguntas configuradas.
          </p>
        </div>
      )}

      {/* Contenido principal */}
      {!enviado && !isLoading && temas.length > 0 && (
        <div className="space-y-4">
          {/* Barra de progreso */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-3 -mx-6 px-6 pt-1 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Progreso de respuesta
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {porcentaje}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          {/* Alerta de respuestas previas */}
          {encuesta.total_mis_respuestas > 0 && !enviado && (
            <Alert
              variant="info"
              message={`Tienes ${encuesta.total_mis_respuestas} respuesta(s) guardada(s) de una sesión anterior. Puedes modificarlas antes de enviar.`}
            />
          )}

          {/* Alerta de justificación requerida */}
          {requiereJustificacion && (
            <Alert
              variant="warning"
              message="Esta encuesta requiere que justifiques cada respuesta. Haz clic en la opción seleccionada para expandir el campo de justificación."
            />
          )}

          {/* Error de validación */}
          {totalRespondidas > 0 && validationError && (
            <Alert variant="danger" message={validationError} />
          )}

          {/* Grupos de preguntas */}
          <div className="space-y-4">
            {gruposTemas.map((grupo) => (
              <SeccionGrupo
                key={grupo.nombre}
                grupo={grupo}
                respuestasLocal={respuestasLocal}
                requiereJustificacion={requiereJustificacion}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      )}
    </BaseModal>
  );
}
