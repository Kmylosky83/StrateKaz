/**
 * Hook para persistir posiciones de nodos del organigrama
 *
 * - GET: Carga posiciones guardadas por view_mode + direction
 * - POST: Bulk upsert con debounce (acumula cambios y envía cada 2s)
 * - DELETE: Reset a layout Dagre automático
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import axiosInstance from '@/api/axios-config';

export interface NodePosition {
  node_type: 'cargo' | 'area';
  node_id: number;
  view_mode: string;
  direction: string;
  x: number;
  y: number;
}

interface SavedPositionMap {
  [nodeId: string]: { x: number; y: number };
}

const POSITIONS_KEY = 'organigrama-positions';
const DEBOUNCE_MS = 2000;

/**
 * Convierte un nodeId de React Flow (e.g. "cargo-5") a node_type + node_id
 */
const parseNodeId = (nodeId: string): { node_type: 'cargo' | 'area'; node_id: number } | null => {
  // Formatos: "area-5", "cargo-12", "compact-area-3"
  const compactMatch = nodeId.match(/^compact-(area|cargo)-(\d+)$/);
  if (compactMatch) {
    return { node_type: compactMatch[1] as 'cargo' | 'area', node_id: parseInt(compactMatch[2]) };
  }

  const match = nodeId.match(/^(area|cargo)-(\d+)$/);
  if (match) {
    return { node_type: match[1] as 'cargo' | 'area', node_id: parseInt(match[2]) };
  }

  return null;
};

/**
 * Reconstruye el nodeId de React Flow desde la posición guardada + viewMode
 */
const buildReactFlowId = (pos: NodePosition, viewMode: string): string => {
  if (viewMode === 'compact') {
    return `compact-${pos.node_type}-${pos.node_id}`;
  }
  return `${pos.node_type}-${pos.node_id}`;
};

export const useOrganigramaPositions = (viewMode: string, direction: string) => {
  const queryClient = useQueryClient();
  const pendingRef = useRef<Map<string, NodePosition>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // GET: Cargar posiciones guardadas
  const { data: positions, isLoading } = useQuery({
    queryKey: [POSITIONS_KEY, viewMode, direction],
    queryFn: async (): Promise<SavedPositionMap> => {
      const response = await axiosInstance.get('/organizacion/organigrama/positions/', {
        params: { view_mode: viewMode, direction },
      });
      // Convertir array a map nodeId -> {x, y}
      const map: SavedPositionMap = {};
      for (const pos of response.data) {
        const rfId = buildReactFlowId(pos, viewMode);
        map[rfId] = { x: pos.x, y: pos.y };
      }
      return map;
    },
    staleTime: 60000,
  });

  // POST: Bulk upsert
  const saveMutation = useMutation({
    mutationFn: async (positionsToSave: NodePosition[]) => {
      await axiosInstance.post('/organizacion/organigrama/positions/', positionsToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_KEY, viewMode, direction] });
    },
  });

  // DELETE: Reset
  const resetMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete('/organizacion/organigrama/positions/', {
        params: { view_mode: viewMode, direction },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_KEY, viewMode, direction] });
    },
  });

  // Flush pendientes al backend
  const flushPending = useCallback(() => {
    if (pendingRef.current.size === 0) return;
    const batch = Array.from(pendingRef.current.values());
    pendingRef.current.clear();
    saveMutation.mutate(batch);
  }, [saveMutation]);

  // Acumular posición con debounce
  const saveNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      const parsed = parseNodeId(nodeId);
      if (!parsed) return;

      const key = `${parsed.node_type}-${parsed.node_id}`;
      pendingRef.current.set(key, {
        ...parsed,
        view_mode: viewMode,
        direction,
        x,
        y,
      });

      // Reset timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushPending, DEBOUNCE_MS);
    },
    [viewMode, direction, flushPending]
  );

  // Reset layout
  const resetPositions = useCallback(() => {
    // Cancel pending saves
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current.clear();
    resetMutation.mutate();
  }, [resetMutation]);

  return {
    /** Map de nodeId -> {x, y} con posiciones guardadas */
    savedPositions: positions ?? {},
    /** True mientras carga posiciones */
    isLoading,
    /** Guardar posición de un nodo (debounced) */
    saveNodePosition,
    /** Resetear todas las posiciones (volver a Dagre) */
    resetPositions,
    /** True si hay un save en progreso */
    isSaving: saveMutation.isPending,
  };
};
