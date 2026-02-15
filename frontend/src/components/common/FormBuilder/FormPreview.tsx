/**
 * FormPreview - Vista previa del formulario con DynamicFormRenderer
 */
import { useState, useMemo, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../Button';
import { DynamicFormRenderer, validateDynamicForm } from '../DynamicFormRenderer';
import type { DynamicFieldDefinition } from '../DynamicFormRenderer';
import type { CampoFormulario } from './types';

interface FormPreviewProps {
  campos: Partial<CampoFormulario>[];
}

/**
 * Convierte CampoFormulario (backend) a DynamicFieldDefinition (renderer).
 * Versión inline simplificada — la versión full está en campoMapper.ts
 */
function campoToField(campo: Partial<CampoFormulario>, index: number): DynamicFieldDefinition {
  return {
    id: campo.id ?? -(index + 1),
    nombre: campo.nombre_campo || `campo_${index}`,
    etiqueta: campo.etiqueta || 'Sin nombre',
    tipo: campo.tipo_campo || 'TEXT',
    orden: campo.orden ?? index,
    requerido: campo.es_obligatorio ?? false,
    valor_defecto: campo.valor_por_defecto || '',
    opciones: campo.opciones?.map((o) => ({ valor: o.value, etiqueta: o.label })) ?? null,
    validaciones: {
      ...(campo.validacion_regex ? { regex: campo.validacion_regex } : {}),
      ...(campo.valor_minimo != null ? { min: campo.valor_minimo } : {}),
      ...(campo.valor_maximo != null ? { max: campo.valor_maximo } : {}),
      ...(campo.longitud_minima != null ? { minLength: campo.longitud_minima } : {}),
      ...(campo.longitud_maxima != null ? { maxLength: campo.longitud_maxima } : {}),
    },
    ayuda: campo.descripcion || '',
    placeholder: campo.placeholder || '',
    columnas_tabla: campo.columnas_tabla,
    ancho_columna: campo.ancho_columna,
    condicion_visible: campo.condicion_visible?.campo_dependiente
      ? {
          campo_dependiente: campo.condicion_visible.campo_dependiente,
          operador: campo.condicion_visible.operador,
          valor: campo.condicion_visible.valor,
        }
      : undefined,
  };
}

export function FormPreview({ campos }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const fields = useMemo(
    () => campos.filter((c) => c.tipo_campo).map((c, i) => campoToField(c, i)),
    [campos]
  );

  const handleChange = useCallback((fieldName: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const errors = useMemo(() => {
    if (Object.keys(values).length === 0) return {};
    return validateDynamicForm(fields, values);
  }, [fields, values]);

  const reset = () => setValues({});

  if (campos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
        <p className="text-sm">Agrega campos para ver la vista previa</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Vista previa
        </p>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw className="w-3 h-3" />}
          onClick={reset}
        >
          Reset
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <DynamicFormRenderer
          fields={fields}
          values={values}
          onChange={handleChange}
          errors={errors}
          useGridLayout
        />
      </div>
    </div>
  );
}
