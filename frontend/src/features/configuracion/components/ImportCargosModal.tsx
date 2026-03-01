/**
 * ImportCargosModal
 * Modal para importación masiva de cargos desde Excel.
 *
 * Flujo:
 *  1. Usuario descarga plantilla (opcional)
 *  2. Arrastra o selecciona archivo .xlsx
 *  3. Se muestra spinner de carga
 *  4. Se muestran resultados: creados + errores por fila
 *
 * Patrón: Idéntico a ImportarColaboradoresModal (talent-hub)
 */
import { useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { apiClient } from '@/lib/api-client';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const CARGOS_BASE_URL = '/core/cargos-rbac';

interface FilaError {
  fila: number | string;
  codigo: string;
  errores: string[];
}

interface ImportResult {
  creados: number;
  actualizados: number;
  errores: FilaError[];
  total_filas: number;
}

type Step = 'upload' | 'loading' | 'result';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportCargosModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const { primaryColor } = useBrandingConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // ── Reset al cerrar ───────────────────────────────────────────────────────
  const handleClose = () => {
    setStep('upload');
    setResult(null);
    setSelectedFileName('');
    setIsDragging(false);
    onClose();
  };

  // ── Descarga plantilla ────────────────────────────────────────────────────
  const handleDescargarPlantilla = async () => {
    try {
      const response = await apiClient.get(`${CARGOS_BASE_URL}/plantilla-importacion/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_cargos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar la plantilla');
    }
  };

  // ── Procesar archivo ──────────────────────────────────────────────────────
  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('El archivo debe ser Excel (.xlsx)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede superar 10 MB');
        return;
      }

      setSelectedFileName(file.name);
      setStep('loading');

      const formData = new FormData();
      formData.append('archivo', file);

      try {
        const response = await apiClient.post<ImportResult>(
          `${CARGOS_BASE_URL}/importar/`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setResult(response.data);
        setStep('result');

        if (response.data.creados > 0) {
          queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
          queryClient.invalidateQueries({ queryKey: ['rbac-stats'] });
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } };
        const msg = err?.response?.data?.detail || 'Error procesando el archivo';
        toast.error(msg);
        setStep('upload');
        setSelectedFileName('');
      }
    },
    [queryClient]
  );

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleReintentar = () => {
    setStep('upload');
    setResult(null);
    setSelectedFileName('');
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar cargos"
      subtitle="Carga múltiples cargos desde un archivo Excel"
      size="lg"
    >
      {/* ── PASO 1: Subir archivo ─────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-5">
          {/* Descargar plantilla */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Descarga la plantilla con el formato correcto y valores de referencia</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDescargarPlantilla}
              className="shrink-0 ml-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Plantilla Excel
            </Button>
          </div>

          {/* Zona drag & drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3
              w-full min-h-48 rounded-xl border-2 border-dashed cursor-pointer
              transition-all duration-200
              ${
                isDragging
                  ? 'border-current bg-opacity-5 scale-[1.01]'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }
            `}
            style={
              isDragging ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}
            }
          >
            <div className="p-4 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
              <Upload className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Arrastra el archivo aquí o <span style={{ color: primaryColor }}>selecciona</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Excel (.xlsx) — máx. 10 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Instrucciones */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Instrucciones
            </p>
            <ul className="space-y-1">
              {[
                'Cada cargo requiere un código único (se convierte a mayúsculas automáticamente)',
                'Las áreas deben existir previamente en el sistema',
                'El "Cargo Padre" (reporta a) debe ser un cargo existente',
                'Las filas con error se reportan sin bloquear las filas válidas',
                'Máx. 100 cargos por importación',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  <span className="mt-0.5 text-gray-300">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── PASO 2: Cargando ──────────────────────────────────────────────── */}
      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }}
            />
            <FileSpreadsheet
              className="absolute inset-0 m-auto w-6 h-6"
              style={{ color: primaryColor }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Procesando {selectedFileName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Validando y creando cargos...
            </p>
          </div>
        </div>
      )}

      {/* ── PASO 3: Resultados ────────────────────────────────────────────── */}
      {step === 'result' && result && (
        <div className="space-y-5">
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-3">
            <ResultStat
              label="Creados"
              value={result.creados}
              color="success"
              icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            />
            <ResultStat
              label="Con errores"
              value={result.errores.length}
              color={result.errores.length > 0 ? 'danger' : 'success'}
              icon={
                result.errores.length > 0 ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )
              }
            />
          </div>

          {/* Mensaje principal */}
          {result.creados > 0 && result.errores.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Importación completada exitosamente. Se crearon {result.creados} cargo
                {result.creados !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
          {result.creados > 0 && result.errores.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Se crearon {result.creados} cargo{result.creados !== 1 ? 's' : ''}, pero{' '}
                {result.errores.length} fila
                {result.errores.length !== 1 ? 's' : ''} tuvieron errores.
              </p>
            </div>
          )}
          {result.creados === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                No se pudo crear ningún cargo. Revisa los errores y corrige el archivo.
              </p>
            </div>
          )}

          {/* Tabla de errores */}
          {result.errores.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Filas con errores ({result.errores.length})
              </p>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-red-200 dark:border-red-900/40 divide-y divide-red-100 dark:divide-red-900/20">
                {result.errores.map((err, idx) => (
                  <div key={idx} className="p-3 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">
                        Fila {err.fila}
                        {err.codigo && err.codigo !== '—' ? ` — Código: ${err.codigo}` : ''}
                      </span>
                    </div>
                    <ul className="pl-5 space-y-0.5">
                      {err.errores.map((msg, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400 list-disc">
                          {msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReintentar}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Importar otro archivo
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

// ── Helper interno ────────────────────────────────────────────────────────────

function ResultStat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'success' | 'danger' | 'info';
  icon: React.ReactNode;
}) {
  const bg = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
  }[color];

  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-lg border ${bg}`}>
      {icon}
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}
