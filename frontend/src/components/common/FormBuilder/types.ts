/**
 * FormBuilder Types & Metadata
 *
 * Re-exports GD types + constantes para el FormBuilder generico.
 * Los types importados son interfaces puras (no runtime) — sin riesgo de circularidad.
 */
import type {
  TipoCampoFormulario,
  CampoFormulario,
  ColumnaTabla,
  CondicionVisibilidad,
} from '@/features/infraestructura/gestion-documental/types/gestion-documental.types';
import type { LucideIcon } from 'lucide-react';
import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  Clock,
  List,
  ListChecks,
  CircleDot,
  CheckSquare,
  Paperclip,
  Mail,
  Phone,
  Link,
  PenTool,
  Table2,
  SeparatorHorizontal,
  GitMerge,
} from 'lucide-react';

// Re-exports
export type { TipoCampoFormulario, CampoFormulario, ColumnaTabla, CondicionVisibilidad };

// ==================== FIELD TYPE METADATA ====================

export type FieldGroup = 'Texto' | 'Datos' | 'Seleccion' | 'Especial';

export interface FieldTypeMeta {
  label: string;
  icon: LucideIcon;
  group: FieldGroup;
}

export const FIELD_TYPE_METADATA: Record<TipoCampoFormulario, FieldTypeMeta> = {
  TEXT: { label: 'Texto corto', icon: Type, group: 'Texto' },
  TEXTAREA: { label: 'Texto largo', icon: AlignLeft, group: 'Texto' },
  EMAIL: { label: 'Email', icon: Mail, group: 'Texto' },
  PHONE: { label: 'Telefono', icon: Phone, group: 'Texto' },
  URL: { label: 'URL', icon: Link, group: 'Texto' },
  NUMBER: { label: 'Numero', icon: Hash, group: 'Datos' },
  DATE: { label: 'Fecha', icon: Calendar, group: 'Datos' },
  DATETIME: { label: 'Fecha y hora', icon: Clock, group: 'Datos' },
  SELECT: { label: 'Lista desplegable', icon: List, group: 'Seleccion' },
  MULTISELECT: { label: 'Seleccion multiple', icon: ListChecks, group: 'Seleccion' },
  RADIO: { label: 'Opciones unicas', icon: CircleDot, group: 'Seleccion' },
  CHECKBOX: { label: 'Casilla de verificacion', icon: CheckSquare, group: 'Seleccion' },
  FILE: { label: 'Archivo adjunto', icon: Paperclip, group: 'Especial' },
  SIGNATURE: { label: 'Firma', icon: PenTool, group: 'Especial' },
  TABLA: { label: 'Tabla', icon: Table2, group: 'Especial' },
  SECCION: { label: 'Separador / Seccion', icon: SeparatorHorizontal, group: 'Especial' },
  FIRMA_WORKFLOW: { label: 'Flujo de Firmas', icon: GitMerge, group: 'Especial' },
};

export const FIELD_GROUPS: FieldGroup[] = ['Texto', 'Datos', 'Seleccion', 'Especial'];

// ==================== HELPERS ====================

const SLUG_MAP: Record<string, string> = {
  a: 'a',
  e: 'e',
  i: 'i',
  o: 'o',
  u: 'u',
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ñ: 'n',
  ü: 'u',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((c) => SLUG_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Crea un CampoFormulario vacio con defaults para un tipo dado.
 */
export function createEmptyCampo(
  tipo: TipoCampoFormulario,
  orden: number,
  etiqueta?: string
): Partial<CampoFormulario> {
  const label = etiqueta || FIELD_TYPE_METADATA[tipo].label;
  return {
    nombre_campo: slugify(label),
    etiqueta: label,
    tipo_campo: tipo,
    descripcion: '',
    placeholder: '',
    valor_por_defecto: '',
    opciones:
      tipo === 'SELECT' || tipo === 'MULTISELECT' || tipo === 'RADIO' || tipo === 'CHECKBOX'
        ? [{ value: 'opcion_1', label: 'Opcion 1' }]
        : [],
    es_obligatorio: false,
    validacion_regex: '',
    mensaje_validacion: '',
    valor_minimo: null,
    valor_maximo: null,
    longitud_minima: null,
    longitud_maxima: null,
    columnas_tabla:
      tipo === 'TABLA'
        ? [{ nombre_campo: 'columna_1', etiqueta: 'Columna 1', tipo_campo: 'TEXT' }]
        : [],
    orden,
    ancho_columna: tipo === 'SECCION' ? 12 : 12,
    clase_css: '',
    condicion_visible: {} as CondicionVisibilidad,
    config_firmantes:
      tipo === 'FIRMA_WORKFLOW'
        ? [
            { orden: 1, etiqueta: 'Elaborador' },
            { orden: 2, etiqueta: 'Revisor' },
            { orden: 3, etiqueta: 'Aprobador' },
          ]
        : [],
    modo_firma: 'SECUENCIAL',
    nivel_seguridad_firma: tipo === 'FIRMA_WORKFLOW' ? 1 : null,
    is_active: true,
  };
}
