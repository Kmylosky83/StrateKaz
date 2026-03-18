/**
 * Panel colapsable para visualizar texto extraído via OCR.
 * Muestra estado, metadata y texto completo (read-only).
 */
import { useState } from 'react';
import { Button, Spinner } from '@/components/common';
import { ChevronDown, ChevronUp, RotateCw, FileText } from 'lucide-react';
import OcrStatusBadge from './OcrStatusBadge';
import { useDocumento, useReprocesarOcr } from '../hooks/useGestionDocumental';
import type { OcrEstado, OcrMetadatos } from '../types/gestion-documental.types';

interface TextoExtraidoPanelProps {
  documentoId: number;
  ocrEstado: OcrEstado;
  ocrMetadatos?: OcrMetadatos;
  textoExtraido?: string;
}

export default function TextoExtraidoPanel({
  documentoId,
  ocrEstado,
  ocrMetadatos,
  textoExtraido,
}: TextoExtraidoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const reprocesarMutation = useReprocesarOcr();

  // Polling cuando está procesando
  const { data: docActualizado } = useDocumento(ocrEstado === 'PROCESANDO' ? documentoId : 0);

  // Usar datos actualizados si están disponibles
  const estado = docActualizado?.ocr_estado ?? ocrEstado;
  const metadatos = docActualizado?.ocr_metadatos ?? ocrMetadatos;
  const texto = docActualizado?.texto_extraido ?? textoExtraido;

  if (estado === 'NO_APLICA') return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Texto Extraído
          </span>
          <OcrStatusBadge estado={estado} metadatos={metadatos} />
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          {estado === 'PROCESANDO' && (
            <div className="flex items-center gap-2 py-4 text-center text-sm text-gray-500">
              <Spinner size="sm" />
              <span>Procesando extracción de texto... Esto puede tomar unos minutos.</span>
            </div>
          )}

          {estado === 'ERROR' && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                {metadatos?.error || 'Error desconocido durante la extracción de texto.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reprocesarMutation.mutate(documentoId)}
                disabled={reprocesarMutation.isPending}
              >
                <RotateCw size={14} className="mr-1" />
                {reprocesarMutation.isPending ? 'Reprocesando...' : 'Reprocesar OCR'}
              </Button>
            </div>
          )}

          {estado === 'COMPLETADO' && (
            <div className="space-y-3">
              {/* Metadata */}
              {metadatos && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {metadatos.metodo && (
                    <span>
                      Método:{' '}
                      <strong>
                        {metadatos.metodo === 'pdfplumber'
                          ? 'Extracción directa'
                          : metadatos.metodo === 'tesseract'
                            ? 'OCR (Tesseract)'
                            : metadatos.metodo}
                      </strong>
                    </span>
                  )}
                  {metadatos.confianza != null && (
                    <span>
                      Confianza: <strong>{(metadatos.confianza * 100).toFixed(0)}%</strong>
                    </span>
                  )}
                  {metadatos.paginas_procesadas != null && (
                    <span>
                      Páginas:{' '}
                      <strong>
                        {metadatos.paginas_procesadas}
                        {metadatos.total_paginas ? ` de ${metadatos.total_paginas}` : ''}
                      </strong>
                    </span>
                  )}
                  {metadatos.duracion_seg != null && (
                    <span>
                      Duración: <strong>{metadatos.duracion_seg}s</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Texto extraído */}
              {texto ? (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {texto}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No se detectó texto en el documento.</p>
              )}
            </div>
          )}

          {estado === 'PENDIENTE' && (
            <p className="text-sm text-gray-500">
              La extracción de texto está pendiente. Se procesará automáticamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
