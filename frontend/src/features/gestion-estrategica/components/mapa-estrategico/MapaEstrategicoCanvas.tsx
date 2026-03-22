/**
 * MapaEstrategicoCanvas - Canvas principal del Mapa Estratégico
 *
 * Renderiza el mapa estratégico interactivo con:
 * - Objetivos como nodos agrupados por perspectiva BSC
 * - Relaciones causa-efecto como conexiones
 * - Toolbar con acciones (zoom, exportar, guardar)
 * - Layout automático por perspectiva
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Card, EmptyState, Spinner, Button, Badge } from '@/components/common';
import { Map, Save, ZoomIn, ZoomOut, Maximize2, Link2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import ObjetivoNode from './ObjetivoNode';
import {
  useMapaVisualizacion,
  useSaveCanvasPositions,
  useCreateRelacion,
  useDeleteRelacion,
} from '../../hooks/useMapaEstrategico';
import {
  BSC_PERSPECTIVE_CONFIG,
  OBJECTIVE_STATUS_CONFIG,
  DEFAULT_MAPA_CONFIG,
  type MapaNode,
  type MapaEdge,
  type MapaObjetivo,
  type CausaEfecto,
  type CanvasData,
  type BSCPerspective,
} from '../../types/mapa-estrategico.types';

// Tipos de nodos personalizados
const nodeTypes = {
  objetivo: ObjetivoNode,
};

// Estilos de edge por defecto
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 2, stroke: '#9333ea' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#9333ea',
  },
};

// =============================================================================
// UTILIDADES DE LAYOUT
// =============================================================================

/**
 * Genera el layout de nodos agrupados por perspectiva BSC
 */
function generateBSCLayout(
  objetivos: MapaObjetivo[],
  savedPositions?: Record<string, { x: number; y: number }>,
  onEdit?: (id: number) => void
): MapaNode[] {
  const nodes: MapaNode[] = [];

  // Agrupar objetivos por perspectiva
  const byPerspective: Record<BSCPerspective, MapaObjetivo[]> = {
    FINANCIERA: [],
    CLIENTES: [],
    PROCESOS: [],
    APRENDIZAJE: [],
  };

  objetivos.forEach((obj) => {
    if (byPerspective[obj.bsc_perspective]) {
      byPerspective[obj.bsc_perspective].push(obj);
    }
  });

  // Configuración de layout
  const nodeWidth = 280;
  const _nodeHeight = 180;
  const horizontalGap = 40;
  const _verticalGap = 80;
  const perspectiveStartY = [50, 280, 510, 740]; // Y inicial para cada perspectiva

  // Generar nodos para cada perspectiva
  (
    Object.entries(BSC_PERSPECTIVE_CONFIG) as [
      BSCPerspective,
      (typeof BSC_PERSPECTIVE_CONFIG)[BSCPerspective],
    ][]
  )
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([perspective, config], perspectiveIndex) => {
      const perspectiveObjetivos = byPerspective[perspective];
      const startY = perspectiveStartY[perspectiveIndex];

      perspectiveObjetivos.forEach((objetivo, index) => {
        const nodeId = `objetivo-${objetivo.id}`;

        // Usar posición guardada o calcular nueva
        const savedPos = savedPositions?.[nodeId];
        const x = savedPos?.x ?? index * (nodeWidth + horizontalGap) + 50;
        const y = savedPos?.y ?? startY;

        nodes.push({
          id: nodeId,
          type: 'objetivo',
          position: { x, y },
          data: {
            type: 'objetivo',
            objetivo,
            perspectiveConfig: config,
            statusConfig: OBJECTIVE_STATUS_CONFIG[objetivo.status],
            onEdit,
          },
        });
      });
    });

  return nodes;
}

/**
 * Genera edges a partir de relaciones causa-efecto
 */
function generateEdges(relaciones: CausaEfecto[]): MapaEdge[] {
  return relaciones.map((rel) => ({
    id: `edge-${rel.id}`,
    source: `objetivo-${rel.source_objective}`,
    target: `objetivo-${rel.target_objective}`,
    type: 'smoothstep',
    animated: true,
    style: {
      strokeWidth: Math.max(1, rel.weight),
      stroke: '#9333ea',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#9333ea',
    },
    data: {
      causaEfecto: rel,
      weight: rel.weight,
    },
    label: rel.weight > 1 ? `Peso: ${rel.weight}` : undefined,
    labelStyle: { fontSize: 10, fill: '#6b7280' },
  }));
}

