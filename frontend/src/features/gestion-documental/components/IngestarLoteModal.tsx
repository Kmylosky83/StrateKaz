/**
 * IngestarLoteModal - Modal para ingesta masiva de PDFs (hasta 20 archivos).
 * Todos comparten tipo_documento y clasificación. OCR se dispara async por cada uno.
 */
import { useState, useCallback, useRef } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Spinner } from '@/components/common';
import { Select } from '@/components/forms';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { useTiposDocumento, useIngestarLote } from '../hooks/useGestionDocumental';
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IngestarLoteModal({ isOpen, onClose }: IngestarLoteModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState<string>('');
  const [clasificacion, setClasificacion] = useState<ClasificacionDocumento>('INTERNO');
  const [dragOver, setDragOver] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tipos = [] } = useTiposDocumento();
  const ingestarLoteMutation = useIngestarLote();

  const tipoOptions = tipos.map((t) => ({
    value: String(t.id),
    label: `${t.codigo} - ${t.nombre}`,
  }));

  const validateAndAddFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const errors: string[] = [];
      const validFiles: File[] = [];
      const currentCount = files.length;

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
        // Check duplicates
        if (files.some((existing) => existing.name === f.name && existing.size === f.size)) {
          errors.push(`${f.name}: Archivo duplicado`);
          return;
        }
        validFiles.push(f);
      });

      setFileErrors(errors);
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [files]
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
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileErrors([]);
  };

  const handleSubmit = async () => {
    if (files.length === 0 || !tipoDocumento) return;

    const formData = new FormData();
    files.forEach((f) => formData.append('archivos', f));
    formData.append('tipo_documento', tipoDocumento);
    formData.append('clasificacion', clasificacion);

    await ingestarLoteMutation.mutateAsync(formData);
    handleClose();
  };

  const handleClose = () => {
    setFiles([]);
    setTipoDocumento('');
    setClasificacion('INTERNO');
    setFileErrors([]);
    setDragOver(false);
    onClose();
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ingesta Masiva de Documentos"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-gray-500">
            {files.length} archivo{files.length !== 1 ? 's' : ''} &middot;{' '}
            {formatFileSize(totalSize)}
          </span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={files.length === 0 || !tipoDocumento || ingestarLoteMutation.isPending}
            >
              {ingestarLoteMutation.isPending ? (
                <>
                  <Spinner size="sm" /> Procesando...
                </>
              ) : (
                `Ingestar ${files.length} archivo${files.length !== 1 ? 's' : ''}`
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
          }`}
          onDragOver={(e) => {
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

        {/* Errors */}
        {fileErrors.length > 0 && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-3 space-y-1">
            {fileErrors.map((err, i) => (
              <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {err}
              </p>
            ))}
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <X size={16} />
                </button>
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
          />
          <Select
            label="Clasificación"
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value as ClasificacionDocumento)}
            options={CLASIFICACION_OPTIONS}
          />
        </div>

        <p className="text-xs text-gray-500">
          Cada PDF se creará como documento individual en BORRADOR. El OCR se ejecutará en segundo
          plano y recibirá notificaciones cuando finalice.
        </p>
      </div>
    </BaseModal>
  );
}
