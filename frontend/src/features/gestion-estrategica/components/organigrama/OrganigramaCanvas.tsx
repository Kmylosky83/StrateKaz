/**
 * OrganigramaCanvas - Canvas principal con React Flow
 *
 * Renderiza el organigrama interactivo con nodos personalizados
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios-config';
import { Card, EmptyState, Spinner } from '@/components/common';
import { Building2, Network } from 'lucide-react';
import { useEmpresaBasicInfo } from '../../hooks/useEmpresa';

import AreaNode from './AreaNode';
import CargoNode from './CargoNode';
import CompactNode from './CompactNode';
import OrganigramaToolbar from './OrganigramaToolbar';

import { generateLayout } from '../../utils/organigramaLayout';
import { exportOrganigrama, ExportError } from '../../utils/organigramaExport';
import type {
  OrganigramaResponse,
  ViewMode,
  OrganigramaFilters,
  CanvasConfig,
  ExportFormat,
} from '../../types/organigrama.types';
import { DEFAULT_FILTERS, DEFAULT_CANVAS_CONFIG, DEFAULT_EXPORT_OPTIONS } from '../../types/organigrama.types';

// Tipos de nodos personalizados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = {
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

      const response = await axiosInstance.get(
        `/organizacion/organigrama/?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 30000,
  });
};

// Componente interno del canvas
const OrganigramaCanvasInner = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Obtener nombre de la empresa para exportación
  const { nombreComercial: empresaNombre } = useEmpresaBasicInfo();

  // Estado
  const [viewMode, setViewMode] = useState<ViewMode>('cargos');
  const [filters, setFilters] = useState<OrganigramaFilters>(DEFAULT_FILTERS);
  const [config, setConfig] = useState<CanvasConfig>(DEFAULT_CANVAS_CONFIG);
  const [isExporting, setIsExporting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Datos
  const { data, isLoading, error, refetch } = useOrganigramaData(false, filters.soloActivos);

  // Filtrar datos según filtros
  const filteredData = useMemo(() => {
    if (!data) return { areas: [], cargos: [] };

    let { areas, cargos } = data;

    // Filtrar por término de búsqueda
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      areas = areas.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.code.toLowerCase().includes(term)
      );
      cargos = cargos.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term)
      );
    }

    // Filtrar cargos por nivel jerárquico
    if (filters.nivelJerarquico !== 'all' && viewMode === 'cargos') {
      cargos = cargos.filter((c) => c.nivel_jerarquico === filters.nivelJerarquico);
    }

    // Filtrar por área
    if (filters.areaId !== null) {
      cargos = cargos.filter((c) => c.area === filters.areaId);
    }

    return { areas, cargos };
  }, [data, filters, viewMode]);

  // Generar layout cuando cambian los datos o el modo
  useEffect(() => {
    if (!data) return;

    const { nodes: newNodes, edges: newEdges } = generateLayout(
      filteredData.areas,
      filteredData.cargos,
      viewMode,
      config
    );

    setNodes(newNodes);
    setEdges(newEdges);

    // Ajustar vista después de generar layout
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 100);
  }, [filteredData, viewMode, config, setNodes, setEdges, fitView]);

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
    setConfig(DEFAULT_CANVAS_CONFIG);
    setFilters(DEFAULT_FILTERS);
    refetch();
  }, [refetch]);

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

      // Mostrar toast de loading
      const loadingToast = toast.loading(
        `Exportando organigrama como ${format.toUpperCase()}...`,
        {
          duration: Infinity,
        }
      );

      try {
        await exportOrganigrama(
          exportElement,
          { ...DEFAULT_EXPORT_OPTIONS, format },
          data?.stats,
          'Organigrama',
          empresaNombre || undefined
        );

        // Éxito
        toast.success(
          `Organigrama exportado exitosamente como ${format.toUpperCase()}`,
          {
            id: loadingToast,
            duration: 3000,
          }
        );
      } catch (error) {
        console.error('Error al exportar:', error);

        // Determinar mensaje de error específico
        let errorMessage = 'No se pudo exportar el organigrama';

        if (error instanceof ExportError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Mostrar error
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
    // En una implementación más completa, esto actualizaría el estado de expansión de cada nodo
    fitView({ padding: 0.1, duration: 300 });
  }, [fitView]);

  const handleCollapseAll = useCallback(() => {
    fitView({ padding: 0.3, duration: 300 });
  }, [fitView]);

  // Estados de loading y error
  if (isLoading) {
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
          description="No hay áreas ni cargos configurados. Crea la estructura desde las secciones de Áreas y Cargos."
        />
      </Card>
    );
  }

  return (
    <div className="h-[calc(100vh-280px)] min-h-[600px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Toolbar */}
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
      />

      {/* Canvas */}
      <div ref={canvasRef} className="h-[calc(100%-60px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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

          {/* Panel de información */}
          <Panel position="top-right" className="!m-0">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Arrastrar para mover • Scroll para zoom</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Componente principal con Provider
export const OrganigramaCanvas = () => {
  return (
    <ReactFlowProvider>
      <OrganigramaCanvasInner />
    </ReactFlowProvider>
  );
};

export default OrganigramaCanvas;