// =============================================================================
// COMPONENTE INTERNO DEL CANVAS
// =============================================================================

interface MapaCanvasInnerProps {
  mapaId: number | null;
  objetivos: MapaObjetivo[];
  relaciones: CausaEfecto[];
  canvasData?: CanvasData;
  height: number;
  onEditObjective?: (id: number) => void;
}

const MapaCanvasInner = ({
  mapaId,
  objetivos,
  relaciones,
  canvasData,
  height,
  onEditObjective,
}: MapaCanvasInnerProps) => {
  const { fitView, zoomIn, zoomOut, getNodes, getViewport } = useReactFlow();

  // Mutations
  const savePositionsMutation = useSaveCanvasPositions();
  const createRelacionMutation = useCreateRelacion();
  const deleteRelacionMutation = useDeleteRelacion();

  // Estado del canvas
  const [showGrid, _setShowGrid] = useState(DEFAULT_MAPA_CONFIG.showGrid);
  const [showMinimap, _setShowMinimap] = useState(DEFAULT_MAPA_CONFIG.showMinimap);

  // Generar nodos y edges iniciales
  const initialNodes = useMemo(
    () => generateBSCLayout(objetivos, canvasData?.nodes, onEditObjective),
    [objetivos, canvasData?.nodes, onEditObjective]
  );

  const initialEdges = useMemo(() => generateEdges(relaciones), [relaciones]);

  // Estado de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Actualizar nodos cuando cambian los datos
  useEffect(() => {
    setNodes(generateBSCLayout(objetivos, canvasData?.nodes, onEditObjective));
  }, [objetivos, canvasData?.nodes, onEditObjective, setNodes]);

  // Actualizar edges cuando cambian las relaciones
  useEffect(() => {
    setEdges(generateEdges(relaciones));
  }, [relaciones, setEdges]);

  // Fit view cuando se cargan los nodos
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [nodes.length, fitView]);

  // Handler para guardar posiciones
  const handleSavePositions = useCallback(() => {
    if (!mapaId) return;

    const currentNodes = getNodes();
    const nodePositions: Record<string, { x: number; y: number }> = {};

    currentNodes.forEach((node) => {
      nodePositions[node.id] = {
        x: node.position.x,
        y: node.position.y,
      };
    });

    const viewport = getViewport();

    savePositionsMutation.mutate({
      id: mapaId,
      canvasData: {
        nodes: nodePositions,
        viewport: {
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        },
        version: '1.0',
      },
    });
  }, [mapaId, getNodes, getViewport, savePositionsMutation]);

  // Handler para crear conexión (relación causa-efecto)
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!mapaId || !connection.source || !connection.target) return;

      // Extraer IDs de objetivos
      const sourceId = parseInt(connection.source.replace('objetivo-', ''));
      const targetId = parseInt(connection.target.replace('objetivo-', ''));

      if (isNaN(sourceId) || isNaN(targetId)) return;

      // Verificar que no exista ya la relación
      const exists = edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );

      if (exists) {
        toast.error('Esta relación ya existe');
        return;
      }

      createRelacionMutation.mutate({
        mapa: mapaId,
        source_objective: sourceId,
        target_objective: targetId,
        weight: 1,
      });
    },
    [mapaId, edges, createRelacionMutation]
  );

  // Handler para eliminar edge
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      if (!mapaId) return;

      const edge = edges.find((e) => e.id === edgeId);
      if (!edge?.data?.causaEfecto) return;

      deleteRelacionMutation.mutate({
        id: edge.data.causaEfecto.id,
        mapaId,
      });
    },
    [mapaId, edges, deleteRelacionMutation]
  );

  // Handler para reset layout
  const handleResetLayout = useCallback(() => {
    setNodes(generateBSCLayout(objetivos, undefined, onEditObjective));
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [objetivos, onEditObjective, setNodes, fitView]);

  // Contadores por perspectiva
  const countsByPerspective = useMemo(() => {
    const counts: Record<BSCPerspective, number> = {
      FINANCIERA: 0,
      CLIENTES: 0,
      PROCESOS: 0,
      APRENDIZAJE: 0,
    };
    objetivos.forEach((obj) => {
      if (counts[obj.bsc_perspective] !== undefined) {
        counts[obj.bsc_perspective]++;
      }
    });
    return counts;
  }, [objetivos]);

  return (
    <div
      className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ height: `${height}px` }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={DEFAULT_MAPA_CONFIG.minZoom}
        maxZoom={DEFAULT_MAPA_CONFIG.maxZoom}
        snapToGrid={true}
        snapGrid={[20, 20]}
        deleteKeyCode={['Backspace', 'Delete']}
        onEdgeDoubleClick={(_, edge) => handleEdgeDelete(edge.id)}
      >
        {/* Toolbar superior */}
        <Panel position="top-left" className="flex flex-wrap gap-2">
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
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetLayout}
            title="Restablecer layout"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSavePositions}
            disabled={savePositionsMutation.isPending || !mapaId}
            title="Guardar posiciones"
          >
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </Panel>

        {/* Leyenda de perspectivas */}
        <Panel position="top-right" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Perspectivas BSC
          </p>
          <div className="space-y-1">
            {(
              Object.entries(BSC_PERSPECTIVE_CONFIG) as [
                BSCPerspective,
                (typeof BSC_PERSPECTIVE_CONFIG)[BSCPerspective],
              ][]
            )
              .sort((a, b) => a[1].order - b[1].order)
              .map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${config.bgColor}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {config.shortLabel}
                  </span>
                  <Badge variant="gray" size="sm">
                    {countsByPerspective[key]}
                  </Badge>
                </div>
              ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              <Link2 className="h-3 w-3 inline mr-1" />
              {relaciones.length} relaciones
            </p>
          </div>
        </Panel>

        {/* Instrucciones */}
        <Panel
          position="bottom-left"
          className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm p-2"
        >
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Arrastra nodos para mover | Conecta desde los puntos | Doble clic para editar
          </p>
        </Panel>

        {/* Controles estándar */}
        <Controls showInteractive={false} />

        {/* Minimap */}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as unknown;
              if (data?.perspectiveConfig?.color) {
                const colorMap: Record<string, string> = {
                  green: '#22c55e',
                  blue: '#3b82f6',
                  amber: '#f59e0b',
                  purple: '#a855f7',
                };
                return colorMap[data.perspectiveConfig.color] || '#6b7280';
              }
              return '#6b7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="!bg-white dark:!bg-gray-800"
          />
        )}

        {/* Grid de fondo */}
        {showGrid && (
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        )}
      </ReactFlow>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface MapaEstrategicoCanvasProps {
  /** ID del plan estratégico */
  planId: number;
  /** Altura del canvas (default: 600) */
  height?: number;
  /** Callback cuando se quiere editar un objetivo */
  onEditObjective?: (id: number) => void;
}

export const MapaEstrategicoCanvas = ({
  planId,
  height = 600,
  onEditObjective,
}: MapaEstrategicoCanvasProps) => {
  // Cargar datos del mapa
  const { data, isLoading, error } = useMapaVisualizacion(planId);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-[400px]">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500">Cargando mapa estratégico...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <div className="p-6">
          <EmptyState
            icon={<Map className="h-12 w-12" />}
            title="Error al cargar el mapa"
            description={error.message}
          />
        </div>
      </Card>
    );
  }

  // Sin objetivos
  if (!data || data.objetivos.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <EmptyState
            icon={<Map className="h-12 w-12" />}
            title="Sin objetivos estratégicos"
            description="Crea objetivos en la sección BSC para visualizarlos en el mapa estratégico."
          />
        </div>
      </Card>
    );
  }

  return (
    <ReactFlowProvider>
      <MapaCanvasInner
        mapaId={data.mapa?.id ?? null}
        objetivos={data.objetivos}
        relaciones={data.relaciones}
        canvasData={data.mapa?.canvas_data}
        height={height}
        onEditObjective={onEditObjective}
      />
    </ReactFlowProvider>
  );
};

export default MapaEstrategicoCanvas;
