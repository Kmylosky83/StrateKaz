/**
 * WorkflowDesignerCanvas - Canvas principal del disenador visual BPMN
 *
 * Utiliza React Flow (@xyflow/react) para renderizar plantillas de flujos.
 * Patron tomado de MapaEstrategicoCanvas.tsx (ya funcional en el proyecto).
 *
 * Features:
 * - Drag & drop de nodos BPMN desde el sidebar
 * - Creacion de conexiones (transiciones) entre nodos
 * - Guardado de posiciones en json_diagram de PlantillaFlujo
 * - Auto-layout con dagre
 * - Toolbar con zoom, fit, guardar, validar
 */
import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  ConnectionMode,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button, Spinner } from '@/components/common';
import {
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layout,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import dagre from '@dagrejs/dagre';

import { bpmnNodeTypes, NODE_CONFIG } from './nodes/BpmnNodes';
import {
  useNodos,
  useTransiciones,
  useCreateNodo,
  useUpdateNodo,
  useDeleteNodo,
  useCreateTransicion,
  useDeleteTransicion,
  useUpdatePlantilla,
  useRolesFlujo,
} from '../hooks/useWorkflows';
import type {
  NodoFlujo,
  TransicionFlujo,
  PlantillaFlujo,
  TipoNodo,
  WorkflowNodeData,
  WorkflowEdgeData,
  RolFlujo,
} from '../types/workflow.types';

// ============================================================
// UTILIDADES
// ============================================================

const DEFAULT_EDGE_OPTIONS = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 2, stroke: '#9333ea' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#9333ea',
  },
};

/** Convierte nodos del backend a nodos de React Flow */
function nodosToFlowNodes(
  nodos: NodoFlujo[],
  roles: RolFlujo[],
  savedPositions?: Record<string, { x: number; y: number }>,
  onEdit?: (id: number) => void,
  onDelete?: (id: number) => void
): Node[] {
  return nodos.map((nodo) => {
    const nodeId = `nodo-${nodo.id}`;
    const saved = savedPositions?.[nodeId];
    const rolDetail = nodo.rol_asignado ? roles.find((r) => r.id === nodo.rol_asignado) : undefined;

    return {
      id: nodeId,
      type: nodo.tipo,
      position: {
        x: saved?.x ?? nodo.posicion_x,
        y: saved?.y ?? nodo.posicion_y,
      },
      data: {
        tipo: nodo.tipo,
        nodo,
        rolDetail,
        camposCount: nodo.total_campos_formulario ?? 0,
        onEdit,
        onDelete,
      } satisfies WorkflowNodeData,
    };
  });
}

/** Convierte transiciones del backend a edges de React Flow */
function transicionesToFlowEdges(transiciones: TransicionFlujo[]): Edge[] {
  return transiciones.map((t) => ({
    id: `edge-${t.id}`,
    source: `nodo-${t.nodo_origen}`,
    target: `nodo-${t.nodo_destino}`,
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2, stroke: t.tiene_condicion ? '#f59e0b' : '#9333ea' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: t.tiene_condicion ? '#f59e0b' : '#9333ea',
    },
    label: t.nombre || undefined,
    labelStyle: { fontSize: 11, fill: '#6b7280', fontWeight: 500 },
    data: {
      transicion: t,
      hasCondition: !!t.tiene_condicion,
    } satisfies WorkflowEdgeData,
  }));
}

/** Auto-layout con dagre */
function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    const w = node.type === 'TAREA' ? 240 : 80;
    const h = node.type === 'TAREA' ? 140 : 80;
    g.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const w = node.type === 'TAREA' ? 240 : 80;
    const h = node.type === 'TAREA' ? 140 : 80;
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });
}

// ============================================================
// COMPONENTE INTERNO DEL CANVAS
// ============================================================

interface CanvasInnerProps {
  plantilla: PlantillaFlujo;
  nodos: NodoFlujo[];
  transiciones: TransicionFlujo[];
  roles: RolFlujo[];
  onEditNode?: (nodoId: number) => void;
}

