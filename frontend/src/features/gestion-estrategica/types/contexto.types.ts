/**
 * Types para Contexto Organizacional
 *
 * Incluye:
 * - Analisis DOFA (Debilidades, Oportunidades, Fortalezas, Amenazas)
 * - Analisis PESTEL (Politico, Economico, Social, Tecnologico, Ecologico, Legal)
 * - 5 Fuerzas de Porter
 * - Estrategias TOWS (matriz cruzada)
 * - Partes Interesadas (Stakeholders - ISO 9001:2015 Cláusula 4.2)
 *
 * Backend: apps/gestion_estrategica/contexto/
 */

// ============================================================================
// ENUMS
// ============================================================================

export type EstadoAnalisis =
  | 'borrador'
  | 'en_revision'
  | 'aprobado'
  | 'vigente'
  | 'archivado';

export type TipoFactorDOFA =
  | 'fortaleza'
  | 'oportunidad'
  | 'debilidad'
  | 'amenaza';

export type TipoFactorPESTEL =
  | 'politico'
  | 'economico'
  | 'social'
  | 'tecnologico'
  | 'ecologico'
  | 'legal';

export type TipoFuerzaPorter =
  | 'rivalidad'
  | 'nuevos_entrantes'
  | 'sustitutos'
  | 'poder_proveedores'
  | 'poder_clientes';

export type TipoEstrategiaTOWS = 'fo' | 'fa' | 'do' | 'da';

export type NivelImpacto = 'alto' | 'medio' | 'bajo';

export type TendenciaFactor = 'mejorando' | 'estable' | 'empeorando';

export type EstadoEstrategia =
  | 'propuesta'
  | 'aprobada'
  | 'en_ejecucion'
  | 'completada'
  | 'cancelada'
  | 'suspendida';

export type Prioridad = 'alta' | 'media' | 'baja';

// ============================================================================
// CATÁLOGOS GLOBALES
// ============================================================================

/**
 * Tipo de Análisis DOFA (catálogo global)
 * Ej: Organizacional, Anual, Por Área, Por Proyecto, Pre-Auditoría
 */
