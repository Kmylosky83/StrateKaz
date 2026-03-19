/* eslint-disable react-refresh/only-export-components */
/**
 * DynamicFormRenderer - Renderiza formularios dinamicos desde CampoFormulario del backend
 *
 * Soporta los 16 tipos de campo del backend:
 * TEXT, TEXTAREA, NUMBER, EMAIL, PHONE, URL, DATE, DATETIME,
 * SELECT, MULTISELECT, RADIO, CHECKBOX, FILE, SIGNATURE, TABLA, SECCION
 *
 * Usado por:
 * - Workflow Engine (tareas con formulario)
 * - Gestion Documental (plantillas tipo FORMULARIO)
 * - Inspecciones de seguridad
 * - Cualquier modulo que use el FormBuilder del backend
 */
import { useState, useRef, useCallback } from 'react';
import { AlertCircle, Upload, X, Pen, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

// ============================================================
// TIPOS
// ============================================================

export interface ColumnaTabla {
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: string;
  ancho?: number;
  es_obligatorio?: boolean;
  opciones?: Array<{ value: string; label: string }>;
}

export interface CondicionVisibilidadField {
  campo_dependiente?: string;
  operador?: 'igual' | 'diferente' | 'contiene' | 'mayor_que' | 'menor_que';
  valor?: unknown;
}

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
  columnas_tabla?: ColumnaTabla[];
  ancho_columna?: number;
  condicion_visible?: CondicionVisibilidadField;
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
  /** Usar grid layout 12 columnas (respeta ancho_columna de cada campo) */
  useGridLayout?: boolean;
}

// ============================================================
// VISIBILIDAD CONDICIONAL
// ============================================================

