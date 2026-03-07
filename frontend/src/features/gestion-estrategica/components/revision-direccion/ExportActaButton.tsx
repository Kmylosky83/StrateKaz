/**
 * Botón para Exportar Acta de Revisión por la Dirección a PDF
 *
 * Características:
 * - Carga completa del acta con datos expandidos
 * - Loading state durante generación del PDF
 * - Preview opcional antes de descargar
 * - Manejo de errores con toasts informativos
 * - Validación de datos antes de exportar
 */

import { useState } from 'react';
import { FileDown, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/common/Button';
import { exportActaToPDF, ExportActaError } from '../../utils/exportActaPDF';
import type { ActaRevisionExpandida } from '../../types/revision-direccion.types';

// =============================================================================
// TIPOS
// =============================================================================

interface ExportActaButtonProps {
  acta: ActaRevisionExpandida;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showPreview?: boolean;
  includeParticipants?: boolean;
  includeAnalysis?: boolean;
  includeCommitments?: boolean;
  includeSignatures?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportSuccess?: () => void;
  onExportError?: (error: ExportActaError) => void;
}

interface ExportOptions {
  includeParticipants: boolean;
  includeAnalysis: boolean;
  includeCommitments: boolean;
  includeSignatures: boolean;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExportActaButton({
  acta,
  variant = 'primary',
  size = 'md',
  showPreview = false,
  includeParticipants = true,
  includeAnalysis = true,
  includeCommitments = true,
  includeSignatures = true,
  className = '',
  onExportStart,
  onExportSuccess,
  onExportError,
}: ExportActaButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeParticipants,
    includeAnalysis,
    includeCommitments,
    includeSignatures,
  });

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleExport = async () => {
    try {
      setIsExporting(true);
      onExportStart?.();

      // Validar que el acta tenga datos mínimos
      if (!acta.numero_acta) {
        throw new ExportActaError('El acta debe tener un número de acta asignado', 'VALIDATION');
      }

      if (!acta.fecha) {
        throw new ExportActaError('El acta debe tener una fecha asignada', 'VALIDATION');
      }

      // Exportar a PDF
      await exportActaToPDF(acta, exportOptions);

      // Notificar éxito
      toast.success('Acta exportada a PDF exitosamente', { duration: 3000 });

      onExportSuccess?.();
    } catch (error) {
      console.error('Error al exportar acta:', error);

      // Determinar mensaje de error
      let errorMessage = 'No se pudo exportar el acta a PDF';

      if (error instanceof ExportActaError) {
        errorMessage = error.message;
        onExportError?.(error);
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShowOptions = () => {
    if (showPreview) {
      setShowOptionsModal(true);
    } else {
      handleExport();
    }
  };

  const handleConfirmExport = () => {
    setShowOptionsModal(false);
    handleExport();
  };

  // ===========================================================================
  // ESTILOS
  // ===========================================================================

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <>
      {/* Botón de Exportación */}
      <Button
        type="button"
        variant={variant === 'primary' ? 'primary' : variant === 'danger' ? 'danger' : 'outline'}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
        onClick={handleShowOptions}
        disabled={isExporting}
        className={className}
        title="Exportar acta a PDF"
      >
        {isExporting ? (
          <>
            <Loader2 size={iconSizes[size]} className="animate-spin" />
            <span>Generando PDF...</span>
          </>
        ) : (
          <>
            <FileDown size={iconSizes[size]} />
            <span>Exportar PDF</span>
          </>
        )}
      </Button>

      {/* Modal de Opciones de Exportación */}
      {showOptionsModal && (
        <ExportOptionsModal
          options={exportOptions}
          onOptionsChange={setExportOptions}
          onConfirm={handleConfirmExport}
          onCancel={() => setShowOptionsModal(false)}
          actaNumero={acta.numero_acta}
        />
      )}
    </>
  );
}

// =============================================================================
// COMPONENTE: MODAL DE OPCIONES
// =============================================================================

interface ExportOptionsModalProps {
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
  onConfirm: () => void;
  onCancel: () => void;
  actaNumero: string;
}

function ExportOptionsModal({
  options,
  onOptionsChange,
  onConfirm,
  onCancel,
  actaNumero,
}: ExportOptionsModalProps) {
  const handleToggle = (key: keyof ExportOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Opciones de Exportación</h3>
              <p className="text-sm text-slate-500">Acta {actaNumero}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-slate-600">
            Selecciona las secciones que deseas incluir en el PDF:
          </p>

          {/* Opciones */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.includeParticipants}
                onChange={() => handleToggle('includeParticipants')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  Participantes
                </div>
                <div className="text-xs text-slate-500">Lista de participantes con asistencia</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.includeAnalysis}
                onChange={() => handleToggle('includeAnalysis')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  Análisis de Temas
                </div>
                <div className="text-xs text-slate-500">
                  Desarrollo completo de cada tema revisado
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.includeCommitments}
                onChange={() => handleToggle('includeCommitments')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  Compromisos
                </div>
                <div className="text-xs text-slate-500">
                  Tabla de compromisos y acciones derivadas
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.includeSignatures}
                onChange={() => handleToggle('includeSignatures')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  Firmas
                </div>
                <div className="text-xs text-slate-500">
                  Sección de firmas (Elaborado, Revisado, Aprobado)
                </div>
              </div>
            </label>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              El PDF incluirá encabezado con logo, pie de página con paginación, y formato
              profesional según normas ISO.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onConfirm}>
            <FileDown size={16} />
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// VARIANTES ADICIONALES DEL COMPONENTE
// =============================================================================

/**
 * Botón compacto solo con icono (para usar en tablas)
 */
export function ExportActaButtonCompact({
  acta,
  onExportSuccess,
  onExportError,
}: Pick<ExportActaButtonProps, 'acta' | 'onExportSuccess' | 'onExportError'>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      await exportActaToPDF(acta, {
        includeParticipants: true,
        includeAnalysis: true,
        includeCommitments: true,
        includeSignatures: true,
      });

      toast.success('PDF generado', { duration: 2000, icon: '📄' });
      onExportSuccess?.();
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar PDF', { duration: 3000 });

      if (error instanceof ExportActaError) {
        onExportError?.(error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="!p-2 !min-h-0"
      title="Exportar a PDF"
    >
      {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
    </Button>
  );
}

/**
 * Botón con dropdown para opciones rápidas
 */
export function ExportActaButtonWithMenu({
  acta,
  onExportSuccess,
  onExportError,
}: Pick<ExportActaButtonProps, 'acta' | 'onExportSuccess' | 'onExportError'>) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (preset: 'full' | 'summary' | 'commitments-only') => {
    try {
      setIsExporting(true);
      setShowMenu(false);

      let options: Partial<ExportOptions> = {};

      switch (preset) {
        case 'full':
          options = {
            includeParticipants: true,
            includeAnalysis: true,
            includeCommitments: true,
            includeSignatures: true,
          };
          break;
        case 'summary':
          options = {
            includeParticipants: true,
            includeAnalysis: false,
            includeCommitments: true,
            includeSignatures: true,
          };
          break;
        case 'commitments-only':
          options = {
            includeParticipants: false,
            includeAnalysis: false,
            includeCommitments: true,
            includeSignatures: false,
          };
          break;
      }

      await exportActaToPDF(acta, options as ExportOptions);

      toast.success('PDF generado', { duration: 2000, icon: '📄' });
      onExportSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al exportar PDF');

      if (error instanceof ExportActaError) {
        onExportError?.(error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
      >
        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
        <span>Exportar</span>
        <svg
          className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
            <div className="py-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleExport('full')}
                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm flex-col items-start"
              >
                <div className="font-medium text-slate-900">Acta Completa</div>
                <div className="text-xs text-slate-500">Todas las secciones</div>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleExport('summary')}
                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm flex-col items-start"
              >
                <div className="font-medium text-slate-900">Resumen Ejecutivo</div>
                <div className="text-xs text-slate-500">Sin análisis detallado</div>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleExport('commitments-only')}
                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm flex-col items-start"
              >
                <div className="font-medium text-slate-900">Solo Compromisos</div>
                <div className="text-xs text-slate-500">Tabla de acciones</div>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
