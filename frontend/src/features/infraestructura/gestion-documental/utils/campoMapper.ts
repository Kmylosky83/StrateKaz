/**
 * campoMapper - Convierte CampoFormulario (backend) a DynamicFieldDefinition (renderer)
 *
 * El backend usa una estructura con nombres en español (nombre_campo, etiqueta, etc.)
 * mientras DynamicFormRenderer usa una interface simplificada (nombre, tipo, etc.)
 * Este mapper conecta ambos sin acoplar el renderer al modelo GD.
 */
import type { DynamicFieldDefinition } from '@/components/common/DynamicFormRenderer';
import type { CampoFormulario } from '../types/gestion-documental.types';

/**
 * Convierte un CampoFormulario del backend a DynamicFieldDefinition para el renderer
 */
export function campoToDynamicField(campo: CampoFormulario): DynamicFieldDefinition {
  return {
    id: campo.id,
    nombre: campo.nombre_campo,
    etiqueta: campo.etiqueta,
    tipo: campo.tipo_campo,
    orden: campo.orden,
    requerido: campo.es_obligatorio,
    valor_defecto: campo.valor_por_defecto || '',
    opciones:
      campo.opciones && campo.opciones.length > 0
        ? campo.opciones.map((o) => ({ valor: o.value, etiqueta: o.label }))
        : null,
    validaciones: buildValidaciones(campo),
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

/**
 * Convierte un array de CampoFormulario a DynamicFieldDefinition[]
 * Ordena por `orden` y filtra campos inactivos.
 */
export function camposToDynamicFields(campos: CampoFormulario[]): DynamicFieldDefinition[] {
  return campos
    .filter((c) => c.is_active)
    .sort((a, b) => a.orden - b.orden)
    .map(campoToDynamicField);
}

// ==================== HELPERS ====================

function buildValidaciones(campo: CampoFormulario): Record<string, unknown> | null {
  const v: Record<string, unknown> = {};

  if (campo.validacion_regex) v.regex = campo.validacion_regex;
  if (campo.valor_minimo != null) v.min = campo.valor_minimo;
  if (campo.valor_maximo != null) v.max = campo.valor_maximo;
  if (campo.longitud_minima != null) v.minLength = campo.longitud_minima;
  if (campo.longitud_maxima != null) v.maxLength = campo.longitud_maxima;
  if (campo.mensaje_validacion) v.message = campo.mensaje_validacion;

  return Object.keys(v).length > 0 ? v : null;
}
