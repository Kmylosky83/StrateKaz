/**
 * Tokens Semánticos para Gestión Estratégica
 *
 * Mapea conceptos de negocio a tokens del Design System (tailwind.config.js).
 * NUNCA usar clases hardcoded - siempre referenciar tokens base.
 *
 * Design System tokens base:
 * - primary, secondary, accent (dinámicos desde branding)
 * - success, warning, danger, info (estados)
 * - gray (neutral)
 */

import type { BadgeVariant } from '@/components/common';

// ============================================================================
// PERSPECTIVAS BSC (Balanced Scorecard)
// ============================================================================

/**
 * Configuración de perspectiva BSC.
 * Usa tokens del Design System para consistencia.
 */
export interface BSCPerspectiveConfig {
  /** Identificador de la perspectiva */
  key: string;
  /** Label corto para UI compacta */
  shortLabel: string;
  /** Label completo */
  label: string;
  /** Icono de Lucide React */
  icon: string;
  /** Token de color del Design System */
  colorToken: 'success' | 'info' | 'warning' | 'accent';
  /** Orden de visualización */
  order: number;
}

/**
 * Configuración de las 4 perspectivas BSC según Kaplan & Norton
 */
export const BSC_PERSPECTIVES: Record<string, BSCPerspectiveConfig> = {
  FINANCIERA: {
    key: 'FINANCIERA',
    shortLabel: 'Financiera',
    label: 'Perspectiva Financiera',
    icon: 'DollarSign',
    colorToken: 'success',
    order: 1,
  },
  CLIENTES: {
    key: 'CLIENTES',
    shortLabel: 'Clientes',
    label: 'Perspectiva del Cliente',
    icon: 'Users',
    colorToken: 'info',
    order: 2,
  },
  PROCESOS: {
    key: 'PROCESOS',
    shortLabel: 'Procesos',
    label: 'Procesos Internos',
    icon: 'Cog',
    colorToken: 'warning',
    order: 3,
  },
  APRENDIZAJE: {
    key: 'APRENDIZAJE',
    shortLabel: 'Aprendizaje',
    label: 'Aprendizaje y Crecimiento',
    icon: 'GraduationCap',
    colorToken: 'accent',
    order: 4,
  },
};

/**
 * Obtener configuración de perspectiva BSC
 */
export const getBSCPerspective = (key: string): BSCPerspectiveConfig => {
  return BSC_PERSPECTIVES[key] || BSC_PERSPECTIVES.APRENDIZAJE;
};

/**
 * Lista ordenada de perspectivas BSC para iteración
 */
export const BSC_PERSPECTIVES_LIST = Object.values(BSC_PERSPECTIVES).sort(
  (a, b) => a.order - b.order
);

// ============================================================================
// ESTADOS DE SEMÁFORO (KPIs)
// ============================================================================

export interface SemaforoConfig {
  key: string;
  label: string;
  /** Token del Design System para Badge */
  badgeVariant: BadgeVariant;
  /** Icono de Lucide React */
  icon: string;
}

export const SEMAFORO_STATUS: Record<string, SemaforoConfig> = {
  VERDE: {
    key: 'VERDE',
    label: 'En Meta',
    badgeVariant: 'success',
    icon: 'CheckCircle',
  },
  AMARILLO: {
    key: 'AMARILLO',
    label: 'Precaución',
    badgeVariant: 'warning',
    icon: 'AlertTriangle',
  },
  ROJO: {
    key: 'ROJO',
    label: 'Crítico',
    badgeVariant: 'danger',
    icon: 'XCircle',
  },
  SIN_DATOS: {
    key: 'SIN_DATOS',
    label: 'Sin Datos',
    badgeVariant: 'gray',
    icon: 'MinusCircle',
  },
};

export const getSemaforoConfig = (status: string): SemaforoConfig => {
  return SEMAFORO_STATUS[status] || SEMAFORO_STATUS.SIN_DATOS;
};

// ============================================================================
// ESTADOS DE OBJETIVOS
// ============================================================================

export interface ObjectiveStatusConfig {
  key: string;
  label: string;
  badgeVariant: BadgeVariant;
  icon: string;
}

export const OBJECTIVE_STATUS: Record<string, ObjectiveStatusConfig> = {
  PENDIENTE: {
    key: 'PENDIENTE',
    label: 'Pendiente',
    badgeVariant: 'gray',
    icon: 'Clock',
  },
  EN_PROGRESO: {
    key: 'EN_PROGRESO',
    label: 'En Progreso',
    badgeVariant: 'info',
    icon: 'PlayCircle',
  },
  COMPLETADO: {
    key: 'COMPLETADO',
    label: 'Completado',
    badgeVariant: 'success',
    icon: 'CheckCircle',
  },
  CANCELADO: {
    key: 'CANCELADO',
    label: 'Cancelado',
    badgeVariant: 'danger',
    icon: 'XCircle',
  },
  RETRASADO: {
    key: 'RETRASADO',
    label: 'Retrasado',
    badgeVariant: 'warning',
    icon: 'AlertTriangle',
  },
};

