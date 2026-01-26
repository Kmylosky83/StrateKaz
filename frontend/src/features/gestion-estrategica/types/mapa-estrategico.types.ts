/**
 * Tipos para el Mapa Estratégico Visual Interactivo
 *
 * Basado en React Flow v12 (@xyflow/react) con layout automático por perspectiva BSC
 * Los nodos son los Objetivos Estratégicos agrupados por perspectiva
 * Las conexiones son las relaciones Causa-Efecto
 */

import { Node, Edge } from '@xyflow/react';
import type { BSCPerspective, ObjectiveStatus } from './strategic.types';

// =============================================================================
// PERSPECTIVAS BSC - Configuración de colores y layout
// =============================================================================

export const BSC_PERSPECTIVE_CONFIG: Record<BSCPerspective, {
  label: string;
  shortLabel: string;
  order: number;
  color: string;
  bgColor: string;
  bgColorLight: string;
  borderColor: string;
  textColor: string;
  darkBgColor: string;
  darkBorderColor: string;
  icon: string;
}> = {
  FINANCIERA: {
    label: 'Perspectiva Financiera',
    shortLabel: 'Financiera',
    order: 1,
    color: 'green',
    bgColor: 'bg-green-500',
    bgColorLight: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    darkBgColor: 'dark:bg-green-900/30',
    darkBorderColor: 'dark:border-green-800',
    icon: 'DollarSign',
  },
  CLIENTES: {
    label: 'Perspectiva de Clientes',
    shortLabel: 'Clientes',
    order: 2,
    color: 'blue',
    bgColor: 'bg-blue-500',
    bgColorLight: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    darkBgColor: 'dark:bg-blue-900/30',
    darkBorderColor: 'dark:border-blue-800',
    icon: 'Users',
  },
  PROCESOS: {
    label: 'Perspectiva de Procesos Internos',
    shortLabel: 'Procesos',
    order: 3,
    color: 'amber',
    bgColor: 'bg-amber-500',
    bgColorLight: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
    darkBgColor: 'dark:bg-amber-900/30',
    darkBorderColor: 'dark:border-amber-800',
    icon: 'Cog',
  },
  APRENDIZAJE: {
    label: 'Perspectiva de Aprendizaje y Crecimiento',
    shortLabel: 'Aprendizaje',
    order: 4,
    color: 'purple',
    bgColor: 'bg-purple-500',
    bgColorLight: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    darkBgColor: 'dark:bg-purple-900/30',
    darkBorderColor: 'dark:border-purple-800',
    icon: 'GraduationCap',
  },
};

// =============================================================================
// CONFIGURACIÓN DE ESTADOS DE OBJETIVOS PARA NODOS
// =============================================================================

export const OBJECTIVE_STATUS_CONFIG: Record<ObjectiveStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  PENDIENTE: {
    label: 'Pendiente',
    color: 'gray',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: 'Clock',
  },
  EN_PROGRESO: {
    label: 'En Progreso',
    color: 'blue',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: 'PlayCircle',
  },
  COMPLETADO: {
    label: 'Completado',
    color: 'green',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: 'CheckCircle',
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'red',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: 'XCircle',
  },
  RETRASADO: {
    label: 'Retrasado',
    color: 'orange',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    icon: 'AlertTriangle',
  },
};

// =============================================================================
// DATOS DEL MAPA ESTRATÉGICO (BACKEND)
// =============================================================================

/** Objetivo simplificado para el mapa */
export interface MapaObjetivo {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  bsc_perspective: BSCPerspective;
  progress: number;
  status: ObjectiveStatus;
  target_value?: number | null;
  current_value?: number | null;
  unit?: string | null;
  normas_iso_detail?: Array<{
    id: number;
    code: string;
    short_name: string;
    icon?: string | null;
    color?: string | null;
  }>;
  responsible_name?: string | null;
  due_date?: string | null;
}

/** Relación Causa-Efecto */
export interface CausaEfecto {
  id: number;
  mapa: number;
  source_objective: number;
  source_objective_code: string;
  source_objective_name: string;
  target_objective: number;
  target_objective_code: string;
  target_objective_name: string;
  description?: string | null;
  weight: number;
}