export interface TipoAnalisisDOFA {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo de Análisis PESTEL (catálogo global)
 * Ej: Macro-Entorno, Sectorial, Por País, Pre-Expansión
 */
export interface TipoAnalisisPESTEL {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DOFA
// ============================================================================

export interface AnalisisDOFA {
  id: number;
  // Tipo de análisis (FK a catálogo global)
  tipo_analisis: number | null;
  tipo_analisis_nombre?: string;
  tipo_analisis_codigo?: string;
  tipo_analisis_icono?: string;
  tipo_analisis_color?: string;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable: number | null;
  responsable_nombre?: string;
  estado: EstadoAnalisis;
  estado_display?: string;
  observaciones: string;
  aprobado_por: number | null;
  aprobado_por_nombre?: string;
  fecha_aprobacion: string | null;
  // Estadisticas
  total_factores?: number;
  total_fortalezas?: number;
  total_debilidades?: number;
  total_oportunidades?: number;
  total_amenazas?: number;
  total_estrategias?: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface FactorDOFA {
  id: number;
  analisis: number;
  tipo: TipoFactorDOFA;
  tipo_display?: string;
  descripcion: string;
  area_afectada: string;
  // Nueva relación con Area (mejorada)
  area?: {
    id: number;
    codigo: string;
    nombre: string;
    nivel: number;
  } | null;
  area_id?: number | null;
  impacto: NivelImpacto;
  impacto_display?: string;
  evidencias: string;
  fuente: string;
  votos_fortaleza: number;
  votos_debilidad: number;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAnalisisDOFADTO {
  tipo_analisis?: number;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable?: number;
  observaciones?: string;
}

export interface UpdateAnalisisDOFADTO extends Partial<CreateAnalisisDOFADTO> {
  estado?: EstadoAnalisis;
}

export interface AnalisisDOFAFiltersExtended {
  tipo_analisis?: number;
  estado?: EstadoAnalisis;
  periodo?: string;
  responsable?: number;
  search?: string;
}

export interface CreateFactorDOFADTO {
  analisis: number;
  tipo: TipoFactorDOFA;
  descripcion: string;
  area_afectada?: string;
  area?: number;
  impacto: NivelImpacto;
  evidencias?: string;
}

export interface UpdateFactorDOFADTO extends Partial<CreateFactorDOFADTO> {
  orden?: number;
}

// ============================================================================
// PESTEL
// ============================================================================

export interface AnalisisPESTEL {
  id: number;
  // Tipo de análisis (FK a catálogo global)
  tipo_analisis: number | null;
  tipo_analisis_nombre?: string;
  tipo_analisis_codigo?: string;
  tipo_analisis_icono?: string;
  tipo_analisis_color?: string;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable: number | null;
  responsable_nombre?: string;
  estado: EstadoAnalisis;
  estado_display?: string;
  conclusiones: string;
  // Estadisticas
  total_factores?: number;
  factores_por_tipo?: Record<TipoFactorPESTEL, number>;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface FactorPESTEL {
  id: number;
  analisis: number;
  tipo: TipoFactorPESTEL;
  tipo_display?: string;
  descripcion: string;
  tendencia: TendenciaFactor;
  tendencia_display?: string;
  impacto: NivelImpacto;
  impacto_display?: string;
  probabilidad: NivelImpacto;
  probabilidad_display?: string;
  implicaciones: string;
  fuentes: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAnalisisPESTELDTO {
  tipo_analisis?: number;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable?: number;
  conclusiones?: string;
}

export interface UpdateAnalisisPESTELDTO extends Partial<CreateAnalisisPESTELDTO> {
  estado?: EstadoAnalisis;
}

export interface CreateFactorPESTELDTO {
  analisis: number;
  tipo: TipoFactorPESTEL;
  descripcion: string;
  tendencia: TendenciaFactor;
  impacto: NivelImpacto;
  probabilidad: NivelImpacto;
  implicaciones?: string;
  fuentes?: string;
}

export interface UpdateFactorPESTELDTO extends Partial<CreateFactorPESTELDTO> {
  orden?: number;
}

// ============================================================================
// PORTER
// ============================================================================

export interface FuerzaPorter {
  id: number;
  tipo: TipoFuerzaPorter;
  tipo_display?: string;
  nivel: NivelImpacto;
  nivel_display?: string;
  descripcion: string;
  factores: string[];
  fecha_analisis: string;
  periodo: string;
  implicaciones_estrategicas: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFuerzaPorterDTO {
  tipo: TipoFuerzaPorter;
  nivel: NivelImpacto;
  descripcion: string;
  factores?: string[];
  fecha_analisis: string;
  periodo: string;
  implicaciones_estrategicas?: string;
}

export interface UpdateFuerzaPorterDTO extends Partial<CreateFuerzaPorterDTO> {}

// ============================================================================
// TOWS (Estrategias cruzadas)
// ============================================================================

export interface EstrategiaTOWS {
  id: number;
  analisis: number;
  analisis_nombre?: string;
  tipo: TipoEstrategiaTOWS;
  tipo_display?: string;
  descripcion: string;
  objetivo: string;
  responsable: number | null;
  responsable_nombre?: string;
  // Nueva relación con Area responsable (mejorada)
  area_responsable?: {
    id: number;
    codigo: string;
    nombre: string;
    nivel: number;
  } | null;
  area_responsable_id?: number | null;
  // Vinculación con objetivo estratégico
  objetivo_estrategico: number | null;
  objetivo_estrategico_code?: string | null;
  objetivo_estrategico_name?: string | null;
  fecha_implementacion: string | null;
  fecha_limite: string | null;
  prioridad: Prioridad;
  prioridad_display?: string;
  estado: EstadoEstrategia;
  estado_display?: string;
  recursos_necesarios: string;
  indicadores_exito: string;
  progreso_porcentaje: number;
  dias_restantes?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEstrategiaTOWSDTO {
  analisis: number;
  tipo: TipoEstrategiaTOWS;
  descripcion: string;
  objetivo: string;
  responsable?: number;
  area_responsable?: number;
  fecha_implementacion?: string;
  fecha_limite?: string;
  prioridad?: Prioridad;
  recursos_necesarios?: string;
  indicadores_exito?: string;
}

export interface UpdateEstrategiaTOWSDTO extends Partial<CreateEstrategiaTOWSDTO> {
  estado?: EstadoEstrategia;
  progreso_porcentaje?: number;
  objetivo_estrategico?: number;
}

// ============================================================================
// FILTROS
// ============================================================================

export interface AnalisisDOFAFilters {
  estado?: EstadoAnalisis;
  periodo?: string;
  responsable?: number;
  search?: string;
}

export interface FactorDOFAFilters {
  analisis?: number;
  tipo?: TipoFactorDOFA;
  impacto?: NivelImpacto;
  area?: number;
}

export interface AnalisisPESTELFilters {
  estado?: EstadoAnalisis;
  periodo?: string;
  search?: string;
}

export interface FactorPESTELFilters {
  analisis?: number;
  tipo?: TipoFactorPESTEL;
  impacto?: NivelImpacto;
  tendencia?: TendenciaFactor;
}

export interface FuerzaPorterFilters {
  periodo?: string;
  tipo?: TipoFuerzaPorter;
  nivel?: NivelImpacto;
}

export interface EstrategiaTOWSFilters {
  analisis?: number;
  tipo?: TipoEstrategiaTOWS;
  estado?: EstadoEstrategia;
  prioridad?: Prioridad;
  area_responsable?: number;
}

// ============================================================================
// CONFIGURACION UI
// ============================================================================

export const TIPO_FACTOR_DOFA_CONFIG = {
  fortaleza: {
    label: 'Fortaleza',
    shortLabel: 'F',
    color: 'success',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-500',
  },
  oportunidad: {
    label: 'Oportunidad',
    shortLabel: 'O',
    color: 'info',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-500',
  },
  debilidad: {
    label: 'Debilidad',
    shortLabel: 'D',
    color: 'warning',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-500',
  },
  amenaza: {
    label: 'Amenaza',
    shortLabel: 'A',
    color: 'danger',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500',
  },
} as const;

export const TIPO_FACTOR_PESTEL_CONFIG = {
  politico: {
    label: 'Politico',
    shortLabel: 'P',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-400',
  },
  economico: {
    label: 'Economico',
    shortLabel: 'E',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
  },
  social: {
    label: 'Social',
    shortLabel: 'S',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  tecnologico: {
    label: 'Tecnologico',
    shortLabel: 'T',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    textClass: 'text-cyan-700 dark:text-cyan-400',
  },
  ecologico: {
    label: 'Ecologico',
    shortLabel: 'E',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  },
  legal: {
    label: 'Legal',
    shortLabel: 'L',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
} as const;

export const TIPO_ESTRATEGIA_TOWS_CONFIG = {
  fo: {
    label: 'FO - Ofensiva',
    fullLabel: 'Fortalezas-Oportunidades (Ofensiva)',
    description: 'Maximizar Fortalezas aprovechando Oportunidades',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-500',
  },
  fa: {
    label: 'FA - Defensiva',
    fullLabel: 'Fortalezas-Amenazas (Defensiva)',
    description: 'Usar Fortalezas para neutralizar Amenazas',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-500',
  },
  do: {
    label: 'DO - Adaptativa',
    fullLabel: 'Debilidades-Oportunidades (Adaptativa)',
    description: 'Minimizar Debilidades aprovechando Oportunidades',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-500',
  },
  da: {
    label: 'DA - Supervivencia',
    fullLabel: 'Debilidades-Amenazas (Supervivencia)',
    description: 'Minimizar Debilidades y evitar Amenazas',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500',
  },
} as const;

export const ESTADO_ANALISIS_CONFIG = {
  borrador: {
    label: 'Borrador',
    color: 'gray' as const,
    description: 'En preparacion',
  },
  en_revision: {
    label: 'En Revision',
    color: 'warning' as const,
    description: 'Pendiente de aprobacion',
  },
  aprobado: {
    label: 'Aprobado',
    color: 'success' as const,
    description: 'Aprobado por direccion',
  },
  vigente: {
    label: 'Vigente',
    color: 'info' as const,
    description: 'Activo y vigente',
  },
  archivado: {
    label: 'Archivado',
    color: 'gray' as const,
    description: 'Historico',
  },
} as const;

export const NIVEL_IMPACTO_CONFIG = {
  alto: {
    label: 'Alto',
    color: 'danger' as const,
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
  },
  medio: {
    label: 'Medio',
    color: 'warning' as const,
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
  bajo: {
    label: 'Bajo',
    color: 'success' as const,
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
  },
} as const;

export const TENDENCIA_FACTOR_CONFIG = {
  mejorando: {
    label: 'Mejorando',
    color: 'success' as const,
    icon: 'TrendingUp',
  },
  estable: {
    label: 'Estable',
    color: 'gray' as const,
    icon: 'Minus',
  },
  empeorando: {
    label: 'Empeorando',
    color: 'danger' as const,
    icon: 'TrendingDown',
  },
} as const;

export const ESTADO_ESTRATEGIA_CONFIG = {
  propuesta: {
    label: 'Propuesta',
    color: 'gray' as const,
    description: 'Pendiente de aprobacion',
  },
  aprobada: {
    label: 'Aprobada',
    color: 'info' as const,
    description: 'Lista para ejecucion',
  },
  en_ejecucion: {
    label: 'En Ejecucion',
    color: 'warning' as const,
    description: 'Implementandose',
  },
  completada: {
    label: 'Completada',
    color: 'success' as const,
    description: 'Finalizada exitosamente',
  },
  cancelada: {
    label: 'Cancelada',
    color: 'danger' as const,
    description: 'Descartada',
  },
  suspendida: {
    label: 'Suspendida',
    color: 'gray' as const,
    description: 'Pausada temporalmente',
  },
} as const;

export const PRIORIDAD_CONFIG = {
  alta: {
    label: 'Alta',
    color: 'danger' as const,
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
  },
  media: {
    label: 'Media',
    color: 'warning' as const,
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
  baja: {
    label: 'Baja',
    color: 'success' as const,
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
  },
} as const;

export const TIPO_FUERZA_PORTER_CONFIG = {
  rivalidad: {
    label: 'Rivalidad Competitiva',
    shortLabel: 'Rivalidad',
    description: 'Intensidad de la competencia entre empresas existentes',
    icon: 'Swords',
  },
  nuevos_entrantes: {
    label: 'Amenaza de Nuevos Entrantes',
    shortLabel: 'Entrantes',
    description: 'Facilidad de entrada de nuevos competidores',
    icon: 'UserPlus',
  },
  sustitutos: {
    label: 'Amenaza de Sustitutos',
    shortLabel: 'Sustitutos',
    description: 'Riesgo de productos o servicios alternativos',
    icon: 'Repeat',
  },
  poder_proveedores: {
    label: 'Poder de Proveedores',
    shortLabel: 'Proveedores',
    description: 'Capacidad de negociacion de los proveedores',
    icon: 'Truck',
  },
  poder_clientes: {
    label: 'Poder de Clientes',
    shortLabel: 'Clientes',
    description: 'Capacidad de negociacion de los compradores',
    icon: 'Users',
  },
} as const;

// ============================================================================
// 🎯 TIPOS PARA CONVERTIR ESTRATEGIA → OBJETIVO ESTRATÉGICO
// ============================================================================

/**
 * Request para convertir una estrategia TOWS en un objetivo estratégico BSC
 */
export interface ConvertirObjetivoRequest {
  code: string;
  name?: string;
  bsc_perspective: 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE';
  target_value?: number;
  unit?: string;
}

/**
 * Response de la conversión de estrategia TOWS → objetivo estratégico
 */
export interface ConvertirObjetivoResponse {
  message: string;
  objetivo: {
    id: number;
    code: string;
    name: string;
    description: string;
    bsc_perspective: string;
    target_value: number | null;
    unit: string;
    status: string;
    progress: number;
  };
  estrategia: EstrategiaTOWS;
}
