/**
 * IngestarLoteModal - Modal para ingesta masiva de PDFs (hasta 20 archivos).
 *
 * Refactor H-GD-m1: subida secuencial archivo-por-archivo con barra de progreso
 * individual por archivo. Cada archivo tiene un estado discreto (pendiente,
 * subiendo, exito, error). Reusa el endpoint `documentos/ingestar-lote/`
 * enviando un solo archivo por request — esto evita rate-limit, da feedback
 * granular y permite continuar tras un error.
 */
import { useState, useCallback, useRef } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common';
import { Select } from '@/components/forms';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileText, X, AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useTiposDocumento } from '../hooks/useGestionDocumental';
import { gestionDocumentalKeys } from '../hooks/useGestionDocumental';
import type { ClasificacionDocumento } from '../types/gestion-documental.types';

interface IngestarLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLASIFICACION_OPTIONS = [
  { value: 'PUBLICO', label: 'Público' },
  { value: 'INTERNO', label: 'Interno' },
  { value: 'CONFIDENCIAL', label: 'Confidencial' },
  { value: 'RESTRINGIDO', label: 'Restringido' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_FILES = 20;

type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

interface FileItem {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  documentoCodigo?: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IngestarLoteModal({ isOpen, onClose }: IngestarLoteModalProps) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState<string>('');
  const [clasificacion, setClasificacion] = useState<ClasificacionDocumento>('INTERNO');
  const [dragOver, setDragOver] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: tipos = [] } = useTiposDocumento();

  const tipoOptions = tipos.map((t) => ({
    value: String(t.id),
    label: `${t.codigo} - ${t.nombre}`,
  }));

  const validateAndAddFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const errors: string[] = [];
      const validFiles: File[] = [];
      const currentCount = items.length;

      Array.from(newFiles).forEach((f) => {
        if (!f.name.toLowerCase().endsWith('.pdf')) {
          errors.push(`${f.name}: Solo se aceptan archivos PDF`);
          return;
        }
        if (f.size > MAX_FILE_SIZE) {
          errors.push(`${f.name}: Excede el tamaño máximo de 50 MB`);
          return;
        }
        if (currentCount + validFiles.length >= MAX_FILES) {
          errors.push(`${f.name}: Máximo ${MAX_FILES} archivos por lote`);
          return;
        }
        if (
          items.some((existing) => existing.file.name === f.name && existing.file.size === f.size)
        ) {
          errors.push(`${f.name}: Archivo duplicado`);
          return;
        }
        validFiles.push(f);
      });

      setFileErrors(errors);
      if (validFiles.length > 0) {
        setItems((prev) => [
          ...prev,
          ...validFiles.map<FileItem>((file) => ({
            file,
            status: 'pending',
            progress: 0,
          })),
        ]);
      }
    },
    [items]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      validateAndAddFiles(e.dataTransfer.files);
    },
    [validateAndAddFiles]
  );

  const removeFile = (index: number) => {
    if (isUploading) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setFileErrors([]);
  };

  const updateItem = (index: number, patch: Partial<FileItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = async () => {
    if (items.length === 0 || !tipoDocumento || isUploading) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    // Subida secuencial archivo-por-archivo
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      // Saltar los que ya están en éxito (re-intento parcial)
      if (item.status === 'success') {
        successCount += 1;
        continue;
      }

      updateItem(i, { status: 'uploading', progress: 0, error: undefined });

      const formData = new FormData();
      formData.append('archivos', item.file);
      formData.append('tipo_documento', tipoDocumento);
      formData.append('clasificacion', clasificacion);

      try {
        const response = await apiClient.post(
          '/api/gestion-documental/documentos/ingestar-lote/',
          formData,
          {
            onUploadProgress: (event) => {
              if (event.total) {
                const pct = Math.round((event.loaded * 100) / event.total);
                updateItem(i, { progress: pct });
              }
            },
          }
        );
        const data = response.data ?? {};
        const errores = Array.isArray(data.detalle_errores) ? data.detalle_errores : [];
        if (data.creados >= 1 && errores.length === 0) {
          const documentoCodigo: string | undefined = data.documentos?.[0]?.codigo;
          updateItem(i, { status: 'success', progress: 100, documentoCodigo });
          successCount += 1;
        } else {
          const errMsg = errores[0]?.error ?? 'Error desconocido al ingestar';
          updateItem(i, { status: 'error', progress: 100, error: errMsg });
          errorCount += 1;
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : 'Error de red al subir el archivo';
        updateItem(i, { status: 'error', progress: 100, error: message });
        errorCount += 1;
      }
    }

    setIsUploading(false);

    queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.listadoMaestro() });
    queryClient.invalidateQueries({ queryKey: ['gd', 'documentos'] });

    if (errorCount === 0) {
      toast.success(`${successCount} documento(s) ingresado(s) exitosamente`);
    } else if (successCount === 0) {
      toast.error(`No se pudo ingresar ningún archivo (${errorCount} con error)`);
    } else {
      toast.warning(`${successCount} documento(s) ingresado(s), ${errorCount} con error`);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setItems([]);
    setTipoDocumento('');
    setClasificacion('INTERNO');
    setFileErrors([]);
    setDragOver(false);
    onClose();
  };

  const totalSize = items.reduce((acc, item) => acc + item.file.size, 0);
  const allDone = items.length > 0 && items.every((it) => it.status === 'success');
  const successCount = items.filter((it) => it.status === 'success').length;
  const errorCount = items.filter((it) => it.status === 'error').length;
  const pendingCount = items.filter(
    (it) => it.status === 'pending' || it.status === 'error'
  ).length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ingesta Masiva de Documentos"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-gray-500">
            {items.length} archivo{items.length !== 1 ? 's' : ''} &middot;{' '}
            {formatFileSize(totalSize)}
            {(successCount > 0 || errorCount > 0) && (
              <>
                {' '}
                &middot;{' '}
                {successCount > 0 && <span className="text-emerald-600">{successCount} OK</span>}
                {successCount > 0 && errorCount > 0 && ', '}
                {errorCount > 0 && <span className="text-red-600">{errorCount} con error</span>}
              </>
            )}
          </span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {allDone ? 'Cerrar' : 'Cancelar'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={items.length === 0 || !tipoDocumento || isUploading || pendingCount === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Subiendo...
                </>
              ) : errorCount > 0 ? (
                `Reintentar ${pendingCount} archivo${pendingCount !== 1 ? 's' : ''}`
              ) : (
                `Ingestar ${items.length} archivo${items.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragOver={(e) => {
            if (isUploading) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload size={36} className="mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            Arrastra varios PDFs aquí o{' '}
            <button
              type="button"
              className="text-blue-600 underline hover:text-blue-700"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              selecciona archivos
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Solo PDF, máximo 50 MB por archivo, hasta {MAX_FILES} archivos
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) validateAndAddFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* Errors de validación previa */}
        {fileErrors.length > 0 && (
          <div className="space-y-1 rounded-lg bg-red-50 p-3 dark:bg-red-900/10">
            {fileErrors.map((err, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {err}
              </p>
            ))}
          </div>
        )}

        {/* File list con progreso individual */}
        {items.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900 dark:text-gray-100">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(item.file.size)}
                      {item.documentoCodigo && (
                        <span className="ml-2 font-mono text-emerald-600">
                          {item.documentoCodigo}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {item.status === 'pending' && (
                      <span className="text-xs text-gray-500">Pendiente</span>
                    )}
                    {item.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                    {item.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  </div>

                  {!isUploading && item.status !== 'success' && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      aria-label="Eliminar archivo"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {(item.status === 'uploading' ||
                  item.status === 'success' ||
                  item.status === 'error') && (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full transition-all duration-200 ${
                        item.status === 'error'
                          ? 'bg-red-500'
                          : item.status === 'success'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === 'error' && item.error && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    {item.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Shared metadata */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Tipo de documento para todos *"
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value)}
            options={tipoOptions}
            placeholder="Seleccionar tipo..."
            disabled={isUploading}
          />
          <Select
            label="Clasificación"
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value as ClasificacionDocumento)}
            options={CLASIFICACION_OPTIONS}
            disabled={isUploading}
          />
        </div>

        <p className="text-xs text-gray-500">
          Cada PDF se sube de forma secuencial y se crea como documento individual en BORRADOR. El
          OCR se ejecutará en segundo plano y recibirás notificaciones cuando finalice.
        </p>
      </div>
    </BaseModal>
  );
}
