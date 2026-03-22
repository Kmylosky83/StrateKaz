/**
 * SignaturePad Component
 *
 * Componente de firma digital manuscrita enterprise-grade con:
 * - Soporte TypeScript completo
 * - Integración React Hook Form
 * - Touch/móvil optimizado
 * - Export PNG/Base64/DataURL
 * - Validación integrada
 * - Dark mode support
 * - Responsive design
 * - Canvas correctamente calibrado (trazo sigue el cursor exactamente)
 *
 * @requires react-signature-canvas
 *
 * @example
 * ```tsx
 * import { SignaturePad } from '@/components/forms';
 *
 * <SignaturePad
 *   label="Firma del Responsable"
 *   onSignature={(base64) => setSignature(base64)}
 *   required
 *   error={errors.firma?.message}
 * />
 * ```
 */

import {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';
import clsx from 'clsx';

export interface SignaturePadProps {
  /** Label del campo */
  label?: string;

  /** Mensaje de ayuda */
  helpText?: string;

  /** Mensaje de error */
  error?: string;

  /** Si es requerido */
  required?: boolean;

  /** Si está deshabilitado */
  disabled?: boolean;

  /** Callback cuando se completa la firma */
  onSignature?: (signature: string) => void;

  /** Callback cuando se limpia la firma */
  onClear?: () => void;

  /** Valor inicial (base64 o dataURL) */
  defaultValue?: string;

  /** Alto del canvas */
  height?: number;

  /** Color del trazo */
  penColor?: string;

  /** Velocidad mínima para filtrar ruido */
  minStrokeWidth?: number;

  /** Velocidad máxima */
  maxStrokeWidth?: number;

  /** Throttle de eventos (ms) */
  throttle?: number;

  /** Formato de export */
  exportFormat?: 'image/png' | 'image/jpeg' | 'image/svg+xml';

  /** Calidad de export (0-1) */
  exportQuality?: number;

  /** Mostrar grid de guía */
  showGrid?: boolean;

  /** Texto placeholder cuando está vacío */
  placeholder?: string;

  /** Clases CSS adicionales */
  className?: string;

  /** ID del elemento */
  id?: string;

  /** Modo oscuro */
  darkMode?: boolean;
}

export interface SignaturePadRef {
  /** Limpia la firma */
  clear: () => void;

  /** Verifica si está vacía */
  isEmpty: () => boolean;

  /** Obtiene la firma como DataURL */
  getDataURL: (format?: string, quality?: number) => string;

  /** Obtiene la firma como Base64 puro */
  getBase64: () => string;

  /** Obtiene el canvas trimmed (sin espacios) */
  getTrimmedCanvas: () => HTMLCanvasElement;

  /** Carga firma desde DataURL */
  fromDataURL: (dataUrl: string) => void;

  /** Obtiene puntos de la firma (para verificación) */
  getPoints: () => Array<{ x: number; y: number; time: number }>;
}

// Altura del footer con botones
const FOOTER_HEIGHT = 48;
// Padding del contenedor
const _CONTAINER_PADDING = 4;

/**
 * Componente SignaturePad con ref forwarding
 * CORREGIDO: El canvas ahora tiene dimensiones exactas para que el trazo
 * siga exactamente donde el usuario toca/hace clic.
 */
export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  (
    {
      label,
      helpText,
      error,
      required = false,
      disabled = false,
      onSignature,
      onClear,
      defaultValue,
      height = 200,
      penColor = '#000000',
      minStrokeWidth = 0.5,
      maxStrokeWidth = 2.5,
      throttle = 16,
      exportFormat = 'image/png',
      exportQuality = 1,
      showGrid = false,
      placeholder = 'Firme aquí',
      className,
      id,
      darkMode = false,
    },
    ref
  ) => {
    const signatureRef = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const [isEmpty, setIsEmpty] = useState(true);
    const [touched, setTouched] = useState(false);

    // Dimensiones calculadas dinámicamente
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: height });

    // Auto-detect dark mode si no se especifica
    const isDark =
      darkMode ||
      (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
    const effectivePenColor = isDark && penColor === '#000000' ? '#ffffff' : penColor;
    const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
    const borderColor = error
      ? 'border-red-500'
      : touched && isEmpty && required
        ? 'border-yellow-500'
        : 'border-gray-300 dark:border-gray-600';

    /**
     * Calcula las dimensiones del canvas basándose en el contenedor real
     * IMPORTANTE: El canvas debe tener dimensiones exactas (no CSS) para que
     * las coordenadas del mouse/touch coincidan con el trazo.
     */
    const updateCanvasDimensions = useCallback(() => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const newWidth = Math.floor(rect.width);

        if (newWidth > 0 && newWidth !== canvasDimensions.width) {
          setCanvasDimensions({
            width: newWidth,
            height: height,
          });
        }
      }
    }, [height, canvasDimensions.width]);

    // Calcular dimensiones iniciales después del primer render
    useLayoutEffect(() => {
      updateCanvasDimensions();
    }, [updateCanvasDimensions]);

    // Observar cambios de tamaño del contenedor
    useEffect(() => {
      if (!canvasContainerRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
        // Guardar firma actual antes de redimensionar
        const currentData = signatureRef.current?.toData();

        updateCanvasDimensions();

        // Restaurar firma si existía (después de que React re-renderice)
        if (currentData && currentData.length > 0) {
          setTimeout(() => {
            signatureRef.current?.fromData(currentData);
          }, 50);
        }
      });

      resizeObserver.observe(canvasContainerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [updateCanvasDimensions]);

    // Cargar firma por defecto
    useEffect(() => {
      if (defaultValue && signatureRef.current) {
        try {
          signatureRef.current.fromDataURL(defaultValue);
          setIsEmpty(false);
        } catch (error) {
          console.error('Error loading signature:', error);
        }
      }
    }, [defaultValue]);

    // Exponer métodos vía ref
    useImperativeHandle(ref, () => ({
      clear: handleClear,
      isEmpty: () => signatureRef.current?.isEmpty() ?? true,
      getDataURL: (format = exportFormat, quality = exportQuality) => {
        if (!signatureRef.current || signatureRef.current.isEmpty()) {
          return '';
        }
        return signatureRef.current.getTrimmedCanvas().toDataURL(format, quality);
      },
      getBase64: () => {
        const dataUrl =
          signatureRef.current?.getTrimmedCanvas().toDataURL(exportFormat, exportQuality) ?? '';
        return dataUrl.replace(/^data:image\/\w+;base64,/, '');
      },
      getTrimmedCanvas: () => {
        return signatureRef.current?.getTrimmedCanvas() ?? document.createElement('canvas');
      },
      fromDataURL: (dataUrl: string) => {
        signatureRef.current?.fromDataURL(dataUrl);
        setIsEmpty(false);
      },
      getPoints: () => {
        return signatureRef.current?.toData() ?? [];
      },
    }));

    const handleClear = () => {
      signatureRef.current?.clear();
      setIsEmpty(true);
      setTouched(true);
      onClear?.();
    };

    const handleEnd = () => {
      if (signatureRef.current) {
        const empty = signatureRef.current.isEmpty();
        setIsEmpty(empty);
        setTouched(true);

        if (!empty && onSignature) {
          try {
            const dataUrl = signatureRef.current
              .getTrimmedCanvas()
              .toDataURL(exportFormat, exportQuality);
            onSignature(dataUrl);
          } catch (error) {
            console.error('Error exporting signature:', error);
          }
        }
      }
    };

    const handleBegin = () => {
      setTouched(true);
    };

    // Altura total = altura del canvas + footer
    const totalHeight = height + FOOTER_HEIGHT;

    return (
      <div className={clsx('space-y-2', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Help Text */}
        {helpText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
        )}

        {/* Signature Container */}
        <div
          ref={containerRef}
          className={clsx(
            'relative rounded-lg border-2 overflow-hidden transition-colors',
            borderColor,
            bgColor,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ height: totalHeight }}
        >
          {/* Canvas Container - Área de firma (separada del footer) */}
          <div ref={canvasContainerRef} className="relative w-full" style={{ height: height }}>
            {/* Canvas de Firma - SIN clases CSS de tamaño */}
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: canvasDimensions.width,
                height: canvasDimensions.height,
                className: clsx('cursor-crosshair touch-none', disabled && 'pointer-events-none'),
                id: id,
                style: {
                  // Asegurar que el canvas NO se escale con CSS
                  width: canvasDimensions.width,
                  height: canvasDimensions.height,
                  display: 'block',
                },
              }}
              penColor={effectivePenColor}
              minWidth={minStrokeWidth}
              maxWidth={maxStrokeWidth}
              throttle={throttle}
              onEnd={handleEnd}
              onBegin={handleBegin}
            />

            {/* Placeholder */}
            {isEmpty && !disabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-400 dark:text-gray-500 text-sm">{placeholder}</span>
              </div>
            )}

            {/* Grid de guía */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(${isDark ? '#374151' : '#e5e7eb'} 1px, transparent 1px),
                    linear-gradient(90deg, ${isDark ? '#374151' : '#e5e7eb'} 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />
            )}

            {/* Línea base de firma */}
            <div
              className="absolute left-4 right-4 pointer-events-none border-b border-dashed"
              style={{
                bottom: '20%',
                borderColor: isDark ? '#4B5563' : '#D1D5DB',
              }}
            />
          </div>

          {/* Action Buttons - Footer separado */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
            style={{ height: FOOTER_HEIGHT }}
          >
            <div className="flex items-center gap-2">
              {!isEmpty && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Firma capturada
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled || isEmpty}
                className={clsx(
                  'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  'border border-gray-300 dark:border-gray-500',
                  'hover:bg-gray-100 dark:hover:bg-gray-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'text-gray-700 dark:text-gray-200'
                )}
                title="Limpiar firma"
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <X className="w-4 h-4" />
            {error}
          </p>
        )}

        {/* Validation Warning */}
        {!error && touched && isEmpty && required && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">La firma es requerida</p>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
