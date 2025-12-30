/**
 * Tipos TypeScript para IPEVR - Matriz GTC-45
 * Sistema de Gestion Grasas y Huesos del Norte
 *
 * Incluye:
 * - Clasificacion de Peligros (7 categorias)
 * - Peligros GTC-45 (78 peligros)
 * - Matriz IPEVR con calculo de NP, NR, Aceptabilidad
 * - Controles SST
 */

// ==================== ENUMS Y TIPOS ====================

export type CategoriaGTC45 =
  | 'biologico'
  | 'fisico'
  | 'quimico'
  | 'psicosocial'
  | 'biomecanico'
  | 'seguridad'
  | 'fenomenos';

export type InterpretacionNP = 'muy_alto' | 'alto' | 'medio' | 'bajo';
export type InterpretacionNR = 'I' | 'II' | 'III' | 'IV';
export type Aceptabilidad = 'aceptable' | 'no_aceptable';
export type EstadoMatrizIPEVR = 'borrador' | 'en_revision' | 'aprobada' | 'vigente' | 'obsoleta';
export type TipoControlSST = 'eliminacion' | 'sustitucion' | 'ingenieria' | 'administrativo' | 'epp';
export type EstadoControlSST = 'propuesto' | 'en_implementacion' | 'implementado' | 'verificado' | 'cancelado';
export type EfectividadControl = 'alta' | 'media' | 'baja' | 'no_evaluada';

// ==================== CLASIFICACION DE PELIGROS ====================

export interface ClasificacionPeligro {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaGTC45;
  categoria_display?: string;
  descripcion: string;
  color: string;
  icono: string;
  orden: number;
  total_peligros?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== PELIGROS GTC-45 ====================

export interface PeligroGTC45 {
  id: number;
  clasificacion: number;
  clasificacion_nombre?: string;
  clasificacion_categoria?: CategoriaGTC45;
  clasificacion_color?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  efectos_posibles: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== MATRIZ IPEVR ====================

export interface MatrizIPEVR {
  id: number;

  // Identificacion
  area: string;
  cargo: string;
  proceso: string;
  actividad: string;
  tarea: string;
  rutinaria: boolean;

  // Peligro
  peligro: number;
  peligro_nombre?: string;
  peligro_clasificacion?: string;
  peligro_categoria?: CategoriaGTC45;
  peligro_detail?: PeligroGTC45;
  fuente: string;
  medio: string;
  trabajador: string;
  efectos: string;

  // Controles existentes
  control_fuente: string;
  control_medio: string;
  control_individuo: string;

  // Evaluacion GTC-45
  nivel_deficiencia: number; // 0, 2, 6, 10
  nivel_exposicion: number; // 1, 2, 3, 4
  nivel_consecuencia: number; // 10, 25, 60, 100

  // Campos calculados (properties en backend)
  nivel_probabilidad: number; // ND x NE
  interpretacion_np: InterpretacionNP;
  nivel_riesgo: number; // NP x NC
  interpretacion_nr: InterpretacionNR;
  aceptabilidad: Aceptabilidad;
  significado_aceptabilidad?: string;

  // Numero de expuestos
  num_expuestos: number;

  // Peor consecuencia y requisito legal
  peor_consecuencia: string;
  requisito_legal: string;

  // Medidas de intervencion propuestas
  eliminacion: string;
  sustitucion: string;
  controles_ingenieria: string;
  controles_administrativos: string;
  epp: string;

  // Responsable y fechas
  responsable: number | null;
  responsable_nombre?: string;
  fecha_valoracion: string;
  fecha_proxima_revision: string | null;

  // Estado
  estado: EstadoMatrizIPEVR;
  estado_display?: string;

  // Controles SST asociados
  controles_sst?: ControlSST[];

