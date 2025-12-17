/**
 * Tipos para el Organigrama Visual Interactivo
 *
 * Basado en React Flow v12 (@xyflow/react) con dagre para layout automático
 */

import { Node, Edge } from '@xyflow/react';

// =============================================================================
// DATOS DEL BACKEND
// =============================================================================

/** Área desde el backend */
export interface AreaData {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parent?: number | null;
  parent_name?: string | null;
  cost_center?: string | null;
  manager?: number | null;
  manager_name?: string | null;
  is_active: boolean;
  order: number;
  children_count?: number;
  cargos_count?: number;
  usuarios_count?: number;
  level?: number;
}

/** Usuario asignado a un cargo (para avatares) */
export interface UsuarioAsignado {
  id: number;
  full_name: string;
  photo_url?: string | null;
  initials: string;
}

/** Cargo desde el backend */
export interface CargoData {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  area?: number | null;
  area_name?: string | null;
  parent_cargo?: number | null;
  parent_cargo_name?: string | null;
  nivel_jerarquico: NivelJerarquico;
  is_jefatura: boolean;
  is_active: boolean;
  cantidad_posiciones: number;
  usuarios_count?: number;
  subordinados_count?: number;
  /** Usuarios asignados al cargo con info para avatares */
  usuarios_asignados?: UsuarioAsignado[];
}

/** Usuario resumido para nodos */
export interface UsuarioResumen {
  id: number;
  username: string;
  full_name: string;
  email?: string;
  cargo_name?: string;
  photo_url?: string | null;
}

/** Respuesta del endpoint de organigrama */
export interface OrganigramaResponse {
  areas: AreaData[];
  cargos: CargoData[];
  usuarios?: UsuarioResumen[];
  stats: OrganigramaStats;
}

/** Estadísticas del organigrama */
export interface OrganigramaStats {
  total_areas: number;
  total_cargos: number;
  total_usuarios: number;
  areas_activas: number;
  cargos_activos: number;
}

// =============================================================================
// NIVELES JERÁRQUICOS Y COLORES
// =============================================================================

export type NivelJerarquico = 'ESTRATEGICO' | 'TACTICO' | 'OPERATIVO' | 'APOYO';

/** Colores por nivel jerárquico */
export const NIVEL_COLORS: Record<NivelJerarquico, {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  darkBg: string;
  darkBorder: string;
}> = {
  ESTRATEGICO: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    darkBg: 'dark:bg-red-900/30',
    darkBorder: 'dark:border-red-800',
  },
  TACTICO: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    darkBg: 'dark:bg-blue-900/30',
    darkBorder: 'dark:border-blue-800',
  },
  OPERATIVO: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    darkBg: 'dark:bg-green-900/30',
    darkBorder: 'dark:border-green-800',
  },
  APOYO: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    darkBg: 'dark:bg-purple-900/30',
    darkBorder: 'dark:border-purple-800',
  },
};

/** Labels de niveles jerárquicos */
export const NIVEL_LABELS: Record<NivelJerarquico, string> = {
  ESTRATEGICO: 'Estratégico',
  TACTICO: 'Táctico',
  OPERATIVO: 'Operativo',
  APOYO: 'Apoyo',
};

// =============================================================================
// MODOS DE VISTA
// =============================================================================

export type ViewMode = 'areas' | 'cargos' | 'compact';

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  areas: 'Por Áreas',
  cargos: 'Por Cargos',
  compact: 'Compacto',
};

// =============================================================================
// NODOS DE REACT FLOW
// =============================================================================

/** Datos del nodo de área */
export interface AreaNodeData {
  type: 'area';
  area: AreaData;
  expanded: boolean;
  onExpand?: () => void;
  cargos?: CargoData[];
  childAreas?: AreaData[];
}

/** Datos del nodo de cargo */
export interface CargoNodeData {
  type: 'cargo';
  cargo: CargoData;
  expanded: boolean;
  onExpand?: () => void;
  usuarios?: UsuarioResumen[];
  subordinados?: CargoData[];
}

/** Datos del nodo compacto */
export interface CompactNodeData {
  type: 'compact';
  item: AreaData | CargoData;
  itemType: 'area' | 'cargo';
  count?: number;
}

/** Unión de todos los tipos de datos de nodo */
export type OrganigramaNodeData = AreaNodeData | CargoNodeData | CompactNodeData;

/** Tipos de nodo personalizados */
export type OrganigramaNode = Node<OrganigramaNodeData>;

/** Tipos de conexión */
export type OrganigramaEdge = Edge;

// =============================================================================
// CONFIGURACIÓN DEL CANVAS
// =============================================================================

export interface CanvasConfig {
  /** Dirección del layout */
  direction: 'TB' | 'LR';
  /** Separación entre nodos */
  nodeSpacing: number;
  /** Separación entre niveles */
  rankSpacing: number;
  /** Mostrar grid */
  showGrid: boolean;
  /** Snap to grid */
  snapToGrid: boolean;
  /** Zoom mínimo */
  minZoom: number;
  /** Zoom máximo */
  maxZoom: number;
}

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  direction: 'TB',
  nodeSpacing: 80,
  rankSpacing: 120,
  showGrid: true,
  snapToGrid: true,
  minZoom: 0.1,
  maxZoom: 2,
};

// =============================================================================
// FILTROS Y BÚSQUEDA
// =============================================================================

export interface OrganigramaFilters {
  /** Término de búsqueda */
  search: string;
  /** Filtrar por nivel jerárquico */
  nivelJerarquico: NivelJerarquico | 'all';
  /** Filtrar por área */
  areaId: number | null;
  /** Mostrar solo activos */
  soloActivos: boolean;
  /** Mostrar posiciones vacantes */
  mostrarVacantes: boolean;
}

export const DEFAULT_FILTERS: OrganigramaFilters = {
  search: '',
  nivelJerarquico: 'all',
  areaId: null,
  soloActivos: true,
  mostrarVacantes: false,
};

// =============================================================================
// EXPORTACIÓN
// =============================================================================

export type ExportFormat = 'png' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  /** Incluir título */
  includeTitle: boolean;
  /** Incluir fecha */
  includeDate: boolean;
  /** Incluir leyenda */
  includeLegend: boolean;
  /** Calidad (para PNG) */
  quality: number;
  /** Orientación (para PDF) */
  orientation: 'portrait' | 'landscape';
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'png',
  includeTitle: true,
  includeDate: true,
  includeLegend: true,
  quality: 2,
  orientation: 'landscape',
};

// =============================================================================
// ACCIONES DEL TOOLBAR
// =============================================================================

export interface ToolbarActions {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetLayout: () => void;
  onToggleDirection: () => void;
  onExport: (options: ExportOptions) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}
