/**
 * DocumentoReaderModal — Lector de documentos con scroll tracking.
 * Mejora 3: Lectura Verificada (ISO 7.3 Toma de Conciencia).
 *
 * Divide el contenido en secciones, rastrea cuáles fueron leídas
 * usando IntersectionObserver, y registra el progreso periódicamente.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { BookOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button, Badge, ConfirmDialog } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Textarea } from '@/components/forms';
import {
  useRegistrarProgreso,
  useAceptarLectura,
  useRechazarLectura,
} from '../hooks/useAceptacionDocumental';
import type { AceptacionDocumental } from '../types/gestion-documental.types';

interface DocumentoReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  aceptacion: AceptacionDocumental | null;
  onCompleted?: () => void;
}

const TOTAL_SECCIONES = 10;
const INTERVALO_GUARDADO_MS = 10_000;
const PORCENTAJE_MINIMO = 90;

export default function DocumentoReaderModal({
  isOpen,
  onClose,
  aceptacion,
  onCompleted,
}: DocumentoReaderModalProps) {
  const registrarMutation = useRegistrarProgreso();
  const aceptarMutation = useAceptarLectura();
  const rechazarMutation = useRechazarLectura();

  const [seccionesVistas, setSeccionesVistas] = useState<Set<number>>(new Set());
  const [tiempoSeg, setTiempoSeg] = useState(0);
  const [aceptado, setAceptado] = useState(false);
  const [showRechazar, setShowRechazar] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showConfirmAceptar, setShowConfirmAceptar] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);

  // Refs para guardarProgreso — evita incluir valores volátiles en deps
  // y previene el loop: tiempoSeg↑ → guardarProgreso recreado → saveEffect re-runs → mutate → Zustand forceStoreRerender → loop
  const aceptacionRef = useRef(aceptacion);
  const tiempoSegRef = useRef(tiempoSeg);
  const seccionesVistasRef = useRef(seccionesVistas);
  const registrarMutateRef = useRef(registrarMutation.mutate);
  aceptacionRef.current = aceptacion;
  tiempoSegRef.current = tiempoSeg;
  seccionesVistasRef.current = seccionesVistas;
  registrarMutateRef.current = registrarMutation.mutate;

  const porcentaje = Math.round((seccionesVistas.size / TOTAL_SECCIONES) * 100);
  const puedeAceptar = porcentaje >= PORCENTAJE_MINIMO && aceptado;

  // Timer: cuenta segundos con el tab visible
  useEffect(() => {
    if (!isOpen || !aceptacion) return;

    setTiempoSeg(aceptacion.tiempo_lectura_seg || 0);
    setSeccionesVistas(new Set((aceptacion.scroll_data?.secciones_vistas as number[]) || []));

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    timerRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        setTiempoSeg((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, aceptacion]);

  // IntersectionObserver para secciones
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;

    const container = contentRef.current;
    const sectionElements = container.querySelectorAll('[data-section]');
    if (sectionElements.length === 0) return;

    const timers = new Map<number, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-section'));
          if (entry.isIntersecting) {
            // Requiere 2 segundos visible para marcar como leído
            const timer = setTimeout(() => {
              setSeccionesVistas((prev) => {
                const next = new Set(prev);
                next.add(idx);
                return next;
              });
            }, 2000);
            timers.set(idx, timer);
          } else {
            const timer = timers.get(idx);
            if (timer) {
              clearTimeout(timer);
              timers.delete(idx);
            }
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isOpen, aceptacion?.documento_contenido]);

  // Guardado periódico de progreso — usa refs para deps volátiles → identidad estable
  const guardarProgreso = useCallback(() => {
    const ac = aceptacionRef.current;
    if (!ac || ac.estado === 'ACEPTADO') return;

    registrarMutateRef.current({
      id: ac.id,
      data: {
        porcentaje_lectura: Math.round((seccionesVistasRef.current.size / TOTAL_SECCIONES) * 100),
        tiempo_lectura_seg: tiempoSegRef.current,
        scroll_data: {
          secciones_vistas: Array.from(seccionesVistasRef.current),
          total_secciones: TOTAL_SECCIONES,
        },
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen || !aceptacion) return;

    saveRef.current = setInterval(guardarProgreso, INTERVALO_GUARDADO_MS);

    return () => {
      if (saveRef.current) clearInterval(saveRef.current);
      guardarProgreso();
    };
    // guardarProgreso es estable (deps vacías) — este effect solo corre cuando abre/cierra
  }, [isOpen, aceptacion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAceptar = async () => {
    if (!aceptacion) return;
    // Guardar progreso final antes de aceptar
    guardarProgreso();
    await aceptarMutation.mutateAsync({
      id: aceptacion.id,
      texto: 'He leído y comprendido el contenido de este documento.',
    });
    setShowConfirmAceptar(false);
    onCompleted?.();
    onClose();
  };

  const handleRechazar = async () => {
    if (!aceptacion || !motivoRechazo.trim()) return;
    await rechazarMutation.mutateAsync({
      id: aceptacion.id,
      motivo: motivoRechazo,
    });
    setShowRechazar(false);
    setMotivoRechazo('');
    onCompleted?.();
    onClose();
  };

  const formatTiempo = (seg: number) => {
    const min = Math.floor(seg / 60);
    const s = seg % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  // Divide contenido HTML en secciones para tracking
  const renderContenidoConSecciones = () => {
    const contenido = aceptacion?.documento_contenido || '';
    if (!contenido) return '<p><em>Sin contenido</em></p>';

    const clean = DOMPurify.sanitize(contenido);
    // Dividir en párrafos/bloques y agrupar en secciones
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${clean}</div>`, 'text/html');
    const children = Array.from(doc.body.firstElementChild?.children || []);

    if (children.length === 0) {
      return `<div data-section="0">${clean}</div>`;
    }

    const bloquesPorSeccion = Math.max(1, Math.ceil(children.length / TOTAL_SECCIONES));
    let html = '';
    let seccion = 0;

    for (let i = 0; i < children.length; i++) {
      if (i % bloquesPorSeccion === 0) {
        if (i > 0) html += '</div>';
        html += `<div data-section="${seccion}">`;
        seccion++;
      }
      html += children[i].outerHTML;
    }
    html += '</div>';

    return html;
  };

  if (!aceptacion) return null;

  const yaFinalizado = aceptacion.estado === 'ACEPTADO' || aceptacion.estado === 'RECHAZADO';

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={() => {
          guardarProgreso();
          onClose();
        }}
        title=""
        size="5xl"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {aceptacion.documento_titulo}
                </h3>
                <Badge variant="secondary">{aceptacion.documento_codigo}</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>v{aceptacion.version_documento}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTiempo(tiempoSeg)}
                </span>
                {aceptacion.fecha_limite && (
                  <span className="flex items-center gap-1">
                    {aceptacion.dias_restantes != null && aceptacion.dias_restantes < 0 ? (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    ) : null}
                    Límite: {new Date(aceptacion.fecha_limite).toLocaleDateString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progreso de lectura</span>
              <span className="font-medium">{porcentaje}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  porcentaje >= PORCENTAJE_MINIMO
                    ? 'bg-green-500'
                    : porcentaje > 50
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                }`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          {/* Contenido scrollable */}
          <div
            ref={contentRef}
            className="max-h-[50vh] overflow-y-auto prose dark:prose-invert max-w-none p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            dangerouslySetInnerHTML={{ __html: renderContenidoConSecciones() }}
          />

          {/* Footer: Aceptación */}
          {!yaFinalizado && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptado}
                  onChange={(e) => setAceptado(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={porcentaje < PORCENTAJE_MINIMO}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  He leído y comprendido el contenido de este documento.
                  {porcentaje < PORCENTAJE_MINIMO && (
                    <span className="block text-xs text-gray-400 mt-0.5">
                      (Debe leer al menos el {PORCENTAJE_MINIMO}% del documento para habilitar esta
                      opción)
                    </span>
                  )}
                </span>
              </label>

              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowRechazar(true)}>
                  Rechazar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => setShowConfirmAceptar(true)}
                  disabled={!puedeAceptar || aceptarMutation.isPending}
                >
                  {aceptarMutation.isPending ? 'Aceptando...' : 'Aceptar Documento'}
                </Button>
              </div>
            </div>
          )}

          {yaFinalizado && (
            <div
              className={`p-3 rounded-lg text-sm ${
                aceptacion.estado === 'ACEPTADO'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              {aceptacion.estado === 'ACEPTADO'
                ? `Aceptado el ${aceptacion.fecha_aceptacion ? new Date(aceptacion.fecha_aceptacion).toLocaleDateString('es-CO') : ''}`
                : `Rechazado: ${aceptacion.motivo_rechazo || ''}`}
            </div>
          )}
        </div>
      </BaseModal>

      {/* Confirm Aceptar */}
      <ConfirmDialog
        isOpen={showConfirmAceptar}
        onClose={() => setShowConfirmAceptar(false)}
        onConfirm={handleAceptar}
        title="Confirmar Aceptación"
        message={`¿Confirma que ha leído y comprendido "${aceptacion.documento_titulo}"? Esta acción quedará registrada como evidencia de toma de conciencia.`}
        confirmText="Confirmar Aceptación"
        isLoading={aceptarMutation.isPending}
      />

      {/* Rechazar */}
      <ConfirmDialog
        isOpen={showRechazar}
        onClose={() => {
          setShowRechazar(false);
          setMotivoRechazo('');
        }}
        onConfirm={handleRechazar}
        title="Rechazar Documento"
        message={
          <div className="space-y-3">
            <p>Indique el motivo por el cual rechaza la lectura de este documento:</p>
            <Textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={3}
            />
          </div>
        }
        confirmText="Rechazar"
        variant="danger"
        isLoading={rechazarMutation.isPending}
      />
    </>
  );
}
