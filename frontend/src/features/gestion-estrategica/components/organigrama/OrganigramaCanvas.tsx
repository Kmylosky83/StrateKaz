/**
 * OrganigramaCanvas - Canvas principal con React Flow
 *
 * Renderiza el organigrama interactivo con nodos personalizados.
 *
 * Props:
 * - allowedModes: Modos de vista permitidos
 * - defaultMode: Modo de vista inicial
 * - showToolbar: true = toolbar completo, false = mini-toolbar (export + fit)
 */

import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
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
  type NodeDragHandler,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios-config';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { Card, EmptyState, Spinner, Button } from '@/components/common';
import { Building2, Network, Download, Maximize2, RotateCcw, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

import AreaNode from './AreaNode';
import CargoNode from './CargoNode';
import CompactNode from './CompactNode';
import OrganigramaToolbar from './OrganigramaToolbar';

import { generateLayout } from '../../utils/organigramaLayout';
import { exportOrganigrama, ExportError } from '../../utils/organigramaExport';
import { useOrganigramaPositions } from '../../hooks/useOrganigramaPositions';
import type {
  OrganigramaResponse,
  ViewMode,
  OrganigramaFilters,
  CanvasConfig,
  ExportFormat,
} from '../../types/organigrama.types';
import {
  DEFAULT_FILTERS,
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_EXPORT_OPTIONS,
} from '../../types/organigrama.types';

// Tipos de nodos personalizados — definido fuera del componente para evitar
// re-renders (React Flow requiere referencia estable en nodeTypes).
const nodeTypes: NodeTypes = {
  areaNode: AreaNode,
  cargoNode: CargoNode,
  compactNode: CompactNode,
};

// Hook para obtener datos del organigrama
const useOrganigramaData = (includeUsuarios = false, soloActivos = true) => {
  return useQuery({
    queryKey: ['organigrama', includeUsuarios, soloActivos],
    queryFn: async (): Promise<OrganigramaResponse> => {
      const params = new URLSearchParams();
      if (includeUsuarios) params.append('include_usuarios', 'true');
      if (!soloActivos) params.append('solo_activos', 'false');

      const response = await axiosInstance.get(`/organizacion/organigrama/?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000,
  });
};

interface OrganigramaCanvasProps {
  /** Modos de vista permitidos. Si no se pasa, muestra todos (areas, cargos, compact) */
  allowedModes?: ViewMode[];
  /** Modo de vista inicial. Por defecto 'cargos' */
  defaultMode?: ViewMode;
  /** Mostrar toolbar completo (true) o mini-toolbar con solo export + fit (false) */
  showToolbar?: boolean;
}

// Componente interno del canvas
const OrganigramaCanvasInner = ({
  allowedModes,
  defaultMode,
  showToolbar = true,
}: OrganigramaCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Obtener nombre de la empresa para exportacion
  const empresaNombre = useAuthStore((state) => state.currentTenant?.name);

  // Estado
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode ?? 'cargos');
  const [filters, setFilters] = useState<OrganigramaFilters>(DEFAULT_FILTERS);
  const [config, setConfig] = useState<CanvasConfig>(DEFAULT_CANVAS_CONFIG);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<unknown>([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState<unknown>([]);

  // RBAC
  const { canDo } = usePermissions();
  const canEditOrg = canDo(Modules.FUNDACION, Sections.ORGANIGRAMA, 'edit');

  // Datos
  const { data, isLoading, error, refetch } = useOrganigramaData(false, filters.soloActivos);

  // Posiciones persistentes
  const {
    savedPositions,
    isLoading: positionsLoading,
    saveNodePosition,
    resetPositions,
  } = useOrganigramaPositions(viewMode, config.direction);

  // Filtrar datos segun filtros (solo cuando showToolbar=true)
  const filteredData = useMemo(() => {
    if (!data) return { areas: [], cargos: [] };

    let { areas, cargos } = data;

    if (showToolbar) {
      // Filtrar por termino de busqueda
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase();
        areas = areas.filter(
          (a) => a.name.toLowerCase().includes(term) || a.code.toLowerCase().includes(term)
        );
        cargos = cargos.filter(
          (c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
        );
      }

      // Filtrar cargos por nivel jerarquico
      if (filters.nivelJerarquico !== 'all' && viewMode === 'cargos') {
        cargos = cargos.filter((c) => c.nivel_jerarquico === filters.nivelJerarquico);
      }

      // Filtrar por area
      if (filters.areaId !== null) {
        cargos = cargos.filter((c) => c.area === filters.areaId);
      }
    }

    return { areas, cargos };
  }, [data, filters, viewMode, showToolbar]);

  // Generar layout cuando cambian los datos, modo o posiciones
  useEffect(() => {
    if (!data || positionsLoading) return;

    const { nodes: newNodes, edges: newEdges } = generateLayout(
      filteredData.areas,
      filteredData.cargos,
      viewMode,
      config,
      savedPositions
    );

    setNodes(newNodes);
    setEdges(newEdges);

    // Ajustar vista despues de generar layout
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 100);
  }, [
    data,
    filteredData,
    viewMode,
    config,
    savedPositions,
    positionsLoading,
    setNodes,
    setEdges,
    fitView,
  ]);

  // Handler para guardar posicion cuando el usuario arrastra un nodo
  const handleNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      if (!canEditOrg) return;
      saveNodePosition(node.id, node.position.x, node.position.y);
    },
    [saveNodePosition, canEditOrg]
  );

  // Handlers
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<OrganigramaFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleDirectionChange = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      direction: prev.direction === 'TB' ? 'LR' : 'TB',
    }));
  }, []);

  const handleResetLayout = useCallback(() => {
    resetPositions();
    setConfig(DEFAULT_CANVAS_CONFIG);
    setFilters(DEFAULT_FILTERS);
    refetch();
  }, [refetch, resetPositions]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!canvasRef.current) {
        toast.error('No se pudo encontrar el organigrama para exportar');
        return;
      }

      const exportElement = canvasRef.current.querySelector('.react-flow__viewport') as HTMLElement;
      if (!exportElement) {
        toast.error('No se pudo encontrar el canvas del organigrama');
        return;
      }

      setIsExporting(true);
      setShowExportMenu(false);

      const loadingToast = toast.loading(`Exportando organigrama como ${format.toUpperCase()}...`, {
        duration: Infinity,
      });

      try {
        await exportOrganigrama(
          exportElement,
          { ...DEFAULT_EXPORT_OPTIONS, format },
          data?.stats,
          'Organigrama',
          empresaNombre || undefined
        );

        toast.success(`Organigrama exportado exitosamente como ${format.toUpperCase()}`, {
          id: loadingToast,
          duration: 3000,
        });
      } catch (err) {
        console.error('Error al exportar:', err);

        let errorMessage = 'No se pudo exportar el organigrama';
        if (err instanceof ExportError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        toast.error(errorMessage, {
          id: loadingToast,
          duration: 5000,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [data?.stats, empresaNombre]
  );

  const handleExpandAll = useCallback(() => {
    fitView({ padding: 0.1, duration: 300 });
  }, [fitView]);

  const handleCollapseAll = useCallback(() => {
    fitView({ padding: 0.3, duration: 300 });
  }, [fitView]);

  // Estados de loading y error
  if (isLoading || positionsLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-gray-500 dark:text-gray-400">Cargando organigrama...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <EmptyState
          icon={<Network className="h-12 w-12" />}
          title="Error al cargar"
          description="No se pudo cargar el organigrama. Intenta de nuevo."
          action={{
            label: 'Reintentar',
            onClick: () => refetch(),
          }}
        />
      </Card>
    );
  }

  if (!data || (data.areas.length === 0 && data.cargos.length === 0)) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="Sin estructura organizacional"
          description="No hay areas ni cargos configurados. Crea la estructura desde las secciones de Areas y Cargos."
        />
      </Card>
    );
  }

  return (
    <div
      className={cn(
        'h-[calc(100vh-280px)] min-h-[600px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-950',
        !showToolbar && 'relative'
      )}
    >
      {/* Toolbar completo */}
      {showToolbar && (
        <OrganigramaToolbar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          direction={config.direction}
          onDirectionChange={handleDirectionChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onZoomIn={() => zoomIn({ duration: 200 })}
          onZoomOut={() => zoomOut({ duration: 200 })}
          onFitView={() => fitView({ padding: 0.2, duration: 300 })}
          onResetLayout={handleResetLayout}
          onExport={handleExport}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          stats={data?.stats}
          isLoading={isLoading}
          isExporting={isExporting}
          allowedModes={allowedModes}
        />
      )}

      {/* Canvas */}
      <div ref={canvasRef} className={showToolbar ? 'h-[calc(100%-60px)]' : 'h-full'}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          minZoom={config.minZoom}
          maxZoom={config.maxZoom}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
        >
          {/* Controles de zoom */}
          <Controls
            position="bottom-right"
            showZoom={false}
            showFitView={false}
            showInteractive={false}
          />

          {/* Minimapa */}
          <MiniMap
            position="bottom-left"
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700 rounded-lg"
          />

          {/* Grid de fondo */}
          {config.showGrid && (
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="#e5e7eb"
              className="dark:!bg-gray-950"
            />
          )}

          {/* Mini-toolbar flotante (cuando showToolbar=false) */}
          {!showToolbar && (
            <Panel position="top-right" className="!m-2">
              <div className="flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
                {/* Fit view */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fitView({ padding: 0.2, duration: 300 })}
                  className="!p-2 !min-h-0"
                  title="Ajustar vista"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>

                {/* Reset layout */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetLayout}
                  className="!p-2 !min-h-0"
                  title="Restablecer posiciones"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                {/* Separador */}
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5" />

                {/* Export dropdown */}
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    disabled={isExporting}
                    className="!p-2 !min-h-0"
                    title="Exportar"
                  >
                    <Download className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  {showExportMenu && (
                    <>
                      {/* Backdrop para cerrar */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExport('png')}
                          className="w-full !justify-start !min-h-0 text-sm"
                        >
                          Exportar PNG
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExport('pdf')}
                          className="w-full !justify-start !min-h-0 text-sm"
                        >
                          Exportar PDF
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Panel>
          )}

          {/* Panel de info (solo en toolbar completo) */}
          {showToolbar && (
            <Panel position="top-right" className="!m-0">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Arrastrar para mover - Scroll para zoom</span>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

// Componente principal con Provider
export const OrganigramaCanvas = (props: OrganigramaCanvasProps) => {
  return (
    <ReactFlowProvider>
      <OrganigramaCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default OrganigramaCanvas;
