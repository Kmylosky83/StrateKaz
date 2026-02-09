/**
 * EvidenceUploader - Componente reutilizable para subir evidencias a CUALQUIER entidad.
 *
 * Uso:
 * ```tsx
 * <EvidenceUploader
 *   entityType="calidad.noconformidad"
 *   entityId={nc.id}
 *   categoria="FOTOGRAFICA"
 *   normasRelacionadas={['ISO_9001']}
 *   onUploadComplete={(ev) => console.log('Subida:', ev)}
 * />
 * ```
 */
import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { Badge } from './Badge';
import { Spinner } from './Spinner';
import { useCrearEvidencia } from '@/features/cumplimiento/hooks/useEvidencias';
import type { Evidencia, CategoriaEvidencia } from '@/features/cumplimiento/types/evidencia.types';

export interface EvidenceUploaderProps {
  /** Tipo de entidad: "app_label.model" */
  entityType: string;
  /** ID de la entidad */
  entityId: number;
  /** Callback al completar upload */
  onUploadComplete?: (evidencia: Evidencia) => void;
  /** Máximo de archivos por sesión */
  maxFiles?: number;
  /** Tamaño máximo en MB */
  maxSizeMB?: number;
  /** Tipos MIME aceptados */
  acceptedTypes?: string;
  /** Categoría por defecto */
  categoria?: CategoriaEvidencia;
  /** Normas relacionadas por defecto */
  normasRelacionadas?: string[];
  /** Tags por defecto */
  tags?: string[];
  /** Solo lectura */
  readOnly?: boolean;
  /** Clases adicionales */
  className?: string;
  /** Texto del placeholder */
  placeholder?: string;
}

interface PendingFile {
  file: File;
  titulo: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceUploader({
  entityType,
  entityId,
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.mp4',
  categoria = 'OTRO',
  normasRelacionadas = [],
  tags = [],
  readOnly = false,
  className,
  placeholder = 'Arrastra archivos aquí o haz clic para seleccionar',
}: EvidenceUploaderProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const crearEvidencia = useCrearEvidencia();

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeBytes) {
        return `Excede ${maxSizeMB} MB`;
      }
      return null;
    },
    [maxSizeBytes, maxSizeMB]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newFiles: PendingFile[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (pendingFiles.length + newFiles.length >= maxFiles) break;
        const error = validateFile(file);
        newFiles.push({
          file,
          titulo: file.name.replace(/\.[^/.]+$/, ''),
          status: error ? 'error' : 'pending',
          error: error || undefined,
        });
      }

      setPendingFiles((prev) => [...prev, ...newFiles]);
    },
    [pendingFiles.length, maxFiles, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (readOnly) return;
      addFiles(e.dataTransfer.files);
    },
    [addFiles, readOnly]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTitulo = (index: number, titulo: string) => {
    setPendingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, titulo } : f))
    );
  };

  const uploadFile = async (index: number) => {
    const pf = pendingFiles[index];
    if (!pf || pf.status !== 'pending') return;

    setPendingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f))
    );

    try {
      const result = await crearEvidencia.mutateAsync({
        archivo: pf.file,
        titulo: pf.titulo || pf.file.name,
        entity_type: entityType,
        entity_id: entityId,
        categoria,
        normas_relacionadas: normasRelacionadas,
        tags,
      });

      setPendingFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'done' } : f))
      );

      onUploadComplete?.(result as unknown as Evidencia);
    } catch {
      setPendingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error', error: 'Error al subir' } : f
        )
      );
    }
  };

  const uploadAll = async () => {
    for (let i = 0; i < pendingFiles.length; i++) {
      if (pendingFiles[i].status === 'pending') {
        await uploadFile(i);
      }
    }
  };

  const pendingCount = pendingFiles.filter((f) => f.status === 'pending').length;
  const hasFiles = pendingFiles.length > 0;

  if (readOnly) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        )}
      >
        <Upload
          className={cn(
            'h-8 w-8 mb-2',
            isDragging ? 'text-primary-500' : 'text-gray-400'
          )}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {placeholder}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Máx. {maxSizeMB} MB por archivo &middot; Hasta {maxFiles} archivos
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File List */}
      {hasFiles && (
        <div className="space-y-2">
          {pendingFiles.map((pf, index) => (
            <div
              key={`${pf.file.name}-${index}`}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3',
                pf.status === 'done' && 'border-green-200 bg-green-50 dark:bg-green-900/10',
                pf.status === 'error' && 'border-red-200 bg-red-50 dark:bg-red-900/10',
                pf.status === 'uploading' && 'border-blue-200 bg-blue-50 dark:bg-blue-900/10',
                pf.status === 'pending' && 'border-gray-200 dark:border-gray-700'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {pf.status === 'uploading' ? (
                  <Spinner size="sm" />
                ) : pf.status === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : pf.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  getFileIcon(pf.file.type)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {pf.status === 'pending' ? (
                  <input
                    type="text"
                    value={pf.titulo}
                    onChange={(e) => updateTitulo(index, e.target.value)}
                    className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary-500 outline-none pb-0.5"
                    placeholder="Título de la evidencia"
                  />
                ) : (
                  <p className="text-sm font-medium truncate">{pf.titulo}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{formatFileSize(pf.file.size)}</span>
                  {pf.error && (
                    <span className="text-xs text-red-500">{pf.error}</span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              {pf.status === 'done' && <Badge variant="success" size="sm">Subido</Badge>}
              {pf.status === 'uploading' && <Badge variant="info" size="sm">Subiendo...</Badge>}

              {/* Remove Button */}
              {pf.status !== 'uploading' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          ))}

          {/* Upload Button */}
          {pendingCount > 0 && (
            <Button
              onClick={uploadAll}
              disabled={crearEvidencia.isPending}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir {pendingCount} archivo{pendingCount > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
