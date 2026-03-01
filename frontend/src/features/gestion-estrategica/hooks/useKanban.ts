/**
 * React Query Hooks para el tablero Kanban de actividades de proyecto.
 * Sprint PLANNER-1: Kanban Board MVP
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/api/axios-config';
import type { KanbanData, KanbanReorderItem } from '../types/proyectos.types';

// ==================== QUERY KEYS ====================

export const kanbanKeys = {
  all: ['proyectos', 'kanban'] as const,
  byProject: (proyectoId: number | null) => ['proyectos', 'kanban', proyectoId] as const,
};

// ==================== HOOKS ====================

/**
 * Obtiene las actividades de un proyecto agrupadas por columna Kanban.
 */
export function useKanbanData(proyectoId: number | null) {
  return useQuery<KanbanData>({
    queryKey: kanbanKeys.byProject(proyectoId),
    queryFn: async () => {
      const { data } = await apiClient.get('/proyectos/actividades/kanban/', {
        params: { proyecto_id: proyectoId },
      });
      return data;
    },
    enabled: !!proyectoId,
  });
}

/**
 * Reordena actividades dentro del tablero Kanban (columna y posición).
 * Ejecuta actualización optimista para feedback inmediato.
 */
export function useReorderActividades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: KanbanReorderItem[]) => {
      const { data } = await apiClient.post('/proyectos/actividades/reorder/', {
        items,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all });
    },
    onError: () => {
      toast.error('Error al reordenar las actividades');
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all });
    },
  });
}
