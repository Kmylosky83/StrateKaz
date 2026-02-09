/**
 * DynamicFormRenderer - Renderiza formularios dinamicos desde CampoFormulario del backend
 *
 * Soporta los 12 tipos de campo del backend:
 * TEXT, TEXTAREA, NUMBER, EMAIL, DATE, DATETIME,
 * SELECT, MULTISELECT, RADIO, CHECKBOX, FILE, SIGNATURE
 *
 * Usado por:
 * - Workflow Engine (tareas con formulario)
 * - Inspecciones de seguridad
 * - Cualquier modulo que use el FormBuilder del backend
 */
import { useState, useRef, useCallback } from 'react';
import { AlertCircle, Upload, X, Check, Pen } from 'lucide-react';
import { Button } from './Button';

// ============================================================
// TIPOS
// ============================================================

export interface DynamicFieldDefinition {
  id: number;
  nombre: string;
  etiqueta: string;
  tipo: string;
  orden: number;
  requerido: boolean;
  valor_defecto: string;
  opciones: { valor: string; etiqueta: string }[] | null;
  validaciones: Record<string, unknown> | null;
  ayuda: string;
  placeholder: string;
}

export interface DynamicFormRendererProps {
  /** Definiciones de campos (desde CampoFormulario del backend) */
  fields: DynamicFieldDefinition[];
  /** Valores actuales del formulario */
  values: Record<string, unknown>;
  /** Callback cuando cambia un valor */
  onChange: (fieldName: string, value: unknown) => void;
  /** Errores de validacion por campo */
  errors?: Record<string, string>;
  /** Modo solo lectura */
  readOnly?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export const DynamicFormRenderer = ({
  fields,
  values,
  onChange,
  errors = {},
  readOnly = false,
  className = '',
}: DynamicFormRendererProps) => {
  const sortedFields = [...fields].sort((a, b) => a.orden - b.orden);

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedFields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          value={values[field.nombre]}
          onChange={(value) => onChange(field.nombre, value)}
          error={errors[field.nombre]}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

// ============================================================
// CAMPO INDIVIDUAL
// ============================================================

interface DynamicFieldProps {
  field: DynamicFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly: boolean;
}

const DynamicField = ({ field, value, onChange, error, readOnly }: DynamicFieldProps) => {
  return (
    <div>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {field.etiqueta}
        {field.requerido && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Ayuda */}
      {field.ayuda && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{field.ayuda}</p>
      )}

      {/* Campo segun tipo */}
      <FieldRenderer
        field={field}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================================
// RENDERER POR TIPO DE CAMPO
// ============================================================

interface FieldRendererProps {
  field: DynamicFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly: boolean;
}

const inputClasses = `
  w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
  disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
  placeholder:text-gray-400 dark:placeholder:text-gray-500
`;

const FieldRenderer = ({ field, value, onChange, readOnly }: FieldRendererProps) => {
  switch (field.tipo) {
    case 'TEXT':
    case 'EMAIL':
      return (
        <input
          type={field.tipo === 'EMAIL' ? 'email' : 'text'}
          value={(value as string) ?? field.valor_defecto ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={readOnly}
          className={inputClasses}
          maxLength={field.validaciones?.max_length as number | undefined}
          minLength={field.validaciones?.min_length as number | undefined}
        />
      );

    case 'TEXTAREA':
      return (
        <textarea
          value={(value as string) ?? field.valor_defecto ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={readOnly}
          className={`${inputClasses} min-h-[80px] resize-y`}
          rows={4}
          maxLength={field.validaciones?.max_length as number | undefined}
        />
      );

    case 'NUMBER':
      return (
        <input
          type="number"
          value={value != null ? String(value) : field.valor_defecto ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={field.placeholder}
          disabled={readOnly}
          className={inputClasses}
          min={field.validaciones?.min as number | undefined}
          max={field.validaciones?.max as number | undefined}
          step={field.validaciones?.step as number | undefined ?? 'any'}
        />
      );

    case 'DATE':
      return (
        <input
          type="date"
          value={(value as string) ?? field.valor_defecto ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={inputClasses}
          min={field.validaciones?.min_date as string | undefined}
          max={field.validaciones?.max_date as string | undefined}
        />
      );

    case 'DATETIME':
      return (
        <input
          type="datetime-local"
          value={(value as string) ?? field.valor_defecto ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={inputClasses}
        />
      );

    case 'SELECT':
      return (
        <select
          value={(value as string) ?? field.valor_defecto ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={inputClasses}
        >
          <option value="">{field.placeholder || 'Seleccione...'}</option>
          {field.opciones?.map((opt) => (
            <option key={opt.valor} value={opt.valor}>
              {opt.etiqueta}
            </option>
          ))}
        </select>
      );

    case 'MULTISELECT':
      return (
        <MultiSelectField
          field={field}
          value={value as string[] | null}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case 'RADIO':
      return (
        <div className="space-y-2">
          {field.opciones?.map((opt) => (
            <label
              key={opt.valor}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name={`field-${field.id}`}
                value={opt.valor}
                checked={(value as string) === opt.valor}
                onChange={() => onChange(opt.valor)}
                disabled={readOnly}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.etiqueta}</span>
            </label>
          ))}
        </div>
      );

    case 'CHECKBOX':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {field.placeholder || field.etiqueta}
          </span>
        </label>
      );

    case 'FILE':
      return (
        <FileField
          field={field}
          value={value as File | null}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case 'SIGNATURE':
      return (
        <SignatureField
          value={value as string | null}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={readOnly}
          className={inputClasses}
        />
      );
  }
};

// ============================================================
// MULTISELECT FIELD
// ============================================================

interface MultiSelectFieldProps {
  field: DynamicFieldDefinition;
  value: string[] | null;
  onChange: (value: string[]) => void;
  readOnly: boolean;
}

const MultiSelectField = ({ field, value, onChange, readOnly }: MultiSelectFieldProps) => {
  const selected = value ?? [];

  const toggle = (val: string) => {
    if (readOnly) return;
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className="space-y-1.5">
      {field.opciones?.map((opt) => (
        <label
          key={opt.valor}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.valor)}
            onChange={() => toggle(opt.valor)}
            disabled={readOnly}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.etiqueta}</span>
        </label>
      ))}
    </div>
  );
};

// ============================================================
// FILE FIELD
// ============================================================

interface FileFieldProps {
  field: DynamicFieldDefinition;
  value: File | null;
  onChange: (value: File | null) => void;
  readOnly: boolean;
}

const FileField = ({ field, value, onChange, readOnly }: FileFieldProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        disabled={readOnly}
        className="hidden"
      />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={readOnly}
          type="button"
        >
          <Upload className="h-4 w-4 mr-1" />
          Seleccionar archivo
        </Button>
        {value && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="truncate max-w-[200px]">
              {value instanceof File ? value.name : 'Archivo adjunto'}
            </span>
            {!readOnly && (
              <button onClick={() => onChange(null)} className="text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// SIGNATURE FIELD (canvas basico)
// ============================================================

interface SignatureFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  readOnly: boolean;
}

const SignatureField = ({ value, onChange, readOnly }: SignatureFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, [readOnly]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }, [isDrawing, readOnly]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  }, [isDrawing, onChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  }, [onChange]);

  // Si hay valor previo (base64), mostrar imagen
  if (value && readOnly) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800">
        <img src={value} alt="Firma" className="max-h-[120px] mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full cursor-crosshair rounded-lg"
          style={{ touchAction: 'none' }}
        />
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500 text-sm flex items-center gap-1">
              <Pen className="h-4 w-4" />
              Firme aqui
            </span>
          </div>
        )}
      </div>
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={clearSignature} type="button">
          <X className="h-3.5 w-3.5 mr-1" />
          Limpiar firma
        </Button>
      )}
    </div>
  );
};

// ============================================================
// VALIDADOR DE FORMULARIO
// ============================================================

export function validateDynamicForm(
  fields: DynamicFieldDefinition[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = values[field.nombre];

    // Requerido
    if (field.requerido) {
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        errors[field.nombre] = `${field.etiqueta} es obligatorio`;
        continue;
      }
    }

    if (value == null || value === '') continue;

    const v = field.validaciones;
    if (!v) continue;

    // Validaciones de texto
    if ((field.tipo === 'TEXT' || field.tipo === 'TEXTAREA') && typeof value === 'string') {
      if (v.min_length && value.length < (v.min_length as number)) {
        errors[field.nombre] = `Minimo ${v.min_length} caracteres`;
      }
      if (v.max_length && value.length > (v.max_length as number)) {
        errors[field.nombre] = `Maximo ${v.max_length} caracteres`;
      }
      if (v.pattern && !new RegExp(v.pattern as string).test(value)) {
        errors[field.nombre] = `Formato invalido`;
      }
    }

    // Validaciones de numero
    if (field.tipo === 'NUMBER' && typeof value === 'number') {
      if (v.min != null && value < (v.min as number)) {
        errors[field.nombre] = `Minimo ${v.min}`;
      }
      if (v.max != null && value > (v.max as number)) {
        errors[field.nombre] = `Maximo ${v.max}`;
      }
    }

    // Validacion de firma
    if (field.tipo === 'SIGNATURE' && field.requerido && !value) {
      errors[field.nombre] = 'La firma es obligatoria';
    }
  }

  return errors;
}

export default DynamicFormRenderer;
