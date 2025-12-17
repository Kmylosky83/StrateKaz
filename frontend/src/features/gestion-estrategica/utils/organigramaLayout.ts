/**
 * Utilidades de Layout para el Organigrama
 *
 * Usa dagre para calcular posiciones jerárquicas automáticas
 */

import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';
import type {
  AreaData,
  CargoData,
  ViewMode,
  CanvasConfig,
  OrganigramaNodeData,
} from '../types/organigrama.types';

// =============================================================================
// CONSTANTES DE TAMAÑO DE NODOS
// =============================================================================

const NODE_DIMENSIONS = {
  area: { width: 280, height: 120 },
  cargo: { width: 260, height: 100 },
  compact: { width: 180, height: 60 },
};

// =============================================================================
// CREAR GRAFO DAGRE
// =============================================================================

/**
 * Crea un grafo dagre con la configuración especificada
 */
const createDagreGraph = (config: CanvasConfig) => {
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: config.direction,
    nodesep: config.nodeSpacing,
    ranksep: config.rankSpacing,
    marginx: 50,
    marginy: 50,
  });

  g.setDefaultEdgeLabel(() => ({}));

  return g;
};

// =============================================================================
// GENERAR NODOS Y EDGES POR MODO DE VISTA
// =============================================================================

/**
 * Genera nodos y edges para vista de áreas
 */
export const generateAreasLayout = (
  areas: AreaData[],
  cargos: CargoData[],
  config: CanvasConfig
): { nodes: Node<OrganigramaNodeData>[]; edges: Edge[] } => {
  const g = createDagreGraph(config);
  const nodes: Node<OrganigramaNodeData>[] = [];
  const edges: Edge[] = [];

  // Agregar nodos de áreas
  areas.forEach((area) => {
    const nodeId = `area-${area.id}`;
    g.setNode(nodeId, {
      width: NODE_DIMENSIONS.area.width,
      height: NODE_DIMENSIONS.area.height,
    });

    nodes.push({
      id: nodeId,
      type: 'areaNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'area',
        area,
        expanded: true,
        cargos: cargos.filter((c) => c.area === area.id),
      },
    });

    // Crear edge hacia el padre si existe
    if (area.parent) {
      const parentId = `area-${area.parent}`;
      const edgeId = `edge-${parentId}-${nodeId}`;
      g.setEdge(parentId, nodeId);
      edges.push({
        id: edgeId,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });
    }
  });

  // Calcular layout
  dagre.layout(g);

  // Aplicar posiciones calculadas
  nodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - NODE_DIMENSIONS.area.width / 2,
        y: dagreNode.y - NODE_DIMENSIONS.area.height / 2,
      };
    }
  });

  return { nodes, edges };
};

/**
 * Genera nodos y edges para vista de cargos
 */
export const generateCargosLayout = (
  cargos: CargoData[],
  config: CanvasConfig
): { nodes: Node<OrganigramaNodeData>[]; edges: Edge[] } => {
  const g = createDagreGraph(config);
  const nodes: Node<OrganigramaNodeData>[] = [];
  const edges: Edge[] = [];

  // Agregar nodos de cargos
  cargos.forEach((cargo) => {
    const nodeId = `cargo-${cargo.id}`;
    g.setNode(nodeId, {
      width: NODE_DIMENSIONS.cargo.width,
      height: NODE_DIMENSIONS.cargo.height,
    });

    nodes.push({
      id: nodeId,
      type: 'cargoNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'cargo',
        cargo,
        expanded: true,
        subordinados: cargos.filter((c) => c.parent_cargo === cargo.id),
      },
    });

    // Crear edge hacia el cargo padre si existe
    if (cargo.parent_cargo) {
      const parentId = `cargo-${cargo.parent_cargo}`;
      const edgeId = `edge-${parentId}-${nodeId}`;
      g.setEdge(parentId, nodeId);

      // Color del edge basado en nivel jerárquico
      const edgeColors: Record<string, string> = {
        ESTRATEGICO: '#ef4444',
        TACTICO: '#3b82f6',
        OPERATIVO: '#22c55e',
        APOYO: '#a855f7',
      };

      edges.push({
        id: edgeId,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: edgeColors[cargo.nivel_jerarquico] || '#94a3b8',
          strokeWidth: 2,
        },
      });
    }
  });

  // Calcular layout
  dagre.layout(g);

  // Aplicar posiciones calculadas
  nodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - NODE_DIMENSIONS.cargo.width / 2,
        y: dagreNode.y - NODE_DIMENSIONS.cargo.height / 2,
      };
    }
  });

  return { nodes, edges };
};