/** Mapa Estratégico completo */
export interface MapaEstrategico {
  id: number;
  plan: number;
  plan_name: string;
  name: string;
  description?: string | null;
  canvas_data: CanvasData;
  image?: string | null;
  version: string;
  is_active: boolean;
  relaciones: CausaEfecto[];
  relaciones_count: number;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

/** Datos del canvas (posiciones de nodos) */
export interface CanvasData {
  nodes?: Record<string, { x: number; y: number }>;
  viewport?: { x: number; y: number; zoom: number };
  version?: string;
}

/** Respuesta del endpoint de mapa para visualización */
export interface MapaVisualizacionResponse {
  mapa: MapaEstrategico | null;
  objetivos: MapaObjetivo[];
  relaciones: CausaEfecto[];
  stats: {
    total_objetivos: number;
    objetivos_por_perspectiva: Record<BSCPerspective, number>;
    total_relaciones: number;
    progreso_promedio: number;
  };
}

// =============================================================================
// DTOs PARA CREAR/ACTUALIZAR
// =============================================================================

export interface CreateMapaEstrategicoDTO {
  plan: number;
  name: string;
  description?: string;
  canvas_data?: CanvasData;
}

export interface UpdateMapaEstrategicoDTO {
  name?: string;
  description?: string;
  canvas_data?: CanvasData;
  version?: string;
  is_active?: boolean;
}

export interface CreateCausaEfectoDTO {
  mapa: number;
  source_objective: number;
  target_objective: number;
  description?: string;
  weight?: number;
}

export interface UpdateCausaEfectoDTO {
  description?: string;
  weight?: number;
}

// =============================================================================
// NODOS DE REACT FLOW
// =============================================================================

/** Datos del nodo de objetivo */
export interface ObjetivoNodeData {
  type: 'objetivo';
  objetivo: MapaObjetivo;
  perspectiveConfig: typeof BSC_PERSPECTIVE_CONFIG[BSCPerspective];
  statusConfig: typeof OBJECTIVE_STATUS_CONFIG[ObjectiveStatus];
  isSelected?: boolean;
  onEdit?: (id: number) => void;
  onConnect?: (id: number) => void;
}

/** Datos del nodo de perspectiva (grupo/contenedor) */
export interface PerspectiveGroupData {
  type: 'perspective-group';
  perspective: BSCPerspective;
  config: typeof BSC_PERSPECTIVE_CONFIG[BSCPerspective];
  objetivosCount: number;
}

/** Unión de todos los tipos de datos de nodo */
export type MapaNodeData = ObjetivoNodeData | PerspectiveGroupData;

/** Tipos de nodo personalizados */
export type MapaNode = Node<MapaNodeData>;

/** Tipos de conexión (edge) con datos adicionales */
export interface MapaEdgeData {
  causaEfecto?: CausaEfecto;
  weight?: number;
  isNew?: boolean;
}

export type MapaEdge = Edge<MapaEdgeData>;

// =============================================================================
// CONFIGURACIÓN DEL CANVAS
// =============================================================================

export interface MapaCanvasConfig {
  /** Dirección del layout (TB = Top-Bottom para BSC) */
  direction: 'TB' | 'LR';
  /** Ancho de cada banda de perspectiva */
  perspectiveWidth: number;
  /** Altura de cada banda de perspectiva */
  perspectiveHeight: number;
  /** Separación horizontal entre nodos */
  nodeSpacingX: number;
  /** Separación vertical entre nodos */
  nodeSpacingY: number;
  /** Mostrar grid */
  showGrid: boolean;
  /** Mostrar minimap */
  showMinimap: boolean;
  /** Zoom mínimo */
  minZoom: number;
  /** Zoom máximo */
  maxZoom: number;
  /** Permitir crear conexiones */
  allowConnect: boolean;
  /** Permitir mover nodos */
  allowDrag: boolean;
}

export const DEFAULT_MAPA_CONFIG: MapaCanvasConfig = {
  direction: 'TB',
  perspectiveWidth: 1200,
  perspectiveHeight: 200,
  nodeSpacingX: 50,
  nodeSpacingY: 30,
  showGrid: true,
  showMinimap: true,
  minZoom: 0.2,
  maxZoom: 2,
  allowConnect: true,
  allowDrag: true,
};

// =============================================================================
// ACCIONES DEL TOOLBAR
// =============================================================================

export interface MapaToolbarActions {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetLayout: () => void;
  onSavePositions: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onToggleGrid: () => void;
  onToggleMinimap: () => void;
  onAddRelation: () => void;
}

// =============================================================================
// EXPORTACIÓN
// =============================================================================

export type MapaExportFormat = 'png' | 'pdf';

export interface MapaExportOptions {
  format: MapaExportFormat;
  includeTitle: boolean;
  includeDate: boolean;
  includeLegend: boolean;
  quality: number;
  backgroundColor: string;
}

export const DEFAULT_MAPA_EXPORT_OPTIONS: MapaExportOptions = {
  format: 'png',
  includeTitle: true,
  includeDate: true,
  includeLegend: true,
  quality: 2,
  backgroundColor: '#ffffff',
};
