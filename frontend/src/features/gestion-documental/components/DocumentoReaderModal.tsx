/**
 * DocumentoReaderModal — Lector de documentos con tracking real (ISO 7.3).
 *
 * Modos:
 *   1. PDF EXTERNO (documento_archivo_original_url presente):
 *      Se renderiza con react-pdf. Cada <Page> es observado con
 *      IntersectionObserver. Una pagina se considera "vista" cuando
 *      permanece >= 2s en pantalla. El porcentaje se calcula como
 *      paginas_vistas / numPages * 100.
 *   2. HTML (documento_contenido):
 *      Se sanitiza con DOMPurify, se divide en secciones con
 *      data-section, y cada seccion se observa con la misma logica.
 *
 * Cumplimiento ISO 7.3 Toma de Conciencia + Decreto 1072 Art. 2.2.4.6.10/12.
 * H-GD-C1/C2: cierra brecha de tracking real para PDFs externos.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { BookOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button, Badge, ConfirmDialog, Spinner } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Textarea } from '@/components/forms';
import {
  useRegistrarProgreso,
  useAceptarLectura,
  useRechazarLectura,
} from '../hooks/useAceptacionDocumental';
import type { AceptacionDocumental } from '../types/gestion-documental.types';

// Worker copiado a public/ por el build (ver public/pdf.worker.min.mjs).
// Usar archivo local en lugar de CDN para que funcione offline y respete CSP.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface DocumentoReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  aceptacion: AceptacionDocumental | null;
  onCompleted?: () => void;
}

const TOTAL_SECCIONES_HTML = 10;
const INTERVALO_GUARDADO_MS = 10_000;
const PORCENTAJE_MINIMO = 90;
const TIEMPO_VISIBLE_PARA_MARCAR_MS = 2_000;

type ReaderMode = 'pdf' | 'html' | 'empty';

export default function DocumentoReaderModal({
  isOpen,
  onClose,
  aceptacion,
  onCompleted,
}: DocumentoReaderModalProps) {
  const registrarMutation = useRegistrarProgreso();
  const aceptarMutation = useAceptarLectura();
  const rechazarMutation = useRechazarLectura();

  // Modo de visualizacion: PDF externo prevalece sobre HTML
  const mode: ReaderMode = useMemo(() => {
    if (!aceptacion) return 'empty';
    if (aceptacion.documento_archivo_original_url) return 'pdf';
    if (aceptacion.documento_contenido) return 'html';
    return 'empty';
  }, [aceptacion]);

  // ─── Estado compartido ──────────────────────────────────────────────────
  const [tiempoSeg, setTiempoSeg] = useState(0);
  const [aceptado, setAceptado] = useState(false);
  const [showRechazar, setShowRechazar] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showConfirmAceptar, setShowConfirmAceptar] = useState(false);
  const [aceptarError, setAceptarError] = useState<string | null>(null);

  // ─── Estado HTML (modo legacy) ─────────────────────────────────────────
  const [seccionesVistas, setSeccionesVistas] = useState<Set<number>>(new Set());
  const [totalSeccionesDisplay, setTotalSeccionesDisplay] =
    useState(TOTAL_SECCIONES_HTML);

  // ─── Estado PDF ─────────────────────────────────────────────────────────
  const [paginasVistas, setPaginasVistas] = useState<Set<number>>(new Set());
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);

  // Refs para guardarProgreso — evita incluir valores volatiles en deps
  // y previene loops por re-renders.
  const aceptacionRef = useRef(aceptacion);
  const tiempoSegRef = useRef(tiempoSeg);
  const seccionesVistasRef = useRef(seccionesVistas);
  const paginasVistasRef = useRef(paginasVistas);
  const totalSeccionesRef = useRef(TOTAL_SECCIONES_HTML);
  const numPagesRef = useRef(numPages);
  const modeRef = useRef(mode);
  const registrarMutateRef = useRef(registrarMutation.mutate);
  aceptacionRef.current = aceptacion;
  tiempoSegRef.current = tiempoSeg;
  seccionesVistasRef.current = seccionesVistas;
  paginasVistasRef.current = paginasVistas;
  numPagesRef.current = numPages;
  modeRef.current = mode;
  registrarMutateRef.current = registrarMutation.mutate;

  // ─── Calculo de porcentaje (segun modo) ─────────────────────────────────
  const porcentaje = useMemo(() => {
    if (mode === 'pdf') {
      if (numPages === 0) return 0;
      return Math.min(
        100,
        Math.round((paginasVistas.size / numPages) * 100)
      );
    }
    if (mode === 'html') {
      if (totalSeccionesDisplay === 0) return 100;
      return Math.min(
        100,
        Math.round((seccionesVistas.size / totalSeccionesDisplay) * 100)
      );
    }
    // empty: nada para leer => 100
    return 100;
  }, [mode, numPages, paginasVistas.size, totalSeccionesDisplay, seccionesVistas.size]);

  const puedeAceptar = porcentaje >= PORCENTAJE_MINIMO && aceptado;

  // ─── Reset al abrir ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !aceptacion) return;

    setTiempoSeg(aceptacion.tiempo_lectura_seg || 0);
    setAceptado(false);
    setAceptarError(null);
    setShowConfirmAceptar(false);
    setShowRechazar(false);
    setMotivoRechazo('');

    const sd = (aceptacion.scroll_data ?? {}) as Record<string, unknown>;
    const seccionesPrev = Array.isArray(sd.secciones_vistas)
      ? (sd.secciones_vistas as number[])
      : [];
    const paginasPrev = Array.isArray(sd.paginas_vistas)
      ? (sd.paginas_vistas as number[])
      : [];

    setSeccionesVistas(new Set(seccionesPrev));
    setPaginasVistas(new Set(paginasPrev));
    setTotalSeccionesDisplay(TOTAL_SECCIONES_HTML);
    totalSeccionesRef.current = TOTAL_SECCIONES_HTML;

    // Si ya tenemos numPages snapshot del backend, usarlo provisional
    const totalPagsPrev = typeof sd.total_paginas === 'number' ? sd.total_paginas : 0;
    if (totalPagsPrev > 0) {
      setNumPages(totalPagsPrev);
    } else {
      setNumPages(0);
    }
  }, [isOpen, aceptacion]);

  // ─── Timer de tiempo de lectura ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !aceptacion) return;

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

  // ─── Fetch PDF autenticado (con JWT) ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen || mode !== 'pdf' || !aceptacion?.documento_archivo_original_url) {
      setPdfData(null);
      return;
    }

    let cancelled = false;
    setPdfLoading(true);
    setPdfError(null);
    setPdfData(null);

    const url = aceptacion.documento_archivo_original_url;
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('current_tenant_id');
    const impersonated = localStorage.getItem('impersonated_user_id');

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantId) headers['X-Tenant-ID'] = tenantId;
    if (impersonated) headers['X-Impersonated-User-ID'] = impersonated;

    fetch(url, { headers, credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: no se pudo cargar el PDF`);
        }
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        // react-pdf espera Uint8Array para evitar advertencias de transferencia
        setPdfData(new Uint8Array(buf));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setPdfError(err.message || 'Error al descargar el PDF');
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, aceptacion?.documento_archivo_original_url]);

  // ─── IntersectionObserver para HTML (modo legacy) ────────────────────────
  useEffect(() => {
    if (!isOpen || mode !== 'html' || !contentRef.current) return;

    const container = contentRef.current;
    const sectionElements = container.querySelectorAll('[data-section]');

    totalSeccionesRef.current = sectionElements.length;
    setTotalSeccionesDisplay(sectionElements.length);

    if (sectionElements.length === 0) return;

    const timers = new Map<number, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-section'));
          if (entry.isIntersecting) {
            const timer = setTimeout(() => {
              setSeccionesVistas((prev) => {
                const next = new Set(prev);
                next.add(idx);
                return next;
              });
            }, TIEMPO_VISIBLE_PARA_MARCAR_MS);
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
  }, [isOpen, mode, aceptacion?.documento_contenido]);

  // ─── IntersectionObserver para PDF ───────────────────────────────────────
  useEffect(() => {
    if (
      !isOpen ||
      mode !== 'pdf' ||
      !contentRef.current ||
      numPages === 0 ||
      pdfLoading ||
      pdfError
    ) {
      return;
    }

    const container = contentRef.current;
    // Buscar todos los wrappers de pagina renderizados.
    // Cada Page se envuelve en un div con data-pdf-page="<numero>".
    const pageElements = container.querySelectorAll('[data-pdf-page]');

    if (pageElements.length === 0) return;

    const timers = new Map<number, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-pdf-page'));
          if (entry.isIntersecting) {
            const timer = setTimeout(() => {
              setPaginasVistas((prev) => {
                const next = new Set(prev);
                next.add(pageNum);
                return next;
              });
            }, TIEMPO_VISIBLE_PARA_MARCAR_MS);
            timers.set(pageNum, timer);
          } else {
            const timer = timers.get(pageNum);
            if (timer) {
              clearTimeout(timer);
              timers.delete(pageNum);
            }
          }
        });
      },
      // threshold 0.3 — el PDF se ve grande y rara vez ocupa el 50% del viewport
      { root: container, threshold: 0.3 }
    );

    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isOpen, mode, numPages, pdfLoading, pdfError]);

  // ─── Persistencia periodica de progreso ──────────────────────────────────
  const guardarProgreso = useCallback(() => {
    const ac = aceptacionRef.current;
    if (!ac || ac.estado === 'ACEPTADO') return;

    const currentMode = modeRef.current;
    let pct = 0;
    let scrollData: Record<string, unknown>;

    if (currentMode === 'pdf') {
      const total = numPagesRef.current;
      const vistas = Array.from(paginasVistasRef.current).sort((a, b) => a - b);
      pct = total === 0 ? 0 : Math.min(100, Math.round((vistas.length / total) * 100));
      scrollData = {
        modo: 'pdf',
        paginas_vistas: vistas,
        total_paginas: total,
      };
    } else if (currentMode === 'html') {
      const total = totalSeccionesRef.current;
      const vistas = Array.from(seccionesVistasRef.current).sort((a, b) => a - b);
      pct = total === 0 ? 100 : Math.min(100, Math.round((vistas.length / total) * 100));
      scrollData = {
        modo: 'html',
        secciones_vistas: vistas,
        total_secciones: total,
      };
    } else {
      pct = 100;
      scrollData = { modo: 'empty' };
    }

    registrarMutateRef.current({
      id: ac.id,
      data: {
        porcentaje_lectura: pct,
        tiempo_lectura_seg: tiempoSegRef.current,
        scroll_data: scrollData,
      },
    });
  }, []);

  useEffect(() => {
    if (!isOpen || !aceptacion) return;

    saveRef.current = setInterval(guardarProgreso, INTERVALO_GUARDADO_MS);

    return () => {
      if (saveRef.current) clearInterval(saveRef.current);
      guardarProgreso();
    };
    // guardarProgreso es estable
  }, [isOpen, aceptacion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers de aceptar / rechazar ──────────────────────────────────────
  const handleAceptar = async () => {
    if (!aceptacion) return;
    setAceptarError(null);
    // Guardar progreso final ANTES de aceptar (sincronia con backend)
    guardarProgreso();
    try {
      await aceptarMutation.mutateAsync({
        id: aceptacion.id,
        texto: 'He leído y comprendido el contenido de este documento.',
      });
      setShowConfirmAceptar(false);
      onCompleted?.();
      onClose();
    } catch (err: unknown) {
      // Mostrar error del backend (ej: plazo vencido, paginas insuficientes)
      type ApiErr = { response?: { data?: { error?: string } } };
      const msg =
        (err as ApiErr)?.response?.data?.error ??
        'No fue posible aceptar el documento. Inténtelo de nuevo.';
      setAceptarError(msg);
      setShowConfirmAceptar(false);
    }
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

  // ─── Render del contenido HTML (modo legacy) ─────────────────────────────
  const renderContenidoConSecciones = () => {
    const contenido = aceptacion?.documento_contenido || '';
    if (!contenido) return '<p><em>Sin contenido</em></p>';

    const clean = DOMPurify.sanitize(contenido);
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${clean}</div>`, 'text/html');
    const children = Array.from(doc.body.firstElementChild?.children || []);

    if (children.length === 0) {
      return `<div data-section="0">${clean}</div>`;
    }

    const bloquesPorSeccion = Math.max(
      1,
      Math.ceil(children.length / TOTAL_SECCIONES_HTML)
    );
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

  const yaFinalizado =
    aceptacion.estado === 'ACEPTADO' || aceptacion.estado === 'RECHAZADO';

  // PDF dimensions: ancho responsive
  const pdfPageWidth = typeof window !== 'undefined'
    ? Math.min(window.innerWidth - 80, 800)
    : 800;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={() => {
          guardarProgreso();
          onClose();
        }}
        title=""
        size="4xl"
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
                {mode === 'pdf' && (
                  <Badge variant="info">PDF</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>v{aceptacion.version_documento}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTiempo(tiempoSeg)}
                </span>
                {mode === 'pdf' && numPages > 0 && (
                  <span>
                    {paginasVistas.size} / {numPages} páginas
                  </span>
                )}
                {aceptacion.fecha_limite && (
                  <span className="flex items-center gap-1">
                    {aceptacion.dias_restantes != null &&
                    aceptacion.dias_restantes < 0 ? (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    ) : null}
                    Límite:{' '}
                    {new Date(aceptacion.fecha_limite).toLocaleDateString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                Progreso de lectura
              </span>
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
            className="max-h-[40vh] sm:max-h-[55vh] overflow-y-auto p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            {mode === 'pdf' && (
              <>
                {pdfLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                      Cargando documento...
                    </span>
                  </div>
                )}
                {pdfError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                    No fue posible cargar el PDF: {pdfError}
                  </div>
                )}
                {pdfData && !pdfLoading && !pdfError && (
                  <Document
                    file={pdfData}
                    onLoadSuccess={(info: { numPages: number }) =>
                      setNumPages(info.numPages)
                    }
                    onLoadError={(err: Error) =>
                      setPdfError(err.message || 'Error al renderizar el PDF')
                    }
                    loading={
                      <div className="flex items-center justify-center py-12">
                        <Spinner size="md" />
                      </div>
                    }
                  >
                    {Array.from({ length: numPages }, (_, idx) => idx + 1).map(
                      (pageNumber) => (
                        <div
                          key={`pdf-page-${pageNumber}`}
                          data-pdf-page={pageNumber}
                          className="mb-4 flex justify-center"
                        >
                          <Page
                            pageNumber={pageNumber}
                            width={pdfPageWidth}
                            renderAnnotationLayer={false}
                            renderTextLayer={true}
                          />
                        </div>
                      )
                    )}
                  </Document>
                )}
              </>
            )}

            {mode === 'html' && (
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderContenidoConSecciones() }}
              />
            )}

            {mode === 'empty' && (
              <p className="italic text-gray-500 dark:text-gray-400 text-center py-8">
                Este documento no tiene contenido visualizable.
              </p>
            )}
          </div>

          {aceptarError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              {aceptarError}
            </div>
          )}

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
                      (Debe leer al menos el {PORCENTAJE_MINIMO}% del documento
                      para habilitar esta opción)
                    </span>
                  )}
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRechazar(true)}
                >
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
                ? `Aceptado el ${
                    aceptacion.fecha_aceptacion
                      ? new Date(aceptacion.fecha_aceptacion).toLocaleDateString(
                          'es-CO'
                        )
                      : ''
                  }`
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