/**
 * Genera nodos y edges para vista compacta (áreas con cargos anidados)
 */
export const generateCompactLayout = (
  areas: AreaData[],
  cargos: CargoData[],
  config: CanvasConfig
): { nodes: Node<OrganigramaNodeData>[]; edges: Edge[] } => {
  const g = createDagreGraph(config);
  const nodes: Node<OrganigramaNodeData>[] = [];
  const edges: Edge[] = [];

  // Agregar nodos compactos de áreas
  areas.forEach((area) => {
    const nodeId = `compact-area-${area.id}`;
    const areaCargoCount = cargos.filter((c) => c.area === area.id).length;

    g.setNode(nodeId, {
      width: NODE_DIMENSIONS.compact.width,
      height: NODE_DIMENSIONS.compact.height,
    });

    nodes.push({
      id: nodeId,
      type: 'compactNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'compact',
        item: area,
        itemType: 'area',
        count: areaCargoCount,
      },
    });

    // Crear edge hacia el padre si existe
    if (area.parent) {
      const parentId = `compact-area-${area.parent}`;
      const edgeId = `edge-${parentId}-${nodeId}`;
      g.setEdge(parentId, nodeId);
      edges.push({
        id: edgeId,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      });
    }
  });

  // Calcular layout
  dagre.layout(g);

  // Aplicar posiciones calculadas
  nodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - NODE_DIMENSIONS.compact.width / 2,
        y: dagreNode.y - NODE_DIMENSIONS.compact.height / 2,
      };
    }
  });

  return { nodes, edges };
};

// =============================================================================
// FUNCIÓN PRINCIPAL DE LAYOUT
// =============================================================================

/**
 * Genera el layout completo según el modo de vista
 */
export const generateLayout = (
  areas: AreaData[],
  cargos: CargoData[],
  viewMode: ViewMode,
  config: CanvasConfig
): { nodes: Node<OrganigramaNodeData>[]; edges: Edge[] } => {
  switch (viewMode) {
    case 'areas':
      return generateAreasLayout(areas, cargos, config);
    case 'cargos':
      return generateCargosLayout(cargos, config);
    case 'compact':
      return generateCompactLayout(areas, cargos, config);
    default:
      return { nodes: [], edges: [] };
  }
};

// =============================================================================
// UTILIDADES DE BÚSQUEDA Y FILTRADO
// =============================================================================

/**
 * Filtra nodos según término de búsqueda
 */
export const filterNodesBySearch = (
  nodes: Node<OrganigramaNodeData>[],
  searchTerm: string
): Set<string> => {
  if (!searchTerm.trim()) {
    return new Set(nodes.map((n) => n.id));
  }

  const term = searchTerm.toLowerCase();
  const matchingIds = new Set<string>();

  nodes.forEach((node) => {
    const { data } = node;
    let matches = false;

    if (data.type === 'area') {
      const area = data.area;
      matches =
        area.name.toLowerCase().includes(term) ||
        area.code.toLowerCase().includes(term) ||
        (area.description?.toLowerCase().includes(term) ?? false);
    } else if (data.type === 'cargo') {
      const cargo = data.cargo;
      matches =
        cargo.name.toLowerCase().includes(term) ||
        cargo.code.toLowerCase().includes(term) ||
        (cargo.description?.toLowerCase().includes(term) ?? false);
    } else if (data.type === 'compact') {
      const item = data.item;
      matches =
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term);
    }

    if (matches) {
      matchingIds.add(node.id);
    }
  });

  return matchingIds;
};

/**
 * Resalta un nodo específico (para búsqueda)
 */
export const highlightNode = (
  nodes: Node<OrganigramaNodeData>[],
  nodeId: string
): Node<OrganigramaNodeData>[] => {
  return nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      opacity: node.id === nodeId ? 1 : 0.3,
      transition: 'opacity 0.3s ease',
    },
  }));
};

/**
 * Restaura opacidad de todos los nodos
 */
export const resetHighlight = (
  nodes: Node<OrganigramaNodeData>[]
): Node<OrganigramaNodeData>[] => {
  return nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      opacity: 1,
    },
  }));
};