function evaluateVisibility(
  condicion: CondicionVisibilidadField | undefined,
  values: Record<string, unknown>
): boolean {
  if (!condicion?.campo_dependiente || !condicion.operador) return true;

  const dependentValue = values[condicion.campo_dependiente];
  const expectedValue = condicion.valor;

  switch (condicion.operador) {
    case 'igual':
      return String(dependentValue ?? '') === String(expectedValue ?? '');
    case 'diferente':
      return String(dependentValue ?? '') !== String(expectedValue ?? '');
    case 'contiene':
      return String(dependentValue ?? '')
        .toLowerCase()
        .includes(String(expectedValue ?? '').toLowerCase());
    case 'mayor_que':
      return Number(dependentValue) > Number(expectedValue);
    case 'menor_que':
      return Number(dependentValue) < Number(expectedValue);
    default:
      return true;
  }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const COL_SPAN_MAP: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

export const DynamicFormRenderer = ({
  fields,
  values,
  onChange,
  errors = {},
  readOnly = false,
  className = '',
  useGridLayout = false,
}: DynamicFormRendererProps) => {
  const sortedFields = [...fields].sort((a, b) => a.orden - b.orden);

  return (
    <div className={cn(useGridLayout ? 'grid grid-cols-12 gap-4' : 'space-y-4', className)}>
      {sortedFields.map((field) => {
        // Conditional visibility — hide field if condition not met
        if (!evaluateVisibility(field.condicion_visible, values)) {
          return null;
        }

        const spanClass = useGridLayout
          ? COL_SPAN_MAP[field.tipo === 'SECCION' ? 12 : field.ancho_columna || 12]
          : '';

        return (
          <div key={field.id} className={spanClass}>
            <DynamicField
              field={field}
              value={values[field.nombre]}
              onChange={(value) => onChange(field.nombre, value)}
              error={errors[field.nombre]}
              readOnly={readOnly}
            />
          </div>
        );
      })}
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
  // SECCION is a visual separator, not an input field
  if (field.tipo === 'SECCION') {
    return (
      <div className="pt-4 pb-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
          {field.etiqueta}
        </h3>
        {field.ayuda && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{field.ayuda}</p>
        )}
      </div>
    );
  }

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
      <FieldRenderer field={field} value={value} onChange={onChange} readOnly={readOnly} />

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
    case 'PHONE':
    case 'URL':
      return (
        <input
          type={
            field.tipo === 'EMAIL'
              ? 'email'
              : field.tipo === 'PHONE'
                ? 'tel'
                : field.tipo === 'URL'
                  ? 'url'
                  : 'text'
          }
          value={(value as string) ?? field.valor_defecto ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            field.placeholder ||
            (field.tipo === 'PHONE' ? '+57 300 123 4567' : field.tipo === 'URL' ? 'https://' : '')
          }
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
          value={value != null ? String(value) : (field.valor_defecto ?? '')}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={field.placeholder}
          disabled={readOnly}
          className={inputClasses}
          min={field.validaciones?.min as number | undefined}
          max={field.validaciones?.max as number | undefined}
          step={(field.validaciones?.step as number | undefined) ?? 'any'}
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
            <label key={opt.valor} className="flex items-center gap-2 cursor-pointer">
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
        <SignatureField value={value as string | null} onChange={onChange} readOnly={readOnly} />
      );

    case 'TABLA':
      return (
        <TablaField
          field={field}
          value={value as Record<string, unknown>[] | null}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case 'SECCION':
      return null; // Handled in DynamicField

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
        <label key={opt.valor} className="flex items-center gap-2 cursor-pointer">
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

  const getPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      setIsDrawing(true);
      const pos = getPosition(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    [readOnly, getPosition]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || readOnly) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pos = getPosition(e, canvas);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1f2937';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, readOnly, getPosition]
  );

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
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
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
// TABLA FIELD (dynamic table with add/remove rows)
// ============================================================

interface TablaFieldProps {
  field: DynamicFieldDefinition;
  value: Record<string, unknown>[] | null;
  onChange: (value: Record<string, unknown>[]) => void;
  readOnly: boolean;
}

const TablaField = ({ field, value, onChange, readOnly }: TablaFieldProps) => {
  const rows = value ?? [];
  const columnas = field.columnas_tabla ?? [];

  if (columnas.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Sin columnas definidas</p>;
  }

  const addRow = () => {
    const emptyRow: Record<string, unknown> = {};
    for (const col of columnas) {
      emptyRow[col.nombre_campo] = col.tipo_campo === 'CHECKBOX' ? false : '';
    }
    onChange([...rows, emptyRow]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateCell = (rowIndex: number, colName: string, cellValue: unknown) => {
    const updated = [...rows];
    updated[rowIndex] = { ...updated[rowIndex], [colName]: cellValue };
    onChange(updated);
  };

  const cellInputClasses =
    'w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-purple-500 rounded';

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {columnas.map((col) => (
                <th
                  key={col.nombre_campo}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap"
                >
                  {col.etiqueta}
                  {col.es_obligatorio && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnas.length + (readOnly ? 0 : 1)}
                  className="px-3 py-4 text-center text-gray-400 dark:text-gray-500"
                >
                  Sin registros
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  {columnas.map((col) => (
                    <td key={col.nombre_campo} className="px-1 py-1">
                      {col.tipo_campo === 'CHECKBOX' ? (
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={Boolean(row[col.nombre_campo])}
                            onChange={(e) => updateCell(rowIdx, col.nombre_campo, e.target.checked)}
                            disabled={readOnly}
                            className="h-4 w-4 text-purple-600 rounded"
                          />
                        </div>
                      ) : col.tipo_campo === 'SELECT' && col.opciones ? (
                        <select
                          value={(row[col.nombre_campo] as string) ?? ''}
                          onChange={(e) => updateCell(rowIdx, col.nombre_campo, e.target.value)}
                          disabled={readOnly}
                          className={cellInputClasses}
                        >
                          <option value="">-</option>
                          {col.opciones.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            col.tipo_campo === 'NUMBER'
                              ? 'number'
                              : col.tipo_campo === 'DATE'
                                ? 'date'
                                : 'text'
                          }
                          value={(row[col.nombre_campo] as string) ?? ''}
                          onChange={(e) =>
                            updateCell(
                              rowIdx,
                              col.nombre_campo,
                              col.tipo_campo === 'NUMBER'
                                ? e.target.value
                                  ? Number(e.target.value)
                                  : ''
                                : e.target.value
                            )
                          }
                          disabled={readOnly}
                          className={cellInputClasses}
                        />
                      )}
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-1 py-1">
                      <button
                        type="button"
                        onClick={() => removeRow(rowIdx)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar fila
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// VALIDADOR DE FORMULARIO
// ============================================================

const VALIDATION_PATTERNS: Record<string, { pattern: RegExp; message: string }> = {
  EMAIL: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato de email inválido' },
  PHONE: { pattern: /^\+?[0-9]{7,15}$/, message: 'Formato de teléfono inválido' },
  URL: {
    pattern: /^https?:\/\/.+/,
    message: 'Formato de URL inválido (debe iniciar con http:// o https://)',
  },
};

export function validateDynamicForm(
  fields: DynamicFieldDefinition[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (field.tipo === 'SECCION') continue;

    // Skip hidden fields — don't validate what the user can't see
    if (!evaluateVisibility(field.condicion_visible, values)) continue;

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

    // Validaciones de texto
    if (
      ['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL'].includes(field.tipo) &&
      typeof value === 'string'
    ) {
      if (v?.min_length && value.length < (v.min_length as number)) {
        errors[field.nombre] = `Mínimo ${v.min_length} caracteres`;
      }
      if (v?.max_length && value.length > (v.max_length as number)) {
        errors[field.nombre] = `Máximo ${v.max_length} caracteres`;
      }
      if (v?.pattern && !new RegExp(v.pattern as string).test(value)) {
        errors[field.nombre] = 'Formato inválido';
      }

      // Built-in format validation for EMAIL, PHONE, URL
      const builtIn = VALIDATION_PATTERNS[field.tipo];
      if (builtIn && !builtIn.pattern.test(value)) {
        errors[field.nombre] = builtIn.message;
      }
    }

    // Validaciones de numero
    if (field.tipo === 'NUMBER' && typeof value === 'number') {
      if (v?.min != null && value < (v.min as number)) {
        errors[field.nombre] = `Mínimo ${v.min}`;
      }
      if (v?.max != null && value > (v.max as number)) {
        errors[field.nombre] = `Máximo ${v.max}`;
      }
    }

    // Validacion de firma
    if (field.tipo === 'SIGNATURE' && field.requerido && !value) {
      errors[field.nombre] = 'La firma es obligatoria';
    }

    // Validacion de tabla
    if (field.tipo === 'TABLA' && field.requerido && Array.isArray(value) && value.length === 0) {
      errors[field.nombre] = 'Debe agregar al menos una fila';
    }
  }

  return errors;
}

export default DynamicFormRenderer;