export const getObjectiveStatusConfig = (status: string): ObjectiveStatusConfig => {
  return OBJECTIVE_STATUS[status] || OBJECTIVE_STATUS.PENDIENTE;
};

// ============================================================================
// PRIORIDADES
// ============================================================================

export interface PriorityConfig {
  key: string;
  label: string;
  badgeVariant: BadgeVariant;
  icon: string;
  order: number;
}

export const PRIORITIES: Record<string, PriorityConfig> = {
  BAJA: {
    key: 'BAJA',
    label: 'Baja',
    badgeVariant: 'gray',
    icon: 'ArrowDown',
    order: 1,
  },
  MEDIA: {
    key: 'MEDIA',
    label: 'Media',
    badgeVariant: 'info',
    icon: 'Minus',
    order: 2,
  },
  ALTA: {
    key: 'ALTA',
    label: 'Alta',
    badgeVariant: 'warning',
    icon: 'ArrowUp',
    order: 3,
  },
  CRITICA: {
    key: 'CRITICA',
    label: 'Crítica',
    badgeVariant: 'danger',
    icon: 'AlertOctagon',
    order: 4,
  },
};

export const getPriorityConfig = (priority: string): PriorityConfig => {
  return PRIORITIES[priority] || PRIORITIES.MEDIA;
};

// ============================================================================
// ESTADOS DE GESTIÓN DEL CAMBIO
// ============================================================================

export interface ChangeStatusConfig {
  key: string;
  label: string;
  badgeVariant: BadgeVariant;
  icon: string;
  order: number;
}

export const CHANGE_STATUS: Record<string, ChangeStatusConfig> = {
  IDENTIFICADO: {
    key: 'IDENTIFICADO',
    label: 'Identificado',
    badgeVariant: 'gray',
    icon: 'FileSearch',
    order: 1,
  },
  ANALISIS: {
    key: 'ANALISIS',
    label: 'En Análisis',
    badgeVariant: 'info',
    icon: 'Search',
    order: 2,
  },
  PLANIFICADO: {
    key: 'PLANIFICADO',
    label: 'Planificado',
    badgeVariant: 'info',
    icon: 'Calendar',
    order: 3,
  },
  EN_EJECUCION: {
    key: 'EN_EJECUCION',
    label: 'En Ejecución',
    badgeVariant: 'warning',
    icon: 'PlayCircle',
    order: 4,
  },
  COMPLETADO: {
    key: 'COMPLETADO',
    label: 'Completado',
    badgeVariant: 'success',
    icon: 'CheckCircle',
    order: 5,
  },
  CANCELADO: {
    key: 'CANCELADO',
    label: 'Cancelado',
    badgeVariant: 'danger',
    icon: 'XCircle',
    order: 6,
  },
};

export const getChangeStatusConfig = (status: string): ChangeStatusConfig => {
  return CHANGE_STATUS[status] || CHANGE_STATUS.IDENTIFICADO;
};

// ============================================================================
// TIPOS DOFA
// ============================================================================

export interface DOFATypeConfig {
  key: string;
  label: string;
  badgeVariant: BadgeVariant;
  icon: string;
  category: 'interno' | 'externo';
}

export const DOFA_TYPES: Record<string, DOFATypeConfig> = {
  FORTALEZA: {
    key: 'FORTALEZA',
    label: 'Fortaleza',
    badgeVariant: 'success',
    icon: 'Shield',
    category: 'interno',
  },
  DEBILIDAD: {
    key: 'DEBILIDAD',
    label: 'Debilidad',
    badgeVariant: 'danger',
    icon: 'AlertTriangle',
    category: 'interno',
  },
  OPORTUNIDAD: {
    key: 'OPORTUNIDAD',
    label: 'Oportunidad',
    badgeVariant: 'info',
    icon: 'TrendingUp',
    category: 'externo',
  },
  AMENAZA: {
    key: 'AMENAZA',
    label: 'Amenaza',
    badgeVariant: 'warning',
    icon: 'AlertOctagon',
    category: 'externo',
  },
};

export const getDOFATypeConfig = (type: string): DOFATypeConfig => {
  return DOFA_TYPES[type] || DOFA_TYPES.FORTALEZA;
};

// ============================================================================
// ESTADOS DE REVISIÓN POR LA DIRECCIÓN
// ============================================================================

export const REVISION_STATUS: Record<string, ObjectiveStatusConfig> = {
  PROGRAMADA: {
    key: 'PROGRAMADA',
    label: 'Programada',
    badgeVariant: 'gray',
    icon: 'Calendar',
  },
  EN_CURSO: {
    key: 'EN_CURSO',
    label: 'En Curso',
    badgeVariant: 'info',
    icon: 'PlayCircle',
  },
  COMPLETADA: {
    key: 'COMPLETADA',
    label: 'Completada',
    badgeVariant: 'success',
    icon: 'CheckCircle',
  },
  CANCELADA: {
    key: 'CANCELADA',
    label: 'Cancelada',
    badgeVariant: 'danger',
    icon: 'XCircle',
  },
};

export const getRevisionStatusConfig = (status: string): ObjectiveStatusConfig => {
  return REVISION_STATUS[status] || REVISION_STATUS.PROGRAMADA;
};