  // Auditoria
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  created_by_nombre?: string;
}

// ==================== CONTROL SST ====================

export interface ControlSST {
  id: number;
  matriz_ipevr: number;
  matriz_area?: string;
  matriz_cargo?: string;
  tipo_control: TipoControlSST;
  tipo_control_display?: string;
  descripcion: string;
  responsable: number | null;
  responsable_nombre?: string;
  fecha_implementacion: string | null;
  estado: EstadoControlSST;
  estado_display?: string;
  efectividad: EfectividadControl;
  efectividad_display?: string;
  evidencia: string | null;
  observaciones: string;
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs ====================

export interface CreateMatrizIPEVRDTO {
  area: string;
  cargo: string;
  proceso: string;
  actividad: string;
  tarea: string;
  rutinaria?: boolean;
  peligro: number;
  fuente: string;
  medio: string;
  trabajador: string;
  efectos: string;
  control_fuente?: string;
  control_medio?: string;
  control_individuo?: string;
  nivel_deficiencia: number;
  nivel_exposicion: number;
  nivel_consecuencia: number;
  num_expuestos?: number;
  peor_consecuencia: string;
  requisito_legal?: string;
  eliminacion?: string;
  sustitucion?: string;
  controles_ingenieria?: string;
  controles_administrativos?: string;
  epp?: string;
  responsable?: number;
  fecha_valoracion: string;
  fecha_proxima_revision?: string;
  estado?: EstadoMatrizIPEVR;
}

export interface UpdateMatrizIPEVRDTO {
  area?: string;
  cargo?: string;
  proceso?: string;
  actividad?: string;
  tarea?: string;
  rutinaria?: boolean;
  peligro?: number;
  fuente?: string;
  medio?: string;
  trabajador?: string;
  efectos?: string;
  control_fuente?: string;
  control_medio?: string;
  control_individuo?: string;
  nivel_deficiencia?: number;
  nivel_exposicion?: number;
  nivel_consecuencia?: number;
  num_expuestos?: number;
  peor_consecuencia?: string;
  requisito_legal?: string;
  eliminacion?: string;
  sustitucion?: string;
  controles_ingenieria?: string;
  controles_administrativos?: string;
  epp?: string;
  responsable?: number;
  fecha_valoracion?: string;
  fecha_proxima_revision?: string;
  estado?: EstadoMatrizIPEVR;
  is_active?: boolean;
}

export interface CreateControlSSTDTO {
  matriz_ipevr: number;
  tipo_control: TipoControlSST;
  descripcion: string;
  responsable?: number;
  fecha_implementacion?: string;
  estado?: EstadoControlSST;
  efectividad?: EfectividadControl;
  evidencia?: string;
  observaciones?: string;
}

export interface UpdateControlSSTDTO {
  tipo_control?: TipoControlSST;
  descripcion?: string;
  responsable?: number;
  fecha_implementacion?: string;
  estado?: EstadoControlSST;
  efectividad?: EfectividadControl;
  evidencia?: string;
  observaciones?: string;
  is_active?: boolean;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ResumenIPEVR {
  total: number;
  vigentes: number;
  borradores: number;
  total_expuestos: number;
  por_estado: Array<{ estado: string; cantidad: number }>;
  por_area: Array<{ area: string; cantidad: number }>;
  por_cargo: Array<{ cargo: string; cantidad: number }>;
}

export interface EstadisticasPorPeligro {
  peligro__clasificacion__categoria: CategoriaGTC45;
  peligro__clasificacion__nombre: string;
  total: number;
}

// ==================== FILTERS ====================

export interface MatrizIPEVRFilters {
  area?: string;
  cargo?: string;
  proceso?: string;
  estado?: EstadoMatrizIPEVR;
  rutinaria?: boolean;
  peligro?: number;
  clasificacion?: number;
  aceptabilidad?: Aceptabilidad;
  empresa?: number;
}

export interface ControlSSTFilters {
  matriz_ipevr?: number;
  tipo_control?: TipoControlSST;
  estado?: EstadoControlSST;
  efectividad?: EfectividadControl;
  empresa?: number;
}

// ==================== LABELS PARA UI ====================

export const CATEGORIA_GTC45_LABELS: Record<CategoriaGTC45, string> = {
  biologico: 'Biologico',
  fisico: 'Fisico',
  quimico: 'Quimico',
  psicosocial: 'Psicosocial',
  biomecanico: 'Biomecanico',
  seguridad: 'Condiciones de Seguridad',
  fenomenos: 'Fenomenos Naturales',
};

export const INTERPRETACION_NP_LABELS: Record<InterpretacionNP, string> = {
  muy_alto: 'Muy Alto (24-40)',
  alto: 'Alto (10-20)',
  medio: 'Medio (6-8)',
  bajo: 'Bajo (2-4)',
};

export const INTERPRETACION_NR_LABELS: Record<InterpretacionNR, string> = {
  I: 'I - Situacion critica',
  II: 'II - Corregir y adoptar medidas',
  III: 'III - Mejorar si es posible',
  IV: 'IV - Mantener medidas',
};

export const ACEPTABILIDAD_LABELS: Record<Aceptabilidad, string> = {
  no_aceptable: 'No Aceptable',
  aceptable: 'Aceptable',
};

export const TIPO_CONTROL_SST_LABELS: Record<TipoControlSST, string> = {
  eliminacion: '1. Eliminacion',
  sustitucion: '2. Sustitucion',
  ingenieria: '3. Control de Ingenieria',
  administrativo: '4. Control Administrativo',
  epp: '5. EPP',
};

export const ESTADO_MATRIZ_LABELS: Record<EstadoMatrizIPEVR, string> = {
  borrador: 'Borrador',
  en_revision: 'En Revision',
  aprobada: 'Aprobada',
  vigente: 'Vigente',
  obsoleta: 'Obsoleta',
};

// ==================== COLORES ====================

export const CATEGORIA_COLORS: Record<CategoriaGTC45, string> = {
  biologico: '#10B981', // green
  fisico: '#3B82F6', // blue
  quimico: '#F59E0B', // amber
  psicosocial: '#8B5CF6', // violet
  biomecanico: '#EC4899', // pink
  seguridad: '#EF4444', // red
  fenomenos: '#6B7280', // gray
};

export const INTERPRETACION_NR_COLORS: Record<InterpretacionNR, string> = {
  I: '#DC2626', // red-600
  II: '#F97316', // orange-500
  III: '#FBBF24', // amber-400
  IV: '#22C55E', // green-500
};

export const ACEPTABILIDAD_COLORS: Record<Aceptabilidad, string> = {
  no_aceptable: '#DC2626', // red-600
  aceptable: '#22C55E', // green-500
};

// ==================== ESCALAS GTC-45 ====================

export const ESCALA_NIVEL_DEFICIENCIA = [
  { valor: 0, etiqueta: 'Sin deficiencia', descripcion: 'No se ha detectado peligro' },
  { valor: 2, etiqueta: 'Medio', descripcion: 'Se han detectado peligros que pueden dar lugar a consecuencias poco significativas' },
  { valor: 6, etiqueta: 'Alto', descripcion: 'Se han detectado algunos peligros que pueden dar lugar a consecuencias significativas' },
  { valor: 10, etiqueta: 'Muy Alto', descripcion: 'Se han detectado peligros que determinan como muy posible la generacion de incidentes' },
];

export const ESCALA_NIVEL_EXPOSICION = [
  { valor: 1, etiqueta: 'Esporadica', descripcion: 'Involucra por tiempos cortos' },
  { valor: 2, etiqueta: 'Ocasional', descripcion: 'Alguna vez durante la jornada laboral' },
  { valor: 3, etiqueta: 'Frecuente', descripcion: 'La situacion de exposicion varias veces durante la jornada' },
  { valor: 4, etiqueta: 'Continua', descripcion: 'La situacion de exposicion se presenta sin interrupcion' },
];

export const ESCALA_NIVEL_CONSECUENCIA = [
  { valor: 10, etiqueta: 'Leve', descripcion: 'Lesiones que no requieren hospitalizacion' },
  { valor: 25, etiqueta: 'Grave', descripcion: 'Lesiones con incapacidad temporal' },
  { valor: 60, etiqueta: 'Muy Grave', descripcion: 'Lesiones graves irreparables' },
  { valor: 100, etiqueta: 'Mortal', descripcion: 'Muerte' },
];

// ==================== HELPERS ====================

export const calcularNivelProbabilidad = (nd: number, ne: number): number => nd * ne;

export const calcularNivelRiesgo = (np: number, nc: number): number => np * nc;

export const interpretarNP = (np: number): InterpretacionNP => {
  if (np >= 24) return 'muy_alto';
  if (np >= 10) return 'alto';
  if (np >= 6) return 'medio';
  return 'bajo';
};

export const interpretarNR = (nr: number): InterpretacionNR => {
  if (nr >= 600) return 'I';
  if (nr >= 150) return 'II';
  if (nr >= 40) return 'III';
  return 'IV';
};

export const determinarAceptabilidad = (interpretacion: InterpretacionNR): Aceptabilidad => {
  return interpretacion === 'I' || interpretacion === 'II' ? 'no_aceptable' : 'aceptable';
};
