/**
 * DigitalizarModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Permite digitalizar un documento externo ingestado:
 *  - Panel izquierdo: visor del PDF original + texto OCR como referencia.
 *  - Panel derecho: formulario estructurado con secciones sugeridas por tipo.
 *  - Al guardar: marca el original como OBSOLETO y crea un nuevo BORRADOR.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, Check, X } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Spinner, Badge } from '@/components/common';
import { Input } from '@/components/forms';
import { useSelectCargos } from '@/hooks/useSelectLists';
import { useDigitalizar } from '../hooks/useGestionDocumental';
import type { Documento } from '../types/gestion-documental.types';

// ─── Secciones sugeridas por código de tipo ──────────────────────────────────

const SECCIONES_POR_TIPO: Record<string, { id: string; label: string }[]> = {
  POL: [
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'alcance', label: 'Alcance' },
    { id: 'marco_legal', label: 'Marco Legal' },
    { id: 'principios', label: 'Principios y Compromisos' },
    { id: 'responsabilidades', label: 'Responsabilidades' },
    { id: 'vigencia', label: 'Vigencia y Control de Cambios' },
  ],
  MA: [
    { id: 'introduccion', label: 'Introducción' },
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'alcance', label: 'Alcance' },
    { id: 'referencias', label: 'Referencias Normativas' },
    { id: 'estructura', label: 'Estructura del Sistema' },
    { id: 'responsabilidades', label: 'Responsabilidades' },
    { id: 'procesos', label: 'Descripción de Procesos' },
    { id: 'control', label: 'Control de Documentos y Registros' },
  ],
  PL: [
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'alcance', label: 'Alcance' },
    { id: 'metas', label: 'Metas e Indicadores' },
    { id: 'actividades', label: 'Actividades y Cronograma' },
    { id: 'recursos', label: 'Recursos Requeridos' },
    { id: 'responsables', label: 'Responsables' },
    { id: 'seguimiento', label: 'Seguimiento y Evaluación' },
  ],
  RE: [
    { id: 'objeto', label: 'Objeto y Campo de Aplicación' },
    { id: 'definiciones', label: 'Definiciones' },
    { id: 'articulos', label: 'Artículos / Capítulos' },
    { id: 'sanciones', label: 'Sanciones y Disciplinario' },
    { id: 'vigencia', label: 'Vigencia' },
  ],
  PR: [
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'alcance', label: 'Alcance' },
    { id: 'definiciones', label: 'Definiciones y Abreviaturas' },
    { id: 'responsables', label: 'Responsables' },
    { id: 'actividades', label: 'Descripción de Actividades' },
    { id: 'registros', label: 'Registros Asociados' },
    { id: 'referencias', label: 'Referencias' },
  ],
  GU: [
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'alcance', label: 'Alcance' },
    { id: 'recomendaciones', label: 'Recomendaciones y Buenas Prácticas' },
    { id: 'ejemplos', label: 'Ejemplos y Casos de Uso' },
    { id: 'referencias', label: 'Referencias' },
  ],
  PG: [
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'alcance', label: 'Alcance' },
    { id: 'marco_legal', label: 'Marco Legal' },
    { id: 'actividades', label: 'Actividades y Cronograma' },
    { id: 'recursos', label: 'Recursos y Presupuesto' },
    { id: 'indicadores', label: 'Indicadores de Seguimiento' },
    { id: 'responsables', label: 'Responsables' },
  ],
  IN: [
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'alcance', label: 'Alcance' },
    { id: 'materiales', label: 'Materiales, Equipos y EPP' },
    { id: 'pasos', label: 'Pasos / Instrucciones' },
    { id: 'precauciones', label: 'Precauciones de Seguridad' },
    { id: 'registros', label: 'Registros Generados' },
  ],
};

const SECCIONES_DEFAULT: { id: string; label: string }[] = [
  { id: 'contenido', label: 'Contenido' },
];

function getSecciones(tipoCodigo?: string) {
  if (!tipoCodigo) return SECCIONES_DEFAULT;
  return SECCIONES_POR_TIPO[tipoCodigo.toUpperCase()] ?? SECCIONES_DEFAULT;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeccionState {
  id: string;
  label: string;
  contenido: string;
}

interface DigitalizarModalProps {
  isOpen: boolean;
  documento: Documento;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DigitalizarModal({ isOpen, documento, onClose }: DigitalizarModalProps) {
  const tipoCodigo = documento.tipo_documento_codigo;

  const plantillaSecciones = getSecciones(tipoCodigo);

  const [titulo, setTitulo] = useState(documento.titulo || '');
  const [secciones, setSecciones] = useState<SeccionState[]>(() =>
    plantillaSecciones.map((s) => ({ ...s, contenido: '' }))
  );
  const [responsablesIds, setResponsablesIds] = useState<number[]>([]);
  const [ocrExpanded, setOcrExpanded] = useState(false);

  const { data: cargos = [], isLoading: loadingCargos } = useSelectCargos();
  const digitalizarMutation = useDigitalizar();

  // Normalizar URL: extraer /media/... para que el proxy Vite resuelva same-origin
  const toProxied = (url: string | null | undefined) => {
    if (!url) return null;
    const m = url.match(/\/media\/.+/);
    return m ? m[0] : url;
  };
  const pdfUrl = toProxied(documento.archivo_original) || toProxied(documento.archivo_pdf);

  const handleSeccionChange = useCallback(
    (idx: number, field: 'label' | 'contenido', value: string) => {
      setSecciones((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    },
    []
  );

  const addSeccion = useCallback(() => {
    setSecciones((prev) => [
      ...prev,
      { id: `custom_${Date.now()}`, label: 'Nueva sección', contenido: '' },
    ]);
  }, []);

  const removeSeccion = useCallback((idx: number) => {
    setSecciones((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const toggleCargo = useCallback((id: number) => {
    setResponsablesIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = async () => {
    if (!titulo.trim() || secciones.length === 0) return;
    await digitalizarMutation.mutateAsync({
      id: documento.id,
      data: {
        titulo: titulo.trim(),
        secciones: secciones.map((s) => ({
          id: s.id,
          label: s.label,
          contenido: s.contenido,
        })),
        responsables_cargo_ids: responsablesIds,
      },
    });
    onClose();
  };

  const isSubmitDisabled =
    !titulo.trim() || secciones.length === 0 || digitalizarMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Digitalizar Documento"
      size="full"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            El original quedará archivado como <span className="font-medium">OBSOLETO</span> y se
            creará un nuevo <span className="font-medium">BORRADOR</span> digitalizado.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              leftIcon={digitalizarMutation.isPending ? <Spinner size="sm" /> : undefined}
            >
              {digitalizarMutation.isPending
                ? 'Digitalizando...'
                : 'Digitalizar y Archivar Original'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-0 h-[70vh] overflow-hidden -mx-6 -mt-2">
        {/* ── Panel izquierdo: PDF + OCR ─────────────────────────────── */}
        <div className="lg:w-[42%] flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {/* PDF viewer */}
          <div className="flex-1 min-h-0 p-3">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-md border border-gray-200 dark:border-gray-700"
                title="PDF Original"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-3">
                <FileText className="w-12 h-12" />
                <p className="text-sm">Sin PDF disponible</p>
              </div>
            )}
          </div>

          {/* OCR text collapsible */}
          {documento.texto_extraido && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setOcrExpanded((v) => !v)}
              >
                <span>Texto extraído (OCR) — referencia</span>
                {ocrExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {ocrExpanded && (
                <div className="max-h-48 overflow-y-auto px-4 pb-3">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {documento.texto_extraido}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Panel derecho: formulario estructurado ─────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Título */}
          <div>
            <Input
              label="Título del documento *"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre del documento digitalizado"
            />
          </div>

          {/* Responsables — cargo multi-select dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Responsables (por cargo)
            </label>
            {loadingCargos ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" /> Cargando cargos...
              </div>
            ) : (
              <ResponsablesDropdown
                cargos={cargos}
                selectedIds={responsablesIds}
                onToggle={toggleCargo}
              />
            )}
          </div>

          {/* Secciones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Secciones del documento
              </label>
              <Badge variant="secondary" size="sm">
                {secciones.length} sección(es)
              </Badge>
            </div>

            <div className="space-y-4">
              {secciones.map((seccion, idx) => (
                <div
                  key={seccion.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-5 text-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={seccion.label}
                      onChange={(e) => handleSeccionChange(idx, 'label', e.target.value)}
                      className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                      placeholder="Nombre de la sección"
                    />
                    {secciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSeccion(idx)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar sección"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Content textarea */}
                  <textarea
                    value={seccion.contenido}
                    onChange={(e) => handleSeccionChange(idx, 'contenido', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none resize-y placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={`Contenido de ${seccion.label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSeccion}
              className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar sección
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

// ─── ResponsablesDropdown ────────────────────────────────────────────────────

function ResponsablesDropdown({
  cargos,
  selectedIds,
  onToggle,
}: {
  cargos: { id: number; label: string }[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = search
    ? cargos.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
    : cargos;

  const selectedCargos = cargos.filter((c) => selectedIds.includes(c.id));

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-left hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
      >
        <span
          className={
            selectedIds.length > 0
              ? 'text-gray-800 dark:text-gray-200'
              : 'text-gray-400 dark:text-gray-500'
          }
        >
          {selectedIds.length > 0
            ? `${selectedIds.length} cargo(s) seleccionado(s)`
            : 'Seleccionar responsables...'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Selected chips */}
      {selectedCargos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedCargos.map((cargo) => (
            <span
              key={cargo.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
            >
              {cargo.label}
              <button
                type="button"
                onClick={() => onToggle(cargo.id)}
                className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          {/* Search input */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cargo..."
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-indigo-400"
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
          ) : (
            filtered.map((cargo) => {
              const selected = selectedIds.includes(cargo.id);
              return (
                <button
                  key={cargo.id}
                  type="button"
                  onClick={() => onToggle(cargo.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    selected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                      selected
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  {cargo.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
