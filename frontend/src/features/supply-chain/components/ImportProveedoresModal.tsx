/**
 * Modal de Importación Masiva de Proveedores
 *
 * 3 pasos: Subir archivo -> Procesando -> Resultados
 * Soporta .xlsx/.xls, máximo 10MB.
 * Descarga plantilla y sube archivo para importación masiva.
 */
import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal, Button, Spinner, Badge } from '@/components/common';
import apiClient from '@/api/axios-config';
import { proveedoresKeys } from '../hooks/useProveedores';

// ==================== TIPOS ====================

interface ImportProveedoresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  creados: number;
  actualizados: number;
  errores: Array<{
    fila: number;
    campo?: string;
    mensaje: string;
  }>;
  total_procesados: number;
}

type Step = 'upload' | 'processing' | 'results';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const BASE_URL = '/api/supply-chain/gestion-proveedores/proveedores';

// ==================== COMPONENTE ====================

export default function ImportProveedoresModal({ isOpen, onClose }: ImportProveedoresModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ==================== HANDLERS ====================

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (f: File): string | null => {
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Solo se permiten archivos .xlsx o .xls';
    }
    if (f.size > MAX_FILE_SIZE) {
      return 'El archivo excede el tamaño máximo de 10MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setFile(f);
    setError(null);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get(`${BASE_URL}/plantilla-importacion/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla-proveedores.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Plantilla descargada exitosamente');
    } catch {
      toast.error('Error al descargar la plantilla');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStep('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const response = await apiClient.post(`${BASE_URL}/importar/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      setStep('results');

      // Invalidar cache si hubo creados o actualizados
      if (response.data.creados > 0 || response.data.actualizados > 0) {
        queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
        queryClient.invalidateQueries({ queryKey: proveedoresKeys.estadisticas() });
      }
    } catch (err: unknown) {
      setStep('upload');
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 'Error al importar proveedores';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ==================== STEP INDICATORS ====================

  const steps = [
    { key: 'upload', label: 'Subir', icon: Upload },
    { key: 'processing', label: 'Procesando', icon: Loader2 },
    { key: 'results', label: 'Resultados', icon: CheckCircle },
  ] as const;

  const getStepStatus = (stepKey: string) => {
    const stepOrder = ['upload', 'processing', 'results'];
    const currentIdx = stepOrder.indexOf(step);
    const stepIdx = stepOrder.indexOf(stepKey);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  // ==================== RENDER ====================

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Proveedores" size="large">
      <div className="space-y-6">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-4">
          {steps.map((s, index) => {
            const status = getStepStatus(s.key);
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {index > 0 && (
                  <div
                    className={`w-8 h-0.5 ${
                      status !== 'pending' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'completed'
                        ? 'bg-primary-500 text-white'
                        : status === 'current'
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${s.key === 'processing' && step === 'processing' ? 'animate-spin' : ''}`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      status === 'current'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Download template */}
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Descargue la plantilla
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Use la plantilla para completar los datos de proveedores
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Descargar
              </Button>
            </div>

            {/* Drag & drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : file
                    ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-success-600 dark:text-success-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Arrastre su archivo aqui o haga clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formatos: .xlsx, .xls | Tamaño maximo: 10MB
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
                <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400 flex-shrink-0" />
                <p className="text-sm text-danger-700 dark:text-danger-300">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleUpload} disabled={!file}>
                Importar Proveedores
              </Button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Spinner size="large" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Procesando archivo...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esto puede tomar unos segundos
            </p>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-success-700 dark:text-success-400">
                  {result.creados}
                </p>
                <p className="text-sm text-success-600 dark:text-success-300">Creados</p>
              </div>
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                  {result.actualizados}
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-300">Actualizados</p>
              </div>
              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-danger-700 dark:text-danger-400">
                  {result.errores.length}
                </p>
                <p className="text-sm text-danger-600 dark:text-danger-300">Errores</p>
              </div>
            </div>

            {/* Errors detail */}
            {result.errores.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Detalle de errores
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errores.map((err, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-danger-50 dark:bg-danger-900/10 rounded text-sm"
                    >
                      <Badge variant="danger" size="sm">
                        Fila {err.fila}
                      </Badge>
                      <span className="text-danger-700 dark:text-danger-300">
                        {err.campo ? `${err.campo}: ` : ''}
                        {err.mensaje}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={resetState}>
                Importar Otro Archivo
              </Button>
              <Button type="button" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