const CanvasInner = ({ plantilla, nodos, transiciones, roles, onEditNode }: CanvasInnerProps) => {
  const { fitView, zoomIn, zoomOut, getNodes, getViewport, screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Mutations
  const createNodoMutation = useCreateNodo();
  const _updateNodoMutation = useUpdateNodo();
  const deleteNodoMutation = useDeleteNodo();
  const createTransicionMutation = useCreateTransicion();
  const deleteTransicionMutation = useDeleteTransicion();
  const updatePlantillaMutation = useUpdatePlantilla();

  // Generar nodos y edges iniciales
  const savedPositions =
    (plantilla.json_diagram as Record<string, { x: number; y: number }>) ?? undefined;

  const handleDeleteNode = useCallback(
    (nodoId: number) => {
      deleteNodoMutation.mutate({ id: nodoId, plantillaId: plantilla.id });
    },
    [deleteNodoMutation, plantilla.id]
  );

  const initialNodes = useMemo(
    () => nodosToFlowNodes(nodos, roles, savedPositions, onEditNode, handleDeleteNode),
    [nodos, roles, savedPositions, onEditNode, handleDeleteNode]
  );
  const initialEdges = useMemo(() => transicionesToFlowEdges(transiciones), [transiciones]);

  // Estado de React Flow
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sincronizar cuando cambian datos del backend
  useEffect(() => {
    setFlowNodes(nodosToFlowNodes(nodos, roles, savedPositions, onEditNode, handleDeleteNode));
  }, [nodos, roles, savedPositions, onEditNode, handleDeleteNode, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(transicionesToFlowEdges(transiciones));
  }, [transiciones, setFlowEdges]);

  // Fit view al cargar
  useEffect(() => {
    if (flowNodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 200);
    }
  }, [flowNodes.length, fitView]);

  // ---- HANDLERS ----

  /** Guardar posiciones en json_diagram */
  const handleSave = useCallback(() => {
    const currentNodes = getNodes();
    const positions: Record<string, { x: number; y: number }> = {};
    currentNodes.forEach((n) => {
      positions[n.id] = { x: n.position.x, y: n.position.y };
    });

    updatePlantillaMutation.mutate({
      id: plantilla.id,
      data: { json_diagram: { nodes: positions, viewport: getViewport() } },
    });
  }, [getNodes, getViewport, updatePlantillaMutation, plantilla.id]);

  /** Crear conexion (transicion) */
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const sourceId = parseInt(connection.source.replace('nodo-', ''));
      const targetId = parseInt(connection.target.replace('nodo-', ''));
      if (isNaN(sourceId) || isNaN(targetId)) return;

      // No duplicar
      const exists = flowEdges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) {
        toast.error('Esta transicion ya existe');
        return;
      }

      createTransicionMutation.mutate({
        plantilla: plantilla.id,
        nodo_origen: sourceId,
        nodo_destino: targetId,
      });
    },
    [flowEdges, createTransicionMutation, plantilla.id]
  );

  /** Eliminar edge (doble clic) */
  const handleEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const t = (edge.data as WorkflowEdgeData)?.transicion;
      if (t) {
        deleteTransicionMutation.mutate({ id: t.id, plantillaId: plantilla.id });
      }
    },
    [deleteTransicionMutation, plantilla.id]
  );

  /** Auto-layout con dagre */
  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayout(flowNodes, flowEdges);
    setFlowNodes(layouted);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
    toast.success('Layout aplicado');
  }, [flowNodes, flowEdges, setFlowNodes, fitView]);

  /** Drop de nodo desde sidebar */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const tipo = event.dataTransfer.getData('application/bpmn-node') as TipoNodo;
      if (!tipo) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const config = NODE_CONFIG[tipo];
      const codigo = `${tipo}_${Date.now()}`;

      createNodoMutation.mutate({
        plantilla: plantilla.id,
        tipo,
        codigo,
        nombre: config?.label || tipo,
        posicion_x: Math.round(position.x),
        posicion_y: Math.round(position.y),
      });
    },
    [screenToFlowPosition, createNodoMutation, plantilla.id]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // ---- VALIDACION SIMPLE ----
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const hasInicio = nodos.some((n) => n.tipo === 'INICIO');
    const hasFin = nodos.some((n) => n.tipo === 'FIN');
    if (!hasInicio) errors.push('Falta nodo de Inicio');
    if (!hasFin) errors.push('Falta nodo de Fin');

    const tareasSinRol = nodos.filter((n) => n.tipo === 'TAREA' && !n.rol_asignado);
    if (tareasSinRol.length > 0) {
      errors.push(`${tareasSinRol.length} tarea(s) sin rol asignado`);
    }

    // Nodos desconectados
    const connectedIds = new Set<string>();
    transiciones.forEach((t) => {
      connectedIds.add(`nodo-${t.nodo_origen}`);
      connectedIds.add(`nodo-${t.nodo_destino}`);
    });
    const disconnected = nodos.filter((n) => !connectedIds.has(`nodo-${n.id}`));
    if (disconnected.length > 0 && nodos.length > 1) {
      errors.push(`${disconnected.length} nodo(s) desconectado(s)`);
    }

    return errors;
  }, [nodos, transiciones]);

  return (
    <div
      ref={reactFlowWrapper}
      className="h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        nodeTypes={bpmnNodeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        {/* Toolbar superior */}
        <Panel position="top-left" className="flex flex-wrap gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => zoomIn()} title="Acercar">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => zoomOut()} title="Alejar">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fitView({ padding: 0.2 })}
            title="Ajustar vista"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center" />
          <Button variant="secondary" size="sm" onClick={handleAutoLayout} title="Auto-layout">
            <Layout className="h-4 w-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={updatePlantillaMutation.isPending}
            title="Guardar posiciones"
          >
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </Panel>

        {/* Validacion */}
        <Panel
          position="top-right"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 max-w-[200px]"
        >
          <div className="flex items-center gap-2 mb-2">
            {validationErrors.length === 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  Flujo valido
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {validationErrors.length} problema(s)
                </span>
              </>
            )}
          </div>
          {validationErrors.length > 0 && (
            <ul className="space-y-1">
              {validationErrors.map((err, i) => (
                <li
                  key={i}
                  className="text-[10px] text-gray-600 dark:text-gray-400 flex items-start gap-1"
                >
                  <span className="text-amber-500 mt-0.5">!</span>
                  {err}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500">
            {nodos.length} nodos | {transiciones.length} transiciones
          </div>
        </Panel>

        {/* Instrucciones */}
        <Panel
          position="bottom-left"
          className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm p-2"
        >
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Arrastra componentes desde el panel izquierdo | Conecta desde los puntos | Doble clic en
            linea para eliminar
          </p>
        </Panel>

        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const tipo = node.type as TipoNodo;
            const colorMap: Record<string, string> = {
              INICIO: '#22c55e',
              FIN: '#ef4444',
              TAREA: '#3b82f6',
              GATEWAY_EXCLUSIVO: '#f59e0b',
              GATEWAY_PARALELO: '#a855f7',
              EVENTO: '#f97316',
            };
            return colorMap[tipo] || '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white dark:!bg-gray-800"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
      </ReactFlow>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL (con Provider)
// ============================================================

interface WorkflowDesignerCanvasProps {
  plantilla: PlantillaFlujo;
  onEditNode?: (nodoId: number) => void;
}

export const WorkflowDesignerCanvas = ({ plantilla, onEditNode }: WorkflowDesignerCanvasProps) => {
  const { data: nodosData, isLoading: loadingNodos } = useNodos(plantilla.id);
  const { data: transData, isLoading: loadingTrans } = useTransiciones(plantilla.id);
  const { data: rolesData } = useRolesFlujo();

  const nodos = nodosData?.results ?? [];
  const transiciones = transData?.results ?? [];
  const roles = rolesData?.results ?? [];

  if (loadingNodos || loadingTrans) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">Cargando flujo...</span>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <CanvasInner
        plantilla={plantilla}
        nodos={nodos}
        transiciones={transiciones}
        roles={roles}
        onEditNode={onEditNode}
      />
    </ReactFlowProvider>
  );
};

export default WorkflowDesignerCanvas;
